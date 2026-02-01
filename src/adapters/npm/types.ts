/**
 * NPM Package Adapter Types
 * Type definitions for NPM package export
 */

/**
 * NPM Package Configuration
 */
export interface NPMPackageConfig {
  /**
   * Package name (must follow npm naming rules)
   */
  name: string;

  /**
   * Package version (semver)
   */
  version: string;

  /**
   * Package description
   */
  description: string;

  /**
   * Main entry point
   */
  main: string;

  /**
   * TypeScript types entry point
   */
  types: string;

  /**
   * Package keywords
   */
  keywords: string[];

  /**
   * License
   */
  license: string;

  /**
   * Repository URL
   */
  repository?: string;

  /**
   * Author information
   */
  author?: string;

  /**
   * Homepage URL
   */
  homepage?: string;

  /**
   * Bugs URL
   */
  bugs?: string;

  /**
   * Files to include in package
   */
  files: string[];

  /**
   * Peer dependencies
   */
  peerDependencies: Record<string, string>;

  /**
   * Dependencies
   */
  dependencies?: Record<string, string>;

  /**
   * Package metadata from OSSA manifest
   */
  ossaMetadata: {
    apiVersion: string;
    kind: string;
    originalName: string;
  };
}

/**
 * Agent export metadata
 */
export interface AgentExportMetadata {
  /**
   * Agent name
   */
  name: string;

  /**
   * Agent version
   */
  version: string;

  /**
   * Agent description
   */
  description: string;

  /**
   * Agent role/system prompt
   */
  role: string;

  /**
   * Agent capabilities
   */
  capabilities?: string[];

  /**
   * Agent tools
   */
  tools?: Array<{
    name: string;
    description: string;
    type?: string;
  }>;

  /**
   * LLM configuration
   */
  llm?: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}
