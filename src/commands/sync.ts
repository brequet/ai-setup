import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { CLIError } from '../utils/errors.js';
import { DEFAULT_GIT_BRANCH } from '../utils/constants.js';
import { loadConfig, saveConfig } from '../core/config.js';
import { cloneOrPullCatalog } from '../utils/git.js';

interface SyncOptions {
  catalog?: string;
}

export async function sync(options: SyncOptions = {}) {
  const config = await loadConfig();

  let gitCatalogs = Object.entries(config.catalogs).filter(([, entry]) => entry.type === 'git');

  if (options.catalog) {
    gitCatalogs = gitCatalogs.filter(([id]) => id === options.catalog);

    if (gitCatalogs.length === 0) {
      throw new CLIError(`Catalog "${options.catalog}" not found or is not a Git catalog`);
    }
  }

  if (gitCatalogs.length === 0) {
    logger.info('No Git catalogs to sync');
    logger.blank();
    logger.info('Add a Git catalog: npx @brequet/agent-sync add <git-url>');
    return;
  }

  logger.blank();
  logger.info(`Syncing ${gitCatalogs.length} Git catalog${gitCatalogs.length === 1 ? '' : 's'}...`);
  logger.blank();

  let successCount = 0;
  let failCount = 0;

  for (const [catalogId, entry] of gitCatalogs) {
    try {
      const result = await cloneOrPullCatalog(
        catalogId,
        entry.url!,
        entry.branch || DEFAULT_GIT_BRANCH,
      );

      if (result.success) {
        logger.print(chalk.green(`✓ ${catalogId}`) + chalk.dim(` (${entry.url})`));
        entry.lastSynced = new Date().toISOString();
        successCount++;
      } else {
        logger.print(chalk.yellow(`⚠ ${catalogId}`) + chalk.dim(` - ${result.error}`));
        failCount++;
      }
    } catch (error) {
      logger.print(chalk.red(`✖ ${catalogId}`) + chalk.dim(` - ${(error as Error).message}`));
      failCount++;
    }
  }

  await saveConfig(config);

  logger.blank();
  logger.info('Summary:');
  if (successCount > 0) {
    logger.info(
      `  ${chalk.green('✓')} Synced:  ${successCount} catalog${successCount === 1 ? '' : 's'}`,
    );
  }
  if (failCount > 0) {
    logger.info(
      `  ${chalk.yellow('⚠')} Failed:  ${failCount} catalog${failCount === 1 ? '' : 's'}`,
    );
  }

  logger.blank();

  if (successCount > 0) {
    logger.info('Next steps:');
    logger.info('  - List catalogs:    npx @brequet/agent-sync list');
    logger.info('  - Install skills:   npx @brequet/agent-sync skills');
  }

  logger.blank();
}
