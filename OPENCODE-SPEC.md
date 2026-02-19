# OpenCode Spec Compliance

This CLI tool is fully compliant with the [OpenCode Skills specification](https://opencode.ai/docs/skills/).

## ✅ Implemented Features

### YAML Frontmatter

All generated SKILL.md files include proper YAML frontmatter:

```yaml
---
name: skill-name
description: Skill description (1-1024 chars)
license: MIT
compatibility: opencode
metadata:
  tags: tag1, tag2, tag3
---
```

**Required fields:**
- `name` - Validated against OpenCode regex
- `description` - Length validated (1-1024 chars)

**Optional fields:**
- `license` - Defaults to MIT
- `compatibility` - Set to "opencode"
- `metadata` - String-to-string map for tags

### Name Validation

Skill names are validated against OpenCode spec:

**Regex:** `^[a-z0-9]+(-[a-z0-9]+)*$`

**Rules:**
- 1-64 characters
- Lowercase alphanumeric
- Single hyphen separators
- No leading/trailing hyphens
- No consecutive hyphens

**Auto-normalization:**
The CLI automatically converts invalid names to valid format:
- `"My Cool Skill"` → `my-cool-skill`
- `"PR Review!!!"` → `pr-review`
- `"Git  Release"` → `git-release`

### Validation Checks

The `catalog validate` command performs comprehensive checks:

1. **Schema validation** - Zod schema for catalog.json
2. **File existence** - All skill paths exist
3. **Frontmatter validation** - Required fields present
4. **Name consistency** - Directory name matches frontmatter name
5. **Description length** - 1-1024 characters
6. **Hash integrity** - SHA-256 hashes match files
7. **No duplicates** - Unique skill paths

### Directory Structure

Skills follow OpenCode directory structure:

```
skills/
  skill-name/
    SKILL.md       # Frontmatter name must match directory
```

## Examples

### Creating a Skill

```bash
# Command
bre-ai-setup catalog skill add git-release \
  --description "Create consistent releases and changelogs" \
  --tags "git,release,changelog"

# Generated: skills/git-release/SKILL.md
```

**Output:**
```markdown
---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  tags: git, release, changelog
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
```

### Validation Output

```bash
$ bre-ai-setup catalog validate --verbose

Validating catalog...

✔ Schema valid
[DEBUG] Validating 2 skills...
[DEBUG] ✓ git-release - frontmatter valid
[DEBUG] ✓ git-release - hash valid
[DEBUG] ✓ write-docs - frontmatter valid
[DEBUG] ✓ write-docs - hash valid
✔ All skill paths exist
✔ All frontmatter valid
✔ All hashes valid
✔ No duplicates

✨ Validation passed!
```

### Error Detection

The validator catches common issues:

```bash
# Missing frontmatter
✖ Frontmatter validation failed for "my-skill":
  - Missing YAML frontmatter (must start with --- and end with ---)

# Invalid name format
✖ Invalid skill name "My-Skill": Skill name must be lowercase alphanumeric with single hyphen separators

# Name mismatch
✖ Frontmatter name mismatch for "my-skill": frontmatter has "myskill"

# Description too long
✖ Invalid description for "my-skill": Description must be 1-1024 characters
```

## Testing

Test the implementation:

```bash
# Create catalog
bre-ai-setup catalog new --name "Test" --id "test"

# Add valid skill
bre-ai-setup catalog skill add git-release \
  --description "Release management" \
  --tags "git,release"

# Add skill with auto-normalization
bre-ai-setup catalog skill add "My Cool Skill" \
  --description "Test skill"

# Validate (should pass)
bre-ai-setup catalog validate --verbose
```

## References

- [OpenCode Skills Documentation](https://opencode.ai/docs/skills/)
- Spec validation in: `packages/cli/src/utils/helpers.ts`
- Frontmatter template in: `packages/cli/src/commands/catalog/skill-add.ts`
- Validation logic in: `packages/cli/src/commands/catalog/validate.ts`
