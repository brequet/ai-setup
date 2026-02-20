import type { UserConfig, CatalogEntry, InstalledSkill } from './config.js';
import type { Catalog, Skill } from './schema.js';
import { loadCatalog, buildFullSkillName } from './installer.js';
import { logger } from '../utils/logger.js';

/**
 * A skill available in a catalog
 */
export interface AvailableSkill {
  catalogId: string;
  catalogEntry: CatalogEntry;
  skillName: string;
  skill: Skill;
  fullName: string;
}

/**
 * Comparison result between catalog and installed skills
 */
export interface CatalogDiff {
  new: AvailableSkill[];        // In catalog, not installed
  updated: AvailableSkill[];    // Installed but hash differs
  unchanged: AvailableSkill[];  // Installed and hash matches
  removed: InstalledSkill[];    // Installed but not in any catalog
}

/**
 * Compare installed skills with catalog state
 * Returns what's new, updated, unchanged, and removed
 */
export function compareWithCatalog(
  config: UserConfig,
  catalogs: Array<{ id: string; entry: CatalogEntry }>
): CatalogDiff {
  const result: CatalogDiff = {
    new: [],
    updated: [],
    unchanged: [],
    removed: [],
  };

  // Track which installed skills we've seen in catalogs
  const seenInstalledSkills = new Set<string>();

  // Build map of available skills from all catalogs
  for (const { id: catalogId, entry } of catalogs) {
    try {
      const catalog = loadCatalog(entry.path);

      if (!catalog.skills || Object.keys(catalog.skills).length === 0) {
        logger.debug(`No skills in catalog: ${catalogId}`);
        continue;
      }

      // Check each skill in this catalog
      for (const [skillName, skill] of Object.entries(catalog.skills)) {
        const fullName = buildFullSkillName(catalogId, skillName);
        const installedSkill = config.installed[fullName];

        const availableSkill: AvailableSkill = {
          catalogId,
          catalogEntry: entry,
          skillName,
          skill,
          fullName,
        };

        if (!installedSkill) {
          // Skill exists in catalog but not installed
          result.new.push(availableSkill);
        } else {
          // Skill is installed, mark as seen
          seenInstalledSkills.add(fullName);

          // Check if hash differs
          if (installedSkill.hash !== skill.hash) {
            result.updated.push(availableSkill);
          } else {
            result.unchanged.push(availableSkill);
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to load catalog ${catalogId}: ${(error as Error).message}`);
    }
  }

  // Find removed skills (installed but not in any catalog)
  for (const [fullName, installedSkill] of Object.entries(config.installed)) {
    if (!seenInstalledSkills.has(fullName)) {
      result.removed.push(installedSkill);
    }
  }

  return result;
}

/**
 * Get a summary of the diff for display
 */
export function getDiffSummary(diff: CatalogDiff): {
  hasChanges: boolean;
  newCount: number;
  updatedCount: number;
  removedCount: number;
  totalChanges: number;
} {
  const newCount = diff.new.length;
  const updatedCount = diff.updated.length;
  const removedCount = diff.removed.length;
  const totalChanges = newCount + updatedCount + removedCount;

  return {
    hasChanges: totalChanges > 0,
    newCount,
    updatedCount,
    removedCount,
    totalChanges,
  };
}
