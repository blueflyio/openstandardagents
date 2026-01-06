/**
 * Self-Evolving Agent Ecosystem API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: /Users/flux423/Sites/LLM/OssA/openstandardagents/openapi/reference-implementations/self-evolving-ecosystem.openapi.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:10:13.483Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

/**
 * Hierarchical coordination between agents
 */
export const coordinationMatrixSchema = z.object({
  orchestrators: z.array(z.string().uuid()).optional(),
  workers: z.array(z.string().uuid()).optional(),
  specialists: z.array(z.string().uuid()).optional(),
  dependencies: z.array(agentDependencySchema).optional(),
  communicationProtocol: z.enum(["event_driven", "request_response", "streaming", "pub_sub"]).optional(),
  conflictResolution: z.enum(["consensus", "priority_based", "ai_mediation", "escalation"]).optional()
});

export type CoordinationMatrix = z.infer<typeof coordinationMatrixSchema>;

/**
 * Current state of ecosystem self-evolution
 */
export const evolutionStateSchema = z.object({
  generation: z.number().int().optional(),
  fitnessScore: z.number().min(0).max(100).optional(),
  adaptationHistory: z.array(adaptationEventSchema).optional(),
  currentOptimizations: z.array(z.string()).optional(),
  learningRate: z.number().optional(),
  mutationProbability: z.number().min(0).max(1).optional()
});

export type EvolutionState = z.infer<typeof evolutionStateSchema>;

export const learningMetricsSchema = z.object({
  accuracy: z.number().min(0).max(1).optional(),
  loss: z.number().optional(),
  f1Score: z.number().optional(),
  precision: z.number().optional(),
  recall: z.number().optional(),
  trainingRounds: z.number().int().optional(),
  convergenceRate: z.number().optional(),
  privacyBudgetUsed: z.number().optional()
});

export type LearningMetrics = z.infer<typeof learningMetricsSchema>;

export const performanceMetricsSchema = z.object({
  ecosystemHealth: z.number().min(0).max(100).optional(),
  agentCoordination: z.number().min(0).max(1).optional(),
  learningEfficiency: z.number().optional(),
  adaptationSpeed: z.number().optional(),
  costEfficiency: z.number().optional(),
  userSatisfaction: z.number().min(0).max(5).optional()
});

export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;

export const ecosystemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["initializing", "evolving", "stable", "optimizing", "adapting"]),
  agents: z.array(agentSchema),
  coordinationMatrix: coordinationMatrixSchema,
  evolutionState: evolutionStateSchema,
  learningMetrics: learningMetricsSchema.optional(),
  performanceMetrics: performanceMetricsSchema.optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional()
});

export type Ecosystem = z.infer<typeof ecosystemSchema>;

export const agentPerformanceSchema = z.object({
  responseTime: z.number().optional(),
  throughput: z.number().optional(),
  accuracy: z.number().min(0).max(1).optional(),
  errorRate: z.number().optional(),
  resourceUtilization: z.number().min(0).max(1).optional(),
  learningVelocity: z.number().optional()
});

export type AgentPerformance = z.infer<typeof agentPerformanceSchema>;

export const agentLearningSchema = z.object({
  modelVersion: z.string().optional(),
  trainingRounds: z.number().int().optional(),
  accuracy: z.number().optional(),
  lastUpdated: z.string().datetime().optional(),
  personalizationLevel: z.number().min(0).max(1).optional(),
  knowledgeGraph: z.record(z.string(), z.unknown()).optional()
});

export type AgentLearning = z.infer<typeof agentLearningSchema>;

export const agentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(["orchestrator", "worker", "critic", "integrator", "specialist"]),
  role: z.enum(["security_compliance", "performance_optimization", "research_innovation", "knowledge_management", "infrastructure_ops", "revenue_optimization"]),
  capabilities: z.array(z.string()),
  status: z.enum(["active", "learning", "adapting", "idle", "error"]),
  performance: agentPerformanceSchema.optional(),
  learning: agentLearningSchema.optional(),
  coordination: z.array(coordinationLinkSchema).optional()
});

export type Agent = z.infer<typeof agentSchema>;

export const agentDependencySchema = z.object({
  from: z.string().uuid().optional(),
  to: z.string().uuid().optional(),
  type: z.enum(["requires", "provides", "collaborates", "monitors"]).optional(),
  strength: z.number().min(0).max(1).optional()
});

export type AgentDependency = z.infer<typeof agentDependencySchema>;

export const coordinationLinkSchema = z.object({
  targetAgentId: z.string().uuid().optional(),
  linkType: z.enum(["peer", "supervisor", "subordinate", "collaborator"]).optional(),
  communicationFrequency: z.number().optional(),
  successRate: z.number().min(0).max(1).optional()
});

export type CoordinationLink = z.infer<typeof coordinationLinkSchema>;

export const federatedLearningSessionSchema = z.object({
  id: z.string().uuid(),
  modelType: z.enum(["code_completion", "bug_prediction", "productivity_optimization", "collaboration_enhancement", "cognitive_load_prediction"]),
  participants: z.array(z.string().uuid()),
  privacyBudget: z.number(),
  rounds: z.number().int().min(1).optional(),
  convergenceThreshold: z.number().optional(),
  status: z.enum(["pending", "training", "aggregating", "completed", "failed"]).optional(),
  metrics: learningMetricsSchema.optional()
});

export type FederatedLearningSession = z.infer<typeof federatedLearningSessionSchema>;

/**
 * Real-time flow state optimization based on Csikszentmihalyi research
 */
export const flowStateOptimizationSchema = z.object({
  developerId: z.string().uuid(),
  currentState: z.enum(["flow", "anxiety", "boredom", "apathy", "arousal", "control", "worry", "relaxation"]),
  skillLevel: z.number().min(0).max(100).optional(),
  challengeLevel: z.number().min(0).max(100).optional(),
  cognitiveLoad: z.number().min(0).max(100).optional(),
  engagement: z.number().min(0).max(1).optional(),
  recommendations: z.array(z.string()).optional()
});

export type FlowStateOptimization = z.infer<typeof flowStateOptimizationSchema>;

export const achievementSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(["productivity", "quality", "collaboration", "learning", "innovation", "security"]).optional(),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]).optional(),
  points: z.number().int().optional(),
  gameCenterId: z.string().optional()
});

export type Achievement = z.infer<typeof achievementSchema>;

/**
 * Psychological impact on developer motivation
 */
export const motivationImpactSchema = z.object({
  autonomy: z.number().min(-1).max(1).optional(),
  mastery: z.number().min(-1).max(1).optional(),
  purpose: z.number().min(-1).max(1).optional(),
  socialConnection: z.number().min(-1).max(1).optional(),
  overallMotivation: z.number().min(0).max(100).optional()
});

export type MotivationImpact = z.infer<typeof motivationImpactSchema>;

export const gamificationEventSchema = z.object({
  eventType: z.enum(["achievement_unlocked", "level_up", "badge_earned", "challenge_completed", "leaderboard_rank_change", "skill_mastered", "flow_state_achieved"]),
  developerId: z.string().uuid(),
  achievement: achievementSchema.optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime(),
  impact: motivationImpactSchema.optional()
});

export type GamificationEvent = z.infer<typeof gamificationEventSchema>;

export const biometricDataSchema = z.object({
  heartRateVariability: z.number().optional(),
  eyeTracking: z.object({
  fixationDuration: z.number().optional(),
  saccadeVelocity: z.number().optional(),
  blinkRate: z.number().optional()
}).optional(),
  keystrokeDynamics: z.object({
  typingSpeed: z.number().optional(),
  errorRate: z.number().optional(),
  pauseFrequency: z.number().optional()
}).optional()
});

export type BiometricData = z.infer<typeof biometricDataSchema>;

export const behavioralDataSchema = z.object({
  taskCompletionTime: z.number().optional(),
  contextSwitches: z.number().int().optional(),
  helpRequests: z.number().int().optional(),
  aiInteractions: z.number().int().optional(),
  codeQualityScore: z.number().optional()
});

export type BehavioralData = z.infer<typeof behavioralDataSchema>;

/**
 * NASA Task Load Index
 */
export const nASATLXSchema = z.object({
  mentalDemand: z.number().int().min(0).max(100).optional(),
  physicalDemand: z.number().int().min(0).max(100).optional(),
  temporalDemand: z.number().int().min(0).max(100).optional(),
  performance: z.number().int().min(0).max(100).optional(),
  effort: z.number().int().min(0).max(100).optional(),
  frustration: z.number().int().min(0).max(100).optional()
});

export type NASATLX = z.infer<typeof nASATLXSchema>;

export const cognitiveLoadSchema = z.object({
  overall: z.number().min(0).max(100).optional(),
  intrinsic: z.number().optional(),
  extraneous: z.number().optional(),
  germane: z.number().optional(),
  prediction: z.enum(["low", "medium", "high", "overload"]).optional(),
  recommendations: z.array(z.string()).optional()
});

export type CognitiveLoad = z.infer<typeof cognitiveLoadSchema>;

/**
 * ResearchKit cognitive load measurement
 */
export const cognitiveLoadStudySchema = z.object({
  studyId: z.string().uuid(),
  participantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  biometricData: biometricDataSchema.optional(),
  behavioralData: behavioralDataSchema.optional(),
  nasaTLX: nASATLXSchema.optional(),
  cognitiveLoad: cognitiveLoadSchema.optional(),
  consent: z.boolean().optional()
});

export type CognitiveLoadStudy = z.infer<typeof cognitiveLoadStudySchema>;

export const marketConditionsSchema = z.object({
  competitorPricing: z.record(z.string(), z.unknown()).optional(),
  demandIndex: z.number().optional(),
  seasonality: z.string().optional(),
  economicIndicators: z.record(z.string(), z.unknown()).optional()
});

export type MarketConditions = z.infer<typeof marketConditionsSchema>;

export const customerProfileSchema = z.object({
  segment: z.enum(["individual", "small_team", "enterprise", "education", "open_source"]).optional(),
  usagePatterns: z.record(z.string(), z.unknown()).optional(),
  valueRealized: z.number().optional(),
  engagementScore: z.number().optional(),
  churnRisk: z.number().min(0).max(1).optional()
});

export type CustomerProfile = z.infer<typeof customerProfileSchema>;

export const dynamicPricingSchema = z.object({
  tier: z.enum(["freemium", "developer", "team", "enterprise"]),
  basePrice: z.number(),
  optimizedPrice: z.number(),
  marketConditions: marketConditionsSchema.optional(),
  customerProfile: customerProfileSchema.optional(),
  willingnessToPay: z.number().optional(),
  conversionProbability: z.number().min(0).max(1).optional(),
  revenueImpact: z.number().optional()
});

export type DynamicPricing = z.infer<typeof dynamicPricingSchema>;

export const adaptationEventSchema = z.object({
  timestamp: z.string().datetime().optional(),
  type: z.enum(["agent_added", "agent_removed", "capability_enhanced", "coordination_optimized", "performance_improved", "cost_reduced"]).optional(),
  impact: z.number().optional(),
  fitnessChange: z.number().optional(),
  description: z.string().optional()
});

export type AdaptationEvent = z.infer<typeof adaptationEventSchema>;

export const createEcosystemRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  initialAgents: z.array(z.object({
  name: z.string(),
  type: z.enum(["orchestrator", "worker", "critic", "integrator", "specialist"]),
  role: z.string(),
  capabilities: z.array(z.string()).optional()
})),
  coordinationStrategy: z.enum(["hierarchical", "mesh", "hybrid"]).optional(),
  learningEnabled: z.boolean().optional(),
  gamificationEnabled: z.boolean().optional()
});

export type CreateEcosystemRequest = z.infer<typeof createEcosystemRequestSchema>;

export const startFederatedLearningRequestSchema = z.object({
  modelType: z.enum(["code_completion", "bug_prediction", "productivity_optimization", "collaboration_enhancement", "cognitive_load_prediction"]),
  participantAgentIds: z.array(z.string().uuid()),
  privacyBudget: z.number().optional(),
  rounds: z.number().int().optional(),
  convergenceThreshold: z.number().optional()
});

export type StartFederatedLearningRequest = z.infer<typeof startFederatedLearningRequestSchema>;

export const optimizeFlowStateRequestSchema = z.object({
  developerId: z.string().uuid(),
  currentMetrics: z.object({
  skillLevel: z.number().optional(),
  challengeLevel: z.number().optional(),
  cognitiveLoad: z.number().optional(),
  engagement: z.number().optional()
}),
  preferences: z.object({
  preferredChallengeLevel: z.enum(["easy", "moderate", "challenging", "expert"]).optional(),
  learningGoals: z.array(z.string()).optional()
}).optional()
});

export type OptimizeFlowStateRequest = z.infer<typeof optimizeFlowStateRequestSchema>;

export const optimizePricingRequestSchema = z.object({
  tier: z.enum(["freemium", "developer", "team", "enterprise"]),
  customerId: z.string().uuid(),
  marketData: marketConditionsSchema.optional(),
  targetMetric: z.enum(["revenue", "conversion", "retention", "ltv"]).optional()
});

export type OptimizePricingRequest = z.infer<typeof optimizePricingRequestSchema>;

export const evolutionTriggerSchema = z.object({
  triggerType: z.enum(["performance_degradation", "new_capability_needed", "cost_optimization", "user_feedback", "market_change", "security_threat"]),
  context: z.record(z.string(), z.unknown()).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  autoExecute: z.boolean().optional()
});

export type EvolutionTrigger = z.infer<typeof evolutionTriggerSchema>;

export const errorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional()
});

export type Error = z.infer<typeof errorSchema>;
