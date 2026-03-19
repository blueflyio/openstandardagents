/**
 * CAOE Cognition Zod Schema Tests
 *
 * Validates cognition type schemas wired into release/v0.5.x exports.
 */

import { describe, expect, it } from 'vitest';
import {
  CreateSessionRequestSchema,
  HypothesisSchema,
  OSSACognitionSpecSchema,
  PresenceSignalSchema,
} from '../../../src/types/cognition.zod.js';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';
const validUUID2 = '660e8400-e29b-41d4-a716-446655440001';
const validDatetime = '2026-03-13T12:00:00Z';

function makeValidHypothesis(overrides: Record<string, unknown> = {}) {
  return {
    id: validUUID,
    sessionId: validUUID2,
    actorId: 'agent:pipeline-worker',
    actorType: 'agent' as const,
    statement: 'Implementing RoomBroker service',
    intent: {
      action: 'create' as const,
      targetFiles: ['src/services/RoomBroker.ts'],
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

describe('HypothesisSchema', () => {
  it('parses a valid hypothesis', () => {
    const result = HypothesisSchema.safeParse(makeValidHypothesis());
    expect(result.success).toBe(true);
  });

  it('rejects empty statement', () => {
    const result = HypothesisSchema.safeParse(makeValidHypothesis({ statement: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects confidence > 1', () => {
    const result = HypothesisSchema.safeParse(makeValidHypothesis({ confidence: 1.5 }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = HypothesisSchema.safeParse(makeValidHypothesis({ status: 'invalid' }));
    expect(result.success).toBe(false);
  });

  it('allows supersedes field', () => {
    const result = HypothesisSchema.safeParse(makeValidHypothesis({ supersedes: validUUID2 }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supersedes).toBe(validUUID2);
    }
  });
});

describe('PresenceSignalSchema', () => {
  const validPresence = {
    actorId: 'agent:worker-1',
    actorType: 'agent' as const,
    actorLabel: 'Worker 1',
    sessionId: validUUID,
    focus: { file: 'src/index.ts', line: 42 },
    color: '#ff5733',
    status: 'active' as const,
    timestamp: validDatetime,
  };

  it('parses a valid presence signal', () => {
    const result = PresenceSignalSchema.safeParse(validPresence);
    expect(result.success).toBe(true);
  });

  it('rejects invalid hex color', () => {
    const result = PresenceSignalSchema.safeParse({ ...validPresence, color: 'not-a-color' });
    expect(result.success).toBe(false);
  });

  it('rejects color without # prefix', () => {
    const result = PresenceSignalSchema.safeParse({ ...validPresence, color: 'ff5733' });
    expect(result.success).toBe(false);
  });
});

describe('OSSACognitionSpecSchema', () => {
  it('applies correct defaults', () => {
    const result = OSSACognitionSpecSchema.parse({});
    expect(result.sessionCapable).toBe(false);
    expect(result.hypothesisEmission).toBe('optional');
    expect(result.conflictBehavior).toBe('block');
    expect(result.alignmentGate).toBe('human_approval');
    expect(result.autoLockConfidenceThreshold).toBe(0.95);
    expect(result.maxConcurrentHypotheses).toBe(1);
  });
});

describe('CreateSessionRequestSchema', () => {
  it('requires at least one package', () => {
    const result = CreateSessionRequestSchema.safeParse({
      name: 'Test Session',
      packages: [],
    });
    expect(result.success).toBe(false);
  });

  it('parses valid request with one package', () => {
    const result = CreateSessionRequestSchema.safeParse({
      name: 'Test Session',
      packages: ['@bluefly/agent-mesh'],
    });
    expect(result.success).toBe(true);
  });
});
