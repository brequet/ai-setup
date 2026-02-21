import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Validate skill name according to OpenCode spec
 * - 1-64 characters
 * - lowercase alphanumeric with single hyphen separators
 * - no leading/trailing hyphens
 * - no consecutive hyphens
 */
export function validateSkillName(name: string): { valid: boolean; error?: string } {
  const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  if (!name || name.length === 0) {
    return { valid: false, error: 'Skill name cannot be empty' };
  }

  if (name.length > 64) {
    return { valid: false, error: 'Skill name must be 1-64 characters' };
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

/**
 * Convert string to valid OpenCode skill name
 * - Lowercase
 * - Replace spaces and invalid chars with hyphens
 * - Remove consecutive hyphens
 * - Trim leading/trailing hyphens
 */
export function toSkillName(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/--+/g, '-') // Replace consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate skill description according to OpenCode spec
 * - 1-1024 characters
 */
export function validateSkillDescription(description: string): { valid: boolean; error?: string } {
  if (!description || description.length === 0) {
    return { valid: false, error: 'Description cannot be empty' };
  }

  if (description.length > 1024) {
    return { valid: false, error: 'Description must be 1-1024 characters' };
  }

  return { valid: true };
}

/**
 * Convert string to kebab-case (deprecated - use toSkillName instead)
 */
export function toKebabCase(str: string): string {
  return toSkillName(str);
}

/**
 * Get __dirname equivalent in ESM
 */
export function getDirname(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}
