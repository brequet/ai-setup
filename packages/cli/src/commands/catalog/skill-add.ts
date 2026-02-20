import fs from 'node:fs';
import path from 'node:path';
import { input } from '@inquirer/prompts';
import { logger } from '../../utils/logger.js';
import { toSkillName, validateSkillName, validateSkillDescription } from '../../utils/helpers.js';

interface SkillAddOptions {
  description?: string;
  tags?: string;
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
  const skillsDir = path.join(catalogPath, 'skills');

  // Check if catalog exists (skills/ directory)
  if (!fs.existsSync(skillsDir)) {
    logger.error('No catalog found. Run "bre-ai-setup catalog init" first.');
    process.exit(1);
  }

  logger.info('Adding skill to catalog...\n');

  // Gather inputs (args or prompts)
  const rawName =
    name ||
    (await input({
      message: 'Skill name (lowercase, alphanumeric, hyphens):',
      required: true,
    }));

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

  // Validate description
  const descValidation = validateSkillDescription(description);
  if (!descValidation.valid) {
    logger.error(`Invalid description: ${descValidation.error}`);
    process.exit(1);
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

  // Create skill directory and SKILL.md
  const skillDir = path.join(skillsDir, skillName);
  if (fs.existsSync(skillDir)) {
    logger.error(`Skill "${skillName}" already exists`);
    process.exit(1);
  }

  fs.mkdirSync(skillDir, { recursive: true });

  const skillFilePath = path.join(skillDir, 'SKILL.md');
  const skillContent = SKILL_TEMPLATE(skillName, description, tags, license);
  fs.writeFileSync(skillFilePath, skillContent);
  logger.success(`Created skills/${skillName}/SKILL.md`);

  console.log('\n' + '✨ Skill added successfully!\n');
  logger.info(`Name:  ${skillName}`);
  logger.info(`Path:  skills/${skillName}/SKILL.md`);
  logger.info(`\nNext: Edit skills/${skillName}/SKILL.md to add skill instructions`);
  console.log('');
}
