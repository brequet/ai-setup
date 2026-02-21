import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FIXTURES_DIR = path.join(__dirname, '../fixtures');

export function getFixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}
