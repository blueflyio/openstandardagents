/**
 * OSSA Workflow Type Definitions
 */
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'agent' | 'task' | 'condition' | 'loop';
    agent?: string;
    task?: string;
    condition?: string;
    dependencies?: string[];
    timeout?: number;
    retries?: number;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    version: string;
    description?: string;
    steps: WorkflowStep[];
    triggers?: string[];
    schedule?: string;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: string;
    endTime?: string;
    currentStep?: string;
    results?: Record<string, any>;
    error?: string;
}
export interface WorkflowContext {
    executionId: string;
    variables: Record<string, any>;
    artifacts: Record<string, any>;
    metadata: Record<string, any>;
}
//# sourceMappingURL=index.d.ts.map