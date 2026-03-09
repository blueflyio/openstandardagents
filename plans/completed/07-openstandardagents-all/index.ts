/**
 * @bluefly/agent-mesh — SOD barrel export
 */

export {
  AgentTier,
  TierPermissions,
  TIER_PERMISSIONS,
  getPermissions,
  hasCapability,
} from './tiers';

export {
  ConflictRule,
  ConflictResult,
  CONFLICT_MATRIX,
  isConflict,
  validateWorkflowChain,
} from './conflicts';
