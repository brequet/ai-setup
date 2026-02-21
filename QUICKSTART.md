# Quick Start Guide

## Installation & Setup

```bash
# Clone and setup
git clone <repo>
cd ai-setup-poc
pnpm install
pnpm build
```

## Local Development

### Option 1: Direct Node Execution

```bash
cd packages/cli
node dist/cli.js --help
node dist/cli.js catalog new
```

### Option 2: Global Link (Recommended)

```bash
cd packages/cli
pnpm link --global

# Now use anywhere
bre-ai-setup --help
bre-ai-setup catalog new
```

### Option 3: Root Scripts

```bash
# Build
pnpm build

# Test against test-catalog
pnpm test:catalog catalog validate --verbose
```

## Common Workflows

### Creating a New Catalog

```bash
# Create catalog
mkdir my-catalog
cd my-catalog
bre-ai-setup catalog new \
  --name "My Team Catalog" \
  --id "my-team" \
  --git-url "https://gitlab.example.com/my-team/catalog.git"

# Verify structure
ls -la
# skills/ mcp/ meta/ README.md
```

### Adding Skills

```bash
# Interactive (prompts for all fields)
bre-ai-setup catalog skill add

# With arguments (OpenCode spec-compliant)
bre-ai-setup catalog skill add git-release \
  --description "Create consistent releases and changelogs" \
  --tags "git,release,changelog" \
  --license "MIT"

# Auto-kebab-case conversion
bre-ai-setup catalog skill add "My Cool Skill"
# Creates: skills/my-cool-skill/SKILL.md
# Frontmatter name: my-cool-skill

# More examples
bre-ai-setup catalog skill add "PR Review!!!"  # → pr-review
bre-ai-setup catalog skill add "Git Release"   # → git-release
```

**Generated SKILL.md format:**
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
```

### Validating Catalog

```bash
# Basic validation
bre-ai-setup catalog validate

# Verbose (debug mode)
bre-ai-setup catalog validate --verbose

# Shows:
# ✔ Schema valid
# ✔ All skill paths exist
# ✔ All frontmatter valid
# ✔ All hashes valid
# ✔ No duplicates
```

### Building/Rebuilding Catalog

```bash
# Regenerate catalog.json from current skills
bre-ai-setup catalog build

# With verbose logging
bre-ai-setup catalog build --verbose
```

## Testing with Test Catalog

```bash
# Navigate to test catalog
cd packages/test-catalog

# Run CLI commands
node ../cli/dist/cli.js catalog validate

# Or from root
pnpm test:catalog catalog validate

# Add skill to test catalog
cd packages/test-catalog
node ../cli/dist/cli.js catalog skill add test-skill
```

## Local Usage (Like npx)

After building, simulate `npx` usage:

```bash
# Link globally
cd packages/cli
pnpm link --global

# Use from any directory
cd ~/my-catalog
bre-ai-setup catalog new
bre-ai-setup catalog skill add my-skill
```

## Publishing (Future)

```bash
cd packages/cli
pnpm publish --access public

# Users will then use:
npx @brequet/ai-setup@latest catalog new
```

## Troubleshooting

### Build errors

```bash
cd packages/cli
rm -rf node_modules dist
pnpm install
pnpm build
```

### Global link not working

```bash
# Unlink and relink
pnpm unlink --global @brequet/ai-setup
cd packages/cli
pnpm link --global
```

### Verbose logging for debugging

Add `--verbose` to any command:

```bash
bre-ai-setup --verbose catalog validate
bre-ai-setup --verbose catalog build
```
