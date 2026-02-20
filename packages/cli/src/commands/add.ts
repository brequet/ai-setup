import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { loadConfig, saveConfig, addCatalog, getNextPriority, type CatalogEntry, type UserConfig, trackInstallation } from '../core/config.js';
import { CatalogSchema, type Catalog } from '../core/schema.js';
import { isGitUrl, cloneOrPullCatalog } from '../utils/git.js';
import { getCatalogCachePath, getOpenCodeSkillsPath, ensureDir } from '../utils/paths.js';
import { resolveCatalogPath, buildFullSkillName, createInstalledRecord } from '../core/installer.js';
import { computeFileHash } from '../utils/hash.js';

interface AddOptions {
  name?: string;
  priority?: number;
  inactive?: boolean;
  branch?: string;  // For Git catalogs
  yes?: boolean;    // Auto-install without prompt
  install?: boolean;  // Set to false by --no-install
}

/**
 * Install skills from a specific catalog
 */
async function installSkillsFromCatalog(
  catalogId: string,
  entry: CatalogEntry,
  catalog: Catalog,
  config: UserConfig
): Promise<void> {
  const skills = catalog.skills || {};
  const skillCount = Object.keys(skills).length;
  
  if (skillCount === 0) {
    return; // No skills to install
  }
  
  console.log('');
  logger.info('Installing skills...\n');
  
  const targetDir = getOpenCodeSkillsPath();
  ensureDir(targetDir);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [skillName, skill] of Object.entries(skills)) {
    try {
      const fullName = buildFullSkillName(catalogId, skillName);
      const catalogPath = resolveCatalogPath(catalogId, entry);
      
      // Source path (in catalog)
      const sourcePath = path.join(catalogPath, skill.path);
      
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
      
      // Compute actual hash of installed file (not catalog hash which may be outdated)
      const actualHash = computeFileHash(targetPath);
      
      // Track installation with actual file hash
      const installedRecord = createInstalledRecord(catalogId, skillName, skill);
      // Override the catalog hash with the actual installed file hash
      installedRecord.hash = actualHash;
      trackInstallation(config, fullName, installedRecord);
      
      console.log(chalk.green(`✓ Created ${fullName}`));
      successCount++;
    } catch (error) {
      console.log(chalk.red(`✖ Failed ${skillName}: ${(error as Error).message}`));
      errorCount++;
    }
  }
  
  // Save config with installed skills
  saveConfig(config);
  
  console.log('');
  logger.success(`Done! ${successCount} skill${successCount === 1 ? '' : 's'} installed to ${targetDir}`);
  console.log('');
}

/**
 * Prompt user to install skills after adding catalog
 */
async function promptInstallSkills(
  catalogId: string,
  entry: CatalogEntry,
  catalog: Catalog,
  config: UserConfig,
  options: AddOptions
): Promise<void> {
  const skills = catalog.skills || {};
  const skillCount = Object.keys(skills).length;
  
  // No skills to install
  if (skillCount === 0) {
    return;
  }
  
  // Check if we should prompt
  const shouldPrompt = !options.yes && options.install !== false;
  
  if (shouldPrompt) {
    // Show available skills
    console.log('');
    console.log('Available skills:');
    for (const [skillName, skill] of Object.entries(skills)) {
      console.log(`  • ${chalk.cyan(skillName)} - ${skill.description}`);
    }
    console.log('');
    
    // Prompt with choice list
    const choice = await select({
      message: `What would you like to do?`,
      choices: [
        {
          name: `Install all ${skillCount} skill${skillCount === 1 ? '' : 's'} now`,
          value: 'install',
        },
        {
          name: "Skip installation (I'll do it manually later)",
          value: 'skip',
        },
      ],
      default: 'install',
    });
    
    if (choice === 'install') {
      await installSkillsFromCatalog(catalogId, entry, catalog, config);
    } else {
      console.log('');
      console.log('Skipped skill installation.');
      console.log('');
      logger.info('Next steps:');
      logger.info('  - List catalogs:    bre-ai-setup list');
      logger.info('  - Install skills:   bre-ai-setup skills --all');
      console.log('');
    }
  } else if (options.yes) {
    // Auto-install without prompt
    await installSkillsFromCatalog(catalogId, entry, catalog, config);
  } else if (options.install === false) {
    // Skip installation silently (--no-install flag)
    console.log('');
    logger.info('Next steps:');
    logger.info('  - List catalogs:    bre-ai-setup list');
    logger.info('  - Install skills:   bre-ai-setup skills --all');
    console.log('');
  }
}

export async function add(catalogInput: string, options: AddOptions = {}) {
  logger.info('Adding catalog...\n');

  const isGit = isGitUrl(catalogInput);
  
  if (isGit) {
    // Git-based catalog
    await addGitCatalog(catalogInput, options);
  } else {
    // Local catalog
    await addLocalCatalog(catalogInput, options);
  }
}

/**
 * Add a Git-based catalog
 */
async function addGitCatalog(url: string, options: AddOptions) {
  logger.info(`Cloning Git catalog from ${url}...\n`);
  
  const branch = options.branch || 'main';
  
  // Clone to temporary ID first (we'll rename after reading catalog.json)
  const tempId = `temp-${Date.now()}`;
  const result = await cloneOrPullCatalog(tempId, url, branch);
  
  if (!result.success) {
    logger.error('Failed to clone catalog:');
    console.error(`  ${result.error}`);
    process.exit(1);
  }
  
  // Read catalog.json to get the real catalog ID
  const tempPath = getCatalogCachePath(tempId);
  const catalogJsonPath = path.join(tempPath, 'meta', 'catalog.json');
  
  if (!fs.existsSync(catalogJsonPath)) {
    logger.error('Invalid catalog: meta/catalog.json not found');
    logger.info(`Expected: ${catalogJsonPath}`);
    
    // Cleanup temp directory
    fs.rmSync(tempPath, { recursive: true, force: true });
    process.exit(1);
  }
  
  // Parse and validate catalog
  let catalog: Catalog;
  try {
    const content = fs.readFileSync(catalogJsonPath, 'utf-8');
    const rawCatalog = JSON.parse(content);
    const parseResult = CatalogSchema.safeParse(rawCatalog);

    if (!parseResult.success) {
      logger.error('Invalid catalog.json:');
      parseResult.error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      // Cleanup temp directory
      fs.rmSync(tempPath, { recursive: true, force: true });
      process.exit(1);
    }

    catalog = parseResult.data;
  } catch (error) {
    logger.error('Failed to parse catalog.json', error as Error);
    
    // Cleanup temp directory
    fs.rmSync(tempPath, { recursive: true, force: true });
    process.exit(1);
  }
  
  const catalogId = catalog.id;
  
  // Load user config
  const config = loadConfig();
  
  // Check if catalog is already registered
  if (catalogId in config.catalogs) {
    // Cleanup temp directory
    fs.rmSync(tempPath, { recursive: true, force: true });
    
    logger.info(`Catalog "${catalogId}" is already registered.`);
    console.log('');
    logger.info('To update the catalog, use: bre-ai-setup sync');
    console.log('');
    process.exit(0);
  }
  
  // Rename temp directory to actual catalog ID
  const finalPath = getCatalogCachePath(catalogId);
  
  if (fs.existsSync(finalPath)) {
    // Remove old cache if exists
    fs.rmSync(finalPath, { recursive: true, force: true });
  }
  
  fs.renameSync(tempPath, finalPath);

  // Determine priority
  const priority = options.priority ?? getNextPriority(config);

  // Create catalog entry
  const entry: CatalogEntry = {
    type: 'git',
    url,
    branch,
    priority,
    active: !options.inactive,
    lastSynced: new Date().toISOString(),
  };

  // Add to config
  addCatalog(config, catalogId, entry);
  saveConfig(config);

  // Success output
  console.log('');
  logger.success('Catalog added!');
  console.log('');
  logger.info(`ID:       ${catalogId}`);
  logger.info(`Name:     ${catalog.name}`);
  logger.info(`Version:  ${catalog.version}`);
  logger.info(`Type:     git`);
  logger.info(`URL:      ${url}`);
  logger.info(`Branch:   ${branch}`);
  logger.info(`Priority: ${priority}`);
  logger.info(`Status:   ${entry.active ? 'active' : 'inactive'}`);
  
  const skillCount = Object.keys(catalog.skills || {}).length;
  if (skillCount > 0) {
    logger.info(`Skills:   ${skillCount} available`);
  }

  // Prompt to install skills
  await promptInstallSkills(catalogId, entry, catalog, config, options);
}

/**
 * Add a local catalog
 */
async function addLocalCatalog(catalogPath: string, options: AddOptions) {
  // Resolve to absolute path
  const absolutePath = path.resolve(catalogPath);
  
  // Validate catalog path exists
  if (!fs.existsSync(absolutePath)) {
    logger.error(`Catalog path does not exist: ${absolutePath}`);
    process.exit(1);
  }

  // Check if it's a directory
  const stats = fs.statSync(absolutePath);
  if (!stats.isDirectory()) {
    logger.error(`Path is not a directory: ${absolutePath}`);
    process.exit(1);
  }

  // Look for meta/catalog.json
  const catalogJsonPath = path.join(absolutePath, 'meta', 'catalog.json');
  if (!fs.existsSync(catalogJsonPath)) {
    logger.error('Invalid catalog: meta/catalog.json not found');
    logger.info(`Expected: ${catalogJsonPath}`);
    process.exit(1);
  }

  // Parse and validate catalog
  let catalog: Catalog;
  try {
    const content = fs.readFileSync(catalogJsonPath, 'utf-8');
    const rawCatalog = JSON.parse(content);
    const result = CatalogSchema.safeParse(rawCatalog);

    if (!result.success) {
      logger.error('Invalid catalog.json:');
      result.error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }

    catalog = result.data;
  } catch (error) {
    logger.error('Failed to parse catalog.json', error as Error);
    process.exit(1);
  }

  // Load user config
  const config = loadConfig();

  // Determine catalog ID (from catalog.json, cannot be overridden)
  const catalogId = catalog.id;

  // Check if catalog is already registered
  if (catalogId in config.catalogs) {
    logger.info(`Catalog "${catalogId}" is already registered.`);
    console.log('');
    logger.info('To re-register, first remove it with: bre-ai-setup remove');
    console.log('');
    process.exit(0);
  }

  // Determine priority
  const priority = options.priority ?? getNextPriority(config);

  // Create catalog entry
  const entry: CatalogEntry = {
    type: 'local',
    path: absolutePath,
    priority,
    active: !options.inactive,
  };

  // Add to config
  addCatalog(config, catalogId, entry);
  saveConfig(config);

  // Success output
  console.log('');
  logger.success('Catalog added!');
  console.log('');
  logger.info(`ID:       ${catalogId}`);
  logger.info(`Name:     ${catalog.name}`);
  logger.info(`Version:  ${catalog.version}`);
  logger.info(`Type:     local`);
  logger.info(`Path:     ${absolutePath}`);
  logger.info(`Priority: ${priority}`);
  logger.info(`Status:   ${entry.active ? 'active' : 'inactive'}`);
  
  const skillCount = Object.keys(catalog.skills || {}).length;
  if (skillCount > 0) {
    logger.info(`Skills:   ${skillCount} available`);
  }

  // Prompt to install skills
  await promptInstallSkills(catalogId, entry, catalog, config, options);
}
