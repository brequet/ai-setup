import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestEnv, type TestEnv } from '../helpers/test-env.js';
import { getFixturePath } from '../helpers/fixtures.js';
import { addCommand } from '../../src/commands/add.js';
import { loadConfig } from '../../src/core/config.js';

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn(),
  checkbox: vi.fn(),
  input: vi.fn(),
}));

describe('catalog add - local catalog', () => {
  let testEnv: TestEnv;

  beforeEach(() => {
    testEnv = createTestEnv();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  test('should add local catalog to config', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: false,
    });

    const config = await loadConfig();

    expect(config.catalogs['catalog-a']).toBeDefined();
    expect(config.catalogs['catalog-a'].type).toBe('local');
    expect(config.catalogs['catalog-a'].path).toBe(catalogPath);
    expect(config.catalogs['catalog-a'].active).toBe(true);
    expect(config.catalogs['catalog-a'].priority).toBe(1);
  });

  test('should assign correct priority to second catalog', async () => {
    const catalogAPath = getFixturePath('catalog-a');
    const catalogBPath = getFixturePath('catalog-b');

    await addCommand(catalogAPath, {
      yes: true,
      install: false,
    });

    await addCommand(catalogBPath, {
      yes: true,
      install: false,
    });

    const config = await loadConfig();

    expect(config.catalogs['catalog-a'].priority).toBe(1);
    expect(config.catalogs['catalog-b'].priority).toBe(2);
  });

  test('should set catalog as inactive when --inactive flag is used', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: false,
      inactive: true,
    });

    const config = await loadConfig();

    expect(config.catalogs['catalog-a'].active).toBe(false);
  });

  test('should reject catalog with invalid path', async () => {
    const invalidPath = getFixturePath('non-existent-catalog');

    await expect(
      addCommand(invalidPath, {
        yes: true,
        install: false,
      }),
    ).rejects.toThrow();
  });

  test('should reject catalog without skills directory', async () => {
    const invalidCatalogPath = getFixturePath('catalog-invalid');

    await expect(
      addCommand(invalidCatalogPath, {
        yes: true,
        install: false,
      }),
    ).rejects.toThrow();
  });

  test('should reject duplicate catalog registration', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: false,
    });

    await expect(
      addCommand(catalogPath, {
        yes: true,
        install: false,
      }),
    ).rejects.toThrow();
  });
});
