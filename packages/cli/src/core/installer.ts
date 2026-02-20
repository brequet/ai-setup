import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger.js';
import { getOpenCodeSkillsPath, ensureDir, getCatalogCachePath } from '../utils/paths.js';
import type { UserConfig, CatalogEntry } from './config.js';
import type { DiscoveredSkill } from './discovery.js';

/**
 * Result of a skill installation attempt
 */
export interface InstallResult {
  action: 'created' | 'updated' | 'skipped';
  skillName: string;
  error?: string;
}

/**
 * Resolve catalog path based on entry type
 * - Local catalogs: use path directly
 * - Git catalogs: use cache path
 */
export function resolveCatalogPath(catalogId: string, entry: CatalogEntry): string {
  if (entry.type === 'local') {
    return entry.path!;
  } else if (entry.type === 'git') {
    const cachePath = getCatalogCachePath(catalogId);

    // Validate cache exists
    if (!fs.existsSync(cachePath)) {
      throw new Error(
        `Git catalog cache not found for "${catalogId}". Run 'sync' first or check your internet connection.`,
      );
    }

    return cachePath;
  }

  throw new Error(`Unknown catalog type: ${(entry as any).type}`);
}

/**
 * Check if a skill already exists (for collision detection)
 * Returns: null if not exists, 'catalog' if from catalog, 'custom' if custom skill
 */
export function checkSkillExists(
  skillName: string,
  config: UserConfig,
): { type: 'catalog'; catalogId: string } | { type: 'custom' } | null {
  const skillPath = path.join(getOpenCodeSkillsPath(), skillName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    return null;
  }

  // Check if it's tracked in config
  const installedSkill = config.installed[skillName];
  if (installedSkill) {
    return { type: 'catalog', catalogId: installedSkill.catalog };
  }

  // File exists but not tracked → custom skill
  return { type: 'custom' };
}

/**
 * Install or update a single skill
 * Returns true if installed, false if skipped
 */
export function installSkill(
  catalogId: string,
  catalogPath: string,
  skillName: string,
  skill: DiscoveredSkill,
  targetDir: string,
  _force: boolean = false,
): boolean {
  // Source path (in catalog)
  const sourcePath = skill.sourcePath;

  // Validate source exists
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Skill file not found: ${sourcePath}`);
  }

  // Target directory
  const skillDir = path.join(targetDir, skillName);
  ensureDir(skillDir);

  // Target file path
  const targetPath = path.join(skillDir, 'SKILL.md');

  // Copy file
  fs.copyFileSync(sourcePath, targetPath);

  logger.debug(`Copied ${sourcePath} -> ${targetPath}`);
  return true;
}
