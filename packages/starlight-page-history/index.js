// starlight-page-history: a history page for every Starlight page, with what
// changed in each version, built from Git at build time. See README.md.

import { fileURLToPath } from 'node:url';
import { openRepository } from './src/git.js';
import { translations } from './src/translations.js';

const VIRTUAL_ID = 'virtual:starlight-page-history/config';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
// Where the link goes: the Starlight component the plugin overrides, and
// what to tell a site that already overrides it.
const PLACES = {
  title: {
    component: 'PageTitle',
    ours: 'starlight-page-history/components/PageTitle.astro',
    hint: "import HistoryTitleLine from 'starlight-page-history/components/HistoryTitleLine.astro' and render <HistoryTitleLine /> after the <h1>",
  },
  footer: {
    component: 'LastUpdated',
    ours: 'starlight-page-history/components/LastUpdated.astro',
    hint: "import HistoryLink from 'starlight-page-history/components/HistoryLink.astro' and render <HistoryLink />",
  },
};

/** @param {import('./index').StarlightPageHistoryOptions} [options] */
export default function starlightPageHistory(options = {}) {
  const config = resolveOptions(options);
  return {
    name: 'starlight-page-history',
    hooks: {
      'i18n:setup'({ injectTranslations }) {
        injectTranslations(translations);
      },
      'config:setup'({ addIntegration, config: starlightConfig, updateConfig, logger }) {
        // The link sits under the page title and in the footer, next to "Last updated".
        const components = { ...(starlightConfig.components ?? {}) };
        for (const place of config.links) {
          const { component, ours, hint } = PLACES[place];
          const own = components[component];
          if (!own) components[component] = ours;
          else if (own !== ours) {
            logger.warn(`You override ${component}, so the history link is not added there for you. Add it to your component: ${hint}.`);
          }
        }
        updateConfig({
          customCss: [...(starlightConfig.customCss ?? []), 'starlight-page-history/styles.css'],
          components,
        });
        addIntegration(historyIntegration(config, logger));
      },
    },
  };
}

function resolveOptions(options) {
  const route = (options.route ?? 'history').replace(/^\/+|\/+$/g, '');
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(route)) {
    throw new Error('starlight-page-history: "route" must be one path segment, such as "history".');
  }
  const limit = options.limit ?? 0;
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error('starlight-page-history: "limit" must be 0 (every version) or a positive integer.');
  }
  const commitUrl = options.commitUrl ?? null;
  if (commitUrl !== null && commitUrl !== false && (typeof commitUrl !== 'string' || !commitUrl.includes('{sha}'))) {
    throw new Error('starlight-page-history: "commitUrl" must be a URL with {sha} in it, or false.');
  }
  const links = options.links ?? ['title', 'footer'];
  if (!Array.isArray(links) || links.some((place) => !(place in PLACES))) {
    throw new Error('starlight-page-history: "links" must list where the link goes: "title", "footer", both, or none ([]).');
  }
  return { route, limit, commitUrl, exclude: options.exclude ?? [], links: [...new Set(links)] };
}

function historyIntegration(config, logger) {
  return {
    name: 'starlight-page-history',
    hooks: {
      'astro:config:setup'({ config: astroConfig, injectRoute, updateConfig }) {
        const root = fileURLToPath(astroConfig.root);
        const repo = openRepository(root);
        if (!repo) {
          logger.warn('This project is not in a Git repository (or Git is not installed): pages get no history.');
        } else if (repo.shallow) {
          logger.warn(
            'This is a shallow clone, so pages show only the versions it has. ' +
              'Fetch the whole history to build them all, for example with `fetch-depth: 0` in actions/checkout.',
          );
        }
        const commitUrl = config.commitUrl === null ? (repo?.commitUrlTemplate() ?? false) : config.commitUrl;
        const virtual = { ...config, root, commitUrl };
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'starlight-page-history-config',
                resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
                load: (id) => (id === RESOLVED_ID ? `export default ${JSON.stringify(virtual)};` : undefined),
              },
            ],
          },
        });
        injectRoute({
          pattern: `/[...slug]/${config.route}`,
          entrypoint: fileURLToPath(new URL('./src/history.astro', import.meta.url)),
          prerender: true,
        });
        // Every version of the page, for comparing any two in the browser.
        injectRoute({
          pattern: `/[...slug]/${config.route}/versions.json`,
          entrypoint: fileURLToPath(new URL('./src/versions.js', import.meta.url)),
          prerender: true,
        });
      },
    },
  };
}
