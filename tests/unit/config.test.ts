import { describe, test, expect } from 'vitest';
import {
  getNextPriority,
  getActiveCatalogs,
  addCatalog,
  removeCatalog,
  trackInstallation,
  untrackInstallation,
  type UserConfig,
  type CatalogEntry,
} from '../../src/core/config.js';

describe('getNextPriority', () => {
  test('should return 1 for empty config', () => {
    const config: UserConfig = { catalogs: {}, installed: {} };
    expect(getNextPriority(config)).toBe(1);
  });

  test('should return max priority + 1', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 5, active: true },
        'cat-2': { type: 'local', path: '/bar', priority: 2, active: true },
        'cat-3': { type: 'local', path: '/baz', priority: 8, active: true },
      },
      installed: {},
    };
    expect(getNextPriority(config)).toBe(9);
  });

  test('should handle single catalog', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 1, active: true },
      },
      installed: {},
    };
    expect(getNextPriority(config)).toBe(2);
  });
});

describe('getActiveCatalogs', () => {
  test('should return empty array for config with no catalogs', () => {
    const config: UserConfig = { catalogs: {}, installed: {} };
    expect(getActiveCatalogs(config)).toEqual([]);
  });

  test('should return only active catalogs', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 1, active: true },
        'cat-2': { type: 'local', path: '/bar', priority: 2, active: false },
        'cat-3': { type: 'local', path: '/baz', priority: 3, active: true },
      },
      installed: {},
    };

    const active = getActiveCatalogs(config);
    expect(active).toHaveLength(2);
    expect(active.map((c) => c.id)).toEqual(['cat-1', 'cat-3']);
  });

  test('should sort catalogs by priority', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 5, active: true },
        'cat-2': { type: 'local', path: '/bar', priority: 1, active: true },
        'cat-3': { type: 'local', path: '/baz', priority: 3, active: true },
      },
      installed: {},
    };

    const active = getActiveCatalogs(config);
    expect(active.map((c) => c.id)).toEqual(['cat-2', 'cat-3', 'cat-1']);
  });
});

describe('addCatalog', () => {
  test('should add catalog to config', () => {
    const config: UserConfig = { catalogs: {}, installed: {} };
    const entry: CatalogEntry = { type: 'local', path: '/foo', priority: 1, active: true };

    addCatalog(config, 'test-catalog', entry);

    expect(config.catalogs['test-catalog']).toBe(entry);
  });
});

describe('removeCatalog', () => {
  test('should remove catalog from config', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 1, active: true },
      },
      installed: {},
    };

    removeCatalog(config, 'cat-1');

    expect(config.catalogs['cat-1']).toBeUndefined();
  });
});

describe('trackInstallation', () => {
  test('should track skill installation', () => {
    const config: UserConfig = { catalogs: {}, installed: {} };

    trackInstallation(config, 'my-skill', 'catalog-a');

    expect(config.installed['my-skill']).toEqual({ catalog: 'catalog-a' });
  });

  test('should overwrite existing tracking', () => {
    const config: UserConfig = {
      catalogs: {},
      installed: {
        'my-skill': { catalog: 'catalog-a' },
      },
    };

    trackInstallation(config, 'my-skill', 'catalog-b');

    expect(config.installed['my-skill']).toEqual({ catalog: 'catalog-b' });
  });
});

describe('untrackInstallation', () => {
  test('should remove skill from tracking', () => {
    const config: UserConfig = {
      catalogs: {},
      installed: {
        'skill-1': { catalog: 'catalog-a' },
        'skill-2': { catalog: 'catalog-b' },
      },
    };

    untrackInstallation(config, 'skill-1');

    expect(config.installed['skill-1']).toBeUndefined();
    expect(config.installed['skill-2']).toBeDefined();
  });
});
