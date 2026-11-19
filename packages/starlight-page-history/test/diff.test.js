import { describe, expect, it } from 'vitest';
import { diffBlocks, diffPages, kindOf, packVersions, renderDiff, splitBlocks, wordChanges } from '../src/diff.js';

const labels = { hidden: (count) => `${count} hidden`, noChange: 'No change' };

describe('splitBlocks', () => {
  it('splits front matter, headings, fenced code and paragraphs', () => {
    const text = ['---', 'title: A', '---', '# Intro', 'One', 'two.', '', '```js', 'a', '', 'b', '```', 'After code.', '', '', '| a | b |', '|---|---|'].join('\n');
    expect(splitBlocks(text)).toEqual(['---\ntitle: A\n---', '# Intro', 'One\ntwo.', '```js\na\n\nb\n```', 'After code.', '| a | b |\n|---|---|']);
  });

  it('keeps a code block with a longer fence open until the same fence', () => {
    expect(splitBlocks('````md\n```\ninside\n```\n````\nout')).toEqual(['````md\n```\ninside\n```\n````', 'out']);
  });

  it('tells block kinds apart', () => {
    expect(['---\nx\n---', '## H', '```\nx\n```', '| a |', '- item', '1. item', '> quote', 'Text'].map(kindOf)).toEqual([
      'frontmatter',
      'heading',
      'code',
      'table',
      'list',
      'list',
      'quote',
      'paragraph',
    ]);
  });
});

describe('diffPages', () => {
  const before = '# Guide\n\nIntro.\n\n## Users\n\nUsers have a login.\n\nSame one.\n\nSame two.\n\nSame three.\n\nOld note.';
  const after = '# Guide\n\nIntro.\n\n## Users\n\nUsers have a Keycloak login.\n\nA new paragraph.\n\nSame one.\n\nSame two.\n\nSame three.';

  it('matches edited paragraphs, additions and removals, with context and sections', () => {
    const diff = diffPages(before, after);
    expect(diff.stats).toEqual({ added: 1, removed: 1, changed: 1 });
    expect(diff.hunks).toHaveLength(2);
    expect(diff.hunks[0]).toMatchObject({ hiddenBefore: 2, section: ['Guide'] });
    expect(diff.hunks[0].ops.map((op) => op.type)).toEqual(['same', 'changed', 'added', 'same']);
    expect(diff.hunks[1]).toMatchObject({ hiddenBefore: 1, section: ['Guide', 'Users'] });
    expect(diff.hunks[1].ops.map((op) => op.type)).toEqual(['same', 'removed']);
    expect(diff.hiddenAfter).toBe(0);
  });

  it('says when nothing changed', () => {
    const diff = diffPages(before, before);
    expect(diff.changed).toBe(false);
    expect(renderDiff(diff, labels)).toBe('<p class="ph-none">No change</p>');
  });

  it('does not pair blocks that have little in common', () => {
    const diff = diffPages('Apples are red.', 'Completely different words here.');
    expect(diff.hunks[0].ops.map((op) => op.type)).toEqual(['removed', 'added']);
  });
});

describe('wordChanges', () => {
  it('reads nearby changes as one rewrite', () => {
    expect(wordChanges('On a company card so it stays empty. Bye.', 'On an institutional account no role names a person. Bye.')).toEqual([
      { same: 'On ' },
      { removed: 'a company card so it stays empty', added: 'an institutional account no role names a person' },
      { same: '. Bye.' },
    ]);
  });

  it('keeps longer unchanged runs between changes', () => {
    const runs = wordChanges('one two three four five six', 'ONE two three four five SIX');
    expect(runs).toEqual([{ removed: 'one', added: 'ONE' }, { same: ' two three four five ' }, { removed: 'six', added: 'SIX' }]);
  });
});

describe('renderDiff', () => {
  it('escapes HTML and marks words', () => {
    const html = renderDiff(diffPages('Use <b> & co.', 'Use <i> & co.'), labels);
    expect(html).toContain('Use &lt;<del>b</del><ins>i</ins>&gt; &amp; co.');
    expect(html).not.toContain('<b>');
  });

  it('shows a heading without its hashes, and hidden blocks as a count', () => {
    const html = renderDiff(diffPages('## Title\n\na\n\nb\n\nc', '## Title\n\na\n\nb\n\nC'), labels);
    expect(html).toContain('<div class="ph-skip">2 hidden</div>');
    expect(renderDiff(diffPages('## Old title', '## New title'), labels)).toContain(
      '<div class="ph-block ph-changed ph-heading ph-h2"><del>Old</del><ins>New</ins> title</div>',
    );
  });

  it('shows only the changed lines of a long block, and pairs edited lines', () => {
    const rows = Array.from({ length: 20 }, (_, i) => `| row ${i} | value |`);
    const changed = rows.map((row, i) => (i === 10 ? '| row 10 | new value |' : row));
    changed.splice(15, 0, '| row 14b | added |');
    const html = renderDiff(diffPages(rows.join('\n'), changed.join('\n')), labels);
    expect(html).toContain('| row 10 | <ins>new </ins>value |');
    expect(html).toContain('<ins>| row 14b | added |</ins>');
    expect(html).not.toContain('row 3 ');
    expect(html.match(/ph-gap/g)).toHaveLength(3);
  });

  it('trims a long unchanged block next to a change to its nearest lines', () => {
    const list = Array.from({ length: 10 }, (_, i) => `- item ${i}`).join('\n');
    const html = renderDiff(diffPages(`${list}\n\nOld.`, `${list}\n\nNew.`), labels);
    expect(html).toContain('<span class="ph-gap">⋯</span>\n- item 8\n- item 9');
    expect(html).not.toContain('item 0');
  });
});

describe('comparing any two versions', () => {
  const versions = [
    { sha: 'c3', author: 'Ada', date: '2026-01-03', subject: 'reject', text: '# RFC\n\n- Status: Rejected\n\nShared paragraph.\n\nRejected note.' },
    { sha: 'b2', author: 'Ada', date: '2026-01-02', subject: 'questions', text: '# RFC\n\n- Status: Draft\n\nShared paragraph.\n\nQuestions.' },
    { sha: 'a1', author: 'Ada', date: '2026-01-01', subject: 'first', text: '# RFC\n\n- Status: Draft\n\nShared paragraph.' },
  ];

  it('stores each block once and keeps every version', () => {
    const { blocks, versions: packed } = packVersions(versions);
    expect(blocks.filter((block) => block === 'Shared paragraph.')).toHaveLength(1);
    expect(blocks).toHaveLength(6);
    expect(packed.map((version) => version.sha)).toEqual(['c3', 'b2', 'a1']);
    expect(packed[2]).toEqual({ sha: 'a1', author: 'Ada', date: '2026-01-01', subject: 'first', blocks: [0, 4, 2] });
  });

  it('diffs unpacked blocks like the texts they come from', () => {
    const { blocks, versions: packed } = packVersions(versions);
    const unpack = (version) => version.blocks.map((id) => blocks[id]);
    expect(diffBlocks(unpack(packed[2]), unpack(packed[0]))).toEqual(diffPages(versions[2].text, versions[0].text));
    expect(renderDiff(diffBlocks(unpack(packed[2]), unpack(packed[0])), labels)).toContain('- Status: <del>Draft</del><ins>Rejected</ins>');
  });
});
