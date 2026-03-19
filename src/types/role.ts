/**
 * OSSA Role Manifest Types
 * Type definitions for role.ossa.yaml manifests (kind: Role)
 *
 * Roles define behavioral overlays for IDE/CLI agents (Claude Code, Cursor, etc.)
 * Unlike Agents (autonomous loops), Roles configure operator context — instructions,
 * tool access, hooks, MCP connections, and activation conditions.
 */

export interface OssaRole {
  apiVersion: string;
  kind: 'Role';
  metadata: RoleMetadata;
  spec: RoleSpec;
  extensions?: Record<string, unknown>;
}

export interface RoleMetadata {
  /** DNS-style role name (lowercase, hyphens) */
  name: string;
  /** Semantic version */
  version?: string;
  /** Human-readable description */
  description?: string;
  /** Key-value labels for filtering and categorization */
  labels?: Record<string, string>;
  /** Non-identifying metadata */
  annotations?: Record<string, string>;
}

export interface RoleSpec {
  /** System prompt / persona definition */
  role?: string;
  /** Behavioral instructions */
  instructions?: RoleInstructions;
  /** Tool access configuration */
  tools?: RoleTools;
  /** Lifecycle hooks */
  hooks?: RoleHooks;
  /** Context injection */
  context?: RoleContext;
  /** Protocol connections */
  protocols?: RoleProtocols;
  /** Role composition — inherit from other roles */
  extends?: RoleExtension[];
  /** Activation conditions */
  activation?: RoleActivation;
}

export interface RoleInstructions {
  /** Markdown content prepended to every conversation */
  preamble?: string;
  /** Hard rules — MUST/MUST NOT statements */
  constraints?: string[];
}

export interface RoleTools {
  /** Whitelist of allowed tool names */
  allowed?: string[];
  /** Blacklist of denied tool names (overrides allowed) */
  denied?: string[];
  /** References to OSSA Skill manifests */
  skills?: string[];
}

export interface RoleHooks {
  /** Run when role is activated */
  on_activate?: string;
  /** Run when switching away from this role */
  on_deactivate?: string;
  /** Run before git commits */
  pre_commit?: string;
  /** Run after file saves */
  post_save?: string;
}

export interface RoleContext {
  /** Paths to JSON Schema or OpenAPI spec files */
  schemas?: string[];
  /** Files to include in agent context */
  files?: RoleContextFile[];
  /** Paths to knowledge base documents */
  knowledge?: string[];
}

export interface RoleContextFile {
  /** File path or glob pattern */
  path: string;
  /** Description of what this file provides */
  description?: string;
}

export interface RoleProtocols {
  /** MCP server connections */
  mcp?: RoleMCPConfig;
}

export interface RoleMCPConfig {
  /** MCP servers available when this role is active */
  servers?: RoleMCPServer[];
}

export interface RoleMCPServer {
  /** Server identifier */
  name: string;
  /** Transport type */
  transport: 'stdio' | 'sse';
  /** Command to spawn (stdio transport) */
  command?: string;
  /** Command arguments (stdio transport) */
  args?: string[];
  /** Endpoint URL (SSE transport) */
  url?: string;
}

export interface RoleExtension {
  /** Name of the parent role to inherit from */
  role: string;
  /** If true, child fields replace parent fields; if false, they merge */
  override?: boolean;
}

export interface RoleActivation {
  /** Glob patterns — activate when matching files are open */
  file_patterns?: string[];
  /** CLI command to activate (e.g., "/role drupal") */
  command?: string;
  /** Environment variable conditions (all must match) */
  env?: Record<string, string>;
}

/**
 * Type guard for OssaRole
 */
export function isOssaRole(obj: unknown): obj is OssaRole {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    o.kind === 'Role' &&
    typeof o.apiVersion === 'string' &&
    o.metadata != null &&
    o.spec != null
  );
}

/**
 * Create a minimal OssaRole manifest
 */
export function createRoleManifest(
  name: string,
  description: string,
  role?: string
): OssaRole {
  return {
    apiVersion: 'ossa/v0.5',
    kind: 'Role',
    metadata: {
      name,
      version: '1.0.0',
      description,
    },
    spec: {
      ...(role ? { role } : {}),
    },
  };
}
