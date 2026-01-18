/**
 * CrewAI to OSSA Converter
 *
 * Converts CrewAI agent and crew configurations to OSSA manifests.
 * Supports: Agent, Crew, Task definitions
 */

import type {
  FrameworkConverter,
  ConversionResult,
  ConverterOptions,
  OSSAManifest,
  AgentSpec,
  WorkflowSpec,
} from '../types.js';

export interface CrewAIAgentConfig {
  role?: string;
  goal?: string;
  backstory?: string;
  tools?: Array<{
    name?: string;
    description?: string;
    [key: string]: unknown;
  }>;
  llm?: {
    model?: string;
    temperature?: number;
    [key: string]: unknown;
  };
  verbose?: boolean;
  allow_delegation?: boolean;
  max_iter?: number;
  memory?: boolean;
  [key: string]: unknown;
}

export interface CrewAICrewConfig {
  agents?: CrewAIAgentConfig[];
  tasks?: Array<{
    description?: string;
    agent?: string | CrewAIAgentConfig;
    expected_output?: string;
    [key: string]: unknown;
  }>;
  process?: string;
  verbose?: boolean;
  [key: string]: unknown;
}

export class CrewAIConverter implements FrameworkConverter {
  name = 'crewai';
  version = '0.3.5';

  async validate(input: unknown): Promise<boolean> {
    if (typeof input !== 'object' || input === null) {
      return false;
    }

    const config = input as Record<string, unknown>;

    // CrewAI configs have role/goal/backstory (Agent) or agents/tasks (Crew)
    return (
      ('role' in config && 'goal' in config) ||
      ('agents' in config && 'tasks' in config)
    );
  }

  async convert(
    input: unknown,
    options: ConverterOptions = {}
  ): Promise<ConversionResult> {
    const warnings: string[] = [];
    const config = input as CrewAIAgentConfig | CrewAICrewConfig;

    // Detect if this is a single agent or a crew
    if ('agents' in config && Array.isArray(config.agents)) {
      return this.convertCrew(config as CrewAICrewConfig, options, warnings);
    } else {
      return this.convertAgent(config as CrewAIAgentConfig, options, warnings);
    }
  }

  private async convertAgent(
    config: CrewAIAgentConfig,
    options: ConverterOptions,
    warnings: string[]
  ): Promise<ConversionResult> {
    const llmInfo = this.detectLLM(config, warnings);
    const tools = this.extractTools(config, warnings);

    const spec: AgentSpec = {
      role: config.role || config.goal || 'CrewAI Agent',
      llm: llmInfo,
      tools: tools.length > 0 ? tools : undefined,
      capabilities: this.extractCapabilities(config, warnings),
      safety: config.allow_delegation
        ? undefined
        : {
            guardrails: {
              blocked_actions: ['delegate_to_other_agent'],
            },
          },
    };

    const manifest: OSSAManifest = {
      apiVersion: `ossa/v${options.target_version || '0.3'}`,
      kind: 'Agent',
      metadata: {
        name: this.sanitizeName(config.role || 'crewai_agent'),
        version: '1.0.0',
        description: config.goal || config.backstory || 'Converted from CrewAI agent',
        labels: {
          'ossa.io/source-framework': 'crewai',
          'ossa.io/converted': 'true',
        },
        annotations: {
          'ossa.io/original-role': config.role || 'unknown',
          'ossa.io/delegation-allowed': String(config.allow_delegation ?? true),
        },
      },
      spec,
    };

    return {
      manifest,
      warnings,
      metadata: {
        source_framework: 'crewai',
        conversion_time: new Date().toISOString(),
        ossa_version: options.target_version || '0.3.5',
      },
    };
  }

  private async convertCrew(
    config: CrewAICrewConfig,
    options: ConverterOptions,
    warnings: string[]
  ): Promise<ConversionResult> {
    const agents = config.agents || [];
    const tasks = config.tasks || [];

    // Build workflow spec
    const spec: WorkflowSpec = {
      agents: agents.map((agent, idx) => ({
        name: this.sanitizeName(agent.role || `agent_${idx}`),
        role: agent.role || agent.goal,
      })),
      steps: tasks.map((task, idx) => {
        const agentName =
          typeof task.agent === 'string'
            ? task.agent
            : task.agent && 'role' in task.agent
            ? this.sanitizeName(task.agent.role || `agent_${idx}`)
            : `agent_${idx}`;

        return {
          id: `task_${idx}`,
          name: task.description?.substring(0, 50) || `Task ${idx + 1}`,
          kind: 'Task' as const,
          ref: agentName,
          depends_on: idx > 0 && config.process === 'sequential' ? [`task_${idx - 1}`] : undefined,
        };
      }),
    };

    const manifest: OSSAManifest = {
      apiVersion: `ossa/v${options.target_version || '0.3'}`,
      kind: 'Workflow',
      metadata: {
        name: 'crewai_workflow',
        version: '1.0.0',
        description: `Converted CrewAI crew with ${agents.length} agents and ${tasks.length} tasks`,
        labels: {
          'ossa.io/source-framework': 'crewai',
          'ossa.io/converted': 'true',
        },
        annotations: {
          'ossa.io/process-type': config.process || 'sequential',
        },
      },
      spec,
    };

    if (config.process === 'hierarchical') {
      warnings.push(
        'CrewAI hierarchical process detected - manual review recommended for manager agent setup'
      );
    }

    return {
      manifest,
      warnings,
      metadata: {
        source_framework: 'crewai',
        conversion_time: new Date().toISOString(),
        ossa_version: options.target_version || '0.3.5',
      },
    };
  }

  private detectLLM(
    config: CrewAIAgentConfig,
    warnings: string[]
  ): AgentSpec['llm'] {
    if (!config.llm) {
      warnings.push('No LLM configuration found - using default');
      return {
        provider: 'openai',
        model: 'gpt-4',
      };
    }

    const modelName = config.llm.model || 'gpt-4';

    let provider = 'openai';
    if (modelName.includes('claude')) {
      provider = 'anthropic';
    } else if (modelName.includes('gemini')) {
      provider = 'google';
    }

    return {
      provider,
      model: modelName,
      temperature: config.llm.temperature,
    };
  }

  private extractTools(
    config: CrewAIAgentConfig,
    warnings: string[]
  ): NonNullable<AgentSpec['tools']> {
    const tools = config.tools;

    if (!Array.isArray(tools)) {
      return [];
    }

    return tools.map((tool) => ({
      name: tool.name || 'unnamed-tool',
      description: tool.description,
      handler: {
        runtime: 'crewai',
        capability: tool.name || 'unknown',
      },
    }));
  }

  private extractCapabilities(
    config: CrewAIAgentConfig,
    warnings: string[]
  ): AgentSpec['capabilities'] {
    const capabilities: NonNullable<AgentSpec['capabilities']> = [];

    if (config.allow_delegation) {
      capabilities.push({
        name: 'delegation',
        description: 'Can delegate tasks to other agents',
      });
    }

    if (config.memory) {
      capabilities.push({
        name: 'memory',
        description: 'Long-term memory enabled',
      });
    }

    if (config.max_iter && config.max_iter > 15) {
      capabilities.push({
        name: 'complex_reasoning',
        description: 'Configured for complex multi-step reasoning',
      });
    }

    return capabilities.length > 0 ? capabilities : undefined;
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

export const crewaiConverter = new CrewAIConverter();
