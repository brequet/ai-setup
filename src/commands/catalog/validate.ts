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
