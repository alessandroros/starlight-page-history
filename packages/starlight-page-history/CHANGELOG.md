# starlight-page-history

## 0.4.0

### Minor Changes

- 011cafc: Rebuild the history page around a timeline. Each version is a dot, sized by how much it changed and grouped by day: click a dot to see that change, or drag over several to see everything that changed in that period. Presets cover the changes since your last visit, the latest change, the last 7 or 30 days, and everything from the start. The address keeps the choice, so it can be shared; `?from=…&to=…` links from earlier releases still work.
  
  Each reader's browser now remembers the version of a page they last saw (in `localStorage`, never sent anywhere). The line under the title says **Changed since your last visit** until they look at those changes, and the history page opens on them.
  
  The history page now holds only the timeline and the latest change, and loads the other versions when they are needed, so it stays small for pages with many versions.
  
  Translation keys: the `pageHistory.compare*` and `pageHistory.showChanges` keys are gone, and new keys cover the timeline. See the table in "Your own components".

### Patch Changes

- 011cafc: Fix the history page title showing an escaped `/` (`&#x2F;`) when the page title has one.

## 0.3.0

### Minor Changes

- 699984f: A line under every page title shows when the page last changed, how many versions it has, and a **Page history** link, so readers find the history without scrolling to the footer. The footer link stays. The new `links` option chooses where the links go: `['title', 'footer']` (default), one of them, or `[]`. If your site overrides `PageTitle`, add `HistoryTitleLine` to your component.

## 0.2.0

### Minor Changes

- dd311a8: Compare any two versions of a page. A **Compare versions** box at the top of the history page diffs the two versions you pick, and **Compare with the latest** under each version compares it with the newest one. The comparison is kept in the address (`?from=…&to=…`), so it can be shared. Each page gets a `/<page>/history/versions.json` with its versions, loaded only when a reader compares.

## 0.1.0

### Minor Changes

- 473de4f: First version: a **Page history** link in the footer of every page, and a history page at `/<page>/history/` with every version from Git and what changed in it, paragraph by paragraph.
