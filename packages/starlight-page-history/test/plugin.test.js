import { describe, expect, it, vi } from 'vitest';
import starlightPageHistory from '../index.js';

// Runs the plugin's config:setup and returns what it changed.
function setup(options, components) {
  const updates = [];
  const logger = { warn: vi.fn() };
  starlightPageHistory(options).hooks['config:setup']({
    config: { components, customCss: [] },
    updateConfig: (update) => updates.push(update),
    addIntegration: () => {},
    logger,
  });
  return { components: updates[0].components, warn: logger.warn };
}

describe('links', () => {
  it('adds the line under the title and the footer link by default', () => {
    const { components, warn } = setup();
    expect(components).toEqual({
      PageTitle: 'starlight-page-history/components/PageTitle.astro',
      LastUpdated: 'starlight-page-history/components/LastUpdated.astro',
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('adds only the places asked for', () => {
    expect(setup({ links: ['footer'] }).components).toEqual({ LastUpdated: 'starlight-page-history/components/LastUpdated.astro' });
    expect(setup({ links: [] }).components).toEqual({});
  });

  it('leaves your own components alone and says what to add', () => {
    const { components, warn } = setup({}, { PageTitle: './src/Title.astro', Head: './src/Head.astro' });
    expect(components.PageTitle).toBe('./src/Title.astro');
    expect(components.Head).toBe('./src/Head.astro');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('<HistoryTitleLine />'));
  });

  it('refuses an unknown place', () => {
    expect(() => starlightPageHistory({ links: ['sidebar'] })).toThrow('"links" must list');
  });
});
