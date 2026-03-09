/**
 * @bluefly/agent-mesh — SOD Middleware Tests
 *
 * 8 test cases covering the sodEnforcementMiddleware:
 *   1. Valid chain → 200 (next called)
 *   2. Self-review → 409
 *   3. Executor-approve → 409
 *   4. Analyzer-execute → 409
 *   5. Duplicate actor in previousActors → 409
 *   6. Missing metadata → 400
 *   7. PERMIT decision is logged
 *   8. DENY decision is logged
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { sodEnforcementMiddleware } from '../middleware';
import { AgentTier } from '../tiers';

function createMockReq(body: Record<string, unknown>): Partial<Request> {
  return { body };
}

function createMockRes(): Partial<Response> & { statusCode: number; jsonBody: unknown } {
  const res: any = {
    statusCode: 0,
    jsonBody: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.jsonBody = data;
      return res;
    },
  };
  return res;
}

describe('sodEnforcementMiddleware', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  // --- Test 1: Valid chain → next() called ---
  it('permits valid workflow chain (T1 → T2 action)', () => {
    const req = createMockReq({
      sourceAgent: 'vulnerability-scanner',
      sourceTier: AgentTier.ANALYZER,
      targetAgent: 'merge-request-reviewer',
      targetTier: AgentTier.REVIEWER,
      action: 'review',
      workflowId: 'wf-001',
      previousActors: [],
    });
    const res = createMockRes();
    const next = vi.fn();

    sodEnforcementMiddleware(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(0); // status() not called
  });

  // --- Test 2: Self-review → 409 ---
  it('denies self-review (executor reviews own work)', () => {
    const req = createMockReq({
      sourceAgent: 'deployment-agent',
      sourceTier: AgentTier.EXECUTOR,
      targetAgent: 'deployment-agent',
      targetTier: AgentTier.EXECUTOR,
      action: 'review',
      workflowId: 'wf-002',
      previousActors: ['deployment-agent'],
    });
    const res = createMockRes();
    const next = vi.fn();

    sodEnforcementMiddleware(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(409);
    expect((res.jsonBody as any).decision).toBe('DENY');
    expect((res.jsonBody as any).reason).toContain('Self-action violation');
  });

  // --- Test 3: Executor-approve → 409 ---
  it('denies executor trying to approve (T3 ↔ T4 conflict)', () => {
    const req = createMockReq({
      sourceAgent: 'deployment-agent',
      sourceTier: AgentTier.EXECUTOR,
      targetAgent: 'release-coordinator',
      targetTier: AgentTier.APPROVER,
      action: 'approve',
      workflowId: 'wf-003',
      previousActors: [],
    });
    const res = createMockRes();
    const next = vi.fn();

    sodEnforcementMiddleware(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(409);
    expect((res.jsonBody as any).decision).toBe('DENY');
    expect((res.jsonBody as any).reason).toContain('Tier conflict');
  });

  // --- Test 4: Analyzer-execute → 409 ---
  it('denies analyzer trying to execute (T1 ↔ T3 conflict)', () => {
    const req = createMockReq({
      sourceAgent: 'vulnerability-scanner',
      sourceTier: AgentTier.ANALYZER,
      targetAgent: 'deployment-agent',
      targetTier: AgentTier.EXECUTOR,
      action: 'execute',
      workflowId: 'wf-004',
      previousActors: [],
    });
    const res = createMockRes();
    const next = vi.fn();

    sodEnforcementMiddleware(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(409);
    expect((res.jsonBody as any).decision).toBe('DENY');
  });

  // --- Test 5: Duplicate actor in previousActors → 409 ---
  it('denies when target agent already acted in workflow', () => {
    const req = createMockReq({
      sourceAgent: 'vulnerability-scanner',
      sourceTier: AgentTier.ANALYZER,
      targetAgent: 'merge-request-reviewer',
      targetTier: AgentTier.REVIEWER,
      action: 'review',
      workflowId: 'wf-005',
      previousActors: ['merge-request-reviewer'],
    });
    const res = createMockRes();
    const next = vi.fn();

    sodEnforcementMiddleware(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(409);
    expect((res.jsonBody as any).reason).toContain('Self-action violation');
  });

  // --- Test 6: Missing metadata → 400 ---
  it('returns 400 when required fields are missing', () => {
    const req = createMockReq({
      sourceAgent: 'vulnerability-scanner',
      // Missing other required fields
    });
    const res = createMockRes();
    const next = vi.fn();

    sodEnforcementMiddleware(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect((res.jsonBody as any).error).toContain('Missing required SOD metadata');
  });

  // --- Test 7: PERMIT decision is logged ---
  it('logs PERMIT decision to stdout', () => {
    const req = createMockReq({
      sourceAgent: 'vulnerability-scanner',
      sourceTier: AgentTier.ANALYZER,
      targetAgent: 'merge-request-reviewer',
      targetTier: AgentTier.REVIEWER,
      action: 'review',
      workflowId: 'wf-007',
      previousActors: [],
    });
    const res = createMockRes();
    const next = vi.fn();

    sodEnforcementMiddleware(req as Request, res as unknown as Response, next);

    expect(logSpy).toHaveBeenCalled();
    const logEntry = JSON.parse(
      (logSpy.mock.calls[0][0] as string).trim(),
    );
    expect(logEntry.type).toBe('sod_gate_decision');
    expect(logEntry.decision).toBe('PERMIT');
  });

  // --- Test 8: DENY decision is logged ---
  it('logs DENY decision to stdout', () => {
    const req = createMockReq({
      sourceAgent: 'deployment-agent',
      sourceTier: AgentTier.EXECUTOR,
      targetAgent: 'release-coordinator',
      targetTier: AgentTier.APPROVER,
      action: 'approve',
      workflowId: 'wf-008',
      previousActors: [],
    });
    const res = createMockRes();
    const next = vi.fn();

    sodEnforcementMiddleware(req as Request, res as unknown as Response, next);

    expect(logSpy).toHaveBeenCalled();
    const logEntry = JSON.parse(
      (logSpy.mock.calls[0][0] as string).trim(),
    );
    expect(logEntry.type).toBe('sod_gate_decision');
    expect(logEntry.decision).toBe('DENY');
  });
});
