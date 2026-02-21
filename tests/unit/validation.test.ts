import { describe, test, expect } from 'vitest';
import { validateSkillName, validateSkillDescription } from '../../src/core/validation.js';
import { SKILL_NAME_MAX_LENGTH } from '../../src/utils/constants.js';

describe('validateSkillName', () => {
  test('should accept valid skill names', () => {
    expect(validateSkillName('my-skill').valid).toBe(true);
    expect(validateSkillName('skill123').valid).toBe(true);
    expect(validateSkillName('skill-with-many-parts').valid).toBe(true);
    expect(validateSkillName('simple').valid).toBe(true);
  });

  test('should reject empty names', () => {
    const result = validateSkillName('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('cannot be empty');
  });

  test('should reject names with spaces', () => {
    const result = validateSkillName('my skill');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('alphanumeric');
  });

  test('should reject names with invalid characters', () => {
    expect(validateSkillName('skill!').valid).toBe(false);
    expect(validateSkillName('skill@home').valid).toBe(false);
    expect(validateSkillName('skill/path').valid).toBe(false);
    expect(validateSkillName('skill\\path').valid).toBe(false);
  });

  test('should reject names exceeding max length', () => {
    const longName = 'a'.repeat(SKILL_NAME_MAX_LENGTH + 1);
    const result = validateSkillName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be 1-');
  });

  test('should accept names at max length', () => {
    const maxName = 'a'.repeat(SKILL_NAME_MAX_LENGTH);
    expect(validateSkillName(maxName).valid).toBe(true);
  });
});

describe('validateSkillDescription', () => {
  test('should accept valid descriptions', () => {
    expect(validateSkillDescription('A valid description').valid).toBe(true);
    expect(validateSkillDescription('Short').valid).toBe(true);
    expect(
      validateSkillDescription(
        'A longer description with multiple words and some special characters!',
      ).valid,
    ).toBe(true);
  });

  test('should reject empty descriptions', () => {
    const result = validateSkillDescription('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('cannot be empty');
  });

  test('should accept descriptions with various characters', () => {
    expect(validateSkillDescription('Description with numbers: 123').valid).toBe(true);
    expect(validateSkillDescription('Description with punctuation!?').valid).toBe(true);
  });
});
