# starlight-page-history

🕰️ Show every version of a [Starlight](https://starlight.astro.build) page and what changed, paragraph by paragraph, built from your Git history.

- Under every page title, when the page last changed, how many versions it has, and a **Page history** link. The link is in the footer too, next to "Last updated".
- A history page per page, at `/<page>/history/`, with a **timeline**: a dot per commit, sized by how much it changed. Click a dot for that change, or drag over several to see everything that changed in that period. The link can be shared.
- **Since your last visit**: each reader's browser remembers the version they last saw. The page then says **Changed since your last visit**, and the history opens on those changes. Presets cover the latest change and the last 7 or 30 days.
- Changes read like a review, not like a patch: paragraphs, headings, lists, tables and code blocks are matched first, then the words that changed are marked inside them. Long blocks show only the lines around a change.
- Built at build time from `git log`. No server, no API, no token: it works for private repositories, and readers need no Git account. Last visits stay in the reader's browser.
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
| `links`     | `['title', 'footer']` | Where pages link to their history: under the title, in the footer, both, or `[]`.  |
| `exclude`   | `[]`           | Pages without history: a slug (`'guides/draft'`) or a folder ending in `/` (`'reference/'`). |

## Your own PageTitle or LastUpdated component

The links are added by overriding Starlight's `PageTitle` and `LastUpdated` components. If you override one of them yourself, the plugin leaves yours alone and tells you so. Add the link to your component: `HistoryTitleLine` for the title, `HistoryLink` for the footer.

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
