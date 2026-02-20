import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { loadConfig, saveConfig, getActiveCatalogs, trackInstallation, untrackInstallation } from '../core/config.js';
import { installSkills, createInstalledRecord, loadCatalog, buildFullSkillName } from '../core/installer.js';
import { getOpenCodeSkillsPath } from '../utils/paths.js';
import { compareWithCatalog, getDiffSummary } from '../core/diff.js';
import fs from 'node:fs';
import path from 'node:path';

interface SkillsOptions {
  all?: boolean;
  select?: string;
  catalog?: string;
  dryRun?: boolean;
  force?: boolean;
  yes?: boolean;  // Skip confirmations
}

/**
 * Interactive mode: Show changes and prompt for confirmation
 */
async function interactiveMode(options: SkillsOptions) {
  const config = loadConfig();
  const activeCatalogs = getActiveCatalogs(config);

  if (activeCatalogs.length === 0) {
    logger.error('No catalogs registered');
    logger.info('Add a catalog first: npx @bre/ai-setup add <catalog-path>');
    process.exit(1);
  }

  // Compare catalog with installed skills
  console.log(chalk.dim('Checking for updates...\n'));
  const diff = compareWithCatalog(config, activeCatalogs);
  const summary = getDiffSummary(diff);

  // No changes detected
  if (!summary.hasChanges) {
    console.log(chalk.green('✓ Everything is up to date!'));
    console.log('');
    logger.info(`Installed: ${diff.unchanged.length} skill${diff.unchanged.length === 1 ? '' : 's'}`);
    console.log('');
    return;
  }

  // Show summary
  console.log(chalk.bold('Changes detected:'));
  if (summary.newCount > 0) {
    console.log(chalk.green(`  • ${summary.newCount} new skill${summary.newCount === 1 ? '' : 's'} available`));
  }
  if (summary.updatedCount > 0) {
    console.log(chalk.blue(`  • ${summary.updatedCount} skill${summary.updatedCount === 1 ? '' : 's'} updated`));
  }
  if (summary.removedCount > 0) {
    console.log(chalk.yellow(`  • ${summary.removedCount} skill${summary.removedCount === 1 ? '' : 's'} removed from catalog`));
  }
  console.log('');

  // Show new skills
  if (diff.new.length > 0) {
    console.log(chalk.bold('New skills:'));
    for (const skill of diff.new) {
      console.log(chalk.green(`  + ${skill.skillName}`) + chalk.dim(` - ${skill.skill.description}`));
    }
    console.log('');
  }

  // Show updated skills
  if (diff.updated.length > 0) {
    console.log(chalk.bold('Updates available:'));
    for (const skill of diff.updated) {
      console.log(chalk.blue(`  ↻ ${skill.skillName}`) + chalk.dim(' - Content updated'));
    }
    console.log('');
  }

  // Handle removed skills
  let shouldRemoveOrphaned = false;
  if (diff.removed.length > 0) {
    console.log(chalk.bold('Removed from catalog:'));
    for (const skill of diff.removed) {
      console.log(chalk.yellow(`  - ${skill.skillName}`) + chalk.dim(' - No longer in any catalog'));
    }
    console.log('');

    // Ask what to do with removed skills
    const removeAction = await select({
      message: 'Skills removed from catalog. What would you like to do?',
      choices: [
        { name: 'Keep installed (do nothing)', value: 'keep' },
        { name: 'Uninstall all removed skills', value: 'remove' },
      ],
      default: 'keep',
    });

    shouldRemoveOrphaned = removeAction === 'remove';
  }

  // Ask for confirmation (unless --yes flag)
  let shouldInstall = options.yes || false;
  
  if (!shouldInstall) {
    const hasInstallableChanges = summary.newCount > 0 || summary.updatedCount > 0;
    
    if (hasInstallableChanges) {
      shouldInstall = await confirm({
        message: 'Install updates?',
        default: true,
      });
    }
  }

  if (!shouldInstall && !shouldRemoveOrphaned) {
    console.log(chalk.dim('No changes made'));
    console.log('');
    return;
  }

  console.log('');

  // Install/update skills
  if (shouldInstall && (summary.newCount > 0 || summary.updatedCount > 0)) {
    const targetDir = getOpenCodeSkillsPath();
    
    // Combine new and updated skills for installation
    const skillsToInstall = [...diff.new, ...diff.updated];
    
    for (const skillWithContext of skillsToInstall) {
      const { catalogId, skillName, skill, fullName } = skillWithContext;
      
      try {
        const action = diff.new.includes(skillWithContext) ? 'create' : 'update';
        
        // Install the skill
        const sourcePath = path.join(skillWithContext.catalogEntry.path, skill.path);
        const skillDir = path.join(targetDir, fullName);
        
        if (!fs.existsSync(skillDir)) {
          fs.mkdirSync(skillDir, { recursive: true });
        }
        
        const targetPath = path.join(skillDir, 'SKILL.md');
        fs.copyFileSync(sourcePath, targetPath);
        
        // Track installation
        const installedRecord = createInstalledRecord(catalogId, skillName, skill);
        trackInstallation(config, fullName, installedRecord);
        
        if (action === 'create') {
          console.log(chalk.green(`✓ Created ${fullName}`));
        } else {
          console.log(chalk.blue(`↻ Updated ${fullName}`));
        }
      } catch (error) {
        console.log(chalk.red(`✖ Failed ${fullName}: ${(error as Error).message}`));
      }
    }
    
    saveConfig(config);
  }

  // Remove orphaned skills
  if (shouldRemoveOrphaned && diff.removed.length > 0) {
    const targetDir = getOpenCodeSkillsPath();
    
    for (const skill of diff.removed) {
      try {
        const fullName = buildFullSkillName(skill.catalog, skill.skillName);
        const skillDir = path.join(targetDir, fullName);
        
        if (fs.existsSync(skillDir)) {
          fs.rmSync(skillDir, { recursive: true, force: true });
        }
        
        untrackInstallation(config, fullName);
        console.log(chalk.yellow(`✓ Removed ${fullName}`));
      } catch (error) {
        console.log(chalk.red(`✖ Failed to remove ${skill.skillName}: ${(error as Error).message}`));
      }
    }
    
    saveConfig(config);
  }

  console.log('');
  console.log(chalk.green('✓ Done!'));
  console.log('');
}

/**
 * Non-interactive mode: Install specific skills (--all or --select)
 */
async function nonInteractiveMode(options: SkillsOptions) {
  const config = loadConfig();
  const activeCatalogs = getActiveCatalogs(config);

  if (activeCatalogs.length === 0) {
    logger.error('No catalogs registered');
    logger.info('Add a catalog first: npx @bre/ai-setup add <catalog-path>');
    process.exit(1);
  }

  logger.debug(`Found ${activeCatalogs.length} active catalog(s)`);

  // Filter catalogs if --catalog specified
  let catalogsToUse = activeCatalogs;
  if (options.catalog) {
    catalogsToUse = activeCatalogs.filter(c => c.id === options.catalog);
    if (catalogsToUse.length === 0) {
      logger.error(`Catalog "${options.catalog}" not found or not active`);
      process.exit(1);
    }
  }

  // Build skill filter based on options
  let skillFilter: ((catalogId: string, skillName: string) => boolean) | undefined;

  if (options.select) {
    const selectedSkills = options.select.split(',').map(s => s.trim()).filter(Boolean);
    
    if (selectedSkills.length === 0) {
      logger.error('No valid skill names provided in --select');
      process.exit(1);
    }

    logger.debug(`Filtering for skills: ${selectedSkills.join(', ')}`);
    
    skillFilter = (catalogId: string, skillName: string) => {
      return selectedSkills.includes(skillName);
    };
  }

  // Show target directory
  const targetDir = getOpenCodeSkillsPath();
  logger.info(`Target: ${targetDir}`);
  console.log('');

  // Install skills
  const results = await installSkills(
    config,
    catalogsToUse,
    skillFilter,
    options.dryRun || false
  );

  // Update config with installations (unless dry-run)
  if (!options.dryRun) {
    for (const result of results) {
      if (result.action === 'created' || result.action === 'updated') {
        for (const { id: catalogId, entry } of catalogsToUse) {
          const catalog = loadCatalog(entry.path);
          const skill = catalog.skills?.[result.skillName];
          
          if (skill) {
            const installedRecord = createInstalledRecord(catalogId, result.skillName, skill);
            trackInstallation(config, result.fullName, installedRecord);
            break;
          }
        }
      }
    }
    
    saveConfig(config);
  }

  // Display results
  console.log('');
  logger.info(options.dryRun ? 'Preview (dry-run):' : 'Results:');
  console.log('');

  const created = results.filter(r => r.action === 'created');
  const updated = results.filter(r => r.action === 'updated');
  const skipped = results.filter(r => r.action === 'skipped' && !r.error);
  const errors = results.filter(r => r.error);

  for (const result of created) {
    console.log(chalk.green(`✓ Created ${result.fullName}`));
  }

  for (const result of updated) {
    console.log(chalk.blue(`↻ Updated ${result.fullName}`));
  }

  if (skipped.length > 0) {
    logger.debug(`Skipped ${skipped.length} skill(s) (already up to date)`);
    for (const result of skipped) {
      logger.debug(`  → ${result.fullName}`);
    }
  }

  for (const result of errors) {
    console.log(chalk.red(`✖ Failed ${result.fullName}: ${result.error}`));
  }

  console.log('');
  if (options.dryRun) {
    logger.info('Summary (no changes made):');
  } else {
    logger.info('Summary:');
  }
  
  if (created.length > 0) {
    logger.info(`  Created:  ${created.length} skill${created.length === 1 ? '' : 's'}`);
  }
  if (updated.length > 0) {
    logger.info(`  Updated:  ${updated.length} skill${updated.length === 1 ? '' : 's'}`);
  }
  if (skipped.length > 0) {
    logger.info(`  Skipped:  ${skipped.length} skill${skipped.length === 1 ? '' : 's'} (up to date)`);
  }
  if (errors.length > 0) {
    logger.info(`  Failed:   ${errors.length} skill${errors.length === 1 ? '' : 's'}`);
  }

  if (results.length === 0) {
    logger.warn('No skills matched the filter');
  }

  console.log('');

  if (errors.length > 0) {
    process.exit(1);
  }
}

/**
 * Main skills command entry point
 */
export async function skills(options: SkillsOptions = {}) {
  // If no flags provided, enter interactive mode
  const isInteractive = !options.all && !options.select && !options.dryRun;

  if (isInteractive) {
    await interactiveMode(options);
  } else {
    logger.info('Processing skills...\n');
    await nonInteractiveMode(options);
  }
}
