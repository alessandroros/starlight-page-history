---
title: Full history in CI
description: Fetch the whole Git history in your build, so every version shows.
---

The plugin reads versions from the Git clone your build runs in. A **shallow clone** holds only the latest commits, so pages show only those. During the build the plugin logs:

```text
This is a shallow clone, so pages show only the versions it has.
```

## GitHub Actions

`actions/checkout` fetches one commit unless told otherwise:

```yaml ins={3-4}
- uses: actions/checkout@v7
  with:
    fetch-depth: 0
```

## GitLab CI

Set the clone depth to `0` for the job that builds the site:

```yaml
variables:
  GIT_DEPTH: 0
```

## Other hosts

Fetch the rest of the history before the build:

```sh
git fetch --unshallow || true
npm run build
```

`|| true` keeps the build going when the clone was already complete.

## Pages in a subfolder

If your site lives in a subfolder of the repository (`website/` next to `docs/`), nothing changes: the plugin finds the root of the repository by itself.
