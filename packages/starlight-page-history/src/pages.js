// Shared by the footer link and the history route: which Git file a page
// comes from, its versions, and the URL of its history page. Build time only.
import config from 'virtual:starlight-page-history/config';
import { openRepository } from './git.js';

let repo;
const repository = () => (repo === undefined ? (repo = openRepository(config.root)) : repo);

/** "guides/demo" -> "guides/demo", "index" -> "", "it/index" -> "it". */
export function pageSlug(id) {
  return id === 'index' ? '' : id.replace(/\/index$/, '');
}

function excluded(slug) {
  return config.exclude.some((rule) => (rule.endsWith('/') ? `${slug}/`.startsWith(rule) : slug === rule.replace(/^\/+|\/+$/g, '')));
}

/**
 * The repository file of a docs entry: its own file when Git tracks it,
 * else the file its `editUrl` points to (for pages copied or generated
 * from another folder before the build).
 */
export function sourceOf(entry) {
  const git = repository();
  if (!git || !entry?.id) return null;
  return (
    git.trackedPath(entry.filePath) ?? (typeof entry.data?.editUrl === 'string' ? git.pathFromEditUrl(entry.data.editUrl) : null)
  );
}

/** The versions of a docs entry, newest first, or null when it has none. */
export function historyOf(entry) {
  if (!entry?.id || excluded(pageSlug(entry.id))) return null;
  const source = sourceOf(entry);
  const versions = source ? repository().versions(source) : [];
  return versions.length ? { source, versions } : null;
}

/** The history page of a docs entry, or null when it has no history. */
export function historyUrl(entry) {
  if (!historyOf(entry)) return null;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const slug = pageSlug(entry.id);
  return `${base}/${slug ? `${slug}/` : ''}${config.route}/`;
}

export function commitUrl(sha) {
  return config.commitUrl ? config.commitUrl.replaceAll('{sha}', sha) : null;
}

export const settings = config;
