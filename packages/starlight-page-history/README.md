# starlight-page-history

🕰️ Show every version of a [Starlight](https://starlight.astro.build) page and what changed, paragraph by paragraph, built from your Git history.

- A **Page history** link in the footer of every page, next to "Last updated".
- A history page per page, at `/<page>/history/`: each commit that changed it, newest first, with its date, author and message.
- **Compare any two versions**: pick a "from" and a "to" version, or click **Compare with the latest** under a version, to see everything that changed in between. The link can be shared.
- Changes read like a review, not like a patch: paragraphs, headings, lists, tables and code blocks are matched first, then the words that changed are marked inside them. Long blocks show only the lines around a change.
- Built at build time from `git log`. No server, no API, no token: it works for private repositories, and readers need no Git account.
- Follows renames. Works when your pages are copied or generated from another folder: it then finds the file through the page's `editUrl`.
- In English, Italian, German, French and Spanish, and translatable like Starlight's own strings.

**Docs and demo:** https://alessandroros.github.io/starlight-page-history/

## Install

```sh
npm install starlight-page-history
```

```js
// astro.config.mjs
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightPageHistory from 'starlight-page-history';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My docs',
      plugins: [starlightPageHistory()],
    }),
  ],
});
```

Your build needs the whole Git history. CI services often clone only the last commit, so a page would show one version. On GitHub Actions:

```yaml
- uses: actions/checkout@v7
  with:
    fetch-depth: 0
```

The plugin warns during the build when the clone is shallow.

## Options

| Option      | Default        | What it does                                                                                  |
| ----------- | -------------- | --------------------------------------------------------------------------------------------- |
| `route`     | `'history'`    | The last segment of a history page URL.                                                       |
| `limit`     | `0`            | How many versions a history page shows. `0` shows them all.                                   |
| `commitUrl` | from `origin`  | A link to each commit, with `{sha}` in it, or `false` for no links.                           |
| `exclude`   | `[]`           | Pages without history: a slug (`'guides/draft'`) or a folder ending in `/` (`'reference/'`). |

## Your own LastUpdated component

The link is added by overriding Starlight's `LastUpdated` component. If you override it yourself, the plugin leaves yours alone and tells you so. Add the link to your component:

```astro
---
import Default from '@astrojs/starlight/components/LastUpdated.astro';
import HistoryLink from 'starlight-page-history/components/HistoryLink.astro';
---

<Default />
<HistoryLink />
```

## License

MIT
