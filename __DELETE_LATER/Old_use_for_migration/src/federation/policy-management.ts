/**
 * OSSA 0.1.9 Phase 2: Federated Policy Management System
 * Implements distributed policy synchronization and conflict resolution
 */

export interface Policy {
  id: string;
  name: string;
  version: string;
  organizationId: string;
  rules: PolicyRule[];
  priority: number;
  scope: PolicyScope;
  createdAt: Date;
  updatedAt: Date;
  signature: string;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: PolicyAction;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface PolicyAction {
  type: 'allow' | 'deny' | 'require' | 'limit' | 'audit';
  target: string;
  constraints?: Record<string, any>;
}

export interface PolicyScope {
  agents: string[];
  capabilities: string[];
  resources: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface PolicyConflict {
  id: string;
  policies: Policy[];
  conflictType: 'priority' | 'contradiction' | 'overlap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution: ConflictResolution;
  detectedAt: Date;
}

export interface ConflictResolution {
  strategy: 'priority' | 'merge' | 'override' | 'defer';
  winningPolicy?: string;
  mergedPolicy?: Policy;
  rationale: string;
}

export class PolicyFederationEngine {
  private policies: Map<string, Policy> = new Map();
  private conflicts: Map<string, PolicyConflict> = new Map();
  private syncronizationCache: Map<string, Date> = new Map();

  constructor(
    private organizationId: string,
    private federationEndpoints: string[]
  ) {}

  /**
   * Synchronize policies across federated organizations
   */
  async synchronizePolicies(organizations: string[]): Promise<PolicySyncResult> {
    const syncResults: PolicySyncResult = {
      synchronized: 0,
      conflicts: 0,
      errors: [],
      duration: 0
    };

    const startTime = Date.now();

    for (const org of organizations) {
      try {
        const orgPolicies = await this.fetchOrgPolicies(org);
        const syncResult = await this.syncOrgPolicies(org, orgPolicies);
        
        syncResults.synchronized += syncResult.synchronized;
        syncResults.conflicts += syncResult.conflicts;
        
        this.syncronizationCache.set(org, new Date());
      } catch (error) {
        syncResults.errors.push({
          organization: org,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    syncResults.duration = Date.now() - startTime;
    return syncResults;
  }

  /**
   * Resolve policy conflicts using intelligent algorithms
   */
  async resolveConflicts(conflicts: PolicyConflict[]): Promise<ConflictResolutionResult> {
    const resolutions: ConflictResolutionResult = {
      resolved: 0,
      deferred: 0,
      failed: 0,
      resolutions: []
    };

    for (const conflict of conflicts) {
      try {
        const resolution = await this.resolveConflict(conflict);
        
        if (resolution.strategy === 'defer') {
          resolutions.deferred++;
        } else {
          resolutions.resolved++;
          await this.applyResolution(conflict, resolution);
        }
        
        resolutions.resolutions.push({
          conflictId: conflict.id,
          resolution: resolution.strategy,
          details: resolution.rationale
        });
        
      } catch (error) {
        resolutions.failed++;
        resolutions.resolutions.push({
          conflictId: conflict.id,
          resolution: 'failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return resolutions;
  }

  /**
   * Enforce governance rules across federation
   */
  async enforceGovernance(action: GovernanceAction): Promise<GovernanceResult> {
    const applicablePolicies = this.getApplicablePolicies(action);
    
    // Check for conflicts
    const conflicts = this.detectPolicyConflicts(applicablePolicies);
    if (conflicts.length > 0) {
      const resolutions = await this.resolveConflicts(conflicts);
      if (resolutions.failed > 0) {
        return {
          allowed: false,
          reason: 'Unresolvable policy conflicts',
          conflicts: conflicts.map(c => c.id)
        };
      }
    }

    // Evaluate policies in priority order
    const sortedPolicies = applicablePolicies.sort((a, b) => b.priority - a.priority);
    
    for (const policy of sortedPolicies) {
      const evaluation = await this.evaluatePolicy(policy, action);
      
      if (evaluation.decision === 'deny') {
        return {
          allowed: false,
          reason: evaluation.reason,
          policyId: policy.id,
          auditTrail: this.createAuditTrail(action, policy, evaluation)
        };
      }
      
      if (evaluation.decision === 'allow') {
        return {
          allowed: true,
          reason: evaluation.reason,
          policyId: policy.id,
          constraints: evaluation.constraints,
          auditTrail: this.createAuditTrail(action, policy, evaluation)
        };
      }
    }

    // Default to deny if no explicit policy allows
    return {
      allowed: false,
      reason: 'No policy explicitly allows this action',
      auditTrail: this.createAuditTrail(action, null, { decision: 'deny', reason: 'Default deny' })
    };
  }

  /**
   * Create immutable audit trail for governance decisions
   */
  private createAuditTrail(
    action: GovernanceAction,
    policy: Policy | null,
    evaluation: PolicyEvaluation
  ): AuditEntry {
    return {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      organizationId: this.organizationId,
      action: {
        type: action.type,
        target: action.target,
        agent: action.agentId
      },
      policy: policy ? {
        id: policy.id,
        name: policy.name,
        organization: policy.organizationId
      } : null,
      decision: evaluation.decision,
      reason: evaluation.reason,
      hash: this.calculateAuditHash(action, policy, evaluation)
    };
  }

  private async fetchOrgPolicies(organizationId: string): Promise<Policy[]> {
    const endpoint = this.federationEndpoints.find(ep => ep.includes(organizationId));
    
    if (!endpoint) {
      throw new Error(`No federation endpoint found for organization: ${organizationId}`);
    }

    const response = await fetch(`${endpoint}/api/v1/federation/policies`, {
      headers: {
        'Authorization': `Bearer ${await this.getFederationToken(organizationId)}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch policies from ${organizationId}: ${response.statusText}`);
    }

    return response.json();
  }

  private async syncOrgPolicies(organizationId: string, policies: Policy[]): Promise<SyncResult> {
    let synchronized = 0;
    let conflicts = 0;

    for (const policy of policies) {
      const existingPolicy = this.policies.get(policy.id);
      
      if (existingPolicy) {
        const conflict = this.detectConflict(existingPolicy, policy);
        if (conflict) {
          this.conflicts.set(conflict.id, conflict);
          conflicts++;
        } else {
          this.policies.set(policy.id, policy);
          synchronized++;
        }
      } else {
        this.policies.set(policy.id, policy);
        synchronized++;
      }
    }

    return { synchronized, conflicts };
  }

  private detectConflict(existing: Policy, incoming: Policy): PolicyConflict | null {
    // Check for priority conflicts
    if (existing.priority === incoming.priority && existing.organizationId !== incoming.organizationId) {
      return {
        id: `conflict-${existing.id}-${incoming.id}`,
        policies: [existing, incoming],
        conflictType: 'priority',
        severity: 'medium',
        resolution: {
          strategy: 'priority',
          rationale: 'Resolve by organizational priority'
        },
        detectedAt: new Date()
      };
    }

    // Check for rule contradictions
    const contradiction = this.detectRuleContradiction(existing, incoming);
    if (contradiction) {
      return contradiction;
    }

    return null;
  }

  private detectRuleContradiction(policy1: Policy, policy2: Policy): PolicyConflict | null {
    for (const rule1 of policy1.rules) {
      for (const rule2 of policy2.rules) {
        if (this.rulesContradict(rule1, rule2)) {
          return {
            id: `contradiction-${policy1.id}-${policy2.id}`,
            policies: [policy1, policy2],
            conflictType: 'contradiction',
            severity: 'high',
            resolution: {
              strategy: 'merge',
              rationale: 'Merge conflicting rules with precedence'
            },
            detectedAt: new Date()
          };
        }
      }
    }
    return null;
  }

  private rulesContradict(rule1: PolicyRule, rule2: PolicyRule): boolean {
    return rule1.condition === rule2.condition &&
           ((rule1.action.type === 'allow' && rule2.action.type === 'deny') ||
            (rule1.action.type === 'deny' && rule2.action.type === 'allow'));
  }

  private async resolveConflict(conflict: PolicyConflict): Promise<ConflictResolution> {
    switch (conflict.resolution.strategy) {
      case 'priority':
        return this.resolvePriorityConflict(conflict);
      case 'merge':
        return this.resolveMergeConflict(conflict);
      case 'override':
        return this.resolveOverrideConflict(conflict);
      default:
        return {
          strategy: 'defer',
          rationale: 'Unable to automatically resolve conflict'
        };
    }
  }

  private resolvePriorityConflict(conflict: PolicyConflict): ConflictResolution {
    const highestPriority = conflict.policies.reduce((prev, current) =>
      current.priority > prev.priority ? current : prev
    );

    return {
      strategy: 'priority',
      winningPolicy: highestPriority.id,
      rationale: `Resolved by priority: ${highestPriority.name} (${highestPriority.priority})`
    };
  }

  private resolveMergeConflict(conflict: PolicyConflict): ConflictResolution {
    const mergedPolicy: Policy = {
      id: `merged-${conflict.id}`,
      name: `Merged Policy: ${conflict.policies.map(p => p.name).join(' + ')}`,
      version: '1.0.0',
      organizationId: 'federation',
      rules: this.mergeRules(conflict.policies),
      priority: Math.max(...conflict.policies.map(p => p.priority)),
      scope: this.mergeScopes(conflict.policies),
      createdAt: new Date(),
      updatedAt: new Date(),
      signature: 'merged-signature'
    };

    return {
      strategy: 'merge',
      mergedPolicy,
      rationale: 'Merged conflicting policies with combined rules'
    };
  }

  private resolveOverrideConflict(conflict: PolicyConflict): ConflictResolution {
    const localPolicy = conflict.policies.find(p => p.organizationId === this.organizationId);
    
    if (localPolicy) {
      return {
        strategy: 'override',
        winningPolicy: localPolicy.id,
        rationale: 'Local organization policy takes precedence'
      };
    }

    return this.resolvePriorityConflict(conflict);
  }

  private mergeRules(policies: Policy[]): PolicyRule[] {
    const allRules = policies.flatMap(p => p.rules);
    const uniqueRules = new Map<string, PolicyRule>();

    for (const rule of allRules) {
      const key = `${rule.condition}-${rule.action.type}`;
      if (!uniqueRules.has(key)) {
        uniqueRules.set(key, rule);
      }
    }

    return Array.from(uniqueRules.values());
  }

  private mergeScopes(policies: Policy[]): PolicyScope {
    return {
      agents: [...new Set(policies.flatMap(p => p.scope.agents))],
      capabilities: [...new Set(policies.flatMap(p => p.scope.capabilities))],
      resources: [...new Set(policies.flatMap(p => p.scope.resources))]
    };
  }

  private getApplicablePolicies(action: GovernanceAction): Policy[] {
    return Array.from(this.policies.values()).filter(policy =>
      this.policyApplies(policy, action)
    );
  }

  private policyApplies(policy: Policy, action: GovernanceAction): boolean {
    const scope = policy.scope;
    
    return (scope.agents.length === 0 || scope.agents.includes(action.agentId)) &&
           (scope.capabilities.length === 0 || scope.capabilities.includes(action.type)) &&
           (scope.resources.length === 0 || scope.resources.includes(action.target));
  }

  private detectPolicyConflicts(policies: Policy[]): PolicyConflict[] {
    const conflicts: PolicyConflict[] = [];
    
    for (let i = 0; i < policies.length; i++) {
      for (let j = i + 1; j < policies.length; j++) {
        const conflict = this.detectConflict(policies[i], policies[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    return conflicts;
  }

  private async evaluatePolicy(policy: Policy, action: GovernanceAction): Promise<PolicyEvaluation> {
    for (const rule of policy.rules.filter(r => r.enabled)) {
      if (this.ruleMatches(rule, action)) {
        return {
          decision: rule.action.type as 'allow' | 'deny',
          reason: `Rule ${rule.id}: ${rule.condition}`,
          constraints: rule.action.constraints
        };
      }
    }

    return {
      decision: 'continue',
      reason: 'No matching rules in policy'
    };
  }

  private ruleMatches(rule: PolicyRule, action: GovernanceAction): boolean {
    // Simple condition evaluation - in production, use proper expression engine
    return rule.condition.includes(action.type) || rule.condition.includes(action.target);
  }

  private async applyResolution(conflict: PolicyConflict, resolution: ConflictResolution): Promise<void> {
    if (resolution.winningPolicy) {
      // Remove losing policies
      conflict.policies.forEach(policy => {
        if (policy.id !== resolution.winningPolicy) {
          this.policies.delete(policy.id);
        }
      });
    }

    if (resolution.mergedPolicy) {
      // Add merged policy and remove originals
      this.policies.set(resolution.mergedPolicy.id, resolution.mergedPolicy);
      conflict.policies.forEach(policy => this.policies.delete(policy.id));
    }

    // Remove conflict from active conflicts
    this.conflicts.delete(conflict.id);
  }

  private calculateAuditHash(
    action: GovernanceAction,
    policy: Policy | null,
    evaluation: PolicyEvaluation
  ): string {
    const payload = JSON.stringify({
      action,
      policy: policy?.id,
      decision: evaluation.decision,
      timestamp: Date.now()
    });
    
    return Buffer.from(payload).toString('base64');
  }

  private async getFederationToken(organizationId: string): Promise<string> {
    // In production, implement proper federation token exchange
    return `federation-token-${organizationId}`;
  }
}

// Supporting interfaces
export interface PolicySyncResult {
  synchronized: number;
  conflicts: number;
  errors: Array<{ organization: string; error: string }>;
  duration: number;
}

export interface ConflictResolutionResult {
  resolved: number;
  deferred: number;
  failed: number;
  resolutions: Array<{
    conflictId: string;
    resolution: string;
    details: string;
  }>;
}

export interface GovernanceAction {
  type: string;
  target: string;
  agentId: string;
  parameters?: Record<string, any>;
}

export interface GovernanceResult {
  allowed: boolean;
  reason: string;
  policyId?: string;
  constraints?: Record<string, any>;
  conflicts?: string[];
  auditTrail: AuditEntry;
}

export interface PolicyEvaluation {
  decision: 'allow' | 'deny' | 'continue';
  reason: string;
  constraints?: Record<string, any>;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  organizationId: string;
  action: {
    type: string;
    target: string;
    agent: string;
  };
  policy: {
    id: string;
    name: string;
    organization: string;
  } | null;
  decision: string;
  reason: string;
  hash: string;
}

interface SyncResult {
  synchronized: number;
  conflicts: number;
}