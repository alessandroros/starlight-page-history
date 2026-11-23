// On a docs page: remembers the newest version the reader has seen, and shows
// "Changed since your last visit" under the title until they look at it.
import { nextVisit } from './timeline-model.js';
import { readVisit, writeVisit } from './visit-store.js';

const done = new Set();
for (const element of document.querySelectorAll('[data-ph-key][data-ph-latest]')) {
  const { phKey: key, phLatest: latest } = element.dataset;
  if (done.has(key)) continue;
  done.add(key);
  const state = nextVisit(readVisit(key), latest);
  writeVisit(key, state);
  if (state.pending) for (const badge of document.querySelectorAll(`.ph-new[data-ph-key="${CSS.escape(key)}"]`)) badge.hidden = false;
}
