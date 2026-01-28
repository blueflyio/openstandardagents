/**
 * Temporal Adapter Types
 */

export interface TemporalActivityConfig {
  name: string;
  description: string;
  inputType: string;
  outputType: string;
  timeout?: string;
  retryPolicy?: {
    initialInterval?: string;
    backoffCoefficient?: number;
    maximumAttempts?: number;
  };
}

export interface TemporalWorkflowConfig {
  name: string;
  description: string;
  activities: TemporalActivityConfig[];
  executionTimeout?: string;
  taskTimeout?: string;
}
