import fs from 'node:fs';
import path from 'node:path';
import { input } from '@inquirer/prompts';
import { logger } from '../../utils/logger.js';
import type { Catalog } from '../../core/schema.js';

interface NewOptions {
  name?: string;
  id?: string;
  description?: string;
  gitUrl?: string;
}

export async function catalogNew(options: NewOptions = {}) {
  logger.info('Creating new catalog...\n');

  // Gather inputs (args or prompts)
  const name =
    options.name ||
    (await input({
      message: 'Catalog name:',
      default: 'BRE AI Agents Catalog',
    }));

  const id =
    options.id ||
    (await input({
      message: 'Catalog ID (kebab-case):',
      default: 'bre-company',
    }));

  const gitUrl =
    options.gitUrl ||
    (await input({
      message: 'Git repository URL (optional):',
      required: false,
    }));

  const catalogPath = process.cwd();

  logger.debug(`Creating catalog at: ${catalogPath}`);

  // Create directory structure
  const dirs = [
    path.join(catalogPath, 'skills'),
    path.join(catalogPath, 'mcp'),
    path.join(catalogPath, 'meta'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  }

  // Create initial catalog.json
  const catalog: Catalog = {
    name,
    id,
    version: '0.1.0',
    gitUrl: gitUrl || undefined,
    opencodeVersion: '>=1.0.0',
    skills: {},
  };

  const catalogJsonPath = path.join(catalogPath, 'meta', 'catalog.json');
  fs.writeFileSync(catalogJsonPath, JSON.stringify(catalog, null, 2));
  logger.success('Created meta/catalog.json');

  // Create schema reference
  const schemaPath = path.join(catalogPath, 'meta', 'schema.json');
  const schemaReference = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    description: 'This file is a placeholder. Schema validation is handled by Zod in the CLI.',
  };
  fs.writeFileSync(schemaPath, JSON.stringify(schemaReference, null, 2));
  logger.success('Created meta/schema.json');

  // Create README
  const readmePath = path.join(catalogPath, 'README.md');
  const readme = `# ${name}

Catalog ID: \`${id}\`

## Structure

\`\`\`
skills/          # OpenCode skills
mcp/             # MCP server configurations
meta/
  catalog.json   # Catalog metadata
  schema.json    # Schema reference
\`\`\`

## Usage

\`\`\`bash
# Add a skill
npx @brequet/ai-setup catalog skill add my-skill

# Validate catalog
npx @brequet/ai-setup catalog validate

# Build catalog
npx @brequet/ai-setup catalog build
\`\`\`
`;
  fs.writeFileSync(readmePath, readme);
  logger.success('Created README.md');

  console.log('\n' + '✨ Catalog created successfully!\n');
  logger.info(`Next steps:`);
  logger.info(`  1. Add skills: npx @brequet/ai-setup catalog skill add <name>`);
  logger.info(`  2. Validate:   npx @brequet/ai-setup catalog validate`);
  logger.info(`  3. Build:      npx @brequet/ai-setup catalog build`);
}
