// The logic of the timeline that does not touch the page: dot sizes, the
// reader's last visit, and which versions a choice covers. Used at build
// time and in the browser.

/** Smallest and largest dot, in pixels. */
export const DOT = { min: 6, max: 16 };

/**
 * A dot size for each version, oldest first, from how many blocks it changed.
 * The first version adds the whole page and one big rewrite would shrink every
 * other dot, so the scale stops at the 90th percentile of the later versions.
 * @param {number[]} sizes Changed blocks per version, oldest first.
 */
export function dotSizes(sizes) {
  const later = sizes.slice(1).sort((a, b) => a - b);
  const top = Math.max(1, later[Math.floor((later.length - 1) * 0.9)] ?? 1);
  return sizes.map((size) => DOT.min + Math.round((DOT.max - DOT.min) * Math.sqrt(Math.min(1, size / top))));
}

/**
 * What to remember when a reader opens a page whose newest version is `latest`.
 * `seen` is that version; `before` is the one they had seen until then, kept
 * until the page changes again, so the history page can show what is new.
 * `pending` stays true until they look at those changes on the history page.
 * @param {{ seen: string, before?: string | null, pending?: boolean } | null} state
 * @param {string} latest
 * @returns {{ seen: string, before: string | null, pending: boolean }}
 */
export function nextVisit(state, latest) {
  if (!state?.seen) return { seen: latest, before: null, pending: false };
  if (state.seen === latest) return { seen: latest, before: state.before ?? null, pending: Boolean(state.pending && state.before) };
  return { seen: latest, before: state.seen, pending: true };
}

/**
 * The last version the reader saw before the newest changes, if any.
 * @param {{ seen: string, before?: string | null } | null} state
 * @param {string} latest
 */
export function lastSeen(state, latest) {
  if (!state?.seen) return null;
  return state.seen === latest ? (state.before ?? null) : state.seen;
}

/**
 * The versions to show, as chronological indices (oldest = 0), inclusive:
 * the changes of versions start..end, from the version before start to end.
 * @param {'visit' | 'latest' | 'week' | 'month' | 'all'} preset
 * @param {{ dates: string[], seenIndex: number, now: number }} context
 *   dates oldest first; seenIndex is -1 when the reader has no last visit.
 * @returns {{ start: number, end: number } | null}
 */
export function presetRange(preset, { dates, seenIndex, now }) {
  const last = dates.length - 1;
  if (last < 0) return null;
  const since = (days) => {
    const first = dates.findIndex((date) => now - new Date(date).getTime() <= days * 86400000);
    return first === -1 ? null : { start: first, end: last };
  };
  switch (preset) {
    case 'visit':
      return seenIndex >= 0 && seenIndex < last ? { start: seenIndex + 1, end: last } : null;
    case 'latest':
      return { start: last, end: last };
    case 'week':
      return since(7);
    case 'month':
      return since(30);
    case 'all':
      return { start: 0, end: last };
    default:
      return null;
  }
}

/**
 * The range a `?from=<sha>&to=<sha>` address asks for. `from` is the version
 * the changes start from, as in the links of earlier releases, or "start".
 * @param {string[]} shas Oldest first.
 */
export function rangeFromParams(shas, from, to) {
  const find = (sha) => (sha ? shas.findIndex((full) => full.startsWith(sha) || sha.startsWith(full)) : -1);
  const end = find(to);
  if (end === -1) return null;
  if (from === 'start') return { start: 0, end };
  const base = find(from);
  if (base === -1 || base === end) return null;
  return base < end ? { start: base + 1, end } : { start: end + 1, end: base };
}

/** The `from` and `to` of an address for a range. */
export function paramsFromRange(shas, { start, end }) {
  return { from: start === 0 ? 'start' : shas[start - 1].slice(0, 7), to: shas[end].slice(0, 7) };
}
