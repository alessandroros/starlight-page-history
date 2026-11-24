---
title: Your own components
description: Keep the history links when you override PageTitle or LastUpdated.
---

The plugin places its links by overriding two Starlight components:

- [`PageTitle`](https://starlight.astro.build/reference/overrides/#pagetitle): Starlight's title, then the line with the last change, the number of versions and the link;
- [`LastUpdated`](https://starlight.astro.build/reference/overrides/#lastupdated): Starlight's own date, then the link.

If your site already overrides one of them, the plugin leaves your component alone and logs a warning. Add the history part where you want it.

## PageTitle

```astro title="src/components/PageTitle.astro"
---
import Default from '@astrojs/starlight/components/PageTitle.astro';
import HistoryTitleLine from 'starlight-page-history/components/HistoryTitleLine.astro';
---

<Default />
<HistoryTitleLine />
```

## LastUpdated

```astro title="src/components/LastUpdated.astro"
---
import Default from '@astrojs/starlight/components/LastUpdated.astro';
import HistoryLink from 'starlight-page-history/components/HistoryLink.astro';
---

<Default />
<HistoryLink />
```

`HistoryTitleLine` and `HistoryLink` render nothing on a page without history.

## Changing the words

Every string is a Starlight translation key, so you can change it in `src/content/i18n/<lang>.json`:

```json title="src/content/i18n/en.json"
{
  "pageHistory.link": "See what changed"
}
```

| Key                                           | English                                               |
| --------------------------------------------- | ----------------------------------------------------- |
| `pageHistory.updated`                         | Updated                                               |
| `pageHistory.versionCount` / `_one`, `_other` | `{{count}}` versions                                  |
| `pageHistory.link`                            | Page history                                          |
| `pageHistory.title`                           | History: `{{title}}`                                  |
| `pageHistory.description`                     | Every version of this page and what changed in each.  |
| `pageHistory.versions` / `_one`, `_other`     | `{{count}}` versions, since `{{date}}`                |
| `pageHistory.created`                         | First version of the page.                            |
| `pageHistory.noChange`                        | The text did not change.                              |
| `pageHistory.unchanged` / `_one`, `_other`    | `{{count}}` unchanged paragraphs                      |
| `pageHistory.added` / `_one`, `_other`        | `{{count}}` paragraphs added                          |
| `pageHistory.changed` / `_one`, `_other`      | `{{count}}` paragraphs changed                        |
| `pageHistory.removed` / `_one`, `_other`      | `{{count}}` paragraphs removed                        |
| `pageHistory.older` / `_one`, `_other`        | `{{count}}` older versions are not shown.             |
| `pageHistory.newSince`                        | Changed since your last visit                         |
| `pageHistory.period`                          | Period                                                |
| `pageHistory.presetVisit`                     | Since your last visit                                 |
| `pageHistory.presetLatest`                    | Latest change                                         |
| `pageHistory.presetWeek`                      | Last 7 days                                           |
| `pageHistory.presetMonth`                     | Last 30 days                                          |
| `pageHistory.presetAll`                       | From the start                                        |
| `pageHistory.presetFirstVisit`                | Your first visit: nothing to compare yet              |
| `pageHistory.presetNothingNew`                | Nothing new since your last visit                     |
| `pageHistory.presetEmptyWeek`                 | No changes in the last 7 days                         |
| `pageHistory.presetEmptyMonth`                | No changes in the last 30 days                        |
| `pageHistory.timeline`                        | Versions of the page, oldest first                    |
| `pageHistory.hint`                            | Click a dot to see that change, or drag over several. |
| `pageHistory.legendNew`                       | new for you                                           |
| `pageHistory.legendSeen`                      | seen                                                  |
| `pageHistory.legendSize`                      | bigger dot, more text changed                         |
| `pageHistory.lastVisit`                       | last visit                                            |
| `pageHistory.changedOn`                       | What changed on `{{date}}`                            |
| `pageHistory.changedBetween`                  | What changed from `{{from}}` to `{{to}}`              |
| `pageHistory.firstVersion`                    | The first version of the page                         |
| `pageHistory.sinceFirst`                      | What changed since the first version                  |
| `pageHistory.changesBy` / `_one`, `_other`    | `{{count}}` changes by `{{authors}}`                  |
| `pageHistory.more` / `_one`, `_other`         | and `{{count}}` more                                  |
| `pageHistory.noTextChange`                    | no change to the text                                 |
| `pageHistory.error`                           | The versions could not be loaded.                     |