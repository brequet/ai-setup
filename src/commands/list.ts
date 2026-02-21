import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { DEFAULT_GIT_BRANCH } from '../utils/constants.js';
import { loadConfig, getActiveCatalogs } from '../core/config.js';
import { getConfigPath, getSkillsDir } from '../utils/paths.js';
import { compareWithCatalog, getDiffSummary } from '../core/diff.js';
import { discoverSkills } from '../core/discovery.js';
import { resolveCatalogPath } from '../core/installer.js';
import { readdirAsync, existsSync } from '../utils/fs-async.js';

export async function list() {
  const config = await loadConfig();
  const activeCatalogs = getActiveCatalogs(config);

  logger.blank();
  logger.section('Registered Catalogs');
  logger.divider();

  const catalogEntries = Object.entries(config.catalogs);

  if (catalogEntries.length === 0) {
    logger.print(chalk.yellow('No catalogs registered'));
    logger.blank();
    logger.info('Add a catalog: npx @brequet/ai-setup add <catalog-path>');
    return;
  }

  const diff = await compareWithCatalog(config, activeCatalogs);
  const summary = getDiffSummary(diff);

  catalogEntries.sort(([, a], [, b]) => a.priority - b.priority);

  for (const [id, entry] of catalogEntries) {
    try {
      const catalogPath = resolveCatalogPath(id, entry);
      const skills = await discoverSkills(catalogPath);
      const skillCount = skills.size;
      const statusIcon = entry.active ? chalk.green('●') : chalk.gray('○');

      const catalogUpdates = diff.updated.filter((s) => s.catalogId === id).length;
      const catalogNew = diff.new.filter((s) => s.catalogId === id).length;

      let updateInfo = '';
      if (catalogUpdates > 0 || catalogNew > 0) {
        const parts = [];
        if (catalogNew > 0) parts.push(`${catalogNew} new`);
        if (catalogUpdates > 0)
          parts.push(`${catalogUpdates} update${catalogUpdates === 1 ? '' : 's'}`);
        updateInfo = chalk.blue(` • ${parts.join(', ')}`);
      }

      logger.blank();
      logger.print(
        `${statusIcon} ${chalk.bold(id)} ${chalk.dim(`(priority: ${entry.priority})`)}${updateInfo}`,
      );
      logger.print(`  ${chalk.dim('Type:')}     ${entry.type}`);

      if (entry.type === 'git') {
        logger.print(`  ${chalk.dim('URL:')}      ${entry.url}`);
        logger.print(`  ${chalk.dim('Branch:')}   ${entry.branch || DEFAULT_GIT_BRANCH}`);
        if (entry.lastSynced) {
          const syncedDate = new Date(entry.lastSynced).toLocaleString();
          logger.print(`  ${chalk.dim('Synced:')}   ${syncedDate}`);
        }
      } else {
        logger.print(`  ${chalk.dim('Path:')}     ${entry.path}`);
      }

      logger.print(`  ${chalk.dim('Skills:')}   ${skillCount} available`);
      logger.print(
        `  ${chalk.dim('Status:')}   ${entry.active ? chalk.green('active') : chalk.gray('inactive')}`,
      );
    } catch (error) {
      logger.blank();
      logger.print(
        `${chalk.red('✖')} ${chalk.bold(id)} ${chalk.dim(`(priority: ${entry.priority})`)}`,
      );
      logger.print(`  ${chalk.red('Error:')} ${(error as Error).message}`);
      if (entry.type === 'local') {
        logger.print(`  ${chalk.dim('Path:')}  ${entry.path}`);
      } else {
        logger.print(`  ${chalk.dim('URL:')}   ${entry.url}`);
      }
    }
  }

  logger.blank();
  logger.divider();

  logger.blank();
  logger.section('Installed Skills');
  logger.divider();

  const installedEntries = Object.entries(config.installed);

  if (installedEntries.length === 0) {
    logger.print(chalk.yellow('No skills installed'));
    logger.blank();
    logger.info('Install skills: npx @brequet/ai-setup skills');
  } else {
    const byCatalog = new Map<string, Array<[string, (typeof config.installed)[string]]>>();

    for (const entry of installedEntries) {
      const catalogId = entry[1].catalog;
      if (!byCatalog.has(catalogId)) {
        byCatalog.set(catalogId, []);
      }
      byCatalog.get(catalogId)!.push(entry);
    }

    const updatedSkills = new Set(diff.updated.map((s) => s.skillName));
    const removedSkillNames = new Set(diff.removed.map((r) => r.skillName));

    for (const [catalogId, skills] of byCatalog) {
      const catalogUpdateCount = skills.filter(([skillName]) =>
        updatedSkills.has(skillName),
      ).length;
      const catalogRemovedCount = skills.filter(([skillName]) =>
        removedSkillNames.has(skillName),
      ).length;

      let catalogStatus = '';
      if (catalogUpdateCount > 0 || catalogRemovedCount > 0) {
        const parts = [];
        if (catalogUpdateCount > 0)
          parts.push(
            chalk.blue(`${catalogUpdateCount} update${catalogUpdateCount === 1 ? '' : 's'}`),
          );
        if (catalogRemovedCount > 0) parts.push(chalk.yellow(`${catalogRemovedCount} removed`));
        catalogStatus = ` • ${parts.join(', ')}`;
      }

      logger.blank();
      logger.print(
        chalk.bold(`  ${catalogId}`) +
          chalk.dim(` (${skills.length} skill${skills.length === 1 ? '' : 's'})`) +
          catalogStatus,
      );

      for (const [skillName] of skills) {
        let statusIcon = chalk.green('✓');
        let statusText = '';

        if (updatedSkills.has(skillName)) {
          statusIcon = chalk.blue('↻');
          statusText = chalk.blue(' (update available)');
        } else if (removedSkillNames.has(skillName)) {
          statusIcon = chalk.yellow('⚠');
          statusText = chalk.yellow(' (removed from catalog)');
        }

        logger.print(`    ${statusIcon} ${skillName}${statusText}`);
      }
    }

    const skillsDir = getSkillsDir();
    if (existsSync(skillsDir)) {
      const allSkillDirs = (await readdirAsync(skillsDir, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      const trackedSkills = new Set(Object.keys(config.installed));
      const otherSkills = allSkillDirs.filter((name) => !trackedSkills.has(name));

      if (otherSkills.length > 0) {
        logger.blank();
        logger.print(
          chalk.bold(`  Other skills`) +
            chalk.dim(
              ` - not from any catalog (${otherSkills.length} custom skill${otherSkills.length === 1 ? '' : 's'})`,
            ),
        );

        for (const skillName of otherSkills) {
          logger.print(`    ${chalk.dim('○')} ${skillName}`);
        }
      }
    }

    logger.blank();
    logger.divider();
    logger.print(
      `Total: ${installedEntries.length} skill${installedEntries.length === 1 ? '' : 's'} installed`,
    );

    if (summary.hasChanges) {
      logger.blank();
      const changeParts = [];
      if (summary.updatedCount > 0)
        changeParts.push(
          chalk.blue(`${summary.updatedCount} update${summary.updatedCount === 1 ? '' : 's'}`),
        );
      if (summary.newCount > 0) changeParts.push(chalk.green(`${summary.newCount} new`));
      if (summary.removedCount > 0)
        changeParts.push(chalk.yellow(`${summary.removedCount} removed`));

      logger.print(chalk.dim('Changes available: ') + changeParts.join(', '));
    }
  }

  if (diff.new.length > 0) {
    logger.blank();
    logger.section('Available (not installed)');
    logger.divider();
    logger.blank();

    const newByCatalog = new Map<string, typeof diff.new>();
    for (const availableSkill of diff.new) {
      if (!newByCatalog.has(availableSkill.catalogId)) {
        newByCatalog.set(availableSkill.catalogId, []);
      }
      newByCatalog.get(availableSkill.catalogId)!.push(availableSkill);
    }

    for (const [catalogId, skills] of newByCatalog) {
      logger.print(chalk.bold(`  ${catalogId}`));
      for (const availableSkill of skills) {
        logger.print(
          `    ${chalk.dim('○')} ${availableSkill.skillName} ${chalk.dim('- ' + availableSkill.skill.description)}`,
        );
      }
      logger.blank();
    }
  }

  if (summary.hasChanges) {
    logger.print(chalk.dim('💡 Run ') + chalk.bold('skills') + chalk.dim(' to install updates'));
  }

  logger.blank();
  logger.dim(`Config: ${getConfigPath()}`);
  logger.blank();
}
