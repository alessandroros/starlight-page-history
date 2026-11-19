import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightPageHistory from 'starlight-page-history';

export default defineConfig({
  site: process.env.DOCS_SITE ?? 'https://alessandroros.github.io',
  base: process.env.DOCS_BASE ?? '/starlight-page-history',
  integrations: [
    starlight({
      title: 'Starlight Page History',
      description: 'Show every version of a Starlight page and what changed, built from your Git history.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/alessandroros/starlight-page-history' }],
      editLink: { baseUrl: 'https://github.com/alessandroros/starlight-page-history/edit/main/docs/' },
      lastUpdated: true,
      sidebar: [
        { label: 'Start here', items: ['getting-started', 'guides/demo'] },
        { label: 'Guides', items: ['guides/ci', 'guides/generated-pages', 'guides/custom-footer'] },
        { label: 'Reference', items: ['reference/options', 'reference/how-it-works'] },
        { label: 'Project', items: ['changelog'] },
      ],
      plugins: [starlightPageHistory({ exclude: ['changelog'] })],
    }),
  ],
});
