/**
 * OSSA spec.cognition — Collaborative Agent Cognition Schema
 *
 * Defines the cognition block added to every OSSA agent manifest.
 * Enables hypothesis broadcasting, lock/conflict detection, and
 * NIST SP 800-53 AU-2 audit trail for cognitive state changes.
 *
 * @module @openstandardagents/cognition
 * @version 0.4.0
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const HypothesisStatusSchema = z.enum([
  'forming',     // Agent is analyzing — not yet committed
  'active',      // Agent is executing against this hypothesis
  'locked',      // Human or arbitrator has locked this hypothesis (consensus)
  'superseded',  // Replaced by a newer hypothesis in the same session
  'rejected',    // Explicitly rejected by arbitrator
  'completed',   // Task done, hypothesis confirmed correct
]);

export type HypothesisStatus = z.infer<typeof HypothesisStatusSchema>;

export const CognitionEventTypeSchema = z.enum([
  'hypothesis.formed',
  'hypothesis.updated',
  'hypothesis.locked',
  'hypothesis.rejected',
  'hypothesis.completed',
  'conflict.detected',
  'conflict.resolved',
  'alignment.checkpoint',
  'session.joined',
  'session.left',
  'focus.changed',
]);

export type CognitionEventType = z.infer<typeof CognitionEventTypeSchema>;

export const ActorTypeSchema = z.enum(['human', 'agent']);
export type ActorType = z.infer<typeof ActorTypeSchema>;

// ============================================================================
// Core: Hypothesis
// ============================================================================

export const HypothesisSchema = z.object({
  /** Unique ID — UUIDv4 */
  id: z.string().uuid(),

  /** Session this hypothesis belongs to */
  sessionId: z.string().uuid(),

  /** OSSA agent ID or human identifier */
  actorId: z.string().min(1),
  actorType: ActorTypeSchema,

  /** Plain-language statement of what the agent believes it is doing */
  statement: z.string().min(1).max(1000),

  /** Machine-readable intent for conflict detection */
  intent: z.object({
    action: z.enum([
      'create', 'modify', 'delete', 'read', 'test',
      'refactor', 'review', 'deploy', 'analyze',
    ]),
    targetFiles: z.array(z.string()),
    targetPackages: z.array(z.string()),
    estimatedScope: z.enum(['line', 'function', 'file', 'module', 'package']),
    conflictSensitive: z.boolean().default(true),
  }),

  /** Current lifecycle status */
  status: HypothesisStatusSchema,

  /** Confidence score [0.0–1.0] */
  confidence: z.number().min(0).max(1),

  /** Reference to superseded hypothesis */
  supersedes: z.string().uuid().optional(),

  /** ISO 8601 timestamps */
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  /** Lock metadata */
  lockedBy: z.string().optional(),
  lockedAt: z.string().datetime().optional(),
});

export type Hypothesis = z.infer<typeof HypothesisSchema>;

// ============================================================================
// Core: Presence Signal
// ============================================================================

export const PresenceSignalSchema = z.object({
  actorId: z.string().min(1),
  actorType: ActorTypeSchema,
  actorLabel: z.string(),

  sessionId: z.string().uuid(),

  /** Current focus — what the actor is looking at / working on */
  focus: z.object({
    file: z.string().optional(),
    line: z.number().int().min(1).optional(),
    column: z.number().int().min(0).optional(),
    selection: z.object({
      startLine: z.number().int(),
      endLine: z.number().int(),
    }).optional(),
    package: z.string().optional(),
    scope: z.string().optional(),
  }),

  /** Active hypothesis ID for this actor in this session */
  activeHypothesisId: z.string().uuid().optional(),

  /** Hex color assigned by room */
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),

  status: z.enum(['active', 'idle', 'blocked', 'offline']),
  timestamp: z.string().datetime(),
});

export type PresenceSignal = z.infer<typeof PresenceSignalSchema>;

// ============================================================================
// Core: Cognition Event (Audit Trail)
// ============================================================================

export const CognitionEventSchema = z.object({
  id: z.string().uuid(),
  type: CognitionEventTypeSchema,
  sessionId: z.string().uuid(),
  actorId: z.string(),
  actorType: ActorTypeSchema,

  /** Related hypothesis (if applicable) */
  hypothesisId: z.string().uuid().optional(),

  /** Conflicting hypotheses (for conflict events) */
  conflictingHypothesisIds: z.array(z.string().uuid()).optional(),

  /** Agreed hypothesis (for alignment checkpoint events) */
  checkpointHypothesisId: z.string().uuid().optional(),

  /** Human-readable description */
  description: z.string(),

  /** Affected files for audit trail */
  affectedFiles: z.array(z.string()),

  /** NIST compliance tags */
  nist: z.object({
    control: z.string().default('AU-2'),
    classification: z.enum(['informational', 'warning', 'critical']),
    requiresReview: z.boolean().default(false),
  }),

  timestamp: z.string().datetime(),
});

export type CognitionEvent = z.infer<typeof CognitionEventSchema>;

// ============================================================================
// Core: Session
// ============================================================================

export const SessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),

  /** GitLab issue (optional but recommended) */
  gitlabIssueId: z.number().int().optional(),

  /** Git branch */
  branch: z.string().optional(),

  /** Scoped packages */
  packages: z.array(z.string()),

  status: z.enum(['active', 'paused', 'ended']),

  /** Current participants */
  participants: z.array(z.object({
    actorId: z.string(),
    actorType: ActorTypeSchema,
    joinedAt: z.string().datetime(),
    role: z.enum(['owner', 'collaborator', 'observer']),
  })),

  /** Active hypothesis IDs */
  activeHypothesisIds: z.array(z.string().uuid()),

  /** Alignment checkpoints */
  alignmentCheckpoints: z.array(z.object({
    id: z.string().uuid(),
    hypothesisId: z.string().uuid(),
    approvedBy: z.string(),
    approvedAt: z.string().datetime(),
    description: z.string(),
  })),

  /** WebSocket endpoint for Yjs sync */
  wsEndpoint: z.string().url(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
});

export type Session = z.infer<typeof SessionSchema>;

// ============================================================================
// OSSA Manifest Extension: spec.cognition
// ============================================================================

export const OSSACognitionSpecSchema = z.object({
  /** Whether this agent can participate in collaborative sessions */
  sessionCapable: z.boolean().default(false),

  /** Hypothesis emission policy */
  hypothesisEmission: z.enum(['required', 'optional', 'disabled']).default('optional'),

  /** Behavior on conflict detection */
  conflictBehavior: z.enum(['block', 'warn', 'defer']).default('block'),

  /** Approval needed to lock a hypothesis */
  alignmentGate: z.enum([
    'human_approval',
    'auto_on_confidence',
    'peer_agent',
    'none',
  ]).default('human_approval'),

  /** Confidence threshold for auto_on_confidence */
  autoLockConfidenceThreshold: z.number().min(0).max(1).default(0.95),

  /** Max concurrent hypotheses */
  maxConcurrentHypotheses: z.number().int().min(1).max(5).default(1),

  /** Cognitive fingerprint — populated by platform */
  cognitiveFingerprint: z.string().optional(),
});

export type OSSACognitionSpec = z.infer<typeof OSSACognitionSpecSchema>;

// ============================================================================
// Request/Response: API contracts
// ============================================================================

export const CreateSessionRequestSchema = z.object({
  name: z.string().min(1).max(100),
  gitlabIssueId: z.number().int().optional(),
  branch: z.string().optional(),
  packages: z.array(z.string()).min(1),
  agentIds: z.array(z.string()).optional(),
});

export const CreateSessionResponseSchema = z.object({
  session: SessionSchema,
  joinUrl: z.string().url(),
  wsEndpoint: z.string().url(),
});

export const EmitHypothesisRequestSchema = z.object({
  sessionId: z.string().uuid(),
  statement: z.string().min(1).max(1000),
  intent: HypothesisSchema.shape.intent,
  confidence: z.number().min(0).max(1),
  supersedes: z.string().uuid().optional(),
});

export const LockHypothesisRequestSchema = z.object({
  sessionId: z.string().uuid(),
  hypothesisId: z.string().uuid(),
  arbitratorId: z.string(),
  reason: z.string().optional(),
});

export const ConflictResolutionRequestSchema = z.object({
  sessionId: z.string().uuid(),
  winningHypothesisId: z.string().uuid(),
  losingHypothesisIds: z.array(z.string().uuid()),
  arbitratorId: z.string(),
  checkpointDescription: z.string(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;
export type EmitHypothesisRequest = z.infer<typeof EmitHypothesisRequestSchema>;
export type LockHypothesisRequest = z.infer<typeof LockHypothesisRequestSchema>;
export type ConflictResolutionRequest = z.infer<typeof ConflictResolutionRequestSchema>;
