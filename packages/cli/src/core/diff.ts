import type { UserConfig, CatalogEntry, InstalledSkill } from './config.js';
import type { Catalog, Skill } from './schema.js';
import { loadCatalog, buildFullSkillName, resolveCatalogPath } from './installer.js';
import { logger } from '../utils/logger.js';
import { getOpenCodeSkillsPath } from '../utils/paths.js';
import { computeFileHash } from '../utils/hash.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Compute hash of an actually installed skill file
 * Returns null if file doesn't exist
 */
function computeActualFileHash(fullSkillName: string): string | null {
  const skillsDir = getOpenCodeSkillsPath();
  const skillPath = path.join(skillsDir, fullSkillName, 'SKILL.md');
  
  if (!fs.existsSync(skillPath)) {
    return null;
  }
  
  try {
    return computeFileHash(skillPath);
  } catch (error) {
    logger.debug(`Failed to compute hash for ${fullSkillName}: ${(error as Error).message}`);
    return null;
  }
}

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
      const catalog = loadCatalog(catalogId, entry);

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

          // Check if hash differs by comparing actual files
          const actualFileHash = computeActualFileHash(fullName);
          const fileMissing = actualFileHash === null;
          
          if (fileMissing) {
            result.updated.push(availableSkill);
          } else {
            // Compute hash of the source file in the catalog
            const catalogPath = resolveCatalogPath(catalogId, entry);
            const sourcePath = path.join(catalogPath, skill.path);
            
            let catalogSourceHash: string | null = null;
            try {
              if (fs.existsSync(sourcePath)) {
                catalogSourceHash = computeFileHash(sourcePath);
              }
            } catch (error) {
              logger.debug(`Failed to compute catalog source hash for ${fullName}: ${(error as Error).message}`);
            }
            
            // Compare actual installed file hash with catalog source file hash
            // If they differ, the catalog has been updated or user modified the file
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
