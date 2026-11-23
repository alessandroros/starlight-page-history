---
title: Getting started
description: Install the plugin and give every page a history.
---

starlight-page-history adds a line under the title of every page: when it last changed, how many versions it has, and a **Page history** link. The same link is in the footer. It opens `/<page>/history/`: a timeline with a dot for each commit that changed the page, and what changed in the versions you pick on it.

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

The history page opens on what is new for the reader: the changes since their last visit, or the latest change on a first visit.

- **Presets** cover the usual questions in one click: **Since your last visit**, **Latest change**, **Last 7 days**, **Last 30 days** and **From the start**.
- **The timeline** has a dot for each version, grouped by day. A bigger dot changed more text. Dots the reader has not seen yet are coloured, and an orange line marks their last visit. Hover a dot for its date, author, message and summary.
- **Click a dot** to see what that version changed. **Drag over several**, or Shift-click, to see everything that changed over that period as one change. The arrow keys move along the timeline, and Shift widens the period.

Under the timeline, a title says what is shown, such as "What changed from November 18 to November 20", followed by who changed it, the commits, a summary such as **+2 ~1 −1** (paragraphs added, changed and removed), and the changes:

- unchanged paragraphs are folded into a count, with one around each change for context;
- the section each change sits in is shown above it;
- an edited paragraph marks the words removed and added;
- a long table, list or code block shows only the lines around what changed.

The address keeps what is shown (`?from=…&to=…`), so it can be shared as a link.

## Since your last visit

When a reader opens a page, their browser remembers which version they saw, in `localStorage`. Nothing is sent anywhere and nothing is stored on a server. When the page has changed since, the line under the title says **Changed since your last visit** until they look at those changes, and the history page opens on them.

A reader who has never opened the page, uses private browsing or has turned storage off simply starts with the latest change.

Try it on the [demo page's history](/starlight-page-history/guides/demo/history/).
