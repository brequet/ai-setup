import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { logger } from '../../utils/logger.js';
import { validateSkillName, validateSkillDescription } from '../../utils/helpers.js';
import chalk from 'chalk';

export async function catalogValidate() {
  const catalogPath = process.cwd();
  const skillsDir = path.join(catalogPath, 'skills');

  if (!fs.existsSync(skillsDir)) {
    logger.error('No catalog found. Run "bre-ai-setup catalog init" first.');
    process.exit(1);
  }

  logger.info('Validating catalog...\n');

  let hasErrors = false;
  let skillCount = 0;
  const errors: string[] = [];

  // Read all skill directories
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory());

  if (skillDirs.length === 0) {
    logger.warn('No skills found in skills/ directory');
    console.log('');
    return;
  }

  logger.info(`Found ${skillDirs.length} skill folder${skillDirs.length === 1 ? '' : 's'}\n`);

  for (const dir of skillDirs) {
    skillCount++;
    const skillName = dir.name;
    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');

    console.log(chalk.cyan(`Checking ${skillName}...`));

    // Check if SKILL.md exists
    if (!fs.existsSync(skillPath)) {
      console.log(chalk.red(`  ✖ Missing SKILL.md`));
      errors.push(`${skillName}: Missing SKILL.md file`);
      hasErrors = true;
      continue;
    }

    // Validate skill name
    const nameValidation = validateSkillName(skillName);
    if (!nameValidation.valid) {
      console.log(chalk.red(`  ✖ Invalid skill name: ${nameValidation.error}`));
      errors.push(`${skillName}: Invalid name - ${nameValidation.error}`);
      hasErrors = true;
    }

    // Parse frontmatter
    try {
      const content = fs.readFileSync(skillPath, 'utf-8');
      const { data, content: body } = matter(content);

      // Validate required frontmatter fields
      if (!data.name) {
        console.log(chalk.red(`  ✖ Missing required field: name`));
        errors.push(`${skillName}: Missing 'name' field in frontmatter`);
        hasErrors = true;
      } else if (data.name !== skillName) {
        console.log(
          chalk.yellow(
            `  ⚠ Warning: frontmatter name "${data.name}" doesn't match folder name "${skillName}"`,
          ),
        );
      }

      if (!data.description) {
        console.log(chalk.red(`  ✖ Missing required field: description`));
        errors.push(`${skillName}: Missing 'description' field in frontmatter`);
        hasErrors = true;
      } else {
        const descValidation = validateSkillDescription(data.description);
        if (!descValidation.valid) {
          console.log(chalk.red(`  ✖ Invalid description: ${descValidation.error}`));
          errors.push(`${skillName}: ${descValidation.error}`);
          hasErrors = true;
        }
      }

      // Validate content exists
      if (!body || body.trim().length === 0) {
        console.log(chalk.red(`  ✖ SKILL.md has no content after frontmatter`));
        errors.push(`${skillName}: No content in SKILL.md`);
        hasErrors = true;
      }

      if (!hasErrors) {
        console.log(chalk.green(`  ✓ Valid`));
      }
    } catch (error) {
      console.log(chalk.red(`  ✖ Failed to parse: ${(error as Error).message}`));
      errors.push(`${skillName}: Parse error - ${(error as Error).message}`);
      hasErrors = true;
    }

    console.log('');
  }

  // Summary
  if (hasErrors) {
    logger.error(`Validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`);
    errors.forEach((err) => {
      console.error(chalk.red(`  - ${err}`));
    });
    process.exit(1);
  } else {
    logger.success(
      `✨ All ${skillCount} skill${skillCount === 1 ? '' : 's'} validated successfully!`,
    );
  }
}
