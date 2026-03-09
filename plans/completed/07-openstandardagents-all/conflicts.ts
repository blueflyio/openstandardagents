/**
 * @bluefly/agent-mesh — Separation of Duties: Conflict Matrix
 *
 * Defines which tier combinations are forbidden.
 * Conflict Matrix:
 *   Analyzer ↔ Reviewer  ✅  (both read-only tiers)
 *   Analyzer ↔ Executor  ❌  (segregation of analysis and action)
 *   Analyzer ↔ Approver  ❌  (prevents self-validation)
 *   Reviewer ↔ Executor  ❌  (prevents review-then-act by same agent)
 *   Reviewer ↔ Approver  ✅  (both non-write tiers, complementary)
 *   Executor ↔ Approver  ❌  (executor cannot approve own work)
 */

import { AgentTier } from './tiers';

export interface ConflictRule {
  source: AgentTier;
  target: AgentTier;
  allowed: boolean;
  reason?: string;
}

export const CONFLICT_MATRIX: ConflictRule[] = [
  {
    source: AgentTier.ANALYZER,
    target: AgentTier.REVIEWER,
    allowed: true,
  },
  {
    source: AgentTier.ANALYZER,
    target: AgentTier.EXECUTOR,
    allowed: false,
    reason: 'Analyzer cannot execute — segregation of analysis and action',
  },
  {
    source: AgentTier.ANALYZER,
    target: AgentTier.APPROVER,
    allowed: false,
    reason: 'Analyzer cannot approve — prevents self-validation',
  },
  {
    source: AgentTier.REVIEWER,
    target: AgentTier.EXECUTOR,
    allowed: false,
    reason: 'Reviewer cannot execute — prevents review-then-act by same agent',
  },
  {
    source: AgentTier.REVIEWER,
    target: AgentTier.APPROVER,
    allowed: true,
  },
  {
    source: AgentTier.EXECUTOR,
    target: AgentTier.APPROVER,
    allowed: false,
    reason: 'Executor cannot approve own work',
  },
];

export interface ConflictResult {
  conflict: boolean;
  reason?: string;
}

/**
 * Check if two tiers conflict. Checks both directions
 * (source→target and target→source).
 */
export function isConflict(
  source: AgentTier,
  target: AgentTier,
): ConflictResult {
  if (source === target) {
    return { conflict: false };
  }

  const rule =
    CONFLICT_MATRIX.find((r) => r.source === source && r.target === target) ||
    CONFLICT_MATRIX.find((r) => r.source === target && r.target === source);

  if (!rule) {
    return { conflict: false };
  }
  return { conflict: !rule.allowed, reason: rule.reason };
}

/**
 * Validate that a workflow phase transition is SOD-compliant.
 * Returns all violations found.
 */
export function validateWorkflowChain(
  actors: Array<{ agentId: string; tier: AgentTier }>,
): ConflictResult[] {
  const violations: ConflictResult[] = [];

  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      // Same agent in multiple phases → always a conflict
      if (actors[i].agentId === actors[j].agentId) {
        violations.push({
          conflict: true,
          reason: `Agent "${actors[i].agentId}" appears in multiple workflow phases (${actors[i].tier} and ${actors[j].tier})`,
        });
        continue;
      }
      const result = isConflict(actors[i].tier, actors[j].tier);
      if (result.conflict) {
        violations.push(result);
      }
    }
  }

  return violations;
}
