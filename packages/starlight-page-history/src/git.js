// Reads the versions of a page from Git: one `git log --follow` per file and
// one `git cat-file --batch` for the texts. Nothing here runs in the browser.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import path from 'node:path';

const FIELD = '\x1f';
const RECORD = '\x1e';

function git(cwd, args, input) {
  const result = spawnSync('git', args, { cwd, input, maxBuffer: 512 * 1024 * 1024 });
  if (result.error || result.status !== 0) return null;
  return result.stdout;
}

/**
 * A Git repository seen from an Astro project, or null outside one.
 * @param {string} projectRoot The Astro root, absolute.
 */
export function openRepository(projectRoot) {
  // Git answers with real paths: /private/var/…, not the /var/… symlink.
  try {
    projectRoot = realpathSync(projectRoot);
  } catch {
    return null;
  }
  const top = git(projectRoot, ['rev-parse', '--show-toplevel'])?.toString().trim();
  if (!top) return null;
  const shallow = git(top, ['rev-parse', '--is-shallow-repository'])?.toString().trim() === 'true';
  const tracked = new Set(
    (git(top, ['ls-files', '-z', '--full-name']) ?? Buffer.alloc(0))
      .toString('utf8')
      .split('\0')
      .filter(Boolean),
  );
  const cache = new Map();

  return {
    top,
    shallow,

    /** The repository path of a file given relative to the Astro root, if Git tracks it. */
    trackedPath(file) {
      if (!file) return null;
      const relative = path.relative(top, path.resolve(projectRoot, file)).split(path.sep).join('/');
      return tracked.has(relative) ? relative : null;
    },

    /**
     * The repository path an "edit this page" URL points to, if Git tracks it.
     * Knows GitHub, GitLab, Gitea and Forgejo URLs, with branch names that hold slashes.
     */
    pathFromEditUrl(url) {
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(url).pathname);
      } catch {
        return null;
      }
      const marker = pathname.match(/\/(?:-\/)?(?:_?edit|blob|src\/branch)\/(.+)$/);
      if (!marker) return null;
      const segments = marker[1].split('/');
      for (let skip = 1; skip < segments.length; skip++) {
        const candidate = segments.slice(skip).join('/');
        if (tracked.has(candidate)) return candidate;
      }
      return null;
    },

    /**
     * Every committed version of a file, newest first, following renames.
     * @param {string} file A repository path.
     * @returns {{ sha: string, author: string, date: string, subject: string, path: string, text: string }[]}
     */
    versions(file) {
      if (cache.has(file)) return cache.get(file);
      const log = git(top, [
        'log',
        '--follow',
        '--no-merges',
        '-z',
        `--format=${RECORD}%H${FIELD}%an${FIELD}%aI${FIELD}%s`,
        '--name-status',
        '--',
        file,
      ]);
      const commits = [];
      for (const record of (log?.toString('utf8') ?? '').split(RECORD).slice(1)) {
        // "<header>\0\n<status>\0<path>[\0<new path>]\0" (-z keeps odd names intact)
        const [header, ...rest] = record.split('\0');
        const [sha, author, date, subject] = header.trim().split(FIELD);
        const fields = rest.map((field, index) => (index === 0 ? field.trim() : field)).filter(Boolean);
        const status = fields[0] ?? '';
        if (!sha || status.startsWith('D')) continue;
        // A rename or copy lists the old path, then the new one.
        const at = /^[RC]/.test(status) ? fields[2] : fields[1];
        if (at) commits.push({ sha, author, date, subject, path: at });
      }
      const texts = readBlobs(
        top,
        commits.map((commit) => `${commit.sha}:${commit.path}`),
      );
      const versions = commits.map((commit, index) => ({ ...commit, text: texts[index] })).filter((version) => version.text !== null);
      cache.set(file, versions);
      return versions;
    },

    /** A commit link template from the `origin` remote, or null when the host is unknown. */
    commitUrlTemplate() {
      const remote = git(top, ['remote', 'get-url', 'origin'])?.toString().trim();
      return remote ? commitUrlFromRemote(remote) : null;
    },
  };
}

/** Reads many blobs in one `git cat-file --batch`. Missing ones are null. */
function readBlobs(cwd, specs) {
  if (specs.length === 0) return [];
  const out = git(cwd, ['cat-file', '--batch'], specs.join('\n') + '\n');
  if (!out) return specs.map(() => null);
  const texts = [];
  let offset = 0;
  for (let i = 0; i < specs.length; i++) {
    const newline = out.indexOf(0x0a, offset);
    const header = out.subarray(offset, newline).toString('utf8');
    offset = newline + 1;
    const match = header.match(/^\S+ (\w+) (\d+)$/);
    if (!match) {
      texts.push(null); // "<spec> missing"
      continue;
    }
    const size = Number(match[2]);
    texts.push(match[1] === 'blob' ? out.subarray(offset, offset + size).toString('utf8') : null);
    offset += size + 1;
  }
  return texts;
}

/**
 * "git@github.com:o/r.git" -> "https://github.com/o/r/commit/{sha}".
 * GitLab hosts get "/-/commit/". Other hosts use "/commit/", as Gitea and Forgejo do.
 */
export function commitUrlFromRemote(remote) {
  let host;
  let repoPath;
  const scp = remote.match(/^(?:[\w.-]+@)?([\w.-]+):(?!\/\/)(.+)$/);
  if (scp) [, host, repoPath] = scp;
  else {
    try {
      const url = new URL(remote);
      if (!/^(https?|ssh|git):$/.test(url.protocol)) return null;
      host = url.hostname;
      repoPath = url.pathname.replace(/^\/+/, '');
    } catch {
      return null;
    }
  }
  repoPath = repoPath.replace(/\.git$/, '').replace(/\/+$/, '');
  if (!host || !repoPath.includes('/')) return null;
  const commit = /gitlab/i.test(host) ? '-/commit' : 'commit';
  return `https://${host}/${repoPath}/${commit}/{sha}`;
}
