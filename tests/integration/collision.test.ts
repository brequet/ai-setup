import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createTestEnv, type TestEnv } from '../helpers/test-env.js';
import { getFixturePath } from '../helpers/fixtures.js';
import { addCommand } from '../../src/commands/add.js';
import { loadConfig } from '../../src/core/config.js';
import { checkSkillExists } from '../../src/core/installer.js';

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
  select: vi.fn(),
  checkbox: vi.fn(),
  input: vi.fn(),
}));

describe('skill collision handling', () => {
  let testEnv: TestEnv;

  beforeEach(() => {
    testEnv = createTestEnv();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  test('should detect when skill already exists from another catalog', async () => {
    const catalogAPath = getFixturePath('catalog-a');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    const config = await loadConfig();
    const existing = checkSkillExists('skill-alpha', config);

    expect(existing).toEqual({ type: 'catalog', catalogId: 'catalog-a' });
  });

  test('should overwrite skill when user confirms (force mode)', async () => {
    const catalogAPath = getFixturePath('catalog-a');
    const catalogBPath = getFixturePath('catalog-b');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    let config = await loadConfig();
    expect(config.installed['skill-alpha'].catalog).toBe('catalog-a');

    await addCommand(catalogBPath, {
      yes: true,
      install: true,
    });

    config = await loadConfig();
    expect(config.installed['skill-alpha'].catalog).toBe('catalog-b');

    const skillPath = path.join(testEnv.skillsDir, 'skill-alpha', 'SKILL.md');
    const content = await readFile(skillPath, 'utf-8');

    expect(content).toContain('Catalog B Version');
  });

  test('should skip skill installation when user declines overwrite', async () => {
    const catalogAPath = getFixturePath('catalog-a');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    let config = await loadConfig();
    expect(config.installed['skill-alpha'].catalog).toBe('catalog-a');

    const skillPath = path.join(testEnv.skillsDir, 'skill-alpha', 'SKILL.md');
    const contentBefore = await readFile(skillPath, 'utf-8');
    expect(contentBefore).toContain('skill-alpha');
    expect(contentBefore).not.toContain('Catalog B Version');
  });

  test('should install non-conflicting skills from second catalog', async () => {
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
    expect(config.installed['skill-gamma'].catalog).toBe('catalog-b');
  });
});
