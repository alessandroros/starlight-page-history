import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { commitUrlFromRemote, openRepository } from '../src/git.js';

let dir;
const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
const env = (date) => ({ ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
function commit(message, date) {
  execFileSync('git', ['add', '-A'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', message], { cwd: dir, env: env(date) });
}
const write = (file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};

beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'page-history-'));
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Ada Lovelace');
  git('config', 'user.email', 'ada@example.com');
  git('config', 'commit.gpgsign', 'false');
  write('docs/guide.md', '# Guide\n\nFirst.\n');
  commit('docs: add the guide', '2026-01-01T10:00:00Z');
  write('docs/guide.md', '# Guide\n\nFirst, with “quotes” and ünïcode.\n');
  commit('docs: edit the guide', '2026-01-02T10:00:00Z');
  git('mv', 'docs/guide.md', 'docs/getting-started.md');
  commit('docs: rename the guide', '2026-01-03T10:00:00Z');
  write('site/src/content/docs/other.md', 'Other\n');
  commit('docs: add another page', '2026-01-04T10:00:00Z');
  git('remote', 'add', 'origin', 'git@github.com:owner/repo.git');
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('openRepository', () => {
  it('returns null outside a repository', () => {
    const outside = mkdtempSync(path.join(tmpdir(), 'no-git-'));
    expect(openRepository(outside)).toBeNull();
    rmSync(outside, { recursive: true });
  });

  it('reads every version, newest first, across a rename', () => {
    const repo = openRepository(path.join(dir, 'site'));
    const versions = repo.versions('docs/getting-started.md');
    expect(versions.map((version) => version.subject)).toEqual(['docs: rename the guide', 'docs: edit the guide', 'docs: add the guide']);
    expect(versions.map((version) => version.path)).toEqual(['docs/getting-started.md', 'docs/guide.md', 'docs/guide.md']);
    expect(versions[1]).toMatchObject({ author: 'Ada Lovelace', text: '# Guide\n\nFirst, with “quotes” and ünïcode.\n' });
    expect(versions[2].text).toBe('# Guide\n\nFirst.\n');
    expect(new Date(versions[2].date).toISOString()).toBe('2026-01-01T10:00:00.000Z');
    expect(repo.shallow).toBe(false);
  });

  it('finds the repository file of a page, from its own path or its edit URL', () => {
    const repo = openRepository(path.join(dir, 'site'));
    expect(repo.trackedPath('src/content/docs/other.md')).toBe('site/src/content/docs/other.md');
    expect(repo.trackedPath('src/content/docs/missing.md')).toBeNull();
    expect(repo.pathFromEditUrl('https://github.com/owner/repo/edit/main/docs/getting-started.md')).toBe('docs/getting-started.md');
    expect(repo.pathFromEditUrl('https://gitlab.com/g/p/-/edit/feature/x/docs/getting-started.md')).toBe('docs/getting-started.md');
    expect(repo.pathFromEditUrl('https://codeberg.org/o/r/_edit/main/docs/getting-started.md')).toBe('docs/getting-started.md');
    expect(repo.pathFromEditUrl('https://github.com/owner/repo/edit/main/docs/nope.md')).toBeNull();
    expect(repo.pathFromEditUrl('not a url')).toBeNull();
    expect(repo.commitUrlTemplate()).toBe('https://github.com/owner/repo/commit/{sha}');
  });
});

describe('commitUrlFromRemote', () => {
  it.each([
    ['https://github.com/o/r.git', 'https://github.com/o/r/commit/{sha}'],
    ['git@github.com:o/r.git', 'https://github.com/o/r/commit/{sha}'],
    ['ssh://git@gitlab.example.com/group/sub/p.git', 'https://gitlab.example.com/group/sub/p/-/commit/{sha}'],
    ['https://codeberg.org/o/r', 'https://codeberg.org/o/r/commit/{sha}'],
  ])('%s', (remote, url) => {
    expect(commitUrlFromRemote(remote)).toBe(url);
  });

  it('gives up on paths it cannot read', () => {
    expect(commitUrlFromRemote('/local/path/repo')).toBeNull();
    expect(commitUrlFromRemote('file:///local/repo')).toBeNull();
  });
});
