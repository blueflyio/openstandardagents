/**
 * Worker Agents Index - OSSA v0.1.8 Compliant
 * 
 * Exports all worker agent implementations with self-assessment
 * and token optimization achieving 65% cost reduction target.
 */

export { BaseWorkerAgent } from './base-worker-agent';
export { TokenOptimizingWorkerAgent } from './token-optimizing-worker-agent';
export { SelfAssessingWorkerAgent } from './self-assessing-worker-agent';
export { 
  SpecializedWorkerAgents,
  CodeWorkerAgent,
  DocumentWorkerAgent,
  AnalysisWorkerAgent,
  CreativeWorkerAgent,
  SpecializedWorkerAgentFactory
} from './specialized-worker-agents';
export { WorkerRegistry } from './worker-registry';
export { WorkerMetricsCollector } from './worker-metrics';

// Worker Agent Types
export type {
  WorkerCapability,
  WorkerTask,
  WorkerExecutionResult,
  TokenOptimizationMetrics,
  SelfAssessmentReport,
  WorkerPerformanceMetrics,
  WorkerConfiguration,
  WorkerHealthStatus,
  CodeWorkerAgent as ICodeWorkerAgent,
  DocumentWorkerAgent as IDocumentWorkerAgent,
  AnalysisWorkerAgent as IAnalysisWorkerAgent,
  CreativeWorkerAgent as ICreativeWorkerAgent
} from './types';

// Registry Types
export type {
  WorkerRegistryEntry,
  WorkerDiscoveryOptions,
  WorkerAssignmentResult,
  RegistryMetrics
} from './worker-registry';

// Metrics Types
export type {
  MetricsSnapshot,
  ResourceUtilizationMetrics,
  QualityMetrics,
  CostMetrics,
  SLAMetrics,
  TrendAnalysis,
  PerformanceAlert,
  MetricsAggregation,
  BenchmarkComparison
} from './worker-metrics';