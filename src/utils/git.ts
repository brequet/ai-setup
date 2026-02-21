import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { getCatalogCachePath, getCatalogCacheDir, ensureDirAsync } from './paths.js';
import { logger } from './logger.js';
import { DEFAULT_GIT_BRANCH, GIT_CLONE_DEPTH } from './constants.js';

const execAsync = promisify(exec);

export interface GitOperationResult {
  success: boolean;
  error?: string;
}

export function isGitUrl(input: string): boolean {
  const gitUrlPatterns = [/^https?:\/\//i, /^git:\/\//i, /^git@/i, /^ssh:\/\//i];
  return gitUrlPatterns.some((pattern) => pattern.test(input));
}

export async function checkGitAvailable(): Promise<boolean> {
  try {
    await execAsync('git --version');
    return true;
  } catch {
    return false;
  }
}

export async function cloneOrPullCatalog(
  catalogId: string,
  url: string,
  branch: string = DEFAULT_GIT_BRANCH,
): Promise<GitOperationResult> {
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
    if (existsSync(cachePath)) {
      logger.debug(`Pulling updates for ${catalogId} from ${branch}...`);

      try {
        await execAsync(`git fetch origin ${branch}`, { cwd: cachePath });
        await execAsync(`git reset --hard origin/${branch}`, { cwd: cachePath });
        logger.debug(`Successfully pulled ${catalogId}`);
      } catch (pullError) {
        logger.debug(`Pull failed, attempting to re-clone: ${(pullError as Error).message}`);
        await rm(cachePath, { recursive: true, force: true });
        return await cloneRepository(catalogId, url, branch, cachePath);
      }
    } else {
      return await cloneRepository(catalogId, url, branch, cachePath);
    }

    return { success: true };
  } catch (error) {
    return handleGitError(error as Error);
  }
}

async function cloneRepository(
  catalogId: string,
  url: string,
  branch: string,
  cachePath: string,
): Promise<GitOperationResult> {
  logger.debug(`Cloning ${catalogId} from ${url} (branch: ${branch})...`);

  try {
    await ensureDirAsync(getCatalogCacheDir());
    await execAsync(`git clone --depth ${GIT_CLONE_DEPTH} --branch ${branch} ${url} ${cachePath}`);
    logger.debug(`Successfully cloned ${catalogId}`);
    return { success: true };
  } catch (error) {
    return handleGitError(error as Error);
  }
}

function handleGitError(error: Error): GitOperationResult {
  const errorMsg = error.message.toLowerCase();

  if (
    errorMsg.includes('not found') ||
    (errorMsg.includes('repository') && errorMsg.includes('does not exist'))
  ) {
    return {
      success: false,
      error: 'Repository not found. Check the URL and ensure the repository exists.',
    };
  }

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

  if (errorMsg.includes('branch') || errorMsg.includes('reference')) {
    return {
      success: false,
      error: 'Branch not found. Check the branch name or try with --branch main',
    };
  }

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

  const firstLine = error.message.split('\n')[0];
  return {
    success: false,
    error: `Git operation failed: ${firstLine}`,
  };
}

export async function getCurrentCommitHash(catalogPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git rev-parse HEAD', { cwd: catalogPath });
    return stdout.trim();
  } catch (error) {
    logger.debug(`Failed to get commit hash: ${(error as Error).message}`);
    return null;
  }
}

export async function getCurrentBranch(catalogPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: catalogPath });
    return stdout.trim();
  } catch (error) {
    logger.debug(`Failed to get branch name: ${(error as Error).message}`);
    return null;
  }
}
