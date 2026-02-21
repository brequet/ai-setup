# @brequet/ai-setup

TUI TypeScript CLI tool for managing AI agent catalogs, OpenCode skills, and MCP configurations.

## Project Structure

```
ai-setup-poc/
├── packages/
│   ├── cli/                    # @brequet/ai-setup CLI package
│   │   ├── src/
│   │   │   ├── cli.ts         # Entry point
│   │   │   ├── commands/      # Command implementations
│   │   │   ├── core/          # Core logic (schemas, catalog ops)
│   │   │   └── utils/         # Utilities (logger, hash, helpers)
│   │   ├── dist/              # Built output
│   │   └── package.json
│   └── test-catalog/          # Test catalog for development
│       ├── skills/
│       ├── mcp/
│       ├── meta/
│       │   └── catalog.json
│       └── README.md
├── pnpm-workspace.yaml
└── README.md
```

## Features

✅ **Catalog Management**
- Create new catalogs with `catalog new`
- Add skills with `catalog skill add`
- Validate catalog structure and hashes
- Build/rebuild catalog metadata

✅ **OpenCode Spec Compliant**
- YAML frontmatter in SKILL.md files
- Name validation (lowercase, alphanumeric, hyphens)
- Description length validation (1-1024 chars)
- Automatic name normalization
- Frontmatter validation in `catalog validate`

✅ **Modern CLI UX**
- Interactive prompts with fallback to CLI args
- Colored output with chalk
- Structured logging with `--verbose` flag
- Spinners for long operations

✅ **Type-Safe**
- Full TypeScript implementation
- Zod schemas for validation
- Type inference from schemas

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build CLI
cd packages/cli
pnpm build
```

### Local Development

```bash
# Terminal 1: Watch mode
cd packages/cli
pnpm dev

# Terminal 2: Test commands (navigate to catalog first)
cd packages/test-catalog
node ../cli/dist/cli.js catalog validate
```

### Commands

#### Catalog Commands (Maintainer)

```bash
# Create new catalog
ai-setup catalog new
ai-setup catalog new --name "My Catalog" --id "my-catalog"

# Add skill (OpenCode spec-compliant)
ai-setup catalog skill add
ai-setup catalog skill add git-release \
  --description "Create consistent releases and changelogs" \
  --tags "git,release,changelog" \
  --license "MIT"

# Name normalization examples
ai-setup catalog skill add "My Cool Skill"    # → my-cool-skill
ai-setup catalog skill add "PR Review!!!"     # → pr-review

# Validate catalog (checks frontmatter, names, hashes)
ai-setup catalog validate
ai-setup catalog validate --verbose

# Build catalog (regenerate hashes)
ai-setup catalog build
```

#### Global Flags

```bash
--verbose              # Enable debug logging
```

## Usage

### As Local Package (Development)

```bash
cd packages/cli
pnpm link --global
ai-setup catalog new
```

### As npx Package (After Publish)

```bash
npx @brequet/ai-setup@latest catalog new
npx @brequet/ai-setup@latest catalog skill add my-skill
```

## Architecture Decisions

- **Monorepo**: pnpm workspace for tight CLI ↔ catalog feedback loop
- **Logger**: Custom chalk-based (simple, no overhead)
- **Validation**: Zod schemas (type-safe, better DX)
- **Hash**: SHA-256 via Node.js crypto (simple, sufficient)
- **UX**: Args + interactive fallback (flexible, modern)

## OpenCode Spec Compliance

This tool generates **OpenCode-compliant** SKILL.md files:

### YAML Frontmatter (Required)

```yaml
---
name: my-skill
description: Brief description of what this skill does
license: MIT
compatibility: opencode
metadata:
  tags: tag1, tag2, tag3
---
```

### Name Validation

Skill names must follow OpenCode spec:
- 1-64 characters
- Lowercase alphanumeric with single hyphen separators
- No leading/trailing hyphens
- No consecutive hyphens
- Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

**Examples:**
- ✅ `git-release` - Valid
- ✅ `pr-review` - Valid
- ✅ `my-cool-skill` - Valid
- ❌ `My-Skill` - Uppercase
- ❌ `-my-skill` - Leading hyphen
- ❌ `my--skill` - Consecutive hyphens

### Description Validation

- Must be 1-1024 characters
- Should be specific enough for agents to choose correctly

### Directory Structure

```
skills/
  my-skill/
    SKILL.md       # Name in frontmatter must match directory
```

The CLI automatically:
- Normalizes names to valid format
- Validates frontmatter on `catalog validate`
- Checks name/directory consistency
- Verifies description length

## Next Steps

See [IDEAS.md](./IDEAS.md) for full implementation roadmap.

### Phase 2 (Consumer Commands)
- `init` - First-time setup
- `sync` - Update catalog cache
- `skills` - Install/update skills
- `mcp` - Configure MCP servers

### Future
- Multi-catalog support
- Git integration
- VS Code extension
- Web UI for catalog browsing
