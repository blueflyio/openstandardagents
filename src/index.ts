/**
 * OSSA - Open Standard for Software Agents
 *
 * Main entry point for programmatic access.
 */

// CRITICAL: Import reflect-metadata FIRST (required for InversifyJS decorators)
import 'reflect-metadata';

// Export services
export { AgentAuditService } from './services/audit.js';
export type {
  AuditOptions,
  AgentHealth,
  AuditReport,
} from './services/audit.js';

// Export CLI (for programmatic use)
export { createAuditCommand } from './cli/commands/audit.js';

// Cognition types (CAOE)
export {
  HypothesisStatusSchema,
  CognitionEventTypeSchema,
  ActorTypeSchema,
  HypothesisSchema,
  PresenceSignalSchema,
  CognitionEventSchema,
  SessionSchema,
  OSSACognitionSpecSchema,
  CreateSessionRequestSchema,
  CreateSessionResponseSchema,
  EmitHypothesisRequestSchema,
  LockHypothesisRequestSchema,
  ConflictResolutionRequestSchema,
} from './types/cognition.zod.js';

export type {
  HypothesisStatus,
  CognitionEventType,
  ActorType,
  Hypothesis,
  PresenceSignal,
  CognitionEvent,
  Session,
  OSSACognitionSpec,
  CreateSessionRequest,
  CreateSessionResponse,
  EmitHypothesisRequest,
  LockHypothesisRequest,
  ConflictResolutionRequest,
} from './types/cognition.zod.js';
