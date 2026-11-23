// The part of the history page under the timeline: a title for what is shown,
// who changed it, the commits, and the diff. Rendered at build time for the
// latest change and in the browser for any other choice, with the same code.
import { renderDiff } from './diff.js';

const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Replaces `{name}` in a label. */
export function fill(text, values) {
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
}

/** A plural label ({ one, other }) for a number, with {count} filled in. */
export function counted(forms, n, lang, values = {}) {
  const form = new Intl.PluralRules(lang).select(n) === 'one' ? forms.one : forms.other;
  return fill(form, { count: n, ...values });
}

export const formatDate = (iso, lang) => new Date(iso).toLocaleDateString(lang, { dateStyle: 'long' });
export const formatDay = (iso, lang) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short' });
export const formatMoment = (iso, lang) => new Date(iso).toLocaleString(lang, { dateStyle: 'long', timeStyle: 'short' });
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

/** "+2 ~3 −1", each with its meaning as a tooltip. */
export function statsHtml(stats, labels, lang) {
  const parts = [
    ['added', '+'],
    ['changed', '~'],
    ['removed', '−'],
  ]
    .filter(([key]) => stats[key] > 0)
    .map(([key, sign]) => `<span class="ph-stat-${key}" title="${escape(counted(labels[key], stats[key], lang))}">${sign}${stats[key]}</span>`);
  return parts.length ? `<span class="ph-stats">${parts.join('')}</span>` : '';
}

/**
 * @param {object} options
 * @param {{ sha: string, date: string, author: string, subject: string }[]} options.versions Oldest first.
 * @param {{ start: number, end: number }} options.range
 * @param {ReturnType<import('./diff.js').diffBlocks> | null} options.diff Null for the first version alone.
 * @param {Record<string, any>} options.labels
 * @param {string} options.lang
 * @param {string | false} options.commitUrl A URL with {sha} in it, or false.
 * @param {boolean} [options.root] Whether versions[0] is the first version of the page (false when `limit` hides older ones).
 */
export function resultHtml({ versions, range, diff, labels, lang, commitUrl, root = true }) {
  const chosen = versions.slice(range.start, range.end + 1);
  const first = chosen[0];
  const last = chosen.at(-1);
  const title =
    root && range.start === 0 && range.end === 0
      ? labels.firstVersion
      : root && range.start === 0
        ? labels.sinceFirst
        : sameDay(first.date, last.date)
          ? fill(labels.changedOn, { date: formatDate(last.date, lang) })
          : fill(labels.changedBetween, { from: formatDate(first.date, lang), to: formatDate(last.date, lang) });
  const authors = [...new Set(chosen.map((version) => version.author))].join(', ');
  const by = counted(labels.changesBy, chosen.length, lang, { authors });

  const commit = (version) => {
    const short = escape(version.sha.slice(0, 7));
    const sha = commitUrl ? `<a href="${escape(commitUrl.replaceAll('{sha}', version.sha))}"><code>${short}</code></a>` : `<code>${short}</code>`;
    return `<li><time datetime="${escape(version.date)}" title="${escape(formatMoment(version.date, lang))}">${escape(formatDay(version.date, lang))}</time> <span>${escape(version.subject)}</span> ${sha}</li>`;
  };
  const newest = [...chosen].reverse();
  const shown = newest.slice(0, 5).map(commit).join('');
  const rest = newest.slice(5);
  const more = rest.length
    ? `<li class="ph-more"><details><summary>${escape(counted(labels.more, rest.length, lang))}</summary><ul class="ph-commits">${rest.map(commit).join('')}</ul></details></li>`
    : '';

  const body = diff
    ? renderDiff(diff, { hidden: (n) => counted(labels.hidden, n, lang), noChange: labels.noChange })
    : `<p class="ph-none">${escape(labels.created)}</p>`;
  return (
    `<h2 class="ph-result-title">${escape(title)}</h2>` +
    `<p class="ph-meta"><span>${escape(by)}</span>${diff ? statsHtml(diff.stats, labels, lang) : ''}</p>` +
    `<ul class="ph-commits">${shown}${more}</ul>` +
    `<div class="ph-result-diff">${body}</div>`
  );
}
