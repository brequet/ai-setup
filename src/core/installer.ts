import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { getSkillsDir, getCatalogCachePath } from '../utils/paths.js';
import { existsSync, ensureDirAsync, copyFileAsync } from '../utils/fs-async.js';
import { FileSystemError } from '../utils/errors.js';
import type { UserConfig, CatalogEntry } from './config.js';
import type { DiscoveredSkill } from './discovery.js';
import type { AvailableSkill } from './diff.js';
import { trackInstallation } from './config.js';

export interface InstallOptions {
  force?: boolean;
  skipPrompts?: boolean;
  onProgress?: (skill: string, status: 'install' | 'skip' | 'error') => void;
}

export interface InstallResult {
  skillName: string;
  action: 'created' | 'updated' | 'skipped';
  error?: string;
}

export function resolveCatalogPath(catalogId: string, entry: CatalogEntry): string {
  if (entry.type === 'local') {
    return entry.path!;
  } else if (entry.type === 'git') {
    const cachePath = getCatalogCachePath(catalogId);

    if (!existsSync(cachePath)) {
      throw new FileSystemError(
        `Git catalog cache not found for "${catalogId}". Run 'sync' first or check your internet connection.`,
      );
    }

    return cachePath;
  }

  throw new Error(`Unknown catalog type: ${(entry as any).type}`);
}

export function checkSkillExists(
  skillName: string,
  config: UserConfig,
): { type: 'catalog'; catalogId: string } | { type: 'custom' } | null {
  const skillPath = path.join(getSkillsDir(), skillName, 'SKILL.md');

  if (!existsSync(skillPath)) {
    return null;
  }

  const installedSkill = config.installed[skillName];
  if (installedSkill) {
    return { type: 'catalog', catalogId: installedSkill.catalog };
  }

  return { type: 'custom' };
}

export async function installSkill(
  skillName: string,
  skill: DiscoveredSkill,
  targetDir: string,
): Promise<void> {
  const sourcePath = skill.sourcePath;

  if (!existsSync(sourcePath)) {
    throw new FileSystemError(`Skill file not found: ${sourcePath}`);
  }

  const skillDir = path.join(targetDir, skillName);
  await ensureDirAsync(skillDir);

  const targetPath = path.join(skillDir, 'SKILL.md');
  await copyFileAsync(sourcePath, targetPath);

  logger.debug(`Copied ${sourcePath} -> ${targetPath}`);
}

export async function installSkillsBatch(
  skills: AvailableSkill[],
  config: UserConfig,
  options: InstallOptions = {},
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];
  const targetDir = getSkillsDir();

  await ensureDirAsync(targetDir);

  for (const availableSkill of skills) {
    const { catalogId, skillName, skill } = availableSkill;

    try {
      const existing = checkSkillExists(skillName, config);

      if (existing && !options.force) {
        let shouldOverwrite = options.skipPrompts || false;

        if (!shouldOverwrite) {
          const message =
            existing.type === 'catalog'
              ? `Skill '${skillName}' already installed from catalog '${existing.catalogId}'. Overwrite?`
              : `Skill '${skillName}' exists (custom skill). Overwrite with version from '${catalogId}'?`;

          shouldOverwrite = await confirm({ message, default: false });
        }

        if (!shouldOverwrite) {
          results.push({ skillName, action: 'skipped' });
          options.onProgress?.(skillName, 'skip');
          continue;
        }
      }

      const action = existing ? 'updated' : 'created';

      await installSkill(skillName, skill, targetDir);
      trackInstallation(config, skillName, catalogId);

      results.push({ skillName, action });
      options.onProgress?.(skillName, 'install');
    } catch (error) {
      results.push({
        skillName,
        action: 'skipped',
        error: (error as Error).message,
      });
      options.onProgress?.(skillName, 'error');
    }
  }

  return results;
}
