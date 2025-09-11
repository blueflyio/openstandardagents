/**
 * Trainer Agent Types - OSSA v0.1.8 Compliant
 * 
 * Type definitions for trainer agents that synthesize vector-optimized
 * learning signals with 91% context preservation validation.
 */

import { UADPAgent } from '../../types/uadp-discovery';
import { WorkerCapability, WorkerTask, WorkerExecutionResult } from '../workers/types';

export interface VectorLearningSignal {
  signal_id: string;
  timestamp: number;
  vector_dimensions: number;
  embedding_values: number[];
  context_preservation_score: number;
  learning_weight: number;
  signal_type: 'contextual' | 'semantic' | 'behavioral' | 'performance';
  source_task_id: string;
  metadata: {
    complexity_level: number;
    domain_category: string;
    quality_indicators: Record<string, number>;
    optimization_potential: number;
  };
}

export interface ContextPreservationMetrics {
  preservation_percentage: number;
  target_threshold: number; // 91%
  validation_checkpoints: {
    semantic_coherence: number;
    contextual_relevance: number;
    information_retention: number;
    conceptual_integrity: number;
  };
  degradation_factors: Array<{
    factor_type: string;
    impact_percentage: number;
    mitigation_strategy: string;
  }>;
  enhancement_opportunities: Array<{
    opportunity_type: string;
    potential_improvement: number;
    implementation_complexity: 'low' | 'medium' | 'high';
  }>;
}

export interface LearningTask extends WorkerTask {
  learning_objectives: string[];
  context_preservation_requirements: {
    minimum_preservation_percentage: number;
    critical_context_elements: string[];
    acceptable_loss_areas: string[];
  };
  vector_optimization_targets: {
    target_dimensions: number;
    compression_ratio: number;
    similarity_threshold: number;
  };
  validation_criteria: {
    performance_benchmarks: Record<string, number>;
    quality_gates: string[];
    success_metrics: string[];
  };
}

export interface TrainingExecutionResult extends WorkerExecutionResult {
  learning_signals_generated: VectorLearningSignal[];
  context_preservation_metrics: ContextPreservationMetrics;
  vector_optimization_results: {
    original_vector_size: number;
    optimized_vector_size: number;
    compression_achieved: number;
    quality_retention_score: number;
  };
  knowledge_transfer_metrics: {
    concepts_learned: number;
    patterns_identified: number;
    generalization_capability: number;
    transfer_efficiency: number;
  };
  validation_results: {
    preservation_validation_passed: boolean;
    performance_benchmarks_met: boolean;
    quality_gates_passed: string[];
    overall_success_score: number;
  };
}

export interface TrainerCapability extends WorkerCapability {
  learning_domains: string[];
  vector_processing_capacity: number;
  context_preservation_expertise: number;
  supported_signal_types: Array<'contextual' | 'semantic' | 'behavioral' | 'performance'>;
  optimization_techniques: string[];
  validation_methods: string[];
}

export interface TrainerConfiguration {
  trainer_id: string;
  trainer_type: 'context_preservation' | 'vector_optimization' | 'learning_synthesis' | 'knowledge_transfer';
  learning_settings: {
    target_context_preservation: number; // Default: 91%
    vector_optimization_aggressive: boolean;
    signal_generation_frequency: 'continuous' | 'batch' | 'on_demand';
    quality_over_speed_preference: number; // 0-1 scale
  };
  vector_processing: {
    max_vector_dimensions: number;
    supported_embedding_models: string[];
    compression_techniques: string[];
    similarity_metrics: string[];
  };
  validation_requirements: {
    minimum_preservation_score: number;
    quality_gate_thresholds: Record<string, number>;
    benchmark_validation_frequency: string;
    human_review_triggers: string[];
  };
  performance_optimization: {
    batch_size_optimization: boolean;
    parallel_processing_enabled: boolean;
    memory_management_strategy: 'conservative' | 'aggressive' | 'adaptive';
    resource_usage_limits: {
      max_memory_mb: number;
      max_cpu_percentage: number;
      max_processing_time_ms: number;
    };
  };
}

export interface LearningSignalSynthesizer {
  synthesize_signals(
    input_tasks: LearningTask[],
    context_data: Record<string, any>,
    optimization_targets: VectorOptimizationTargets
  ): Promise<VectorLearningSignal[]>;
  
  validate_context_preservation(
    original_context: Record<string, any>,
    processed_context: Record<string, any>,
    preservation_target: number
  ): Promise<ContextPreservationMetrics>;
  
  optimize_vectors(
    signals: VectorLearningSignal[],
    optimization_criteria: VectorOptimizationCriteria
  ): Promise<VectorLearningSignal[]>;
  
  generate_learning_insights(
    signals: VectorLearningSignal[],
    performance_data: TrainingExecutionResult[]
  ): Promise<LearningInsights>;
}

export interface VectorOptimizationTargets {
  target_compression_ratio: number;
  quality_preservation_minimum: number;
  processing_speed_priority: number;
  memory_efficiency_target: number;
}

export interface VectorOptimizationCriteria {
  optimization_algorithm: 'pca' | 'autoencoder' | 'sparse_coding' | 'quantization';
  quality_metrics: string[];
  performance_constraints: {
    max_processing_time_ms: number;
    max_memory_usage_mb: number;
    min_accuracy_retention: number;
  };
  validation_methods: string[];
}

export interface LearningInsights {
  insight_id: string;
  generation_timestamp: number;
  learning_patterns_identified: Array<{
    pattern_type: string;
    confidence_score: number;
    frequency: number;
    impact_on_performance: number;
    generalization_potential: number;
  }>;
  optimization_recommendations: Array<{
    recommendation_type: string;
    priority_level: 'low' | 'medium' | 'high' | 'critical';
    expected_improvement: number;
    implementation_effort: number;
    risk_assessment: string;
  }>;
  context_preservation_analysis: {
    preservation_trends: Record<string, number[]>;
    critical_preservation_factors: string[];
    degradation_risk_areas: string[];
    enhancement_opportunities: string[];
  };
  performance_correlations: Array<{
    factor_a: string;
    factor_b: string;
    correlation_strength: number;
    statistical_significance: number;
    actionable_insight: string;
  }>;
}

export interface TrainerHealthMetrics {
  trainer_id: string;
  learning_signal_quality: {
    average_preservation_score: number;
    signal_consistency: number;
    vector_optimization_efficiency: number;
    validation_success_rate: number;
  };
  resource_utilization: {
    memory_usage_percentage: number;
    cpu_utilization_percentage: number;
    vector_processing_throughput: number;
    batch_processing_efficiency: number;
  };
  knowledge_transfer_effectiveness: {
    learning_velocity: number;
    knowledge_retention_score: number;
    generalization_capability: number;
    adaptation_rate: number;
  };
  validation_metrics: {
    preservation_target_achievement: number; // % of time 91% target is met
    quality_gate_pass_rate: number;
    benchmark_performance_trend: number[];
    human_review_frequency: number;
  };
}

// Specialized Trainer Agent Types
export interface ContextPreservationTrainer extends UADPAgent {
  specialization: 'context_preservation';
  preservation_techniques: string[];
  supported_context_types: string[];
  validation_methods: string[];
  target_preservation_percentage: number; // 91%
}

export interface VectorOptimizationTrainer extends UADPAgent {
  specialization: 'vector_optimization';
  optimization_algorithms: string[];
  supported_vector_formats: string[];
  compression_techniques: string[];
  quality_metrics: string[];
}

export interface LearningSignalTrainer extends UADPAgent {
  specialization: 'learning_signal_synthesis';
  signal_types: Array<'contextual' | 'semantic' | 'behavioral' | 'performance'>;
  synthesis_methods: string[];
  quality_validation_techniques: string[];
  optimization_capabilities: string[];
}

export interface KnowledgeTransferTrainer extends UADPAgent {
  specialization: 'knowledge_transfer';
  transfer_mechanisms: string[];
  domain_expertise: string[];
  generalization_techniques: string[];
  validation_frameworks: string[];
}