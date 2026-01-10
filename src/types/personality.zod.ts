/**
 * OSSA Personality Zod Schemas
 * Validation schemas for spec.personality
 *
 * @module @openstandardagents/personality
 * @version 0.3.2
 */

import { z } from 'zod';

// ============================================================================
// Tone Schemas
// ============================================================================

export const TonePresetSchema = z.enum([
  'professional',
  'friendly',
  'formal',
  'casual',
  'technical',
  'concise',
  'verbose',
  'empathetic',
  'assertive',
  'neutral',
]);

export const StyleModifierSchema = z.enum([
  'helpful',
  'direct',
  'patient',
  'encouraging',
  'analytical',
  'creative',
  'cautious',
  'confident',
]);

export const EmojiUsageSchema = z.enum(['none', 'minimal', 'moderate', 'liberal']);

export const ToneConfigSchema = z.object({
  preset: TonePresetSchema.optional(),
  modifiers: z.array(StyleModifierSchema).optional(),
  custom: z.string().optional(),
  formality: z.number().min(0).max(1).optional(),
  verbosity: z.number().min(0).max(1).optional(),
  humor: z.number().min(0).max(1).optional(),
  emoji_usage: EmojiUsageSchema.optional(),
});

// ============================================================================
// Expertise Schemas
// ============================================================================

export const ExpertiseDomainSchema = z.enum([
  // Development
  'software-development',
  'frontend',
  'backend',
  'fullstack',
  'devops',
  'sre',
  'security',
  'testing',
  'documentation',
  // Languages
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'php',
  'java',
  'csharp',
  // Frameworks
  'react',
  'vue',
  'angular',
  'node',
  'drupal',
  'symfony',
  'django',
  'fastapi',
  'kubernetes',
  'terraform',
  // AI/ML
  'machine-learning',
  'llm',
  'agents',
  'mcp',
  'rag',
  // Other
  'data-engineering',
  'cloud-architecture',
  'api-design',
  'database',
  'cicd',
  'observability',
]);

export const ExpertiseLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

export const ExpertiseEntrySchema = z.object({
  domain: z.union([ExpertiseDomainSchema, z.string()]),
  level: ExpertiseLevelSchema.optional(),
  years: z.number().positive().optional(),
  specializations: z.array(z.string()).optional(),
});

// ============================================================================
// Behavioral Traits Schema
// ============================================================================

export const UncertaintyHandlingSchema = z.enum(['acknowledge', 'investigate', 'defer', 'estimate']);

export const ErrorResponseSchema = z.enum([
  'apologetic',
  'matter-of-fact',
  'solution-focused',
  'detailed',
]);

export const ProactivitySchema = z.enum(['reactive', 'suggestive', 'proactive', 'autonomous']);

export const CollaborationSchema = z.enum([
  'independent',
  'consultative',
  'collaborative',
  'deferential',
]);

export const DetailOrientationSchema = z.enum([
  'high-level',
  'balanced',
  'detailed',
  'comprehensive',
]);

export const RiskToleranceSchema = z.enum(['conservative', 'moderate', 'progressive', 'experimental']);

export const BehavioralTraitsSchema = z.object({
  uncertainty_handling: UncertaintyHandlingSchema.optional(),
  error_response: ErrorResponseSchema.optional(),
  proactivity: ProactivitySchema.optional(),
  collaboration: CollaborationSchema.optional(),
  detail_orientation: DetailOrientationSchema.optional(),
  risk_tolerance: RiskToleranceSchema.optional(),
});

// ============================================================================
// Communication Format Schema
// ============================================================================

export const ResponseLengthSchema = z.enum(['brief', 'moderate', 'detailed', 'comprehensive']);

export const CommunicationFormatSchema = z.object({
  response_length: ResponseLengthSchema.optional(),
  use_bullets: z.boolean().optional(),
  use_code_blocks: z.boolean().optional(),
  use_headings: z.boolean().optional(),
  include_summaries: z.boolean().optional(),
  language: z.string().optional(),
});

// ============================================================================
// Complete Personality Schema
// ============================================================================

export const PronounsSchema = z.enum(['it', 'they', 'he', 'she']);

export const PersonalitySpecSchema = z.object({
  name: z.string().min(1),
  tone: z.union([TonePresetSchema, ToneConfigSchema]),
  expertise: z.array(
    z.union([ExpertiseDomainSchema, z.string(), ExpertiseEntrySchema])
  ),
  tagline: z.string().optional(),
  description: z.string().optional(),
  traits: BehavioralTraitsSchema.optional(),
  format: CommunicationFormatSchema.optional(),
  pronouns: PronounsSchema.optional(),
  avatar: z.string().url().optional(),
  avoid_topics: z.array(z.string()).optional(),
  focus_topics: z.array(z.string()).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type TonePreset = z.infer<typeof TonePresetSchema>;
export type StyleModifier = z.infer<typeof StyleModifierSchema>;
export type EmojiUsage = z.infer<typeof EmojiUsageSchema>;
export type ToneConfig = z.infer<typeof ToneConfigSchema>;
export type ExpertiseDomain = z.infer<typeof ExpertiseDomainSchema>;
export type ExpertiseLevel = z.infer<typeof ExpertiseLevelSchema>;
export type ExpertiseEntry = z.infer<typeof ExpertiseEntrySchema>;
export type UncertaintyHandling = z.infer<typeof UncertaintyHandlingSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Proactivity = z.infer<typeof ProactivitySchema>;
export type Collaboration = z.infer<typeof CollaborationSchema>;
export type DetailOrientation = z.infer<typeof DetailOrientationSchema>;
export type RiskTolerance = z.infer<typeof RiskToleranceSchema>;
export type BehavioralTraits = z.infer<typeof BehavioralTraitsSchema>;
export type ResponseLength = z.infer<typeof ResponseLengthSchema>;
export type CommunicationFormat = z.infer<typeof CommunicationFormatSchema>;
export type Pronouns = z.infer<typeof PronounsSchema>;
export type PersonalitySpec = z.infer<typeof PersonalitySpecSchema>;
