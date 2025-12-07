/**
 * OSSA Drupal Runtime Adapter
 *
 * Adapts OSSA Task/Workflow/Agent manifests to Drupal execution models:
 * - ECA (Event-Condition-Action) for Task kinds
 * - Maestro for Workflow BPM
 * - FlowDrop for visual DAG workflows
 * - AI Agent Runner for Agent kinds
 * - Minikanban for task decomposition
 */

export interface DrupalAdapterConfig {
  /** Drupal site base URL */
  baseUrl: string;
  /** API authentication */
  auth: {
    type: 'session' | 'oauth' | 'api-key';
    credentials: {
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
    };
  };
  /** Default execution model */
  defaultExecutionModel?: DrupalExecutionModel;
}

export type DrupalExecutionModel = 'eca' | 'maestro' | 'flowdrop' | 'ai-agent-runner' | 'minikanban';

export interface OSSAManifest {
  apiVersion: string;
  kind: 'Task' | 'Workflow' | 'Agent';
  metadata: {
    name: string;
    version: string;
    [key: string]: unknown;
  };
  spec: Record<string, unknown>;
}

export interface DrupalExecutionResult {
  success: boolean;
  executionId: string;
  model: DrupalExecutionModel;
  output?: unknown;
  error?: string;
}

/**
 * Map OSSA kinds to Drupal execution models
 */
export const KIND_TO_MODEL_MAP: Record<string, DrupalExecutionModel[]> = {
  Task: ['eca', 'minikanban'],
  Workflow: ['maestro', 'flowdrop', 'minikanban'],
  Agent: ['ai-agent-runner'],
};

export class DrupalAdapter {
  private config: DrupalAdapterConfig;
  private sessionToken?: string;

  constructor(config: DrupalAdapterConfig) {
    this.config = config;
  }

  /**
   * Execute an OSSA manifest in Drupal
   */
  async execute(manifest: OSSAManifest, model?: DrupalExecutionModel): Promise<DrupalExecutionResult> {
    const executionModel = model || this.selectExecutionModel(manifest);

    // Authenticate if needed
    await this.authenticate();

    switch (executionModel) {
      case 'eca':
        return this.executeECA(manifest);
      case 'maestro':
        return this.executeMaestro(manifest);
      case 'flowdrop':
        return this.executeFlowDrop(manifest);
      case 'ai-agent-runner':
        return this.executeAIAgentRunner(manifest);
      case 'minikanban':
        return this.executeMinikanban(manifest);
      default:
        throw new Error(`Unknown execution model: ${executionModel}`);
    }
  }

  /**
   * Select the best execution model for a manifest
   */
  selectExecutionModel(manifest: OSSAManifest): DrupalExecutionModel {
    const kind = manifest.kind;
    const availableModels = KIND_TO_MODEL_MAP[kind];

    if (!availableModels || availableModels.length === 0) {
      throw new Error(`No execution model available for kind: ${kind}`);
    }

    // Use default if set and compatible
    if (
      this.config.defaultExecutionModel &&
      availableModels.includes(this.config.defaultExecutionModel)
    ) {
      return this.config.defaultExecutionModel;
    }

    // Return first compatible model
    return availableModels[0];
  }

  /**
   * Authenticate with Drupal
   */
  private async authenticate(): Promise<void> {
    if (this.sessionToken) return;

    const { auth } = this.config;

    switch (auth.type) {
      case 'session':
        this.sessionToken = await this.sessionLogin(
          auth.credentials.username!,
          auth.credentials.password!
        );
        break;
      case 'oauth':
        this.sessionToken = auth.credentials.token;
        break;
      case 'api-key':
        this.sessionToken = auth.credentials.apiKey;
        break;
    }
  }

  private async sessionLogin(username: string, password: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/user/login?_format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: username, pass: password }),
    });

    if (!response.ok) {
      throw new Error(`Drupal login failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { csrf_token?: string };
    return data.csrf_token || '';
  }

  /**
   * Execute via ECA (Event-Condition-Action)
   */
  private async executeECA(manifest: OSSAManifest): Promise<DrupalExecutionResult> {
    const ecaModel = this.convertToECAModel(manifest);

    const response = await fetch(`${this.config.baseUrl}/api/ossa/eca/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(ecaModel),
    });

    const result = (await response.json()) as { execution_id: string; output?: unknown };

    return {
      success: response.ok,
      executionId: result.execution_id,
      model: 'eca',
      output: result.output,
    };
  }

  /**
   * Execute via Maestro (BPM Workflow)
   */
  private async executeMaestro(manifest: OSSAManifest): Promise<DrupalExecutionResult> {
    const maestroProcess = this.convertToMaestroProcess(manifest);

    const response = await fetch(`${this.config.baseUrl}/api/ossa/maestro/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(maestroProcess),
    });

    const result = (await response.json()) as { process_id: string; output?: unknown };

    return {
      success: response.ok,
      executionId: result.process_id,
      model: 'maestro',
      output: result.output,
    };
  }

  /**
   * Execute via FlowDrop (Visual DAG)
   */
  private async executeFlowDrop(manifest: OSSAManifest): Promise<DrupalExecutionResult> {
    const flowDropDAG = this.convertToFlowDropDAG(manifest);

    const response = await fetch(`${this.config.baseUrl}/api/ossa/flowdrop/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(flowDropDAG),
    });

    const result = (await response.json()) as { execution_id: string; output?: unknown };

    return {
      success: response.ok,
      executionId: result.execution_id,
      model: 'flowdrop',
      output: result.output,
    };
  }

  /**
   * Execute via AI Agent Runner
   */
  private async executeAIAgentRunner(manifest: OSSAManifest): Promise<DrupalExecutionResult> {
    const agentConfig = this.convertToAgentRunnerConfig(manifest);

    const response = await fetch(`${this.config.baseUrl}/api/ossa/agent-runner/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(agentConfig),
    });

    const result = (await response.json()) as { agent_id: string; output?: unknown };

    return {
      success: response.ok,
      executionId: result.agent_id,
      model: 'ai-agent-runner',
      output: result.output,
    };
  }

  /**
   * Execute via Minikanban
   */
  private async executeMinikanban(manifest: OSSAManifest): Promise<DrupalExecutionResult> {
    const kanbanTasks = this.convertToMinikanbanTasks(manifest);

    const response = await fetch(`${this.config.baseUrl}/api/ossa/minikanban/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(kanbanTasks),
    });

    const result = (await response.json()) as { board_id: string; output?: unknown };

    return {
      success: response.ok,
      executionId: result.board_id,
      model: 'minikanban',
      output: result.output,
    };
  }

  /**
   * Convert OSSA Task to ECA Model
   */
  private convertToECAModel(manifest: OSSAManifest): object {
    const spec = manifest.spec as {
      triggers?: Array<{ type: string; event?: string; schedule?: string }>;
      capabilities?: Array<{ name: string; description?: string }>;
    };

    return {
      id: manifest.metadata.name,
      label: manifest.metadata.name,
      events: spec.triggers?.map((t) => ({
        plugin_id: `ossa_${t.type}`,
        configuration: {
          event: t.event,
          schedule: t.schedule,
        },
      })),
      conditions: [],
      actions: spec.capabilities?.map((cap) => ({
        plugin_id: `ossa_capability:${cap.name}`,
        configuration: {
          description: cap.description,
        },
      })),
    };
  }

  /**
   * Convert OSSA Workflow to Maestro Process
   */
  private convertToMaestroProcess(manifest: OSSAManifest): object {
    const spec = manifest.spec as {
      steps?: Array<{
        name: string;
        task?: string;
        agent?: string;
        next?: string[];
      }>;
    };

    return {
      template_id: manifest.metadata.name,
      process_name: manifest.metadata.name,
      tasks: spec.steps?.map((step) => ({
        task_id: step.name,
        task_class: step.agent ? 'MaestroOSSAAgent' : 'MaestroOSSATask',
        handler: step.agent || step.task,
        next_task: step.next?.[0],
      })),
    };
  }

  /**
   * Convert OSSA Workflow to FlowDrop DAG
   */
  private convertToFlowDropDAG(manifest: OSSAManifest): object {
    const spec = manifest.spec as {
      steps?: Array<{
        name: string;
        task?: string;
        depends_on?: string[];
      }>;
    };

    return {
      id: manifest.metadata.name,
      nodes: spec.steps?.map((step) => ({
        id: step.name,
        type: 'ossa_task',
        data: { task: step.task },
      })),
      edges: spec.steps?.flatMap((step) =>
        (step.depends_on || []).map((dep) => ({
          source: dep,
          target: step.name,
        }))
      ),
    };
  }

  /**
   * Convert OSSA Agent to AI Agent Runner config
   */
  private convertToAgentRunnerConfig(manifest: OSSAManifest): object {
    const spec = manifest.spec as {
      role?: string;
      llm?: {
        provider?: string;
        model?: string;
        temperature?: number;
      };
      tools?: Array<{
        name: string;
        type: string;
      }>;
    };

    return {
      agent_id: manifest.metadata.name,
      system_prompt: spec.role,
      llm_config: {
        provider: spec.llm?.provider || 'anthropic',
        model: spec.llm?.model || 'claude-3-5-sonnet-20241022',
        temperature: spec.llm?.temperature || 0.7,
      },
      tools: spec.tools?.map((t) => ({
        name: t.name,
        type: t.type,
      })),
    };
  }

  /**
   * Convert OSSA manifest to Minikanban tasks
   */
  private convertToMinikanbanTasks(manifest: OSSAManifest): object {
    const spec = manifest.spec as {
      steps?: Array<{
        name: string;
        description?: string;
      }>;
    };

    return {
      board_name: manifest.metadata.name,
      columns: ['To Do', 'In Progress', 'Done'],
      cards: spec.steps?.map((step, index) => ({
        title: step.name,
        description: step.description,
        column: 'To Do',
        order: index,
      })),
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionToken) {
      headers['X-CSRF-Token'] = this.sessionToken;
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    return headers;
  }
}

export default DrupalAdapter;
