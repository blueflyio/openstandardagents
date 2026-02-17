/**
 * Observability Generator Service
 *
 * Generates deployable observability configuration from an OSSA agent manifest:
 *   - observability/traces.yaml     OTel Collector pipeline config
 *   - observability/metrics.yaml    Prometheus-compatible metric definitions
 *   - observability/dashboards/agent-health.json   Grafana dashboard template
 *
 * Uses OpenTelemetry gen_ai semantic conventions (v1.39.0 experimental).
 * Reference: src/adapters/opentelemetry.adapter.ts for runtime patterns.
 * This service generates static config FILES, not runtime initialization.
 *
 * SOLID: Single Responsibility - observability config generation only
 * DRY: Reuses OssaAgent types, single-source manifest
 */

import * as yaml from 'yaml';
import type { OssaAgent } from '../../types/index.js';
import type { ExportFile } from '../../adapters/base/adapter.interface.js';

// ── Internal types ──────────────────────────────────────────────────

/** Resolved agent identity extracted from the manifest. */
interface AgentIdentity {
  name: string;
  version: string;
  provider: string;
  model: string;
  pattern: string;
  agentType: string;
  agentKind: string;
}

/** Resolved observability endpoints from manifest extensions. */
interface ObservabilityEndpoints {
  tracesEndpoint: string;
  metricsEndpoint: string;
  tracesExporter: string;
  metricsExporter: string;
  sampleRate: number;
  collectionIntervalSeconds: number;
}

/** Resolved constraints for threshold-based alerting. */
interface AgentConstraints {
  maxTokensPerDay: number;
  maxCostPerDay: number;
  maxLatencySeconds: number;
  maxErrorRate: number;
  timeoutSeconds: number;
}

/** A team member for multi-agent observability. */
interface TeamMember {
  name: string;
  role: string;
}

// ── Service ─────────────────────────────────────────────────────────

export class ObservabilityGeneratorService {
  /**
   * Generate observability configuration files from an OSSA manifest.
   *
   * @param manifest - A validated OssaAgent manifest
   * @returns ExportFile[] ready for disk write or archive
   */
  generate(manifest: OssaAgent): ExportFile[] {
    const identity = this.resolveIdentity(manifest);
    const endpoints = this.resolveEndpoints(manifest);
    const constraints = this.resolveConstraints(manifest);
    const tools = this.resolveTools(manifest);
    const team = this.resolveTeam(manifest);
    const isMultiAgent = team.length > 0;

    const files: ExportFile[] = [
      this.generateTracesYaml(identity, endpoints, tools, team),
      this.generateMetricsYaml(identity, endpoints, constraints, tools, team),
      this.generateDashboardJson(identity, constraints, tools, isMultiAgent),
    ];

    return files;
  }

  // ── Identity resolution ─────────────────────────────────────────

  private resolveIdentity(manifest: OssaAgent): AgentIdentity {
    const meta = manifest.metadata;
    const spec = manifest.spec;
    return {
      name: meta?.name ?? 'unnamed-agent',
      version: meta?.version ?? '0.0.0',
      provider: spec?.llm?.provider ?? 'unknown',
      model: spec?.llm?.model ?? 'unknown',
      pattern: meta?.agentArchitecture?.pattern ?? 'single',
      agentType: meta?.agentType ?? 'custom',
      agentKind: meta?.agentKind ?? 'worker',
    };
  }

  // ── Endpoint resolution ─────────────────────────────────────────

  private resolveEndpoints(manifest: OssaAgent): ObservabilityEndpoints {
    const obs = manifest.spec?.observability;
    const ext = manifest.extensions?.observability as Record<string, unknown> | undefined;
    const extTraces = ext?.traces as Record<string, unknown> | undefined;
    const extMetrics = ext?.metrics as Record<string, unknown> | undefined;

    // Prefer spec.observability, fall back to extensions.observability, then defaults
    const tracesEndpoint =
      (obs?.tracing?.endpoint as string | undefined) ??
      (extTraces?.endpoint as string | undefined) ??
      'http://localhost:4318/v1/traces';

    const metricsEndpoint =
      (obs?.metrics?.endpoint as string | undefined) ??
      (extMetrics?.endpoint as string | undefined) ??
      'http://localhost:4318/v1/metrics';

    const tracesExporter =
      (obs?.tracing?.exporter as string | undefined) ?? 'otlp';

    const metricsExporter =
      (obs?.metrics?.exporter as string | undefined) ?? 'otlp';

    const sampleRate =
      (extTraces?.sample_rate as number | undefined) ?? 1.0;

    const collectionIntervalSeconds =
      (extMetrics?.collection_interval_seconds as number | undefined) ?? 60;

    return {
      tracesEndpoint,
      metricsEndpoint,
      tracesExporter,
      metricsExporter,
      sampleRate,
      collectionIntervalSeconds,
    };
  }

  // ── Constraint resolution ───────────────────────────────────────

  private resolveConstraints(manifest: OssaAgent): AgentConstraints {
    const cost = manifest.spec?.constraints?.cost;
    const perf = manifest.spec?.constraints?.performance;
    return {
      maxTokensPerDay: cost?.maxTokensPerDay ?? 1_000_000,
      maxCostPerDay: cost?.maxCostPerDay ?? 100,
      maxLatencySeconds: perf?.maxLatencySeconds ?? 30,
      maxErrorRate: perf?.maxErrorRate ?? 0.05,
      timeoutSeconds: perf?.timeoutSeconds ?? 120,
    };
  }

  // ── Tool resolution ─────────────────────────────────────────────

  private resolveTools(manifest: OssaAgent): string[] {
    const tools = manifest.spec?.tools ?? [];
    return tools.map((t) => t.name ?? t.type ?? 'unknown_tool');
  }

  // ── Team resolution ─────────────────────────────────────────────

  private resolveTeam(manifest: OssaAgent): TeamMember[] {
    const spec = manifest.spec as Record<string, unknown> | undefined;
    if (!spec) return [];

    // Check spec.team.members (primary path for multi-agent)
    const team = spec.team as Record<string, unknown> | undefined;
    if (team?.members && Array.isArray(team.members)) {
      return (team.members as Array<Record<string, unknown>>).map((m) => ({
        name: (m.name as string) ?? 'unnamed',
        role: (m.role as string) ?? 'worker',
      }));
    }

    // Check spec.swarm.agents
    const swarm = spec.swarm as Record<string, unknown> | undefined;
    if (swarm?.agents && Array.isArray(swarm.agents)) {
      return (swarm.agents as Array<Record<string, unknown>>).map((a) => ({
        name: (a.name as string) ?? 'unnamed',
        role: (a.role as string) ?? 'worker',
      }));
    }

    // Check spec.subagents
    if (spec.subagents && Array.isArray(spec.subagents)) {
      return (spec.subagents as Array<Record<string, unknown>>).map((s) => ({
        name: (s.name as string) ?? 'unnamed',
        role: (s.role as string) ?? 'worker',
      }));
    }

    return [];
  }

  // ── Traces YAML ─────────────────────────────────────────────────

  private generateTracesYaml(
    identity: AgentIdentity,
    endpoints: ObservabilityEndpoints,
    tools: string[],
    team: TeamMember[],
  ): ExportFile {
    const isMultiAgent = team.length > 0;

    // Build OTel Collector config using gen_ai semantic conventions
    const config: Record<string, unknown> = {
      // Header comment captured as YAML comment below
      receivers: {
        otlp: {
          protocols: {
            http: {
              endpoint: '0.0.0.0:4318',
            },
            grpc: {
              endpoint: '0.0.0.0:4317',
            },
          },
        },
      },

      processors: {
        batch: {
          timeout: '5s',
          send_batch_size: 512,
          send_batch_max_size: 1024,
        },

        // Enrich all spans with agent resource attributes
        resource: {
          attributes: [
            { key: 'service.name', value: identity.name, action: 'upsert' },
            { key: 'service.version', value: identity.version, action: 'upsert' },
            { key: 'gen_ai.agent.name', value: identity.name, action: 'upsert' },
            { key: 'gen_ai.provider.name', value: identity.provider, action: 'upsert' },
            { key: 'gen_ai.request.model', value: identity.model, action: 'upsert' },
            { key: 'ossa.agent.type', value: identity.agentType, action: 'upsert' },
            { key: 'ossa.agent.kind', value: identity.agentKind, action: 'upsert' },
            { key: 'ossa.agent.architecture.pattern', value: identity.pattern, action: 'upsert' },
          ],
        },

        // Probabilistic sampling for high-throughput agents
        probabilistic_sampler: {
          sampling_percentage: endpoints.sampleRate * 100,
        },

        // Span filtering: keep only gen_ai.* and agent.* spans in production
        filter: {
          error_mode: 'ignore',
          traces: {
            span: [
              'attributes["gen_ai.operation.name"] != nil',
              'attributes["gen_ai.agent.name"] != nil',
              'name == "invoke_agent"',
              'name == "gen_ai.tool.call"',
              'name == "gen_ai.chat"',
              'name == "gen_ai.content.completion"',
            ],
          },
        },
      },

      exporters: this.buildTraceExporters(endpoints),

      service: {
        pipelines: {
          traces: {
            receivers: ['otlp'],
            processors: ['resource', 'probabilistic_sampler', 'batch'],
            exporters: this.buildTraceExporterNames(endpoints),
          },
        },
        telemetry: {
          logs: {
            level: 'info',
          },
        },
      },
    };

    // Add span definitions as documentation for instrumentation
    const spanDefinitions = this.buildSpanDefinitions(identity, tools, team, isMultiAgent);

    const yamlContent = [
      `# OpenTelemetry Collector configuration for ${identity.name}`,
      `# Generated from OSSA manifest v${identity.version}`,
      `# gen_ai semantic conventions v1.39.0 (experimental)`,
      '#',
      '# Span naming conventions:',
      '#   invoke_agent           - Top-level agent invocation (kind: CLIENT)',
      '#   gen_ai.chat            - LLM chat completion call (kind: CLIENT)',
      '#   gen_ai.content.completion - Content generation (kind: INTERNAL)',
      '#   gen_ai.tool.call       - Tool invocation (kind: INTERNAL)',
      ...(isMultiAgent
        ? [
            '#   agent.handoff          - Inter-agent handoff (kind: INTERNAL)',
            '#   agent.coordinate       - Team coordination (kind: INTERNAL)',
          ]
        : []),
      '#',
      yaml.stringify(config, { lineWidth: 120 }),
      '',
      '# ── Span Definitions (for instrumentation reference) ──',
      '#',
      yaml.stringify({ _span_definitions: spanDefinitions }, { lineWidth: 120 }),
    ].join('\n');

    return {
      path: 'observability/traces.yaml',
      content: yamlContent,
      type: 'config',
      language: 'yaml',
    };
  }

  private buildTraceExporters(endpoints: ObservabilityEndpoints): Record<string, unknown> {
    const exporters: Record<string, unknown> = {};

    switch (endpoints.tracesExporter) {
      case 'jaeger':
        exporters.jaeger = {
          endpoint: endpoints.tracesEndpoint,
          tls: { insecure: true },
        };
        break;
      case 'zipkin':
        exporters.zipkin = {
          endpoint: endpoints.tracesEndpoint,
        };
        break;
      case 'otlp':
      default:
        exporters.otlp = {
          endpoint: endpoints.tracesEndpoint,
          tls: { insecure: true },
        };
        break;
    }

    // Always include debug exporter for development
    exporters.debug = {
      verbosity: 'basic',
    };

    return exporters;
  }

  private buildTraceExporterNames(endpoints: ObservabilityEndpoints): string[] {
    const names: string[] = [];
    switch (endpoints.tracesExporter) {
      case 'jaeger':
        names.push('jaeger');
        break;
      case 'zipkin':
        names.push('zipkin');
        break;
      case 'otlp':
      default:
        names.push('otlp');
        break;
    }
    names.push('debug');
    return names;
  }

  private buildSpanDefinitions(
    identity: AgentIdentity,
    tools: string[],
    team: TeamMember[],
    isMultiAgent: boolean,
  ): Record<string, unknown>[] {
    const spans: Record<string, unknown>[] = [
      {
        name: 'invoke_agent',
        kind: 'CLIENT',
        description: `Top-level invocation of ${identity.name}`,
        attributes: {
          'gen_ai.agent.name': identity.name,
          'gen_ai.operation.name': 'invoke_agent',
          'gen_ai.request.model': identity.model,
          'gen_ai.provider.name': identity.provider,
          'gen_ai.agent.description': `${identity.agentKind} agent (${identity.pattern} pattern)`,
        },
      },
      {
        name: 'gen_ai.chat',
        kind: 'CLIENT',
        description: 'LLM chat completion request',
        attributes: {
          'gen_ai.operation.name': 'chat',
          'gen_ai.request.model': identity.model,
          'gen_ai.provider.name': identity.provider,
          'gen_ai.request.temperature': '${temperature}',
          'gen_ai.request.max_tokens': '${maxTokens}',
          'gen_ai.request.top_p': '${topP}',
        },
        events: [
          {
            name: 'gen_ai.content.prompt',
            attributes: { 'gen_ai.prompt': '${prompt_content}' },
          },
          {
            name: 'gen_ai.content.completion',
            attributes: { 'gen_ai.completion': '${completion_content}' },
          },
        ],
        metrics_on_end: {
          'gen_ai.usage.input_tokens': '${input_tokens}',
          'gen_ai.usage.output_tokens': '${output_tokens}',
        },
      },
    ];

    // Tool call spans
    for (const toolName of tools) {
      spans.push({
        name: 'gen_ai.tool.call',
        kind: 'INTERNAL',
        description: `Tool invocation: ${toolName}`,
        attributes: {
          'gen_ai.operation.name': 'tool_call',
          'gen_ai.tool.name': toolName,
          'gen_ai.tool.call.id': '${call_id}',
          'gen_ai.tool.parameters': '${parameters_json}',
        },
      });
    }

    // Multi-agent coordination spans
    if (isMultiAgent) {
      spans.push(
        {
          name: 'agent.handoff',
          kind: 'INTERNAL',
          description: 'Handoff between agents in the team',
          attributes: {
            'gen_ai.operation.name': 'handoff',
            'ossa.handoff.source_agent': '${source_agent}',
            'ossa.handoff.target_agent': '${target_agent}',
            'ossa.handoff.reason': '${reason}',
          },
        },
        {
          name: 'agent.coordinate',
          kind: 'INTERNAL',
          description: 'Team coordination event',
          attributes: {
            'gen_ai.operation.name': 'coordinate',
            'ossa.coordination.team_size': String(team.length),
            'ossa.coordination.pattern': identity.pattern,
            'ossa.coordination.leader': '${leader_name}',
          },
        },
      );

      // Per-member invocation spans
      for (const member of team) {
        spans.push({
          name: `invoke_agent`,
          kind: 'INTERNAL',
          description: `Invocation of team member: ${member.name} (${member.role})`,
          attributes: {
            'gen_ai.agent.name': member.name,
            'gen_ai.operation.name': 'invoke_agent',
            'ossa.agent.role': member.role,
            'ossa.team.parent': identity.name,
          },
        });
      }
    }

    return spans;
  }

  // ── Metrics YAML ────────────────────────────────────────────────

  private generateMetricsYaml(
    identity: AgentIdentity,
    endpoints: ObservabilityEndpoints,
    constraints: AgentConstraints,
    tools: string[],
    team: TeamMember[],
  ): ExportFile {
    const isMultiAgent = team.length > 0;
    const sanitizedName = identity.name.replace(/[^a-zA-Z0-9_]/g, '_');

    const metricDefinitions = this.buildMetricDefinitions(
      sanitizedName,
      identity,
      constraints,
      tools,
      team,
      isMultiAgent,
    );

    // OTel Collector config fragment for metrics pipeline
    const collectorConfig: Record<string, unknown> = {
      receivers: {
        otlp: {
          protocols: {
            http: { endpoint: '0.0.0.0:4318' },
            grpc: { endpoint: '0.0.0.0:4317' },
          },
        },
        prometheus: {
          config: {
            scrape_configs: [
              {
                job_name: `${identity.name}-metrics`,
                scrape_interval: `${endpoints.collectionIntervalSeconds}s`,
                static_configs: [
                  {
                    targets: ['localhost:9464'],
                    labels: {
                      agent: identity.name,
                      version: identity.version,
                      provider: identity.provider,
                    },
                  },
                ],
              },
            ],
          },
        },
      },

      processors: {
        batch: {
          timeout: '10s',
          send_batch_size: 256,
        },
        resource: {
          attributes: [
            { key: 'service.name', value: identity.name, action: 'upsert' },
            { key: 'service.version', value: identity.version, action: 'upsert' },
          ],
        },
      },

      exporters: this.buildMetricExporters(endpoints),

      service: {
        pipelines: {
          metrics: {
            receivers: ['otlp', 'prometheus'],
            processors: ['resource', 'batch'],
            exporters: this.buildMetricExporterNames(endpoints),
          },
        },
      },
    };

    // Prometheus recording rules for derived metrics
    const recordingRules = this.buildRecordingRules(sanitizedName, identity, constraints, isMultiAgent);

    // Alert rules based on constraints
    const alertRules = this.buildAlertRules(sanitizedName, identity, constraints, isMultiAgent);

    const yamlContent = [
      `# Metrics configuration for ${identity.name}`,
      `# Generated from OSSA manifest v${identity.version}`,
      `# gen_ai semantic conventions v1.39.0 (experimental)`,
      '#',
      '# Includes:',
      '#   - OTel Collector metrics pipeline config',
      '#   - Metric definitions (Prometheus-compatible)',
      '#   - Recording rules (pre-computed aggregates)',
      '#   - Alert rules (constraint-based thresholds)',
      '#',
      '',
      '# ── OTel Collector Config ──',
      yaml.stringify(collectorConfig, { lineWidth: 120 }),
      '',
      '# ── Metric Definitions ──',
      yaml.stringify({ metric_definitions: metricDefinitions }, { lineWidth: 120 }),
      '',
      '# ── Prometheus Recording Rules ──',
      yaml.stringify({ groups: [recordingRules] }, { lineWidth: 120 }),
      '',
      '# ── Prometheus Alert Rules ──',
      yaml.stringify({ groups: [alertRules] }, { lineWidth: 120 }),
    ].join('\n');

    return {
      path: 'observability/metrics.yaml',
      content: yamlContent,
      type: 'config',
      language: 'yaml',
    };
  }

  private buildMetricExporters(endpoints: ObservabilityEndpoints): Record<string, unknown> {
    const exporters: Record<string, unknown> = {};

    switch (endpoints.metricsExporter) {
      case 'prometheus':
        exporters.prometheus = {
          endpoint: '0.0.0.0:9464',
          namespace: 'ossa',
          const_labels: {
            source: 'ossa-agent',
          },
        };
        break;
      case 'otlp':
      default:
        exporters.otlp = {
          endpoint: endpoints.metricsEndpoint,
          tls: { insecure: true },
        };
        break;
    }

    exporters.debug = {
      verbosity: 'basic',
    };

    return exporters;
  }

  private buildMetricExporterNames(endpoints: ObservabilityEndpoints): string[] {
    const names: string[] = [];
    switch (endpoints.metricsExporter) {
      case 'prometheus':
        names.push('prometheus');
        break;
      case 'otlp':
      default:
        names.push('otlp');
        break;
    }
    names.push('debug');
    return names;
  }

  private buildMetricDefinitions(
    sanitizedName: string,
    identity: AgentIdentity,
    constraints: AgentConstraints,
    tools: string[],
    team: TeamMember[],
    isMultiAgent: boolean,
  ): Record<string, unknown>[] {
    const metrics: Record<string, unknown>[] = [
      // ── Token Usage ───────────────────────────────────
      {
        name: 'gen_ai_usage_input_tokens_total',
        type: 'counter',
        unit: 'tokens',
        description: 'Total input tokens consumed by LLM requests',
        labels: ['gen_ai.provider.name', 'gen_ai.request.model', 'gen_ai.agent.name'],
        semantic_convention: 'gen_ai.usage.input_tokens',
      },
      {
        name: 'gen_ai_usage_output_tokens_total',
        type: 'counter',
        unit: 'tokens',
        description: 'Total output tokens generated by LLM responses',
        labels: ['gen_ai.provider.name', 'gen_ai.request.model', 'gen_ai.agent.name'],
        semantic_convention: 'gen_ai.usage.output_tokens',
      },
      {
        name: `${sanitizedName}_tokens_daily_total`,
        type: 'counter',
        unit: 'tokens',
        description: `Daily token budget consumption for ${identity.name}`,
        labels: ['direction', 'gen_ai.request.model'],
        threshold: constraints.maxTokensPerDay,
      },

      // ── Latency ───────────────────────────────────────
      {
        name: 'gen_ai_client_operation_duration_seconds',
        type: 'histogram',
        unit: 'seconds',
        description: 'Duration of gen_ai operations (chat, tool_call, invoke_agent)',
        labels: ['gen_ai.operation.name', 'gen_ai.agent.name', 'gen_ai.request.model'],
        buckets: [0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 15.0, 30.0, 60.0, 120.0],
        semantic_convention: 'gen_ai.client.operation.duration',
        slo_threshold: constraints.maxLatencySeconds,
      },
      {
        name: `${sanitizedName}_time_to_first_token_seconds`,
        type: 'histogram',
        unit: 'seconds',
        description: 'Time to first token in streaming responses',
        labels: ['gen_ai.request.model', 'gen_ai.provider.name'],
        buckets: [0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0],
      },

      // ── Cost ──────────────────────────────────────────
      {
        name: `${sanitizedName}_cost_per_request_dollars`,
        type: 'histogram',
        unit: 'dollars',
        description: 'Estimated cost per LLM request in USD',
        labels: ['gen_ai.operation.name', 'gen_ai.request.model'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0],
      },
      {
        name: `${sanitizedName}_cost_daily_total_dollars`,
        type: 'counter',
        unit: 'dollars',
        description: `Daily cost accumulation for ${identity.name}`,
        labels: ['gen_ai.request.model'],
        threshold: constraints.maxCostPerDay,
      },

      // ── Error Tracking ────────────────────────────────
      {
        name: `${sanitizedName}_requests_total`,
        type: 'counter',
        description: 'Total requests processed by the agent',
        labels: ['gen_ai.operation.name', 'status', 'error.type'],
      },
      {
        name: `${sanitizedName}_errors_total`,
        type: 'counter',
        description: 'Total errors encountered by the agent',
        labels: ['gen_ai.operation.name', 'error.type', 'gen_ai.request.model'],
        threshold_rate: constraints.maxErrorRate,
      },

      // ── Tool Metrics ──────────────────────────────────
      {
        name: `${sanitizedName}_tool_calls_total`,
        type: 'counter',
        description: 'Total tool invocations',
        labels: ['gen_ai.tool.name', 'status'],
      },
      {
        name: `${sanitizedName}_tool_duration_seconds`,
        type: 'histogram',
        unit: 'seconds',
        description: 'Duration of individual tool calls',
        labels: ['gen_ai.tool.name'],
        buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0],
      },

      // ── Agent Lifecycle ───────────────────────────────
      {
        name: `${sanitizedName}_invocations_total`,
        type: 'counter',
        description: 'Total agent invocations',
        labels: ['gen_ai.agent.name', 'status'],
      },
      {
        name: `${sanitizedName}_active_invocations`,
        type: 'gauge',
        description: 'Currently active agent invocations',
        labels: ['gen_ai.agent.name'],
      },
      {
        name: `${sanitizedName}_invocation_duration_seconds`,
        type: 'histogram',
        unit: 'seconds',
        description: 'End-to-end duration of a full agent invocation',
        labels: ['gen_ai.agent.name', 'status'],
        buckets: [0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
      },
    ];

    // Per-tool specific counters
    for (const tool of tools) {
      metrics.push({
        name: `${sanitizedName}_tool_${tool.replace(/[^a-zA-Z0-9_]/g, '_')}_calls_total`,
        type: 'counter',
        description: `Invocations of tool: ${tool}`,
        labels: ['status', 'error.type'],
      });
    }

    // ── Multi-agent / Team metrics ──────────────────────
    if (isMultiAgent) {
      metrics.push(
        {
          name: `${sanitizedName}_team_handoffs_total`,
          type: 'counter',
          description: 'Total handoffs between team members',
          labels: ['source_agent', 'target_agent', 'reason'],
        },
        {
          name: `${sanitizedName}_team_coordination_duration_seconds`,
          type: 'histogram',
          unit: 'seconds',
          description: 'Duration of team coordination events',
          labels: ['coordination_type', 'pattern'],
          buckets: [0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0],
        },
        {
          name: `${sanitizedName}_team_member_utilization_ratio`,
          type: 'gauge',
          description: 'Utilization ratio per team member (active time / total time)',
          labels: ['gen_ai.agent.name', 'role'],
        },
      );

      // Per-member metrics
      for (const member of team) {
        const memberSafe = member.name.replace(/[^a-zA-Z0-9_]/g, '_');
        metrics.push(
          {
            name: `${sanitizedName}_member_${memberSafe}_tokens_total`,
            type: 'counter',
            unit: 'tokens',
            description: `Token usage for team member: ${member.name} (${member.role})`,
            labels: ['direction', 'gen_ai.request.model'],
          },
          {
            name: `${sanitizedName}_member_${memberSafe}_invocations_total`,
            type: 'counter',
            description: `Invocations of team member: ${member.name}`,
            labels: ['status'],
          },
        );
      }
    }

    return metrics;
  }

  private buildRecordingRules(
    sanitizedName: string,
    identity: AgentIdentity,
    constraints: AgentConstraints,
    isMultiAgent: boolean,
  ): Record<string, unknown> {
    const rules: Record<string, unknown>[] = [
      // Token usage rate (tokens per minute)
      {
        record: `${sanitizedName}:tokens_per_minute`,
        expr: `rate(gen_ai_usage_input_tokens_total{gen_ai_agent_name="${identity.name}"}[5m]) + rate(gen_ai_usage_output_tokens_total{gen_ai_agent_name="${identity.name}"}[5m])`,
      },

      // Error rate over 5m window
      {
        record: `${sanitizedName}:error_rate_5m`,
        expr: `rate(${sanitizedName}_errors_total[5m]) / rate(${sanitizedName}_requests_total[5m])`,
      },

      // p50, p95, p99 latency
      {
        record: `${sanitizedName}:latency_p50`,
        expr: `histogram_quantile(0.50, rate(gen_ai_client_operation_duration_seconds_bucket{gen_ai_agent_name="${identity.name}"}[5m]))`,
      },
      {
        record: `${sanitizedName}:latency_p95`,
        expr: `histogram_quantile(0.95, rate(gen_ai_client_operation_duration_seconds_bucket{gen_ai_agent_name="${identity.name}"}[5m]))`,
      },
      {
        record: `${sanitizedName}:latency_p99`,
        expr: `histogram_quantile(0.99, rate(gen_ai_client_operation_duration_seconds_bucket{gen_ai_agent_name="${identity.name}"}[5m]))`,
      },

      // Cost per task (estimated from token usage)
      {
        record: `${sanitizedName}:cost_per_task_avg`,
        expr: `rate(${sanitizedName}_cost_daily_total_dollars[5m]) / rate(${sanitizedName}_invocations_total{status="success"}[5m])`,
      },

      // Token budget utilization (percentage of daily limit used)
      {
        record: `${sanitizedName}:token_budget_utilization`,
        expr: `increase(${sanitizedName}_tokens_daily_total[24h]) / ${constraints.maxTokensPerDay}`,
      },

      // Tool call success rate
      {
        record: `${sanitizedName}:tool_success_rate`,
        expr: `rate(${sanitizedName}_tool_calls_total{status="success"}[5m]) / rate(${sanitizedName}_tool_calls_total[5m])`,
      },
    ];

    if (isMultiAgent) {
      rules.push(
        {
          record: `${sanitizedName}:handoff_rate_5m`,
          expr: `rate(${sanitizedName}_team_handoffs_total[5m])`,
        },
        {
          record: `${sanitizedName}:coordination_overhead_ratio`,
          expr: `rate(${sanitizedName}_team_coordination_duration_seconds_sum[5m]) / rate(${sanitizedName}_invocation_duration_seconds_sum[5m])`,
        },
      );
    }

    return {
      name: `${identity.name}_recording_rules`,
      interval: '30s',
      rules,
    };
  }

  private buildAlertRules(
    sanitizedName: string,
    identity: AgentIdentity,
    constraints: AgentConstraints,
    isMultiAgent: boolean,
  ): Record<string, unknown> {
    const rules: Record<string, unknown>[] = [
      // High error rate
      {
        alert: `${identity.name}_HighErrorRate`,
        expr: `${sanitizedName}:error_rate_5m > ${constraints.maxErrorRate}`,
        for: '5m',
        labels: {
          severity: 'critical',
          agent: identity.name,
        },
        annotations: {
          summary: `Agent ${identity.name} error rate exceeds ${constraints.maxErrorRate * 100}%`,
          description: `Error rate is {{ $value | humanizePercentage }} (threshold: ${constraints.maxErrorRate * 100}%).`,
          runbook_url: `https://runbooks.example.com/agents/${identity.name}/high-error-rate`,
        },
      },

      // High latency (p95 exceeding SLO)
      {
        alert: `${identity.name}_HighLatency`,
        expr: `${sanitizedName}:latency_p95 > ${constraints.maxLatencySeconds}`,
        for: '5m',
        labels: {
          severity: 'warning',
          agent: identity.name,
        },
        annotations: {
          summary: `Agent ${identity.name} p95 latency exceeds ${constraints.maxLatencySeconds}s`,
          description: `p95 latency is {{ $value | humanizeDuration }} (SLO: ${constraints.maxLatencySeconds}s).`,
        },
      },

      // Token budget exhaustion (>80% of daily budget)
      {
        alert: `${identity.name}_TokenBudgetWarning`,
        expr: `${sanitizedName}:token_budget_utilization > 0.8`,
        for: '10m',
        labels: {
          severity: 'warning',
          agent: identity.name,
        },
        annotations: {
          summary: `Agent ${identity.name} approaching token budget limit`,
          description: `Token budget utilization is {{ $value | humanizePercentage }} of daily limit (${constraints.maxTokensPerDay.toLocaleString()} tokens).`,
        },
      },

      // Token budget exceeded
      {
        alert: `${identity.name}_TokenBudgetExceeded`,
        expr: `${sanitizedName}:token_budget_utilization > 1.0`,
        for: '1m',
        labels: {
          severity: 'critical',
          agent: identity.name,
        },
        annotations: {
          summary: `Agent ${identity.name} has exceeded daily token budget`,
          description: `Token budget utilization is {{ $value | humanizePercentage }}. Limit: ${constraints.maxTokensPerDay.toLocaleString()} tokens/day.`,
        },
      },

      // Cost threshold exceeded
      {
        alert: `${identity.name}_DailyCostExceeded`,
        expr: `increase(${sanitizedName}_cost_daily_total_dollars[24h]) > ${constraints.maxCostPerDay}`,
        for: '5m',
        labels: {
          severity: 'critical',
          agent: identity.name,
        },
        annotations: {
          summary: `Agent ${identity.name} daily cost exceeds $${constraints.maxCostPerDay}`,
          description: 'Daily cost is ${{ $value | printf "%.2f" }}.',
        },
      },

      // Agent down (no invocations in 15m)
      {
        alert: `${identity.name}_AgentDown`,
        expr: `rate(${sanitizedName}_invocations_total[15m]) == 0`,
        for: '15m',
        labels: {
          severity: 'warning',
          agent: identity.name,
        },
        annotations: {
          summary: `Agent ${identity.name} has received no invocations in 15 minutes`,
          description: 'The agent may be down or unreachable.',
        },
      },

      // Tool failure spike
      {
        alert: `${identity.name}_ToolFailureSpike`,
        expr: `(1 - ${sanitizedName}:tool_success_rate) > 0.2`,
        for: '5m',
        labels: {
          severity: 'warning',
          agent: identity.name,
        },
        annotations: {
          summary: `Agent ${identity.name} tool failure rate exceeds 20%`,
          description: 'Tool success rate is {{ $value | humanizePercentage }}.',
        },
      },
    ];

    if (isMultiAgent) {
      rules.push(
        {
          alert: `${identity.name}_HighCoordinationOverhead`,
          expr: `${sanitizedName}:coordination_overhead_ratio > 0.3`,
          for: '10m',
          labels: {
            severity: 'warning',
            agent: identity.name,
          },
          annotations: {
            summary: `Agent ${identity.name} spending >30% of time on coordination`,
            description: 'Coordination overhead is {{ $value | humanizePercentage }}. Consider simplifying the team structure.',
          },
        },
        {
          alert: `${identity.name}_ExcessiveHandoffs`,
          expr: `${sanitizedName}:handoff_rate_5m > 10`,
          for: '5m',
          labels: {
            severity: 'warning',
            agent: identity.name,
          },
          annotations: {
            summary: `Agent ${identity.name} team handoff rate exceeds 10/5m`,
            description: 'High handoff rate may indicate unclear task boundaries.',
          },
        },
      );
    }

    return {
      name: `${identity.name}_alert_rules`,
      rules,
    };
  }

  // ── Grafana Dashboard JSON ──────────────────────────────────────

  private generateDashboardJson(
    identity: AgentIdentity,
    constraints: AgentConstraints,
    tools: string[],
    isMultiAgent: boolean,
  ): ExportFile {
    const dashboard = this.buildGrafanaDashboard(identity, constraints, tools, isMultiAgent);

    return {
      path: 'observability/dashboards/agent-health.json',
      content: JSON.stringify(dashboard, null, 2),
      type: 'config',
      language: 'json',
    };
  }

  private buildGrafanaDashboard(
    identity: AgentIdentity,
    constraints: AgentConstraints,
    tools: string[],
    isMultiAgent: boolean,
  ): Record<string, unknown> {
    const sanitizedName = identity.name.replace(/[^a-zA-Z0-9_]/g, '_');
    const panels: Record<string, unknown>[] = [];
    let panelId = 1;
    let gridY = 0;

    // ── Row: Overview ─────────────────────────────────
    panels.push(this.createRow('Overview', gridY));
    gridY += 1;

    // Stat panels row
    panels.push(
      this.createStatPanel(
        panelId++,
        'Total Invocations',
        `sum(increase(${sanitizedName}_invocations_total[24h]))`,
        { x: 0, y: gridY, w: 4, h: 4 },
        'none',
        'blue',
      ),
    );
    panels.push(
      this.createStatPanel(
        panelId++,
        'Active Invocations',
        `sum(${sanitizedName}_active_invocations)`,
        { x: 4, y: gridY, w: 4, h: 4 },
        'none',
        'green',
      ),
    );
    panels.push(
      this.createStatPanel(
        panelId++,
        'Error Rate',
        `${sanitizedName}:error_rate_5m`,
        { x: 8, y: gridY, w: 4, h: 4 },
        'percentunit',
        'red',
        [
          { color: 'green', value: null },
          { color: 'orange', value: constraints.maxErrorRate * 0.5 },
          { color: 'red', value: constraints.maxErrorRate },
        ],
      ),
    );
    panels.push(
      this.createStatPanel(
        panelId++,
        'p95 Latency',
        `${sanitizedName}:latency_p95`,
        { x: 12, y: gridY, w: 4, h: 4 },
        's',
        'orange',
        [
          { color: 'green', value: null },
          { color: 'orange', value: constraints.maxLatencySeconds * 0.7 },
          { color: 'red', value: constraints.maxLatencySeconds },
        ],
      ),
    );
    panels.push(
      this.createStatPanel(
        panelId++,
        'Daily Cost',
        `increase(${sanitizedName}_cost_daily_total_dollars[24h])`,
        { x: 16, y: gridY, w: 4, h: 4 },
        'currencyUSD',
        'purple',
        [
          { color: 'green', value: null },
          { color: 'orange', value: constraints.maxCostPerDay * 0.8 },
          { color: 'red', value: constraints.maxCostPerDay },
        ],
      ),
    );
    panels.push(
      this.createStatPanel(
        panelId++,
        'Token Budget Used',
        `${sanitizedName}:token_budget_utilization * 100`,
        { x: 20, y: gridY, w: 4, h: 4 },
        'percent',
        'yellow',
        [
          { color: 'green', value: null },
          { color: 'orange', value: 80 },
          { color: 'red', value: 100 },
        ],
      ),
    );
    gridY += 4;

    // ── Row: Token Usage ──────────────────────────────
    panels.push(this.createRow('Token Usage', gridY));
    gridY += 1;

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Token Usage Over Time',
        [
          {
            expr: `rate(gen_ai_usage_input_tokens_total{gen_ai_agent_name="${identity.name}"}[5m])`,
            legendFormat: 'Input tokens/s',
          },
          {
            expr: `rate(gen_ai_usage_output_tokens_total{gen_ai_agent_name="${identity.name}"}[5m])`,
            legendFormat: 'Output tokens/s',
          },
        ],
        { x: 0, y: gridY, w: 12, h: 8 },
        'tokens/s',
      ),
    );

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Cumulative Token Budget',
        [
          {
            expr: `increase(${sanitizedName}_tokens_daily_total[${this.buildRange('$__range')}])`,
            legendFormat: 'Tokens used',
          },
          {
            expr: `vector(${constraints.maxTokensPerDay})`,
            legendFormat: 'Daily limit',
          },
        ],
        { x: 12, y: gridY, w: 12, h: 8 },
        'tokens',
      ),
    );
    gridY += 8;

    // ── Row: Latency ──────────────────────────────────
    panels.push(this.createRow('Latency', gridY));
    gridY += 1;

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Latency Percentiles (p50 / p95 / p99)',
        [
          {
            expr: `${sanitizedName}:latency_p50`,
            legendFormat: 'p50',
          },
          {
            expr: `${sanitizedName}:latency_p95`,
            legendFormat: 'p95',
          },
          {
            expr: `${sanitizedName}:latency_p99`,
            legendFormat: 'p99',
          },
          {
            expr: `vector(${constraints.maxLatencySeconds})`,
            legendFormat: 'SLO threshold',
          },
        ],
        { x: 0, y: gridY, w: 12, h: 8 },
        's',
      ),
    );

    panels.push(
      this.createHeatmapPanel(
        panelId++,
        'Latency Distribution',
        `sum(rate(gen_ai_client_operation_duration_seconds_bucket{gen_ai_agent_name="${identity.name}"}[5m])) by (le)`,
        { x: 12, y: gridY, w: 12, h: 8 },
      ),
    );
    gridY += 8;

    // ── Row: Cost ─────────────────────────────────────
    panels.push(this.createRow('Cost Per Task', gridY));
    gridY += 1;

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Cost Per Request',
        [
          {
            expr: `rate(${sanitizedName}_cost_per_request_dollars_sum[5m]) / rate(${sanitizedName}_cost_per_request_dollars_count[5m])`,
            legendFormat: 'Avg cost/request',
          },
          {
            expr: `histogram_quantile(0.95, rate(${sanitizedName}_cost_per_request_dollars_bucket[5m]))`,
            legendFormat: 'p95 cost/request',
          },
        ],
        { x: 0, y: gridY, w: 12, h: 8 },
        'currencyUSD',
      ),
    );

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Daily Cost Accumulation',
        [
          {
            expr: `increase(${sanitizedName}_cost_daily_total_dollars[1h])`,
            legendFormat: 'Hourly spend',
          },
          {
            expr: `vector(${constraints.maxCostPerDay / 24})`,
            legendFormat: 'Hourly budget',
          },
        ],
        { x: 12, y: gridY, w: 12, h: 8 },
        'currencyUSD',
      ),
    );
    gridY += 8;

    // ── Row: Error Rate ───────────────────────────────
    panels.push(this.createRow('Error Rate', gridY));
    gridY += 1;

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Error Rate Over Time',
        [
          {
            expr: `${sanitizedName}:error_rate_5m`,
            legendFormat: 'Error rate',
          },
          {
            expr: `vector(${constraints.maxErrorRate})`,
            legendFormat: 'SLO threshold',
          },
        ],
        { x: 0, y: gridY, w: 12, h: 8 },
        'percentunit',
      ),
    );

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Errors by Type',
        [
          {
            expr: `sum by (error_type) (rate(${sanitizedName}_errors_total[5m]))`,
            legendFormat: '{{ error_type }}',
          },
        ],
        { x: 12, y: gridY, w: 12, h: 8 },
        'ops',
      ),
    );
    gridY += 8;

    // ── Row: Tool Call Frequency ──────────────────────
    panels.push(this.createRow('Tool Calls', gridY));
    gridY += 1;

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Tool Call Frequency',
        [
          {
            expr: `sum by (gen_ai_tool_name) (rate(${sanitizedName}_tool_calls_total[5m]))`,
            legendFormat: '{{ gen_ai_tool_name }}',
          },
        ],
        { x: 0, y: gridY, w: 12, h: 8 },
        'ops',
      ),
    );

    panels.push(
      this.createTimeSeriesPanel(
        panelId++,
        'Tool Latency by Tool',
        [
          {
            expr: `histogram_quantile(0.95, sum by (gen_ai_tool_name, le) (rate(${sanitizedName}_tool_duration_seconds_bucket[5m])))`,
            legendFormat: '{{ gen_ai_tool_name }} p95',
          },
        ],
        { x: 12, y: gridY, w: 12, h: 8 },
        's',
      ),
    );
    gridY += 8;

    // Per-tool breakdown table
    if (tools.length > 0) {
      panels.push(
        this.createTablePanel(
          panelId++,
          'Tool Breakdown',
          [
            {
              expr: `sum by (gen_ai_tool_name) (increase(${sanitizedName}_tool_calls_total[24h]))`,
              legendFormat: '{{ gen_ai_tool_name }}',
              format: 'table',
              instant: true,
            },
          ],
          { x: 0, y: gridY, w: 24, h: 6 },
        ),
      );
      gridY += 6;
    }

    // ── Row: Multi-agent (conditional) ────────────────
    if (isMultiAgent) {
      panels.push(this.createRow('Team Coordination', gridY));
      gridY += 1;

      panels.push(
        this.createTimeSeriesPanel(
          panelId++,
          'Handoff Rate',
          [
            {
              expr: `sum by (source_agent, target_agent) (rate(${sanitizedName}_team_handoffs_total[5m]))`,
              legendFormat: '{{ source_agent }} -> {{ target_agent }}',
            },
          ],
          { x: 0, y: gridY, w: 12, h: 8 },
          'ops',
        ),
      );

      panels.push(
        this.createTimeSeriesPanel(
          panelId++,
          'Coordination Overhead',
          [
            {
              expr: `${sanitizedName}:coordination_overhead_ratio`,
              legendFormat: 'Overhead ratio',
            },
            {
              expr: 'vector(0.3)',
              legendFormat: 'Threshold (30%)',
            },
          ],
          { x: 12, y: gridY, w: 12, h: 8 },
          'percentunit',
        ),
      );
      gridY += 8;

      panels.push(
        this.createTimeSeriesPanel(
          panelId++,
          'Member Utilization',
          [
            {
              expr: `${sanitizedName}_team_member_utilization_ratio`,
              legendFormat: '{{ gen_ai_agent_name }} ({{ role }})',
            },
          ],
          { x: 0, y: gridY, w: 24, h: 8 },
          'percentunit',
        ),
      );
      gridY += 8;
    }

    return {
      __inputs: [
        {
          name: 'DS_PROMETHEUS',
          label: 'Prometheus',
          description: 'Prometheus data source for agent metrics',
          type: 'datasource',
          pluginId: 'prometheus',
          pluginName: 'Prometheus',
        },
      ],
      __requires: [
        { type: 'grafana', id: 'grafana', name: 'Grafana', version: '10.0.0' },
        { type: 'datasource', id: 'prometheus', name: 'Prometheus', version: '1.0.0' },
        { type: 'panel', id: 'timeseries', name: 'Time series', version: '' },
        { type: 'panel', id: 'stat', name: 'Stat', version: '' },
        { type: 'panel', id: 'heatmap', name: 'Heatmap', version: '' },
        { type: 'panel', id: 'table', name: 'Table', version: '' },
        { type: 'panel', id: 'row', name: 'Row', version: '' },
      ],
      annotations: {
        list: [
          {
            builtIn: 1,
            datasource: { type: 'grafana', uid: '-- Grafana --' },
            enable: true,
            hide: true,
            iconColor: 'rgba(0, 211, 255, 1)',
            name: 'Annotations & Alerts',
            type: 'dashboard',
          },
        ],
      },
      description: `Health dashboard for OSSA agent: ${identity.name} (${identity.agentKind}, ${identity.pattern} pattern)`,
      editable: true,
      fiscalYearStartMonth: 0,
      graphTooltip: 1, // Shared crosshair
      id: null,
      links: [],
      panels,
      schemaVersion: 39,
      tags: ['ossa', 'agent', identity.name, identity.agentType, identity.pattern],
      templating: {
        list: [
          {
            current: { selected: false, text: 'Prometheus', value: 'Prometheus' },
            hide: 0,
            includeAll: false,
            label: 'Data Source',
            multi: false,
            name: 'datasource',
            options: [],
            query: 'prometheus',
            queryValue: '',
            refresh: 1,
            regex: '',
            skipUrlSync: false,
            type: 'datasource',
          },
          {
            current: { selected: false, text: identity.name, value: identity.name },
            hide: 2,
            label: 'Agent Name',
            name: 'agent_name',
            options: [{ selected: true, text: identity.name, value: identity.name }],
            query: identity.name,
            skipUrlSync: false,
            type: 'constant',
          },
        ],
      },
      time: { from: 'now-6h', to: 'now' },
      timepicker: {},
      timezone: 'browser',
      title: `${identity.name} - Agent Health`,
      uid: `ossa-${sanitizedName}-health`,
      version: 1,
      refresh: '30s',
    };
  }

  // ── Grafana panel builders ──────────────────────────────────────

  private createRow(title: string, gridY: number): Record<string, unknown> {
    return {
      collapsed: false,
      gridPos: { h: 1, w: 24, x: 0, y: gridY },
      id: 1000 + gridY,
      panels: [],
      title,
      type: 'row',
    };
  }

  private createStatPanel(
    id: number,
    title: string,
    expr: string,
    gridPos: { x: number; y: number; w: number; h: number },
    unit: string,
    color: string,
    thresholds?: Array<{ color: string; value: number | null }>,
  ): Record<string, unknown> {
    return {
      id,
      title,
      type: 'stat',
      datasource: { type: 'prometheus', uid: '${datasource}' },
      fieldConfig: {
        defaults: {
          color: { mode: thresholds ? 'thresholds' : 'fixed', fixedColor: color },
          mappings: [],
          thresholds: {
            mode: 'absolute',
            steps: thresholds ?? [
              { color: color, value: null },
            ],
          },
          unit,
        },
        overrides: [],
      },
      gridPos,
      options: {
        colorMode: thresholds ? 'background' : 'value',
        graphMode: 'area',
        justifyMode: 'auto',
        orientation: 'auto',
        reduceOptions: {
          calcs: ['lastNotNull'],
          fields: '',
          values: false,
        },
        textMode: 'auto',
        wideLayout: true,
      },
      targets: [
        {
          datasource: { type: 'prometheus', uid: '${datasource}' },
          expr,
          instant: true,
          legendFormat: '__auto',
          refId: 'A',
        },
      ],
    };
  }

  private createTimeSeriesPanel(
    id: number,
    title: string,
    queries: Array<{ expr: string; legendFormat: string }>,
    gridPos: { x: number; y: number; w: number; h: number },
    unit: string,
  ): Record<string, unknown> {
    return {
      id,
      title,
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: '${datasource}' },
      fieldConfig: {
        defaults: {
          color: { mode: 'palette-classic' },
          custom: {
            axisBorderShow: false,
            axisCenteredZero: false,
            axisColorMode: 'text',
            axisLabel: '',
            axisPlacement: 'auto',
            barAlignment: 0,
            drawStyle: 'line',
            fillOpacity: 10,
            gradientMode: 'none',
            hideFrom: { legend: false, tooltip: false, viz: false },
            insertNulls: false,
            lineInterpolation: 'smooth',
            lineWidth: 2,
            pointSize: 5,
            scaleDistribution: { type: 'linear' },
            showPoints: 'auto',
            spanNulls: false,
            stacking: { group: 'A', mode: 'none' },
            thresholdsStyle: { mode: 'off' },
          },
          mappings: [],
          thresholds: {
            mode: 'absolute',
            steps: [{ color: 'green', value: null }],
          },
          unit,
        },
        overrides: [],
      },
      gridPos,
      options: {
        legend: {
          calcs: ['mean', 'max', 'lastNotNull'],
          displayMode: 'table',
          placement: 'bottom',
          showLegend: true,
        },
        tooltip: { mode: 'multi', sort: 'desc' },
      },
      targets: queries.map((q, i) => ({
        datasource: { type: 'prometheus', uid: '${datasource}' },
        expr: q.expr,
        legendFormat: q.legendFormat,
        refId: String.fromCharCode(65 + i), // A, B, C, ...
      })),
    };
  }

  private createHeatmapPanel(
    id: number,
    title: string,
    expr: string,
    gridPos: { x: number; y: number; w: number; h: number },
  ): Record<string, unknown> {
    return {
      id,
      title,
      type: 'heatmap',
      datasource: { type: 'prometheus', uid: '${datasource}' },
      gridPos,
      options: {
        calculate: false,
        cellGap: 1,
        color: {
          exponent: 0.5,
          fill: 'dark-orange',
          mode: 'scheme',
          reverse: false,
          scale: 'exponential',
          scheme: 'Oranges',
          steps: 64,
        },
        exemplars: { color: 'rgba(255,0,255,0.7)' },
        filterValues: { le: 1e-9 },
        legend: { show: true },
        rowsFrame: { layout: 'le' },
        showValue: 'auto',
        tooltip: { mode: 'single', showColorScale: false, yHistogram: false },
        yAxis: {
          axisPlacement: 'left',
          reverse: false,
          unit: 's',
        },
      },
      targets: [
        {
          datasource: { type: 'prometheus', uid: '${datasource}' },
          expr,
          format: 'heatmap',
          legendFormat: '{{ le }}',
          refId: 'A',
        },
      ],
    };
  }

  private createTablePanel(
    id: number,
    title: string,
    queries: Array<{ expr: string; legendFormat: string; format: string; instant: boolean }>,
    gridPos: { x: number; y: number; w: number; h: number },
  ): Record<string, unknown> {
    return {
      id,
      title,
      type: 'table',
      datasource: { type: 'prometheus', uid: '${datasource}' },
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          custom: {
            align: 'auto',
            cellOptions: { type: 'auto' },
            inspect: false,
          },
          mappings: [],
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: 'green', value: null },
              { color: 'red', value: 80 },
            ],
          },
        },
        overrides: [
          {
            matcher: { id: 'byName', options: 'gen_ai_tool_name' },
            properties: [{ id: 'displayName', value: 'Tool' }],
          },
          {
            matcher: { id: 'byName', options: 'Value' },
            properties: [{ id: 'displayName', value: 'Calls (24h)' }],
          },
        ],
      },
      gridPos,
      options: {
        cellHeight: 'sm',
        footer: { countRows: false, fields: '', reducer: ['sum'], show: true },
        showHeader: true,
        sortBy: [{ desc: true, displayName: 'Calls (24h)' }],
      },
      targets: queries.map((q, i) => ({
        datasource: { type: 'prometheus', uid: '${datasource}' },
        expr: q.expr,
        format: q.format,
        instant: q.instant,
        legendFormat: q.legendFormat,
        refId: String.fromCharCode(65 + i),
      })),
      transformations: [
        {
          id: 'merge',
          options: {},
        },
        {
          id: 'organize',
          options: {
            excludeByName: { Time: true, __name__: true },
            indexByName: {},
            renameByName: {},
          },
        },
      ],
    };
  }

  /**
   * Build a range expression for PromQL that works with Grafana variables.
   * Falls back to a static range if no variable is available.
   */
  private buildRange(variable: string): string {
    return variable;
  }
}
