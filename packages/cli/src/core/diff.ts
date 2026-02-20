import type { UserConfig, CatalogEntry, InstalledSkill } from './config.js';
import { discoverSkills, type DiscoveredSkill } from './discovery.js';
import { resolveCatalogPath } from './installer.js';
import { logger } from '../utils/logger.js';
import { getOpenCodeSkillsPath } from '../utils/paths.js';
import { computeFileHash } from '../utils/hash.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * A skill available in a catalog
 */
export interface AvailableSkill {
  catalogId: string;
  catalogEntry: CatalogEntry;
  skillName: string;
  skill: DiscoveredSkill;
}

/**
 * A skill that was removed from catalog
 */
export interface RemovedSkill {
  skillName: string;
  installedSkill: InstalledSkill;
}

/**
 * Comparison result between catalog and installed skills
 */
export interface DiffResult {
  new: AvailableSkill[]; // Skills in catalog but not installed
  updated: AvailableSkill[]; // Skills installed but content changed
  removed: RemovedSkill[]; // Skills installed but no longer in catalog
  unchanged: AvailableSkill[]; // Skills installed and unchanged
}

/**
 * Compute hash of an actually installed skill file
 * Returns null if file doesn't exist
 */
function computeActualFileHash(skillName: string): string | null {
  const skillsDir = getOpenCodeSkillsPath();
  const skillPath = path.join(skillsDir, skillName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    return null;
  }

  try {
    return computeFileHash(skillPath);
  } catch (error) {
    logger.debug(`Failed to compute hash for ${skillName}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Compare catalog skills with installed skills
 */
export function compareWithCatalog(
  config: UserConfig,
  catalogs: Array<{ id: string; entry: CatalogEntry }>,
): DiffResult {
  const result: DiffResult = {
    new: [],
    updated: [],
    removed: [],
    unchanged: [],
  };

  // Track which installed skills we've seen in catalogs
  const seenInstalledSkills = new Set<string>();

  // Check each catalog
  for (const { id: catalogId, entry } of catalogs) {
    try {
      const catalogPath = resolveCatalogPath(catalogId, entry);
      const skills = discoverSkills(catalogPath);

      if (skills.size === 0) {
        logger.debug(`No skills in catalog: ${catalogId}`);
        continue;
      }

      // Check each skill in this catalog
      for (const [skillName, skill] of skills) {
        const installedSkill = config.installed[skillName];

        const availableSkill: AvailableSkill = {
          catalogId,
          catalogEntry: entry,
          skillName,
          skill,
        };

        if (!installedSkill) {
          // Skill exists in catalog but not installed
          result.new.push(availableSkill);
        } else {
          // Skill is installed, mark as seen
          seenInstalledSkills.add(skillName);

          // Check if this skill belongs to this catalog
          if (installedSkill.catalog !== catalogId) {
            // Skill installed from different catalog, skip
            logger.debug(
              `Skill ${skillName} installed from ${installedSkill.catalog}, not ${catalogId}`,
            );
            continue;
          }

          // Check if hash differs by comparing actual files
          const actualFileHash = computeActualFileHash(skillName);
          const fileMissing = actualFileHash === null;

          if (fileMissing) {
            result.updated.push(availableSkill);
          } else {
            // Compute hash of the source file in the catalog
            let catalogSourceHash: string | null = null;
            try {
              if (fs.existsSync(skill.sourcePath)) {
                catalogSourceHash = computeFileHash(skill.sourcePath);
              }
            } catch (error) {
              logger.debug(
                `Failed to compute catalog source hash for ${skillName}: ${(error as Error).message}`,
              );
            }

            // Compare actual installed file hash with catalog source file hash
            // If they differ, the catalog has been updated
            const needsUpdate = catalogSourceHash !== null && actualFileHash !== catalogSourceHash;

            if (needsUpdate) {
              result.updated.push(availableSkill);
            } else {
              result.unchanged.push(availableSkill);
            }
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to load catalog ${catalogId}: ${(error as Error).message}`);
    }
  }

  // Find removed skills (installed but not in any catalog)
  for (const [skillName, installedSkill] of Object.entries(config.installed)) {
    if (!seenInstalledSkills.has(skillName)) {
      result.removed.push({
        skillName,
        installedSkill,
      });
    }
  }

  return result;
}

/**
 * Summary of diff results
 */
export interface DiffSummary {
  hasChanges: boolean;
  newCount: number;
  updatedCount: number;
  removedCount: number;
}

/**
 * Get a summary of the diff for display
 */
export function getDiffSummary(diff: DiffResult): DiffSummary {
  return {
    hasChanges: diff.new.length > 0 || diff.updated.length > 0 || diff.removed.length > 0,
    newCount: diff.new.length,
    updatedCount: diff.updated.length,
    removedCount: diff.removed.length,
  };
}
