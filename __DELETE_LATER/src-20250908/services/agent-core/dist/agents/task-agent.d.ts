/**
 * Task Agent Implementation
 * Handles task execution, scheduling, and management
 */
import { BaseAgent } from './base-agent.js';
import { AgentType, TaskAgent as ITaskAgent, TaskDefinition, TaskResult, TaskStatus, Schedule } from '../types/agent-types.js';
export declare class TaskAgent extends BaseAgent implements ITaskAgent {
    readonly type = AgentType.TASK;
    protected readonly agentType = AgentType.TASK;
    private tasks;
    private scheduledTasks;
    private taskQueue;
    private isProcessing;
    private maxConcurrentTasks;
    private activeTasks;
    capabilities: ITaskAgent['capabilities'];
    constructor(config: {
        name: string;
        version?: string;
        description?: string;
        maxConcurrentTasks?: number;
    });
    protected onInitialize(): Promise<void>;
    protected onHealthCheck(): Promise<boolean>;
    protected onShutdown(): Promise<void>;
    /**
     * Execute a task
     */
    executeTask(task: TaskDefinition): Promise<TaskResult>;
    /**
     * Schedule a task
     */
    scheduleTask(task: TaskDefinition, schedule: Schedule): Promise<string>;
    /**
     * Cancel a task
     */
    cancelTask(taskId: string): Promise<void>;
    /**
     * Get task status
     */
    getTaskStatus(taskId: string): Promise<TaskStatus>;
    /**
     * Start the task processor
     */
    private startTaskProcessor;
    /**
     * Start the schedule checker
     */
    private startScheduleChecker;
    /**
     * Process a single task
     */
    private processTask;
    /**
     * Execute task logic (to be overridden or extended)
     */
    protected executeTaskLogic(task: TaskDefinition): Promise<any>;
    /**
     * Wait for task completion
     */
    private waitForTaskCompletion;
    /**
     * Calculate next run time for scheduled task
     */
    private calculateNextRun;
}
//# sourceMappingURL=task-agent.d.ts.map