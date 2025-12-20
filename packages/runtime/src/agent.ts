/**
 * OSSA Runtime Agent Implementation
 * Represents a running agent instance with capabilities
 */

import { randomUUID } from 'crypto';
import type {
  OssaAgent as IOssaAgent,
  AgentManifest,
  Capability,
  CapabilityHandler,
  ExecutionContext,
  ExecutionResult,
} from './types.js';
import { CapabilityRegistry } from './capabilities.js';

/**
 * Default agent implementation
 */
export class OssaAgent implements IOssaAgent {
  public readonly id: string;
  public readonly manifest: AgentManifest;
  private readonly registry: CapabilityRegistry;

  constructor(manifest: AgentManifest, id?: string) {
    this.manifest = manifest;
    this.id = id || this.generateAgentId(manifest);
    this.registry = new CapabilityRegistry();

    // Auto-register capabilities from manifest
    this.initializeCapabilities();
  }

  /**
   * Generate agent ID from manifest
   */
  private generateAgentId(manifest: AgentManifest): string {
    if (manifest.metadata?.name) {
      return manifest.metadata.name;
    }

    if (manifest.agent?.id) {
      return manifest.agent.id;
    }

    // Generate random ID if not found
    return `agent-${randomUUID()}`;
  }

  /**
   * Initialize capabilities from manifest
   */
  private initializeCapabilities(): void {
    // Legacy format capabilities
    if (this.manifest.agent?.capabilities) {
      for (const capability of this.manifest.agent.capabilities) {
        // Register with a default handler that throws not implemented
        this.registry.register(capability, async () => {
          throw new Error(
            `Capability ${capability.name} handler not implemented`
          );
        });
      }
    }

    // K8s-style format would be handled differently
    // For now, capabilities need to be registered explicitly via registerCapability
  }

  /**
   * Execute a capability by name
   */
  async execute<TInput = unknown, TOutput = unknown>(
    capabilityName: string,
    input: TInput,
    context?: Partial<ExecutionContext>
  ): Promise<ExecutionResult<TOutput>> {
    const startTime = Date.now();

    // Create full execution context
    const fullContext: ExecutionContext = {
      requestId: randomUUID(),
      timestamp: new Date(),
      ...context,
    };

    try {
      // Check if capability exists
      const capability = this.registry.get(capabilityName);
      if (!capability) {
        return {
          success: false,
          error: {
            code: 'CAPABILITY_NOT_FOUND',
            message: `Capability '${capabilityName}' not found`,
          },
          executionTime: Date.now() - startTime,
        };
      }

      // Get handler
      const handler = this.registry.getHandler(capabilityName);
      if (!handler) {
        return {
          success: false,
          error: {
            code: 'HANDLER_NOT_FOUND',
            message: `Handler for capability '${capabilityName}' not found`,
    // Mark agent as busy
    const agentInfo = this.agents.get(agent.id);
    if (!agentInfo) {
      throw new Error(`Agent ${agent.id} not found in registry`);
    }
    agentInfo.status = 'busy';
      }

      // Execute with timeout if specified
      const timeoutMs = capability.timeout_seconds
        ? capability.timeout_seconds * 1000
        : undefined;

      let result: TOutput;
      if (timeoutMs) {
        result = await this.executeWithTimeout(
          handler,
          input,
          fullContext,
          timeoutMs
        );
      } else {
        result = await handler(input, fullContext);
      }

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        metadata: {
          capabilityName,
          requestId: fullContext.requestId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          details: error,
        },
        executionTime: Date.now() - startTime,
        metadata: {
          capabilityName,
          requestId: fullContext.requestId,
        },
      };
    }
  }

  /**
   * Execute handler with timeout
   */
  private async executeWithTimeout<TInput, TOutput>(
    handler: CapabilityHandler<TInput, TOutput>,
    input: TInput,
    context: ExecutionContext,
    timeoutMs: number
  ): Promise<TOutput> {
    return Promise.race([
      handler(input, context),
      new Promise<TOutput>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Execution timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Get all registered capabilities
   */
  getCapabilities(): Map<string, Capability> {
    return this.registry.getAll();
  }

  /**
   * Get a specific capability by name
   */
  getCapability(name: string): Capability | undefined {
    return this.registry.get(name);
  }

  /**
   * Register a new capability handler
   */
  registerCapability(
    capability: Capability,
    handler: CapabilityHandler
  ): void {
    this.registry.register(capability, handler);
  }

  /**
   * Check if agent has a specific capability
   */
  hasCapability(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Get agent metadata
   */
  getMetadata(): {
    id: string;
    name: string;
    role: string;
    version?: string;
    description?: string;
  } {
    if (this.manifest.metadata) {
      return {
        id: this.id,
        name: this.manifest.metadata.name,
        role: this.manifest.spec?.role || 'unknown',
        version: this.manifest.metadata.version,
        description: this.manifest.metadata.description,
      };
    }

    if (this.manifest.agent) {
      return {
        id: this.id,
        name: this.manifest.agent.name,
        role: this.manifest.agent.role,
        version: this.manifest.agent.version,
        description: this.manifest.agent.description,
      };
    }

    return {
      id: this.id,
      name: 'unknown',
      role: 'unknown',
    };
  }
}

/**
 * Create a new agent instance from manifest
 */
export function createAgent(
  manifest: AgentManifest,
  id?: string
): OssaAgent {
  return new OssaAgent(manifest, id);
}
