---
title: How it works
description: What the plugin does at build time.
---

Everything is read from Git when the site is built. There is no server and no API call. A history page is built showing the latest change; a small script runs the timeline and remembers each reader's last visit in their own browser.

1. **Which file.** For each page of the `docs` collection, the plugin takes the page's own file when Git tracks it. Otherwise it takes the file the page's `editUrl` points to (see [Generated pages](/starlight-page-history/guides/generated-pages/)). A page with neither gets no history.
2. **Which versions.** `git log --follow` lists the commits that changed the file, across renames. Merge commits are skipped: the commits they bring in are listed instead. One `git cat-file --batch` reads the text of every version.
3. **What changed.** Each version is compared with the one before:
   - the text is cut into blocks: front matter, headings, fenced code blocks, and each run of lines between blank lines (a paragraph, a list, a table);
   - blocks are matched in order. A removed block next to an added one that shares at least half its words is shown as the same block, edited;
   - inside an edited block, the words that changed are marked. Changes a word or two apart are joined, so a rewritten sentence reads as one change;
   - a block longer than six lines shows only its changed lines, with one line around them.
4. **Where.** Each page with at least one version gets `/<page>/history/`, linked under the page title and in the footer. The history page holds the timeline and the latest change, so it stays small even for a page with hundreds of versions.
5. **Any period.** Each page also gets `/<page>/history/versions.json`, with every version cut into blocks. A block that several versions share is stored once. The history page loads it the first time a reader picks something other than the latest change, and runs the same diff in the browser.
6. **Last visit.** A page records the newest version the reader has seen in `localStorage`, under a key named after its history page. Only the reader's browser reads it.

The history shows the source as written, Markdown included, not the rendered page.

## Locales

A translated page has its own file and its own history, at `/<locale>/<page>/history/`. A page that falls back to the default language links to the history of the default language's page.

## Limits

- Static builds only: the history is read from Git on the build machine.
- Changes that are not committed do not show.
- The history of a page that was moved without `git mv` (deleted and added in separate commits) starts at the move.
