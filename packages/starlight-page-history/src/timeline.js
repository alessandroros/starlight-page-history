// The timeline of a history page: pick a version or a period, by clicking or
// dragging on the dots or with a preset, and see everything that changed in
// it. Loads every version of the page (versions.json) the first time a choice
// needs it, and diffs in the browser with the same code as the build.
import { diffBlocks } from './diff.js';
import { lastSeen, paramsFromRange, presetRange, rangeFromParams } from './timeline-model.js';
import { formatMoment, resultHtml, statsHtml } from './timeline-view.js';
import { readVisit, writeVisit } from './visit-store.js';

for (const root of document.querySelectorAll('.ph-history')) setup(root);

function setup(root) {
  const data = JSON.parse(root.querySelector('.ph-data').textContent);
  const { versions, labels, lang } = data;
  const shas = versions.map((version) => version.sha);
  const last = versions.length - 1;
  const track = root.querySelector('.ph-track');
  const tip = root.querySelector('.ph-tip');
  const result = root.querySelector('.ph-result');
  const dots = [...track.querySelectorAll('.ph-dot')];
  const presetButtons = [...root.querySelectorAll('[data-preset]')];

  // The reader's last visit, as recorded by the page itself.
  const visit = readVisit(data.key);
  const seenSha = lastSeen(visit, shas[last]);
  const seenIndex = seenSha ? shas.findIndex((sha) => sha.startsWith(seenSha)) : -1;
  const context = { dates: versions.map((version) => version.date), seenIndex, now: Date.now() };
  if (seenIndex >= 0) {
    dots.forEach((dot, index) => dot.classList.toggle('ph-seen', index <= seenIndex));
    if (seenIndex < last) {
      const mark = document.createElement('div');
      mark.className = 'ph-visit';
      mark.title = labels.lastVisit;
      mark.innerHTML = `<span></span>`;
      mark.firstChild.textContent = labels.lastVisit;
      dots[seenIndex + 1].before(mark);
    }
  } else if (visit) {
    dots.forEach((dot) => dot.classList.add('ph-seen'));
  }
  for (const button of presetButtons) {
    const id = button.dataset.preset;
    const range = presetRange(id, context);
    button.disabled = !range;
    if (!range) button.title = id === 'visit' ? (visit ? labels.empty.visitNothingNew : labels.empty.visit) : (labels.empty[id] ?? '');
    else button.removeAttribute('title');
  }

  let selection = { start: last, end: last };
  let packed;
  let request = 0;

  async function load() {
    if (!packed) {
      const response = await fetch(data.src);
      if (!response.ok) throw new Error(`${response.status}`);
      const json = await response.json();
      const texts = new Map(json.versions.map((version) => [version.sha, version.blocks.map((id) => json.blocks[id])]));
      packed = (sha) => texts.get(sha);
    }
    return packed;
  }

  function mark() {
    dots.forEach((dot, index) => {
      const inside = index >= selection.start && index <= selection.end;
      dot.classList.toggle('ph-in', inside);
      dot.classList.toggle('ph-sel-start', index === selection.start);
      dot.classList.toggle('ph-sel-end', index === selection.end);
      dot.setAttribute('aria-pressed', String(inside));
    });
    // Day and last-visit marks inside the period are part of the band too.
    for (const markEl of track.querySelectorAll('.ph-day, .ph-visit')) {
      const after = markEl.nextElementSibling?.closest('.ph-dot') ?? markEl.nextElementSibling?.nextElementSibling;
      const index = after ? Number(after.dataset.i) : -1;
      markEl.classList.toggle('ph-in', index > selection.start && index <= selection.end);
    }
    let found = false;
    for (const button of presetButtons) {
      const range = presetRange(button.dataset.preset, context);
      const active = !found && range && range.start === selection.start && range.end === selection.end;
      if (active) found = true;
      button.classList.toggle('ph-active', Boolean(active));
    }
  }

  async function show(range, { remember = true, scroll = true } = {}) {
    selection = { start: Math.min(range.start, range.end), end: Math.max(range.start, range.end) };
    mark();
    if (scroll) reveal(dots[selection.end]);
    if (remember) {
      const url = new URL(location.href);
      const { from, to } = paramsFromRange(shas, selection);
      url.searchParams.set('from', from);
      url.searchParams.set('to', to);
      history.replaceState(null, '', url);
    }
    if (selection.start === seenIndex + 1 && selection.end === last && visit?.pending) writeVisit(data.key, { ...visit, pending: false });

    const mine = ++request;
    const baseSha = selection.start > 0 ? shas[selection.start - 1] : data.base;
    let diff = null;
    if (baseSha) {
      result.setAttribute('aria-busy', 'true');
      try {
        const text = await load();
        if (mine !== request) return;
        diff = diffBlocks(text(baseSha), text(shas[selection.end]));
      } catch (error) {
        if (mine !== request) return;
        console.error('starlight-page-history: could not load the versions', error);
        result.removeAttribute('aria-busy');
        result.innerHTML = `<p class="ph-none"></p>`;
        result.firstChild.textContent = labels.error;
        return;
      }
    }
    result.removeAttribute('aria-busy');
    result.innerHTML = resultHtml({ versions, range: selection, diff, labels, lang, commitUrl: data.commitUrl, root: !data.base });
  }

  // Presets.
  for (const button of presetButtons) {
    button.addEventListener('click', () => {
      const range = presetRange(button.dataset.preset, context);
      if (range) show(range);
    });
  }

  // Click a dot for its changes, drag over several for a period, shift-click to extend.
  let anchor = null;
  const dotAt = (event) => {
    const dot = document.elementFromPoint(event.clientX, event.clientY)?.closest('.ph-dot');
    return dot && track.contains(dot) ? Number(dot.dataset.i) : null;
  };
  track.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const index = dotAt(event);
    if (index == null) return;
    event.preventDefault();
    hideTip();
    if (event.shiftKey) {
      show({ start: Math.min(selection.start, index), end: Math.max(selection.end, index) }, { scroll: false });
      return;
    }
    anchor = index;
    track.setPointerCapture?.(event.pointerId);
    show({ start: index, end: index }, { scroll: false });
  });
  track.addEventListener('pointermove', (event) => {
    const index = dotAt(event);
    if (anchor == null) {
      if (event.pointerType === 'mouse') showTip(index);
      return;
    }
    if (index == null) return;
    const start = Math.min(anchor, index);
    const end = Math.max(anchor, index);
    if (start !== selection.start || end !== selection.end) show({ start, end }, { scroll: false });
  });
  const release = () => {
    anchor = null;
  };
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', release);
  track.addEventListener('pointerleave', hideTip);
  track.addEventListener('scroll', hideTip, { passive: true });
  window.addEventListener('scroll', hideTip, { passive: true });

  // Arrows move to the version before or after; with Shift they widen the period.
  track.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.key === 'ArrowLeft' ? -1 : 1;
    if (event.shiftKey) show({ start: selection.start, end: Math.max(selection.start, Math.min(last, selection.end + step)) });
    else {
      const index = Math.max(0, Math.min(last, selection.end + step));
      show({ start: index, end: index });
    }
  });
  // Enter or Space on a focused dot (the dots are buttons) picks it.
  track.addEventListener('click', (event) => {
    const dot = event.target.closest('.ph-dot');
    if (dot && event.detail === 0) show({ start: Number(dot.dataset.i), end: Number(dot.dataset.i) });
  });

  // Scrolls the timeline, not the page, to show a dot.
  function reveal(dot) {
    const left = dot.offsetLeft - track.offsetLeft;
    const pad = 32;
    if (left < track.scrollLeft + pad) track.scrollLeft = left - pad;
    else if (left + dot.offsetWidth > track.scrollLeft + track.clientWidth - pad) track.scrollLeft = left + dot.offsetWidth - track.clientWidth + pad;
  }

  function showTip(index) {
    if (index == null) return hideTip();
    const version = versions[index];
    const changes = version.stats ? statsHtml(version.stats, labels, lang) || `<span>${escape(labels.noTextChange)}</span>` : `<span>${escape(labels.created)}</span>`;
    tip.innerHTML = `<div class="ph-tip-date">${escape(formatMoment(version.date, lang))}</div><div class="ph-tip-subject">${escape(version.subject)}</div><div class="ph-tip-meta"><span>${escape(version.author)}</span>${changes}</div>`;
    tip.hidden = false;
    const box = dots[index].getBoundingClientRect();
    const frame = tip.parentElement.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.min(Math.max(box.left + box.width / 2 - frame.left, half), frame.width - half)}px`;
  }
  function hideTip() {
    tip.hidden = true;
  }

  // A day label that would run into the one before it is hidden; its line stays.
  let right = -Infinity;
  for (const label of track.querySelectorAll('.ph-day span')) {
    const box = label.getBoundingClientRect();
    label.style.visibility = box.left < right + 8 ? 'hidden' : '';
    if (label.style.visibility !== 'hidden') right = box.right;
  }

  // Start with a shared address, else what is new since the last visit, else the latest change.
  const params = new URLSearchParams(location.search);
  const asked = rangeFromParams(shas, params.get('from'), params.get('to'));
  const sinceVisit = presetRange('visit', context);
  if (asked) show(asked, { remember: false });
  else if (sinceVisit) show(sinceVisit, { remember: false });
  else reveal(dots[last]);
}

const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
