# starlight-page-history

## 0.2.0

### Minor Changes

- dd311a8: Compare any two versions of a page. A **Compare versions** box at the top of the history page diffs the two versions you pick, and **Compare with the latest** under each version compares it with the newest one. The comparison is kept in the address (`?from=…&to=…`), so it can be shared. Each page gets a `/<page>/history/versions.json` with its versions, loaded only when a reader compares.

## 0.1.0

### Minor Changes

- 473de4f: First version: a **Page history** link in the footer of every page, and a history page at `/<page>/history/` with every version from Git and what changed in it, paragraph by paragraph.
