import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import { getCatalogCachePath, getCatalogCacheDir, ensureDir } from './paths.js';
import { logger } from './logger.js';

const execAsync = promisify(exec);

/**
 * Result of a Git operation
 */
export interface GitOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Check if input string is a Git URL
 * Supports: http://, https://, git://, git@
 */
export function isGitUrl(input: string): boolean {
  const gitUrlPatterns = [
    /^https?:\/\//i, // http:// or https://
    /^git:\/\//i, // git://
    /^git@/i, // git@github.com:...
    /^ssh:\/\//i, // ssh://
  ];

  return gitUrlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if Git is installed and available
 */
export async function checkGitAvailable(): Promise<boolean> {
  try {
    await execAsync('git --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Clone or pull a Git catalog repository
 * - Uses shallow clone (--depth 1) for efficiency
 * - Force pulls to always match remote (even after rebase)
 * - Gracefully handles errors with detailed messages
 */
export async function cloneOrPullCatalog(
  catalogId: string,
  url: string,
  branch: string = 'main',
): Promise<GitOperationResult> {
  // Check if git is available
  const gitAvailable = await checkGitAvailable();
  if (!gitAvailable) {
    return {
      success: false,
      error:
        'Git not installed. Please install Git to use Git-based catalogs.\n' +
        'Download from: https://git-scm.com/downloads',
    };
  }

  const cachePath = getCatalogCachePath(catalogId);
  logger.debug(`Git operation for ${catalogId} at ${cachePath}`);

  try {
    if (fs.existsSync(cachePath)) {
      // Repository exists - force pull updates
      logger.debug(`Pulling updates for ${catalogId} from ${branch}...`);

      try {
        // Fetch latest changes
        await execAsync(`git fetch origin ${branch}`, { cwd: cachePath });

        // Force reset to remote branch (always trust remote)
        await execAsync(`git reset --hard origin/${branch}`, { cwd: cachePath });

        logger.debug(`Successfully pulled ${catalogId}`);
      } catch (pullError) {
        // If pull fails, try to recover by re-cloning
        logger.debug(`Pull failed, attempting to re-clone: ${(pullError as Error).message}`);

        // Remove corrupted cache
        fs.rmSync(cachePath, { recursive: true, force: true });

        // Re-clone (fall through to clone logic below)
        return await cloneRepository(catalogId, url, branch, cachePath);
      }
    } else {
      // Repository doesn't exist - clone it
      return await cloneRepository(catalogId, url, branch, cachePath);
    }

    return { success: true };
  } catch (error) {
    return handleGitError(error as Error);
  }
}

/**
 * Clone a repository with shallow clone
 */
async function cloneRepository(
  catalogId: string,
  url: string,
  branch: string,
  cachePath: string,
): Promise<GitOperationResult> {
  logger.debug(`Cloning ${catalogId} from ${url} (branch: ${branch})...`);

  try {
    // Ensure cache directory exists
    ensureDir(getCatalogCacheDir());

    // Shallow clone (--depth 1) for efficiency
    await execAsync(`git clone --depth 1 --branch ${branch} ${url} ${cachePath}`);

    logger.debug(`Successfully cloned ${catalogId}`);
    return { success: true };
  } catch (error) {
    return handleGitError(error as Error);
  }
}

/**
 * Handle Git errors with user-friendly messages
 */
function handleGitError(error: Error): GitOperationResult {
  const errorMsg = error.message.toLowerCase();

  // Repository not found (404)
  if (
    errorMsg.includes('not found') ||
    (errorMsg.includes('repository') && errorMsg.includes('does not exist'))
  ) {
    return {
      success: false,
      error: 'Repository not found. Check the URL and ensure the repository exists.',
    };
  }

  // Authentication/permission issues
  if (
    errorMsg.includes('authentication') ||
    errorMsg.includes('permission') ||
    errorMsg.includes('access denied')
  ) {
    return {
      success: false,
      error:
        'Authentication required. Ensure you have access to this repository.\n' +
        'For private repos, set up SSH keys or use a personal access token.',
    };
  }

  // Branch not found
  if (errorMsg.includes('branch') || errorMsg.includes('reference')) {
    return {
      success: false,
      error: 'Branch not found. Check the branch name or try with --branch main',
    };
  }

  // Network errors
  if (
    errorMsg.includes('network') ||
    errorMsg.includes('connection') ||
    errorMsg.includes('timeout')
  ) {
    return {
      success: false,
      error: 'Network connection failed. Check your internet connection and try again.',
    };
  }

  // Generic git error
  const firstLine = error.message.split('\n')[0];
  return {
    success: false,
    error: `Git operation failed: ${firstLine}`,
  };
}

/**
 * Get the current commit hash from a Git repository
 */
export async function getCurrentCommitHash(catalogPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git rev-parse HEAD', { cwd: catalogPath });
    return stdout.trim();
  } catch (error) {
    logger.debug(`Failed to get commit hash: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Get the current branch name from a Git repository
 */
export async function getCurrentBranch(catalogPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: catalogPath });
    return stdout.trim();
  } catch (error) {
    logger.debug(`Failed to get branch name: ${(error as Error).message}`);
    return null;
  }
}
