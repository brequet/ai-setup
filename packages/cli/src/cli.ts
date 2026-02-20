#!/usr/bin/env node

import { Command } from 'commander';
import { setVerbose } from './utils/logger.js';
import { catalogInit } from './commands/catalog/init.js';
import { catalogSkillAdd } from './commands/catalog/skill-add.js';
import { catalogValidate } from './commands/catalog/validate.js';
import { addCommand } from './commands/add.js';
import { skills } from './commands/skills.js';
import { list } from './commands/list.js';
import { sync } from './commands/sync.js';

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
const catalog = program.command('catalog').description('Manage catalog (maintainer commands)');

catalog
  .command('init')
  .description('Initialize a new catalog in current directory')
  .option('--name <name>', 'Catalog name')
  .action(async (options) => {
    await catalogInit({
      name: options.name,
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
  .action(async (name, options) => {
    await catalogSkillAdd(name, {
      description: options.description,
      tags: options.tags,
      license: options.license,
    });
  });

catalog
  .command('validate')
  .description('Validate catalog structure and metadata')
  .action(async () => {
    await catalogValidate();
  });

// Consumer commands
program
  .command('add <catalogPath>')
  .description('Add a new catalog (Git URL or local path)')
  .option('--name <name>', 'Override catalog name')
  .option('--priority <number>', 'Set catalog priority (lower = higher priority)', parseInt)
  .option('--inactive', 'Add catalog but mark as inactive')
  .option('--branch <branch>', 'Git branch to use (default: main, only for Git URLs)')
  .option('-y, --yes', 'Auto-install all skills without prompt')
  .option('--no-install', 'Skip skill installation (just add catalog)')
  .action(async (catalogPath, options) => {
    await addCommand(catalogPath, options);
  });

program
  .command('list')
  .description('List registered catalogs and installed skills')
  .action(async () => {
    await list();
  });

program
  .command('sync')
  .description('Update Git-based catalogs')
  .option('--catalog <id>', 'Sync specific catalog only')
  .action(async (options) => {
    await sync(options);
  });

program
  .command('skills')
  .description('Install/update skills from registered catalogs (interactive)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    await skills(options);
  });

program.parse();
