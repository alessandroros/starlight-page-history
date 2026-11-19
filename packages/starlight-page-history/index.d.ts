import type { StarlightPlugin } from '@astrojs/starlight/types';

export interface StarlightPageHistoryOptions {
  /**
   * The last segment of a history page URL: `/guides/setup/history/`.
   * @default 'history'
   */
  route?: string;
  /**
   * How many versions a history page shows, newest first. `0` shows them all.
   * @default 0
   */
  limit?: number;
  /**
   * A link to each commit, with `{sha}` in it, or `false` for no links.
   * By default it comes from the `origin` remote (GitHub, GitLab, Gitea, Forgejo).
   * @example 'https://github.com/me/docs/commit/{sha}'
   */
  commitUrl?: string | false;
  /**
   * Pages without a history page. A slug (`'guides/draft'`) or a folder
   * ending in `/` (`'reference/'`).
   * @default []
   */
  exclude?: string[];
}

export default function starlightPageHistory(options?: StarlightPageHistoryOptions): StarlightPlugin;
