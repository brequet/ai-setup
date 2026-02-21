import type { UserConfig, CatalogEntry, InstalledSkill } from './config.js';
import { discoverSkills, type DiscoveredSkill } from './discovery.js';
import { resolveCatalogPath } from './installer.js';
import { logger } from '../utils/logger.js';
import { getSkillsDir } from '../utils/paths.js';
import { computeFileHash } from '../utils/hash.js';
import { existsSync } from '../utils/fs-async.js';
import path from 'node:path';

export interface AvailableSkill {
  catalogId: string;
  catalogEntry: CatalogEntry;
  skillName: string;
  skill: DiscoveredSkill;
}

export interface RemovedSkill {
  skillName: string;
  installedSkill: InstalledSkill;
}

export interface DiffResult {
  new: AvailableSkill[];
  updated: AvailableSkill[];
  removed: RemovedSkill[];
  unchanged: AvailableSkill[];
}

async function computeActualFileHash(skillName: string): Promise<string | null> {
  const skillsDir = getSkillsDir();
  const skillPath = path.join(skillsDir, skillName, 'SKILL.md');

  if (!existsSync(skillPath)) {
    return null;
  }

  try {
    return await computeFileHash(skillPath);
  } catch (error) {
    logger.debug(`Failed to compute hash for ${skillName}: ${(error as Error).message}`);
    return null;
  }
}

export async function compareWithCatalog(
  config: UserConfig,
  catalogs: Array<{ id: string; entry: CatalogEntry }>,
): Promise<DiffResult> {
  const result: DiffResult = {
    new: [],
    updated: [],
    removed: [],
    unchanged: [],
  };

  const seenInstalledSkills = new Set<string>();

  for (const { id: catalogId, entry } of catalogs) {
    try {
      const catalogPath = resolveCatalogPath(catalogId, entry);
      const skills = await discoverSkills(catalogPath);

      if (skills.size === 0) {
        logger.debug(`No skills in catalog: ${catalogId}`);
        continue;
      }

      for (const [skillName, skill] of skills) {
        const installedSkill = config.installed[skillName];

        const availableSkill: AvailableSkill = {
          catalogId,
          catalogEntry: entry,
          skillName,
          skill,
        };

        if (!installedSkill) {
          result.new.push(availableSkill);
        } else {
          seenInstalledSkills.add(skillName);

          if (installedSkill.catalog !== catalogId) {
            logger.debug(
              `Skill ${skillName} installed from ${installedSkill.catalog}, not ${catalogId}`,
            );
            continue;
          }

          const actualFileHash = await computeActualFileHash(skillName);
          const fileMissing = actualFileHash === null;

          if (fileMissing) {
            result.updated.push(availableSkill);
          } else {
            let catalogSourceHash: string | null = null;
            try {
              if (existsSync(skill.sourcePath)) {
                catalogSourceHash = await computeFileHash(skill.sourcePath);
              }
            } catch (error) {
              logger.debug(
                `Failed to compute catalog source hash for ${skillName}: ${(error as Error).message}`,
              );
            }

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

export interface DiffSummary {
  hasChanges: boolean;
  newCount: number;
  updatedCount: number;
  removedCount: number;
}

export function getDiffSummary(diff: DiffResult): DiffSummary {
  return {
    hasChanges: diff.new.length > 0 || diff.updated.length > 0 || diff.removed.length > 0,
    newCount: diff.new.length,
    updatedCount: diff.updated.length,
    removedCount: diff.removed.length,
  };
}
