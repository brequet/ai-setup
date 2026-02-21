import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createTestEnv, type TestEnv } from '../helpers/test-env.js';
import { getFixturePath } from '../helpers/fixtures.js';
import { addCommand } from '../../src/commands/add.js';
import { loadConfig } from '../../src/core/config.js';

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
  select: vi.fn(),
  checkbox: vi.fn(),
  input: vi.fn(),
}));

describe('skill installation', () => {
  let testEnv: TestEnv;

  beforeEach(() => {
    testEnv = createTestEnv();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  test('should install skills when adding catalog with --yes flag', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: true,
    });

    const skillAlphaPath = path.join(testEnv.skillsDir, 'skill-alpha', 'SKILL.md');
    const skillBetaPath = path.join(testEnv.skillsDir, 'skill-beta', 'SKILL.md');

    expect(existsSync(skillAlphaPath)).toBe(true);
    expect(existsSync(skillBetaPath)).toBe(true);
  });

  test('should track installed skills in config', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: true,
    });

    const config = await loadConfig();

    expect(config.installed['skill-alpha']).toBeDefined();
    expect(config.installed['skill-alpha'].catalog).toBe('catalog-a');
    expect(config.installed['skill-beta']).toBeDefined();
    expect(config.installed['skill-beta'].catalog).toBe('catalog-a');
  });

  test('should not install skills when install flag is false', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: false,
    });

    const skillAlphaPath = path.join(testEnv.skillsDir, 'skill-alpha', 'SKILL.md');

    expect(existsSync(skillAlphaPath)).toBe(false);

    const config = await loadConfig();
    expect(config.installed['skill-alpha']).toBeUndefined();
  });

  test('should install skills from multiple catalogs', async () => {
    const catalogAPath = getFixturePath('catalog-a');
    const catalogBPath = getFixturePath('catalog-b');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    await addCommand(catalogBPath, {
      yes: true,
      install: true,
    });

    const config = await loadConfig();

    expect(config.installed['skill-alpha'].catalog).toBe('catalog-b');
    expect(config.installed['skill-beta'].catalog).toBe('catalog-a');
    expect(config.installed['skill-gamma'].catalog).toBe('catalog-b');
  });
});
