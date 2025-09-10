/**
 * OSSA Base Agent Class
 * Foundation for all agent implementations
 */
import { EventEmitter } from 'events';
import { Agent, AgentStatus, AgentType, Capability, Message, MessageType, Task } from '../../types';
export declare abstract class BaseAgent extends EventEmitter implements Agent {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly type: AgentType;
    readonly capabilities: Capability[];
    status: AgentStatus;
    readonly metadata: any;
    readonly config: any;
    protected tasks: Map<string, Task>;
    protected messageHandlers: Map<MessageType, Function>;
    constructor(config: Partial<Agent>);
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
    start(): Promise<void>;
    /**
     * Stop the agent
     */
    stop(): Promise<void>;
    /**
     * Execute a task
     */
    executeTask(task: Task): Promise<void>;
    /**
     * Handle incoming messages
     */
    handleMessage(message: Message): Promise<void>;
    /**
     * Send a message
     */
    protected sendMessage(to: string | string[], type: MessageType, payload: any): Promise<void>;
    /**
     * Register message handler
     */
    protected registerMessageHandler(type: MessageType, handler: Function): void;
    /**
     * Setup default message handlers
     */
    private setupMessageHandlers;
    /**
     * Handle command messages
     */
    protected handleCommand(message: Message): Promise<void>;
    /**
     * Handle query messages
     */
    protected handleQuery(message: Message): Promise<void>;
    /**
     * Handle event messages
     */
    protected handleEvent(message: Message): Promise<void>;
    /**
     * Register with orchestrator
     */
    private registerWithOrchestrator;
    /**
     * Unregister from orchestrator
     */
    private unregisterFromOrchestrator;
    /**
     * Cleanup resources
     */
    protected cleanup(): Promise<void>;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Get agent info
     */
    getInfo(): Agent;
}
export default BaseAgent;
//# sourceMappingURL=BaseAgent.d.ts.map