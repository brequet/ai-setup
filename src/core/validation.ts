import { existsSync } from 'node:fs';
import path from 'node:path';
import type { UserConfig } from './config.js';
import { SKILL_NAME_MAX_LENGTH, SKILL_DESCRIPTION_MAX_LENGTH } from '../utils/constants.js';

export interface ValidationResult<T = void> {
  valid: boolean;
  value?: T;
  error?: string;
}

export function validateSkillName(name: string): ValidationResult {
  const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  if (!name || name.length === 0) {
    return { valid: false, error: 'Skill name cannot be empty' };
  }

  if (name.length > SKILL_NAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Skill name must be 1-${SKILL_NAME_MAX_LENGTH} characters`,
    };
  }

  if (!nameRegex.test(name)) {
    return {
      valid: false,
      error:
        'Skill name must be lowercase alphanumeric with single hyphen separators (e.g., "my-skill")',
    };
  }

  return { valid: true };
}

export function validateSkillDescription(description: string): ValidationResult {
  if (!description || description.length === 0) {
    return { valid: false, error: 'Description cannot be empty' };
  }

  if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
    return {
      valid: false,
      error: `Description must be 1-${SKILL_DESCRIPTION_MAX_LENGTH} characters`,
    };
  }

  return { valid: true };
}

export function validatePathExists(filePath: string): ValidationResult {
  if (!existsSync(filePath)) {
    return { valid: false, error: `Path does not exist: ${filePath}` };
  }
  return { valid: true };
}

export function validateSkillsDirectory(catalogPath: string): ValidationResult {
  const skillsDir = path.join(catalogPath, 'skills');
  if (!existsSync(skillsDir)) {
    return { valid: false, error: 'Catalog does not have a skills/ directory' };
  }
  return { valid: true };
}

export function validateCatalogNotRegistered(
  catalogId: string,
  config: UserConfig,
): ValidationResult {
  if (config.catalogs[catalogId]) {
    return { valid: false, error: `Catalog "${catalogId}" is already registered` };
  }
  return { valid: true };
}

export function validateGitUrl(input: string): ValidationResult {
  const gitUrlPatterns = [/^https?:\/\//i, /^git:\/\//i, /^git@/i, /^ssh:\/\//i];

  const isGit = gitUrlPatterns.some((pattern) => pattern.test(input));
  if (!isGit) {
    return { valid: false, error: 'Invalid Git URL format' };
  }

  return { valid: true };
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: {
    tags?: string;
  };
}

export function validateSkillFrontmatter(data: any): ValidationResult<SkillFrontmatter> {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid frontmatter' };
  }

  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: 'Missing or invalid "name" field in frontmatter' };
  }

  if (!data.description || typeof data.description !== 'string') {
    return { valid: false, error: 'Missing or invalid "description" field in frontmatter' };
  }

  const nameValidation = validateSkillName(data.name);
  if (!nameValidation.valid) {
    return { valid: false, error: `Invalid name: ${nameValidation.error}` };
  }

  const descValidation = validateSkillDescription(data.description);
  if (!descValidation.valid) {
    return { valid: false, error: `Invalid description: ${descValidation.error}` };
  }

  return { valid: true, value: data as SkillFrontmatter };
}
