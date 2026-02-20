import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import {
  loadConfig,
  saveConfig,
  addCatalog,
  getNextPriority,
  type CatalogEntry,
  type UserConfig,
  trackInstallation,
} from '../core/config.js';
import { isGitUrl, cloneOrPullCatalog } from '../utils/git.js';
import { getCatalogCachePath, getOpenCodeSkillsPath, ensureDir } from '../utils/paths.js';
import { resolveCatalogPath, checkSkillExists, installSkill } from '../core/installer.js';
import { discoverSkills, extractCatalogId } from '../core/discovery.js';

interface AddOptions {
  name?: string;
  priority?: number;
  inactive?: boolean;
  branch?: string; // For Git catalogs
  yes?: boolean; // Auto-install without prompt
  install?: boolean; // Set to false by --no-install
}

/**
 * Install skills from a specific catalog
 */
async function installSkillsFromCatalog(
  catalogId: string,
  entry: CatalogEntry,
  config: UserConfig,
  autoConfirm: boolean = false,
): Promise<void> {
  const catalogPath = resolveCatalogPath(catalogId, entry);
  const skills = discoverSkills(catalogPath);
  const skillCount = skills.size;

  if (skillCount === 0) {
    return; // No skills to install
  }

  console.log('');
  logger.info('Installing skills...\n');

  const targetDir = getOpenCodeSkillsPath();
  ensureDir(targetDir);

  let successCount = 0;
  let skippedCount = 0;

  for (const [skillName, skill] of skills) {
    try {
      // Check for collisions
      const existing = checkSkillExists(skillName, config);

      if (existing) {
        let shouldOverwrite = autoConfirm;

        if (!autoConfirm) {
          if (existing.type === 'catalog') {
            const answer = await confirm({
              message: `Skill '${skillName}' already installed from catalog '${existing.catalogId}'. Overwrite?`,
              default: false,
            });
            shouldOverwrite = answer;
          } else {
            const answer = await confirm({
              message: `Skill '${skillName}' exists (custom skill). Overwrite with version from '${catalogId}'?`,
              default: false,
            });
            shouldOverwrite = answer;
          }
        }

        if (!shouldOverwrite) {
          console.log(chalk.yellow(`⊘ Skipped ${skillName} (already exists)`));
          skippedCount++;
          continue;
        }
      }

      // Install the skill
      installSkill(catalogId, catalogPath, skillName, skill, targetDir);
      trackInstallation(config, skillName, catalogId);

      console.log(chalk.green(`✓ Created ${skillName}`));
      successCount++;
    } catch (error) {
      console.log(chalk.red(`✖ Failed ${skillName}: ${(error as Error).message}`));
    }
  }

  // Save config with installed skills
  saveConfig(config);

  console.log('');
  if (skippedCount > 0) {
    logger.info(`Skipped: ${skippedCount} skill${skippedCount === 1 ? '' : 's'} (already exists)`);
  }
  logger.success(
    `Done! ${successCount} skill${successCount === 1 ? '' : 's'} installed to ${targetDir}`,
  );
  console.log('');
}

/**
 * Prompt user to install skills after adding catalog
 */
async function promptInstallSkills(
  catalogId: string,
  entry: CatalogEntry,
  config: UserConfig,
  autoConfirm: boolean,
): Promise<void> {
  const catalogPath = resolveCatalogPath(catalogId, entry);
  const skills = discoverSkills(catalogPath);
  const skillCount = skills.size;

  if (skillCount === 0) {
    logger.info('No skills found in catalog');
    return;
  }

  logger.info(`Found ${skillCount} skill${skillCount === 1 ? '' : 's'} in catalog`);

  let shouldInstall = autoConfirm;

  if (!autoConfirm) {
    const answer = await confirm({
      message: `Install ${skillCount} skill${skillCount === 1 ? '' : 's'} now?`,
      default: true,
    });
    shouldInstall = answer;
  }

  if (shouldInstall) {
    await installSkillsFromCatalog(catalogId, entry, config, autoConfirm);
  }
}

/**
 * Add a Git-based catalog
 */
async function addGitCatalog(url: string, options: AddOptions) {
  const config = loadConfig();

  // Extract catalog ID from URL
  const catalogId = extractCatalogId(url);

  // Check if already exists
  if (config.catalogs[catalogId]) {
    logger.error(`Catalog "${catalogId}" is already registered`);
    return;
  }

  const branch = options.branch || 'main';
  const priority = options.priority ?? getNextPriority(config);
  const active = !options.inactive;

  logger.info(`Adding Git catalog: ${catalogId}`);
  logger.info(`  URL: ${url}`);
  logger.info(`  Branch: ${branch}`);
  console.log('');

  try {
    // Clone or pull catalog
    logger.info('Cloning repository...');
    const result = await cloneOrPullCatalog(catalogId, url, branch);

    if (!result.success) {
      throw new Error(result.error || 'Failed to clone repository');
    }

    logger.success('Repository cloned successfully\n');

    // Validate it has a skills directory
    const cachePath = getCatalogCachePath(catalogId);
    const skillsDir = path.join(cachePath, 'skills');
    if (!fs.existsSync(skillsDir)) {
      throw new Error('Catalog does not have a skills/ directory');
    }

    // Discover skills
    const skills = discoverSkills(cachePath);
    logger.info(`Discovered ${skills.size} skill${skills.size === 1 ? '' : 's'}`);

    // Add catalog to config
    const entry: CatalogEntry = {
      type: 'git',
      url,
      branch,
      priority,
      active,
      lastSynced: new Date().toISOString(),
    };

    addCatalog(config, catalogId, entry);
    saveConfig(config);

    logger.success(`Catalog "${catalogId}" added successfully\n`);

    // Prompt to install skills (if enabled)
    if (options.install !== false) {
      await promptInstallSkills(catalogId, entry, config, options.yes || false);
    }
  } catch (error) {
    logger.error(`Failed to add catalog: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Add a local catalog
 */
async function addLocalCatalog(catalogPath: string, options: AddOptions) {
  const config = loadConfig();

  // Resolve absolute path
  const absPath = path.resolve(catalogPath);

  // Validate path exists
  if (!fs.existsSync(absPath)) {
    logger.error(`Path does not exist: ${absPath}`);
    return;
  }

  // Validate it has a skills directory
  const skillsDir = path.join(absPath, 'skills');
  if (!fs.existsSync(skillsDir)) {
    logger.error('Catalog does not have a skills/ directory');
    return;
  }

  // Extract catalog ID from path
  const catalogId = extractCatalogId(absPath);

  // Check if already exists
  if (config.catalogs[catalogId]) {
    logger.error(`Catalog "${catalogId}" is already registered`);
    return;
  }

  const priority = options.priority ?? getNextPriority(config);
  const active = !options.inactive;

  logger.info(`Adding local catalog: ${catalogId}`);
  logger.info(`  Path: ${absPath}`);
  console.log('');

  try {
    // Discover skills
    const skills = discoverSkills(absPath);
    logger.info(`Discovered ${skills.size} skill${skills.size === 1 ? '' : 's'}`);

    // Add catalog to config
    const entry: CatalogEntry = {
      type: 'local',
      path: absPath,
      priority,
      active,
    };

    addCatalog(config, catalogId, entry);
    saveConfig(config);

    logger.success(`Catalog "${catalogId}" added successfully\n`);

    // Prompt to install skills (if enabled)
    if (options.install !== false) {
      await promptInstallSkills(catalogId, entry, config, options.yes || false);
    }
  } catch (error) {
    logger.error(`Failed to add catalog: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Add catalog command
 */
export async function addCommand(catalogPathOrUrl: string, options: AddOptions): Promise<void> {
  try {
    if (isGitUrl(catalogPathOrUrl)) {
      await addGitCatalog(catalogPathOrUrl, options);
    } else {
      await addLocalCatalog(catalogPathOrUrl, options);
    }
  } catch {
    // Error already logged
    process.exit(1);
  }
}
