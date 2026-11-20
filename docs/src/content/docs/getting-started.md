---
title: Getting started
description: Install the plugin and give every page a history.
---

starlight-page-history adds a line under the title of every page: when it last changed, how many versions it has, and a **Page history** link. The same link is in the footer. It opens `/<page>/history/`, which lists each commit that changed the page, newest first, and what changed in it.

## Install

```sh
npm install starlight-page-history
```

Add the plugin to Starlight in `astro.config.mjs`:

```js ins={3,9}
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

Run `npm run dev` and open any page: the line is under the title, and the link is also at the bottom, next to "Last updated" when you have it on. Only pages Git knows about get one, so commit a page to see its history.

## Build with the whole history

History pages are built from the Git clone your build runs in. Many CI services clone only the latest commit, which leaves one version per page. The plugin warns in the build log when that happens. See [Full history in CI](/starlight-page-history/guides/ci/) to fix it on your host.

## What readers see

Each version shows its date, author, commit message and a short summary such as **+2 ~1 −1**: paragraphs added, changed and removed. Open **Changes** to read them:

- unchanged paragraphs are folded into a count, with one around each change for context;
- the section each change sits in is shown above it;
- an edited paragraph marks the words removed and added;
- a long table, list or code block shows only the lines around what changed.

## Compare two versions

Each version shows only what its own commit changed. To see everything that changed over a period, for example since a review, open **Compare versions** at the top of the history page and pick a **From** and a **To** version. **Compare with the latest**, under each version, does the same against the newest one.

The address keeps the two versions (`?from=…&to=…`), so a comparison can be shared as a link.

Try it on the [demo page's history](/starlight-page-history/guides/demo/history/).
