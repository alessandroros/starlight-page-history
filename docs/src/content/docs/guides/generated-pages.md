---
title: Generated pages
description: History for pages copied or generated from another folder before the build.
---

Some sites do not keep their pages in `src/content/docs/`. A script copies them there from another folder before the build, often converting them on the way, and the copies are not committed. Git has no history for the copies.

The plugin then looks at the page's **`editUrl`**: when it points to a file Git tracks, that file's history is used. A sync script that writes the edit link of the original file is enough:

```md
---
title: User data model
editUrl: https://github.com/acme/docs/edit/main/docs/rfc/0002-user-data-model.md
---
```

GitHub, GitLab, Gitea and Forgejo edit links are understood, including branch names with a slash.

The history shows the original file as it was written: what authors changed, before any conversion.
