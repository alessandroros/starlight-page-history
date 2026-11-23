---
'starlight-page-history': minor
---

Rebuild the history page around a timeline. Each version is a dot, sized by how much it changed and grouped by day: click a dot to see that change, or drag over several to see everything that changed in that period. Presets cover the changes since your last visit, the latest change, the last 7 or 30 days, and everything from the start. The address keeps the choice, so it can be shared; `?from=…&to=…` links from earlier releases still work.

Each reader's browser now remembers the version of a page they last saw (in `localStorage`, never sent anywhere). The line under the title says **Changed since your last visit** until they look at those changes, and the history page opens on them.

The history page now holds only the timeline and the latest change, and loads the other versions when they are needed, so it stays small for pages with many versions.

Translation keys: the `pageHistory.compare*` and `pageHistory.showChanges` keys are gone, and new keys cover the timeline. See the table in "Your own components".
