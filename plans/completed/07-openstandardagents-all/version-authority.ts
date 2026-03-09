/**
 * @bluefly/compliance-engine — SOD: Version Authority
 *
 * Version chain of custody:
 *   HUMAN (milestone)  →  CI PIPELINE (semantic-release)  →  GIT TAG
 *
 * AI agents are READ-ONLY for version metadata.
 * Only CI pipelines may bump versions; only humans set milestones.
 */

export type VersionSource = 'HUMAN' | 'CI_PIPELINE' | 'GIT_TAG' | 'AI_AGENT';

export interface VersionAuthority {
  source: VersionSource;
  canSetMilestone: boolean;
  canBumpVersion: boolean;
  canCreateTag: boolean;
  canReadVersion: boolean;
}

export const VERSION_AUTHORITY: Record<VersionSource, VersionAuthority> = {
  HUMAN: {
    source: 'HUMAN',
    canSetMilestone: true,
    canBumpVersion: false,
    canCreateTag: false,
    canReadVersion: true,
  },
  CI_PIPELINE: {
    source: 'CI_PIPELINE',
    canSetMilestone: false,
    canBumpVersion: true,
    canCreateTag: true,
    canReadVersion: true,
  },
  GIT_TAG: {
    source: 'GIT_TAG',
    canSetMilestone: false,
    canBumpVersion: false,
    canCreateTag: false,
    canReadVersion: true,
  },
  AI_AGENT: {
    source: 'AI_AGENT',
    canSetMilestone: false,
    canBumpVersion: false,
    canCreateTag: false,
    canReadVersion: true,
  },
};

/**
 * Validate whether a version source is allowed to perform an action.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateVersionSource(
  source: VersionSource,
  action: keyof Omit<VersionAuthority, 'source'>,
): { valid: boolean; reason?: string } {
  const authority = VERSION_AUTHORITY[source];
  if (!authority) {
    return { valid: false, reason: `Unknown version source: ${source}` };
  }
  if (!authority[action]) {
    return {
      valid: false,
      reason: `${source} is not authorized to ${action}. Version authority: HUMAN→milestone, CI_PIPELINE→bump+tag, AI_AGENT→read-only`,
    };
  }
  return { valid: true };
}
