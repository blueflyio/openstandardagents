/**
 * OSSA Runtime Manifest Loader
 * Loads and validates agent manifests from files or objects
 */

import { readFile } from 'fs/promises';
import { parse as parseYaml } from 'yaml';
import type { AgentManifest, ManifestLoader as IManifestLoader } from './types.js';

/**
 * Default manifest loader implementation
 */
export class ManifestLoader implements IManifestLoader {
  /**
   * Load manifest from a file path
   * Supports both YAML and JSON formats
   */
  async loadFromFile(path: string): Promise<AgentManifest> {
    try {
      const content = await readFile(path, 'utf-8');

      // Determine format based on file extension
      if (path.endsWith('.yaml') || path.endsWith('.yml')) {
        return this.loadFromObject(parseYaml(content));
      } else if (path.endsWith('.json')) {
        return this.loadFromObject(JSON.parse(content));
      } else {
        // Try YAML first, then JSON
        try {
          return this.loadFromObject(parseYaml(content));
        } catch {
          try {
            return this.loadFromObject(JSON.parse(content));
          } catch {
            throw new Error(`Failed to parse manifest as YAML or JSON`);
          }
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to load manifest from ${path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load manifest from an object
   */
  async loadFromObject(manifest: unknown): Promise<AgentManifest> {
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Manifest must be an object');
    }

    const typedManifest = manifest as AgentManifest;

    // Validate manifest structure
    await this.validate(typedManifest);

    return typedManifest;
  }

  /**
   * Validate manifest structure
   */
  async validate(manifest: AgentManifest): Promise<boolean> {
    // Check if it's k8s-style or legacy format
    const isK8sStyle = manifest.apiVersion && manifest.kind;
    const isLegacy = manifest.ossaVersion && manifest.agent;

    if (!isK8sStyle && !isLegacy) {
      throw new Error(
        'Manifest must be either k8s-style (apiVersion/kind) or legacy (ossaVersion/agent) format'
      );
    }

    // Validate k8s-style format
    if (isK8sStyle) {
      if (!manifest.metadata?.name) {
        throw new Error('K8s-style manifest must have metadata.name');
      }

      if (!manifest.spec?.role) {
        throw new Error('K8s-style manifest must have spec.role');
      }
    }

    // Validate legacy format
    if (isLegacy) {
      if (!manifest.agent?.id) {
        throw new Error('Legacy manifest must have agent.id');
      }

      if (!manifest.agent?.name) {
        throw new Error('Legacy manifest must have agent.name');
      }

      if (!manifest.agent?.role) {
        throw new Error('Legacy manifest must have agent.role');
      }

      if (!manifest.agent?.runtime?.type) {
        throw new Error('Legacy manifest must have agent.runtime.type');
      }
    }

    return true;
  }

  /**
   * Get agent ID from manifest
   */
  getAgentId(manifest: AgentManifest): string {
    if (manifest.metadata?.name) {
      return manifest.metadata.name;
    }

    if (manifest.agent?.id) {
      return manifest.agent.id;
    }

    throw new Error('Cannot determine agent ID from manifest');
  }

  /**
   * Get agent role from manifest
   */
  getAgentRole(manifest: AgentManifest): string {
    if (manifest.spec?.role) {
      return manifest.spec.role;
    }

    if (manifest.agent?.role) {
      return manifest.agent.role;
    }

    throw new Error('Cannot determine agent role from manifest');
  }

  /**
   * Get agent capabilities from manifest
   */
  getCapabilities(manifest: AgentManifest): Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown> | string;
    output_schema: Record<string, unknown> | string;
  }> {
    // Legacy format has capabilities directly
    if (manifest.agent?.capabilities) {
      return manifest.agent.capabilities;
    }

    // K8s-style format may have capabilities in tools or other locations
    // For now, return empty array if not found
    return [];
  }

  /**
   * Normalize manifest to standard format
   */
  normalize(manifest: AgentManifest): AgentManifest {
    // If already in k8s-style, return as-is
    if (manifest.apiVersion && manifest.kind && manifest.metadata) {
      return manifest;
    }

    // Convert legacy to k8s-style
    if (manifest.agent) {
      const legacyLlm = manifest.agent.llm;
      return {
        apiVersion: manifest.ossaVersion || 'v0.3.0',
        kind: 'Agent',
        metadata: {
          name: manifest.agent.id,
          version: manifest.agent.version,
          description: manifest.agent.description,
        },
        spec: {
          role: manifest.agent.role,
          llm:
            legacyLlm?.provider && legacyLlm?.model
              ? {
                  provider: legacyLlm.provider,
                  model: legacyLlm.model,
                  temperature: legacyLlm.temperature,
                  maxTokens: legacyLlm.maxTokens,
                }
              : undefined,
        },
      };
    }

    return manifest;
  }
}

/**
 * Create a new manifest loader instance
 */
export function createManifestLoader(): ManifestLoader {
  return new ManifestLoader();
}
