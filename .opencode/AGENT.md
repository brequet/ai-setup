# @brequet/agent-sync CLI Tool

## Project Vision

`@brequet/agent-sync` is a high-performance, ESM-first TypeScript CLI for managing AI agent catalogs and MCP (Model Context Protocol) configurations. We prioritize **type safety**, **minimalist DX**, and **idempotency**.

## Core Principles & TypeScript Standards

- **Readable Conciseness:** Prioritize readability and modularity over cleverness. Keep functions focused, but do not sacrifice readability for line count.
- **Production-Ready:** Every change must handle edge cases (e.g., missing permissions, invalid JSON).
- **No `any`:** Strict TypeScript only.
- **Modern CLI Patterns:** Take inspiration from `shadcn/cli`. Use **@inquirer/prompts** for interactive prompts and **Commander** for flags.
- **Lean code talk for itself:** Avoid unnecessary comments for simple enough code.
* **Strict TypeScript (The Matt Pocock Standard):**
  * NO `any` or `unknown` unless absolutely necessary.
  * Always declare explicit return types on top-level functions.
  * Do NOT use `enum`. Use const objects (`as const`) or union types instead.

## Tech Stack & Standards

- **Runtime:** Node.js (Latest LTS), ESM (`"type": "module"`).
- **Package Manager:** `pnpm`.
- **Dependency:** use pnpm command to add/remove dependencies, rightly scoped (dev vs prod). Refrain from directly modifying `package.json` unless absolutely necessary.
- **Testing:** Vitest. Focus on critical paths, not 100% coverage.

## Development Workflow

> **CRITICAL:** The agent must verify code quality after every modification.

1. **Modify:** Implement the requested feature or fix.
2. **Lint:** Run `pnpm lint`. If it fails, fix the errors immediately.
3. **Test:** Run `pnpm test` to ensure no regressions.
4. **Confirm:** Only report completion once linting and testing pass.

## Permissions & Boundaries
* **Always Allowed:** Reading files, running file-scoped tests, type-checking, and formatting.
* **Ask First:** Modifying `package.json`, installing new heavy dependencies, or doing repo-wide refactors.
* **Never Do:** Bypassing type checks (`@ts-ignore`) or mutating external files without user consent.

## Architecture & Codebase Map

Always check these locations before writing new utilities:
* **`src/utils/fs-async.ts`**: Use this for ALL file system operations. Do not use native `fs` directly.
* **`src/utils/errors.ts`**: Use this for standardizing error handling and CLI output formatting.
* **`src/utils/`**: Check here for existing utilities before adding new ones. Aim to keep the codebase DRY and maintainable.
* **Hybrid Execution:** All commands must support both **Interactive** (prompts) and **Flag-based** (CI/CD) modes.
