import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { getConfigPath, getConfigDir, ensureDirAsync } from '../utils/paths.js';
import { logger } from '../utils/logger.js';

export interface CatalogEntry {
  type: 'local' | 'git';
  path?: string;
  url?: string;
  branch?: string;
  priority: number;
  active: boolean;
  lastSynced?: string;
}

export interface InstalledSkill {
  catalog: string;
}

export interface UserConfig {
  catalogs: Record<string, CatalogEntry>;
  installed: Record<string, InstalledSkill>;
}

export async function loadConfig(): Promise<UserConfig> {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    logger.debug('Config file not found, creating default config');
    return {
      catalogs: {},
      installed: {},
    };
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    logger.debug(`Loaded config from ${configPath}`);
    return config;
  } catch (error) {
    logger.error('Failed to parse config file, using default config', error as Error);
    return {
      catalogs: {},
      installed: {},
    };
  }
}

export async function saveConfig(config: UserConfig): Promise<void> {
  const configPath = getConfigPath();
  const configDir = getConfigDir();

  await ensureDirAsync(configDir);

  try {
    await writeFile(configPath, JSON.stringify(config, null, 2));
    logger.debug(`Saved config to ${configPath}`);
  } catch (error) {
    logger.error('Failed to save config file', error as Error);
    throw error;
  }
}

export function addCatalog(config: UserConfig, id: string, entry: CatalogEntry): void {
  config.catalogs[id] = entry;
}

export function removeCatalog(config: UserConfig, id: string): void {
  delete config.catalogs[id];
}

export function getNextPriority(config: UserConfig): number {
  const priorities = Object.values(config.catalogs).map((c) => c.priority);
  return priorities.length === 0 ? 1 : Math.max(...priorities) + 1;
}

export function trackInstallation(config: UserConfig, skillName: string, catalogId: string): void {
  config.installed[skillName] = { catalog: catalogId };
}

export function untrackInstallation(config: UserConfig, skillName: string): void {
  delete config.installed[skillName];
}

export function getActiveCatalogs(config: UserConfig): Array<{ id: string; entry: CatalogEntry }> {
  return Object.entries(config.catalogs)
    .filter(([, entry]) => entry.active)
    .map(([id, entry]) => ({ id, entry }))
    .sort((a, b) => a.entry.priority - b.entry.priority);
}
