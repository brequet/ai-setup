import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { logger } from '../utils/logger.js';

/**
 * Discovered skill information from filesystem
 */
export interface DiscoveredSkill {
  name: string;
  description: string;
  tags: string[];
  sourcePath: string;
  folderName: string;
}

/**
 * SKILL.md frontmatter schema
 */
export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: {
    tags?: string;
  };
}

/**
 * Parse SKILL.md frontmatter
 */
function parseSkillFrontmatter(skillPath: string): SkillFrontmatter | null {
  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
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

/**
 * Discover skills from a catalog directory by scanning the filesystem
 * No catalog.json required - just scans skills/ directory
 */
export function discoverSkills(catalogPath: string): Map<string, DiscoveredSkill> {
  const skills = new Map<string, DiscoveredSkill>();
  const skillsDir = path.join(catalogPath, 'skills');

  if (!fs.existsSync(skillsDir)) {
    logger.debug(`No skills directory found in ${catalogPath}`);
    return skills;
  }

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');

      if (!fs.existsSync(skillPath)) {
        logger.debug(`No SKILL.md found in ${entry.name}, skipping`);
        continue;
      }

      const frontmatter = parseSkillFrontmatter(skillPath);
      if (!frontmatter) {
        continue;
      }

      // Parse tags from metadata
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

/**
 * Extract catalog ID from path or URL
 * - Local: C:\dev\projects\test-catalog → test-catalog
 * - Git: https://github.com/brequet/bre-ia-catalog → brequet/bre-ia-catalog
 */
export function extractCatalogId(pathOrUrl: string): string {
  // Check if it's a git URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    // Extract owner/repo from URL
    // https://github.com/brequet/bre-ia-catalog → brequet/bre-ia-catalog
    const match = pathOrUrl.match(/github\.com\/([^/]+\/[^/]+?)(\.git)?$/);
    if (match) {
      return match[1];
    }

    // Fallback: use last part of URL
    return path.basename(pathOrUrl, '.git');
  }

  // Local path: use folder name
  return path.basename(pathOrUrl);
}

/**
 * Sanitize catalog ID for use in filesystem paths
 * brequet/bre-ia-catalog → brequet-bre-ia-catalog
 */
export function sanitizeCatalogId(catalogId: string): string {
  return catalogId.replace(/\//g, '-').replace(/\\/g, '-');
}
