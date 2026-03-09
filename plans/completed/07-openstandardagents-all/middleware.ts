/**
 * @bluefly/agent-mesh — SOD: Enforcement Middleware
 *
 * Express middleware that enforces Separation of Duties at the mesh routing layer.
 * Intercepts /mesh/v1/* requests and validates:
 *   1. Tier conflict (source ↔ target via CONFLICT_MATRIX)
 *   2. Self-action (targetAgent in previousActors)
 *   3. Tier permission (target tier can perform requested action)
 *
 * Returns 409 Conflict with GateDecision on DENY, calls next() on PERMIT.
 */

import { Request, Response, NextFunction } from 'express';
import { AgentTier, getPermissions, TierPermissions } from './tiers';
import { isConflict } from './conflicts';
import { GateDecision, permit, deny } from '@bluefly/agent-router/sod/route-schema';

export interface SODRequestBody {
  sourceAgent: string;
  sourceTier: AgentTier;
  targetAgent: string;
  targetTier: AgentTier;
  action: string;
  workflowId: string;
  previousActors?: string[];
}

/**
 * Map an action string to the corresponding TierPermissions capability key.
 */
function checkPermission(
  tier: AgentTier,
  action: string,
): boolean {
  const capabilityMap: Record<string, keyof Omit<TierPermissions, 'tier'>> = {
    read: 'canRead',
    write: 'canWrite',
    execute: 'canExecute',
    approve: 'canApprove',
    deploy: 'canDeploy',
    review: 'canReview',
    analyze: 'canAnalyze',
    createMR: 'canCreateMR',
    mergeMR: 'canMergeMR',
    tagRelease: 'canTagRelease',
    modifyPipeline: 'canModifyPipeline',
    accessSecrets: 'canAccessSecrets',
  };

  const capability = capabilityMap[action];
  if (!capability) return false;

  const perms = getPermissions(tier);
  return perms[capability];
}

/**
 * Emit a structured audit log entry for SOD gate decisions.
 */
function emitAuditLog(decision: GateDecision): void {
  const entry = {
    type: 'sod_gate_decision',
    ...decision,
  };
  // Structured JSON log — consumed by agent-tracer
  process.stdout.write(JSON.stringify(entry) + '\n');
}

/**
 * Express middleware enforcing SOD at the mesh routing layer.
 *
 * Usage:
 *   app.use('/mesh/v1/*', sodEnforcementMiddleware);
 */
export function sodEnforcementMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const body = req.body as Partial<SODRequestBody>;

  // --- Validate required fields ---
  if (
    !body.sourceAgent ||
    !body.sourceTier ||
    !body.targetAgent ||
    !body.targetTier ||
    !body.action ||
    !body.workflowId
  ) {
    res.status(400).json({
      error: 'Missing required SOD metadata',
      required: [
        'sourceAgent',
        'sourceTier',
        'targetAgent',
        'targetTier',
        'action',
        'workflowId',
      ],
    });
    return;
  }

  const {
    sourceAgent,
    sourceTier,
    targetAgent,
    targetTier,
    action,
    workflowId,
    previousActors = [],
  } = body as SODRequestBody;

  const baseParams = {
    sourceAgent,
    targetAgent,
    sourceTier,
    targetTier,
    workflowId,
    reason: '',
  };

  // --- Check 1: Tier conflict ---
  const conflict = isConflict(sourceTier, targetTier);
  if (conflict.conflict) {
    const decision = deny({
      ...baseParams,
      reason: `Tier conflict: ${conflict.reason}`,
    });
    emitAuditLog(decision);
    res.status(409).json(decision);
    return;
  }

  // --- Check 2: Self-action (same agent in previous workflow phases) ---
  if (previousActors.includes(targetAgent)) {
    const decision = deny({
      ...baseParams,
      reason: `Self-action violation: ${targetAgent} already acted in workflow ${workflowId}`,
    });
    emitAuditLog(decision);
    res.status(409).json(decision);
    return;
  }

  // --- Check 3: Tier permission ---
  if (!checkPermission(targetTier, action)) {
    const decision = deny({
      ...baseParams,
      reason: `Permission denied: ${targetTier} cannot perform "${action}"`,
    });
    emitAuditLog(decision);
    res.status(409).json(decision);
    return;
  }

  // --- All checks passed: PERMIT ---
  const decision = permit({
    ...baseParams,
    reason: 'All SOD checks passed',
  });
  emitAuditLog(decision);

  // Attach decision to request for downstream handlers
  (req as any).sodDecision = decision;
  next();
}
