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
ai-setup catalog skill add my-skill

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
ai-setup add /path/to/this/catalog

# Git catalog (once published)
ai-setup add https://github.com/your-org/your-catalog
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
  logger.info(`  1. Add skills: ai-setup catalog skill add <name>`);
  logger.info(`  2. Edit SKILL.md files with your skill instructions`);
  logger.info(`  3. Share your catalog via Git or local path`);
  logger.blank();
}
