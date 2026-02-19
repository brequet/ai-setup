import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../../utils/logger.js';
import { computeFileHash } from '../../utils/hash.js';
import type { Catalog, Skill } from '../../core/schema.js';
import chalk from 'chalk';

export async function catalogBuild() {
  const catalogPath = process.cwd();
  const catalogJsonPath = path.join(catalogPath, 'meta', 'catalog.json');
  const skillsDir = path.join(catalogPath, 'skills');

  if (!fs.existsSync(catalogJsonPath)) {
    logger.error('No catalog found. Run "catalog new" first.');
    process.exit(1);
  }

  logger.info('Building catalog...\n');

  // Load existing catalog
  const catalog: Catalog = JSON.parse(fs.readFileSync(catalogJsonPath, 'utf-8'));

  // Scan skills directory
  if (!fs.existsSync(skillsDir)) {
    logger.warn('No skills directory found');
    catalog.skills = {};
  } else {
    const skillFolders = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    logger.debug(`Found ${skillFolders.length} skill folders`);

    const updatedSkills: Record<string, Skill> = {};

    for (const skillName of skillFolders) {
      const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
      
      if (!fs.existsSync(skillPath)) {
        logger.warn(`Skipping ${skillName} - no SKILL.md found`);
        continue;
      }

      const hash = computeFileHash(skillPath);
      const existingSkill = catalog.skills?.[skillName];

      updatedSkills[skillName] = {
        hash,
        path: `skills/${skillName}/SKILL.md`,
        tags: existingSkill?.tags || [],
        description: existingSkill?.description || `Skill: ${skillName}`,
        version: existingSkill?.version || '1.0.0',
      };

      logger.debug(`✓ ${skillName} - hash computed`);
    }

    catalog.skills = updatedSkills;
    logger.success(`Computed ${Object.keys(updatedSkills).length} skill hashes`);
  }

  // Write updated catalog
  fs.writeFileSync(catalogJsonPath, JSON.stringify(catalog, null, 2));
  logger.success('Updated meta/catalog.json');

  console.log('\n' + chalk.green('✨ Catalog built successfully!'));
  logger.info(`Total skills: ${Object.keys(catalog.skills || {}).length}`);
}
