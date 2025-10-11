/**
 * OSSA Capability Type Definitions
 */

export type CapabilityType =
  | 'query'
  | 'action'
  | 'transform'
  | 'analysis'
  | 'generation'
  | 'monitoring'
  | 'orchestration';

export type CapabilityCategory =
  | 'nlp'
  | 'vision'
  | 'audio'
  | 'data'
  | 'integration'
  | 'security'
  | 'infrastructure'
  | 'workflow';

export interface Capability {
  /** Unique capability identifier */
  name: string;
  /** Capability type classification */
  type: CapabilityType;
  /** Human-readable description */
  description: string;
  /** Capability category */
  category?: CapabilityCategory;
  /** Input schema */
  inputs?: IOSchema;
  /** Output schema */
  outputs?: IOSchema;
  /** Resource requirements */
  requirements?: Requirements;
  /** Performance metrics */
  performance?: PerformanceMetrics;
  /** Usage examples */
  examples?: Example[];
}

export interface IOSchema {
  /** JSON Schema for input/output validation */
  schema?: Record<string, unknown>;
  /** MIME type of the content */
  contentType?: string;
  /** Content encoding (e.g., utf-8, base64) */
  encoding?: string;
  /** Maximum size (e.g., '10MB') */
  maxSize?: string;
}

export interface Requirements {
  /** Minimum memory requirement */
  minMemory?: string;
  /** Minimum CPU cores */
  minCPU?: number;
  /** GPU required */
  gpu?: boolean;
  /** Required dependencies or services */
  dependencies?: string[];
  /** Required permissions or access levels */
  permissions?: string[];
}

export interface PerformanceMetrics {
  /** P50 latency in milliseconds */
  latencyP50?: number;
  /** P95 latency in milliseconds */
  latencyP95?: number;
  /** P99 latency in milliseconds */
  latencyP99?: number;
  /** Requests per second */
  throughput?: number;
  /** Token usage statistics */
  tokenUsage?: {
    /** Average input tokens */
    input?: number;
    /** Average output tokens */
    output?: number;
    /** Average total tokens */
    total?: number;
  };
  /** Success rate (0-1) */
  successRate?: number;
}

export interface Example {
  /** Example title */
  title?: string;
  /** Example description */
  description?: string;
  /** Example input */
  input: Record<string, unknown>;
  /** Expected output */
  output: Record<string, unknown>;
  /** Additional notes or explanations */
  notes?: string;
}

// Capability builder functions
export function createCapability(
  name: string,
  type: CapabilityType,
  description: string
): Capability {
  return {
    name,
    type,
    description
  };
}

export function createNLPCapability(
  name: string,
  description: string,
  subtype: 'query' | 'analysis' | 'generation' = 'analysis'
): Capability {
  return {
    name,
    type: subtype,
    description,
    category: 'nlp'
  };
}

// Common capability patterns
export const CommonCapabilities = {
  // NLP Capabilities
  SENTIMENT_ANALYSIS: 'sentiment_analysis',
  ENTITY_EXTRACTION: 'entity_extraction',
  TEXT_SUMMARIZATION: 'text_summarization',
  TEXT_GENERATION: 'text_generation',
  TRANSLATION: 'translation',
  CLASSIFICATION: 'classification',

  // Vision Capabilities
  IMAGE_RECOGNITION: 'image_recognition',
  OBJECT_DETECTION: 'object_detection',
  OCR: 'ocr',
  IMAGE_GENERATION: 'image_generation',

  // Data Capabilities
  DATA_EXTRACTION: 'data_extraction',
  DATA_TRANSFORMATION: 'data_transformation',
  DATA_VALIDATION: 'data_validation',

  // Integration Capabilities
  API_CALL: 'api_call',
  DATABASE_QUERY: 'database_query',
  FILE_OPERATION: 'file_operation',

  // Workflow Capabilities
  TASK_ORCHESTRATION: 'task_orchestration',
  WORKFLOW_EXECUTION: 'workflow_execution',
  EVENT_PROCESSING: 'event_processing'
} as const;

export type CommonCapability = typeof CommonCapabilities[keyof typeof CommonCapabilities];

// Type guards
export function isValidCapabilityName(name: string): boolean {
  return /^[a-z0-9_]+$/.test(name);
}

export function hasRequiredResources(capability: Capability): boolean {
  return !!(
    capability.requirements?.minMemory ||
    capability.requirements?.minCPU ||
    capability.requirements?.gpu
  );
}

// Capability matching utilities
export function matchesCapabilityPattern(
  capability: string,
  pattern: string
): boolean {
  const regex = new RegExp(pattern.replace('*', '.*'));
  return regex.test(capability);
}

export function findCapabilityByType(
  capabilities: Capability[],
  type: CapabilityType
): Capability[] {
  return capabilities.filter(c => c.type === type);
}

export function findCapabilityByCategory(
  capabilities: Capability[],
  category: CapabilityCategory
): Capability[] {
  return capabilities.filter(c => c.category === category);
}