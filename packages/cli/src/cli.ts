#!/usr/bin/env node

import { Command } from 'commander';
import { setVerbose } from './utils/logger.js';
import { catalogNew } from './commands/catalog/new.js';
import { catalogSkillAdd } from './commands/catalog/skill-add.js';
import { catalogValidate } from './commands/catalog/validate.js';
import { catalogBuild } from './commands/catalog/build.js';
import { add } from './commands/add.js';
import { skills } from './commands/skills.js';
import { list } from './commands/list.js';

const program = new Command();

program
  .name('bre-ai-setup')
  .description('CLI tool for managing AI agent catalogs, skills, and MCP configurations')
  .version('0.1.0')
  .option('--verbose', 'Enable verbose logging')
  .option('--dev-catalog <path>', 'Point to a local catalog directory (for development)')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setVerbose(true);
    }
    if (opts.devCatalog) {
      // Change to catalog directory for all operations
      process.chdir(opts.devCatalog);
    }
  });

// Catalog commands
const catalog = program
  .command('catalog')
  .description('Manage catalog (maintainer commands)');

catalog
  .command('new')
  .description('Create a new catalog')
  .option('--name <name>', 'Catalog name')
  .option('--id <id>', 'Catalog ID (kebab-case)')
  .option('--git-url <url>', 'Git repository URL')
  .action(async (options) => {
    await catalogNew({
      name: options.name,
      id: options.id,
      gitUrl: options.gitUrl,
    });
  });

catalog
  .command('skill')
  .description('Manage skills in catalog')
  .command('add [name]')
  .description('Add a new skill to the catalog')
  .option('-d, --description <description>', 'Skill description')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-l, --license <license>', 'License (e.g., MIT, Apache-2.0)', 'MIT')
  .option('-v, --version <version>', 'Skill version', '1.0.0')
  .action(async (name, options) => {
    await catalogSkillAdd(name, {
      description: options.description,
      tags: options.tags,
      license: options.license,
      version: options.version,
    });
  });

catalog
  .command('validate')
  .description('Validate catalog structure and metadata')
  .action(async () => {
    await catalogValidate();
  });

catalog
  .command('build')
  .description('Build catalog.json from current state')
  .action(async () => {
    await catalogBuild();
  });

// Consumer commands
program
  .command('add <catalog-path>')
  .description('Add a local catalog to your configuration')
  .option('--name <name>', 'Override catalog name (for display)')
  .option('--priority <number>', 'Set priority (default: auto-increment)', parseInt)
  .option('--inactive', 'Add catalog but mark as inactive')
  .action(async (catalogPath, options) => {
    await add(catalogPath, options);
  });

program
  .command('list')
  .description('List registered catalogs and installed skills')
  .action(async () => {
    await list();
  });

program
  .command('skills')
  .description('Install/update skills from registered catalogs (interactive by default)')
  .option('--all', 'Install all skills from all active catalogs')
  .option('--select <names>', 'Comma-separated skill names to install')
  .option('--catalog <id>', 'Only install from specific catalog')
  .option('--dry-run', 'Preview what would be installed without making changes')
  .option('--force', 'Force reinstall even if hash matches')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    await skills(options);
  });

program.parse();
