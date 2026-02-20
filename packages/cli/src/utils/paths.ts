import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/**
 * Get the user's home directory
 */
export function getHomeDir(): string {
  return os.homedir();
}

/**
 * Get the AI Setup config directory path
 * Uses: ~/.config/ai-setup/
 */
export function getConfigDir(): string {
  return path.join(getHomeDir(), ".config", "ai-setup");
}

/**
 * Get the user config file path
 * Uses: ~/.config/ai-setup/config.json
 */
export function getUserConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

/**
 * Detect OpenCode skills directory (Windows-specific with fallbacks)
 * Priority order:
 * 1. %USERPROFILE%\.config\opencode\skills
 * 2. %APPDATA%\opencode\skills
 * 3. %LOCALAPPDATA%\opencode\skills
 *
 * Returns null if none exist
 */
export function detectOpenCodeSkillsPath(): string | null {
  const homeDir = getHomeDir();

  const candidates = [
    path.join(homeDir, ".config", "opencode", "skills"),
    path.join(
      process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
      "opencode",
      "skills",
    ),
    path.join(
      process.env.LOCALAPPDATA || path.join(homeDir, "AppData", "Local"),
      "opencode",
      "skills",
    ),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Get the default OpenCode skills path (first candidate)
 * This is where we'll install if directory doesn't exist yet
 */
export function getDefaultOpenCodeSkillsPath(): string {
  const homeDir = getHomeDir();
  return path.join(homeDir, ".config", "opencode", "skills");
}

/**
 * Get OpenCode skills path - detects existing or returns default
 */
export function getOpenCodeSkillsPath(): string {
  return detectOpenCodeSkillsPath() || getDefaultOpenCodeSkillsPath();
}

/**
 * Get the catalog cache directory path
 * Uses: ~/.config/ai-setup/.cache/
 */
export function getCatalogCacheDir(): string {
  return path.join(getConfigDir(), ".cache");
}

/**
 * Get the cache path for a specific catalog
 * Uses: ~/.config/ai-setup/.cache/<catalogId>/
 */
export function getCatalogCachePath(catalogId: string): string {
  return path.join(getCatalogCacheDir(), catalogId);
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
