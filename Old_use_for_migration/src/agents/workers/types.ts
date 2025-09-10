/**
 * Worker Agent Types - OSSA v0.1.8 Compliant
 * 
 * Core type definitions for worker agents with self-assessment
 * and token optimization capabilities.
 */

import { UADPAgent } from '../../types/uadp-discovery';

export interface WorkerCapability {
  id: string;
  name: string;
  description: string;
  domain: string;
  complexity_level: 'simple' | 'moderate' | 'complex' | 'expert';
  estimated_token_cost: number;
  quality_threshold: number;
  requires_self_assessment: boolean;
  optimization_potential: number; // Percentage improvement possible
}

export interface WorkerTask {
  id: string;
  type: string;
  description: string;
  input_data: any;
  required_capability: string;
  quality_requirements: {
    min_accuracy: number;
    max_response_time_ms: number;
    max_token_budget: number;
  };
  context?: Record<string, any>;
  priority: number;
  deadline_ms?: number;
}

export interface WorkerExecutionResult {
  task_id: string;
  worker_id: string;
  status: 'completed' | 'failed' | 'partial' | 'timeout';
  result_data: any;
  execution_metrics: {
    start_time: number;
    end_time: number;
    execution_time_ms: number;
    tokens_consumed: number;
    tokens_saved: number;
    cost_reduction_percentage: number;
  };
  quality_assessment: {
    accuracy_score: number;
    completeness_score: number;
    relevance_score: number;
    overall_quality: number;
  };
  self_assessment_report?: SelfAssessmentReport;
  optimization_applied: TokenOptimizationMetrics;
  error_details?: {
    error_type: string;
    error_message: string;
    recovery_suggestions: string[];
  };
}

export interface TokenOptimizationMetrics {
  original_token_estimate: number;
  optimized_token_usage: number;
  optimization_techniques_used: string[];
  cost_savings_percentage: number;
  quality_impact_score: number;
  optimization_confidence: number;
}

export interface SelfAssessmentReport {
  assessment_id: string;
  worker_id: string;
  task_id: string;
  assessment_timestamp: number;
  confidence_score: number; // 0-1
  quality_indicators: {
    completeness: number;
    accuracy: number;
    relevance: number;
    coherence: number;
  };
  potential_issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    suggested_mitigation: string;
  }>;
  improvement_suggestions: string[];
  requires_human_review: boolean;
  validation_checkpoints_passed: number;
  validation_checkpoints_total: number;
}

export interface WorkerPerformanceMetrics {
  worker_id: string;
  measurement_period: {
    start_time: number;
    end_time: number;
  };
  task_metrics: {
    tasks_completed: number;
    tasks_failed: number;
    average_execution_time_ms: number;
    average_quality_score: number;
    average_token_optimization: number;
  };
  cost_efficiency: {
    total_tokens_saved: number;
    total_cost_reduction: number;
    cost_reduction_percentage: number;
    target_achievement: number; // How close to 65% target
  };
  reliability_metrics: {
    success_rate: number;
    error_rate: number;
    timeout_rate: number;
    recovery_rate: number;
  };
  self_assessment_accuracy: {
    predictions_made: number;
    predictions_correct: number;
    accuracy_percentage: number;
    calibration_score: number;
  };
}

export interface WorkerConfiguration {
  worker_id: string;
  worker_type: string;
  capabilities: WorkerCapability[];
  optimization_settings: {
    target_cost_reduction: number; // Default: 65%
    max_quality_trade_off: number; // Max quality loss acceptable
    token_optimization_strategies: string[];
    self_assessment_frequency: 'always' | 'periodic' | 'on_error';
  };
  performance_thresholds: {
    min_success_rate: number;
    max_average_response_time: number;
    min_quality_score: number;
    target_cost_reduction: number;
  };
  compliance_requirements: {
    frameworks: string[];
    certification_level: 'bronze' | 'silver' | 'gold';
    audit_logging: boolean;
    security_level: 'standard' | 'enhanced' | 'maximum';
  };
}

export interface WorkerHealthStatus {
  worker_id: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';
  health_score: number; // 0-100
  last_health_check: number;
  performance_indicators: {
    response_time: 'good' | 'acceptable' | 'poor';
    success_rate: 'good' | 'acceptable' | 'poor';
    resource_usage: 'optimal' | 'moderate' | 'high';
    cost_efficiency: 'excellent' | 'good' | 'needs_improvement';
  };
  active_tasks: number;
  queue_length: number;
  recent_errors: Array<{
    timestamp: number;
    error_type: string;
    error_count: number;
  }>;
}

// Specialized Worker Types
export interface CodeWorkerAgent extends UADPAgent {
  specialization: 'code_generation' | 'code_review' | 'debugging' | 'refactoring';
  supported_languages: string[];
  framework_expertise: string[];
}

export interface DocumentWorkerAgent extends UADPAgent {
  specialization: 'technical_writing' | 'documentation' | 'translation' | 'summarization';
  supported_formats: string[];
  domain_expertise: string[];
}

export interface AnalysisWorkerAgent extends UADPAgent {
  specialization: 'data_analysis' | 'research' | 'validation' | 'compliance_checking';
  analysis_frameworks: string[];
  domain_knowledge: string[];
}

export interface CreativeWorkerAgent extends UADPAgent {
  specialization: 'content_creation' | 'design' | 'brainstorming' | 'problem_solving';
  creative_domains: string[];
  style_preferences: string[];
}