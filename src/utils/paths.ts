import os from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

let testOverrides: { skillsDir?: string; configDir?: string } | null = null;

export function __setTestPaths(overrides: { skillsDir?: string; configDir?: string }): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__setTestPaths can only be called in test environment');
  }
  testOverrides = overrides;
}

export function __clearTestPaths(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__clearTestPaths can only be called in test environment');
  }
  testOverrides = null;
}

export function getHomeDir(): string {
  return os.homedir();
}

export function getConfigDir(): string {
  if (testOverrides?.configDir) return testOverrides.configDir;
  return path.join(getHomeDir(), '.config', 'ai-setup');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function tryDetectSkillsDir(): string | null {
  const homeDir = getHomeDir();

  const candidates = [
    path.join(homeDir, '.config', 'opencode', 'skills'),
    path.join(
      process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
      'opencode',
      'skills',
    ),
    path.join(
      process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'),
      'opencode',
      'skills',
    ),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function getDefaultSkillsDir(): string {
  const homeDir = getHomeDir();
  return path.join(homeDir, '.config', 'opencode', 'skills');
}

export function getSkillsDir(): string {
  if (testOverrides?.skillsDir) return testOverrides.skillsDir;
  return tryDetectSkillsDir() || getDefaultSkillsDir();
}

export function getCatalogCacheDir(): string {
  return path.join(getConfigDir(), '.cache');
}

export function getCatalogCachePath(catalogId: string): string {
  const sanitized = catalogId.replace(/\//g, '-').replace(/\\/g, '-');
  return path.join(getCatalogCacheDir(), sanitized);
}

export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdir(dirPath, { recursive: true });
  }
}

export async function ensureDirAsync(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}
