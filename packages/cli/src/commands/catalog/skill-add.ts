import fs from 'node:fs';
import path from 'node:path';
import { input } from '@inquirer/prompts';
import { logger } from '../../utils/logger.js';
import { toSkillName, validateSkillName, validateSkillDescription } from '../../utils/helpers.js';
import { computeFileHash } from '../../utils/hash.js';
import type { Catalog, Skill } from '../../core/schema.js';

interface SkillAddOptions {
  description?: string;
  tags?: string;
  version?: string;
  license?: string;
}

/**
 * Generate OpenCode-compliant SKILL.md with YAML frontmatter
 */
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
  const catalogJsonPath = path.join(catalogPath, 'meta', 'catalog.json');

  // Check if catalog exists
  if (!fs.existsSync(catalogJsonPath)) {
    logger.error('No catalog found. Run "catalog new" first.');
    process.exit(1);
  }

  logger.info('Adding skill to catalog...\n');

  // Gather inputs (args or prompts)
  const rawName = name || await input({ 
    message: 'Skill name (lowercase, alphanumeric, hyphens):',
    required: true,
  });

  // Convert and validate skill name
  const skillName = toSkillName(rawName);
  const nameValidation = validateSkillName(skillName);

  if (!nameValidation.valid) {
    logger.error(`Invalid skill name: ${nameValidation.error}`);
    logger.info(`Suggested: ${skillName}`);
    process.exit(1);
  }

  if (skillName !== rawName.toLowerCase()) {
    logger.debug(`Normalized skill name: "${rawName}" → "${skillName}"`);
  }

  const description = options.description || await input({ 
    message: 'Description (1-1024 chars):',
    default: `Skill for ${skillName}`,
    validate: (value) => {
      const result = validateSkillDescription(value);
      return result.valid ? true : result.error!;
    },
  });

  // Validate description
  const descValidation = validateSkillDescription(description);
  if (!descValidation.valid) {
    logger.error(`Invalid description: ${descValidation.error}`);
    process.exit(1);
  }

  const tagsInput = options.tags || await input({ 
    message: 'Tags (comma-separated, optional):',
    default: '',
  });

  const tags = tagsInput
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean);

  const license = options.license || 'MIT';
  const version = options.version || '1.0.0';

  // Create skill directory and SKILL.md
  const skillDir = path.join(catalogPath, 'skills', skillName);
  if (fs.existsSync(skillDir)) {
    logger.error(`Skill "${skillName}" already exists`);
    process.exit(1);
  }

  fs.mkdirSync(skillDir, { recursive: true });

  const skillFilePath = path.join(skillDir, 'SKILL.md');
  const skillContent = SKILL_TEMPLATE(skillName, description, tags, license);
  fs.writeFileSync(skillFilePath, skillContent);
  logger.success(`Created skills/${skillName}/SKILL.md`);

  // Compute hash
  const hash = computeFileHash(skillFilePath);
  logger.debug(`Computed hash: ${hash}`);

  // Update catalog.json
  const catalog: Catalog = JSON.parse(fs.readFileSync(catalogJsonPath, 'utf-8'));
  
  if (!catalog.skills) {
    catalog.skills = {};
  }

  const skill: Skill = {
    hash,
    path: `skills/${skillName}/SKILL.md`,
    tags,
    description,
    version,
  };

  catalog.skills[skillName] = skill;
  fs.writeFileSync(catalogJsonPath, JSON.stringify(catalog, null, 2));
  logger.success('Updated meta/catalog.json');

  console.log('\n' + '✨ Skill added successfully!\n');
  logger.info(`Name:  ${skillName}`);
  logger.info(`Path:  skills/${skillName}/SKILL.md`);
  logger.info(`Hash:  ${hash.substring(0, 20)}...`);
  logger.info(`\nNext: Edit skills/${skillName}/SKILL.md to add skill instructions`);
}
