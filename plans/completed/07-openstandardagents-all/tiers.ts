/**
 * @bluefly/agent-mesh — Separation of Duties: Tier Definitions
 *
 * 4-tier access model enforced across the OSSA agent fleet.
 * T1 Analyzer  — read-only, static analysis, scanning
 * T2 Reviewer  — comment, label, triage (no push/deploy)
 * T3 Executor  — push, deploy, pipeline, secrets
 * T4 Approver  — merge, release, tag (no direct push)
 */

export enum AgentTier {
  ANALYZER = 'T1',
  REVIEWER = 'T2',
  EXECUTOR = 'T3',
  APPROVER = 'T4',
}

export interface TierPermissions {
  tier: AgentTier;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  canApprove: boolean;
  canDeploy: boolean;
  canReview: boolean;
  canAnalyze: boolean;
  canCreateMR: boolean;
  canMergeMR: boolean;
  canTagRelease: boolean;
  canModifyPipeline: boolean;
  canAccessSecrets: boolean;
}

export const TIER_PERMISSIONS: Record<AgentTier, TierPermissions> = {
  [AgentTier.ANALYZER]: {
    tier: AgentTier.ANALYZER,
    canRead: true,
    canWrite: false,
    canExecute: false,
    canApprove: false,
    canDeploy: false,
    canReview: false,
    canAnalyze: true,
    canCreateMR: false,
    canMergeMR: false,
    canTagRelease: false,
    canModifyPipeline: false,
    canAccessSecrets: false,
  },
  [AgentTier.REVIEWER]: {
    tier: AgentTier.REVIEWER,
    canRead: true,
    canWrite: false,
    canExecute: false,
    canApprove: false,
    canDeploy: false,
    canReview: true,
    canAnalyze: true,
    canCreateMR: false,
    canMergeMR: false,
    canTagRelease: false,
    canModifyPipeline: false,
    canAccessSecrets: false,
  },
  [AgentTier.EXECUTOR]: {
    tier: AgentTier.EXECUTOR,
    canRead: true,
    canWrite: true,
    canExecute: true,
    canApprove: false,
    canDeploy: true,
    canReview: false,
    canAnalyze: false,
    canCreateMR: true,
    canMergeMR: false,
    canTagRelease: false,
    canModifyPipeline: true,
    canAccessSecrets: true,
  },
  [AgentTier.APPROVER]: {
    tier: AgentTier.APPROVER,
    canRead: true,
    canWrite: false,
    canExecute: false,
    canApprove: true,
    canDeploy: false,
    canReview: true,
    canAnalyze: true,
    canCreateMR: false,
    canMergeMR: true,
    canTagRelease: true,
    canModifyPipeline: false,
    canAccessSecrets: false,
  },
};

/** Look up permissions for a given tier. Throws on unknown tier. */
export function getPermissions(tier: AgentTier): TierPermissions {
  const perms = TIER_PERMISSIONS[tier];
  if (!perms) {
    throw new Error(`Unknown agent tier: ${tier}`);
  }
  return perms;
}

/** Check whether a tier is allowed a specific capability. */
export function hasCapability(
  tier: AgentTier,
  capability: keyof Omit<TierPermissions, 'tier'>,
): boolean {
  return getPermissions(tier)[capability];
}
