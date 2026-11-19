// starlight-page-history: a history page for every Starlight page, with what
// changed in each version, built from Git at build time. See README.md.

import { fileURLToPath } from 'node:url';
import { openRepository } from './src/git.js';
import { translations } from './src/translations.js';

const VIRTUAL_ID = 'virtual:starlight-page-history/config';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const COMPONENT = 'starlight-page-history/components/LastUpdated.astro';

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
        const components = starlightConfig.components ?? {};
        const own = components.LastUpdated;
        updateConfig({
          customCss: [...(starlightConfig.customCss ?? []), 'starlight-page-history/styles.css'],
          // The link sits in the page footer, next to "Last updated".
          ...(own ? {} : { components: { ...components, LastUpdated: COMPONENT } }),
        });
        if (own && own !== COMPONENT) {
          logger.warn(
            'You override LastUpdated, so the "Page history" link is not added for you. ' +
              "Add it to your component: import HistoryLink from 'starlight-page-history/components/HistoryLink.astro' and render <HistoryLink />.",
          );
        }
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
  return { route, limit, commitUrl, exclude: options.exclude ?? [] };
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
      },
    },
  };
}
