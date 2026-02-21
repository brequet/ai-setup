import path from 'node:path';
import matter from 'gray-matter';
import { logger } from '../utils/logger.js';
import { existsSync, readFileAsync, readdirAsync } from '../utils/fs-async.js';

export interface DiscoveredSkill {
  name: string;
  description: string;
  tags: string[];
  sourcePath: string;
  folderName: string;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: {
    tags?: string;
  };
}

async function parseSkillFrontmatter(skillPath: string): Promise<SkillFrontmatter | null> {
  try {
    const content = await readFileAsync(skillPath);
    const { data } = matter(content);

    if (!data.name || !data.description) {
      logger.warn(`Invalid SKILL.md frontmatter in ${skillPath}: missing name or description`);
      return null;
    }

    return data as SkillFrontmatter;
  } catch (error) {
    logger.warn(`Failed to parse SKILL.md frontmatter: ${(error as Error).message}`);
    return null;
  }
}

export async function discoverSkills(catalogPath: string): Promise<Map<string, DiscoveredSkill>> {
  const skills = new Map<string, DiscoveredSkill>();
  const skillsDir = path.join(catalogPath, 'skills');

  if (!existsSync(skillsDir)) {
    logger.debug(`No skills directory found in ${catalogPath}`);
    return skills;
  }

  try {
    const entries = await readdirAsync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');

      if (!existsSync(skillPath)) {
        logger.debug(`No SKILL.md found in ${entry.name}, skipping`);
        continue;
      }

      const frontmatter = await parseSkillFrontmatter(skillPath);
      if (!frontmatter) {
        continue;
      }

      const tags = frontmatter.metadata?.tags
        ? frontmatter.metadata.tags.split(',').map((t) => t.trim())
        : [];

      skills.set(frontmatter.name, {
        name: frontmatter.name,
        description: frontmatter.description,
        tags,
        sourcePath: skillPath,
        folderName: entry.name,
      });

      logger.debug(`Discovered skill: ${frontmatter.name} from ${entry.name}`);
    }
  } catch (error) {
    logger.warn(`Failed to discover skills in ${catalogPath}: ${(error as Error).message}`);
  }

  return skills;
}

export function extractCatalogId(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    const match = pathOrUrl.match(/github\.com\/([^/]+\/[^/]+?)(\.git)?$/);
    if (match) {
      return match[1];
    }
    return path.basename(pathOrUrl, '.git');
  }

  return path.basename(pathOrUrl);
}

export function sanitizeCatalogIdForPath(catalogId: string): string {
  return catalogId.replace(/\//g, '-').replace(/\\/g, '-');
}
