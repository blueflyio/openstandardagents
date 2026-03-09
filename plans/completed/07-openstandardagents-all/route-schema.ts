/**
 * @bluefly/agent-router — SOD Route Metadata & Gate Decisions
 *
 * Attached to every routed message in the agent mesh.
 * The router uses this metadata to enforce SOD at routing time,
 * returning 409 Conflict on violations.
 */

import { AgentTier } from '@bluefly/agent-mesh/sod/tiers';

/** Workflow phase identifiers */
export type WorkflowPhase = 'analysis' | 'review' | 'execution' | 'approval';

/** Metadata attached to each routed request for SOD enforcement. */
export interface SODRouteMetadata {
  /** The tier required for the target agent */
  requiredTier: AgentTier;
  /** All tiers permitted (may be broader than requiredTier) */
  allowedTiers: AgentTier[];
  /** If true, the target agent must differ from the source agent */
  requiresDifferentAgent: boolean;
  /** Agent IDs that have already acted on this workflow */
  previousActors: string[];
  /** Unique workflow/task identifier for audit trail */
  workflowId: string;
  /** Current workflow phase */
  phase: WorkflowPhase;
}

/** Gate decision returned by the SOD enforcement layer. */
export interface GateDecision {
  /** PERMIT = proceed, DENY = block, ESCALATE = human review required */
  decision: 'PERMIT' | 'DENY' | 'ESCALATE';
  /** Human-readable reason for the decision */
  reason: string;
  /** Agent that initiated the request */
  sourceAgent: string;
  /** Agent targeted to handle the request */
  targetAgent: string;
  /** Tier of the source agent */
  sourceTier: AgentTier;
  /** Tier of the target agent */
  targetTier: AgentTier;
  /** Workflow ID for correlation */
  workflowId: string;
  /** ISO-8601 timestamp */
  timestamp: string;
}

/** Create a PERMIT gate decision. */
export function permit(
  params: Omit<GateDecision, 'decision' | 'timestamp'>,
): GateDecision {
  return {
    ...params,
    decision: 'PERMIT',
    timestamp: new Date().toISOString(),
  };
}

/** Create a DENY gate decision. */
export function deny(
  params: Omit<GateDecision, 'decision' | 'timestamp'>,
): GateDecision {
  return {
    ...params,
    decision: 'DENY',
    timestamp: new Date().toISOString(),
  };
}

/** Create an ESCALATE gate decision. */
export function escalate(
  params: Omit<GateDecision, 'decision' | 'timestamp'>,
): GateDecision {
  return {
    ...params,
    decision: 'ESCALATE',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Map a workflow phase to its required tier.
 * Used by the router to auto-populate requiredTier.
 */
export function phaseToTier(phase: WorkflowPhase): AgentTier {
  const mapping: Record<WorkflowPhase, AgentTier> = {
    analysis: AgentTier.ANALYZER,
    review: AgentTier.REVIEWER,
    execution: AgentTier.EXECUTOR,
    approval: AgentTier.APPROVER,
  };
  return mapping[phase];
}
