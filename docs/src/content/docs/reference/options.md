---
title: Options
description: Every option of starlight-page-history.
---

```js
starlightPageHistory({
  route: 'history',
  limit: 0,
  commitUrl: 'https://github.com/acme/docs/commit/{sha}',
  links: ['title', 'footer'],
  exclude: ['changelog', 'reference/'],
});
```

## `route`

**Default:** `'history'`

The last segment of a history page URL: `/guides/setup/history/`. Pick another one if a page of yours is called `history`.

## `limit`

**Default:** `0` (every version)

How many versions a history page shows, newest first. The page then says how many older ones it leaves out. A page edited hundreds of times builds a large history page; a limit keeps it light.

## `commitUrl`

**Default:** built from the `origin` remote

A link from each version to its commit, with `{sha}` where the commit hash goes. The default works for GitHub, GitLab, Gitea and Forgejo remotes. Use `false` for no links, for example when readers cannot open the repository.

## `links`

**Default:** `['title', 'footer']`

Where pages link to their history:

- `'title'`: a line under the page title, such as *Updated Nov 19, 2026 · 113 versions · Page history →*;
- `'footer'`: a link next to "Last updated" at the bottom of the page.

`['footer']` keeps only the footer link. `[]` adds no link: history pages are still built, and you link to them yourself.

## `exclude`

**Default:** `[]`

Pages with no history page and no link. A slug matches one page (`'changelog'`). A slug ending in `/` matches a folder (`'reference/'`).
