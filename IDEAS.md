# BRE AI Agents Sharing - Analysis & Implementation Plan

## Executive Summary

**Goal**: Team-wide sharing of OpenCode skills, MCP configs, and Copilot agents with global availability, versioning, and non-destructive installation.

**Approach**: Central GitLab catalog + npx CLI tool (shadcn-ui model) + Artifactory distribution.

---

## Architecture

### Core Components

```
@brequet/ai-setup (npx CLI)
    ↓ clones/pulls
bre-ai-agents-catalog (GitLab)
    ↓ syncs to
~/.config/opencode/skills/
  bre-refactor-monorepo/
    SKILL.md
  bre-write-docs/
    SKILL.md
  bre-frontend-angular-patterns/
    SKILL.md
  personal-my-custom-skill/
    SKILL.md
.vscode/mcp.json
AGENTS.md
```

### Repository Structure

#### `bre-ai-agents-catalog` (GitLab)

```
skills/
  refactor-monorepo/SKILL.md
  write-docs/SKILL.md
mcp/servers.json
meta/
  catalog.json
  schema.json
scripts/
  validate.ts
.gitlab-ci.yml
README.md
```

#### `ai-setup` (npm package on Artifactory)

```
src/
  cli.ts
  commands/
    # Consumer commands
    init.ts
    sync.ts
    skills.ts
    mcp.ts
    # Maintainer commands
    catalog/
      new.ts
      skill-add.ts
      mcp-add.ts
      validate.ts
      build.ts
      list.ts
  core/
    catalog.ts
    installer.ts
    config.ts
  utils/
    paths.ts
    git.ts
    merge.ts
package.json
tsconfig.json
```

---

## Development Setup (PoC)

### Monorepo Structure

**Parallel development**: Build catalog maintenance + consumption iteratively.

```
ai-setup-poc/
  packages/
    cli/                              # @brequet/ai-setup
      src/
        commands/
          skills.ts                   # Consumer
          catalog/                    # Maintainer
            skill-add.ts
            validate.ts
            build.ts
      package.json
    test-catalog/                     # Local test catalog
      skills/
        refactor-monorepo/SKILL.md
      mcp/servers.json
      meta/catalog.json
      package.json
  pnpm-workspace.yaml
  .opencode/AGENT.md
```

### Dev Workflow

```bash
# Terminal 1: CLI development
cd packages/cli
pnpm dev                              # tsx watch

# Terminal 2: Test against local catalog
cd packages/test-catalog
node ../cli/dist/cli.js catalog skill add new-skill
node ../cli/dist/cli.js skills --all

# Build test catalog
node ../cli/dist/cli.js catalog build
node ../cli/dist/cli.js catalog validate
```

**Benefits**:
- Tight feedback loop (edit CLI → test immediately)
- Real catalog structure from day 1
- Easy to split later (move `test-catalog/` to separate GitLab repo)

---

## Catalog Maintenance Strategy

**Problem**: Teams need standardized way to create/maintain catalogs.

**Solution**: Unified CLI handles both consuming and maintaining.

### Why Unified?

1. **Multi-team scenario**: Other teams create their own catalogs → need same tooling
2. **Single source of truth**: Schema, validation, build logic centralized
3. **Better DX**: One tool to learn (`npx @brequet/ai-setup`)
4. **Natural discovery**: Devs see `catalog` commands, realize they can contribute

### Catalog Commands (Interactive)

```bash
$ npx @brequet/ai-setup catalog skill add
? Skill name: refactor-monorepo
? Description: TypeScript monorepo refactoring
? Tags: refactor,monorepo,typescript
✓ Generated skills/refactor-monorepo/SKILL.md (template)
✓ Updated meta/catalog.json

$ npx @brequet/ai-setup catalog validate
✓ Schema valid
✓ All skill paths exist
✓ Hashes computed
✓ No duplicates

$ npx @brequet/ai-setup catalog build
✓ Generated meta/catalog.json
✓ Computed 3 skill hashes
✓ Catalog ready for commit
```



---

## Catalog Schema

### `meta/catalog.json`

```json
{
  "name": "BRE Company AI Agents",
  "id": "bre-company",
  "version": "1.2.3",
  "gitUrl": "https://gitlab.bre/bre-ai-agents-catalog.git",
  "opencodeVersion": ">=1.0.0",
  "skills": {
    "refactor-monorepo": {
      "hash": "sha256:abc123...",
      "path": "skills/refactor-monorepo/SKILL.md",
      "tags": ["refactor", "monorepo", "typescript"],
      "description": "TypeScript monorepo refactoring patterns",
      "version": "1.0.0"
    }
  },
  "mcpServers": {
    "@brequet-gitlab": {
      "type": "nodePackage",
      "package": "@brequet/mcp-gitlab",
      "args": [],
      "env": {
        "GITLAB_URL": "https://gitlab.bre.local"
      }
    }
  },
  "copilotTemplates": {
    "backend": {
      "path": "copilot/templates/backend.md",
      "description": "Backend service agent template"
    }
  }
}
```

---

## CLI Command Design

### Consumer Commands (Skills/MCP)

```bash
# First-time setup (interactive)
npx @brequet/ai-setup@latest init

# List all catalogs and status
npx @brequet/ai-setup@latest list

# Update catalog cache
npx @brequet/ai-setup@latest sync [--channel stable|beta]

# Install/update skills
npx @brequet/ai-setup@latest skills --all
npx @brequet/ai-setup@latest skills --select refactor-monorepo,write-docs
npx @brequet/ai-setup@latest skills --dry-run

# Configure MCP servers
npx @brequet/ai-setup@latest mcp --user
npx @brequet/ai-setup@latest mcp --workspace .

# Add new catalog registry
npx @brequet/ai-setup@latest add <git-url>

# Copilot template injection
npx @brequet/ai-setup@latest copilot --template backend
```

### Maintainer Commands (Catalog Management)

**Unified CLI for both consuming and maintaining catalogs.**

```bash
# Initialize new catalog (interactive)
npx @brequet/ai-setup catalog new

# Add skill to catalog (interactive prompts for metadata)
npx @brequet/ai-setup catalog skill add [name]

# Add MCP server config
npx @brequet/ai-setup catalog mcp add [name]

# Validate catalog structure + metadata
npx @brequet/ai-setup catalog validate

# Build catalog.json from current state
npx @brequet/ai-setup catalog build

# List catalog contents
npx @brequet/ai-setup catalog list
```

**Multi-team support**: Other teams use same CLI for their catalogs

```bash
# Team creates their own catalog
cd bre-frontend-catalog
npx @brequet/ai-setup catalog new
npx @brequet/ai-setup catalog skill add react-patterns
npx @brequet/ai-setup catalog validate
git add . && git commit && git push

# Consumers add team catalog
npx @brequet/ai-setup add https://gitlab.bre/frontend/bre-frontend-catalog.git
npx @brequet/ai-setup skills
```

**Interactive UX**: All catalog commands prompt for required info

```bash
$ npx @brequet/ai-setup catalog skill add
? Skill name: refactor-monorepo
? Description: TypeScript monorepo refactoring patterns
? Tags (comma-separated): refactor,monorepo,typescript
✓ Created skills/refactor-monorepo/SKILL.md
✓ Updated meta/catalog.json
```

### Workflow States

```
New Developer:
  npx @brequet/ai-setup init
    → "Add BRE company catalog? [Y/n]"
    → Sets @brequet:registry in ~/.npmrc
    → Clones catalog to %LOCALAPPDATA%\bre-ai-cache\bre-company

  npx @brequet/ai-setup sync
    → "3 new skills available"

  npx @brequet/ai-setup skills --all
    → Installs to ~/.config/opencode/skills/bre-*

Existing Developer (update):
  npx @brequet/ai-setup sync
    → "2 skills outdated, 1 new. Update? [Y/n]"
    → Shows diff of changes

  npx @brequet/ai-setup skills --yes
    → Auto-update without prompts

Team Lead (custom catalog):
  npx @brequet/ai-setup add https://gitlab.bre/frontend-team/ai-catalog.git
    → Added as "frontend-team" with priority 2

  npx @brequet/ai-setup skills
    → Shows skills from both catalogs
    → Installs bre-* and bre-frontend-*
```

---

## Multi-Catalog Strategy

### Configuration File: `~/.config/ai-setup/config.json`

```json
{
  "catalogs": {
    "bre-company": {
      "url": "https://gitlab.bre/bre-ai-agents-catalog.git",
      "priority": 1,
      "active": true,
      "channel": "stable"
    },
    "frontend-team": {
      "url": "https://gitlab.bre/frontend-team/ai-catalog.git",
      "priority": 2,
      "active": true,
      "channel": "beta"
    }
  },
  "installed": {
    "bre-refactor-monorepo": {
      "catalog": "bre-company",
      "version": "1.0.0",
      "hash": "sha256:abc123",
      "installedAt": "2026-02-19T20:00:00Z"
    }
  }
}
```

### Namespace Convention

**OpenCode Skill Folder Names** (flat directory structure):

- **Company-wide**: `bre-<skill-name>` (e.g., `bre-refactor-monorepo`)
- **Team-specific**: `bre-<team>-<skill-name>` (e.g., `bre-frontend-react-patterns`)
- **Personal**: `personal-<skill-name>` (local-only, never synced)

**Example**:

```
~/.config/opencode/skills/
  bre-refactor-monorepo/SKILL.md
  bre-write-docs/SKILL.md
  bre-frontend-react-patterns/SKILL.md
  bre-backend-db-migrations/SKILL.md
  personal-my-custom-skill/SKILL.md
```

### Conflict Resolution

**Prefix-based**: CLI only touches folders starting with `bre-` and `bre-<team>-` prefixes, never overwrites user skills.

**Example**:

```
bre-company (priority 1): bre-refactor-monorepo v1.0
bre-frontend-team (priority 2): bre-refactor-monorepo v2.0

Result: v1.0 installed (company priority wins)
Warning: "Conflict detected, using company version"
```

---

## Installation Targets

### OpenCode Skills

**Path detection** (Windows):

1. Check `%USERPROFILE%\.config\opencode\skills`
2. Check `%APPDATA%\opencode\skills`
3. Check `%LOCALAPPDATA%\opencode\skills`

**Installation**:

```
~/.config/opencode/skills/
  bre-refactor-monorepo/
    SKILL.md
  bre-write-docs/
    SKILL.md
  bre-frontend-react-patterns/
    SKILL.md
  personal-my-custom-skill/
    SKILL.md
```

**Safety**: CLI only writes to folders with `bre-*` or `bre-<team>-*` prefixes, preserving all other user skills.

### VS Code MCP Configuration

**User-level**: `%APPDATA%\Code\User\mcp.json`

**Workspace-level**: `.vscode/mcp.json`

**Merge strategy**:

```json
{
  "servers": {
    "user-custom-server": { ... },
    "@brequet-gitlab": {
      "command": "npx",
      "args": ["@brequet/mcp-gitlab"],
      "env": { "GITLAB_URL": "https://gitlab.bre.local" }
    },
    "@brequet-jira": { ... }
  }
}
```

**Conflict detection**: If user has server named `@brequet-*`, prompt before overwriting.

### Copilot AGENTS.md

**Strategy**: Template injection, not full file replacement.

```markdown
# Agents

## Backend Service Agent

[Injected from bre-ai-agents-catalog/copilot/templates/backend.md]

...

## User's Custom Agent

[User-written content preserved]
```

---

## Potential Issues & Mitigations

### 1. Authentication & Access

**Issue**: Artifactory npm registry requires auth tokens  
**Impact**: Devs can't use `npx` without setup  
**Mitigation**: Bootstrap PowerShell script that sets `@brequet:registry` and handles token via env var or `npm login`

### 2. Windows Path Edge Cases

**Issue**: OpenCode config path varies on Windows  
**Impact**: CLI might write to wrong location  
**Mitigation**: Programmatic path detection with fallbacks, verbose logging

### 3. Git Clone in %TEMP%

**Issue**: Discussion mentioned `%TEMP%` but it gets cleaned  
**Impact**: Repeated full clones instead of pulls  
**Mitigation**: Use `%LOCALAPPDATA%\bre-ai-cache` for persistence

### 4. MCP Merge Conflicts

**Issue**: User has custom server with same name  
**Impact**: Silently overwriting user config  
**Mitigation**: Namespace all BRE servers with `@brequet-*` prefix, conflict prompt

### 5. Multi-Catalog Priority Conflicts

**Issue**: Two catalogs define same skill namespace  
**Impact**: Unclear which version is installed  
**Mitigation**: Explicit priority in config, show warnings on conflicts

### 6. Skill Compatibility

**Issue**: SKILL.md format evolves across OpenCode versions  
**Impact**: Old skills break new OpenCode or vice versa  
**Mitigation**: `opencodeVersion` field in catalog metadata, version check on sync

### 7. Offline/Network Failures

**Issue**: `git pull` fails when GitLab down  
**Impact**: CLI unusable  
**Mitigation**: Graceful degradation, show cached version with "stale" warning

### 8. Artifactory Publishing

**Issue**: Manual npm publish creates bottlenecks  
**Impact**: Delayed CLI updates  
**Mitigation**: GitLab CI auto-publishes on git tags

### 9. User Discoverability

**Issue**: Devs don't know what skills exist  
**Impact**: Low adoption  
**Mitigation**: Auto-generated README in catalog repo, `list` command with descriptions

### 10. Rollback/Bad Updates

**Issue**: Broken skill update impacts all devs  
**Impact**: Productivity loss  
**Mitigation**: Channel support (`stable`/`beta`), git tag-based versions, rollback command

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

**Deliverables**:

- [ ] Create `bre-ai-agents-catalog` repo on GitLab
- [ ] Define directory structure and `catalog.json` schema
- [ ] Add 2-3 sample skills for testing
- [ ] Create `ai-setup` TypeScript project
- [ ] Scaffold CLI with Commander.js
- [ ] Configure Artifactory npm repository `npm-bre`
- [ ] Test manual publish of `@brequet/ai-setup@0.1.0`

**Validation**: Can manually run `npx @brequet/ai-setup@0.1.0 --version` after registry setup.

---

### Phase 2: Core CLI Features (Week 2)

**Deliverables**:

- [ ] Implement catalog clone/pull to `%LOCALAPPDATA%\bre-ai-cache`
- [ ] Parse `catalog.json` and compute skill hashes
- [ ] Detect OpenCode config directory (Windows path variations)
- [ ] Implement `skills` command: write SKILL.md to `bre-*` prefixed folders
- [ ] Track installed skills in local state file
- [ ] Implement `mcp` command: merge servers into `mcp.json`
- [ ] Add `--dry-run` flag showing proposed changes
- [ ] Interactive prompts for updates (with confirmation)

**Validation**:

- Install 3 skills from test catalog
- Verify skills appear in OpenCode
- Update 1 skill, verify only that file changes
- Add MCP server, verify merge preserves user config

---

### Phase 3: Multi-Catalog Support (Week 3)

**Deliverables**:

- [ ] Implement `~/.config/ai-setup/config.json` for catalog registry
- [ ] `add` command to register new catalogs
- [ ] `list` command showing all catalogs + installed skills
- [ ] Priority-based conflict resolution
- [ ] Namespace enforcement (`bre-*`, `bre-team-*` prefixes)
- [ ] Channel support (`--channel stable|beta|experimental`)
- [ ] Git tag/branch switching for versions

**Validation**:

- Add 2 catalogs (company + team)
- Install skills from both
- Trigger priority conflict, verify resolution
- Switch channels, verify different skill versions

---

### Phase 4: Automation & Polish (Week 4)

**Deliverables**:

- [ ] GitLab CI for catalog: auto-generate `catalog.json`, validate skills
- [ ] GitLab CI for CLI: auto-publish to Artifactory on git tag
- [ ] Bootstrap PowerShell script for first-time setup
- [ ] Catalog README auto-generation (skill index)
- [ ] CLI README with usage examples
- [ ] Error handling: user-friendly messages for common failures
- [ ] Logging: `--verbose` flag, log file in cache dir
- [ ] Offline mode: cached catalog with staleness warnings

**Validation**:

- Run full onboarding flow on fresh VM
- Simulate network failure, verify graceful degradation
- Trigger all error paths, verify helpful messages
- Review logs for debugging clarity

---

### Phase 5: Rollout & Iteration (Ongoing)

#### Pilot (Week 5-6)

- [ ] 3-5 devs test end-to-end workflow
- [ ] Gather feedback on UX pain points
- [ ] Refine namespace strategy based on real usage
- [ ] Fix critical bugs from pilot

#### Team Rollout (Week 7+)

- [ ] Announce in Slack/Teams with demo video
- [ ] Update onboarding docs with setup instructions
- [ ] Office hours for troubleshooting
- [ ] Monitor GitLab issues and questions

#### Future Enhancements

- [ ] Web UI for catalog browsing
- [ ] Opt-in telemetry (skill usage analytics)
- [ ] Auto-update notifications (check on shell init)
- [ ] Copilot AGENTS.md advanced merging
- [ ] VS Code extension for skill management

---

## Key Decisions Needed

**Before starting implementation, clarify**:

1. **Auth strategy**: npm login vs env var (`BRE_ARTIFACTORY_TOKEN`)? How do devs get initial tokens?

2. **Namespace convention**: Use `bre-<skill>` or `bre-company-<skill>` for company-wide? How to structure team-specific (`bre-frontend-*` vs `bre-backend-*`)?

3. **Update frequency**: Auto-sync on every `npx` run, or manual `sync` command only?

4. **Skill approval process**: Who reviews PRs to catalog? Required CODEOWNERS file?

5. **MCP server publishing**: Will MCP servers also be npm packages on Artifactory, or external (e.g., Docker)?

6. **Copilot integration depth**: Just provide templates, or actively merge into existing AGENTS.md?

7. **Channel strategy**: Default to `stable` only initially, or support `beta` from day 1?

8. **Telemetry**: Track skill usage for insights, or keep fully offline?

---

## Success Metrics

### Adoption

- **Target**: 80% of devs with `@brequet/ai-setup` configured within 3 months
- **Measure**: Artifactory download count, internal survey

### Usage

- **Target**: Average 5+ skills installed per dev
- **Measure**: Track via `~/.config/ai-setup/config.json` (aggregate anonymously)

### Velocity

- **Target**: <1 hour from "skill PR merged" to "available to all devs"
- **Measure**: GitLab CI pipeline duration + sync time

### Satisfaction

- **Target**: >4/5 rating on "ease of use vs manual dotfile editing"
- **Measure**: Quarterly dev survey

### Contribution

- **Target**: 2+ teams create custom catalogs within 6 months
- **Measure**: Count of registered catalogs in ecosystem

---

## Risk Management

| Risk                       | Likelihood | Impact   | Mitigation                                                       |
| -------------------------- | ---------- | -------- | ---------------------------------------------------------------- |
| Artifactory auth friction  | High       | High     | Clear bootstrap docs, auto-token script, video walkthrough       |
| Breaking skill updates     | Medium     | High     | Git tags + rollback command, staging channel (`beta` → `stable`) |
| CLI bugs break workflows   | Medium     | Critical | Extensive dry-run testing, verbose logging, fast hotfix pipeline |
| Low adoption (too complex) | Medium     | High     | Pilot with power users first, iterate on UX, simplify onboarding |
| Namespace collisions       | Low        | Medium   | Strict naming conventions enforced by CI validation              |
| GitLab downtime            | Low        | Medium   | Local cache persistence, offline mode with stale warnings        |
| OpenCode format changes    | Low        | High     | Version pinning in catalog, compatibility checks on sync         |

---

## Comparison to Alternatives

### Alternative 1: Manual dotfile editing

**Pros**: No tooling needed  
**Cons**: Error-prone, no versioning, doesn't scale, no cross-CWD availability  
**Verdict**: ❌ Rejected

### Alternative 2: Skills in each project repo

**Pros**: Simple, versioned with code  
**Cons**: Fails "parent of all projects" use case, duplicates definitions  
**Verdict**: ❌ Rejected

### Alternative 3: Chocolatey package with files

**Pros**: Familiar to Windows devs  
**Cons**: Global install pollution, stale versions, no multi-catalog support  
**Verdict**: ❌ Rejected

### Alternative 4: npx CLI + Git catalog (chosen approach)

**Pros**: Zero install, always latest, multi-catalog, safe namespacing, follows shadcn-ui pattern  
**Cons**: Requires initial registry setup, depends on Artifactory  
**Verdict**: ✅ **Selected**

---

## Technical Debt & Future Considerations

### Known Limitations (v1.0)

- Single OS support (Windows only initially)
- No GUI/TUI for skill selection (CLI flags only)
- No automatic skill discovery (must know skill name)
- No diff preview for skill updates
- No collaborative conflict resolution (priority-based only)

### Planned Improvements (v2.0+)

- Cross-platform support (macOS, Linux)
- Interactive TUI (like `npx shadcn-ui@latest add`)
- Skill search/browse command
- Rich diff display (show SKILL.md changes before applying)
- Collaborative mode (suggest merge strategies for conflicts)
- VSCode extension integration
- Skill marketplace/sharing beyond BRE

---

## Conclusion

This architecture provides a **production-ready, scalable solution** for sharing AI agent configurations across your team. It:

✅ Follows industry best practices (shadcn-ui, VS Code MCP, enterprise MCP)  
✅ Solves all stated requirements (global, versioned, safe, zero-friction)  
✅ Accounts for real-world issues (auth, conflicts, offline, rollback)  
✅ Provides clear implementation path (4-week core + 2-week pilot)  
✅ Extensible to multi-team, multi-catalog scenarios

**Next step**: Review with team, make key decisions, begin Phase 1 implementation.

---
