import crypto from 'node:crypto';
import fs from 'node:fs';

/**
 * Compute SHA-256 hash of a file
 */
export function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}
