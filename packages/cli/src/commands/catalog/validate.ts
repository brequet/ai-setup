import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../../utils/logger.js';
import { CatalogSchema } from '../../core/schema.js';
import { computeFileHash } from '../../utils/hash.js';
import { validateSkillName, validateSkillDescription } from '../../utils/helpers.js';
import chalk from 'chalk';

/**
 * Parse YAML frontmatter from SKILL.md
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    errors.push('Missing YAML frontmatter (must start with --- and end with ---)');
    return { frontmatter: {}, valid: false, errors };
  }

  const frontmatterText = frontmatterMatch[1];
  const frontmatter: Record<string, any> = {};

  // Simple YAML parser (key: value)
  const lines = frontmatterText.split('\n');
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    
    frontmatter[key] = value;
  }

  // Validate required fields
  if (!frontmatter.name) {
    errors.push('Missing required field: name');
  }

  if (!frontmatter.description) {
    errors.push('Missing required field: description');
  }

  return { 
    frontmatter, 
    valid: errors.length === 0, 
    errors 
  };
}

export async function catalogValidate() {
  const catalogPath = process.cwd();
  const catalogJsonPath = path.join(catalogPath, 'meta', 'catalog.json');

  if (!fs.existsSync(catalogJsonPath)) {
    logger.error('No catalog found at meta/catalog.json');
    process.exit(1);
  }

  logger.info('Validating catalog...\n');

  let hasErrors = false;

  // Parse and validate schema
  try {
    const rawCatalog = JSON.parse(fs.readFileSync(catalogJsonPath, 'utf-8'));
    const result = CatalogSchema.safeParse(rawCatalog);

    if (!result.success) {
      logger.error('Schema validation failed:');
      result.error.errors.forEach(err => {
        console.error(chalk.red(`  - ${err.path.join('.')}: ${err.message}`));
      });
      hasErrors = true;
    } else {
      logger.success('Schema valid');
      
      const catalog = result.data;

      // Validate skill files exist
      if (catalog.skills && Object.keys(catalog.skills).length > 0) {
        logger.debug(`Validating ${Object.keys(catalog.skills).length} skills...`);
        
        for (const [skillName, skill] of Object.entries(catalog.skills)) {
          const skillPath = path.join(catalogPath, skill.path);
          
          if (!fs.existsSync(skillPath)) {
            logger.error(`Skill file not found: ${skill.path}`);
            hasErrors = true;
            continue;
          }

          // Validate skill name format
          const nameValidation = validateSkillName(skillName);
          if (!nameValidation.valid) {
            logger.error(`Invalid skill name "${skillName}": ${nameValidation.error}`);
            hasErrors = true;
          }

          // Validate skill directory matches name
          const expectedDir = path.join(catalogPath, 'skills', skillName);
          const actualDir = path.dirname(skillPath);
          if (expectedDir !== actualDir) {
            logger.error(`Skill directory mismatch for "${skillName}": expected skills/${skillName}/`);
            hasErrors = true;
          }

          // Validate frontmatter
          const content = fs.readFileSync(skillPath, 'utf-8');
          const { frontmatter, valid, errors } = parseFrontmatter(content);

          if (!valid) {
            logger.error(`Frontmatter validation failed for "${skillName}":`);
            errors.forEach(err => {
              console.error(chalk.red(`  - ${err}`));
            });
            hasErrors = true;
          } else {
            // Validate frontmatter name matches directory
            if (frontmatter.name !== skillName) {
              logger.error(`Frontmatter name mismatch for "${skillName}": frontmatter has "${frontmatter.name}"`);
              hasErrors = true;
            }

            // Validate description length
            const descValidation = validateSkillDescription(frontmatter.description);
            if (!descValidation.valid) {
              logger.error(`Invalid description for "${skillName}": ${descValidation.error}`);
              hasErrors = true;
            }

            logger.debug(`✓ ${skillName} - frontmatter valid`);
          }

          // Validate hash
          const actualHash = computeFileHash(skillPath);
          if (actualHash !== skill.hash) {
            logger.warn(`Hash mismatch for ${skillName}:`);
            console.log(`  Expected: ${skill.hash}`);
            console.log(`  Actual:   ${actualHash}`);
            hasErrors = true;
          } else {
            logger.debug(`✓ ${skillName} - hash valid`);
          }
        }

        if (!hasErrors) {
          logger.success('All skill paths exist');
          logger.success('All frontmatter valid');
          logger.success('All hashes valid');
        }
      } else {
        logger.warn('No skills defined in catalog');
      }

      // Check for duplicates (simple check)
      const skillPaths = Object.values(catalog.skills || {}).map(s => s.path);
      const uniquePaths = new Set(skillPaths);
      if (skillPaths.length !== uniquePaths.size) {
        logger.error('Duplicate skill paths found');
        hasErrors = true;
      } else {
        logger.success('No duplicates');
      }
    }
  } catch (error) {
    logger.error('Failed to parse catalog.json', error as Error);
    hasErrors = true;
  }

  if (hasErrors) {
    console.log('\n' + chalk.red('✖ Validation failed'));
    process.exit(1);
  } else {
    console.log('\n' + chalk.green('✨ Validation passed!'));
  }
}
