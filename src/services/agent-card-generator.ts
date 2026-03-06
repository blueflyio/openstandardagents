/**
 * Agent Card Generator
 *
 * Converts OSSA agent manifests into .well-known/agent-card.json for discovery,
 * Agent Social profile, marketplace profile, and global/GitLab registry.
 *
 * Every card attribute MUST come from the OSSA agent spec (metadata, spec, or
 * extensions). No inferred or synthetic fields. Mapping:
 * - uri, name, version, ossaVersion: metadata + apiVersion
 * - taxonomy: metadata.agentType, agentKind, agentArchitecture; spec.taxonomy
 * - capabilities, tools, role, model: spec + metadata.labels
 * - mcpServers, a2aProtocol, handoffs: extensions.mcp; extensions.a2a; spec.handoffs
 * - autonomy, constraints, observability, state, separation: spec.*
 * - endpoints, transport, authentication, encryption: extensions.a2a
 * - metadata (team, environment, region, description, author): metadata.*
 * - manifestRef, manifestDigest: options or metadata.manifest_ref, metadata.manifest_digest
 * - tokenEfficiencySummary: top-level token_efficiency
 */

import * as crypto from 'crypto';
import type { OssaAgent } from '../types/index.js';
import type {
  AgentCard,
  AgentTaxonomy,
  AgentModelInfo,
  McpServerDescriptor,
  A2AProtocolDescriptor,
  AgentHandoff,
  AgentAutonomy,
  AgentConstraints,
  AgentObservability,
  ToolDescriptor,
  Transport,
  AuthMethod,
  EncryptionSpec,
  AgentCardState,
  TokenEfficiencySummary,
  AgentCardSeparation,
} from '../mesh/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ManifestSection = Record<string, any>;

/**
 * Resolve a named extension block from an OSSA manifest.
 * OSSA manifests support extensions at both `spec.extensions` and top-level
 * `manifest.extensions`; the spec-level location takes precedence.
 */
function resolveExtensionBlock(
  manifest: OssaAgent,
  extensionName: string
): ManifestSection | undefined {
  const spec = manifest.spec as ManifestSection | undefined;
  return (
    spec?.extensions?.[extensionName] ??
    (manifest.extensions as ManifestSection)?.[extensionName]
  );
}

export interface AgentCardGeneratorOptions {
  /** Override the agent URI (default: uadp://{namespace}/{name}) */
  uri?: string;
  /** Namespace for the agent URI (default: 'default') */
  namespace?: string;
  /** Override endpoints */
  endpoints?: { http?: string; grpc?: string; websocket?: string };
  /** Set agent status */
  status?: 'healthy' | 'degraded' | 'unavailable';
  /** URL to full OSSA manifest (single source of truth) */
  manifestRef?: string;
  /** Content digest of manifest (e.g. SHA-256). If not set and manifestContent is provided, can be computed. */
  manifestDigest?: string;
  /** Raw manifest content for computing manifestDigest when manifestDigest not provided */
  manifestContent?: string;
  /** Card profile: minimal, discovery, or full */
  cardProfile?: 'minimal' | 'discovery' | 'full';
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
   * Extracts every feature the manifest declares — taxonomy, model, tools,
   * MCP servers, A2A protocol, handoffs, autonomy, constraints, observability.
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
    const uri = options?.uri || `uadp://${namespace}/${name}`;

    // Extract all features
    const taxonomy = this.extractTaxonomy(manifest);
    const capabilities = this.extractCapabilities(manifest, taxonomy);
    const tools = this.extractTools(manifest);
    const model = this.extractModel(manifest);
    const mcpServers = this.extractMcpServers(manifest);
    const a2aProtocol = this.extractA2AProtocol(manifest);
    const handoffs = this.extractHandoffs(manifest);
    const autonomy = this.extractAutonomy(manifest);
    const constraints = this.extractConstraints(manifest);
    const observability = this.extractObservability(manifest);
    const endpoints = this.extractEndpoints(manifest, options);
    const transport = this.extractTransport(endpoints);
    const authentication = this.extractAuthentication(manifest);
    const encryption = this.extractEncryption(manifest);
    const metadata = this.extractMetadata(manifest);
    const state = this.extractState(manifest);
    const tokenEfficiencySummary = this.extractTokenEfficiencySummary(manifest);
    const separation = this.extractSeparation(manifest);
    const metaManifest = manifest.metadata as ManifestSection | undefined;
    const manifestRef = options?.manifestRef ?? metaManifest?.manifest_ref;
    const manifestDigest =
      options?.manifestDigest ??
      metaManifest?.manifest_digest ??
      (options?.manifestContent
        ? this.computeManifestDigest(options.manifestContent)
        : undefined);

    // Warn on empty sections
    if (capabilities.length === 0) {
      warnings.push(
        'No capabilities found — set metadata.labels.capability, metadata.tags, or spec.capabilities'
      );
    }
    if (!endpoints.http && !endpoints.grpc && !endpoints.websocket) {
      warnings.push(
        'No endpoints defined — set extensions.a2a.endpoints or pass via options'
      );
    }

    const card: AgentCard = {
      uri,
      name,
      version,
      ossaVersion: manifest.apiVersion || 'ossa/v0.4',

      // Taxonomy — what kind of agent
      ...(taxonomy ? { taxonomy } : {}),

      // Capabilities & tools
      capabilities,
      ...(tools.length > 0 ? { tools } : {}),
      ...(manifest.spec?.role ? { role: manifest.spec.role } : {}),

      // Model
      ...(model ? { model } : {}),

      // MCP servers
      ...(mcpServers.length > 0 ? { mcpServers } : {}),

      // A2A protocol
      ...(a2aProtocol ? { a2aProtocol } : {}),

      // Handoffs
      ...(handoffs.length > 0 ? { handoffs } : {}),

      // Autonomy
      ...(autonomy ? { autonomy } : {}),

      // Constraints
      ...(constraints ? { constraints } : {}),

      // Observability
      ...(observability ? { observability } : {}),

      // Connectivity
      endpoints,
      transport,

      // Security
      authentication,
      encryption,

      // Metadata
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),

      // Health
      ...(options?.status ? { status: options.status } : {}),

      // State, token efficiency, separation (SoD: projected from OSSA manifest)
      ...(state ? { state } : {}),
      ...(tokenEfficiencySummary ? { tokenEfficiencySummary } : {}),
      ...(separation ? { separation } : {}),

      // Manifest reference and integrity (from spec metadata.manifest_ref, metadata.manifest_digest or options)
      ...(manifestRef ? { manifestRef } : {}),
      ...(manifestDigest ? { manifestDigest } : {}),

      // Card profile and extensions
      ...(options?.cardProfile ? { cardProfile: options.cardProfile } : {}),
    };

    const json = JSON.stringify(card, null, 2);

    return { success: true, card, json, errors: [], warnings };
  }

  // ─── Taxonomy ───────────────────────────────────────────────

  private extractTaxonomy(manifest: OssaAgent): AgentTaxonomy | null {
    const metadata = manifest.metadata as ManifestSection | undefined;
    if (!metadata) return null;

    const agentType = metadata.agentType;
    const agentKind = metadata.agentKind;
    const agentArchitecture = metadata.agentArchitecture;

    if (!agentType && !agentKind && !agentArchitecture) return null;

    const taxonomy: AgentTaxonomy = {};

    if (agentType) taxonomy.agentType = agentType;
    if (agentKind) taxonomy.agentKind = agentKind;

    if (agentArchitecture) {
      taxonomy.architecture = {};
      if (agentArchitecture.pattern)
        taxonomy.architecture.pattern = agentArchitecture.pattern;
      if (agentArchitecture.capabilities)
        taxonomy.architecture.capabilities = agentArchitecture.capabilities;
      if (agentArchitecture.coordination)
        taxonomy.architecture.coordination = agentArchitecture.coordination;
      if (agentArchitecture.runtime)
        taxonomy.architecture.runtime = agentArchitecture.runtime;
    }

    return taxonomy;
  }

  // ─── Capabilities ──────────────────────────────────────────

  private extractCapabilities(
    manifest: OssaAgent,
    taxonomy: AgentTaxonomy | null
  ): string[] {
    const capabilities: string[] = [];

    // From metadata.labels.capability (comma-separated)
    const capabilityLabel = manifest.metadata?.labels?.capability;
    if (capabilityLabel) {
      capabilities.push(
        ...capabilityLabel.split(',').map((entry) => entry.trim())
      );
    }

    // From metadata.labels.framework (e.g., 'a2a', 'mcp')
    const frameworkLabel = manifest.metadata?.labels?.framework;
    if (frameworkLabel && !capabilities.includes(frameworkLabel)) {
      capabilities.push(frameworkLabel);
    }

    // From metadata.tags
    if (manifest.metadata?.tags) {
      for (const tag of manifest.metadata.tags) {
        if (!capabilities.includes(tag)) {
          capabilities.push(tag);
        }
      }
    }

    // From spec.capabilities (string, {id: ...}, or {name: ...} formats)
    const specCapabilities = manifest.spec?.capabilities;
    if (specCapabilities) {
      for (const capability of specCapabilities) {
        const capabilityFields = capability as ManifestSection;
        const capabilityName =
          typeof capability === 'string'
            ? capability
            : capabilityFields.id || capabilityFields.name;
        if (capabilityName && !capabilities.includes(capabilityName)) {
          capabilities.push(capabilityName);
        }
      }
    }

    // From agentArchitecture.capabilities
    if (taxonomy?.architecture?.capabilities) {
      for (const architectureCapability of taxonomy.architecture.capabilities) {
        if (!capabilities.includes(architectureCapability)) {
          capabilities.push(architectureCapability);
        }
      }
    }

    // From agentKind (adds the functional role as a capability)
    if (taxonomy?.agentKind && !capabilities.includes(taxonomy.agentKind)) {
      capabilities.push(taxonomy.agentKind);
    }

    return capabilities;
  }

  // ─── Tools ─────────────────────────────────────────────────

  private extractTools(manifest: OssaAgent): ToolDescriptor[] {
    const manifestTools = manifest.spec?.tools || [];
    return manifestTools
      .filter((toolEntry) => toolEntry.name)
      .map((toolEntry) => {
        const toolFields = toolEntry as ManifestSection;
        // Support both camelCase (inputSchema) and snake_case (input_schema)
        const resolvedInputSchema =
          toolFields.inputSchema ||
          toolFields.input_schema ||
          toolFields.parameters;
        const resolvedOutputSchema =
          toolFields.outputSchema || toolFields.output_schema;

        return {
          name: toolEntry.name!,
          description: toolEntry.description || toolEntry.name!,
          inputSchema: (resolvedInputSchema &&
          typeof resolvedInputSchema === 'object'
            ? resolvedInputSchema
            : {
                type: 'object',
                properties: {},
              }) as ToolDescriptor['inputSchema'],
          ...(resolvedOutputSchema && typeof resolvedOutputSchema === 'object'
            ? {
                outputSchema:
                  resolvedOutputSchema as ToolDescriptor['outputSchema'],
              }
            : {}),
        };
      });
  }

  // ─── Model / LLM ──────────────────────────────────────────

  private extractModel(manifest: OssaAgent): AgentModelInfo | null {
    const spec = manifest.spec as ManifestSection | undefined;
    if (!spec) return null;

    // spec.model (new format) or spec.llm (legacy format)
    const modelConfig = spec.model || spec.llm;
    if (!modelConfig) return null;

    const modelInfo: AgentModelInfo = {};
    if (modelConfig.provider) modelInfo.provider = modelConfig.provider;
    if (modelConfig.name || modelConfig.model)
      modelInfo.model = modelConfig.name || modelConfig.model;
    if (modelConfig.temperature != null)
      modelInfo.temperature = modelConfig.temperature;
    if (modelConfig.maxTokens != null || modelConfig.max_tokens != null)
      modelInfo.maxTokens = modelConfig.maxTokens ?? modelConfig.max_tokens;
    if (modelConfig.topP != null) modelInfo.topP = modelConfig.topP;

    // Also check nested parameters
    if (modelConfig.parameters) {
      if (modelConfig.parameters.temperature != null && !modelInfo.temperature)
        modelInfo.temperature = modelConfig.parameters.temperature;
      if (modelConfig.parameters.maxTokens != null && !modelInfo.maxTokens)
        modelInfo.maxTokens = modelConfig.parameters.maxTokens;
    }

    return Object.keys(modelInfo).length > 0 ? modelInfo : null;
  }

  // ─── MCP Servers ───────────────────────────────────────────

  private extractMcpServers(manifest: OssaAgent): McpServerDescriptor[] {
    const mcp = resolveExtensionBlock(manifest, 'mcp');
    if (!mcp?.servers) return [];

    return mcp.servers.map((server: ManifestSection) => {
      const descriptor: McpServerDescriptor = {
        name: server.name || 'unnamed',
      };

      if (server.description) descriptor.description = server.description;
      if (server.version) descriptor.version = server.version;

      if (server.transport) {
        descriptor.transport = {
          type: server.transport.type || 'stdio',
          ...(server.transport.command
            ? { command: server.transport.command }
            : {}),
          ...(server.transport.args ? { args: server.transport.args } : {}),
          ...(server.transport.url ? { url: server.transport.url } : {}),
        };
      }

      if (server.capabilities) {
        descriptor.capabilities = server.capabilities;
      }

      // Attach MCP resources from the server or top-level mcp.resources
      const mcpResources = server.resources || mcp.resources;
      if (mcpResources && Array.isArray(mcpResources)) {
        descriptor.resources = mcpResources.map(
          (resource: ManifestSection) => ({
            uri: resource.uri,
            name: resource.name,
            ...(resource.description
              ? { description: resource.description }
              : {}),
            ...(resource.mimeType ? { mimeType: resource.mimeType } : {}),
          })
        );
      }

      return descriptor;
    });
  }

  // ─── A2A Protocol ──────────────────────────────────────────

  private extractA2AProtocol(
    manifest: OssaAgent
  ): A2AProtocolDescriptor | null {
    const a2a = resolveExtensionBlock(manifest, 'a2a');
    if (!a2a) return null;

    const descriptor: A2AProtocolDescriptor = {};

    // Protocol info
    if (a2a.protocol) {
      descriptor.protocol = {
        ...(a2a.protocol.type ? { type: a2a.protocol.type } : {}),
        ...(a2a.protocol.version ? { version: a2a.protocol.version } : {}),
        ...(a2a.protocol.messageFormat
          ? { messageFormat: a2a.protocol.messageFormat }
          : {}),
      };
    }

    // Agent endpoints (array of {agentId, url, capabilities, priority})
    if (a2a.endpoints && Array.isArray(a2a.endpoints)) {
      descriptor.agentEndpoints = a2a.endpoints.map(
        (endpoint: ManifestSection) => ({
          agentId: endpoint.agentId || endpoint.id,
          url: endpoint.url,
          ...(endpoint.capabilities
            ? { capabilities: endpoint.capabilities }
            : {}),
          ...(endpoint.priority != null ? { priority: endpoint.priority } : {}),
        })
      );
    }

    // Routing
    if (a2a.routing) {
      descriptor.routing = {
        ...(a2a.routing.strategy ? { strategy: a2a.routing.strategy } : {}),
        ...(a2a.routing.routingRules
          ? {
              rules: a2a.routing.routingRules.map(
                (routingRule: ManifestSection) => ({
                  name: routingRule.name,
                  condition: routingRule.condition,
                  target: routingRule.target,
                  ...(routingRule.priority != null
                    ? { priority: routingRule.priority }
                    : {}),
                })
              ),
            }
          : {}),
      };
    }

    // Delegation
    if (a2a.delegation) {
      descriptor.delegation = {
        ...(a2a.delegation.enabled != null
          ? { enabled: a2a.delegation.enabled }
          : {}),
        ...(a2a.delegation.maxDepth != null
          ? { maxDepth: a2a.delegation.maxDepth }
          : {}),
        ...(a2a.delegation.timeout != null
          ? { timeout: a2a.delegation.timeout }
          : {}),
        ...(a2a.delegation.handoff?.handoffRules
          ? {
              handoffRules: a2a.delegation.handoff.handoffRules.map(
                (handoffRule: ManifestSection) => ({
                  name: handoffRule.name,
                  condition: handoffRule.condition,
                  target: handoffRule.target,
                  ...(handoffRule.message
                    ? { message: handoffRule.message }
                    : {}),
                })
              ),
            }
          : {}),
      };
    }

    // Completion signals
    if (a2a.completionSignals) {
      descriptor.completionSignals = {
        ...(a2a.completionSignals.signals
          ? { signals: a2a.completionSignals.signals }
          : {}),
        ...(a2a.completionSignals.handlers
          ? {
              handlers: a2a.completionSignals.handlers.map(
                (signalHandler: ManifestSection) => ({
                  signal: signalHandler.signal,
                  action: signalHandler.action,
                  ...(signalHandler.target
                    ? { target: signalHandler.target }
                    : {}),
                })
              ),
            }
          : {}),
      };
    }

    // Retry policy
    if (a2a.retryPolicy) {
      descriptor.retryPolicy = {
        ...(a2a.retryPolicy.maxRetries != null
          ? { maxRetries: a2a.retryPolicy.maxRetries }
          : {}),
        ...(a2a.retryPolicy.backoff
          ? { backoff: a2a.retryPolicy.backoff }
          : {}),
        ...(a2a.retryPolicy.retryableErrors
          ? { retryableErrors: a2a.retryPolicy.retryableErrors }
          : {}),
      };
    }

    // Circuit breaker
    if (a2a.circuitBreaker) {
      descriptor.circuitBreaker = {
        ...(a2a.circuitBreaker.enabled != null
          ? { enabled: a2a.circuitBreaker.enabled }
          : {}),
        ...(a2a.circuitBreaker.failureThreshold != null
          ? { failureThreshold: a2a.circuitBreaker.failureThreshold }
          : {}),
        ...(a2a.circuitBreaker.timeout != null
          ? { timeout: a2a.circuitBreaker.timeout }
          : {}),
      };
    }

    return Object.keys(descriptor).length > 0 ? descriptor : null;
  }

  // ─── Handoffs ──────────────────────────────────────────────

  private extractHandoffs(manifest: OssaAgent): AgentHandoff[] {
    const spec = manifest.spec as ManifestSection | undefined;
    if (!spec?.handoffs) return [];

    return spec.handoffs.map((handoffEntry: ManifestSection) => ({
      to: handoffEntry.to,
      ...(handoffEntry.condition ? { condition: handoffEntry.condition } : {}),
    }));
  }

  // ─── Autonomy ──────────────────────────────────────────────

  private extractAutonomy(manifest: OssaAgent): AgentAutonomy | null {
    const spec = manifest.spec as ManifestSection | undefined;
    if (!spec?.autonomy) return null;

    const autonomyConfig = spec.autonomy;
    const autonomy: AgentAutonomy = {};

    if (autonomyConfig.level) autonomy.level = autonomyConfig.level;
    if (
      autonomyConfig.approval_required != null ||
      autonomyConfig.approvalRequired != null
    )
      autonomy.approvalRequired =
        autonomyConfig.approval_required ?? autonomyConfig.approvalRequired;
    if (autonomyConfig.allowed_actions || autonomyConfig.allowedActions)
      autonomy.allowedActions =
        autonomyConfig.allowed_actions || autonomyConfig.allowedActions;
    if (autonomyConfig.blocked_actions || autonomyConfig.blockedActions)
      autonomy.blockedActions =
        autonomyConfig.blocked_actions || autonomyConfig.blockedActions;

    return Object.keys(autonomy).length > 0 ? autonomy : null;
  }

  // ─── Constraints ───────────────────────────────────────────

  private extractConstraints(manifest: OssaAgent): AgentConstraints | null {
    const spec = manifest.spec as ManifestSection | undefined;
    if (!spec?.constraints) return null;

    const constraintConfig = spec.constraints;
    const constraints: AgentConstraints = {};

    if (constraintConfig.cost) {
      constraints.cost = {};
      if (constraintConfig.cost.maxTokensPerDay != null)
        constraints.cost.maxTokensPerDay =
          constraintConfig.cost.maxTokensPerDay;
      if (constraintConfig.cost.maxTokensPerRequest != null)
        constraints.cost.maxTokensPerRequest =
          constraintConfig.cost.maxTokensPerRequest;
      if (constraintConfig.cost.maxCostPerDay != null)
        constraints.cost.maxCostPerDay = constraintConfig.cost.maxCostPerDay;
      if (constraintConfig.cost.currency)
        constraints.cost.currency = constraintConfig.cost.currency;
    }

    if (constraintConfig.performance) {
      constraints.performance = {};
      if (constraintConfig.performance.maxLatencySeconds != null)
        constraints.performance.maxLatencySeconds =
          constraintConfig.performance.maxLatencySeconds;
      if (constraintConfig.performance.maxConcurrentRequests != null)
        constraints.performance.maxConcurrentRequests =
          constraintConfig.performance.maxConcurrentRequests;
      if (constraintConfig.performance.timeoutSeconds != null)
        constraints.performance.timeoutSeconds =
          constraintConfig.performance.timeoutSeconds;
    }

    if (constraintConfig.resources) {
      constraints.resources = {};
      if (constraintConfig.resources.cpu)
        constraints.resources.cpu = constraintConfig.resources.cpu;
      if (constraintConfig.resources.memory)
        constraints.resources.memory = constraintConfig.resources.memory;
    }

    return Object.keys(constraints).length > 0 ? constraints : null;
  }

  // ─── Observability ─────────────────────────────────────────

  private extractObservability(manifest: OssaAgent): AgentObservability | null {
    // Check spec.observability first, then extensions.a2a.observability
    const spec = manifest.spec as ManifestSection | undefined;
    const a2aExtension = resolveExtensionBlock(manifest, 'a2a');
    const observabilityConfig =
      spec?.observability || a2aExtension?.observability;
    if (!observabilityConfig) return null;

    const observability: AgentObservability = {};

    if (observabilityConfig.tracing) {
      observability.tracing = {
        ...(observabilityConfig.tracing.enabled != null
          ? { enabled: observabilityConfig.tracing.enabled }
          : {}),
        ...(observabilityConfig.tracing.exporter ||
        observabilityConfig.tracing.provider
          ? {
              exporter:
                observabilityConfig.tracing.exporter ||
                observabilityConfig.tracing.provider,
            }
          : {}),
        ...(observabilityConfig.tracing.endpoint
          ? { endpoint: observabilityConfig.tracing.endpoint }
          : {}),
        ...(observabilityConfig.tracing.samplingRate != null
          ? { samplingRate: observabilityConfig.tracing.samplingRate }
          : {}),
      };
    }

    if (observabilityConfig.metrics) {
      observability.metrics = {
        ...(observabilityConfig.metrics.enabled != null
          ? { enabled: observabilityConfig.metrics.enabled }
          : {}),
        ...(observabilityConfig.metrics.exporter
          ? { exporter: observabilityConfig.metrics.exporter }
          : {}),
        ...(observabilityConfig.metrics.endpoint
          ? { endpoint: observabilityConfig.metrics.endpoint }
          : {}),
      };
    }

    if (observabilityConfig.logging) {
      observability.logging = {
        ...(observabilityConfig.logging.level
          ? { level: observabilityConfig.logging.level }
          : {}),
        ...(observabilityConfig.logging.format
          ? { format: observabilityConfig.logging.format }
          : {}),
      };
    }

    return Object.keys(observability).length > 0 ? observability : null;
  }

  // ─── Endpoints ─────────────────────────────────────────────

  private extractEndpoints(
    manifest: OssaAgent,
    options?: AgentCardGeneratorOptions
  ): AgentCard['endpoints'] {
    if (options?.endpoints) {
      return options.endpoints;
    }

    const a2a = resolveExtensionBlock(manifest, 'a2a') ?? {};

    // A2A endpoints can be an object {http, grpc, websocket} or an array
    const a2aEndpoints = a2a.endpoints;

    if (a2aEndpoints && !Array.isArray(a2aEndpoints)) {
      // Object form: { http: "...", grpc: "..." }
      return {
        ...(a2aEndpoints.http ? { http: a2aEndpoints.http } : {}),
        ...(a2aEndpoints.grpc ? { grpc: a2aEndpoints.grpc } : {}),
        ...(a2aEndpoints.websocket
          ? { websocket: a2aEndpoints.websocket }
          : {}),
      };
    }

    // Array form: extract first URL
    if (Array.isArray(a2aEndpoints) && a2aEndpoints.length > 0) {
      const firstUrl = a2aEndpoints[0]?.url;
      if (firstUrl) {
        return { http: firstUrl };
      }
    }

    return {};
  }

  // ─── Transport ─────────────────────────────────────────────

  private extractTransport(endpoints: AgentCard['endpoints']): Transport[] {
    const transports: Transport[] = [];
    if (endpoints.http) transports.push('http');
    if (endpoints.grpc) transports.push('grpc');
    if (endpoints.websocket) transports.push('websocket');
    if (transports.length === 0) transports.push('http');
    return transports;
  }

  // ─── Authentication ────────────────────────────────────────

  private extractAuthentication(manifest: OssaAgent): AuthMethod[] {
    const a2a = resolveExtensionBlock(manifest, 'a2a') ?? {};

    if (a2a.authentication) {
      const authConfig = a2a.authentication;
      if (Array.isArray(authConfig)) {
        return authConfig as AuthMethod[];
      }
      if (typeof authConfig === 'string') {
        return [authConfig as AuthMethod];
      }
      if (authConfig.methods) {
        return authConfig.methods as AuthMethod[];
      }
      // { type: "jwt" } → map to bearer
      if (authConfig.type) {
        const authTypeMapping: Record<string, AuthMethod> = {
          jwt: 'bearer',
          bearer: 'bearer',
          mtls: 'mtls',
          oidc: 'oidc',
          api_key: 'api_key',
          none: 'none',
        };
        return [authTypeMapping[authConfig.type] || 'bearer'];
      }
    }

    return ['bearer'];
  }

  // ─── Encryption ────────────────────────────────────────────

  private extractEncryption(manifest: OssaAgent): EncryptionSpec {
    const a2a = resolveExtensionBlock(manifest, 'a2a') ?? {};

    if (a2a.encryption) {
      return {
        tlsRequired: a2a.encryption.tlsRequired ?? true,
        minTlsVersion: a2a.encryption.minTlsVersion ?? '1.2',
        ...(a2a.encryption.cipherSuites
          ? { cipherSuites: a2a.encryption.cipherSuites }
          : {}),
      };
    }

    return { tlsRequired: true, minTlsVersion: '1.2' };
  }

  // ─── State (projected from OSSA spec.state) ─────────────────

  private extractState(manifest: OssaAgent): AgentCardState | null {
    const spec = manifest.spec as ManifestSection | undefined;
    const stateConfig = spec?.state;
    if (!stateConfig || typeof stateConfig !== 'object') return null;

    const state: AgentCardState = {};
    if (stateConfig.mode) state.mode = stateConfig.mode;
    const storage = stateConfig.storage;
    if (storage?.type) state.storageHint = storage.type;
    if (stateConfig.session_endpoint)
      state.sessionEndpoint = stateConfig.session_endpoint;
    if (stateConfig.sessionEndpoint)
      state.sessionEndpoint = stateConfig.sessionEndpoint;
    const checkpoint = stateConfig.checkpointing;
    if (checkpoint?.interval_seconds != null)
      state.checkpointIntervalSeconds = checkpoint.interval_seconds;
    if (checkpoint?.intervalSeconds != null)
      state.checkpointIntervalSeconds = checkpoint.intervalSeconds;
    const ext = (manifest as ManifestSection).extensions;
    const extCheckpoint = ext?.checkpointing;
    if (
      state.checkpointIntervalSeconds == null &&
      extCheckpoint?.interval_seconds != null
    )
      state.checkpointIntervalSeconds = extCheckpoint.interval_seconds;
    if (storage?.retention) state.retention = storage.retention;

    return Object.keys(state).length > 0 ? state : null;
  }

  // ─── Token efficiency summary (projected from OSSA token_efficiency) ─────

  private extractTokenEfficiencySummary(
    manifest: OssaAgent
  ): TokenEfficiencySummary | null {
    const te = (manifest as ManifestSection).token_efficiency;
    if (!te || typeof te !== 'object') return null;

    const summary: TokenEfficiencySummary = {};
    if (te.serialization_profile)
      summary.serializationProfile = te.serialization_profile;
    if (te.observation_format)
      summary.observationFormat = te.observation_format;
    const budget = te.budget;
    if (budget?.max_input_tokens != null)
      summary.maxInputTokens = budget.max_input_tokens;
    const routing = te.routing;
    if (Array.isArray(routing?.cascade)) summary.cascade = routing.cascade;
    const consolidation = te.consolidation;
    if (consolidation?.strategy)
      summary.consolidationStrategy = consolidation.strategy;

    return Object.keys(summary).length > 0 ? summary : null;
  }

  // ─── Separation of duties (projected from OSSA spec.access and spec.separation) ─────

  private extractSeparation(manifest: OssaAgent): AgentCardSeparation | null {
    const spec = manifest.spec as ManifestSection | undefined;
    const access = spec?.access;
    const separationConfig = spec?.separation;
    if (!access && !separationConfig) return null;

    const separation: AgentCardSeparation = {};
    if (access?.tier) separation.accessTier = access.tier;
    if (separationConfig?.role) separation.role = separationConfig.role;
    const conflicts =
      separationConfig?.conflicts_with ?? separationConfig?.conflictsWith;
    if (Array.isArray(conflicts)) separation.conflictsWith = conflicts;

    return Object.keys(separation).length > 0 ? separation : null;
  }

  private computeManifestDigest(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  // ─── Metadata ──────────────────────────────────────────────

  private extractMetadata(
    manifest: OssaAgent
  ): NonNullable<AgentCard['metadata']> {
    const cardMetadata: Record<string, unknown> = {};

    // Copy labels (excluding 'capability' and 'framework' already in capabilities[])
    if (manifest.metadata?.labels) {
      for (const [labelKey, labelValue] of Object.entries(
        manifest.metadata.labels
      )) {
        if (labelKey !== 'capability' && labelKey !== 'framework') {
          cardMetadata[labelKey] = labelValue;
        }
      }
    }

    if (manifest.metadata?.description) {
      cardMetadata.description = manifest.metadata.description;
    }

    if (manifest.metadata?.author) {
      cardMetadata.author = manifest.metadata.author;
    }

    const meta = manifest.metadata as ManifestSection | undefined;
    if (meta?.team) cardMetadata.team = meta.team;
    if (meta?.environment) cardMetadata.environment = meta.environment;
    if (meta?.region) cardMetadata.region = meta.region;

    if (manifest.metadata?.lifecycle) {
      cardMetadata.lifecycle = manifest.metadata.lifecycle;
    }

    // Annotations
    const manifestAnnotations = (manifest.metadata as ManifestSection)
      ?.annotations;
    if (manifestAnnotations) {
      cardMetadata.annotations = manifestAnnotations;
    }

    return cardMetadata;
  }
}
