# starlight-page-history

## 0.3.0

### Minor Changes

- 699984f: A line under every page title shows when the page last changed, how many versions it has, and a **Page history** link, so readers find the history without scrolling to the footer. The footer link stays. The new `links` option chooses where the links go: `['title', 'footer']` (default), one of them, or `[]`. If your site overrides `PageTitle`, add `HistoryTitleLine` to your component.

## 0.2.0

### Minor Changes

- dd311a8: Compare any two versions of a page. A **Compare versions** box at the top of the history page diffs the two versions you pick, and **Compare with the latest** under each version compares it with the newest one. The comparison is kept in the address (`?from=…&to=…`), so it can be shared. Each page gets a `/<page>/history/versions.json` with its versions, loaded only when a reader compares.

## 0.1.0

### Minor Changes

- 473de4f: First version: a **Page history** link in the footer of every page, and a history page at `/<page>/history/` with every version from Git and what changed in it, paragraph by paragraph.
