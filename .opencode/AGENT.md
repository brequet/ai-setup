# @bre/ai-setup CLI Tool

**Purpose**: Distribute OpenCode skills, MCP configs, and Copilot agents across team via npx CLI with multi-catalog support.

**Model**: shadcn-ui distribution pattern.

---

## Stack

| Layer           | Choice       | Rationale                                        |
| --------------- | ------------ | ------------------------------------------------ |
| Language        | TypeScript   | Type safety, modern tooling                      |
| CLI Framework   | Commander.js | Flags + interactive flows, industry standard     |
| Interactive UI  | Inquirer.js  | Multi-step forms (arrows, checkboxes, selection) |
| Styling         | Chalk        | Colors, compact bundle                           |
| Loading         | ora          | Spinners with minimal overhead                   |
| Git             | simple-git   | Programmatic git operations                      |
| Package Manager | pnpm         | Faster, smaller disk, good npm compatibility     |

---

## Technical Requirements

### Core Commands

- `init` - First-time setup (interactive)
- `sync [--channel stable|beta]` - Update catalog cache
- `skills [--all|--select <names>|--dry-run] [--yes]` - Install/update skills
- `mcp [--user|--workspace .]` - Configure MCP servers
- `list` - Show catalogs + installed skills
- `add <git-url>` - Register new catalog

### Dual Modes

1. **Interactive** (default): Multi-step forms via Inquirer.js
2. **Non-interactive**: Flags for CI/CD automation

**Example**:

```bash
# Interactive
npx @bre/ai-setup init
npx @bre/ai-setup skills

# Non-interactive (CI/CD)
npx @bre/ai-setup skills --all --yes
npx @bre/ai-setup mcp --user --silent
```

---

## Architecture

```
src/
  cli.ts                    # Entry, Command setup
  commands/
    init.ts                 # First-time setup
    sync.ts                 # Catalog update
    skills.ts               # Install skills
    mcp.ts                  # MCP config
    list.ts                 # List catalogs
    add.ts                  # Register catalog
  core/
    catalog.ts              # Parse catalog.json, hash tracking
    installer.ts            # File I/O for skills/MCP
    config.ts               # ~/.bre-ai/config.json management
    paths.ts                # OS path detection (Windows paths)
  ui/
    prompts.ts              # Inquirer.js workflows
    messages.ts             # Styled output (Chalk)
  utils/
    git.ts                  # simple-git wrapper
    merge.ts                # Safe JSON merging (MCP)
    hash.ts                 # File hashing (diff detection)
```

---

## OpenCode Skill Namespace

**Flat directory structure** (OpenCode native):

```
~/.config/opencode/skills/
  bre-refactor-monorepo/SKILL.md      (company-wide)
  bre-frontend-react-patterns/SKILL.md (team)
  personal-custom/SKILL.md             (user, untouched)
```

**CLI writes only to `bre-*` and `bre-<team>-*` prefixes.**

---

## Key Features

1. **Multi-Catalog Registry**: `~/.bre-ai/config.json` with priority-based conflict resolution
2. **Offline Mode**: Cached in `%LOCALAPPDATA%\bre-ai-cache` with staleness warnings
3. **Non-Destructive**: Only manages `bre-*` prefixed skills/MCP servers
4. **Hash-Based Diffing**: Detects updates without comparing full content
5. **Graceful Degradation**: Works offline with cached catalog
6. **Dry-Run**: Preview changes before applying

---

## Configuration

### User Config: `~/.bre-ai/config.json`

```json
{
  "catalogs": {
    "bre-company": {
      "url": "https://gitlab.bre/bre-ai-agents-catalog.git",
      "priority": 1,
      "active": true,
      "channel": "stable"
    }
  },
  "installed": {
    "bre-refactor-monorepo": {
      "catalog": "bre-company",
      "version": "1.0.0",
      "hash": "sha256:...",
      "installedAt": "2026-02-19T20:00:00Z"
    }
  }
}
```

### Catalog Metadata: `meta/catalog.json`

```json
{
  "name": "BRE Company AI Agents",
  "id": "bre-company",
  "version": "1.2.3",
  "gitUrl": "https://gitlab.bre/bre-ai-agents-catalog.git",
  "opencodeVersion": ">=1.0.0",
  "skills": {
    "refactor-monorepo": {
      "hash": "sha256:abc123",
      "path": "skills/refactor-monorepo/SKILL.md",
      "version": "1.0.0",
      "tags": ["refactor", "monorepo"]
    }
  }
}
```

---

## Dependencies (pnpm)

**Core**:

```
commander@^12.0.0          # CLI parsing + subcommands
inquirer@^10.0.0           # Interactive forms
chalk@^5.0.0               # Terminal colors
ora@^8.0.0                 # Spinners
simple-git@^3.20.0         # Git operations
```

**Utilities**:

```
ts-node@^10.0.0            # TypeScript execution
typescript@^5.3.0          # Language
tsx@^4.0.0                 # Fast TS runner (bin script)
```

**Dev**:

```
@types/node@^20.0.0
vitest@^1.0.0
@typescript-eslint/*
```

---

## Build & Distribution

**Build**: `tsc src/ --outDir dist/`

**Bin**: `tsx src/cli.ts` (direct TS execution)

**npm script**:

```json
{
  "name": "@bre/ai-setup",
  "version": "0.1.0",
  "bin": {
    "bre-ai-setup": "dist/cli.js"
  },
  "type": "module",
  "exports": "./dist/cli.js"
}
```

**Distribution**: Publish to Artifactory `npm-bre` registry via GitLab CI on git tags.

---

## Windows Considerations

**Paths**:

- Check `%USERPROFILE%\.config\opencode\skills` → `%APPDATA%\opencode` → `%LOCALAPPDATA%\opencode`
- Cache: `%LOCALAPPDATA%\bre-ai-cache` (persistent, not cleaned)
- Config: `%USERPROFILE%\.bre-ai\config.json`

**Execution**: Direct Node.js (no shell wrappers).

---

## Validation

**Phase 1 (Foundation)**:

- [ ] CLI scaffolds with Commander.js + Inquirer.js
- [ ] `init` interactive flow works
- [ ] Runs via `npx @bre/ai-setup@0.1.0 --version`

**Phase 2 (Core)**:

- [ ] Catalog clone/parse, hash tracking
- [ ] `skills --all` installs to correct paths
- [ ] `mcp --user` merges without overwriting
- [ ] `--dry-run` shows changes without applying

**Phase 3 (Multi-Catalog)**:

- [ ] Multi-catalog registry + priority resolution
- [ ] Namespace enforcement (only `bre-*` touched)
- [ ] Conflict prompts work

---

## Scope (v1.0)

✅ Interactive + flag-based modes  
✅ Multi-catalog support  
✅ Windows support  
✅ Offline fallback  
❌ Web UI (v2.0+)  
❌ macOS/Linux (later iteration)  
❌ Auto-update on shell init (v2.0+)

---

## Notes

- **No unnecessary abstractions**: Direct file I/O, simple JSON merge
- **Fast startup**: Bundle <2MB, first prompt in ~0.5s
- **Production-ready**: Comprehensive error handling, verbose logs, dry-run
- **Extensible**: Easy to add commands, new catalogs
