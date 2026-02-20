import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger.js';
import { getOpenCodeSkillsPath, ensureDir } from '../utils/paths.js';
import { computeFileHash } from '../utils/hash.js';
import type { Catalog, Skill } from './schema.js';
import type { UserConfig, CatalogEntry, InstalledSkill } from './config.js';

/**
 * Result of a skill installation attempt
 */
export interface InstallResult {
  action: 'created' | 'updated' | 'skipped';
  skillName: string;
  fullName: string;
  error?: string;
}

/**
 * A skill with its catalog context
 */
export interface SkillWithContext {
  catalogId: string;
  catalogEntry: CatalogEntry;
  catalog: Catalog;
  skillName: string;
  skill: Skill;
}

/**
 * Load a catalog from a local path
 */
export function loadCatalog(catalogPath: string): Catalog {
  const catalogJsonPath = path.join(catalogPath, 'meta', 'catalog.json');
  
  if (!fs.existsSync(catalogJsonPath)) {
    throw new Error(`Catalog not found: ${catalogJsonPath}`);
  }

  const content = fs.readFileSync(catalogJsonPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Build the full skill name for installation
 * Format: <catalog-id>-<skill-name>
 */
export function buildFullSkillName(catalogId: string, skillName: string): string {
  return `${catalogId}-${skillName}`;
}

/**
 * Determine what action to take for a skill
 */
export function determineAction(
  fullSkillName: string,
  catalogSkill: Skill,
  installed: Record<string, InstalledSkill>,
  targetDir: string
): 'create' | 'update' | 'skip' {
  const installedSkill = installed[fullSkillName];
  
  // Not installed yet
  if (!installedSkill) {
    return 'create';
  }

  // Check if directory exists
  const skillDir = path.join(targetDir, fullSkillName);
  if (!fs.existsSync(skillDir)) {
    logger.debug(`Skill ${fullSkillName} tracked but directory missing, recreating`);
    return 'create';
  }

  // Compare hashes
  if (installedSkill.hash !== catalogSkill.hash) {
    logger.debug(`Hash mismatch for ${fullSkillName}: ${installedSkill.hash} -> ${catalogSkill.hash}`);
    return 'update';
  }

  return 'skip';
}

/**
 * Install or update a single skill
 */
export function installSkill(
  skillWithContext: SkillWithContext,
  targetDir: string,
  action: 'create' | 'update'
): void {
  const { catalogId, catalogEntry, skillName, skill } = skillWithContext;
  const fullName = buildFullSkillName(catalogId, skillName);
  
  // Source path (in catalog)
  const sourcePath = path.join(catalogEntry.path, skill.path);
  
  // Validate source exists
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Skill file not found: ${sourcePath}`);
  }

  // Target directory
  const skillDir = path.join(targetDir, fullName);
  ensureDir(skillDir);

  // Target file path
  const targetPath = path.join(skillDir, 'SKILL.md');

  // Copy file
  fs.copyFileSync(sourcePath, targetPath);
  
  logger.debug(`Copied ${sourcePath} -> ${targetPath}`);
}

/**
 * Install skills from catalogs
 */
export async function installSkills(
  config: UserConfig,
  catalogs: Array<{ id: string; entry: CatalogEntry }>,
  skillFilter?: (catalogId: string, skillName: string) => boolean,
  dryRun: boolean = false
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];
  const targetDir = getOpenCodeSkillsPath();

  // Ensure target directory exists (unless dry run)
  if (!dryRun) {
    ensureDir(targetDir);
  }

  logger.debug(`Target directory: ${targetDir}`);

  // Gather all skills from all catalogs
  const skillsToInstall: SkillWithContext[] = [];

  for (const { id: catalogId, entry } of catalogs) {
    try {
      const catalog = loadCatalog(entry.path);
      
      if (!catalog.skills || Object.keys(catalog.skills).length === 0) {
        logger.debug(`No skills in catalog: ${catalogId}`);
        continue;
      }

      for (const [skillName, skill] of Object.entries(catalog.skills)) {
        // Apply filter if provided
        if (skillFilter && !skillFilter(catalogId, skillName)) {
          continue;
        }

        skillsToInstall.push({
          catalogId,
          catalogEntry: entry,
          catalog,
          skillName,
          skill,
        });
      }
    } catch (error) {
      logger.warn(`Failed to load catalog ${catalogId}: ${(error as Error).message}`);
    }
  }

  logger.debug(`Found ${skillsToInstall.length} skills to process`);

  // Process each skill
  for (const skillWithContext of skillsToInstall) {
    const { catalogId, skillName, skill } = skillWithContext;
    const fullName = buildFullSkillName(catalogId, skillName);

    try {
      const action = determineAction(fullName, skill, config.installed, targetDir);

      if (action === 'skip') {
        results.push({ action: 'skipped', skillName, fullName });
        continue;
      }

      if (!dryRun) {
        installSkill(skillWithContext, targetDir, action);
      }

      results.push({
        action: action === 'create' ? 'created' : 'updated',
        skillName,
        fullName,
      });
    } catch (error) {
      results.push({
        action: 'skipped',
        skillName,
        fullName,
        error: (error as Error).message,
      });
    }
  }

  return results;
}

/**
 * Create installed skill tracking record
 */
export function createInstalledRecord(
  catalogId: string,
  skillName: string,
  skill: Skill
): InstalledSkill {
  return {
    catalog: catalogId,
    skillName,
    version: skill.version,
    hash: skill.hash,
    installedAt: new Date().toISOString(),
  };
}
