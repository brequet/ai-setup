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
    throw new ValidationError('No catalog found. Run "bre-ai-setup catalog init" first.');
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
