/**
 * OSSA MCP Server Manifest Types
 * Type definitions for mcp.ossa.yaml manifests
 */

export interface OssaMCPServer {
  apiVersion: string;
  kind: 'MCPServer';
  metadata: MCPServerMetadata;
  spec: MCPServerSpec;
  extensions?: Record<string, unknown>;
}

export interface MCPServerMetadata {
  name: string;
  version?: string;
  description?: string;
  did?: string;
  author?: {
    name?: string;
    did?: string;
    email?: string;
    url?: string;
  };
  license?: string;
  labels?: Record<string, string>;
  created?: string;
  updated?: string;
}

export interface MCPServerSpec {
  description?: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  tools?: MCPToolDeclaration[];
  resources?: MCPResourceDeclaration[];
  prompts?: MCPPromptDeclaration[];
  platforms?: string[];
  governance?: {
    approvalRequired?: boolean;
    dataAccess?: {
      filesystem?: 'none' | 'read-only' | 'read-write' | 'scoped';
      network?: 'none' | 'allowlist' | 'full';
    };
    prohibitedActions?: string[];
  };
  trust?: {
    attestation?: string;
    lastAudit?: string;
    signatures?: Array<{
      signer: string;
      algorithm: string;
      value: string;
    }>;
  };
  compliance?: string[];
}

export interface MCPToolDeclaration {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface MCPResourceDeclaration {
  uri?: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPromptDeclaration {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

/**
 * Type guard for OssaMCPServer
 */
export function isOssaMCPServer(obj: unknown): obj is OssaMCPServer {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return o.kind === 'MCPServer' && typeof o.apiVersion === 'string' && o.metadata != null && o.spec != null;
}
