/**
 * GitLab Duo Flow Generator
 * Generates Flow Registry v1 configurations from OSSA manifests
 */

import type { OssaAgent } from '../../types/index.js';
import type {
  GitLabDuoFlow,
  FlowEnvironment,
  FlowComponent,
  AgentComponent,
  FlowRouter,
  FlowPrompt,
  PromptModelParams,
} from './types.js';
import YAML from 'yaml';

export class GitLabDuoFlowGenerator {
  /**
   * Generate complete Flow Registry v1 configuration
   */
  generate(manifest: OssaAgent): GitLabDuoFlow {
    const agentName = this.sanitizeName(manifest.metadata?.name || 'agent');
    const environment = this.determineEnvironment(manifest);

    const flow: GitLabDuoFlow = {
      version: 'v1',
      environment,
      name: manifest.metadata?.name || 'Unnamed Agent',
      description: manifest.metadata?.description || '',
      product_group: 'agent_foundations',
      components: this.generateComponents(manifest, agentName),
      routers: this.generateRouters(manifest, agentName),
      prompts: this.generatePrompts(manifest, agentName),
      flow: {
        entry_point: agentName,
      },
    };

    return flow;
  }

  /**
   * Generate YAML string from flow configuration
   */
  generateYAML(manifest: OssaAgent): string {
    const flow = this.generate(manifest);
    return YAML.stringify(flow, {
      indent: 2,
      lineWidth: 0,
    });
  }

  /**
   * Determine environment type based on OSSA autonomy configuration
   */
  private determineEnvironment(manifest: OssaAgent): FlowEnvironment {
    const spec = manifest.spec as Record<string, unknown>;
    const autonomy = spec.autonomy as
      | {
          level?: string;
          approvalRequired?: string[];
          maxTurns?: number;
        }
      | undefined;

    const tools = (spec.tools as unknown[]) || [];

    // Autonomous with no approval = ambient (hands-off)
    if (
      autonomy?.level === 'autonomous' &&
      (!autonomy.approvalRequired || autonomy.approvalRequired.length === 0)
    ) {
      return 'ambient';
    }

    // Single-turn, no tools = chat-partial (simple conversation)
    if (autonomy?.maxTurns === 1 && tools.length === 0) {
      return 'chat-partial';
    }

    // Default to chat (collaborative)
    return 'chat';
  }

  /**
   * Generate components (AgentComponent for now)
   */
  private generateComponents(manifest: OssaAgent, agentName: string): FlowComponent[] {
    const spec = manifest.spec as Record<string, unknown>;
    const tools = (spec.tools as Array<{ name?: string }>) || [];

    // Map OSSA tools to GitLab MCP tools
    const toolset = this.mapTools(tools);

    const component: AgentComponent = {
      name: agentName,
      type: 'AgentComponent',
      prompt_id: `${agentName}_prompt`,
      prompt_version: null, // Local prompt (no version)
      inputs: [
        {
          from: 'context:goal',
          as: 'task',
        },
      ],
      toolset,
      ui_log_events: [
        'on_agent_final_answer',
        'on_tool_execution_success',
        'on_tool_execution_failed',
      ],
      ui_role_as: 'agent',
    };

    return [component];
  }

  /**
   * Map OSSA tools to GitLab MCP tools
   */
  private mapTools(ossaTools: Array<{ name?: string }>): string[] {
    const toolMapping: Record<string, string> = {
      // File operations
      read: 'read_file',
      write: 'create_file_with_contents',
      update: 'update_file',
      list: 'list_dir',
      search: 'search_files',

      // GitLab operations
      'create-issue': 'create_issue',
      'create-mr': 'create_merge_request',
      comment: 'add_comment',

      // Shell
      shell: 'execute_shell_command',
      exec: 'execute_shell_command',
    };

    const mappedTools: string[] = [];

    for (const tool of ossaTools) {
      const toolName = tool.name?.toLowerCase() || '';
      const mappedTool = toolMapping[toolName];

      if (mappedTool) {
        mappedTools.push(mappedTool);
      } else {
        // Default to read_file for unknown tools
        mappedTools.push('read_file');
      }
    }

    // Always include basic file operations
    const defaultTools = ['read_file', 'list_dir', 'search_files'];
    const uniqueTools = Array.from(new Set([...defaultTools, ...mappedTools]));

    return uniqueTools;
  }

  /**
   * Generate routers (simple linear flow for single-component)
   */
  private generateRouters(manifest: OssaAgent, agentName: string): FlowRouter[] {
    // For single-component flows, just route to end
    return [
      {
        from: agentName,
        to: 'end',
      },
    ];
  }

  /**
   * Generate inline prompt definitions
   */
  private generatePrompts(manifest: OssaAgent, agentName: string): FlowPrompt[] {
    const spec = manifest.spec as Record<string, unknown>;
    const role = (spec.role as string) || 'You are a helpful AI assistant';
    const llm = spec.llm as
      | {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
        }
      | undefined;

    // Map provider
    const modelClassProvider = this.mapProvider(llm?.provider || 'anthropic');

    // Build model params
    const modelParams: PromptModelParams = {
      model_class_provider: modelClassProvider,
      model: llm?.model || this.getDefaultModel(modelClassProvider),
      max_tokens: llm?.maxTokens || 4096,
      temperature: llm?.temperature ?? 0.7,
    };

    const prompt: FlowPrompt = {
      prompt_id: `${agentName}_prompt`,
      name: `${manifest.metadata?.name || 'Agent'} System Prompt`,
      model: {
        params: modelParams,
      },
      unit_primitives: [],
      prompt_template: {
        system: role,
        user: '{{task}}',
        placeholder: 'history', // Enable conversation history
      },
      params: {
        timeout: 180,
        stop: [],
      },
    };

    return [prompt];
  }

  /**
   * Map OSSA provider to GitLab provider
   */
  private mapProvider(provider: string): 'anthropic' | 'openai' | 'vertexai' {
    const normalized = provider.toLowerCase();

    if (normalized.includes('anthropic') || normalized.includes('claude')) {
      return 'anthropic';
    }

    if (normalized.includes('openai') || normalized.includes('gpt')) {
      return 'openai';
    }

    if (normalized.includes('google') || normalized.includes('vertex') || normalized.includes('gemini')) {
      return 'vertexai';
    }

    // Default to anthropic
    return 'anthropic';
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: 'anthropic' | 'openai' | 'vertexai'): string {
    const defaults: Record<string, string> = {
      anthropic: 'claude-sonnet-4-20250514',
      openai: 'gpt-4o-mini',
      vertexai: 'gemini-1.5-pro',
    };

    return defaults[provider];
  }

  /**
   * Generate all flow YAML files (main + error + monitor + governance)
   * Returns a map of filename -> YAML content
   */
  generateAllFlowFiles(manifest: OssaAgent): Map<string, string> {
    const agentName = this.sanitizeName(manifest.metadata?.name || 'agent');
    const files = new Map<string, string>();

    // Main flow (enhanced)
    files.set('main.yaml', this.generateYAML(manifest));

    // Error handling flow
    files.set('error.yaml', this.generateErrorFlowYAML(manifest, agentName));

    // Monitoring/observability flow
    files.set('monitor.yaml', this.generateMonitorFlowYAML(manifest, agentName));

    // Governance/compliance flow
    files.set('governance.yaml', this.generateGovernanceFlowYAML(manifest, agentName));

    return files;
  }

  /**
   * Generate error handling flow with retry logic and fallback paths.
   * This flow intercepts errors from the main flow, attempts retries with
   * exponential backoff, and provides graceful degradation.
   */
  private generateErrorFlowYAML(manifest: OssaAgent, agentName: string): string {
    const spec = manifest.spec as Record<string, unknown>;
    const llm = spec.llm as { provider?: string; model?: string; temperature?: number; maxTokens?: number } | undefined;
    const modelClassProvider = this.mapProvider(llm?.provider || 'anthropic');

    const errorFlow: GitLabDuoFlow = {
      version: 'v1',
      environment: 'ambient',
      name: `${manifest.metadata?.name || 'Agent'} - Error Handler`,
      description: `Error handling and retry logic for ${manifest.metadata?.name || 'agent'}. Intercepts failures, classifies errors, and either retries with backoff or routes to fallback behavior.`,
      product_group: 'agent_foundations',
      components: [
        {
          name: `${agentName}_error_classifier`,
          type: 'AgentComponent',
          prompt_id: `${agentName}_error_classifier_prompt`,
          prompt_version: null,
          inputs: [
            { from: 'context:error_message', as: 'error' },
            { from: 'context:error_source', as: 'source_component' },
            { from: 'context:execution_id', as: 'execution_id' },
          ],
          toolset: ['read_file', 'list_dir'],
          ui_log_events: ['on_agent_final_answer', 'on_tool_execution_failed'],
          ui_role_as: 'agent',
        },
        {
          name: `${agentName}_retry_handler`,
          type: 'DeterministicStepComponent',
          tool_name: 'retry_with_backoff',
          toolset: ['retry_with_backoff'],
          inputs: [
            { from: `${agentName}_error_classifier:retry_config`, as: 'config' },
            { from: 'context:original_input', as: 'input' },
          ],
          ui_log_events: ['on_tool_execution_success', 'on_tool_execution_failed'],
          ui_role_as: 'tool',
        },
        {
          name: `${agentName}_fallback_responder`,
          type: 'AgentComponent',
          prompt_id: `${agentName}_fallback_prompt`,
          prompt_version: null,
          inputs: [
            { from: `${agentName}_error_classifier:error_classification`, as: 'error_details' },
            { from: 'context:original_input', as: 'original_task' },
          ],
          toolset: ['add_comment', 'create_issue'],
          ui_log_events: ['on_agent_final_answer'],
          ui_role_as: 'agent',
        },
      ],
      routers: [
        {
          from: `${agentName}_error_classifier`,
          condition: {
            input: 'error_action',
            routes: {
              retry: `${agentName}_retry_handler`,
              fallback: `${agentName}_fallback_responder`,
              ignore: 'end',
            },
          },
        },
        {
          from: `${agentName}_retry_handler`,
          condition: {
            input: 'retry_result',
            routes: {
              success: 'end',
              max_retries_exceeded: `${agentName}_fallback_responder`,
            },
          },
        },
        {
          from: `${agentName}_fallback_responder`,
          to: 'end',
        },
      ],
      prompts: [
        {
          prompt_id: `${agentName}_error_classifier_prompt`,
          name: 'Error Classification Prompt',
          model: {
            params: {
              model_class_provider: modelClassProvider,
              model: llm?.model || this.getDefaultModel(modelClassProvider),
              max_tokens: 1024,
              temperature: 0.1,
            },
          },
          unit_primitives: [],
          prompt_template: {
            system: `You are an error classification agent for ${manifest.metadata?.name || 'agent'}. Analyze the error and determine the appropriate action:
- "retry": Transient errors (network timeout, rate limit, temporary unavailability). Set retry_config with max_retries (1-3), backoff_ms (1000-10000), and the original operation details.
- "fallback": Permanent errors (invalid input, missing permissions, unsupported operation). Provide a clear error_classification with category, severity, and suggested resolution.
- "ignore": Non-critical warnings that don't affect the outcome.

Respond with structured JSON containing error_action, retry_config (if retry), and error_classification.`,
            user: 'Error from {{source_component}} (execution: {{execution_id}}):\n\n{{error}}',
          },
          params: {
            timeout: 30,
            stop: [],
          },
        },
        {
          prompt_id: `${agentName}_fallback_prompt`,
          name: 'Fallback Response Prompt',
          model: {
            params: {
              model_class_provider: modelClassProvider,
              model: llm?.model || this.getDefaultModel(modelClassProvider),
              max_tokens: 2048,
              temperature: 0.3,
            },
          },
          unit_primitives: [],
          prompt_template: {
            system: `You are the fallback handler for ${manifest.metadata?.name || 'agent'}. The primary execution failed and cannot be retried. Your job is to:
1. Acknowledge the failure clearly and professionally
2. Explain what went wrong in user-friendly language
3. Suggest alternative approaches or manual steps the user can take
4. If appropriate, create a GitLab issue to track the failure for engineering follow-up

Never expose internal error details, stack traces, or sensitive information.`,
            user: 'Original task: {{original_task}}\n\nError details: {{error_details}}',
          },
          params: {
            timeout: 60,
            stop: [],
          },
        },
      ],
      flow: {
        entry_point: `${agentName}_error_classifier`,
      },
    };

    return YAML.stringify(errorFlow, { indent: 2, lineWidth: 0 });
  }

  /**
   * Generate monitoring/observability flow.
   * This flow collects execution metrics, tracks performance, and emits
   * structured telemetry for dashboards and alerting.
   */
  private generateMonitorFlowYAML(manifest: OssaAgent, agentName: string): string {
    const spec = manifest.spec as Record<string, unknown>;
    const llm = spec.llm as { provider?: string; model?: string; temperature?: number; maxTokens?: number } | undefined;
    const modelClassProvider = this.mapProvider(llm?.provider || 'anthropic');

    const monitorFlow: GitLabDuoFlow = {
      version: 'v1',
      environment: 'ambient',
      name: `${manifest.metadata?.name || 'Agent'} - Monitor`,
      description: `Monitoring and observability flow for ${manifest.metadata?.name || 'agent'}. Collects execution metrics, analyzes performance trends, and generates health reports.`,
      product_group: 'agent_foundations',
      components: [
        {
          name: `${agentName}_metrics_collector`,
          type: 'DeterministicStepComponent',
          tool_name: 'collect_agent_metrics',
          toolset: ['collect_agent_metrics', 'read_file'],
          inputs: [
            { from: 'context:agent_name', as: 'agent_name', literal: true },
            { from: 'context:time_window', as: 'window' },
          ],
          ui_log_events: ['on_tool_execution_success'],
          ui_role_as: 'tool',
        },
        {
          name: `${agentName}_health_analyzer`,
          type: 'AgentComponent',
          prompt_id: `${agentName}_health_analyzer_prompt`,
          prompt_version: null,
          inputs: [
            { from: `${agentName}_metrics_collector:metrics`, as: 'metrics_data' },
            { from: 'context:thresholds', as: 'alert_thresholds' },
          ],
          toolset: ['read_file', 'search_files'],
          ui_log_events: ['on_agent_final_answer'],
          ui_role_as: 'agent',
        },
        {
          name: `${agentName}_alert_dispatcher`,
          type: 'DeterministicStepComponent',
          tool_name: 'dispatch_alert',
          toolset: ['dispatch_alert', 'add_comment', 'create_issue'],
          inputs: [
            { from: `${agentName}_health_analyzer:alerts`, as: 'alert_payload' },
            { from: `${agentName}_health_analyzer:health_status`, as: 'status' },
          ],
          ui_log_events: ['on_tool_execution_success', 'on_tool_execution_failed'],
          ui_role_as: 'tool',
        },
      ],
      routers: [
        {
          from: `${agentName}_metrics_collector`,
          to: `${agentName}_health_analyzer`,
        },
        {
          from: `${agentName}_health_analyzer`,
          condition: {
            input: 'health_status',
            routes: {
              healthy: 'end',
              degraded: `${agentName}_alert_dispatcher`,
              critical: `${agentName}_alert_dispatcher`,
            },
          },
        },
        {
          from: `${agentName}_alert_dispatcher`,
          to: 'end',
        },
      ],
      prompts: [
        {
          prompt_id: `${agentName}_health_analyzer_prompt`,
          name: 'Health Analysis Prompt',
          model: {
            params: {
              model_class_provider: modelClassProvider,
              model: llm?.model || this.getDefaultModel(modelClassProvider),
              max_tokens: 2048,
              temperature: 0.1,
            },
          },
          unit_primitives: [],
          prompt_template: {
            system: `You are a monitoring analyst for the ${manifest.metadata?.name || 'agent'} GitLab Duo agent. Analyze the collected metrics and determine health status.

Evaluate:
- **Response time**: p50 < 5s (healthy), p95 < 15s (healthy), p99 < 30s (acceptable)
- **Success rate**: > 98% (healthy), > 95% (degraded), < 95% (critical)
- **Error rate**: < 2% (healthy), < 5% (degraded), >= 5% (critical)
- **Token usage**: Track trends, alert if > 90% of configured limit
- **Tool call failures**: < 3% (healthy), > 3% (degraded), > 10% (critical)

Respond with structured JSON:
{
  "health_status": "healthy" | "degraded" | "critical",
  "summary": "Brief health summary",
  "metrics_analysis": { ... per-metric breakdown },
  "alerts": [ ... array of alert objects if degraded/critical ],
  "recommendations": [ ... suggested optimizations ]
}`,
            user: 'Metrics data:\n{{metrics_data}}\n\nAlert thresholds:\n{{alert_thresholds}}',
          },
          params: {
            timeout: 60,
            stop: [],
          },
        },
      ],
      flow: {
        entry_point: `${agentName}_metrics_collector`,
      },
    };

    return YAML.stringify(monitorFlow, { indent: 2, lineWidth: 0 });
  }

  /**
   * Generate governance/compliance flow.
   * This flow validates agent actions against policies, checks permissions,
   * and ensures compliance with organizational rules before execution proceeds.
   */
  private generateGovernanceFlowYAML(manifest: OssaAgent, agentName: string): string {
    const spec = manifest.spec as Record<string, unknown>;
    const llm = spec.llm as { provider?: string; model?: string; temperature?: number; maxTokens?: number } | undefined;
    const modelClassProvider = this.mapProvider(llm?.provider || 'anthropic');

    const governanceFlow: GitLabDuoFlow = {
      version: 'v1',
      environment: 'ambient',
      name: `${manifest.metadata?.name || 'Agent'} - Governance`,
      description: `Governance and compliance checks for ${manifest.metadata?.name || 'agent'}. Validates permissions, enforces policies, and audits agent actions before and after execution.`,
      product_group: 'agent_foundations',
      components: [
        {
          name: `${agentName}_policy_validator`,
          type: 'AgentComponent',
          prompt_id: `${agentName}_policy_validator_prompt`,
          prompt_version: null,
          inputs: [
            { from: 'context:action_request', as: 'proposed_action' },
            { from: 'context:user_role', as: 'invoking_user_role' },
            { from: 'context:project_policies', as: 'policies' },
          ],
          toolset: ['read_file', 'search_files'],
          ui_log_events: ['on_agent_final_answer'],
          ui_role_as: 'agent',
        },
        {
          name: `${agentName}_permission_checker`,
          type: 'DeterministicStepComponent',
          tool_name: 'check_permissions',
          toolset: ['check_permissions'],
          inputs: [
            { from: `${agentName}_policy_validator:required_permissions`, as: 'permissions' },
            { from: 'context:user_role', as: 'user_role' },
            { from: 'context:project_path', as: 'project' },
          ],
          ui_log_events: ['on_tool_execution_success', 'on_tool_execution_failed'],
          ui_role_as: 'tool',
        },
        {
          name: `${agentName}_audit_logger`,
          type: 'DeterministicStepComponent',
          tool_name: 'write_audit_log',
          toolset: ['write_audit_log', 'add_comment'],
          inputs: [
            { from: `${agentName}_policy_validator:policy_decision`, as: 'decision' },
            { from: `${agentName}_permission_checker:permission_result`, as: 'permission_check' },
            { from: 'context:action_request', as: 'original_action' },
            { from: 'context:execution_id', as: 'execution_id' },
          ],
          ui_log_events: ['on_tool_execution_success'],
          ui_role_as: 'tool',
        },
        {
          name: `${agentName}_compliance_reporter`,
          type: 'AgentComponent',
          prompt_id: `${agentName}_compliance_reporter_prompt`,
          prompt_version: null,
          inputs: [
            { from: `${agentName}_policy_validator:policy_decision`, as: 'policy_result' },
            { from: `${agentName}_permission_checker:permission_result`, as: 'permission_result' },
            { from: 'context:action_request', as: 'proposed_action' },
          ],
          toolset: ['add_comment', 'create_issue'],
          ui_log_events: ['on_agent_final_answer'],
          ui_role_as: 'agent',
        },
      ],
      routers: [
        {
          from: `${agentName}_policy_validator`,
          condition: {
            input: 'policy_decision',
            routes: {
              approved: `${agentName}_permission_checker`,
              denied: `${agentName}_audit_logger`,
              requires_review: `${agentName}_compliance_reporter`,
            },
          },
        },
        {
          from: `${agentName}_permission_checker`,
          condition: {
            input: 'permission_result',
            routes: {
              granted: `${agentName}_audit_logger`,
              denied: `${agentName}_compliance_reporter`,
            },
          },
        },
        {
          from: `${agentName}_audit_logger`,
          to: 'end',
        },
        {
          from: `${agentName}_compliance_reporter`,
          to: `${agentName}_audit_logger`,
        },
      ],
      prompts: [
        {
          prompt_id: `${agentName}_policy_validator_prompt`,
          name: 'Policy Validation Prompt',
          model: {
            params: {
              model_class_provider: modelClassProvider,
              model: llm?.model || this.getDefaultModel(modelClassProvider),
              max_tokens: 2048,
              temperature: 0.0,
            },
          },
          unit_primitives: [],
          prompt_template: {
            system: `You are a policy enforcement agent for ${manifest.metadata?.name || 'agent'}. Evaluate proposed actions against organizational policies.

Policies to check:
- **Data access**: Agent must not access files outside the project scope
- **Write operations**: Require at minimum Developer role; destructive operations require Maintainer
- **External calls**: Must be to approved endpoints only
- **PII handling**: Never include PII in comments or logs
- **Branch protection**: Cannot push directly to protected branches
- **Token scope**: Actions must be within the token's granted scopes
- **Rate limits**: Respect API rate limits, batch operations where possible

Respond with structured JSON:
{
  "policy_decision": "approved" | "denied" | "requires_review",
  "required_permissions": ["list", "of", "required", "permissions"],
  "violations": [ ... array of policy violations if denied ],
  "conditions": [ ... conditions that must be met if approved ],
  "reasoning": "Explanation of the decision"
}`,
            user: 'Proposed action: {{proposed_action}}\nUser role: {{invoking_user_role}}\nProject policies: {{policies}}',
          },
          params: {
            timeout: 30,
            stop: [],
          },
        },
        {
          prompt_id: `${agentName}_compliance_reporter_prompt`,
          name: 'Compliance Report Prompt',
          model: {
            params: {
              model_class_provider: modelClassProvider,
              model: llm?.model || this.getDefaultModel(modelClassProvider),
              max_tokens: 2048,
              temperature: 0.2,
            },
          },
          unit_primitives: [],
          prompt_template: {
            system: `You are a compliance reporter for ${manifest.metadata?.name || 'agent'}. Generate a clear, actionable compliance report when an action is blocked or requires review.

Include:
1. What was attempted and why it was blocked
2. Which specific policy or permission was violated
3. What the user can do to proceed (e.g., request elevated permissions, modify the action scope)
4. Whether a GitLab issue should be created for tracking

Be professional, concise, and non-technical where possible. Post the report as a GitLab comment on the relevant issue or MR.`,
            user: 'Policy result: {{policy_result}}\nPermission result: {{permission_result}}\nProposed action: {{proposed_action}}',
          },
          params: {
            timeout: 60,
            stop: [],
          },
        },
      ],
      flow: {
        entry_point: `${agentName}_policy_validator`,
      },
    };

    return YAML.stringify(governanceFlow, { indent: 2, lineWidth: 0 });
  }

  /**
   * Sanitize name for use in Flow Registry
   * Must be alphanumeric + underscores only
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }
}
