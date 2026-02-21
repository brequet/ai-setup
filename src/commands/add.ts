import path from 'node:path';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { ValidationError, GitError } from '../utils/errors.js';
import { DEFAULT_GIT_BRANCH } from '../utils/constants.js';
import {
  loadConfig,
  saveConfig,
  addCatalog,
  getNextPriority,
  type CatalogEntry,
} from '../core/config.js';
import { isGitUrl, cloneOrPullCatalog } from '../utils/git.js';
import { getCatalogCachePath, getSkillsDir } from '../utils/paths.js';
import { resolveCatalogPath, installSkillsBatch } from '../core/installer.js';
import { discoverSkills, extractCatalogId } from '../core/discovery.js';
import {
  validatePathExists,
  validateSkillsDirectory,
  validateCatalogNotRegistered,
} from '../core/validation.js';

interface AddOptions {
  name?: string;
  priority?: number;
  inactive?: boolean;
  branch?: string;
  yes?: boolean;
  install?: boolean;
}

async function promptInstallSkills(
  catalogId: string,
  entry: CatalogEntry,
  autoConfirm: boolean,
): Promise<void> {
  const config = await loadConfig();
  const catalogPath = resolveCatalogPath(catalogId, entry);
  const skills = await discoverSkills(catalogPath);
  const skillCount = skills.size;

  if (skillCount === 0) {
    logger.info('No skills found in catalog');
    return;
  }

  let shouldInstall = autoConfirm;

  if (!autoConfirm) {
    shouldInstall = await confirm({
      message: `Found ${skillCount} skill${skillCount === 1 ? '' : 's'}. Install now?`,
      default: true,
    });
  } else {
    logger.info(`Found ${skillCount} skill${skillCount === 1 ? '' : 's'} in catalog`);
  }

  if (!shouldInstall) {
    return;
  }

  logger.blank();
  logger.info('Installing skills...');
  logger.blank();

  const availableSkills = Array.from(skills.entries()).map(([skillName, skill]) => ({
    catalogId,
    catalogEntry: entry,
    skillName,
    skill,
  }));

  const results = await installSkillsBatch(availableSkills, config, {
    skipPrompts: autoConfirm,
  });

  for (const result of results) {
    if (result.error) {
      logger.print(chalk.red(`✖ Failed ${result.skillName}: ${result.error}`));
    } else if (result.action === 'skipped') {
      logger.print(chalk.yellow(`⊘ Skipped ${result.skillName} (already exists)`));
    } else {
      logger.print(
        chalk.green(`✓ ${result.action === 'created' ? 'Created' : 'Updated'} ${result.skillName}`),
      );
    }
  }

  await saveConfig(config);

  const successCount = results.filter((r) => r.action !== 'skipped' && !r.error).length;
  const skippedCount = results.filter((r) => r.action === 'skipped').length;

  logger.blank();
  if (skippedCount > 0) {
    logger.info(`Skipped: ${skippedCount} skill${skippedCount === 1 ? '' : 's'} (already exists)`);
  }
  logger.success(
    `Done! ${successCount} skill${successCount === 1 ? '' : 's'} installed to ${getSkillsDir()}`,
  );
  logger.blank();
}

async function addGitCatalog(url: string, options: AddOptions): Promise<void> {
  const config = await loadConfig();

  let normalizedUrl = normalizeUrl(url);
  const catalogId = extractCatalogId(normalizedUrl);

  const validation = validateCatalogNotRegistered(catalogId, config);
  if (!validation.valid) {
    throw new ValidationError(validation.error!);
  }

  const branch = options.branch || DEFAULT_GIT_BRANCH;
  const priority = options.priority ?? getNextPriority(config);
  const active = !options.inactive;

  logger.info(`Adding Git catalog: ${catalogId}`);
  logger.info(`  URL: ${normalizedUrl}`);
  logger.info(`  Branch: ${branch}`);
  logger.blank();

  const spinner = logger.spinner('Cloning repository...');
  const result = await cloneOrPullCatalog(catalogId, normalizedUrl, branch);

  if (!result.success) {
    spinner.fail('Failed to clone repository');
    throw new GitError(result.error || 'Failed to clone repository');
  }

  spinner.succeed('Repository cloned successfully');
  logger.blank();

  const cachePath = getCatalogCachePath(catalogId);
  const validation2 = validateSkillsDirectory(cachePath);
  if (!validation2.valid) {
    throw new ValidationError(validation2.error!);
  }

  const skills = await discoverSkills(cachePath);
  logger.info(`Discovered ${skills.size} skill${skills.size === 1 ? '' : 's'}`);

  const entry: CatalogEntry = {
    type: 'git',
    url: normalizedUrl,
    branch,
    priority,
    active,
    lastSynced: new Date().toISOString(),
  };

  addCatalog(config, catalogId, entry);
  await saveConfig(config);

  logger.success(`Catalog "${catalogId}" added successfully`);
  logger.blank();

  if (options.install !== false) {
    await promptInstallSkills(catalogId, entry, options.yes || false);
  }
}

async function addLocalCatalog(catalogPath: string, options: AddOptions): Promise<void> {
  const config = await loadConfig();
  const absPath = path.resolve(catalogPath);

  const pathValidation = validatePathExists(absPath);
  if (!pathValidation.valid) {
    throw new ValidationError(pathValidation.error!);
  }

  const skillsDirValidation = validateSkillsDirectory(absPath);
  if (!skillsDirValidation.valid) {
    throw new ValidationError(skillsDirValidation.error!);
  }

  const catalogId = extractCatalogId(absPath);

  const catalogValidation = validateCatalogNotRegistered(catalogId, config);
  if (!catalogValidation.valid) {
    throw new ValidationError(catalogValidation.error!);
  }

  const priority = options.priority ?? getNextPriority(config);
  const active = !options.inactive;

  logger.info(`Adding local catalog: ${catalogId}`);
  logger.info(`  Path: ${absPath}`);
  logger.blank();

  const skills = await discoverSkills(absPath);
  logger.info(`Discovered ${skills.size} skill${skills.size === 1 ? '' : 's'}`);

  const entry: CatalogEntry = {
    type: 'local',
    path: absPath,
    priority,
    active,
  };

  addCatalog(config, catalogId, entry);
  await saveConfig(config);

  logger.success(`Catalog "${catalogId}" added successfully`);
  logger.blank();

  if (options.install !== false) {
    await promptInstallSkills(catalogId, entry, options.yes || false);
  }
}

export async function addCommand(catalogPathOrUrl: string, options: AddOptions): Promise<void> {
  if (isGitUrl(catalogPathOrUrl)) {
    await addGitCatalog(catalogPathOrUrl, options);
  } else {
    await addLocalCatalog(catalogPathOrUrl, options);
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!/^(https?:\/\/|git:\/\/|git@|ssh:\/\/)/i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  if (!normalized.endsWith('.git')) {
    normalized = `${normalized}.git`;
  }
  return normalized;
}
