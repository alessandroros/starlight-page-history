import { describe, expect, it } from 'vitest';
import { diffBlocks, splitBlocks } from '../src/diff.js';
import { DOT, dotSizes, lastSeen, nextVisit, paramsFromRange, presetRange, rangeFromParams } from '../src/timeline-model.js';
import { counted, resultHtml } from '../src/timeline-view.js';

describe('dotSizes', () => {
  it('scales the later versions and caps one big rewrite', () => {
    const sizes = dotSizes([500, 1, 2, 2, 3, 2, 1, 2, 3, 2, 400]);
    expect(sizes[0]).toBe(DOT.max);
    expect(sizes.at(-1)).toBe(DOT.max);
    expect(sizes[1]).toBeLessThan(sizes[4]);
    expect(sizes[4]).toBe(DOT.max);
  });

  it('gives a version with no change the smallest dot', () => {
    expect(dotSizes([10, 0, 4])[1]).toBe(DOT.min);
  });
});

describe('nextVisit and lastSeen', () => {
  it('remembers the first visit without anything new', () => {
    const state = nextVisit(null, 'b');
    expect(state).toEqual({ seen: 'b', before: null, pending: false });
    expect(lastSeen(state, 'b')).toBeNull();
  });

  it('keeps what the reader saw before a change until the page changes again', () => {
    const changed = nextVisit({ seen: 'a', before: null, pending: false }, 'b');
    expect(changed).toEqual({ seen: 'b', before: 'a', pending: true });
    expect(lastSeen(changed, 'b')).toBe('a');
    const again = nextVisit({ ...changed, pending: false }, 'b');
    expect(again).toEqual({ seen: 'b', before: 'a', pending: false });
    expect(nextVisit(again, 'c')).toEqual({ seen: 'c', before: 'b', pending: true });
  });

  it('uses the version seen when the history page is opened before the page', () => {
    expect(lastSeen({ seen: 'a', before: null }, 'b')).toBe('a');
  });
});

describe('presetRange', () => {
  const now = Date.parse('2026-11-23T12:00:00Z');
  const dates = ['2026-10-01T10:00:00Z', '2026-11-01T10:00:00Z', '2026-11-20T10:00:00Z', '2026-11-22T10:00:00Z'];

  it('covers the versions after the last visit', () => {
    expect(presetRange('visit', { dates, seenIndex: 1, now })).toEqual({ start: 2, end: 3 });
    expect(presetRange('visit', { dates, seenIndex: 3, now })).toBeNull();
    expect(presetRange('visit', { dates, seenIndex: -1, now })).toBeNull();
  });

  it('covers the latest change, the last days and everything', () => {
    expect(presetRange('latest', { dates, seenIndex: -1, now })).toEqual({ start: 3, end: 3 });
    expect(presetRange('week', { dates, seenIndex: -1, now })).toEqual({ start: 2, end: 3 });
    expect(presetRange('month', { dates, seenIndex: -1, now })).toEqual({ start: 1, end: 3 });
    expect(presetRange('all', { dates, seenIndex: -1, now })).toEqual({ start: 0, end: 3 });
    expect(presetRange('week', { dates: dates.slice(0, 2), seenIndex: -1, now })).toBeNull();
  });
});

describe('addresses', () => {
  const shas = ['aaaaaaa1', 'bbbbbbb2', 'ccccccc3', 'ddddddd4'];

  it('reads the from and to of earlier releases', () => {
    expect(rangeFromParams(shas, 'bbbbbbb', 'ddddddd')).toEqual({ start: 2, end: 3 });
    expect(rangeFromParams(shas, 'ddddddd', 'bbbbbbb')).toEqual({ start: 2, end: 3 });
    expect(rangeFromParams(shas, 'start', 'bbbbbbb')).toEqual({ start: 0, end: 1 });
    expect(rangeFromParams(shas, 'bbbbbbb', 'bbbbbbb')).toBeNull();
    expect(rangeFromParams(shas, 'eeeeeee', 'bbbbbbb')).toBeNull();
  });

  it('writes an address that reads back the same', () => {
    for (const range of [
      { start: 0, end: 2 },
      { start: 2, end: 3 },
      { start: 3, end: 3 },
    ]) {
      const { from, to } = paramsFromRange(shas, range);
      expect(rangeFromParams(shas, from, to)).toEqual(range);
    }
  });
});

describe('resultHtml', () => {
  const labels = {
    hidden: { one: '{count} unchanged paragraph', other: '{count} unchanged paragraphs' },
    added: { one: '{count} added', other: '{count} added' },
    changed: { one: '{count} changed', other: '{count} changed' },
    removed: { one: '{count} removed', other: '{count} removed' },
    changesBy: { one: '{count} change by {authors}', other: '{count} changes by {authors}' },
    more: { one: 'and {count} more', other: 'and {count} more' },
    noChange: 'The text did not change.',
    created: 'First version of the page.',
    firstVersion: 'The first version of the page',
    sinceFirst: 'What changed since the first version',
    changedOn: 'What changed on {date}',
    changedBetween: 'What changed from {from} to {to}',
  };
  const versions = [
    { sha: 'a'.repeat(40), date: '2026-11-01T10:00:00Z', author: 'Ada', subject: 'Start' },
    { sha: 'b'.repeat(40), date: '2026-11-18T10:00:00Z', author: 'Bo', subject: 'Add <rules>' },
    { sha: 'c'.repeat(40), date: '2026-11-19T10:00:00Z', author: 'Ada', subject: 'Fix' },
  ];
  const diff = diffBlocks(splitBlocks('# A\n\nOne.\n'), splitBlocks('# A\n\nOne and two.\n'));

  it('names the period, the authors and the commits', () => {
    const html = resultHtml({ versions, range: { start: 1, end: 2 }, diff, labels, lang: 'en', commitUrl: 'https://example.com/c/{sha}' });
    expect(html).toContain('What changed from November 18, 2026 to November 19, 2026');
    expect(html).toContain('2 changes by Bo, Ada');
    expect(html).toContain('Add &lt;rules&gt;');
    expect(html).toContain(`href="https://example.com/c/${'c'.repeat(40)}"`);
    expect(html).toContain('<ins>');
  });

  it('says when a single version is the first one', () => {
    const html = resultHtml({ versions, range: { start: 0, end: 0 }, diff: null, labels, lang: 'en', commitUrl: false });
    expect(html).toContain('The first version of the page');
    expect(html).toContain('First version of the page.');
  });

  it('does not call a hidden-history start the first version', () => {
    const html = resultHtml({ versions, range: { start: 0, end: 0 }, diff, labels, lang: 'en', commitUrl: false, root: false });
    expect(html).toContain('What changed on November 1, 2026');
  });

  it('picks the plural form for the language', () => {
    expect(counted(labels.changesBy, 1, 'en', { authors: 'Ada' })).toBe('1 change by Ada');
    expect(counted(labels.changesBy, 3, 'en', { authors: 'Ada' })).toBe('3 changes by Ada');
  });
});
