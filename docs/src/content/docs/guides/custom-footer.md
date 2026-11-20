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

| Key                                        | English                                              |
| ------------------------------------------ | ---------------------------------------------------- |
| `pageHistory.link`                         | Page history                                         |
| `pageHistory.updated`                      | Updated                                              |
| `pageHistory.versionCount_one` / `_other`  | `{{count}}` versions                                 |
| `pageHistory.title`                        | History: `{{title}}`                                 |
| `pageHistory.description`                  | Every version of this page and what changed in each. |
| `pageHistory.versions_one` / `_other`      | `{{count}}` versions, since `{{date}}`               |
| `pageHistory.showChanges`                  | Changes                                              |
| `pageHistory.created`                      | First version of the page.                           |
| `pageHistory.noChange`                     | The text did not change.                             |
| `pageHistory.unchanged_one` / `_other`     | `{{count}}` unchanged paragraphs                     |
| `pageHistory.added_one` / `_other`         | `{{count}}` paragraphs added                         |
| `pageHistory.changed_one` / `_other`       | `{{count}}` paragraphs changed                       |
| `pageHistory.removed_one` / `_other`       | `{{count}}` paragraphs removed                       |
| `pageHistory.older_one` / `_other`         | `{{count}}` older versions are not shown.            |
| `pageHistory.compare`                      | Compare versions                                     |
| `pageHistory.compareFrom`                  | From                                                 |
| `pageHistory.compareTo`                    | To                                                   |
| `pageHistory.compareButton`                | Compare                                              |
| `pageHistory.compareLatest`                | Compare with the latest                              |
| `pageHistory.compareSame`                  | Choose two different versions.                       |
| `pageHistory.compareLoading`               | Loading the versions…                                |
| `pageHistory.compareError`                 | The versions could not be loaded.                    |
