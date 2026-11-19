// What changed between two versions of a Markdown page, paragraph by
// paragraph: blocks (paragraphs, headings, lists, tables, code) are matched
// first, then a changed block shows the words that changed inside it.
import { diffArrays, diffLines, diffWordsWithSpace } from 'diff';

/** A changed block counts as "the same paragraph, edited" from this similarity up. */
const SAME_BLOCK = 0.5;
/** Longer blocks show only the lines around what changed. */
const LONG_BLOCK = 6;

/**
 * Splits Markdown into blocks: the front matter, each heading, each fenced
 * code block, and every run of lines between blank lines.
 * @param {string} text
 * @returns {string[]}
 */
export function splitBlocks(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let current = [];
  const flush = () => {
    if (current.length) blocks.push(current.join('\n'));
    current = [];
  };
  let i = 0;
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    if (end > 0) {
      blocks.push(lines.slice(0, end + 1).join('\n'));
      i = end + 1;
    }
  }
  let fence = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      current.push(line);
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) {
        fence = null;
        flush();
      }
      continue;
    }
    const open = line.match(/^\s*(`{3,}|~{3,})/);
    if (open) {
      flush();
      fence = open[1];
      current.push(line);
    } else if (line.trim() === '') {
      flush();
    } else if (/^#{1,6}\s/.test(line)) {
      flush();
      blocks.push(line);
    } else {
      current.push(line);
    }
  }
  flush();
  return blocks;
}

/** What kind of block it is, for the way it is shown. */
export function kindOf(block) {
  if (/^---\n/.test(block)) return 'frontmatter';
  if (/^#{1,6}\s/.test(block)) return 'heading';
  if (/^\s*(```|~~~)/.test(block)) return 'code';
  if (/^\s*\|/.test(block)) return 'table';
  if (/^\s*([-*+]|\d+[.)])\s/.test(block)) return 'list';
  if (/^\s*>/.test(block)) return 'quote';
  return 'paragraph';
}

/** How much two blocks have in common, from 0 to 1. */
export function similarity(a, b) {
  if (a === b) return 1;
  const total = a.length + b.length;
  if (total === 0) return 1;
  let same = 0;
  for (const part of diffWordsWithSpace(a, b)) if (!part.added && !part.removed) same += part.value.length;
  return (2 * same) / total;
}

// Removed and added blocks next to each other: an edited paragraph where a
// removed block looks like one of the next added ones, else a removal.
function pair(removed, added) {
  const ops = [];
  let next = 0;
  for (const block of removed) {
    let match = -1;
    for (let k = next; k < added.length && k < next + 3; k++) {
      if (similarity(block, added[k]) >= SAME_BLOCK) {
        match = k;
        break;
      }
    }
    if (match === -1) {
      ops.push({ type: 'removed', before: block });
      continue;
    }
    for (; next < match; next++) ops.push({ type: 'added', after: added[next] });
    ops.push({ type: 'changed', before: block, after: added[match] });
    next = match + 1;
  }
  for (; next < added.length; next++) ops.push({ type: 'added', after: added[next] });
  return ops;
}

function headingOf(block) {
  const match = block.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
  return match ? { depth: match[1].length, text: match[2] } : null;
}

/**
 * Compares two versions of a page.
 * @param {string} before The older text ('' for a new page).
 * @param {string} after The newer text.
 * @param {{ context?: number }} [options] Unchanged blocks shown around a change.
 */
export function diffPages(before, after, { context = 1 } = {}) {
  const parts = diffArrays(splitBlocks(before), splitBlocks(after));
  /** @type {{ type: 'same' | 'added' | 'removed' | 'changed', before?: string, after?: string }[]} */
  const ops = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.added && !part.removed) {
      for (const block of part.value) ops.push({ type: 'same', before: block, after: block });
      continue;
    }
    const nextPart = parts[i + 1];
    if (nextPart && (nextPart.added || nextPart.removed) && nextPart.added !== part.added) {
      const removed = part.removed ? part.value : nextPart.value;
      const added = part.added ? part.value : nextPart.value;
      ops.push(...pair(removed, added));
      i++;
    } else if (part.removed) {
      for (const block of part.value) ops.push({ type: 'removed', before: block });
    } else {
      for (const block of part.value) ops.push({ type: 'added', after: block });
    }
  }

  const stats = { added: 0, removed: 0, changed: 0 };
  for (const op of ops) if (op.type !== 'same') stats[op.type]++;

  // The section each block sits in, from the headings above it.
  const sections = [];
  let trail = [];
  for (const op of ops) {
    sections.push(trail.map((heading) => heading.text));
    const heading = op.type !== 'removed' && headingOf(op.after);
    if (heading) trail = [...trail.filter((item) => item.depth < heading.depth), heading];
  }

  // Changes with a little context, and how many unchanged blocks are hidden.
  const shown = ops.map(() => false);
  ops.forEach((op, index) => {
    if (op.type === 'same') return;
    for (let k = Math.max(0, index - context); k <= Math.min(ops.length - 1, index + context); k++) shown[k] = true;
  });
  const hunks = [];
  let hidden = 0;
  ops.forEach((op, index) => {
    if (!shown[index]) {
      hidden++;
      return;
    }
    const last = hunks.at(-1);
    if (last && hidden === 0 && index > 0 && shown[index - 1]) last.ops.push(op);
    else hunks.push({ hiddenBefore: hidden, section: [], ops: [op], first: index });
    hidden = 0;
  });
  // A hunk is labelled with the section of its first change, less the
  // headings it shows itself.
  for (const hunk of hunks) {
    const firstChange = hunk.first + hunk.ops.findIndex((op) => op.type !== 'same');
    const shownHeadings = new Set(hunk.ops.map((op) => headingOf(op.after ?? op.before)?.text).filter(Boolean));
    hunk.section = sections[firstChange].filter((text) => !shownHeadings.has(text));
    delete hunk.first;
  }
  return { hunks, hiddenAfter: hidden, stats, changed: stats.added + stats.removed + stats.changed > 0 };
}

const escape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A heading shows as a heading: the text without its "##".
function display(block, kind) {
  return kind === 'heading' ? block.replace(/^#{1,6}\s+/, '') : block;
}

// Two words or less, kept between changes, would cut a rewritten sentence
// into confetti ("a company[person], card[so] it"): they join the change.
const SHORT_RUN = /^\s*(\S+(\s+\S+)?)?\s*$/;

/** The words of a changed text, with nearby changes read as one. */
export function wordChanges(before, after) {
  const parts = diffWordsWithSpace(before, after);
  const runs = [];
  let change = null;
  const flush = () => {
    if (change) runs.push(change);
    change = null;
  };
  parts.forEach((part, index) => {
    if (part.added || part.removed) {
      change ??= { removed: '', added: '' };
      change[part.added ? 'added' : 'removed'] += part.value;
      return;
    }
    const between = change && parts.slice(index + 1).some((next) => next.added || next.removed);
    const nextIsChange = parts[index + 1]?.added || parts[index + 1]?.removed;
    if (between && nextIsChange && SHORT_RUN.test(part.value)) {
      change.removed += part.value;
      change.added += part.value;
      return;
    }
    flush();
    runs.push({ same: part.value });
  });
  flush();
  return runs;
}

function words(before, after) {
  return wordChanges(before, after)
    .map((run) =>
      run.same !== undefined
        ? escape(run.same)
        : `${run.removed ? `<del>${escape(run.removed)}</del>` : ''}${run.added ? `<ins>${escape(run.added)}</ins>` : ''}`,
    )
    .join('');
}

const lines = (text) => text.replace(/\n$/, '').split('\n');
const GAP = '<span class="ph-gap">⋯</span>';

// A long block that changed: its changed lines, each with the words that
// changed, and one line around them. The rest is a "⋯" line.
function changedLines(before, after) {
  const rows = [];
  const parts = diffLines(before, after);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.added && !part.removed) {
      for (const line of lines(part.value)) rows.push({ html: escape(line), changed: false });
      continue;
    }
    const next = parts[i + 1];
    const removed = part.removed ? lines(part.value) : [];
    const added = part.added ? lines(part.value) : [];
    if (part.removed && next?.added) {
      added.push(...lines(next.value));
      i++;
    }
    // A line that looks like a removed one is that line, edited.
    for (const op of pair(removed, added)) {
      const html =
        op.type === 'changed' ? words(op.before, op.after) : op.type === 'added' ? `<ins>${escape(op.after)}</ins>` : `<del>${escape(op.before)}</del>`;
      rows.push({ html, changed: true });
    }
  }
  const keep = rows.map((row, index) => row.changed || rows[index - 1]?.changed || rows[index + 1]?.changed);
  const out = [];
  rows.forEach((row, index) => {
    if (keep[index]) out.push(row.html);
    else if (keep[index - 1] || index === 0) out.push(GAP);
  });
  return out.join('\n');
}

// A long unchanged block next to a change: only its lines next to the change.
function contextLines(text, { above, below }) {
  const all = lines(text);
  if (all.length <= LONG_BLOCK) return escape(text);
  const head = all.slice(0, 2).map(escape);
  const tail = all.slice(-2).map(escape);
  if (above && below) return [...head, GAP, ...tail].join('\n');
  return (above ? [GAP, ...tail] : [...head, GAP]).join('\n');
}

function blockHtml(op, place = {}) {
  const kind = kindOf(op.after ?? op.before);
  const level = kind === 'heading' ? ` ph-h${headingOf(op.after ?? op.before).depth}` : '';
  const before = op.before !== undefined ? display(op.before, kind) : undefined;
  const after = op.after !== undefined ? display(op.after, kind) : undefined;
  const long = (text) => text !== undefined && lines(text).length > LONG_BLOCK;
  const body =
    op.type === 'changed'
      ? long(before) || long(after)
        ? changedLines(before, after)
        : words(before, after)
      : op.type === 'added'
        ? `<ins>${escape(after)}</ins>`
        : op.type === 'removed'
          ? `<del>${escape(before)}</del>`
          : contextLines(after, place);
  return `<div class="ph-block ph-${op.type} ph-${kind}${level}">${body}</div>`;
}

/**
 * The diff as HTML, ready for `set:html`.
 * @param {ReturnType<typeof diffPages>} diff
 * @param {{ hidden: (count: number) => string, noChange: string }} labels
 */
export function renderDiff(diff, labels) {
  if (!diff.changed) return `<p class="ph-none">${escape(labels.noChange)}</p>`;
  const skip = (count) => (count ? `<div class="ph-skip">${escape(labels.hidden(count))}</div>` : '');
  const html = diff.hunks.map((hunk) => {
    const section = hunk.section.length ? `<div class="ph-section">${hunk.section.map(escape).join(' › ')}</div>` : '';
    return `${skip(hunk.hiddenBefore)}<div class="ph-hunk">${section}${hunk.ops
      .map((op, index) => {
        // An unchanged block above a change shows its last lines, one below shows its first.
        const changed = (other) => other.type !== 'same';
        const place = { above: hunk.ops.slice(index + 1).some(changed), below: hunk.ops.slice(0, index).some(changed) };
        return blockHtml(op, place);
      })
      .join('')}</div>`;
  });
  return `<div class="ph-diff">${html.join('')}${skip(diff.hiddenAfter)}</div>`;
}
