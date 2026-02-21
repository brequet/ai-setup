import crypto from 'node:crypto';
import { readFileAsync } from './fs-async.js';

export async function computeFileHash(filePath: string): Promise<string> {
  const content = await readFileAsync(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}
