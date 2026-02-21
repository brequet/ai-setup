# @brequet/agent-sync

A CLI tool for teams to manage and synchronize AI agent "catalogs". Currently focused on OpenCode skills, with planned support for MCP configurations, settings, and system prompts.

## Purpose

`agent-sync` allows dev teams to share AI agent capabilities (skills) via shared repositories or local paths. Team members can push new skills to a central catalog (like a git repository), and others can instantly synchronize those skills to their local environment.

## Usage

This tool is designed to be run via `npx` to ensure you always have the latest version without a global installation.

```bash
npx @brequet/agent-sync@latest [command]

```

### 1. Add a Catalog

Register a team catalog (Git repository or local directory).

```bash
npx @brequet/agent-sync@latest add https://github.com/your-team/agent-catalog.git

```

### 2. Synchronize Skills

Update your local catalogs and interactively select skills to install or update.

```bash
npx @brequet/agent-sync@latest sync
npx @brequet/agent-sync@latest skills

```

### 3. List Status

View registered catalogs and currently installed skills.

```bash
npx @brequet/agent-sync@latest list

```

## Core Commands

| Command      | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| `add <path>` | Register a new catalog (Git URL or local path).                   |
| `sync`       | Fetch updates for all Git-based catalogs.                         |
| `skills`     | Interactive prompt to install or update skills from catalogs.     |
| `list`       | Show registered catalogs and installed skill status.              |
| `catalog`    | Maintainer commands to initialize and manage a catalog structure. |

## Creating a Catalog (Maintainers)

Teams can create their own catalogs to distribute skills. A catalog is simply a directory or repository with a `skills/` folder.

1. **Initialize a new catalog:**

```bash
mkdir my-team-catalog && cd my-team-catalog
npx @brequet/agent-sync@latest catalog init

```

2. **Add a new skill:**

```bash
npx @brequet/agent-sync@latest catalog skill add my-new-skill

```

This creates a folder in `skills/my-new-skill/` with a `SKILL.md` file containing the instructions and metadata for the agent.

3. **Distribute:**

Push the directory to a Git repository. Your team can then run `npx @brequet/agent-sync add <your-repo-url>` to start using it.

## Roadmap

- [x] **Skills:** Sync and install OpenCode skill definitions.
- [ ] **MCP:** Manage Model Context Protocol configurations.
- [ ] **Settings:** Sync OpenCode/IDE settings and keybindings.
- [ ] **Prompts:** Centralized management of system prompts.

## License

MIT
