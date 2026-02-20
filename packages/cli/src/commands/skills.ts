import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import {
  loadConfig,
  saveConfig,
  getActiveCatalogs,
  trackInstallation,
  untrackInstallation,
} from '../core/config.js';
import { getOpenCodeSkillsPath } from '../utils/paths.js';
import { compareWithCatalog, getDiffSummary } from '../core/diff.js';
import { cloneOrPullCatalog } from '../utils/git.js';
import fs from 'node:fs';
import path from 'node:path';

interface SkillsOptions {
  yes?: boolean; // Skip confirmations
}

/**
 * Sync all Git catalogs before installing skills
 */
async function syncGitCatalogs(
  catalogs: Array<{
    id: string;
    entry: import('../core/config.js').CatalogEntry;
  }>,
): Promise<void> {
  const gitCatalogs = catalogs.filter((c) => c.entry.type === 'git');

  if (gitCatalogs.length === 0) {
    return; // No git catalogs to sync
  }

  logger.info('Syncing Git catalogs...\n');

  for (const { id, entry } of gitCatalogs) {
    try {
      const result = await cloneOrPullCatalog(id, entry.url!, entry.branch || 'main');

      if (result.success) {
        logger.debug(`✓ Synced ${id}`);

        // Update lastSynced timestamp
        entry.lastSynced = new Date().toISOString();
      } else {
        // Graceful degradation: warn but continue
        logger.warn(`⚠ Failed to sync ${id}: ${result.error}`);
        logger.info(`  Using cached version (if available)`);
      }
    } catch (error) {
      // Graceful degradation: warn but continue
      logger.warn(`⚠ Error syncing ${id}: ${(error as Error).message}`);
      logger.info(`  Using cached version (if available)`);
    }
  }

  console.log('');
}

/**
 * Interactive mode: Show changes and prompt for confirmation
 */
async function interactiveMode(options: SkillsOptions) {
  const config = loadConfig();
  const activeCatalogs = getActiveCatalogs(config);

  if (activeCatalogs.length === 0) {
    logger.error('No catalogs registered');
    logger.info('Add a catalog first: npx @brequet/ai-setup add <catalog-path>');
    process.exit(1);
  }

  // Auto-sync Git catalogs
  await syncGitCatalogs(activeCatalogs);

  // Save config with updated lastSynced timestamps
  saveConfig(config);

  // Compare catalog with installed skills
  console.log(chalk.dim('Checking for updates...\n'));
  const diff = compareWithCatalog(config, activeCatalogs);
  const summary = getDiffSummary(diff);

  // No changes detected
  if (!summary.hasChanges) {
    console.log(chalk.green('✓ Everything is up to date!'));
    console.log('');
    logger.info(
      `Installed: ${diff.unchanged.length} skill${diff.unchanged.length === 1 ? '' : 's'}`,
    );
    console.log('');
    return;
  }

  // Show summary
  console.log(chalk.bold('Changes detected:'));
  if (summary.newCount > 0) {
    console.log(
      chalk.green(
        `  • ${summary.newCount} new skill${summary.newCount === 1 ? '' : 's'} available`,
      ),
    );
  }
  if (summary.updatedCount > 0) {
    console.log(
      chalk.blue(
        `  • ${summary.updatedCount} skill${summary.updatedCount === 1 ? '' : 's'} updated`,
      ),
    );
  }
  if (summary.removedCount > 0) {
    console.log(
      chalk.yellow(
        `  • ${summary.removedCount} skill${summary.removedCount === 1 ? '' : 's'} removed from catalog`,
      ),
    );
  }
  console.log('');

  // Show new skills
  if (diff.new.length > 0) {
    console.log(chalk.bold('New skills:'));
    for (const availableSkill of diff.new) {
      console.log(
        chalk.green(`  + ${availableSkill.skillName}`) +
          chalk.dim(` - ${availableSkill.skill.description}`),
      );
    }
    console.log('');
  }

  // Show updated skills
  if (diff.updated.length > 0) {
    console.log(chalk.bold('Updates available:'));
    for (const availableSkill of diff.updated) {
      console.log(chalk.blue(`  ↻ ${availableSkill.skillName}`) + chalk.dim(' - Content updated'));
    }
    console.log('');
  }

  // Handle removed skills
  let shouldRemoveOrphaned = false;
  if (diff.removed.length > 0) {
    console.log(chalk.bold('Removed from catalog:'));
    for (const removedSkill of diff.removed) {
      console.log(
        chalk.yellow(`  - ${removedSkill.skillName}`) + chalk.dim(' - No longer in any catalog'),
      );
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

    for (const availableSkill of skillsToInstall) {
      const { catalogId, skillName, skill } = availableSkill;

      try {
        const action = diff.new.includes(availableSkill) ? 'create' : 'update';

        // Install the skill
        const sourcePath = skill.sourcePath;
        const skillDir = path.join(targetDir, skillName);

        if (!fs.existsSync(skillDir)) {
          fs.mkdirSync(skillDir, { recursive: true });
        }

        const targetPath = path.join(skillDir, 'SKILL.md');
        fs.copyFileSync(sourcePath, targetPath);

        // Track installation with simplified schema
        trackInstallation(config, skillName, catalogId);

        if (action === 'create') {
          console.log(chalk.green(`✓ Created ${skillName}`));
        } else {
          console.log(chalk.blue(`↻ Updated ${skillName}`));
        }
      } catch (error) {
        console.log(chalk.red(`✖ Failed ${skillName}: ${(error as Error).message}`));
      }
    }

    saveConfig(config);
  }

  // Remove orphaned skills
  if (shouldRemoveOrphaned && diff.removed.length > 0) {
    const targetDir = getOpenCodeSkillsPath();

    for (const removedSkill of diff.removed) {
      try {
        const skillName = removedSkill.skillName;
        const skillDir = path.join(targetDir, skillName);

        if (fs.existsSync(skillDir)) {
          fs.rmSync(skillDir, { recursive: true, force: true });
        }

        untrackInstallation(config, skillName);
        console.log(chalk.yellow(`✓ Removed ${skillName}`));
      } catch (error) {
        console.log(chalk.red(`✖ Failed to remove skill: ${(error as Error).message}`));
      }
    }

    saveConfig(config);
  }

  console.log('');
  console.log(chalk.green('✓ Done!'));
  console.log('');
}

/**
 * Main skills command entry point
 */
export async function skills(options: SkillsOptions = {}) {
  await interactiveMode(options);
}
