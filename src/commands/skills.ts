import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { CLIError } from '../utils/errors.js';
import { loadConfig, saveConfig, getActiveCatalogs, untrackInstallation } from '../core/config.js';
import { getSkillsDir } from '../utils/paths.js';
import { compareWithCatalog, getDiffSummary } from '../core/diff.js';
import { cloneOrPullCatalog } from '../utils/git.js';
import { removeAsync } from '../utils/fs-async.js';
import { installSkillsBatch } from '../core/installer.js';
import path from 'node:path';

interface SkillsOptions {
  yes?: boolean;
}

async function syncGitCatalogs(
  catalogs: Array<{
    id: string;
    entry: import('../core/config.js').CatalogEntry;
  }>,
): Promise<void> {
  const gitCatalogs = catalogs.filter((c) => c.entry.type === 'git');

  if (gitCatalogs.length === 0) {
    return;
  }

  logger.info('Syncing Git catalogs...');
  logger.blank();

  for (const { id, entry } of gitCatalogs) {
    try {
      const result = await cloneOrPullCatalog(id, entry.url!, entry.branch || 'main');

      if (result.success) {
        logger.debug(`✓ Synced ${id}`);
        entry.lastSynced = new Date().toISOString();
      } else {
        logger.warn(`⚠ Failed to sync ${id}: ${result.error}`);
        logger.info(`  Using cached version (if available)`);
      }
    } catch (error) {
      logger.warn(`⚠ Error syncing ${id}: ${(error as Error).message}`);
      logger.info(`  Using cached version (if available)`);
    }
  }

  logger.blank();
}

export async function skills(options: SkillsOptions = {}): Promise<void> {
  const config = await loadConfig();
  const activeCatalogs = getActiveCatalogs(config);

  if (activeCatalogs.length === 0) {
    throw new CLIError(
      'No catalogs registered. Add a catalog first: npx @brequet/ai-setup add <catalog-path>',
    );
  }

  await syncGitCatalogs(activeCatalogs);
  await saveConfig(config);

  logger.dim('Checking for updates...');
  logger.blank();

  const diff = await compareWithCatalog(config, activeCatalogs);
  const summary = getDiffSummary(diff);

  if (!summary.hasChanges) {
    logger.print(chalk.green('✓ Everything is up to date!'));
    logger.blank();
    logger.info(
      `Installed: ${diff.unchanged.length} skill${diff.unchanged.length === 1 ? '' : 's'}`,
    );
    logger.blank();
    return;
  }

  logger.section('Changes detected:');
  if (summary.newCount > 0) {
    logger.print(
      chalk.green(
        `  • ${summary.newCount} new skill${summary.newCount === 1 ? '' : 's'} available`,
      ),
    );
  }
  if (summary.updatedCount > 0) {
    logger.print(
      chalk.blue(
        `  • ${summary.updatedCount} skill${summary.updatedCount === 1 ? '' : 's'} updated`,
      ),
    );
  }
  if (summary.removedCount > 0) {
    logger.print(
      chalk.yellow(
        `  • ${summary.removedCount} skill${summary.removedCount === 1 ? '' : 's'} removed from catalog`,
      ),
    );
  }
  logger.blank();

  if (diff.new.length > 0) {
    logger.section('New skills:');
    for (const availableSkill of diff.new) {
      logger.print(
        chalk.green(`  + ${availableSkill.skillName}`) +
          chalk.dim(` - ${availableSkill.skill.description}`),
      );
    }
    logger.blank();
  }

  if (diff.updated.length > 0) {
    logger.section('Updates available:');
    for (const availableSkill of diff.updated) {
      logger.print(chalk.blue(`  ↻ ${availableSkill.skillName}`) + chalk.dim(' - Content updated'));
    }
    logger.blank();
  }

  let shouldRemoveOrphaned = false;
  if (diff.removed.length > 0) {
    logger.section('Removed from catalog:');
    for (const removedSkill of diff.removed) {
      logger.print(
        chalk.yellow(`  - ${removedSkill.skillName}`) + chalk.dim(' - No longer in any catalog'),
      );
    }
    logger.blank();

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
    logger.dim('No changes made');
    logger.blank();
    return;
  }

  logger.blank();

  if (shouldInstall && (summary.newCount > 0 || summary.updatedCount > 0)) {
    const skillsToInstall = [...diff.new, ...diff.updated];

    const results = await installSkillsBatch(skillsToInstall, config, {
      skipPrompts: options.yes,
    });

    for (const result of results) {
      if (result.error) {
        logger.print(chalk.red(`✖ Failed ${result.skillName}: ${result.error}`));
      } else if (result.action === 'created') {
        logger.print(chalk.green(`✓ Created ${result.skillName}`));
      } else if (result.action === 'updated') {
        logger.print(chalk.blue(`↻ Updated ${result.skillName}`));
      }
    }

    await saveConfig(config);
  }

  if (shouldRemoveOrphaned && diff.removed.length > 0) {
    const targetDir = getSkillsDir();

    for (const removedSkill of diff.removed) {
      try {
        const skillName = removedSkill.skillName;
        const skillDir = path.join(targetDir, skillName);

        await removeAsync(skillDir);
        untrackInstallation(config, skillName);

        logger.print(chalk.yellow(`✓ Removed ${skillName}`));
      } catch (error) {
        logger.print(chalk.red(`✖ Failed to remove skill: ${(error as Error).message}`));
      }
    }

    await saveConfig(config);
  }

  logger.blank();
  logger.print(chalk.green('✓ Done!'));
  logger.blank();
}
