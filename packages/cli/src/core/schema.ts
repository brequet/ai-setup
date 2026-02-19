import { z } from 'zod';

/**
 * Skill metadata schema
 */
export const SkillSchema = z.object({
  hash: z.string().startsWith('sha256:'),
  path: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (x.y.z)'),
});

/**
 * MCP Server schema
 */
export const MCPServerSchema = z.object({
  type: z.enum(['nodePackage', 'docker', 'binary']),
  package: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

/**
 * Copilot Template schema
 */
export const CopilotTemplateSchema = z.object({
  path: z.string(),
  description: z.string(),
});

/**
 * Main catalog schema
 */
export const CatalogSchema = z.object({
  name: z.string(),
  id: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (x.y.z)'),
  gitUrl: z.string().url().optional(),
  opencodeVersion: z.string(),
  skills: z.record(z.string(), SkillSchema).optional().default({}),
  mcpServers: z.record(z.string(), MCPServerSchema).optional(),
  copilotTemplates: z.record(z.string(), CopilotTemplateSchema).optional(),
});

export type Skill = z.infer<typeof SkillSchema>;
export type MCPServer = z.infer<typeof MCPServerSchema>;
export type CopilotTemplate = z.infer<typeof CopilotTemplateSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;
