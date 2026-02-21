# Flattened Codebase

Total files: 45

## Table of Contents

1. [.\.opencode\AGENT.md](#file-1)
2. [.\.oxfmtrc.json](#file-2)
3. [.\.zed\settings.json](#file-3)
4. [.\README.md](#file-4)
5. [.\TODO.md](#file-5)
6. [.\oxlint.json](#file-6)
7. [.\package.json](#file-7)
8. [.\src\cli.ts](#file-8)
9. [.\src\commands\add.ts](#file-9)
10. [.\src\commands\catalog\init.ts](#file-10)
11. [.\src\commands\catalog\skill-add.ts](#file-11)
12. [.\src\commands\catalog\validate.ts](#file-12)
13. [.\src\commands\list.ts](#file-13)
14. [.\src\commands\skills.ts](#file-14)
15. [.\src\commands\sync.ts](#file-15)
16. [.\src\core\config.ts](#file-16)
17. [.\src\core\diff.ts](#file-17)
18. [.\src\core\discovery.ts](#file-18)
19. [.\src\core\installer.ts](#file-19)
20. [.\src\core\validation.ts](#file-20)
21. [.\src\utils\constants.ts](#file-21)
22. [.\src\utils\errors.ts](#file-22)
23. [.\src\utils\fs-async.ts](#file-23)
24. [.\src\utils\git.ts](#file-24)
25. [.\src\utils\hash.ts](#file-25)
26. [.\src\utils\helpers.ts](#file-26)
27. [.\src\utils\logger.ts](#file-27)
28. [.\src\utils\paths.ts](#file-28)
29. [.\tests\fixtures\catalog-a\CATALOG.md](#file-29)
30. [.\tests\fixtures\catalog-a\skills\skill-alpha\SKILL.md](#file-30)
31. [.\tests\fixtures\catalog-a\skills\skill-beta\SKILL.md](#file-31)
32. [.\tests\fixtures\catalog-b\CATALOG.md](#file-32)
33. [.\tests\fixtures\catalog-b\skills\skill-alpha\SKILL.md](#file-33)
34. [.\tests\fixtures\catalog-b\skills\skill-gamma\SKILL.md](#file-34)
35. [.\tests\helpers\fixtures.ts](#file-35)
36. [.\tests\helpers\mock-prompts.ts](#file-36)
37. [.\tests\helpers\test-env.ts](#file-37)
38. [.\tests\integration\catalog-add.test.ts](#file-38)
39. [.\tests\integration\collision.test.ts](#file-39)
40. [.\tests\integration\skill-installation.test.ts](#file-40)
41. [.\tests\unit\config.test.ts](#file-41)
42. [.\tests\unit\fs-async.test.ts](#file-42)
43. [.\tests\unit\validation.test.ts](#file-43)
44. [.\tsconfig.json](#file-44)
45. [.\vitest.config.ts](#file-45)

## File 1: .\.opencode\AGENT.md

```md
# @brequet/agent-sync CLI Tool

## Project Vision

`@brequet/agent-sync` is a high-performance, ESM-first TypeScript CLI for managing AI agent catalogs and MCP (Model Context Protocol) configurations. We prioritize **type safety**, **minimalist DX**, and **idempotency**.

## Core Principles & TypeScript Standards

- **Readable Conciseness:** Prioritize readability and modularity over cleverness. Keep functions focused, but do not sacrifice readability for line count.
- **Production-Ready:** Every change must handle edge cases (e.g., missing permissions, invalid JSON).
- **No `any`:** Strict TypeScript only.
- **Modern CLI Patterns:** Take inspiration from `shadcn/cli`. Use **@inquirer/prompts** for interactive prompts and **Commander** for flags.
- **Lean code talk for itself:** Avoid unnecessary comments for simple enough code.
* **Strict TypeScript (The Matt Pocock Standard):**
  * NO `any` or `unknown` unless absolutely necessary.
  * Always declare explicit return types on top-level functions.
  * Do NOT use `enum`. Use const objects (`as const`) or union types instead.

## Tech Stack & Standards

- **Runtime:** Node.js (Latest LTS), ESM (`"type": "module"`).
- **Package Manager:** `pnpm`.
- **Dependency:** use pnpm command to add/remove dependencies, rightly scoped (dev vs prod). Refrain from directly modifying `package.json` unless absolutely necessary.
- **Testing:** Vitest. Focus on critical paths, not 100% coverage.

## Development Workflow

> **CRITICAL:** The agent must verify code quality after every modification.

1. **Modify:** Implement the requested feature or fix.
2. **Lint:** Run `pnpm lint`. If it fails, fix the errors immediately.
3. **Test:** Run `pnpm test` to ensure no regressions.
4. **Confirm:** Only report completion once linting and testing pass.

## Permissions & Boundaries
* **Always Allowed:** Reading files, running file-scoped tests, type-checking, and formatting.
* **Ask First:** Modifying `package.json`, installing new heavy dependencies, or doing repo-wide refactors.
* **Never Do:** Bypassing type checks (`@ts-ignore`) or mutating external files without user consent.

## Architecture & Codebase Map

Always check these locations before writing new utilities:
* **`src/utils/fs-async.ts`**: Use this for ALL file system operations. Do not use native `fs` directly.
* **`src/utils/errors.ts`**: Use this for standardizing error handling and CLI output formatting.
* **`src/utils/`**: Check here for existing utilities before adding new ones. Aim to keep the codebase DRY and maintainable.
* **Hybrid Execution:** All commands must support both **Interactive** (prompts) and **Flag-based** (CI/CD) modes.
```

## File 2: .\.oxfmtrc.json

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

## File 3: .\.zed\settings.json

```json
{
  "languages": {
    "TypeScript": {
      "format_on_save": "off",
    },
  },
}
```

## File 4: .\README.md

```md
# @brequet/agent-sync

TUI TypeScript CLI tool for managing AI agent catalogs, OpenCode skills, and MCP configurations.

## Project Structure

```
agent-sync-poc/
├── packages/
│   ├── cli/                    # @brequet/agent-sync CLI package
│   │   ├── src/
│   │   │   ├── cli.ts         # Entry point
│   │   │   ├── commands/      # Command implementations
│   │   │   ├── core/          # Core logic (schemas, catalog ops)
│   │   │   └── utils/         # Utilities (logger, hash, helpers)
│   │   ├── dist/              # Built output
│   │   └── package.json
│   └── test-catalog/          # Test catalog for development
│       ├── skills/
│       ├── mcp/
│       ├── meta/
│       │   └── catalog.json
│       └── README.md
├── pnpm-workspace.yaml
└── README.md
```

## Features

✅ **Catalog Management**
- Create new catalogs with `catalog new`
- Add skills with `catalog skill add`
- Validate catalog structure and hashes
- Build/rebuild catalog metadata

✅ **OpenCode Spec Compliant**
- YAML frontmatter in SKILL.md files
- Name validation (lowercase, alphanumeric, hyphens)
- Description length validation (1-1024 chars)
- Automatic name normalization
- Frontmatter validation in `catalog validate`

✅ **Modern CLI UX**
- Interactive prompts with fallback to CLI args
- Colored output with chalk
- Structured logging with `--verbose` flag
- Spinners for long operations

✅ **Type-Safe**
- Full TypeScript implementation
- Zod schemas for validation
- Type inference from schemas

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build CLI
cd packages/cli
pnpm build
```

### Local Development

```bash
# Terminal 1: Watch mode
cd packages/cli
pnpm dev

# Terminal 2: Test commands (navigate to catalog first)
cd packages/test-catalog
node ../cli/dist/cli.js catalog validate
```

### Commands

#### Catalog Commands (Maintainer)

```bash
# Create new catalog
agent-sync catalog new
agent-sync catalog new --name "My Catalog" --id "my-catalog"

# Add skill (OpenCode spec-compliant)
agent-sync catalog skill add
agent-sync catalog skill add git-release \
  --description "Create consistent releases and changelogs" \
  --tags "git,release,changelog" \
  --license "MIT"

# Name normalization examples
agent-sync catalog skill add "My Cool Skill"    # → my-cool-skill
agent-sync catalog skill add "PR Review!!!"     # → pr-review

# Validate catalog (checks frontmatter, names, hashes)
agent-sync catalog validate
agent-sync catalog validate --verbose

# Build catalog (regenerate hashes)
agent-sync catalog build
```

#### Global Flags

```bash
--verbose              # Enable debug logging
```

## Usage

### As Local Package (Development)

```bash
cd packages/cli
pnpm link --global
agent-sync catalog new
```

### As npx Package (After Publish)

```bash
npx @brequet/agent-sync@latest catalog new
npx @brequet/agent-sync@latest catalog skill add my-skill
```

## Architecture Decisions

- **Monorepo**: pnpm workspace for tight CLI ↔ catalog feedback loop
- **Logger**: Custom chalk-based (simple, no overhead)
- **Validation**: Zod schemas (type-safe, better DX)
- **Hash**: SHA-256 via Node.js crypto (simple, sufficient)
- **UX**: Args + interactive fallback (flexible, modern)

## OpenCode Spec Compliance

This tool generates **OpenCode-compliant** SKILL.md files:

### YAML Frontmatter (Required)

```yaml
---
name: my-skill
description: Brief description of what this skill does
license: MIT
compatibility: opencode
metadata:
  tags: tag1, tag2, tag3
---
```

### Name Validation

Skill names must follow OpenCode spec:
- 1-64 characters
- Lowercase alphanumeric with single hyphen separators
- No leading/trailing hyphens
- No consecutive hyphens
- Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

**Examples:**
- ✅ `git-release` - Valid
- ✅ `pr-review` - Valid
- ✅ `my-cool-skill` - Valid
- ❌ `My-Skill` - Uppercase
- ❌ `-my-skill` - Leading hyphen
- ❌ `my--skill` - Consecutive hyphens

### Description Validation

- Must be 1-1024 characters
- Should be specific enough for agents to choose correctly

### Directory Structure

```
skills/
  my-skill/
    SKILL.md       # Name in frontmatter must match directory
```

The CLI automatically:
- Normalizes names to valid format
- Validates frontmatter on `catalog validate`
- Checks name/directory consistency
- Verifies description length

## Next Steps

See [IDEAS.md](./IDEAS.md) for full implementation roadmap.

### Phase 2 (Consumer Commands)
- `init` - First-time setup
- `sync` - Update catalog cache
- `skills` - Install/update skills
- `mcp` - Configure MCP servers

### Future
- Multi-catalog support
- Git integration
- VS Code extension
- Web UI for catalog browsing
```

## File 5: .\TODO.md

```md
TODO:

- rename to agent-setup ?
- rework readme, its total bs right now -> dont forget, its supposed to work with opencode
- [ ] What about AGENTS.md ; could i like define in a catalog a part to be inject in AGENTS.MD, and then my cli tool does clean injection in the user AGENTS.MD file ? (how to track part ? marker in md ?)
- [ ] how to handles MCP config ? some mcp needs to do some auth, some to have api keys ready etc.. How to handle genericly install of mcp then ? scripting ? Merge of json ?
- [ ] how to handle agents/sub-agents conf too ? since its need to tweak opencode config json file, need to resolve (its jsonc with comment, we can put markers,dates etc in the json file)
- [ ] what about sharing some direct opencode conf ? Like keybinds etc (to be injected in existing or not opencode json conf file)
- [ ] have a default catalogs setup (for official catalogs for example)
- [ ] make it so sync command propose to the user to install updates if any
- [ ] pre commit hook: fmt + lint + test
- see if catalog priority is used, useful or not
- cmd "remove" to remove a catalog, skill or mcp from config and disk ?

## Issues

### Dependency Management & "Shadow" Files

In src/commands/list.ts, you scan the skillsDir and identify "Other skills" that aren't in your config.

The Issue: Your CLI currently manages files but doesn't fully "own" them. If a user deletes a folder manually, your config.installed becomes out of sync.

The Fix: You should implement a "reconcile" or "repair" function. Before running sync or list, the CLI should verify that every entry in config.installed actually exists on disk. If not, mark it as "broken" or auto-remove it from the config.

-> Maybe if removed while in "installed" state, mark them as "missing", so we assume its the user that removed it, so we can force reinstall them ONLY AND ONLY IF -f or --force flag is used ? Else we must assume the user had good reasons to remove it.

### Shell Command Insecurity

In src/utils/git.ts (implied by usage in add.ts), you likely use exec or spawn to run git clone.

The Issue: If you are passing user-provided URLs or branch names directly to a shell, you are potentially vulnerable to command injection.

The Fix: Always use spawn with an arguments array rather than exec with a string template. Even better, use a library like simple-git which handles the escaping for you.

### Git Syncing Reliability

In src/commands/sync.ts, you iterate through catalogs and pull changes.

The Issue: If a git pull fails due to a network error, you simply log a warning and continue. In a production tool, you should differentiate between "Network Down" (retryable) and "Repo Moved/Private" (fatal).

The Fix: Implement a retry logic for network-related Git errors.
```

## File 6: .\oxlint.json

```json
{
  "rules": {
    "typescript/no-explicit-any": "warn",
    "typescript/no-unused-vars": "error",
    "typescript/no-non-null-assertion": "warn",
    "unicorn/prefer-node-protocol": "error",
    "unicorn/no-array-for-each": "warn",
    "import/no-default-export": "off"
  }
}
```

## File 7: .\package.json

```json
{
  "name": "@brequet/agent-sync",
  "version": "0.1.0",
  "description": "CLI tool for managing AI agent catalogs, skills, and MCP configurations",
  "license": "MIT",
  "repository": "https://github.com/brequet/agent-sync",
  "type": "module",
  "bin": {
    "agent-sync": "./dist/cli.js"
  },
  "scripts": {
    "dev": "tsx watch src/cli.ts",
    "build": "tsc",
    "prepublishOnly": "pnpm build",
    "lint": "oxlint src",
    "lint:fix": "oxlint --fix src",
    "format": "oxfmt src",
    "format:check": "oxfmt --check src",
    "test": "cross-env NODE_ENV=test vitest run",
    "test:watch": "cross-env NODE_ENV=test vitest"
  },
  "files": [
    "dist"
  ],
  "keywords": [
    "cli",
    "ai",
    "opencode",
    "mcp",
    "skills"
  ],
  "dependencies": {
    "@inquirer/prompts": "^8.2.1",
    "chalk": "^5.4.1",
    "commander": "^12.1.0",
    "gray-matter": "^4.0.3",
    "ora": "^9.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/tmp": "^0.2.6",
    "cross-env": "^10.1.0",
    "oxfmt": "^0.34.0",
    "oxlint": "^1.49.0",
    "tmp": "^0.2.5",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "^4.0.18"
  }
}
```

## File 8: .\src\cli.ts

```ts
#!/usr/bin/env node

import { Command } from 'commander';
import { setVerbose, logger } from './utils/logger.js';
import { catalogInit } from './commands/catalog/init.js';
import { catalogSkillAdd } from './commands/catalog/skill-add.js';
import { catalogValidate } from './commands/catalog/validate.js';
import { addCommand } from './commands/add.js';
import { skills } from './commands/skills.js';
import { list } from './commands/list.js';
import { sync } from './commands/sync.js';
import { CLIError } from './utils/errors.js';
import { EXIT_CODE_ERROR, EXIT_CODE_SIGINT } from './utils/constants.js';

let sigintCount = 0;
process.on('SIGINT', () => {
  sigintCount++;
  if (sigintCount === 1) {
    logger.print('\n\nInterrupted.');
    process.exit(EXIT_CODE_SIGINT);
  } else {
    process.exit(EXIT_CODE_SIGINT);
  }
});

function wrapAction<T extends any[]>(
  action: (...args: T) => Promise<void>,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await action(...args);
    } catch (error: any) {
      if (error?.name === 'ExitPromptError') {
        logger.print('\nInterrupted.');
        process.exit(EXIT_CODE_SIGINT);
      }
      throw error;
    }
  };
}

const program = new Command();

program
  .name('agent-sync')
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

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CLIError) {
      logger.error(error.message);
      process.exit(EXIT_CODE_ERROR);
    } else if (error instanceof Error) {
      logger.error(`Unexpected error: ${error.message}`);
      if (process.env.VERBOSE) {
        logger.dim(error.stack || '');
      }
      process.exit(EXIT_CODE_ERROR);
    } else {
      logger.error('An unknown error occurred');
      process.exit(EXIT_CODE_ERROR);
    }
  }
}

main().catch((error) => {
  logger.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(EXIT_CODE_ERROR);
});
```

## File 9: .\src\commands\add.ts

```ts
import path from 'node:path';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { ValidationError, GitError } from '../utils/errors.js';
import { DEFAULT_GIT_BRANCH } from '../utils/constants.js';
import {
  loadConfig,
  saveConfig,
  addCatalog,
  getNextPriority,
  type CatalogEntry,
} from '../core/config.js';
import { isGitUrl, cloneOrPullCatalog } from '../utils/git.js';
import { getCatalogCachePath, getSkillsDir } from '../utils/paths.js';
import { resolveCatalogPath, installSkillsBatch } from '../core/installer.js';
import { discoverSkills, extractCatalogId } from '../core/discovery.js';
import {
  validatePathExists,
  validateSkillsDirectory,
  validateCatalogNotRegistered,
} from '../core/validation.js';

interface AddOptions {
  name?: string;
  priority?: number;
  inactive?: boolean;
  branch?: string;
  yes?: boolean;
  install?: boolean;
}

async function promptInstallSkills(
  catalogId: string,
  entry: CatalogEntry,
  autoConfirm: boolean,
): Promise<void> {
  const config = await loadConfig();
  const catalogPath = resolveCatalogPath(catalogId, entry);
  const skills = await discoverSkills(catalogPath);
  const skillCount = skills.size;

  if (skillCount === 0) {
    logger.info('No skills found in catalog');
    return;
  }

  let shouldInstall = autoConfirm;

  if (!autoConfirm) {
    shouldInstall = await confirm({
      message: `Found ${skillCount} skill${skillCount === 1 ? '' : 's'}. Install now?`,
      default: true,
    });
  } else {
    logger.info(`Found ${skillCount} skill${skillCount === 1 ? '' : 's'} in catalog`);
  }

  if (!shouldInstall) {
    return;
  }

  logger.blank();
  logger.info('Installing skills...');
  logger.blank();

  const availableSkills = Array.from(skills.entries()).map(([skillName, skill]) => ({
    catalogId,
    catalogEntry: entry,
    skillName,
    skill,
  }));

  const results = await installSkillsBatch(availableSkills, config, {
    skipPrompts: autoConfirm,
  });

  for (const result of results) {
    if (result.error) {
      logger.print(chalk.red(`✖ Failed ${result.skillName}: ${result.error}`));
    } else if (result.action === 'skipped') {
      logger.print(chalk.yellow(`⊘ Skipped ${result.skillName} (already exists)`));
    } else {
      logger.print(
        chalk.green(`✓ ${result.action === 'created' ? 'Created' : 'Updated'} ${result.skillName}`),
      );
    }
  }

  await saveConfig(config);

  const successCount = results.filter((r) => r.action !== 'skipped' && !r.error).length;
  const skippedCount = results.filter((r) => r.action === 'skipped').length;

  logger.blank();
  if (skippedCount > 0) {
    logger.info(`Skipped: ${skippedCount} skill${skippedCount === 1 ? '' : 's'} (already exists)`);
  }
  logger.success(
    `Done! ${successCount} skill${successCount === 1 ? '' : 's'} installed to ${getSkillsDir()}`,
  );
  logger.blank();
}

async function addGitCatalog(url: string, options: AddOptions): Promise<void> {
  const config = await loadConfig();
  const catalogId = extractCatalogId(url);

  const validation = validateCatalogNotRegistered(catalogId, config);
  if (!validation.valid) {
    throw new ValidationError(validation.error!);
  }

  const branch = options.branch || DEFAULT_GIT_BRANCH;
  const priority = options.priority ?? getNextPriority(config);
  const active = !options.inactive;

  logger.info(`Adding Git catalog: ${catalogId}`);
  logger.info(`  URL: ${url}`);
  logger.info(`  Branch: ${branch}`);
  logger.blank();

  const spinner = logger.spinner('Cloning repository...');
  const result = await cloneOrPullCatalog(catalogId, url, branch);

  if (!result.success) {
    spinner.fail('Failed to clone repository');
    throw new GitError(result.error || 'Failed to clone repository');
  }

  spinner.succeed('Repository cloned successfully');
  logger.blank();

  const cachePath = getCatalogCachePath(catalogId);
  const validation2 = validateSkillsDirectory(cachePath);
  if (!validation2.valid) {
    throw new ValidationError(validation2.error!);
  }

  const skills = await discoverSkills(cachePath);
  logger.info(`Discovered ${skills.size} skill${skills.size === 1 ? '' : 's'}`);

  const entry: CatalogEntry = {
    type: 'git',
    url,
    branch,
    priority,
    active,
    lastSynced: new Date().toISOString(),
  };

  addCatalog(config, catalogId, entry);
  await saveConfig(config);

  logger.success(`Catalog "${catalogId}" added successfully`);
  logger.blank();

  if (options.install !== false) {
    await promptInstallSkills(catalogId, entry, options.yes || false);
  }
}

async function addLocalCatalog(catalogPath: string, options: AddOptions): Promise<void> {
  const config = await loadConfig();
  const absPath = path.resolve(catalogPath);

  const pathValidation = validatePathExists(absPath);
  if (!pathValidation.valid) {
    throw new ValidationError(pathValidation.error!);
  }

  const skillsDirValidation = validateSkillsDirectory(absPath);
  if (!skillsDirValidation.valid) {
    throw new ValidationError(skillsDirValidation.error!);
  }

  const catalogId = extractCatalogId(absPath);

  const catalogValidation = validateCatalogNotRegistered(catalogId, config);
  if (!catalogValidation.valid) {
    throw new ValidationError(catalogValidation.error!);
  }

  const priority = options.priority ?? getNextPriority(config);
  const active = !options.inactive;

  logger.info(`Adding local catalog: ${catalogId}`);
  logger.info(`  Path: ${absPath}`);
  logger.blank();

  const skills = await discoverSkills(absPath);
  logger.info(`Discovered ${skills.size} skill${skills.size === 1 ? '' : 's'}`);

  const entry: CatalogEntry = {
    type: 'local',
    path: absPath,
    priority,
    active,
  };

  addCatalog(config, catalogId, entry);
  await saveConfig(config);

  logger.success(`Catalog "${catalogId}" added successfully`);
  logger.blank();

  if (options.install !== false) {
    await promptInstallSkills(catalogId, entry, options.yes || false);
  }
}

export async function addCommand(catalogPathOrUrl: string, options: AddOptions): Promise<void> {
  if (isGitUrl(catalogPathOrUrl)) {
    await addGitCatalog(catalogPathOrUrl, options);
  } else {
    await addLocalCatalog(catalogPathOrUrl, options);
  }
}
```

## File 10: .\src\commands\catalog\init.ts

```ts
import path from 'node:path';
import { input } from '@inquirer/prompts';
import { logger } from '../../utils/logger.js';
import { existsSync, ensureDirAsync, writeFileAsync } from '../../utils/fs-async.js';

interface InitOptions {
  name?: string;
}

export async function catalogInit(options: InitOptions = {}) {
  const name =
    options.name ||
    (await input({
      message: 'Catalog name:',
      default: 'My Skills Catalog',
    }));

  const catalogPath = process.cwd();

  logger.debug(`Creating catalog at: ${catalogPath}`);

  const skillsDir = path.join(catalogPath, 'skills');

  if (!existsSync(skillsDir)) {
    await ensureDirAsync(skillsDir);
    logger.success(`Created skills/ directory`);
  } else {
    logger.info(`skills/ directory already exists`);
  }

  const readmePath = path.join(catalogPath, 'README.md');
  if (!existsSync(readmePath)) {
    const readme = `# ${name}

A catalog of OpenCode skills.

## Structure

\`\`\`
skills/          # OpenCode skills (each skill is a folder with SKILL.md)
  frontend/
    SKILL.md
  backend-api/
    SKILL.md
README.md        # This file
\`\`\`

## Usage

### Creating Skills

Add new skills to the catalog:

\`\`\`bash
# Add a new skill
npx @brequet/agent-sync catalog skill add my-skill

# Or manually create a folder with SKILL.md
mkdir -p skills/my-skill
# Then create skills/my-skill/SKILL.md with frontmatter
\`\`\`

### SKILL.md Format

Each skill must have a SKILL.md file with frontmatter:

\`\`\`markdown
---
name: my-skill
description: A helpful skill
license: MIT
compatibility: opencode
metadata:
  tags: example, demo
---

## What I do

[Describe what this skill does]

## When to use me

[Describe when to use this skill]

## Instructions

[Add detailed instructions for AI agents]
\`\`\`

### Using the Catalog

Users can add this catalog:

\`\`\`bash
# Local catalog
npx @brequet/agent-sync add /path/to/this/catalog

# Git catalog (once published)
npx @brequet/agent-sync add https://github.com/your-org/your-catalog
\`\`\`

No build step needed - the CLI discovers skills by scanning the skills/ directory!
`;
    await writeFileAsync(readmePath, readme);
    logger.success('Created README.md');
  } else {
    logger.info('README.md already exists');
  }

  logger.blank();
  logger.print('✨ Catalog initialized successfully!');
  logger.blank();
  logger.info(`Next steps:`);
  logger.info(`  1. Add skills: npx @brequet/agent-sync catalog skill add <name>`);
  logger.info(`  2. Edit SKILL.md files with your skill instructions`);
  logger.info(`  3. Share your catalog via Git or local path`);
  logger.blank();
}
```

## File 11: .\src\commands\catalog\skill-add.ts

```ts
import path from 'node:path';
import { input } from '@inquirer/prompts';
import { logger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { toSkillName } from '../../utils/helpers.js';
import { validateSkillName, validateSkillDescription } from '../../core/validation.js';
import { existsSync, ensureDirAsync, writeFileAsync } from '../../utils/fs-async.js';

interface SkillAddOptions {
  description?: string;
  tags?: string;
  license?: string;
}

const SKILL_TEMPLATE = (name: string, description: string, tags: string[], license?: string) => `---
name: ${name}
description: ${description}
license: ${license || 'MIT'}
compatibility: opencode
metadata:
  tags: ${tags.join(', ')}
---

## What I do

[Describe what this skill does]

## When to use me

[Describe when agents should use this skill]

## Instructions

[Add detailed instructions for agents]

## Examples

[Add examples of how to use this skill]

## Notes

[Additional context or considerations]
`;

export async function catalogSkillAdd(name?: string, options: SkillAddOptions = {}) {
  const catalogPath = process.cwd();
  const skillsDir = path.join(catalogPath, 'skills');

  if (!existsSync(skillsDir)) {
    throw new ValidationError('No catalog found. Run "npx @brequet/agent-sync catalog init" first.');
  }

  const rawName =
    name ||
    (await input({
      message: 'Skill name (lowercase, alphanumeric, hyphens):',
      required: true,
    }));

  const skillName = toSkillName(rawName);
  const nameValidation = validateSkillName(skillName);

  if (!nameValidation.valid) {
    throw new ValidationError(`Invalid skill name: ${nameValidation.error}`);
  }

  if (skillName !== rawName.toLowerCase()) {
    logger.debug(`Normalized skill name: "${rawName}" → "${skillName}"`);
  }

  const description =
    options.description ||
    (await input({
      message: 'Description (1-1024 chars):',
      default: `Skill for ${skillName}`,
      validate: (value) => {
        const result = validateSkillDescription(value);
        return result.valid ? true : result.error!;
      },
    }));

  const descValidation = validateSkillDescription(description);
  if (!descValidation.valid) {
    throw new ValidationError(`Invalid description: ${descValidation.error}`);
  }

  const tagsInput =
    options.tags ||
    (await input({
      message: 'Tags (comma-separated, optional):',
      default: '',
    }));

  const tags = tagsInput
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean);

  const license = options.license || 'MIT';

  const skillDir = path.join(skillsDir, skillName);
  if (existsSync(skillDir)) {
    throw new ValidationError(`Skill "${skillName}" already exists`);
  }

  await ensureDirAsync(skillDir);

  const skillFilePath = path.join(skillDir, 'SKILL.md');
  const skillContent = SKILL_TEMPLATE(skillName, description, tags, license);
  await writeFileAsync(skillFilePath, skillContent);
  logger.success(`Created skills/${skillName}/SKILL.md`);

  logger.blank();
  logger.print('✨ Skill added successfully!');
  logger.blank();
  logger.info(`Name:  ${skillName}`);
  logger.info(`Path:  skills/${skillName}/SKILL.md`);
  logger.info(`\nNext: Edit skills/${skillName}/SKILL.md to add skill instructions`);
  logger.blank();
}
```

## File 12: .\src\commands\catalog\validate.ts

```ts
import path from 'node:path';
import matter from 'gray-matter';
import { logger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { validateSkillName, validateSkillDescription } from '../../core/validation.js';
import { existsSync, readdirAsync, readFileAsync } from '../../utils/fs-async.js';
import chalk from 'chalk';

export async function catalogValidate() {
  const catalogPath = process.cwd();
  const skillsDir = path.join(catalogPath, 'skills');

  if (!existsSync(skillsDir)) {
    throw new ValidationError('No catalog found. Run "npx @brequet/agent-sync catalog init" first.');
  }

  logger.info('Validating catalog...');
  logger.blank();

  let hasErrors = false;
  let skillCount = 0;
  const errors: string[] = [];

  const entries = await readdirAsync(skillsDir, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory());

  if (skillDirs.length === 0) {
    logger.warn('No skills found in skills/ directory');
    logger.blank();
    return;
  }

  logger.info(`Found ${skillDirs.length} skill folder${skillDirs.length === 1 ? '' : 's'}`);
  logger.blank();

  for (const dir of skillDirs) {
    skillCount++;
    const skillName = dir.name;
    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');

    logger.print(chalk.cyan(`Checking ${skillName}...`));

    if (!existsSync(skillPath)) {
      logger.print(chalk.red(`  ✖ Missing SKILL.md`));
      errors.push(`${skillName}: Missing SKILL.md file`);
      hasErrors = true;
      continue;
    }

    const nameValidation = validateSkillName(skillName);
    if (!nameValidation.valid) {
      logger.print(chalk.red(`  ✖ Invalid skill name: ${nameValidation.error}`));
      errors.push(`${skillName}: Invalid name - ${nameValidation.error}`);
      hasErrors = true;
    }

    try {
      const content = await readFileAsync(skillPath);
      const { data, content: body } = matter(content);

      if (!data.name) {
        logger.print(chalk.red(`  ✖ Missing required field: name`));
        errors.push(`${skillName}: Missing 'name' field in frontmatter`);
        hasErrors = true;
      } else if (data.name !== skillName) {
        logger.print(
          chalk.yellow(
            `  ⚠ Warning: frontmatter name "${data.name}" doesn't match folder name "${skillName}"`,
          ),
        );
      }

      if (!data.description) {
        logger.print(chalk.red(`  ✖ Missing required field: description`));
        errors.push(`${skillName}: Missing 'description' field in frontmatter`);
        hasErrors = true;
      } else {
        const descValidation = validateSkillDescription(data.description);
        if (!descValidation.valid) {
          logger.print(chalk.red(`  ✖ Invalid description: ${descValidation.error}`));
          errors.push(`${skillName}: ${descValidation.error}`);
          hasErrors = true;
        }
      }

      if (!body || body.trim().length === 0) {
        logger.print(chalk.red(`  ✖ SKILL.md has no content after frontmatter`));
        errors.push(`${skillName}: No content in SKILL.md`);
        hasErrors = true;
      }

      if (!hasErrors) {
        logger.print(chalk.green(`  ✓ Valid`));
      }
    } catch (error) {
      logger.print(chalk.red(`  ✖ Failed to parse: ${(error as Error).message}`));
      errors.push(`${skillName}: Parse error - ${(error as Error).message}`);
      hasErrors = true;
    }

    logger.blank();
  }

  if (hasErrors) {
    throw new ValidationError(
      `Validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  } else {
    logger.success(
      `✨ All ${skillCount} skill${skillCount === 1 ? '' : 's'} validated successfully!`,
    );
  }
}
```

## File 13: .\src\commands\list.ts

```ts
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
    logger.info('Add a catalog: npx @brequet/agent-sync add <catalog-path>');
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
    logger.info('Install skills: npx @brequet/agent-sync skills');
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
```

## File 14: .\src\commands\skills.ts

```ts
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
      'No catalogs registered. Add a catalog first: npx @brequet/agent-sync add <catalog-path>',
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
```

## File 15: .\src\commands\sync.ts

```ts
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
```

## File 16: .\src\core\config.ts

```ts
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { getConfigPath, getConfigDir, ensureDirAsync } from '../utils/paths.js';
import { writeFileAtomicAsync } from '../utils/fs-async.js';
import { logger } from '../utils/logger.js';

export interface CatalogEntry {
  type: 'local' | 'git';
  path?: string;
  url?: string;
  branch?: string;
  priority: number;
  active: boolean;
  lastSynced?: string;
}

export interface InstalledSkill {
  catalog: string;
}

export interface UserConfig {
  catalogs: Record<string, CatalogEntry>;
  installed: Record<string, InstalledSkill>;
}

export async function loadConfig(): Promise<UserConfig> {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    logger.debug('Config file not found, creating default config');
    return {
      catalogs: {},
      installed: {},
    };
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    logger.debug(`Loaded config from ${configPath}`);
    return config;
  } catch (error) {
    logger.error('Failed to parse config file, using default config', error as Error);
    return {
      catalogs: {},
      installed: {},
    };
  }
}

export async function saveConfig(config: UserConfig): Promise<void> {
  const configPath = getConfigPath();
  const configDir = getConfigDir();

  await ensureDirAsync(configDir);

  try {
    await writeFileAtomicAsync(configPath, JSON.stringify(config, null, 2));
    logger.debug(`Saved config to ${configPath}`);
  } catch (error) {
    logger.error('Failed to save config file', error as Error);
    throw error;
  }
}

export function addCatalog(config: UserConfig, id: string, entry: CatalogEntry): void {
  config.catalogs[id] = entry;
}

export function removeCatalog(config: UserConfig, id: string): void {
  delete config.catalogs[id];
}

export function getNextPriority(config: UserConfig): number {
  const priorities = Object.values(config.catalogs).map((c) => c.priority);
  return priorities.length === 0 ? 1 : Math.max(...priorities) + 1;
}

export function trackInstallation(config: UserConfig, skillName: string, catalogId: string): void {
  config.installed[skillName] = { catalog: catalogId };
}

export function untrackInstallation(config: UserConfig, skillName: string): void {
  delete config.installed[skillName];
}

export function getActiveCatalogs(config: UserConfig): Array<{ id: string; entry: CatalogEntry }> {
  return Object.entries(config.catalogs)
    .filter(([, entry]) => entry.active)
    .map(([id, entry]) => ({ id, entry }))
    .sort((a, b) => a.entry.priority - b.entry.priority);
}
```

## File 17: .\src\core\diff.ts

```ts
import type { UserConfig, CatalogEntry, InstalledSkill } from './config.js';
import { discoverSkills, type DiscoveredSkill } from './discovery.js';
import { resolveCatalogPath } from './installer.js';
import { logger } from '../utils/logger.js';
import { getSkillsDir } from '../utils/paths.js';
import { computeFileHash } from '../utils/hash.js';
import { existsSync } from '../utils/fs-async.js';
import path from 'node:path';

export interface AvailableSkill {
  catalogId: string;
  catalogEntry: CatalogEntry;
  skillName: string;
  skill: DiscoveredSkill;
}

export interface RemovedSkill {
  skillName: string;
  installedSkill: InstalledSkill;
}

export interface DiffResult {
  new: AvailableSkill[];
  updated: AvailableSkill[];
  removed: RemovedSkill[];
  unchanged: AvailableSkill[];
}

async function computeActualFileHash(skillName: string): Promise<string | null> {
  const skillsDir = getSkillsDir();
  const skillPath = path.join(skillsDir, skillName, 'SKILL.md');

  if (!existsSync(skillPath)) {
    return null;
  }

  try {
    return await computeFileHash(skillPath);
  } catch (error) {
    logger.debug(`Failed to compute hash for ${skillName}: ${(error as Error).message}`);
    return null;
  }
}

export async function compareWithCatalog(
  config: UserConfig,
  catalogs: Array<{ id: string; entry: CatalogEntry }>,
): Promise<DiffResult> {
  const result: DiffResult = {
    new: [],
    updated: [],
    removed: [],
    unchanged: [],
  };

  const seenInstalledSkills = new Set<string>();

  for (const { id: catalogId, entry } of catalogs) {
    try {
      const catalogPath = resolveCatalogPath(catalogId, entry);
      const skills = await discoverSkills(catalogPath);

      if (skills.size === 0) {
        logger.debug(`No skills in catalog: ${catalogId}`);
        continue;
      }

      for (const [skillName, skill] of skills) {
        const installedSkill = config.installed[skillName];

        const availableSkill: AvailableSkill = {
          catalogId,
          catalogEntry: entry,
          skillName,
          skill,
        };

        if (!installedSkill) {
          result.new.push(availableSkill);
        } else {
          seenInstalledSkills.add(skillName);

          if (installedSkill.catalog !== catalogId) {
            logger.debug(
              `Skill ${skillName} installed from ${installedSkill.catalog}, not ${catalogId}`,
            );
            continue;
          }

          const actualFileHash = await computeActualFileHash(skillName);
          const fileMissing = actualFileHash === null;

          if (fileMissing) {
            result.updated.push(availableSkill);
          } else {
            let catalogSourceHash: string | null = null;
            try {
              if (existsSync(skill.sourcePath)) {
                catalogSourceHash = await computeFileHash(skill.sourcePath);
              }
            } catch (error) {
              logger.debug(
                `Failed to compute catalog source hash for ${skillName}: ${(error as Error).message}`,
              );
            }

            const needsUpdate = catalogSourceHash !== null && actualFileHash !== catalogSourceHash;

            if (needsUpdate) {
              result.updated.push(availableSkill);
            } else {
              result.unchanged.push(availableSkill);
            }
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to load catalog ${catalogId}: ${(error as Error).message}`);
    }
  }

  for (const [skillName, installedSkill] of Object.entries(config.installed)) {
    if (!seenInstalledSkills.has(skillName)) {
      result.removed.push({
        skillName,
        installedSkill,
      });
    }
  }

  return result;
}

export interface DiffSummary {
  hasChanges: boolean;
  newCount: number;
  updatedCount: number;
  removedCount: number;
}

export function getDiffSummary(diff: DiffResult): DiffSummary {
  return {
    hasChanges: diff.new.length > 0 || diff.updated.length > 0 || diff.removed.length > 0,
    newCount: diff.new.length,
    updatedCount: diff.updated.length,
    removedCount: diff.removed.length,
  };
}
```

## File 18: .\src\core\discovery.ts

```ts
import path from 'node:path';
import matter from 'gray-matter';
import { logger } from '../utils/logger.js';
import { existsSync, readFileAsync, readdirAsync } from '../utils/fs-async.js';

export interface DiscoveredSkill {
  name: string;
  description: string;
  tags: string[];
  sourcePath: string;
  folderName: string;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: {
    tags?: string;
  };
}

async function parseSkillFrontmatter(skillPath: string): Promise<SkillFrontmatter | null> {
  try {
    const content = await readFileAsync(skillPath);
    const { data } = matter(content);

    if (!data.name || !data.description) {
      logger.warn(`Invalid SKILL.md frontmatter in ${skillPath}: missing name or description`);
      return null;
    }

    return data as SkillFrontmatter;
  } catch (error) {
    logger.warn(`Failed to parse SKILL.md frontmatter: ${(error as Error).message}`);
    return null;
  }
}

export async function discoverSkills(catalogPath: string): Promise<Map<string, DiscoveredSkill>> {
  const skills = new Map<string, DiscoveredSkill>();
  const skillsDir = path.join(catalogPath, 'skills');

  if (!existsSync(skillsDir)) {
    logger.debug(`No skills directory found in ${catalogPath}`);
    return skills;
  }

  try {
    const entries = await readdirAsync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');

      if (!existsSync(skillPath)) {
        logger.debug(`No SKILL.md found in ${entry.name}, skipping`);
        continue;
      }

      const frontmatter = await parseSkillFrontmatter(skillPath);
      if (!frontmatter) {
        continue;
      }

      const tags = frontmatter.metadata?.tags
        ? frontmatter.metadata.tags.split(',').map((t) => t.trim())
        : [];

      skills.set(frontmatter.name, {
        name: frontmatter.name,
        description: frontmatter.description,
        tags,
        sourcePath: skillPath,
        folderName: entry.name,
      });

      logger.debug(`Discovered skill: ${frontmatter.name} from ${entry.name}`);
    }
  } catch (error) {
    logger.warn(`Failed to discover skills in ${catalogPath}: ${(error as Error).message}`);
  }

  return skills;
}

export function extractCatalogId(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    const match = pathOrUrl.match(/github\.com\/([^/]+\/[^/]+?)(\.git)?$/);
    if (match) {
      return match[1];
    }
    return path.basename(pathOrUrl, '.git');
  }

  return path.basename(pathOrUrl);
}

export function sanitizeCatalogIdForPath(catalogId: string): string {
  return catalogId.replace(/\//g, '-').replace(/\\/g, '-');
}
```

## File 19: .\src\core\installer.ts

```ts
import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { getSkillsDir, getCatalogCachePath } from '../utils/paths.js';
import { existsSync, ensureDirAsync, copyFileAsync } from '../utils/fs-async.js';
import { FileSystemError } from '../utils/errors.js';
import type { UserConfig, CatalogEntry } from './config.js';
import type { DiscoveredSkill } from './discovery.js';
import type { AvailableSkill } from './diff.js';
import { trackInstallation } from './config.js';

export interface InstallOptions {
  force?: boolean;
  skipPrompts?: boolean;
  onProgress?: (skill: string, status: 'install' | 'skip' | 'error') => void;
}

export interface InstallResult {
  skillName: string;
  action: 'created' | 'updated' | 'skipped';
  error?: string;
}

export function resolveCatalogPath(catalogId: string, entry: CatalogEntry): string {
  if (entry.type === 'local') {
    return entry.path!;
  } else if (entry.type === 'git') {
    const cachePath = getCatalogCachePath(catalogId);

    if (!existsSync(cachePath)) {
      throw new FileSystemError(
        `Git catalog cache not found for "${catalogId}". Run 'sync' first or check your internet connection.`,
      );
    }

    return cachePath;
  }

  throw new Error(`Unknown catalog type: ${(entry as any).type}`);
}

export function checkSkillExists(
  skillName: string,
  config: UserConfig,
): { type: 'catalog'; catalogId: string } | { type: 'custom' } | null {
  const skillPath = path.join(getSkillsDir(), skillName, 'SKILL.md');

  if (!existsSync(skillPath)) {
    return null;
  }

  const installedSkill = config.installed[skillName];
  if (installedSkill) {
    return { type: 'catalog', catalogId: installedSkill.catalog };
  }

  return { type: 'custom' };
}

export async function installSkill(
  skillName: string,
  skill: DiscoveredSkill,
  targetDir: string,
): Promise<void> {
  const sourcePath = skill.sourcePath;

  if (!existsSync(sourcePath)) {
    throw new FileSystemError(`Skill file not found: ${sourcePath}`);
  }

  const skillDir = path.join(targetDir, skillName);
  await ensureDirAsync(skillDir);

  const targetPath = path.join(skillDir, 'SKILL.md');
  await copyFileAsync(sourcePath, targetPath);

  logger.debug(`Copied ${sourcePath} -> ${targetPath}`);
}

export async function installSkillsBatch(
  skills: AvailableSkill[],
  config: UserConfig,
  options: InstallOptions = {},
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];
  const targetDir = getSkillsDir();

  await ensureDirAsync(targetDir);

  for (const availableSkill of skills) {
    const { catalogId, skillName, skill } = availableSkill;

    try {
      const existing = checkSkillExists(skillName, config);

      if (existing && !options.force) {
        let shouldOverwrite = options.skipPrompts || false;

        if (!shouldOverwrite) {
          const message =
            existing.type === 'catalog'
              ? `Skill '${skillName}' already installed from catalog '${existing.catalogId}'. Overwrite?`
              : `Skill '${skillName}' exists (custom skill). Overwrite with version from '${catalogId}'?`;

          shouldOverwrite = await confirm({ message, default: false });
        }

        if (!shouldOverwrite) {
          results.push({ skillName, action: 'skipped' });
          options.onProgress?.(skillName, 'skip');
          continue;
        }
      }

      const action = existing ? 'updated' : 'created';

      await installSkill(skillName, skill, targetDir);
      trackInstallation(config, skillName, catalogId);

      results.push({ skillName, action });
      options.onProgress?.(skillName, 'install');
    } catch (error) {
      results.push({
        skillName,
        action: 'skipped',
        error: (error as Error).message,
      });
      options.onProgress?.(skillName, 'error');
    }
  }

  return results;
}
```

## File 20: .\src\core\validation.ts

```ts
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { UserConfig } from './config.js';
import { SKILL_NAME_MAX_LENGTH, SKILL_DESCRIPTION_MAX_LENGTH } from '../utils/constants.js';

export interface ValidationResult<T = void> {
  valid: boolean;
  value?: T;
  error?: string;
}

export function validateSkillName(name: string): ValidationResult {
  const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  if (!name || name.length === 0) {
    return { valid: false, error: 'Skill name cannot be empty' };
  }

  if (name.length > SKILL_NAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Skill name must be 1-${SKILL_NAME_MAX_LENGTH} characters`,
    };
  }

  if (!nameRegex.test(name)) {
    return {
      valid: false,
      error:
        'Skill name must be lowercase alphanumeric with single hyphen separators (e.g., "my-skill")',
    };
  }

  return { valid: true };
}

export function validateSkillDescription(description: string): ValidationResult {
  if (!description || description.length === 0) {
    return { valid: false, error: 'Description cannot be empty' };
  }

  if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
    return {
      valid: false,
      error: `Description must be 1-${SKILL_DESCRIPTION_MAX_LENGTH} characters`,
    };
  }

  return { valid: true };
}

export function validatePathExists(filePath: string): ValidationResult {
  if (!existsSync(filePath)) {
    return { valid: false, error: `Path does not exist: ${filePath}` };
  }
  return { valid: true };
}

export function validateSkillsDirectory(catalogPath: string): ValidationResult {
  const skillsDir = path.join(catalogPath, 'skills');
  if (!existsSync(skillsDir)) {
    return { valid: false, error: 'Catalog does not have a skills/ directory' };
  }
  return { valid: true };
}

export function validateCatalogNotRegistered(
  catalogId: string,
  config: UserConfig,
): ValidationResult {
  if (config.catalogs[catalogId]) {
    return { valid: false, error: `Catalog "${catalogId}" is already registered` };
  }
  return { valid: true };
}

export function validateGitUrl(input: string): ValidationResult {
  const gitUrlPatterns = [/^https?:\/\//i, /^git:\/\//i, /^git@/i, /^ssh:\/\//i];

  const isGit = gitUrlPatterns.some((pattern) => pattern.test(input));
  if (!isGit) {
    return { valid: false, error: 'Invalid Git URL format' };
  }

  return { valid: true };
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: {
    tags?: string;
  };
}

export function validateSkillFrontmatter(data: any): ValidationResult<SkillFrontmatter> {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid frontmatter' };
  }

  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: 'Missing or invalid "name" field in frontmatter' };
  }

  if (!data.description || typeof data.description !== 'string') {
    return { valid: false, error: 'Missing or invalid "description" field in frontmatter' };
  }

  const nameValidation = validateSkillName(data.name);
  if (!nameValidation.valid) {
    return { valid: false, error: `Invalid name: ${nameValidation.error}` };
  }

  const descValidation = validateSkillDescription(data.description);
  if (!descValidation.valid) {
    return { valid: false, error: `Invalid description: ${descValidation.error}` };
  }

  return { valid: true, value: data as SkillFrontmatter };
}
```

## File 21: .\src\utils\constants.ts

```ts
export const SKILL_NAME_MAX_LENGTH = 64;
export const SKILL_DESCRIPTION_MAX_LENGTH = 1024;
export const SKILL_DESCRIPTION_MIN_LENGTH = 1;

export const EXIT_CODE_SUCCESS = 0;
export const EXIT_CODE_ERROR = 1;
export const EXIT_CODE_SIGINT = 130;

export const DEFAULT_GIT_BRANCH = 'main';
export const GIT_CLONE_DEPTH = 1;

export const DIVIDER_WIDTH = 60;
```

## File 22: .\src\utils\errors.ts

```ts
import { EXIT_CODE_ERROR } from './constants.js';

export class CLIError extends Error {
  constructor(
    message: string,
    public exitCode: number = EXIT_CODE_ERROR,
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_ERROR);
    this.name = 'ValidationError';
  }
}

export class FileSystemError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_ERROR);
    this.name = 'FileSystemError';
  }
}

export class GitError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_ERROR);
    this.name = 'GitError';
  }
}
```

## File 23: .\src\utils\fs-async.ts

```ts
import { readFile, writeFile, mkdir, copyFile, readdir, rm, access, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { FileSystemError } from './errors.js';

export { existsSync };

export async function readFileAsync(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to read file: ${path} - ${message}`);
  }
}

export async function writeFileAsync(path: string, content: string): Promise<void> {
  try {
    await writeFile(path, content, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to write file: ${path} - ${message}`);
  }
}

/**
 * Atomically writes content to a file using a temporary file and rename.
 * This prevents corruption if the process crashes or is interrupted during write.
 *
 * @param path - The target file path
 * @param content - The content to write
 * @throws {FileSystemError} If the write or rename operation fails
 */
export async function writeFileAtomicAsync(path: string, content: string): Promise<void> {
  const tmpPath = `${path}.tmp`;

  try {
    // Write to temporary file first
    await writeFile(tmpPath, content, 'utf-8');

    // Atomically rename temp file to target (atomic operation on most systems)
    await rename(tmpPath, path);
  } catch (err) {
    // Clean up temp file if it exists
    try {
      await rm(tmpPath, { force: true });
    } catch {
      // Ignore cleanup errors
    }

    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to atomically write file: ${path} - ${message}`);
  }
}

export async function ensureDirAsync(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to create directory: ${path} - ${message}`);
  }
}

export async function copyFileAsync(src: string, dest: string): Promise<void> {
  try {
    await copyFile(src, dest);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to copy file: ${src} -> ${dest} - ${message}`);
  }
}

export async function readdirAsync(
  path: string,
  _options?: { withFileTypes: true },
): Promise<Dirent[]> {
  try {
    return (await readdir(path, { withFileTypes: true })) as Dirent[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to read directory: ${path} - ${message}`);
  }
}

export async function removeAsync(path: string): Promise<void> {
  try {
    await rm(path, { recursive: true, force: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to remove: ${path} - ${message}`);
  }
}

export async function pathExistsAsync(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
```

## File 24: .\src\utils\git.ts

```ts
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { getCatalogCachePath, getCatalogCacheDir, ensureDirAsync } from './paths.js';
import { logger } from './logger.js';
import { DEFAULT_GIT_BRANCH, GIT_CLONE_DEPTH } from './constants.js';

const execAsync = promisify(exec);

export interface GitOperationResult {
  success: boolean;
  error?: string;
}

export function isGitUrl(input: string): boolean {
  const gitUrlPatterns = [/^https?:\/\//i, /^git:\/\//i, /^git@/i, /^ssh:\/\//i];
  return gitUrlPatterns.some((pattern) => pattern.test(input));
}

export async function checkGitAvailable(): Promise<boolean> {
  try {
    await execAsync('git --version');
    return true;
  } catch {
    return false;
  }
}

export async function cloneOrPullCatalog(
  catalogId: string,
  url: string,
  branch: string = DEFAULT_GIT_BRANCH,
): Promise<GitOperationResult> {
  const gitAvailable = await checkGitAvailable();
  if (!gitAvailable) {
    return {
      success: false,
      error:
        'Git not installed. Please install Git to use Git-based catalogs.\n' +
        'Download from: https://git-scm.com/downloads',
    };
  }

  const cachePath = getCatalogCachePath(catalogId);
  logger.debug(`Git operation for ${catalogId} at ${cachePath}`);

  try {
    if (existsSync(cachePath)) {
      logger.debug(`Pulling updates for ${catalogId} from ${branch}...`);

      try {
        await execAsync(`git fetch origin ${branch}`, { cwd: cachePath });
        await execAsync(`git reset --hard origin/${branch}`, { cwd: cachePath });
        logger.debug(`Successfully pulled ${catalogId}`);
      } catch (pullError) {
        logger.debug(`Pull failed, attempting to re-clone: ${(pullError as Error).message}`);
        await rm(cachePath, { recursive: true, force: true });
        return await cloneRepository(catalogId, url, branch, cachePath);
      }
    } else {
      return await cloneRepository(catalogId, url, branch, cachePath);
    }

    return { success: true };
  } catch (error) {
    return handleGitError(error as Error);
  }
}

async function cloneRepository(
  catalogId: string,
  url: string,
  branch: string,
  cachePath: string,
): Promise<GitOperationResult> {
  logger.debug(`Cloning ${catalogId} from ${url} (branch: ${branch})...`);

  try {
    await ensureDirAsync(getCatalogCacheDir());
    await execAsync(`git clone --depth ${GIT_CLONE_DEPTH} --branch ${branch} ${url} ${cachePath}`);
    logger.debug(`Successfully cloned ${catalogId}`);
    return { success: true };
  } catch (error) {
    return handleGitError(error as Error);
  }
}

function handleGitError(error: Error): GitOperationResult {
  const errorMsg = error.message.toLowerCase();

  if (
    errorMsg.includes('not found') ||
    (errorMsg.includes('repository') && errorMsg.includes('does not exist'))
  ) {
    return {
      success: false,
      error: 'Repository not found. Check the URL and ensure the repository exists.',
    };
  }

  if (
    errorMsg.includes('authentication') ||
    errorMsg.includes('permission') ||
    errorMsg.includes('access denied')
  ) {
    return {
      success: false,
      error:
        'Authentication required. Ensure you have access to this repository.\n' +
        'For private repos, set up SSH keys or use a personal access token.',
    };
  }

  if (errorMsg.includes('branch') || errorMsg.includes('reference')) {
    return {
      success: false,
      error: 'Branch not found. Check the branch name or try with --branch main',
    };
  }

  if (
    errorMsg.includes('network') ||
    errorMsg.includes('connection') ||
    errorMsg.includes('timeout')
  ) {
    return {
      success: false,
      error: 'Network connection failed. Check your internet connection and try again.',
    };
  }

  const firstLine = error.message.split('\n')[0];
  return {
    success: false,
    error: `Git operation failed: ${firstLine}`,
  };
}

export async function getCurrentCommitHash(catalogPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git rev-parse HEAD', { cwd: catalogPath });
    return stdout.trim();
  } catch (error) {
    logger.debug(`Failed to get commit hash: ${(error as Error).message}`);
    return null;
  }
}

export async function getCurrentBranch(catalogPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: catalogPath });
    return stdout.trim();
  } catch (error) {
    logger.debug(`Failed to get branch name: ${(error as Error).message}`);
    return null;
  }
}
```

## File 25: .\src\utils\hash.ts

```ts
import crypto from 'node:crypto';
import { readFileAsync } from './fs-async.js';

export async function computeFileHash(filePath: string): Promise<string> {
  const content = await readFileAsync(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}
```

## File 26: .\src\utils\helpers.ts

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function toSkillName(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getDirname(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}
```

## File 27: .\src\utils\logger.ts

```ts
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { DIVIDER_WIDTH } from './constants.js';

let verbose = false;

export function setVerbose(enabled: boolean) {
  verbose = enabled;
}

export const logger = {
  info(message: string) {
    console.log(message);
  },

  success(message: string) {
    console.log(chalk.green('✔ '), message);
  },

  error(message: string, error?: Error) {
    console.error(chalk.red('✖ '), message);
    if (verbose && error?.stack) {
      console.error(chalk.gray(error.stack));
    }
  },

  warn(message: string) {
    console.warn(chalk.yellow('⚠️ '), message);
  },

  debug(message: string) {
    if (verbose) {
      console.log(chalk.gray('[DEBUG] '), message);
    }
  },

  blank() {
    console.log('');
  },

  section(title: string) {
    console.log(chalk.bold(title));
  },

  divider(char: string = '─', width: number = DIVIDER_WIDTH) {
    console.log(chalk.dim(char.repeat(width)));
  },

  dim(message: string) {
    console.log(chalk.dim(message));
  },

  print(message: string) {
    console.log(message);
  },

  spinner(text: string): Ora {
    return ora({ text, stream: process.stdout }).start();
  },
};
```

## File 28: .\src\utils\paths.ts

```ts
import os from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

let testOverrides: { skillsDir?: string; configDir?: string } | null = null;

export function __setTestPaths(overrides: { skillsDir?: string; configDir?: string }): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__setTestPaths can only be called in test environment');
  }
  testOverrides = overrides;
}

export function __clearTestPaths(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__clearTestPaths can only be called in test environment');
  }
  testOverrides = null;
}

export function getHomeDir(): string {
  return os.homedir();
}

export function getConfigDir(): string {
  if (testOverrides?.configDir) return testOverrides.configDir;
  return path.join(getHomeDir(), '.config', 'agent-sync');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function tryDetectSkillsDir(): string | null {
  const homeDir = getHomeDir();

  const candidates = [
    path.join(homeDir, '.config', 'opencode', 'skills'),
    path.join(
      process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
      'opencode',
      'skills',
    ),
    path.join(
      process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'),
      'opencode',
      'skills',
    ),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function getDefaultSkillsDir(): string {
  const homeDir = getHomeDir();
  return path.join(homeDir, '.config', 'opencode', 'skills');
}

export function getSkillsDir(): string {
  if (testOverrides?.skillsDir) return testOverrides.skillsDir;
  return tryDetectSkillsDir() || getDefaultSkillsDir();
}

export function getCatalogCacheDir(): string {
  return path.join(getConfigDir(), '.cache');
}

export function getCatalogCachePath(catalogId: string): string {
  const sanitized = catalogId.replace(/\//g, '-').replace(/\\/g, '-');
  return path.join(getCatalogCacheDir(), sanitized);
}

export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdir(dirPath, { recursive: true });
  }
}

export async function ensureDirAsync(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}
```

## File 29: .\tests\fixtures\catalog-a\CATALOG.md

```md
---
name: Test Catalog A
description: A minimal test catalog for integration testing
author: Test Suite
version: 1.0.0
---

# Test Catalog A

This is a minimal test catalog for verifying catalog operations.
```

## File 30: .\tests\fixtures\catalog-a\skills\skill-alpha\SKILL.md

```md
---
name: skill-alpha
description: First test skill for catalog A
version: 1.0.0
---

# Test Skill Alpha

This is a test skill used for verifying skill installation.

## Instructions

Test instructions for skill alpha.
```

## File 31: .\tests\fixtures\catalog-a\skills\skill-beta\SKILL.md

```md
---
name: skill-beta
description: Second test skill for catalog A
version: 1.0.0
---

# Test Skill Beta

This is another test skill for catalog operations.

## Instructions

Test instructions for skill beta.
```

## File 32: .\tests\fixtures\catalog-b\CATALOG.md

```md
---
name: Test Catalog B
description: Another test catalog for collision testing
author: Test Suite
version: 1.0.0
---

# Test Catalog B

This catalog contains skills with conflicting names for collision testing.
```

## File 33: .\tests\fixtures\catalog-b\skills\skill-alpha\SKILL.md

```md
---
name: skill-alpha
description: Different version of skill alpha from catalog B
version: 2.0.0
---

# Test Skill Alpha (Catalog B Version)

This is a different version of skill-alpha from catalog B.

## Instructions

Different instructions from catalog B.
```

## File 34: .\tests\fixtures\catalog-b\skills\skill-gamma\SKILL.md

```md
---
name: skill-gamma
description: Unique skill only in catalog B
version: 1.0.0
---

# Test Skill Gamma

This skill only exists in catalog B.

## Instructions

Test instructions for skill gamma.
```

## File 35: .\tests\helpers\fixtures.ts

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FIXTURES_DIR = path.join(__dirname, '../fixtures');

export function getFixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}
```

## File 36: .\tests\helpers\mock-prompts.ts

```ts
import { vi } from 'vitest';

export function mockConfirm(returnValue: boolean) {
  vi.doMock('@inquirer/prompts', () => ({
    confirm: vi.fn().mockResolvedValue(returnValue),
    select: vi.fn(),
    checkbox: vi.fn(),
    input: vi.fn(),
  }));
}

export function mockSelect(returnValue: string) {
  vi.doMock('@inquirer/prompts', () => ({
    confirm: vi.fn(),
    select: vi.fn().mockResolvedValue(returnValue),
    checkbox: vi.fn(),
    input: vi.fn(),
  }));
}

export function resetMocks() {
  vi.resetAllMocks();
  vi.unmock('@inquirer/prompts');
}
```

## File 37: .\tests\helpers\test-env.ts

```ts
import tmp from 'tmp';
import path from 'node:path';
import { __setTestPaths, __clearTestPaths } from '../../src/utils/paths.js';

export interface TestEnv {
  rootDir: string;
  skillsDir: string;
  configDir: string;
  cleanup: () => void;
}

export function createTestEnv(): TestEnv {
  const dir = tmp.dirSync({ unsafeCleanup: true });

  const skillsDir = path.join(dir.name, 'skills');
  const configDir = path.join(dir.name, 'config');

  __setTestPaths({ skillsDir, configDir });

  return {
    rootDir: dir.name,
    skillsDir,
    configDir,
    cleanup: () => {
      __clearTestPaths();
      dir.removeCallback();
    },
  };
}
```

## File 38: .\tests\integration\catalog-add.test.ts

```ts
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestEnv, type TestEnv } from '../helpers/test-env.js';
import { getFixturePath } from '../helpers/fixtures.js';
import { addCommand } from '../../src/commands/add.js';
import { loadConfig } from '../../src/core/config.js';

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn(),
  checkbox: vi.fn(),
  input: vi.fn(),
}));

describe('catalog add - local catalog', () => {
  let testEnv: TestEnv;

  beforeEach(() => {
    testEnv = createTestEnv();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  test('should add local catalog to config', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: false,
    });

    const config = await loadConfig();

    expect(config.catalogs['catalog-a']).toBeDefined();
    expect(config.catalogs['catalog-a'].type).toBe('local');
    expect(config.catalogs['catalog-a'].path).toBe(catalogPath);
    expect(config.catalogs['catalog-a'].active).toBe(true);
    expect(config.catalogs['catalog-a'].priority).toBe(1);
  });

  test('should assign correct priority to second catalog', async () => {
    const catalogAPath = getFixturePath('catalog-a');
    const catalogBPath = getFixturePath('catalog-b');

    await addCommand(catalogAPath, {
      yes: true,
      install: false,
    });

    await addCommand(catalogBPath, {
      yes: true,
      install: false,
    });

    const config = await loadConfig();

    expect(config.catalogs['catalog-a'].priority).toBe(1);
    expect(config.catalogs['catalog-b'].priority).toBe(2);
  });

  test('should set catalog as inactive when --inactive flag is used', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: false,
      inactive: true,
    });

    const config = await loadConfig();

    expect(config.catalogs['catalog-a'].active).toBe(false);
  });

  test('should reject catalog with invalid path', async () => {
    const invalidPath = getFixturePath('non-existent-catalog');

    await expect(
      addCommand(invalidPath, {
        yes: true,
        install: false,
      }),
    ).rejects.toThrow();
  });

  test('should reject catalog without skills directory', async () => {
    const invalidCatalogPath = getFixturePath('catalog-invalid');

    await expect(
      addCommand(invalidCatalogPath, {
        yes: true,
        install: false,
      }),
    ).rejects.toThrow();
  });

  test('should reject duplicate catalog registration', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: false,
    });

    await expect(
      addCommand(catalogPath, {
        yes: true,
        install: false,
      }),
    ).rejects.toThrow();
  });
});
```

## File 39: .\tests\integration\collision.test.ts

```ts
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createTestEnv, type TestEnv } from '../helpers/test-env.js';
import { getFixturePath } from '../helpers/fixtures.js';
import { addCommand } from '../../src/commands/add.js';
import { loadConfig } from '../../src/core/config.js';
import { checkSkillExists } from '../../src/core/installer.js';

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
  select: vi.fn(),
  checkbox: vi.fn(),
  input: vi.fn(),
}));

describe('skill collision handling', () => {
  let testEnv: TestEnv;

  beforeEach(() => {
    testEnv = createTestEnv();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  test('should detect when skill already exists from another catalog', async () => {
    const catalogAPath = getFixturePath('catalog-a');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    const config = await loadConfig();
    const existing = checkSkillExists('skill-alpha', config);

    expect(existing).toEqual({ type: 'catalog', catalogId: 'catalog-a' });
  });

  test('should overwrite skill when user confirms (force mode)', async () => {
    const catalogAPath = getFixturePath('catalog-a');
    const catalogBPath = getFixturePath('catalog-b');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    let config = await loadConfig();
    expect(config.installed['skill-alpha'].catalog).toBe('catalog-a');

    await addCommand(catalogBPath, {
      yes: true,
      install: true,
    });

    config = await loadConfig();
    expect(config.installed['skill-alpha'].catalog).toBe('catalog-b');

    const skillPath = path.join(testEnv.skillsDir, 'skill-alpha', 'SKILL.md');
    const content = await readFile(skillPath, 'utf-8');

    expect(content).toContain('Catalog B Version');
  });

  test('should skip skill installation when user declines overwrite', async () => {
    const catalogAPath = getFixturePath('catalog-a');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    let config = await loadConfig();
    expect(config.installed['skill-alpha'].catalog).toBe('catalog-a');

    const skillPath = path.join(testEnv.skillsDir, 'skill-alpha', 'SKILL.md');
    const contentBefore = await readFile(skillPath, 'utf-8');
    expect(contentBefore).toContain('skill-alpha');
    expect(contentBefore).not.toContain('Catalog B Version');
  });

  test('should install non-conflicting skills from second catalog', async () => {
    const catalogAPath = getFixturePath('catalog-a');
    const catalogBPath = getFixturePath('catalog-b');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    await addCommand(catalogBPath, {
      yes: true,
      install: true,
    });

    const config = await loadConfig();

    expect(config.installed['skill-alpha'].catalog).toBe('catalog-b');
    expect(config.installed['skill-gamma'].catalog).toBe('catalog-b');
  });
});
```

## File 40: .\tests\integration\skill-installation.test.ts

```ts
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createTestEnv, type TestEnv } from '../helpers/test-env.js';
import { getFixturePath } from '../helpers/fixtures.js';
import { addCommand } from '../../src/commands/add.js';
import { loadConfig } from '../../src/core/config.js';

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
  select: vi.fn(),
  checkbox: vi.fn(),
  input: vi.fn(),
}));

describe('skill installation', () => {
  let testEnv: TestEnv;

  beforeEach(() => {
    testEnv = createTestEnv();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  test('should install skills when adding catalog with --yes flag', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: true,
    });

    const skillAlphaPath = path.join(testEnv.skillsDir, 'skill-alpha', 'SKILL.md');
    const skillBetaPath = path.join(testEnv.skillsDir, 'skill-beta', 'SKILL.md');

    expect(existsSync(skillAlphaPath)).toBe(true);
    expect(existsSync(skillBetaPath)).toBe(true);
  });

  test('should track installed skills in config', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: true,
    });

    const config = await loadConfig();

    expect(config.installed['skill-alpha']).toBeDefined();
    expect(config.installed['skill-alpha'].catalog).toBe('catalog-a');
    expect(config.installed['skill-beta']).toBeDefined();
    expect(config.installed['skill-beta'].catalog).toBe('catalog-a');
  });

  test('should not install skills when install flag is false', async () => {
    const catalogPath = getFixturePath('catalog-a');

    await addCommand(catalogPath, {
      yes: true,
      install: false,
    });

    const skillAlphaPath = path.join(testEnv.skillsDir, 'skill-alpha', 'SKILL.md');

    expect(existsSync(skillAlphaPath)).toBe(false);

    const config = await loadConfig();
    expect(config.installed['skill-alpha']).toBeUndefined();
  });

  test('should install skills from multiple catalogs', async () => {
    const catalogAPath = getFixturePath('catalog-a');
    const catalogBPath = getFixturePath('catalog-b');

    await addCommand(catalogAPath, {
      yes: true,
      install: true,
    });

    await addCommand(catalogBPath, {
      yes: true,
      install: true,
    });

    const config = await loadConfig();

    expect(config.installed['skill-alpha'].catalog).toBe('catalog-b');
    expect(config.installed['skill-beta'].catalog).toBe('catalog-a');
    expect(config.installed['skill-gamma'].catalog).toBe('catalog-b');
  });
});
```

## File 41: .\tests\unit\config.test.ts

```ts
import { describe, test, expect } from 'vitest';
import {
  getNextPriority,
  getActiveCatalogs,
  addCatalog,
  removeCatalog,
  trackInstallation,
  untrackInstallation,
  type UserConfig,
  type CatalogEntry,
} from '../../src/core/config.js';

describe('getNextPriority', () => {
  test('should return 1 for empty config', () => {
    const config: UserConfig = { catalogs: {}, installed: {} };
    expect(getNextPriority(config)).toBe(1);
  });

  test('should return max priority + 1', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 5, active: true },
        'cat-2': { type: 'local', path: '/bar', priority: 2, active: true },
        'cat-3': { type: 'local', path: '/baz', priority: 8, active: true },
      },
      installed: {},
    };
    expect(getNextPriority(config)).toBe(9);
  });

  test('should handle single catalog', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 1, active: true },
      },
      installed: {},
    };
    expect(getNextPriority(config)).toBe(2);
  });
});

describe('getActiveCatalogs', () => {
  test('should return empty array for config with no catalogs', () => {
    const config: UserConfig = { catalogs: {}, installed: {} };
    expect(getActiveCatalogs(config)).toEqual([]);
  });

  test('should return only active catalogs', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 1, active: true },
        'cat-2': { type: 'local', path: '/bar', priority: 2, active: false },
        'cat-3': { type: 'local', path: '/baz', priority: 3, active: true },
      },
      installed: {},
    };

    const active = getActiveCatalogs(config);
    expect(active).toHaveLength(2);
    expect(active.map((c) => c.id)).toEqual(['cat-1', 'cat-3']);
  });

  test('should sort catalogs by priority', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 5, active: true },
        'cat-2': { type: 'local', path: '/bar', priority: 1, active: true },
        'cat-3': { type: 'local', path: '/baz', priority: 3, active: true },
      },
      installed: {},
    };

    const active = getActiveCatalogs(config);
    expect(active.map((c) => c.id)).toEqual(['cat-2', 'cat-3', 'cat-1']);
  });
});

describe('addCatalog', () => {
  test('should add catalog to config', () => {
    const config: UserConfig = { catalogs: {}, installed: {} };
    const entry: CatalogEntry = { type: 'local', path: '/foo', priority: 1, active: true };

    addCatalog(config, 'test-catalog', entry);

    expect(config.catalogs['test-catalog']).toBe(entry);
  });
});

describe('removeCatalog', () => {
  test('should remove catalog from config', () => {
    const config: UserConfig = {
      catalogs: {
        'cat-1': { type: 'local', path: '/foo', priority: 1, active: true },
      },
      installed: {},
    };

    removeCatalog(config, 'cat-1');

    expect(config.catalogs['cat-1']).toBeUndefined();
  });
});

describe('trackInstallation', () => {
  test('should track skill installation', () => {
    const config: UserConfig = { catalogs: {}, installed: {} };

    trackInstallation(config, 'my-skill', 'catalog-a');

    expect(config.installed['my-skill']).toEqual({ catalog: 'catalog-a' });
  });

  test('should overwrite existing tracking', () => {
    const config: UserConfig = {
      catalogs: {},
      installed: {
        'my-skill': { catalog: 'catalog-a' },
      },
    };

    trackInstallation(config, 'my-skill', 'catalog-b');

    expect(config.installed['my-skill']).toEqual({ catalog: 'catalog-b' });
  });
});

describe('untrackInstallation', () => {
  test('should remove skill from tracking', () => {
    const config: UserConfig = {
      catalogs: {},
      installed: {
        'skill-1': { catalog: 'catalog-a' },
        'skill-2': { catalog: 'catalog-b' },
      },
    };

    untrackInstallation(config, 'skill-1');

    expect(config.installed['skill-1']).toBeUndefined();
    expect(config.installed['skill-2']).toBeDefined();
  });
});
```

## File 42: .\tests\unit\fs-async.test.ts

```ts
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { writeFileAtomicAsync, readFileAsync, pathExistsAsync } from '../../src/utils/fs-async.js';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('writeFileAtomicAsync', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique temporary directory for each test
    testDir = join(tmpdir(), `atomic-write-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  test('should write file atomically', async () => {
    const filePath = join(testDir, 'test-file.txt');
    const content = 'Hello, atomic world!';

    await writeFileAtomicAsync(filePath, content);

    // Verify file exists and has correct content
    const result = await readFileAsync(filePath);
    expect(result).toBe(content);
  });

  test('should overwrite existing file atomically', async () => {
    const filePath = join(testDir, 'test-file.txt');
    const initialContent = 'Initial content';
    const newContent = 'Updated content';

    // Write initial content
    await writeFileAtomicAsync(filePath, initialContent);
    const firstRead = await readFileAsync(filePath);
    expect(firstRead).toBe(initialContent);

    // Overwrite with new content
    await writeFileAtomicAsync(filePath, newContent);
    const secondRead = await readFileAsync(filePath);
    expect(secondRead).toBe(newContent);
  });

  test('should clean up temp file after successful write', async () => {
    const filePath = join(testDir, 'test-file.txt');
    const content = 'Test content';

    await writeFileAtomicAsync(filePath, content);

    // Verify temp file doesn't exist
    const tmpExists = await pathExistsAsync(`${filePath}.tmp`);
    expect(tmpExists).toBe(false);
  });

  test('should handle JSON content correctly', async () => {
    const filePath = join(testDir, 'config.json');
    const data = { foo: 'bar', nested: { value: 42 } };
    const content = JSON.stringify(data, null, 2);

    await writeFileAtomicAsync(filePath, content);

    const result = await readFileAsync(filePath);
    expect(JSON.parse(result)).toEqual(data);
  });

  test('should throw error for invalid path', async () => {
    const invalidPath = join(testDir, 'nonexistent', 'deeply', 'nested', 'file.txt');
    const content = 'This should fail';

    await expect(writeFileAtomicAsync(invalidPath, content)).rejects.toThrow();
  });
});
```

## File 43: .\tests\unit\validation.test.ts

```ts
import { describe, test, expect } from 'vitest';
import { validateSkillName, validateSkillDescription } from '../../src/core/validation.js';
import { SKILL_NAME_MAX_LENGTH } from '../../src/utils/constants.js';

describe('validateSkillName', () => {
  test('should accept valid skill names', () => {
    expect(validateSkillName('my-skill').valid).toBe(true);
    expect(validateSkillName('skill123').valid).toBe(true);
    expect(validateSkillName('skill-with-many-parts').valid).toBe(true);
    expect(validateSkillName('simple').valid).toBe(true);
  });

  test('should reject empty names', () => {
    const result = validateSkillName('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('cannot be empty');
  });

  test('should reject names with spaces', () => {
    const result = validateSkillName('my skill');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('alphanumeric');
  });

  test('should reject names with invalid characters', () => {
    expect(validateSkillName('skill!').valid).toBe(false);
    expect(validateSkillName('skill@home').valid).toBe(false);
    expect(validateSkillName('skill/path').valid).toBe(false);
    expect(validateSkillName('skill\\path').valid).toBe(false);
  });

  test('should reject names exceeding max length', () => {
    const longName = 'a'.repeat(SKILL_NAME_MAX_LENGTH + 1);
    const result = validateSkillName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be 1-');
  });

  test('should accept names at max length', () => {
    const maxName = 'a'.repeat(SKILL_NAME_MAX_LENGTH);
    expect(validateSkillName(maxName).valid).toBe(true);
  });
});

describe('validateSkillDescription', () => {
  test('should accept valid descriptions', () => {
    expect(validateSkillDescription('A valid description').valid).toBe(true);
    expect(validateSkillDescription('Short').valid).toBe(true);
    expect(
      validateSkillDescription(
        'A longer description with multiple words and some special characters!',
      ).valid,
    ).toBe(true);
  });

  test('should reject empty descriptions', () => {
    const result = validateSkillDescription('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('cannot be empty');
  });

  test('should accept descriptions with various characters', () => {
    expect(validateSkillDescription('Description with numbers: 123').valid).toBe(true);
    expect(validateSkillDescription('Description with punctuation!?').valid).toBe(true);
  });
});
```

## File 44: .\tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2023"],
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## File 45: .\vitest.config.ts

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/fixtures/**'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```
