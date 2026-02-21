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

// Graceful CTRL+C handling
let sigintCount = 0;
process.on('SIGINT', () => {
  sigintCount++;

  if (sigintCount === 1) {
    console.log('\n\nInterrupted.');
    process.exit(130);
  } else {
    // Double CTRL+C - force immediate exit
    process.exit(130);
  }
});

// Wrap command actions to catch ExitPromptError from @inquirer/prompts
function wrapAction<T extends any[]>(
  action: (...args: T) => Promise<void>,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await action(...args);
    } catch (error: any) {
      // Handle CTRL+C during interactive prompts
      if (error?.name === 'ExitPromptError') {
        console.log('\nInterrupted.');
        process.exit(130);
      }
      // Re-throw other errors for normal error handling
      throw error;
    }
  };
}

const program = new Command();

program
  .name('bre-ai-setup')
  .description('CLI tool for managing AI agent catalogs, skills, and MCP configurations')
  .version('0.1.0')
  .option('--verbose', 'Enable verbose logging')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setVerbose(true);
    }
  });

// Catalog commands
const catalog = program.command('catalog').description('Manage catalog (maintainer commands)');

catalog
  .command('init')
  .description('Initialize a new catalog in current directory')
  .option('--name <name>', 'Catalog name')
  .action(
    wrapAction(async (options) => {
      await catalogInit({
        name: options.name,
      });
    }),
  );

catalog
  .command('skill')
  .description('Manage skills in catalog')
  .command('add [name]')
  .description('Add a new skill to the catalog')
  .option('-d, --description <description>', 'Skill description')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-l, --license <license>', 'License (e.g., MIT, Apache-2.0)', 'MIT')
  .action(
    wrapAction(async (name, options) => {
      await catalogSkillAdd(name, {
        description: options.description,
        tags: options.tags,
        license: options.license,
      });
    }),
  );

catalog
  .command('validate')
  .description('Validate catalog structure and metadata')
  .action(
    wrapAction(async () => {
      await catalogValidate();
    }),
  );

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
  .action(
    wrapAction(async (catalogPath, options) => {
      await addCommand(catalogPath, options);
    }),
  );

program
  .command('list')
  .description('List registered catalogs and installed skills')
  .action(
    wrapAction(async () => {
      await list();
    }),
  );

program
  .command('sync')
  .description('Update Git-based catalogs')
  .option('--catalog <id>', 'Sync specific catalog only')
  .action(
    wrapAction(async (options) => {
      await sync(options);
    }),
  );

program
  .command('skills')
  .description('Install/update skills from registered catalogs (interactive)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(
    wrapAction(async (options) => {
      await skills(options);
    }),
  );

program.parse();
