# Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first so we can agree on the approach.

## 📁 Repository

```text
packages/starlight-page-history/   the plugin: Git reader, diff, history page and footer link
docs/                              the documentation site, which is also the demo
scripts/                           release scripts run by CI
```

## 🛠️ Develop

Node 20 or later.

```sh
npm install
npm test                                  # unit tests
npm run dev                               # the docs site, with the demo
npm run build                             # build the docs, as CI does
```

## ✍️ Pull requests

- Commit messages and pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), for example `fix: follow renamed pages`.
- If the pull request changes the published package, add a changeset:

  ```sh
  npx changeset
  ```

  Pick `patch` for fixes and `minor` for new features or changes in behavior (the package is still `0.x`). Write the summary for users: what changed for them and what, if anything, they need to do. It becomes the entry in the [changelog](./packages/starlight-page-history/CHANGELOG.md) and in the GitHub release.
- Changes to the docs, examples or CI need no changeset.

## 📦 Release

Releases are automated, except for one human step on npm.

1. Pull requests with changesets are merged into `main`.
2. The **Release** workflow opens (or updates) a **"chore: version packages"** pull request, which bumps the version and writes the changelog.
3. Merging that pull request runs the workflow again. It **stages** the new version on npm, with provenance, through trusted publishing. The npm trusted publisher may only stage: nothing is installable yet.
4. A maintainer approves the staged version on [npmjs.com](https://www.npmjs.com/package/starlight-page-history) or with `npm stage approve <id>`, with 2FA. npm first runs its automated checks, so the version may show as "validating" for a few minutes.
5. Once the version is live, the next run of the **Release** workflow creates the GitHub release `v<version>`, tagged on the commit that set the version, with the changelog section as notes. To create it right away, run the workflow by hand from the **Actions** tab (**Run workflow**).

To create a missing GitHub release from your machine, with the `gh` CLI signed in:

```sh
node scripts/github-release.mjs 0.2.0
```

It does nothing if the release already exists, or if the version is not on npm yet.
