/**
 * Agent Card Generator
 *
 * Converts OSSA agent manifests into Google A2A-compatible
 * .well-known/agent-card.json files for agent discovery.
 *
 * Maps OSSA manifest fields → AgentCard interface (src/mesh/types.ts:146-181).
 */

import type { OssaAgent } from '../types/index.js';
import type {
  AgentCard,
  ToolDescriptor,
  Transport,
  AuthMethod,
  EncryptionSpec,
} from '../mesh/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpec = Record<string, any>;

export interface AgentCardGeneratorOptions {
  /** Override the agent URI (default: agent://{namespace}/{name}) */
  uri?: string;
  /** Namespace for the agent URI (default: 'default') */
  namespace?: string;
  /** Override endpoints */
  endpoints?: { http?: string; grpc?: string; websocket?: string };
  /** Set agent status */
  status?: 'healthy' | 'degraded' | 'unavailable';
}

export interface AgentCardResult {
  success: boolean;
  card?: AgentCard;
  json?: string;
  errors: string[];
  warnings: string[];
}

export class AgentCardGenerator {
  /**
   * Generate an AgentCard from an OSSA manifest.
   */
  generate(
    manifest: OssaAgent,
    options?: AgentCardGeneratorOptions
  ): AgentCardResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate minimum required fields
    if (!manifest.metadata?.name) {
      errors.push('manifest.metadata.name is required');
    }
    if (!manifest.apiVersion) {
      errors.push('manifest.apiVersion is required');
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    const name = manifest.metadata!.name;
    const version = manifest.metadata?.version || '1.0.0';
    const namespace = options?.namespace || 'default';
    const uri = options?.uri || `agent://${namespace}/${name}`;

    // Extract capabilities from labels + tags
    const capabilities = this.extractCapabilities(manifest);
    if (capabilities.length === 0) {
      warnings.push(
        'No capabilities found — set metadata.labels.capability or metadata.tags'
      );
    }

    // Extract tools
    const tools = this.extractTools(manifest);

    // Extract endpoints from A2A extension or options
    const endpoints = this.extractEndpoints(manifest, options);
    if (!endpoints.http && !endpoints.grpc && !endpoints.websocket) {
      warnings.push(
        'No endpoints defined — set extensions.a2a.endpoints or pass via options'
      );
    }

    // Extract transport types
    const transport = this.extractTransport(endpoints);

    // Extract authentication methods
    const authentication = this.extractAuthentication(manifest);

    // Extract encryption config
    const encryption = this.extractEncryption(manifest);

    // Build metadata from labels
    const metadata = this.extractMetadata(manifest);

    const card: AgentCard = {
      uri,
      name,
      version,
      ossaVersion: manifest.apiVersion || 'ossa/v0.4',
      capabilities,
      ...(tools.length > 0 ? { tools } : {}),
      ...(manifest.spec?.role ? { role: manifest.spec.role } : {}),
      endpoints,
      transport,
      authentication,
      encryption,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      ...(options?.status ? { status: options.status } : {}),
    };

    const json = JSON.stringify(card, null, 2);

    return { success: true, card, json, errors: [], warnings };
  }

  private extractCapabilities(manifest: OssaAgent): string[] {
    const caps: string[] = [];

    // From metadata.labels.capability (comma-separated)
    const capLabel = manifest.metadata?.labels?.capability;
    if (capLabel) {
      caps.push(...capLabel.split(',').map((c) => c.trim()));
    }

    // From metadata.tags
    if (manifest.metadata?.tags) {
      for (const tag of manifest.metadata.tags) {
        if (!caps.includes(tag)) {
          caps.push(tag);
        }
      }
    }

    // From spec.capabilities
    const specCaps = manifest.spec?.capabilities;
    if (specCaps) {
      for (const cap of specCaps) {
        const capName = typeof cap === 'string' ? cap : cap.id;
        if (capName && !caps.includes(capName)) {
          caps.push(capName);
        }
      }
    }

    return caps;
  }

  private extractTools(manifest: OssaAgent): ToolDescriptor[] {
    const specTools = manifest.spec?.tools || [];
    return specTools
      .filter((t) => t.name)
      .map((t) => ({
        name: t.name!,
        description: t.description || t.name!,
        inputSchema: (t.inputSchema && typeof t.inputSchema === 'object'
          ? t.inputSchema
          : { type: 'object', properties: {} }) as ToolDescriptor['inputSchema'],
        ...(t.outputSchema && typeof t.outputSchema === 'object'
          ? { outputSchema: t.outputSchema as ToolDescriptor['outputSchema'] }
          : {}),
      }));
  }

  private extractEndpoints(
    manifest: OssaAgent,
    options?: AgentCardGeneratorOptions
  ): AgentCard['endpoints'] {
    if (options?.endpoints) {
      return options.endpoints;
    }

    // From extensions.a2a
    const ext = (manifest.extensions ?? {}) as AnySpec;
    const a2a = ext.a2a ?? {};
    const a2aEndpoints = a2a.endpoints ?? {};

    return {
      ...(a2aEndpoints.http ? { http: a2aEndpoints.http } : {}),
      ...(a2aEndpoints.grpc ? { grpc: a2aEndpoints.grpc } : {}),
      ...(a2aEndpoints.websocket ? { websocket: a2aEndpoints.websocket } : {}),
    };
  }

  private extractTransport(endpoints: AgentCard['endpoints']): Transport[] {
    const transports: Transport[] = [];
    if (endpoints.http) transports.push('http');
    if (endpoints.grpc) transports.push('grpc');
    if (endpoints.websocket) transports.push('websocket');
    // Default to http if no endpoints specified
    if (transports.length === 0) transports.push('http');
    return transports;
  }

  private extractAuthentication(manifest: OssaAgent): AuthMethod[] {
    const ext = (manifest.extensions ?? {}) as AnySpec;
    const a2a = ext.a2a ?? {};

    if (a2a.authentication) {
      const auth = a2a.authentication;
      if (Array.isArray(auth)) {
        return auth as AuthMethod[];
      }
      if (typeof auth === 'string') {
        return [auth as AuthMethod];
      }
      if (auth.methods) {
        return auth.methods as AuthMethod[];
      }
    }

    // Default: bearer token auth
    return ['bearer'];
  }

  private extractEncryption(manifest: OssaAgent): EncryptionSpec {
    const ext = (manifest.extensions ?? {}) as AnySpec;
    const a2a = ext.a2a ?? {};

    if (a2a.encryption) {
      return {
        tlsRequired: a2a.encryption.tlsRequired ?? true,
        minTlsVersion: a2a.encryption.minTlsVersion ?? '1.2',
        ...(a2a.encryption.cipherSuites
          ? { cipherSuites: a2a.encryption.cipherSuites }
          : {}),
      };
    }

    // Sensible defaults
    return {
      tlsRequired: true,
      minTlsVersion: '1.2',
    };
  }

  private extractMetadata(
    manifest: OssaAgent
  ): NonNullable<AgentCard['metadata']> {
    const meta: Record<string, unknown> = {};

    // Copy labels (excluding 'capability' which is already in capabilities[])
    if (manifest.metadata?.labels) {
      for (const [key, value] of Object.entries(manifest.metadata.labels)) {
        if (key !== 'capability') {
          meta[key] = value;
        }
      }
    }

    // Add description
    if (manifest.metadata?.description) {
      meta.description = manifest.metadata.description;
    }

    // Add author
    if (manifest.metadata?.author) {
      meta.author = manifest.metadata.author;
    }

    // Add lifecycle info
    if (manifest.metadata?.lifecycle) {
      meta.lifecycle = manifest.metadata.lifecycle;
    }

    return meta;
  }
}
