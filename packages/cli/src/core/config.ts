import fs from 'node:fs';
import { getUserConfigPath, getConfigDir, ensureDir } from '../utils/paths.js';
import { logger } from '../utils/logger.js';

/**
 * User configuration schema
 */
export interface CatalogEntry {
  type: 'local' | 'git';
  path?: string; // For local catalogs only
  url?: string; // For git catalogs only
  branch?: string; // Git branch (default: 'main')
  priority: number;
  active: boolean;
  lastSynced?: string; // ISO timestamp for git catalogs
}

export interface InstalledSkill {
  catalog: string; // catalog ID (e.g., "brequet/bre-ia-catalog" or "test-catalog")
}

export interface UserConfig {
  catalogs: Record<string, CatalogEntry>;
  installed: Record<string, InstalledSkill>; // key is skill name (e.g., "frontend", "researcher")
}

/**
 * Load user configuration from ~/.config/ai-setup/config.json
 * Creates default config if file doesn't exist
 */
export function loadConfig(): UserConfig {
  const configPath = getUserConfigPath();

  if (!fs.existsSync(configPath)) {
    logger.debug('Config file not found, creating default config');
    return {
      catalogs: {},
      installed: {},
    };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
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

/**
 * Save user configuration to ~/.config/ai-setup/config.json
 */
export function saveConfig(config: UserConfig): void {
  const configPath = getUserConfigPath();
  const configDir = getConfigDir();

  // Ensure config directory exists
  ensureDir(configDir);

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.debug(`Saved config to ${configPath}`);
  } catch (error) {
    logger.error('Failed to save config file', error as Error);
    throw error;
  }
}

/**
 * Add or update a catalog in the configuration
 */
export function addCatalog(config: UserConfig, id: string, entry: CatalogEntry): void {
  config.catalogs[id] = entry;
}

/**
 * Remove a catalog from the configuration
 */
export function removeCatalog(config: UserConfig, id: string): void {
  delete config.catalogs[id];
}

/**
 * Get the next available priority for a new catalog
 */
export function getNextPriority(config: UserConfig): number {
  const priorities = Object.values(config.catalogs).map((c) => c.priority);
  return priorities.length === 0 ? 1 : Math.max(...priorities) + 1;
}

/**
 * Track a skill installation
 */
export function trackInstallation(config: UserConfig, skillName: string, catalogId: string): void {
  config.installed[skillName] = { catalog: catalogId };
}

/**
 * Remove a skill from installed tracking
 */
export function untrackInstallation(config: UserConfig, skillName: string): void {
  delete config.installed[skillName];
}

/**
 * Get all active catalogs sorted by priority
 */
export function getActiveCatalogs(config: UserConfig): Array<{ id: string; entry: CatalogEntry }> {
  return Object.entries(config.catalogs)
    .filter(([_, entry]) => entry.active)
    .map(([id, entry]) => ({ id, entry }))
    .sort((a, b) => a.entry.priority - b.entry.priority);
}
