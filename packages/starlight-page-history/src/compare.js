// "Compare versions" on a history page: loads every version of the page
// (versions.json) the first time it is needed, and diffs any two in the
// browser, with the same diff as the list below.
import { diffBlocks, renderDiff } from './diff.js';

for (const form of document.querySelectorAll('form.ph-compare')) setup(form);

function setup(form) {
  const labels = JSON.parse(form.dataset.labels);
  const plural = new Intl.PluralRules(document.documentElement.lang || undefined);
  const count = (forms, n) => (plural.select(n) === 'one' ? forms.one : forms.other).replace('{count}', String(n));
  const from = form.elements.namedItem('from');
  const to = form.elements.namedItem('to');
  const result = form.parentElement.querySelector('.ph-compare-result');
  let data;

  async function load() {
    if (!data) {
      const response = await fetch(form.dataset.src);
      if (!response.ok) throw new Error(`${response.status}`);
      data = await response.json();
    }
    return data;
  }

  async function compare({ remember = true } = {}) {
    if (from.value === to.value) {
      result.replaceChildren(note(labels.same));
      return;
    }
    result.replaceChildren(note(labels.loading));
    try {
      const { blocks, versions } = await load();
      const find = (sha) => versions.findIndex((version) => version.sha.startsWith(sha));
      let older = find(from.value);
      let newer = find(to.value);
      if (older === -1 || newer === -1) throw new Error('unknown version');
      // Newest first: the older version has the larger index.
      if (older < newer) [older, newer] = [newer, older];
      const diff = diffBlocks(
        versions[older].blocks.map((id) => blocks[id]),
        versions[newer].blocks.map((id) => blocks[id]),
      );
      const stats = [
        ['added', '+'],
        ['changed', '~'],
        ['removed', '−'],
      ]
        .filter(([key]) => diff.stats[key] > 0)
        .map(([key, sign]) => `<span class="ph-stat-${key}" title="${count(labels[key], diff.stats[key])}">${sign}${diff.stats[key]}</span>`)
        .join('');
      const html = renderDiff(diff, { hidden: (n) => count(labels.hidden, n), noChange: labels.noChange });
      result.innerHTML = `${stats ? `<p class="ph-meta"><span class="ph-stats">${stats}</span></p>` : ''}${html}`;
      if (remember) {
        const url = new URL(location.href);
        url.searchParams.set('from', from.value);
        url.searchParams.set('to', to.value);
        history.replaceState(null, '', url);
      }
    } catch (error) {
      console.error('starlight-page-history: compare failed', error);
      result.replaceChildren(note(labels.error));
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    compare();
  });

  // "Compare with the latest" under each version.
  for (const link of document.querySelectorAll('[data-compare-from]')) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      from.value = link.dataset.compareFrom;
      to.value = to.options[0].value;
      form.closest('details')?.setAttribute('open', '');
      compare().then(() => form.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
  }

  // A shared link: ?from=<sha>&to=<sha>.
  const params = new URLSearchParams(location.search);
  const pick = (select, value) => {
    const option = value && [...select.options].find((item) => item.value.startsWith(value) || value.startsWith(item.value));
    if (option) select.value = option.value;
    return Boolean(option);
  };
  if (pick(from, params.get('from')) && pick(to, params.get('to'))) {
    form.closest('details')?.setAttribute('open', '');
    compare({ remember: false });
  }
}

function note(text) {
  const p = document.createElement('p');
  p.className = 'ph-none';
  p.textContent = text;
  return p;
}
