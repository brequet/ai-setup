import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
  rm,
  access,
  rename,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { FileSystemError } from './errors.js';

export { existsSync };

export async function readFileAsync(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to read file: ${path} - ${message}`);
  }
}

export async function writeFileAsync(path: string, content: string): Promise<void> {
  try {
    await writeFile(path, content, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to write file: ${path} - ${message}`);
  }
}

/**
 * Atomically writes content to a file using a temporary file and rename.
 * This prevents corruption if the process crashes or is interrupted during write.
 *
 * @param path - The target file path
 * @param content - The content to write
 * @throws {FileSystemError} If the write or rename operation fails
 */
export async function writeFileAtomicAsync(path: string, content: string): Promise<void> {
  const tmpPath = `${path}.tmp`;

  try {
    // Write to temporary file first
    await writeFile(tmpPath, content, 'utf-8');

    // Atomically rename temp file to target (atomic operation on most systems)
    await rename(tmpPath, path);
  } catch (err) {
    // Clean up temp file if it exists
    try {
      await rm(tmpPath, { force: true });
    } catch {
      // Ignore cleanup errors
    }

    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to atomically write file: ${path} - ${message}`);
  }
}

export async function ensureDirAsync(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to create directory: ${path} - ${message}`);
  }
}

export async function copyFileAsync(src: string, dest: string): Promise<void> {
  try {
    await copyFile(src, dest);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to copy file: ${src} -> ${dest} - ${message}`);
  }
}

export async function readdirAsync(
  path: string,
  _options?: { withFileTypes: true },
): Promise<Dirent[]> {
  try {
    return (await readdir(path, { withFileTypes: true })) as Dirent[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to read directory: ${path} - ${message}`);
  }
}

export async function removeAsync(path: string): Promise<void> {
  try {
    await rm(path, { recursive: true, force: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FileSystemError(`Failed to remove: ${path} - ${message}`);
  }
}

export async function pathExistsAsync(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
