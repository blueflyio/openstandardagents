/**
 * Task Agent Implementation
 * Handles task execution, scheduling, and management
 */
import { BaseAgent } from './base-agent.js';
import { AgentType } from '../types/agent-types.js';
import { logger } from '../utils/logger.js';
export class TaskAgent extends BaseAgent {
    type = AgentType.TASK;
    agentType = AgentType.TASK;
    tasks;
    scheduledTasks;
    taskQueue;
    isProcessing;
    maxConcurrentTasks;
    activeTasks;
    capabilities;
    constructor(config) {
        super(config);
        this.tasks = new Map();
        this.scheduledTasks = new Map();
        this.taskQueue = [];
        this.isProcessing = false;
        this.maxConcurrentTasks = config.maxConcurrentTasks || 5;
        this.activeTasks = 0;
        // Bind capabilities
        this.capabilities = {
            executeTask: this.executeTask.bind(this),
            scheduleTask: this.scheduleTask.bind(this),
            cancelTask: this.cancelTask.bind(this),
            getTaskStatus: this.getTaskStatus.bind(this)
        };
    }
    async onInitialize() {
        // Start task processor
        this.startTaskProcessor();
        // Start schedule checker
        this.startScheduleChecker();
        logger.info(`Task agent ${this.name} initialized with max concurrent tasks: ${this.maxConcurrentTasks}`);
    }
    async onHealthCheck() {
        // Check if task processor is running
        if (!this.isProcessing) {
            logger.warn(`Task processor not running for agent ${this.name}`);
            return false;
        }
        // Check for stuck tasks
        const stuckTasks = Array.from(this.tasks.values()).filter(task => {
            if (task.status === 'running' && task.startTime) {
                const runtime = Date.now() - task.startTime.getTime();
                return runtime > 300000; // 5 minutes
            }
            return false;
        });
        if (stuckTasks.length > 0) {
            logger.warn(`Found ${stuckTasks.length} stuck tasks in agent ${this.name}`);
        }
        return true;
    }
    async onShutdown() {
        // Stop processing new tasks
        this.isProcessing = false;
        // Wait for active tasks to complete (with timeout)
        const timeout = setTimeout(() => {
            logger.warn(`Force shutting down agent ${this.name} with ${this.activeTasks} active tasks`);
        }, 10000);
        while (this.activeTasks > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        clearTimeout(timeout);
        logger.info(`Task agent ${this.name} shut down successfully`);
    }
    /**
     * Execute a task
     */
    async executeTask(task) {
        return this.processRequest('executeTask', async () => {
            const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // Create task status
            const status = {
                id: taskId,
                status: 'pending',
                startTime: new Date()
            };
            this.tasks.set(taskId, status);
            // Add to queue
            const taskWithId = { ...task, id: taskId };
            this.taskQueue.push(taskWithId);
            // Wait for task completion
            return await this.waitForTaskCompletion(taskId, task.timeout);
        });
    }
    /**
     * Schedule a task
     */
    async scheduleTask(task, schedule) {
        return this.processRequest('scheduleTask', async () => {
            const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const scheduledTask = {
                id: scheduleId,
                task,
                schedule,
                nextRun: this.calculateNextRun(schedule),
                status: {
                    id: scheduleId,
                    status: 'pending'
                }
            };
            this.scheduledTasks.set(scheduleId, scheduledTask);
            logger.info(`Scheduled task ${task.name} with ID ${scheduleId}`);
            return scheduleId;
        });
    }
    /**
     * Cancel a task
     */
    async cancelTask(taskId) {
        return this.processRequest('cancelTask', async () => {
            const status = this.tasks.get(taskId);
            if (!status) {
                throw new Error(`Task ${taskId} not found`);
            }
            if (status.status === 'completed' || status.status === 'failed') {
                throw new Error(`Cannot cancel task ${taskId} with status ${status.status}`);
            }
            status.status = 'cancelled';
            status.endTime = new Date();
            logger.info(`Cancelled task ${taskId}`);
        });
    }
    /**
     * Get task status
     */
    async getTaskStatus(taskId) {
        return this.processRequest('getTaskStatus', async () => {
            const status = this.tasks.get(taskId);
            if (!status) {
                throw new Error(`Task ${taskId} not found`);
            }
            return status;
        });
    }
    /**
     * Start the task processor
     */
    startTaskProcessor() {
        this.isProcessing = true;
        const processNextTask = async () => {
            if (!this.isProcessing)
                return;
            if (this.taskQueue.length > 0 && this.activeTasks < this.maxConcurrentTasks) {
                const task = this.taskQueue.shift();
                if (task) {
                    this.activeTasks++;
                    this.processTask(task).finally(() => {
                        this.activeTasks--;
                    });
                }
            }
            // Schedule next check
            setTimeout(processNextTask, 100);
        };
        processNextTask();
    }
    /**
     * Start the schedule checker
     */
    startScheduleChecker() {
        const checkSchedules = async () => {
            if (!this.isProcessing)
                return;
            const now = new Date();
            for (const [id, scheduled] of this.scheduledTasks) {
                if (scheduled.nextRun && scheduled.nextRun <= now) {
                    // Execute scheduled task
                    await this.executeTask(scheduled.task);
                    // Calculate next run
                    if (scheduled.schedule.type === 'recurring' || scheduled.schedule.type === 'cron') {
                        scheduled.nextRun = this.calculateNextRun(scheduled.schedule);
                    }
                    else {
                        // One-time schedule, remove it
                        this.scheduledTasks.delete(id);
                    }
                }
            }
            // Check every minute
            setTimeout(checkSchedules, 60000);
        };
        checkSchedules();
    }
    /**
     * Process a single task
     */
    async processTask(task) {
        const taskId = task.id;
        const status = this.tasks.get(taskId);
        if (!status) {
            logger.error(`Task ${taskId} status not found`);
            return;
        }
        try {
            // Update status to running
            status.status = 'running';
            status.startTime = new Date();
            logger.info(`Executing task ${taskId}: ${task.name}`);
            // Simulate task execution (replace with actual implementation)
            const result = await this.executeTaskLogic(task);
            // Update status to completed
            status.status = 'completed';
            status.endTime = new Date();
            // Store result
            this.emit('task_completed', {
                taskId,
                result
            });
            logger.info(`Task ${taskId} completed successfully`);
        }
        catch (error) {
            // Update status to failed
            status.status = 'failed';
            status.endTime = new Date();
            status.error = error instanceof Error ? error.message : String(error);
            logger.error(`Task ${taskId} failed:`, error);
            this.emit('task_failed', {
                taskId,
                error
            });
        }
    }
    /**
     * Execute task logic (to be overridden or extended)
     */
    async executeTaskLogic(task) {
        // This is where you'd integrate with agent-forge task execution
        // For now, simulate task execution
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({
                        taskId: task.id,
                        output: `Task ${task.name} completed`,
                        timestamp: new Date()
                    });
                }
                else {
                    reject(new Error(`Task ${task.name} failed randomly`));
                }
            }, Math.random() * 3000); // Random execution time up to 3 seconds
        });
    }
    /**
     * Wait for task completion
     */
    async waitForTaskCompletion(taskId, timeout) {
        const startTime = Date.now();
        const maxTimeout = timeout || 60000; // Default 1 minute
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const status = this.tasks.get(taskId);
                if (!status) {
                    clearInterval(checkInterval);
                    reject(new Error(`Task ${taskId} not found`));
                    return;
                }
                if (status.status === 'completed') {
                    clearInterval(checkInterval);
                    resolve({
                        taskId,
                        status: 'success',
                        executionTime: status.endTime ? status.endTime.getTime() - status.startTime.getTime() : 0
                    });
                }
                else if (status.status === 'failed') {
                    clearInterval(checkInterval);
                    resolve({
                        taskId,
                        status: 'failure',
                        error: new Error(status.error || 'Task failed'),
                        executionTime: status.endTime ? status.endTime.getTime() - status.startTime.getTime() : 0
                    });
                }
                else if (status.status === 'cancelled') {
                    clearInterval(checkInterval);
                    resolve({
                        taskId,
                        status: 'failure',
                        error: new Error('Task cancelled'),
                        executionTime: 0
                    });
                }
                else if (Date.now() - startTime > maxTimeout) {
                    clearInterval(checkInterval);
                    status.status = 'failed';
                    status.error = 'Task timeout';
                    reject(new Error(`Task ${taskId} timed out`));
                }
            }, 100);
        });
    }
    /**
     * Calculate next run time for scheduled task
     */
    calculateNextRun(schedule) {
        const now = new Date();
        switch (schedule.type) {
            case 'once':
                return schedule.startTime || new Date(now.getTime() + 1000);
            case 'recurring':
                if (!schedule.interval) {
                    throw new Error('Recurring schedule requires interval');
                }
                return new Date(now.getTime() + schedule.interval);
            case 'cron':
                // TODO: Implement cron expression parsing
                logger.warn('Cron expressions not yet implemented');
                return undefined;
            default:
                return undefined;
        }
    }
}
//# sourceMappingURL=task-agent.js.map