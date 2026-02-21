import { readFile, writeFile, mkdir, copyFile, readdir, rm, access } from 'node:fs/promises';
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
