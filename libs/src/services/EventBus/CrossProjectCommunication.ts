/**
 * OSSA v0.1.9 Cross-Project Communication
 * Enables secure and validated communication between 40+ projects
 */

import { RedisEventBus } from './RedisEventBus.js';
import {
  CrossProjectEventContract,
  EventPayload,
  EVENT_TYPES,
  EventPriority
} from './types.js';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

export interface ProjectConfig {
  /** Project identifier */
  projectId: string;
  /** Project name */
  name: string;
  /** Project namespace for event isolation */
  namespace: string;
  /** Allowed event types for this project */
  allowedEventTypes: string[];
  /** Projects this project can communicate with */
  allowedTargets: string[];
  /** Authentication credentials for cross-project calls */
  credentials?: {
    apiKey: string;
    secret: string;
  };
  /** Rate limiting configuration */
  rateLimiting?: {
    eventsPerSecond: number;
    burstLimit: number;
  };
}

export interface CrossProjectMessage<T = any> {
  /** Source project information */
  source: {
    projectId: string;
    namespace: string;
    version: string;
  };
  /** Target project information */
  target: {
    projectId: string;
    namespace: string;
  };
  /** Message payload with validation */
  payload: EventPayload<T>;
  /** Security context */
  security: {
    signature: string;
    timestamp: number;
    nonce: string;
  };
}

export class CrossProjectCommunication {
  private eventBus: RedisEventBus;
  private projectConfigs = new Map<string, ProjectConfig>();
  private contracts = new Map<string, CrossProjectEventContract>();
  private validators = new Map<string, (data: any) => boolean>();
  private rateLimiters = new Map<string, RateLimiter>();

  constructor(eventBus: RedisEventBus) {
    this.eventBus = eventBus;
    this.setupValidators();
    this.setupEventHandlers();
  }

  /**
   * Register a project for cross-project communication
   */
  async registerProject(config: ProjectConfig): Promise<void> {
    try {
      // Validate project configuration
      this.validateProjectConfig(config);

      // Store project configuration
      this.projectConfigs.set(config.projectId, config);

      // Setup rate limiter if configured
      if (config.rateLimiting) {
        this.rateLimiters.set(
          config.projectId,
          new RateLimiter(config.rateLimiting.eventsPerSecond, config.rateLimiting.burstLimit)
        );
      }

      // Subscribe to project-specific events
      await this.setupProjectEventHandlers(config);

      // Announce project registration
      await this.eventBus.publish(EVENT_TYPES.SYSTEM.CONFIGURATION_CHANGED, {
        action: 'project_registered',
        project: {
          id: config.projectId,
          name: config.name,
          namespace: config.namespace,
          allowedEventTypes: config.allowedEventTypes
        }
      });

      console.log(`✅ Project registered for cross-project communication: ${config.name}`);

    } catch (error) {
      console.error(`Failed to register project ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Register event contract between projects
   */
  async registerCrossProjectContract(contract: CrossProjectEventContract): Promise<void> {
    try {
      // Validate contract
      this.validateContract(contract);

      // Store contract
      this.contracts.set(contract.name, contract);

      // Setup JSON schema validator for this contract
      if (contract.schema) {
        const ajv = new Ajv({ allErrors: true });
        addFormats(ajv);
        const validator = ajv.compile(contract.schema);
        this.validators.set(contract.name, validator);
      }

      // Register with event bus
      await this.eventBus.registerContract(contract);

      console.log(`✅ Cross-project contract registered: ${contract.name} v${contract.version}`);

    } catch (error) {
      console.error(`Failed to register contract ${contract.name}:`, error);
      throw error;
    }
  }

  /**
   * Send message to another project with validation and security
   */
  async sendMessage<T>(
    sourceProjectId: string,
    targetProjectId: string,
    eventType: string,
    data: T,
    options: { correlationId?: string; priority?: EventPriority } = {}
  ): Promise<string> {
    try {
      // Validate source project
      const sourceProject = this.projectConfigs.get(sourceProjectId);
      if (!sourceProject) {
        throw new Error(`Source project not registered: ${sourceProjectId}`);
      }

      // Validate target project
      const targetProject = this.projectConfigs.get(targetProjectId);
      if (!targetProject) {
        throw new Error(`Target project not registered: ${targetProjectId}`);
      }

      // Check communication permissions
      if (!sourceProject.allowedTargets.includes(targetProjectId)) {
        throw new Error(`Communication not allowed from ${sourceProjectId} to ${targetProjectId}`);
      }

      // Check event type permissions
      if (!sourceProject.allowedEventTypes.includes(eventType)) {
        throw new Error(`Event type ${eventType} not allowed for project ${sourceProjectId}`);
      }

      // Apply rate limiting
      await this.applyRateLimit(sourceProjectId);

      // Validate data against contract
      await this.validateMessageData(eventType, data);

      // Create secure cross-project message
      const message: CrossProjectMessage<T> = {
        source: {
          projectId: sourceProjectId,
          namespace: sourceProject.namespace,
          version: '1.0.0'
        },
        target: {
          projectId: targetProjectId,
          namespace: targetProject.namespace
        },
        payload: {
          metadata: {
            id: crypto.randomUUID(),
            type: eventType,
            source: sourceProject.namespace,
            target: targetProject.namespace,
            timestamp: new Date(),
            version: '1.0.0',
            priority: options.priority || EventPriority.NORMAL,
            correlationId: options.correlationId
          },
          data
        },
        security: {
          signature: await this.signMessage(sourceProject, data),
          timestamp: Date.now(),
          nonce: crypto.randomUUID()
        }
      };

      // Send message via event bus to target namespace
      const crossProjectEventType = `${targetProject.namespace}.${eventType}`;
      const messageId = await this.eventBus.publish(crossProjectEventType, message, {
        priority: options.priority || EventPriority.NORMAL
      });

      // Log successful cross-project communication
      await this.logCrossProjectCommunication(sourceProjectId, targetProjectId, eventType, messageId);

      return messageId;

    } catch (error) {
      console.error('Cross-project message failed:', error);
      throw error;
    }
  }

  /**
   * Setup message handler for receiving cross-project messages
   */
  async setupMessageHandler<T>(
    projectId: string,
    eventType: string,
    handler: (message: CrossProjectMessage<T>) => Promise<void>,
    options: { requireSignatureValidation?: boolean } = {}
  ): Promise<void> {
    try {
      const project = this.projectConfigs.get(projectId);
      if (!project) {
        throw new Error(`Project not registered: ${projectId}`);
      }

      const namespacedEventType = `${project.namespace}.${eventType}`;

      await this.eventBus.subscribe(
        namespacedEventType,
        async (payload: EventPayload<CrossProjectMessage<T>>) => {
          const message = payload.data;
          try {
            // Validate message security if required
            if (options.requireSignatureValidation) {
              await this.validateMessageSecurity(message);
            }

            // Validate message permissions
            await this.validateMessagePermissions(message, projectId);

            // Execute handler
            await handler(message);

            // Log successful message processing
            await this.logMessageProcessing(projectId, eventType, message.source.projectId);

          } catch (error) {
            console.error(`Cross-project message handling failed for ${projectId}:`, error);

            // Send error response if correlation ID provided
            if (payload.metadata.correlationId) {
              await this.sendErrorResponse(
                projectId,
                message.source.projectId,
                payload.metadata.correlationId,
                error instanceof Error ? error.message : String(error)
              );
            }
          }
        },
        { group: `project-${projectId}` }
      );

    } catch (error) {
      console.error(`Failed to setup message handler for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get cross-project communication statistics
   */
  async getStats(projectId?: string): Promise<{
    totalProjects: number;
    totalContracts: number;
    messagesSent: number;
    messagesReceived: number;
    messagesFailed: number;
    activeConnections: number;
    rateLimitHits: number;
    averageLatency: number;
    projectStats?: Array<{
      projectId: string;
      messagesSent: number;
      messagesReceived: number;
      lastActivity: Date;
    }>;
  }> {
    // Implementation would track these metrics in Redis
    return {
      totalProjects: this.projectConfigs.size,
      totalContracts: this.contracts.size,
      messagesSent: 0, // Would be tracked in Redis
      messagesReceived: 0, // Would be tracked in Redis
      messagesFailed: 0, // Would be tracked in Redis
      activeConnections: 0, // Would be tracked in Redis
      rateLimitHits: 0, // Would be tracked by rate limiters
      averageLatency: 0, // Would be calculated from timing data
      projectStats: projectId ? undefined : [] // Would be populated from Redis data
    };
  }

  /**
   * List available contracts for a project
   */
  getAvailableContracts(projectId: string): CrossProjectEventContract[] {
    return Array.from(this.contracts.values()).filter(contract =>
      contract.targetProjects.includes(projectId) ||
      contract.sourceProject === projectId
    );
  }

  /**
   * Validate project registration and setup
   */
  async validateProjectSetup(projectId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const project = this.projectConfigs.get(projectId);
    if (!project) {
      errors.push(`Project ${projectId} is not registered`);
      return { isValid: false, errors, warnings, recommendations };
    }

    // Check event type permissions
    if (project.allowedEventTypes.length === 0) {
      warnings.push('No event types allowed - project cannot send events');
    }

    // Check target permissions
    if (project.allowedTargets.length === 0) {
      warnings.push('No target projects allowed - project cannot send cross-project messages');
    }

    // Check rate limiting
    if (!project.rateLimiting) {
      recommendations.push('Consider adding rate limiting for better resource management');
    }

    // Check security credentials
    if (!project.credentials) {
      recommendations.push('Consider adding security credentials for enhanced security');
    }

    // Check for available contracts
    const availableContracts = this.getAvailableContracts(projectId);
    if (availableContracts.length === 0) {
      warnings.push('No event contracts available - limited communication capabilities');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  // Private methods

  private setupValidators(): void {
    // Setup default JSON schema validators
  }

  private setupEventHandlers(): void {
    // Setup system-level event handlers
  }

  private async setupProjectEventHandlers(config: ProjectConfig): Promise<void> {
    // Setup project-specific event handlers based on configuration
  }

  private validateProjectConfig(config: ProjectConfig): void {
    if (!config.projectId || !config.name || !config.namespace) {
      throw new Error('Project configuration missing required fields');
    }

    if (!config.allowedEventTypes || config.allowedEventTypes.length === 0) {
      throw new Error('Project must specify allowed event types');
    }
  }

  private validateContract(contract: CrossProjectEventContract): void {
    if (!contract.name || !contract.version || !contract.sourceProject) {
      throw new Error('Contract missing required fields');
    }

    if (!contract.targetProjects || contract.targetProjects.length === 0) {
      throw new Error('Contract must specify target projects');
    }

    if (!contract.eventTypes || contract.eventTypes.length === 0) {
      throw new Error('Contract must specify event types');
    }
  }

  private async validateMessageData(eventType: string, data: any): Promise<void> {
    // Find applicable contract
    const contract = Array.from(this.contracts.values()).find(c =>
      c.eventTypes.includes(eventType)
    );

    if (contract) {
      const validator = this.validators.get(contract.name);
      if (validator && !validator(data)) {
        // Cast validator to access errors property
        const validatorWithErrors = validator as any;
        throw new Error(`Message data validation failed: ${JSON.stringify(validatorWithErrors.errors)}`);
      }
    }
  }

  private async signMessage(project: ProjectConfig, data: any): Promise<string> {
    // Create message signature for security
    // Implementation would use HMAC with project secret
    return 'signature_placeholder';
  }

  private async validateMessageSecurity(message: CrossProjectMessage): Promise<void> {
    // Validate message signature and timestamp
    const now = Date.now();
    const messageAge = now - message.security.timestamp;

    // Reject messages older than 5 minutes
    if (messageAge > 5 * 60 * 1000) {
      throw new Error('Message timestamp too old');
    }

    // Validate signature (implementation would verify HMAC)
  }

  private async validateMessagePermissions(
    message: CrossProjectMessage,
    targetProjectId: string
  ): Promise<void> {
    const sourceProject = this.projectConfigs.get(message.source.projectId);
    if (!sourceProject) {
      throw new Error(`Source project not registered: ${message.source.projectId}`);
    }

    if (!sourceProject.allowedTargets.includes(targetProjectId)) {
      throw new Error('Cross-project communication not permitted');
    }
  }

  private async applyRateLimit(projectId: string): Promise<void> {
    const rateLimiter = this.rateLimiters.get(projectId);
    if (rateLimiter && !rateLimiter.allow()) {
      throw new Error(`Rate limit exceeded for project ${projectId}`);
    }
  }

  private async sendErrorResponse(
    sourceProjectId: string,
    targetProjectId: string,
    correlationId: string,
    error: string
  ): Promise<void> {
    // Send error response back to source project
    try {
      await this.sendMessage(
        sourceProjectId,
        targetProjectId,
        EVENT_TYPES.SYSTEM.ERROR,
        {
          correlationId,
          error,
          timestamp: new Date()
        },
        { correlationId, priority: EventPriority.HIGH }
      );
    } catch (responseError) {
      console.error('Failed to send error response:', responseError);
    }
  }

  private async logCrossProjectCommunication(
    sourceProjectId: string,
    targetProjectId: string,
    eventType: string,
    messageId: string
  ): Promise<void> {
    // Log communication for audit and analytics
    console.info(`Cross-project: ${sourceProjectId} -> ${targetProjectId} (${eventType}) [${messageId}]`);
  }

  private async logMessageProcessing(
    projectId: string,
    eventType: string,
    sourceProjectId: string
  ): Promise<void> {
    // Log successful message processing
    console.info(`Processed: ${sourceProjectId} -> ${projectId} (${eventType})`);
  }
}

/**
 * Simple rate limiter implementation
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(eventsPerSecond: number, burstLimit: number) {
    this.maxTokens = burstLimit;
    this.refillRate = eventsPerSecond;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  allow(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

export default CrossProjectCommunication;