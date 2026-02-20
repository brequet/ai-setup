import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger.js';
import { loadConfig, saveConfig, addCatalog, getNextPriority, type CatalogEntry } from '../core/config.js';
import { CatalogSchema, type Catalog } from '../core/schema.js';

interface AddOptions {
  name?: string;
  priority?: number;
  inactive?: boolean;
}

export async function add(catalogPath: string, options: AddOptions = {}) {
  logger.info('Adding catalog...\n');

  // Resolve to absolute path
  const absolutePath = path.resolve(catalogPath);
  
  // Validate catalog path exists
  if (!fs.existsSync(absolutePath)) {
    logger.error(`Catalog path does not exist: ${absolutePath}`);
    process.exit(1);
  }

  // Check if it's a directory
  const stats = fs.statSync(absolutePath);
  if (!stats.isDirectory()) {
    logger.error(`Path is not a directory: ${absolutePath}`);
    process.exit(1);
  }

  // Look for meta/catalog.json
  const catalogJsonPath = path.join(absolutePath, 'meta', 'catalog.json');
  if (!fs.existsSync(catalogJsonPath)) {
    logger.error('Invalid catalog: meta/catalog.json not found');
    logger.info(`Expected: ${catalogJsonPath}`);
    process.exit(1);
  }

  // Parse and validate catalog
  let catalog: Catalog;
  try {
    const content = fs.readFileSync(catalogJsonPath, 'utf-8');
    const rawCatalog = JSON.parse(content);
    const result = CatalogSchema.safeParse(rawCatalog);

    if (!result.success) {
      logger.error('Invalid catalog.json:');
      result.error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }

    catalog = result.data;
  } catch (error) {
    logger.error('Failed to parse catalog.json', error as Error);
    process.exit(1);
  }

  // Load user config
  const config = loadConfig();

  // Determine catalog ID (from catalog.json, cannot be overridden)
  const catalogId = catalog.id;

  // Check if catalog is already registered
  const isUpdate = catalogId in config.catalogs;
  if (isUpdate) {
    logger.info(`Catalog "${catalogId}" is already registered, updating...`);
  }

  // Determine priority
  const priority = options.priority ?? (isUpdate ? config.catalogs[catalogId].priority : getNextPriority(config));

  // Create catalog entry
  const entry: CatalogEntry = {
    type: 'local',
    path: absolutePath,
    priority,
    active: !options.inactive,
  };

  // Add to config
  addCatalog(config, catalogId, entry);
  saveConfig(config);

  // Success output
  console.log('');
  logger.success(isUpdate ? 'Catalog updated!' : 'Catalog added!');
  console.log('');
  logger.info(`ID:       ${catalogId}`);
  logger.info(`Name:     ${catalog.name}`);
  logger.info(`Version:  ${catalog.version}`);
  logger.info(`Path:     ${absolutePath}`);
  logger.info(`Priority: ${priority}`);
  logger.info(`Status:   ${entry.active ? 'active' : 'inactive'}`);
  
  const skillCount = Object.keys(catalog.skills || {}).length;
  if (skillCount > 0) {
    logger.info(`Skills:   ${skillCount} available`);
  }

  console.log('');
  logger.info('Next steps:');
  logger.info('  - List catalogs:    npx @bre/ai-setup list');
  logger.info('  - Install skills:   npx @bre/ai-setup skills --all');
}
