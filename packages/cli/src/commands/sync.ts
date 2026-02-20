import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { loadConfig, saveConfig } from '../core/config.js';
import { cloneOrPullCatalog } from '../utils/git.js';

interface SyncOptions {
  catalog?: string; // Sync specific catalog only
}

/**
 * Sync Git-based catalogs
 */
export async function sync(options: SyncOptions = {}) {
  const config = loadConfig();

  // Get all git-based catalogs
  let gitCatalogs = Object.entries(config.catalogs).filter(([_, entry]) => entry.type === 'git');

  // Filter by specific catalog if requested
  if (options.catalog) {
    gitCatalogs = gitCatalogs.filter(([id, _]) => id === options.catalog);

    if (gitCatalogs.length === 0) {
      logger.error(`Catalog "${options.catalog}" not found or is not a Git catalog`);
      process.exit(1);
    }
  }

  if (gitCatalogs.length === 0) {
    logger.info('No Git catalogs to sync');
    console.log('');
    logger.info('Add a Git catalog: npx @brequet/ai-setup add <git-url>');
    return;
  }

  console.log('');
  logger.info(
    `Syncing ${gitCatalogs.length} Git catalog${gitCatalogs.length === 1 ? '' : 's'}...\n`,
  );

  let successCount = 0;
  let failCount = 0;

  for (const [catalogId, entry] of gitCatalogs) {
    try {
      const result = await cloneOrPullCatalog(catalogId, entry.url!, entry.branch || 'main');

      if (result.success) {
        console.log(chalk.green(`✓ ${catalogId}`) + chalk.dim(` (${entry.url})`));

        // Update lastSynced timestamp
        entry.lastSynced = new Date().toISOString();
        successCount++;
      } else {
        console.log(chalk.yellow(`⚠ ${catalogId}`) + chalk.dim(` - ${result.error}`));
        failCount++;
      }
    } catch (error) {
      console.log(chalk.red(`✖ ${catalogId}`) + chalk.dim(` - ${(error as Error).message}`));
      failCount++;
    }
  }

  // Save updated config (with lastSynced timestamps)
  saveConfig(config);

  console.log('');
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

  console.log('');

  if (successCount > 0) {
    logger.info('Next steps:');
    logger.info('  - List catalogs:    npx @brequet/ai-setup list');
    logger.info('  - Install skills:   npx @brequet/ai-setup skills --all');
  }

  console.log('');
}
