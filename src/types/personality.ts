/**
 * OSSA Personality Types
 * Type definitions for spec.personality - agent behavior and tone configuration
 *
 * @module @openstandardagents/personality
 * @version 0.3.2
 *
 * Defines how an agent presents itself, communicates, and specializes.
 * Enables consistent agent behavior across different contexts.
 */

// ============================================================================
// Tone Types
// ============================================================================

/**
 * Predefined communication tone styles
 */
export type TonePreset =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'casual'
  | 'technical'
  | 'concise'
  | 'verbose'
  | 'empathetic'
  | 'assertive'
  | 'neutral';

/**
 * Communication style modifiers
 */
export type StyleModifier =
  | 'helpful'
  | 'direct'
  | 'patient'
  | 'encouraging'
  | 'analytical'
  | 'creative'
  | 'cautious'
  | 'confident';

// ============================================================================
// Expertise Types
// ============================================================================

/**
 * Domain expertise categories
 */
export type ExpertiseDomain =
  // Development
  | 'software-development'
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'devops'
  | 'sre'
  | 'security'
  | 'testing'
  | 'documentation'
  // Languages
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'rust'
  | 'php'
  | 'java'
  | 'csharp'
  // Frameworks
  | 'react'
  | 'vue'
  | 'angular'
  | 'node'
  | 'drupal'
  | 'symfony'
  | 'django'
  | 'fastapi'
  | 'kubernetes'
  | 'terraform'
  // AI/ML
  | 'machine-learning'
  | 'llm'
  | 'agents'
  | 'mcp'
  | 'rag'
  // Other
  | 'data-engineering'
  | 'cloud-architecture'
  | 'api-design'
  | 'database'
  | 'cicd'
  | 'observability';

/**
 * Expertise level
 */
export type ExpertiseLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

/**
 * Detailed expertise configuration
 */
export interface ExpertiseEntry {
  /** Domain of expertise */
  domain: ExpertiseDomain | string;
  /** Proficiency level */
  level?: ExpertiseLevel;
  /** Years of experience (for context) */
  years?: number;
  /** Specific areas within the domain */
  specializations?: string[];
}

// ============================================================================
// Tone Configuration
// ============================================================================

/**
 * Detailed tone configuration
 */
export interface ToneConfig {
  /** Primary tone preset */
  preset?: TonePreset;
  /** Style modifiers to apply */
  modifiers?: StyleModifier[];
  /** Custom tone description (for fine-tuning) */
  custom?: string;
  /** Formality level (0-1, 0=casual, 1=formal) */
  formality?: number;
  /** Verbosity level (0-1, 0=concise, 1=verbose) */
  verbosity?: number;
  /** Humor level (0-1, 0=serious, 1=playful) */
  humor?: number;
  /** Emoji usage (none, minimal, moderate, liberal) */
  emoji_usage?: 'none' | 'minimal' | 'moderate' | 'liberal';
}

// ============================================================================
// Behavioral Traits
// ============================================================================

/**
 * Agent behavioral traits
 */
export interface BehavioralTraits {
  /** How the agent handles uncertainty */
  uncertainty_handling?: 'acknowledge' | 'investigate' | 'defer' | 'estimate';
  /** How the agent responds to errors */
  error_response?:
    | 'apologetic'
    | 'matter-of-fact'
    | 'solution-focused'
    | 'detailed';
  /** Proactivity level */
  proactivity?: 'reactive' | 'suggestive' | 'proactive' | 'autonomous';
  /** Collaboration style */
  collaboration?:
    | 'independent'
    | 'consultative'
    | 'collaborative'
    | 'deferential';
  /** Detail orientation */
  detail_orientation?: 'high-level' | 'balanced' | 'detailed' | 'comprehensive';
  /** Risk tolerance */
  risk_tolerance?: 'conservative' | 'moderate' | 'progressive' | 'experimental';
}

// ============================================================================
// Communication Preferences
// ============================================================================

/**
 * Communication formatting preferences
 */
export interface CommunicationFormat {
  /** Preferred response length */
  response_length?: 'brief' | 'moderate' | 'detailed' | 'comprehensive';
  /** Use bullet points */
  use_bullets?: boolean;
  /** Use code blocks for examples */
  use_code_blocks?: boolean;
  /** Include headings in long responses */
  use_headings?: boolean;
  /** Provide summaries for long content */
  include_summaries?: boolean;
  /** Default language for communication */
  language?: string;
}

// ============================================================================
// Complete Personality Specification
// ============================================================================

/**
 * Complete agent personality configuration
 * Used in spec.personality within OSSA manifests
 */
export interface PersonalitySpec {
  /** Agent display name */
  name: string;
  /** Communication tone configuration */
  tone: TonePreset | ToneConfig;
  /** Areas of expertise */
  expertise: (ExpertiseDomain | string | ExpertiseEntry)[];
  /** Short tagline/motto */
  tagline?: string;
  /** Longer description of the agent's purpose */
  description?: string;
  /** Behavioral traits */
  traits?: BehavioralTraits;
  /** Communication formatting preferences */
  format?: CommunicationFormat;
  /** Pronouns (for natural language generation) */
  pronouns?: 'it' | 'they' | 'he' | 'she';
  /** Avatar/icon URL */
  avatar?: string;
  /** Topics the agent should avoid discussing */
  avoid_topics?: string[];
  /** Topics the agent should focus on */
  focus_topics?: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a value is a ToneConfig object
 */
export function isToneConfig(
  tone: TonePreset | ToneConfig
): tone is ToneConfig {
  return typeof tone === 'object' && tone !== null;
}

/**
 * Check if a value is an ExpertiseEntry object
 */
export function isExpertiseEntry(
  expertise: ExpertiseDomain | string | ExpertiseEntry
): expertise is ExpertiseEntry {
  return (
    typeof expertise === 'object' && expertise !== null && 'domain' in expertise
  );
}

/**
 * Normalize tone to ToneConfig
 */
export function normalizeTone(tone: TonePreset | ToneConfig): ToneConfig {
  if (isToneConfig(tone)) {
    return tone;
  }
  return { preset: tone };
}

/**
 * Normalize expertise array to ExpertiseEntry[]
 */
export function normalizeExpertise(
  expertise: (ExpertiseDomain | string | ExpertiseEntry)[]
): ExpertiseEntry[] {
  return expertise.map((exp) => {
    if (isExpertiseEntry(exp)) {
      return exp;
    }
    return { domain: exp };
  });
}

/**
 * Create a default personality configuration
 */
export function createDefaultPersonality(name: string): PersonalitySpec {
  return {
    name,
    tone: 'professional',
    expertise: [],
    traits: {
      uncertainty_handling: 'acknowledge',
      error_response: 'solution-focused',
      proactivity: 'suggestive',
      collaboration: 'collaborative',
      detail_orientation: 'balanced',
      risk_tolerance: 'moderate',
    },
    format: {
      response_length: 'moderate',
      use_bullets: true,
      use_code_blocks: true,
      use_headings: true,
      include_summaries: false,
    },
    pronouns: 'it',
  };
}
