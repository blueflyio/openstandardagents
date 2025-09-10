/**
 * Trainer Agents Index - OSSA v0.1.8 Compliant
 * 
 * Central export module for all trainer agent implementations with
 * vector-optimized learning signals and 91% context preservation validation.
 * 
 * This module provides a unified interface to access all trainer agents,
 * types, and validation utilities for the OSSA learning optimization system.
 */

// Core Base Classes
export { BaseTrainerAgent } from './base-trainer-agent';

// Specialized Trainer Implementations
export { ContextPreservationTrainer } from './context-preservation-trainer';
export { VectorOptimizationTrainer } from './vector-optimization-trainer';
export { LearningSignalSynthesizer } from './learning-signal-synthesizer';

// Validation and Metrics
export { ContextPreservationValidator } from './validation-metrics';

// Type Definitions
export type {
  // Core Learning Types
  VectorLearningSignal,
  ContextPreservationMetrics,
  LearningTask,
  TrainingExecutionResult,
  
  // Trainer Configuration Types
  TrainerConfiguration,
  TrainerCapability,
  TrainerHealthMetrics,
  
  // Learning Signal Types
  LearningSignalSynthesizer as LearningSignalSynthesizerInterface,
  VectorOptimizationTargets,
  VectorOptimizationCriteria,
  LearningInsights,
  
  // Specialized Trainer Types
  ContextPreservationTrainer as ContextPreservationTrainerInterface,
  VectorOptimizationTrainer as VectorOptimizationTrainerInterface,
  LearningSignalTrainer,
  KnowledgeTransferTrainer,
  
  // Validation Types
  ValidationMetrics,
  DegradationAnalysis,
  ImprovementSuggestion,
  ValidationMetadata,
  ValidationConfig,
  QualityRequirements,
  PerformanceBenchmarks,
  SignalQualityValidation,
  ExecutionValidation,
  MonitoringReport
} from './types';

// Export validation metrics types
export type {
  ValidationConfig,
  QualityRequirements,
  PerformanceBenchmarks,
  SignalQualityValidation,
  ExecutionValidation,
  MonitoringReport
} from './validation-metrics';

// Trainer Factory and Utilities
export class TrainerFactory {
  private static readonly TRAINER_TYPES = {
    'context_preservation': ContextPreservationTrainer,
    'vector_optimization': VectorOptimizationTrainer,
    'learning_synthesis': LearningSignalSynthesizer
  } as const;

  /**
   * Create a trainer agent instance based on type and configuration
   */
  static createTrainer(
    trainer_type: keyof typeof TrainerFactory.TRAINER_TYPES,
    trainer_id: string,
    configuration?: any
  ): BaseTrainerAgent {
    const TrainerClass = TrainerFactory.TRAINER_TYPES[trainer_type];
    
    if (!TrainerClass) {
      throw new Error(`Unknown trainer type: ${trainer_type}`);
    }
    
    return new TrainerClass(trainer_id, configuration);
  }

  /**
   * Get available trainer types
   */
  static getAvailableTrainerTypes(): string[] {
    return Object.keys(TrainerFactory.TRAINER_TYPES);
  }

  /**
   * Validate trainer configuration
   */
  static validateTrainerConfiguration(
    trainer_type: string,
    configuration: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!trainer_type) {
      errors.push('Trainer type is required');
    }

    if (trainer_type && !TrainerFactory.TRAINER_TYPES[trainer_type as keyof typeof TrainerFactory.TRAINER_TYPES]) {
      errors.push(`Invalid trainer type: ${trainer_type}`);
    }

    // Type-specific validation
    switch (trainer_type) {
      case 'context_preservation':
        if (configuration?.learning_settings?.target_context_preservation < 85) {
          errors.push('Context preservation target must be at least 85%');
        }
        break;
      
      case 'vector_optimization':
        if (configuration?.vector_processing?.max_vector_dimensions < 128) {
          errors.push('Vector dimensions must be at least 128');
        }
        break;
      
      case 'learning_synthesis':
        if (!configuration?.signal_types || configuration.signal_types.length === 0) {
          errors.push('At least one signal type must be specified for learning synthesis');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Trainer Registry for managing active trainer instances
export class TrainerRegistry {
  private static instance: TrainerRegistry;
  private trainers: Map<string, BaseTrainerAgent> = new Map();
  private validator: ContextPreservationValidator;

  private constructor() {
    this.validator = new ContextPreservationValidator('trainer-registry-validator');
  }

  static getInstance(): TrainerRegistry {
    if (!TrainerRegistry.instance) {
      TrainerRegistry.instance = new TrainerRegistry();
    }
    return TrainerRegistry.instance;
  }

  /**
   * Register a trainer instance
   */
  registerTrainer(trainer: BaseTrainerAgent): void {
    this.trainers.set(trainer.id, trainer);
    console.log(`[TrainerRegistry] Registered trainer: ${trainer.id} (${trainer.name})`);
  }

  /**
   * Unregister a trainer instance
   */
  unregisterTrainer(trainer_id: string): boolean {
    const removed = this.trainers.delete(trainer_id);
    if (removed) {
      console.log(`[TrainerRegistry] Unregistered trainer: ${trainer_id}`);
    }
    return removed;
  }

  /**
   * Get trainer by ID
   */
  getTrainer(trainer_id: string): BaseTrainerAgent | undefined {
    return this.trainers.get(trainer_id);
  }

  /**
   * Get all registered trainers
   */
  getAllTrainers(): BaseTrainerAgent[] {
    return Array.from(this.trainers.values());
  }

  /**
   * Get trainers by specialization
   */
  getTrainersBySpecialization(specialization: string): BaseTrainerAgent[] {
    return this.getAllTrainers().filter(trainer => {
      // Check if trainer has specialization property
      return (trainer as any).specialization === specialization;
    });
  }

  /**
   * Get healthy trainers
   */
  getHealthyTrainers(): BaseTrainerAgent[] {
    return this.getAllTrainers().filter(trainer => trainer.status === 'healthy');
  }

  /**
   * Validate all registered trainers
   */
  async validateAllTrainers(): Promise<Map<string, any>> {
    const validation_results = new Map<string, any>();
    
    for (const [trainer_id, trainer] of this.trainers) {
      try {
        const health_metrics = await trainer.healthCheck();
        validation_results.set(trainer_id, {
          status: 'validated',
          health_metrics,
          timestamp: Date.now()
        });
      } catch (error) {
        validation_results.set(trainer_id, {
          status: 'validation_failed',
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
    
    return validation_results;
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    total_trainers: number;
    healthy_trainers: number;
    degraded_trainers: number;
    unhealthy_trainers: number;
    specializations: Record<string, number>;
  } {
    const trainers = this.getAllTrainers();
    const stats = {
      total_trainers: trainers.length,
      healthy_trainers: trainers.filter(t => t.status === 'healthy').length,
      degraded_trainers: trainers.filter(t => t.status === 'degraded').length,
      unhealthy_trainers: trainers.filter(t => t.status === 'unhealthy').length,
      specializations: {} as Record<string, number>
    };

    // Count by specialization
    trainers.forEach(trainer => {
      const specialization = (trainer as any).specialization || 'unknown';
      stats.specializations[specialization] = (stats.specializations[specialization] || 0) + 1;
    });

    return stats;
  }
}

// Utility Functions
export const TrainerUtils = {
  /**
   * Validate context preservation score meets 91% target
   */
  validatePreservationTarget(preservation_score: number, target: number = 91): boolean {
    return preservation_score >= target;
  },

  /**
   * Calculate learning signal quality score
   */
  calculateSignalQuality(signals: any[]): number {
    if (!signals || signals.length === 0) return 0;
    return signals.reduce((sum, signal) => sum + (signal.context_preservation_score || 0), 0) / signals.length;
  },

  /**
   * Validate training execution result
   */
  validateTrainingResult(result: any, requirements: any = {}): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!result) {
      issues.push('Training result is null or undefined');
      return { valid: false, issues };
    }

    // Check context preservation
    const preservation_score = result.context_preservation_metrics?.preservation_percentage || 0;
    if (preservation_score < (requirements.minimum_preservation || 91)) {
      issues.push(`Context preservation (${preservation_score}%) below target (${requirements.minimum_preservation || 91}%)`);
    }

    // Check execution status
    if (result.status !== 'completed') {
      issues.push(`Training execution status: ${result.status}`);
    }

    // Check learning signals
    if (!result.learning_signals_generated || result.learning_signals_generated.length === 0) {
      issues.push('No learning signals generated');
    }

    // Check validation results
    if (!result.validation_results?.preservation_validation_passed) {
      issues.push('Preservation validation failed');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  },

  /**
   * Format preservation metrics for reporting
   */
  formatPreservationMetrics(metrics: any): string {
    if (!metrics) return 'No metrics available';
    
    const lines = [
      `Context Preservation: ${metrics.preservation_percentage?.toFixed(2) || 'N/A'}%`,
      `Target Threshold: ${metrics.target_threshold || 91}%`,
      `Semantic Coherence: ${(metrics.validation_checkpoints?.semantic_coherence * 100)?.toFixed(2) || 'N/A'}%`,
      `Contextual Relevance: ${(metrics.validation_checkpoints?.contextual_relevance * 100)?.toFixed(2) || 'N/A'}%`,
      `Information Retention: ${(metrics.validation_checkpoints?.information_retention * 100)?.toFixed(2) || 'N/A'}%`,
      `Conceptual Integrity: ${(metrics.validation_checkpoints?.conceptual_integrity * 100)?.toFixed(2) || 'N/A'}%`
    ];

    return lines.join('\n');
  }
};

// Constants
export const TRAINER_CONSTANTS = {
  CONTEXT_PRESERVATION_TARGET: 91,
  MINIMUM_PRESERVATION_THRESHOLD: 85,
  CRITICAL_PRESERVATION_THRESHOLD: 75,
  DEFAULT_QUALITY_THRESHOLD: 0.85,
  MAX_VECTOR_DIMENSIONS: 2048,
  DEFAULT_SIGNAL_QUALITY_THRESHOLD: 0.85
};

// Version and Metadata
export const TRAINER_MODULE_INFO = {
  version: '0.1.8',
  name: 'OSSA Trainer Agents',
  description: 'Vector-optimized learning signal trainers with 91% context preservation',
  compliance: ['OSSA-v0.1.8', 'UADP', 'ISO-42001'],
  capabilities: [
    'context_preservation_training',
    'vector_optimization',
    'learning_signal_synthesis',
    'quality_validation',
    'real_time_monitoring'
  ],
  last_updated: '2024-09-08'
};

// Default export for convenience
export default {
  TrainerFactory,
  TrainerRegistry,
  TrainerUtils,
  TRAINER_CONSTANTS,
  TRAINER_MODULE_INFO,
  
  // Quick access to commonly used classes
  BaseTrainerAgent,
  ContextPreservationTrainer,
  VectorOptimizationTrainer,
  LearningSignalSynthesizer,
  ContextPreservationValidator
};