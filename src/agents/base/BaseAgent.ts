/**
 * OSSA Base Agent Class
 * Foundation for all agent implementations
 */

import { EventEmitter } from 'events';
import { 
  Agent, 
  AgentStatus, 
  AgentType, 
  Capability, 
  Message, 
  MessageType,
  Task,
  TaskStatus
} from '../../types/index.js';

export abstract class BaseAgent extends EventEmitter implements Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly type: AgentType;
  public readonly capabilities: Capability[];
  public status: AgentStatus;
  public readonly metadata: any;
  public readonly config: any;

  protected tasks: Map<string, Task> = new Map();
  protected messageHandlers: Map<MessageType, Function> = new Map();

  constructor(config: Partial<Agent>) {
    super();
    this.id = config.id || this.generateId();
    this.name = config.name || 'unnamed-agent';
    this.version = config.version || '1.0.0';
    this.type = config.type || AgentType.WORKER;
    this.capabilities = config.capabilities || [];
    this.status = AgentStatus.IDLE;
    this.metadata = config.metadata || {};
    this.config = config.config || {};
    
    this.initialize();
  }

  /**
   * Initialize agent - must be implemented by subclasses
   */
  protected abstract initialize(): Promise<void>;

  /**
   * Process a task - must be implemented by subclasses
   */
  protected abstract processTask(task: Task): Promise<void>;

  /**
   * Start the agent
   */
  public async start(): Promise<void> {
    this.status = AgentStatus.STARTING;
    this.emit('agent:starting', { agent: this.id });
    
    try {
      await this.initialize();
      await this.registerWithOrchestrator();
      this.setupMessageHandlers();
      this.status = AgentStatus.IDLE;
      this.emit('agent:started', { agent: this.id });
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.emit('agent:error', { agent: this.id, error });
      throw error;
    }
  }

  /**
   * Stop the agent
   */
  public async stop(): Promise<void> {
    this.status = AgentStatus.STOPPING;
    this.emit('agent:stopping', { agent: this.id });
    
    try {
      await this.cleanup();
      await this.unregisterFromOrchestrator();
      this.status = AgentStatus.OFFLINE;
      this.emit('agent:stopped', { agent: this.id });
    } catch (error) {
      this.emit('agent:error', { agent: this.id, error });
      throw error;
    }
  }

  /**
   * Execute a task
   */
  public async executeTask(task: Task): Promise<void> {
    if (this.status !== AgentStatus.IDLE) {
      throw new Error(`Agent ${this.id} is not available. Current status: ${this.status}`);
    }

    this.status = AgentStatus.BUSY;
    this.tasks.set(task.id, task);
    task.status = TaskStatus.RUNNING;
    task.startTime = new Date();

    this.emit('task:started', { agent: this.id, task: task.id });

    try {
      await this.processTask(task);
      task.status = TaskStatus.SUCCESS;
      task.endTime = new Date();
      this.emit('task:completed', { agent: this.id, task: task.id });
    } catch (error: any) {
      task.status = TaskStatus.FAILED;
      task.error = {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        details: error.details,
        stack: error.stack
      };
      task.endTime = new Date();
      this.emit('task:failed', { agent: this.id, task: task.id, error });
      throw error;
    } finally {
      this.status = AgentStatus.IDLE;
      this.tasks.delete(task.id);
    }
  }

  /**
   * Handle incoming messages
   */
  public async handleMessage(message: Message): Promise<void> {
    const handler = this.messageHandlers.get(message.type);
    
    if (!handler) {
      this.emit('message:unhandled', { agent: this.id, message });
      return;
    }

    try {
      await handler.call(this, message);
      this.emit('message:processed', { agent: this.id, message });
    } catch (error) {
      this.emit('message:error', { agent: this.id, message, error });
      throw error;
    }
  }

  /**
   * Send a message
   */
  protected async sendMessage(to: string | string[], type: MessageType, payload: any): Promise<void> {
    const message: Message = {
      id: this.generateId(),
      from: this.id,
      to,
      type,
      payload,
      timestamp: new Date()
    };

    this.emit('message:send', message);
    // Actual sending logic would be implemented here
  }

  /**
   * Register message handler
   */
  protected registerMessageHandler(type: MessageType, handler: Function): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Setup default message handlers
   */
  private setupMessageHandlers(): void {
    this.registerMessageHandler(MessageType.COMMAND, this.handleCommand.bind(this));
    this.registerMessageHandler(MessageType.QUERY, this.handleQuery.bind(this));
    this.registerMessageHandler(MessageType.EVENT, this.handleEvent.bind(this));
  }

  /**
   * Handle command messages
   */
  protected async handleCommand(message: Message): Promise<void> {
    // Default command handling - can be overridden
    switch (message.payload.command) {
      case 'status':
        await this.sendMessage(message.from, MessageType.RESPONSE, {
          status: this.status,
          tasks: this.tasks.size
        });
        break;
      case 'capabilities':
        await this.sendMessage(message.from, MessageType.RESPONSE, {
          capabilities: this.capabilities
        });
        break;
      default:
        throw new Error(`Unknown command: ${message.payload.command}`);
    }
  }

  /**
   * Handle query messages
   */
  protected async handleQuery(message: Message): Promise<void> {
    // Default query handling - can be overridden
  }

  /**
   * Handle event messages
   */
  protected async handleEvent(message: Message): Promise<void> {
    // Default event handling - can be overridden
  }

  /**
   * Register with orchestrator
   */
  private async registerWithOrchestrator(): Promise<void> {
    // Registration logic
    this.emit('agent:registered', { agent: this.id });
  }

  /**
   * Unregister from orchestrator
   */
  private async unregisterFromOrchestrator(): Promise<void> {
    // Unregistration logic
    this.emit('agent:unregistered', { agent: this.id });
  }

  /**
   * Cleanup resources
   */
  protected async cleanup(): Promise<void> {
    // Default cleanup - can be overridden
    this.tasks.clear();
    this.messageHandlers.clear();
    this.removeAllListeners();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${this.constructor.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get agent info
   */
  public getInfo(): Agent {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      type: this.type,
      capabilities: this.capabilities,
      status: this.status,
      metadata: this.metadata,
      config: this.config
    };
  }
}

export default BaseAgent;