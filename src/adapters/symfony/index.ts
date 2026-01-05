/**
 * OSSA Symfony Runtime Adapter
 *
 * Adapts OSSA Task/Workflow/Agent manifests to Symfony Messenger
 * for async execution with robust retry handling.
 */

export interface SymfonyAdapterConfig {
  /** Symfony app base URL */
  baseUrl: string;
  /** Messenger transport configuration */
  transport: {
    /** Transport type */
    type: 'amqp' | 'redis' | 'doctrine' | 'sync';
    /** Transport DSN */
    dsn: string;
    /** Default queue/routing */
    defaultQueue?: string;
  };
  /** Authentication */
  auth?: {
    type: 'api-key' | 'jwt';
    token: string;
  };
  /** Retry configuration */
  retry?: {
    maxRetries: number;
    delay: number;
    multiplier: number;
    maxDelay: number;
  };
}

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

export interface SymfonyExecutionResult {
  success: boolean;
  messageId: string;
  transport: string;
  status: 'dispatched' | 'handled' | 'failed' | 'retry';
  output?: unknown;
  error?: string;
}

export interface MessengerMessage {
  /** Message class name in Symfony */
  class: string;
  /** Message payload */
  payload: Record<string, unknown>;
  /** Stamps (metadata) */
  stamps: MessengerStamp[];
}

export interface MessengerStamp {
  class: string;
  data: Record<string, unknown>;
}

/**
 * Symfony Messenger-based OSSA runtime adapter
 */
export class SymfonyAdapter {
  private config: SymfonyAdapterConfig;

  constructor(config: SymfonyAdapterConfig) {
    this.config = {
      ...config,
      retry: config.retry || {
        maxRetries: 3,
        delay: 1000,
        multiplier: 2,
        maxDelay: 60000,
      },
    };
  }

  /**
   * Execute an OSSA manifest via Symfony Messenger
   */
  async execute(manifest: OSSAManifest): Promise<SymfonyExecutionResult> {
    const message = this.convertToMessage(manifest);

    const response = await fetch(`${this.config.baseUrl}/api/ossa/messenger/dispatch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      return {
        success: false,
        messageId: '',
        transport: this.config.transport.type,
        status: 'failed',
        error: error.message || response.statusText,
      };
    }

    const result = (await response.json()) as {
      message_id: string;
      status: 'dispatched' | 'handled' | 'failed' | 'retry';
      output?: unknown;
    };

    return {
      success: true,
      messageId: result.message_id,
      transport: this.config.transport.type,
      status: result.status,
      output: result.output,
    };
  }

  /**
   * Execute synchronously (for testing or simple tasks)
   */
  async executeSync(manifest: OSSAManifest): Promise<SymfonyExecutionResult> {
    const message = this.convertToMessage(manifest);

    // Add sync stamp to force synchronous handling
    message.stamps.push({
      class: 'Symfony\\Component\\Messenger\\Stamp\\TransportNamesStamp',
      data: { transportNames: ['sync'] },
    });

    const response = await fetch(`${this.config.baseUrl}/api/ossa/messenger/handle`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(message),
    });

    const result = (await response.json()) as {
      message_id: string;
      status: 'handled' | 'failed';
      output?: unknown;
      error?: string;
    };

    return {
      success: response.ok && result.status === 'handled',
      messageId: result.message_id,
      transport: 'sync',
      status: result.status,
      output: result.output,
      error: result.error,
    };
  }

  /**
   * Get status of a dispatched message
   */
  async getStatus(messageId: string): Promise<SymfonyExecutionResult> {
    const response = await fetch(`${this.config.baseUrl}/api/ossa/messenger/status/${messageId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result = (await response.json()) as {
      message_id: string;
      status: 'dispatched' | 'handled' | 'failed' | 'retry';
      transport: string;
      output?: unknown;
      error?: string;
    };

    return {
      success: result.status === 'handled',
      messageId: result.message_id,
      transport: result.transport,
      status: result.status,
      output: result.output,
      error: result.error,
    };
  }

  /**
   * Convert OSSA manifest to Symfony Messenger message
   */
  convertToMessage(manifest: OSSAManifest): MessengerMessage {
    const stamps = this.createStamps(manifest);

    switch (manifest.kind) {
      case 'Task':
        return this.createTaskMessage(manifest, stamps);
      case 'Workflow':
        return this.createWorkflowMessage(manifest, stamps);
      case 'Agent':
        return this.createAgentMessage(manifest, stamps);
      default:
        throw new Error(`Unknown manifest kind: ${manifest.kind}`);
    }
  }

  /**
   * Create Messenger stamps from manifest
   */
  private createStamps(manifest: OSSAManifest): MessengerStamp[] {
    const stamps: MessengerStamp[] = [];

    // Add retry stamp
    if (this.config.retry) {
      stamps.push({
        class: 'Symfony\\Component\\Messenger\\Stamp\\DelayStamp',
        data: { delay: 0 },
      });
    }

    // Add transport stamp if specified
    const spec = manifest.spec as {
      extensions?: {
        symfony?: {
          messenger_transport?: string;
        };
      };
    };

    const transport = spec.extensions?.symfony?.messenger_transport;
    if (transport) {
      stamps.push({
        class: 'Symfony\\Component\\Messenger\\Stamp\\TransportNamesStamp',
        data: { transportNames: [transport] },
      });
    }

    // Add OSSA metadata stamp
    stamps.push({
      class: 'App\\Messenger\\Stamp\\OSSAMetadataStamp',
      data: {
        apiVersion: manifest.apiVersion,
        kind: manifest.kind,
        name: manifest.metadata.name,
        version: manifest.metadata.version,
      },
    });

    return stamps;
  }

  /**
   * Create Task message
   */
  private createTaskMessage(manifest: OSSAManifest, stamps: MessengerStamp[]): MessengerMessage {
    const spec = manifest.spec as {
      execution?: {
        type?: string;
        entrypoint?: string;
      };
      capabilities?: Array<{ name: string }>;
      input?: Record<string, unknown>;
      extensions?: {
        symfony?: {
          service?: string;
        };
      };
    };

    return {
      class: spec.extensions?.symfony?.service || 'App\\Message\\OSSATaskMessage',
      payload: {
        taskId: manifest.metadata.name,
        executionType: spec.execution?.type || 'deterministic',
        entrypoint: spec.execution?.entrypoint,
        capabilities: spec.capabilities?.map((c) => c.name) || [],
        input: spec.input || {},
      },
      stamps,
    };
  }

  /**
   * Create Workflow message
   */
  private createWorkflowMessage(
    manifest: OSSAManifest,
    stamps: MessengerStamp[]
  ): MessengerMessage {
    const spec = manifest.spec as {
      steps?: Array<{
        name: string;
        task?: string;
        agent?: string;
        depends_on?: string[];
      }>;
      extensions?: {
        symfony?: {
          service?: string;
        };
      };
    };

    return {
      class: spec.extensions?.symfony?.service || 'App\\Message\\OSSAWorkflowMessage',
      payload: {
        workflowId: manifest.metadata.name,
        steps: spec.steps || [],
      },
      stamps,
    };
  }

  /**
   * Create Agent message
   */
  private createAgentMessage(manifest: OSSAManifest, stamps: MessengerStamp[]): MessengerMessage {
    const spec = manifest.spec as {
      role?: string;
      llm?: {
        provider?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
      };
      tools?: Array<{
        name: string;
        type: string;
        config?: Record<string, unknown>;
      }>;
      extensions?: {
        symfony?: {
          service?: string;
        };
      };
    };

    return {
      class: spec.extensions?.symfony?.service || 'App\\Message\\OSSAAgentMessage',
      payload: {
        agentId: manifest.metadata.name,
        role: spec.role,
        llmConfig: spec.llm || {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
        },
        tools: spec.tools || [],
      },
      stamps,
    };
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.auth) {
      if (this.config.auth.type === 'api-key') {
        headers['X-API-Key'] = this.config.auth.token;
      } else {
        headers['Authorization'] = `Bearer ${this.config.auth.token}`;
      }
    }

    return headers;
  }
}

/**
 * Extension schema for Symfony-specific configuration
 */
export const SYMFONY_EXTENSION_SCHEMA = {
  $id: 'https://ossa.dev/schema/extensions/symfony.extension.schema.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'OSSA Symfony Extension',
  description: 'Symfony Messenger integration for OSSA runtime',
  type: 'object',
  properties: {
    service: {
      type: 'string',
      description: 'Symfony service class to handle this manifest',
      pattern: '^[A-Z][a-zA-Z0-9]*\\\\[A-Za-z0-9\\\\]*$',
    },
    messenger_transport: {
      type: 'string',
      description: 'Messenger transport to use',
      enum: ['async', 'sync', 'failed', 'amqp', 'redis', 'doctrine'],
      default: 'async',
    },
    retry_strategy: {
      type: 'object',
      description: 'Retry configuration',
      properties: {
        max_retries: {
          type: 'integer',
          minimum: 0,
          maximum: 10,
          default: 3,
        },
        delay: {
          type: 'integer',
          minimum: 0,
          description: 'Initial delay in milliseconds',
          default: 1000,
        },
        multiplier: {
          type: 'number',
          minimum: 1,
          default: 2,
        },
        max_delay: {
          type: 'integer',
          minimum: 0,
          default: 60000,
        },
      },
    },
    bus: {
      type: 'string',
      description: 'Message bus to use',
      default: 'messenger.bus.default',
    },
  },
  additionalProperties: false,
};

export default SymfonyAdapter;
