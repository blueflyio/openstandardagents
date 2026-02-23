/**
 * OSSA Skill Manifest Types
 * Type definitions for skill.ossa.yaml manifests
 */

export interface OssaSkill {
  apiVersion: string;
  kind: 'Skill';
  metadata: SkillMetadata;
  spec: SkillSpec;
  extensions?: Record<string, unknown>;
}

export interface SkillMetadata {
  name: string;
  version?: string;
  description?: string;
  did?: string;
  author?: SkillAuthor;
  license?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  created?: string;
  updated?: string;
}

export interface SkillAuthor {
  name?: string;
  did?: string;
  email?: string;
  url?: string;
  vc?: string;
}

export interface SkillSpec {
  description: string;
  instructions?: string;
  instructionsFile?: string;
  categories?: string[];
  platforms?: string[];
  allowedTools?: string[];
  runtimes?: Record<string, string>;
  dependencies?: SkillDependencies;
  trust?: SkillTrust;
  governance?: SkillGovernance;
  compliance?: string[];
  resources?: SkillResource[];
  scripts?: SkillScript[];
  tests?: SkillTest[];
}

export interface SkillDependencies {
  skills?: Array<{
    did?: string;
    name?: string;
    version?: string;
    required?: boolean;
  }>;
  mcp?: Array<{
    uri?: string;
    name?: string;
    required?: boolean;
  }>;
  tools?: Array<{
    name: string;
    type?: 'cli' | 'api' | 'mcp-tool' | 'library';
    version?: string;
    required?: boolean;
  }>;
}

export interface SkillTrust {
  attestation?: string;
  testsPassed?: string;
  coverage?: string;
  lastAudit?: string;
  signatures?: Array<{
    signer: string;
    algorithm: string;
    value: string;
    timestamp?: string;
  }>;
}

export interface SkillGovernance {
  approvalRequired?: boolean;
  maxAutonomy?: number;
  dataAccess?: {
    filesystem?: 'none' | 'read-only' | 'read-write' | 'scoped';
    network?: 'none' | 'allowlist' | 'full';
    secrets?: 'none' | 'read-only' | 'read-write';
  };
  prohibitedActions?: string[];
  revocation?: {
    revoked?: boolean;
    reason?: string;
    revokedAt?: string;
    revokedBy?: string;
  };
}

export interface SkillResource {
  path: string;
  description?: string;
}

export interface SkillScript {
  path: string;
  description?: string;
  when?: string;
}

export interface SkillTest {
  prompt: string;
  expectedBehavior: string;
  assertions?: string[];
}

/**
 * Type guard for OssaSkill
 */
export function isOssaSkill(obj: unknown): obj is OssaSkill {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return o.kind === 'Skill' && typeof o.apiVersion === 'string' && o.metadata != null && o.spec != null;
}

/**
 * Create a minimal OssaSkill manifest
 */
export function createSkillManifest(
  name: string,
  description: string,
  instructions?: string,
): OssaSkill {
  return {
    apiVersion: 'ossa/v1',
    kind: 'Skill',
    metadata: {
      name,
      version: '1.0.0',
      description,
    },
    spec: {
      description,
      ...(instructions ? { instructions } : {}),
    },
  };
}
