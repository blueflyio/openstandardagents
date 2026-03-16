/**
 * Tests for OSSA Cognition Zod Schemas
 */

import { describe, expect, it } from 'vitest';
import {
  ActorTypeSchema,
  CognitionEventSchema,
  CognitionEventTypeSchema,
  ConflictResolutionRequestSchema,
  CreateSessionRequestSchema,
  CreateSessionResponseSchema,
  EmitHypothesisRequestSchema,
  HypothesisSchema,
  HypothesisStatusSchema,
  LockHypothesisRequestSchema,
  OSSACognitionSpecSchema,
  PresenceSignalSchema,
  SessionSchema,
} from '../../src/types/cognition.zod.js';

// ============================================================================
// Test Helpers
// ============================================================================

const validUUID = '550e8400-e29b-41d4-a716-446655440000';
const validUUID2 = '660e8400-e29b-41d4-a716-446655440001';
const validDatetime = '2026-03-13T12:00:00Z';

function makeValidHypothesis(overrides: Record<string, unknown> = {}) {
  return {
    id: validUUID,
    sessionId: validUUID2,
    actorId: 'agent:pipeline-worker',
    actorType: 'agent' as const,
    statement: 'Implementing RoomBroker service in @bluefly/agent-mesh',
    intent: {
      action: 'create' as const,
      targetFiles: ['src/services/room/RoomBroker.ts'],
      targetPackages: ['@bluefly/agent-mesh'],
      estimatedScope: 'file' as const,
      conflictSensitive: true,
    },
    status: 'active' as const,
    confidence: 0.85,
    createdAt: validDatetime,
    updatedAt: validDatetime,
    ...overrides,
  };
}

function makeValidSession(overrides: Record<string, unknown> = {}) {
  return {
    id: validUUID,
    name: 'CAOE Session',
    packages: ['@bluefly/agent-mesh'],
    status: 'active' as const,
    participants: [],
    activeHypothesisIds: [],
    alignmentCheckpoints: [],
    wsEndpoint: 'wss://mesh.blueflyagents.com/session/123/sync',
    createdAt: validDatetime,
    updatedAt: validDatetime,
    ...overrides,
  };
}

function makeValidPresenceSignal(overrides: Record<string, unknown> = {}) {
  return {
    actorId: 'agent:worker-1',
    actorType: 'agent' as const,
    actorLabel: 'agent:worker-1',
    sessionId: validUUID,
    focus: { file: 'src/index.ts', line: 42 },
    color: '#FF6B6B',
    status: 'active' as const,
    timestamp: validDatetime,
    ...overrides,
  };
}

// ============================================================================
// Enum Schemas
// ============================================================================

describe('HypothesisStatusSchema', () => {
  it('accepts all valid statuses', () => {
    for (const s of ['forming', 'active', 'locked', 'superseded', 'rejected', 'completed']) {
      expect(HypothesisStatusSchema.parse(s)).toBe(s);
    }
  });

  it('rejects invalid status', () => {
    expect(() => HypothesisStatusSchema.parse('invalid')).toThrow();
    expect(() => HypothesisStatusSchema.parse('')).toThrow();
    expect(() => HypothesisStatusSchema.parse(42)).toThrow();
  });
});

describe('CognitionEventTypeSchema', () => {
  it('accepts all valid event types', () => {
    const valid = [
      'hypothesis.formed', 'hypothesis.updated', 'hypothesis.locked',
      'hypothesis.rejected', 'hypothesis.completed',
      'conflict.detected', 'conflict.resolved',
      'alignment.checkpoint', 'session.joined', 'session.left', 'focus.changed',
    ];
    for (const t of valid) {
      expect(CognitionEventTypeSchema.parse(t)).toBe(t);
    }
  });

  it('rejects invalid event type', () => {
    expect(() => CognitionEventTypeSchema.parse('hypothesis.unknown')).toThrow();
  });
});

describe('ActorTypeSchema', () => {
  it('accepts human and agent', () => {
    expect(ActorTypeSchema.parse('human')).toBe('human');
    expect(ActorTypeSchema.parse('agent')).toBe('agent');
  });

  it('rejects other values', () => {
    expect(() => ActorTypeSchema.parse('bot')).toThrow();
  });
});

// ============================================================================
// HypothesisSchema
// ============================================================================

describe('HypothesisSchema', () => {
  it('parses a complete valid hypothesis', () => {
    const h = makeValidHypothesis();
    const result = HypothesisSchema.parse(h);
    expect(result.id).toBe(validUUID);
    expect(result.confidence).toBe(0.85);
    expect(result.intent.action).toBe('create');
  });

  it('accepts optional fields', () => {
    const h = makeValidHypothesis({
      supersedes: validUUID2,
      lockedBy: 'thomas',
      lockedAt: validDatetime,
    });
    const result = HypothesisSchema.parse(h);
    expect(result.supersedes).toBe(validUUID2);
    expect(result.lockedBy).toBe('thomas');
  });

  it('rejects missing required fields', () => {
    expect(() => HypothesisSchema.parse({})).toThrow();
    expect(() => HypothesisSchema.parse({ id: validUUID })).toThrow();
  });

  it('rejects confidence out of range', () => {
    expect(() => HypothesisSchema.parse(makeValidHypothesis({ confidence: 1.5 }))).toThrow();
    expect(() => HypothesisSchema.parse(makeValidHypothesis({ confidence: -0.1 }))).toThrow();
  });

  it('rejects invalid UUID for id', () => {
    expect(() => HypothesisSchema.parse(makeValidHypothesis({ id: 'not-a-uuid' }))).toThrow();
  });

  it('rejects empty statement', () => {
    expect(() => HypothesisSchema.parse(makeValidHypothesis({ statement: '' }))).toThrow();
  });

  it('rejects statement over 1000 chars', () => {
    expect(() => HypothesisSchema.parse(makeValidHypothesis({ statement: 'x'.repeat(1001) }))).toThrow();
  });

  it('round-trip: parse(parse(valid)) === identity', () => {
    const h = makeValidHypothesis();
    const first = HypothesisSchema.parse(h);
    const second = HypothesisSchema.parse(first);
    expect(second).toEqual(first);
  });
});

// ============================================================================
// PresenceSignalSchema
// ============================================================================

describe('PresenceSignalSchema', () => {
  it('parses a valid presence signal', () => {
    const result = PresenceSignalSchema.parse(makeValidPresenceSignal());
    expect(result.actorId).toBe('agent:worker-1');
    expect(result.color).toBe('#FF6B6B');
  });

  it('accepts optional focus fields', () => {
    const signal = makeValidPresenceSignal({
      focus: {},
      activeHypothesisId: validUUID,
    });
    const result = PresenceSignalSchema.parse(signal);
    expect(result.focus).toEqual({});
    expect(result.activeHypothesisId).toBe(validUUID);
  });

  it('rejects invalid hex color', () => {
    expect(() => PresenceSignalSchema.parse(makeValidPresenceSignal({ color: 'red' }))).toThrow();
    expect(() => PresenceSignalSchema.parse(makeValidPresenceSignal({ color: '#GGG' }))).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() => PresenceSignalSchema.parse(makeValidPresenceSignal({ status: 'away' }))).toThrow();
  });
});

// ============================================================================
// CognitionEventSchema
// ============================================================================

describe('CognitionEventSchema', () => {
  it('parses a valid cognition event', () => {
    const event = {
      id: validUUID,
      type: 'hypothesis.formed',
      sessionId: validUUID2,
      actorId: 'agent:worker-1',
      actorType: 'agent',
      hypothesisId: validUUID,
      description: 'Agent formed hypothesis about RoomBroker',
      affectedFiles: ['src/services/room/RoomBroker.ts'],
      nist: {
        control: 'AU-2',
        classification: 'informational',
        requiresReview: false,
      },
      timestamp: validDatetime,
    };
    const result = CognitionEventSchema.parse(event);
    expect(result.type).toBe('hypothesis.formed');
    expect(result.nist.control).toBe('AU-2');
  });

  it('applies nist defaults', () => {
    const event = {
      id: validUUID,
      type: 'session.joined',
      sessionId: validUUID2,
      actorId: 'thomas',
      actorType: 'human',
      description: 'Thomas joined session',
      affectedFiles: [],
      nist: { classification: 'informational' },
      timestamp: validDatetime,
    };
    const result = CognitionEventSchema.parse(event);
    expect(result.nist.control).toBe('AU-2');
    expect(result.nist.requiresReview).toBe(false);
  });

  it('accepts conflict-specific fields', () => {
    const event = {
      id: validUUID,
      type: 'conflict.detected',
      sessionId: validUUID2,
      actorId: 'system',
      actorType: 'agent',
      conflictingHypothesisIds: [validUUID, validUUID2],
      description: 'Two hypotheses target same file',
      affectedFiles: ['src/index.ts'],
      nist: { classification: 'warning' },
      timestamp: validDatetime,
    };
    const result = CognitionEventSchema.parse(event);
    expect(result.conflictingHypothesisIds).toHaveLength(2);
  });
});

// ============================================================================
// SessionSchema
// ============================================================================

describe('SessionSchema', () => {
  it('parses a valid session with empty participants', () => {
    const result = SessionSchema.parse(makeValidSession());
    expect(result.name).toBe('CAOE Session');
    expect(result.participants).toEqual([]);
  });

  it('parses a session with populated participants', () => {
    const session = makeValidSession({
      participants: [
        { actorId: 'thomas', actorType: 'human', joinedAt: validDatetime, role: 'owner' },
        { actorId: 'agent:worker', actorType: 'agent', joinedAt: validDatetime, role: 'collaborator' },
      ],
    });
    const result = SessionSchema.parse(session);
    expect(result.participants).toHaveLength(2);
    expect(result.participants[0].role).toBe('owner');
  });

  it('parses session with alignment checkpoints', () => {
    const session = makeValidSession({
      alignmentCheckpoints: [{
        id: validUUID,
        hypothesisId: validUUID2,
        approvedBy: 'thomas',
        approvedAt: validDatetime,
        description: 'Approved RoomBroker approach',
      }],
    });
    const result = SessionSchema.parse(session);
    expect(result.alignmentCheckpoints).toHaveLength(1);
  });

  it('rejects empty name', () => {
    expect(() => SessionSchema.parse(makeValidSession({ name: '' }))).toThrow();
  });

  it('rejects name over 100 chars', () => {
    expect(() => SessionSchema.parse(makeValidSession({ name: 'x'.repeat(101) }))).toThrow();
  });
});

// ============================================================================
// OSSACognitionSpecSchema
// ============================================================================

describe('OSSACognitionSpecSchema', () => {
  it('applies all defaults', () => {
    const result = OSSACognitionSpecSchema.parse({});
    expect(result.sessionCapable).toBe(false);
    expect(result.hypothesisEmission).toBe('optional');
    expect(result.conflictBehavior).toBe('block');
    expect(result.alignmentGate).toBe('human_approval');
    expect(result.autoLockConfidenceThreshold).toBe(0.95);
    expect(result.maxConcurrentHypotheses).toBe(1);
  });

  it('parses a fully specified cognition spec', () => {
    const spec = {
      sessionCapable: true,
      hypothesisEmission: 'required',
      conflictBehavior: 'defer',
      alignmentGate: 'auto_on_confidence',
      autoLockConfidenceThreshold: 0.9,
      maxConcurrentHypotheses: 3,
      cognitiveFingerprint: 'sha256:abc123',
    };
    const result = OSSACognitionSpecSchema.parse(spec);
    expect(result.sessionCapable).toBe(true);
    expect(result.maxConcurrentHypotheses).toBe(3);
  });

  it('rejects invalid threshold', () => {
    expect(() => OSSACognitionSpecSchema.parse({ autoLockConfidenceThreshold: 2.0 })).toThrow();
  });

  it('rejects maxConcurrentHypotheses out of range', () => {
    expect(() => OSSACognitionSpecSchema.parse({ maxConcurrentHypotheses: 0 })).toThrow();
    expect(() => OSSACognitionSpecSchema.parse({ maxConcurrentHypotheses: 6 })).toThrow();
  });
});

// ============================================================================
// Request/Response Schemas
// ============================================================================

describe('CreateSessionRequestSchema', () => {
  it('parses valid request', () => {
    const req = { name: 'Test', packages: ['@bluefly/agent-mesh'] };
    const result = CreateSessionRequestSchema.parse(req);
    expect(result.name).toBe('Test');
  });

  it('rejects empty packages array', () => {
    expect(() => CreateSessionRequestSchema.parse({ name: 'Test', packages: [] })).toThrow();
  });

  it('accepts optional fields', () => {
    const req = {
      name: 'Test',
      packages: ['@bluefly/agent-mesh'],
      gitlabIssueId: 42,
      branch: 'feature/caoe',
      agentIds: ['agent:worker-1'],
    };
    const result = CreateSessionRequestSchema.parse(req);
    expect(result.gitlabIssueId).toBe(42);
  });
});

describe('EmitHypothesisRequestSchema', () => {
  it('parses valid request', () => {
    const req = {
      sessionId: validUUID,
      statement: 'Working on RoomBroker',
      intent: {
        action: 'create',
        targetFiles: ['src/RoomBroker.ts'],
        targetPackages: ['@bluefly/agent-mesh'],
        estimatedScope: 'file',
      },
      confidence: 0.8,
    };
    const result = EmitHypothesisRequestSchema.parse(req);
    expect(result.confidence).toBe(0.8);
  });
});

describe('LockHypothesisRequestSchema', () => {
  it('parses valid lock request', () => {
    const req = {
      sessionId: validUUID,
      hypothesisId: validUUID2,
      arbitratorId: 'thomas',
      reason: 'Approved approach',
    };
    const result = LockHypothesisRequestSchema.parse(req);
    expect(result.arbitratorId).toBe('thomas');
  });
});

describe('ConflictResolutionRequestSchema', () => {
  it('parses valid resolution', () => {
    const req = {
      sessionId: validUUID,
      winningHypothesisId: validUUID,
      losingHypothesisIds: [validUUID2],
      arbitratorId: 'thomas',
      checkpointDescription: 'Agent-1 approach selected',
    };
    const result = ConflictResolutionRequestSchema.parse(req);
    expect(result.losingHypothesisIds).toHaveLength(1);
  });

  it('round-trip: parse(parse(valid)) === identity', () => {
    const req = {
      sessionId: validUUID,
      winningHypothesisId: validUUID,
      losingHypothesisIds: [validUUID2],
      arbitratorId: 'thomas',
      checkpointDescription: 'Approved',
    };
    const first = ConflictResolutionRequestSchema.parse(req);
    const second = ConflictResolutionRequestSchema.parse(first);
    expect(second).toEqual(first);
  });
});
