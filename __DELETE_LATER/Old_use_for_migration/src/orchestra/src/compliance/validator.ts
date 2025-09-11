/**
 * OSSA Orchestra v0.1.8 - Workflow Compliance Validation Engine
 * Comprehensive compliance validation for multi-agent workflows
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import {
  ComplianceLevel,
  ComplianceRequirement,
  ComplianceViolation,
  ComplianceResult,
  OrchestrationRequest,
  OrchestrationResult,
  WorkflowDefinition,
  AgentDefinition,
  StageResult
} from '../core/types';

export class ComplianceValidator extends EventEmitter {
  private logger: Logger;
  private policies: Map<string, CompliancePolicy> = new Map();
  private validators: Map<string, ComplianceValidatorFunction> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.logger = new Logger('ComplianceValidator');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing Workflow Compliance Validation Engine');
    
    // Load default policies and validators
    await this.loadDefaultPolicies();
    this.registerDefaultValidators();
    
    this.isInitialized = true;
    this.logger.info('Compliance Validation Engine initialized');
  }

  async shutdown(): Promise<void> {
    this.policies.clear();
    this.validators.clear();
    this.isInitialized = false;
    this.logger.info('Compliance Validation Engine shutdown');
  }

  async validatePreExecution(
    request: OrchestrationRequest,
    requirements: ComplianceRequirement[]
  ): Promise<ComplianceViolation[]> {
    this.ensureInitialized();
    
    const violations: ComplianceViolation[] = [];
    
    for (const requirement of requirements) {
      const policyViolations = await this.validateRequirement(
        requirement,
        'pre-execution',
        { request }
      );
      violations.push(...policyViolations);
    }
    
    if (violations.length > 0) {
      this.logger.warn(`Pre-execution compliance violations found: ${violations.length}`);
      this.emit('pre-execution-violations', { request: request.id, violations });
    }
    
    return violations;
  }

  async validatePostExecution(
    result: OrchestrationResult,
    requirements: ComplianceRequirement[]
  ): Promise<ComplianceViolation[]> {
    this.ensureInitialized();
    
    const violations: ComplianceViolation[] = [];
    
    for (const requirement of requirements) {
      const policyViolations = await this.validateRequirement(
        requirement,
        'post-execution',
        { result }
      );
      violations.push(...policyViolations);
    }
    
    if (violations.length > 0) {
      this.logger.warn(`Post-execution compliance violations found: ${violations.length}`);
      this.emit('post-execution-violations', { execution: result.id, violations });
    }
    
    return violations;
  }

  async validateContinuous(
    workflowId: string,
    executionData: any
  ): Promise<ComplianceResult> {
    this.ensureInitialized();
    
    // Get workflow-specific compliance requirements
    const requirements = await this.getWorkflowRequirements(workflowId);
    const violations: ComplianceViolation[] = [];
    
    for (const requirement of requirements) {
      const policyViolations = await this.validateRequirement(
        requirement,
        'continuous',
        { workflowId, executionData }
      );
      violations.push(...policyViolations);
    }
    
    const result = this.calculateComplianceResult(violations, requirements);
    
    if (!result.passed) {
      this.logger.warn(`Continuous compliance validation failed for workflow: ${workflowId}`);
      this.emit('continuous-violations', { workflowId, result });
    }
    
    return result;
  }

  async validateWorkflow(workflow: WorkflowDefinition): Promise<ComplianceViolation[]> {
    this.ensureInitialized();
    
    const violations: ComplianceViolation[] = [];
    
    // Validate workflow structure
    violations.push(...await this.validateWorkflowStructure(workflow));
    
    // Validate compliance requirements
    for (const requirement of workflow.compliance) {
      violations.push(...await this.validateWorkflowRequirement(workflow, requirement));
    }
    
    // Validate stages
    for (const stage of workflow.stages) {
      violations.push(...await this.validateWorkflowStage(workflow, stage));
    }
    
    if (violations.length > 0) {
      this.logger.warn(`Workflow validation violations found: ${violations.length}`);
      this.emit('workflow-violations', { workflow: workflow.id, violations });
    }
    
    return violations;
  }

  async validateAgent(agent: AgentDefinition): Promise<ComplianceViolation[]> {
    this.ensureInitialized();
    
    const violations: ComplianceViolation[] = [];
    
    // Validate agent configuration
    violations.push(...await this.validateAgentConfiguration(agent));
    
    // Validate security requirements
    violations.push(...await this.validateAgentSecurity(agent));
    
    // Validate performance requirements
    violations.push(...await this.validateAgentPerformance(agent));
    
    if (violations.length > 0) {
      this.logger.warn(`Agent validation violations found: ${violations.length}`);
      this.emit('agent-violations', { agent: agent.id, violations });
    }
    
    return violations;
  }

  async addPolicy(policy: CompliancePolicy): Promise<void> {
    this.ensureInitialized();
    
    this.policies.set(policy.id, policy);
    this.logger.info(`Added compliance policy: ${policy.id}`);
    this.emit('policy-added', policy);
  }

  async removePolicy(policyId: string): Promise<void> {
    this.ensureInitialized();
    
    if (this.policies.delete(policyId)) {
      this.logger.info(`Removed compliance policy: ${policyId}`);
      this.emit('policy-removed', policyId);
    }
  }

  async getPolicies(): Promise<CompliancePolicy[]> {
    this.ensureInitialized();
    return Array.from(this.policies.values());
  }

  async getPolicy(policyId: string): Promise<CompliancePolicy | null> {
    this.ensureInitialized();
    return this.policies.get(policyId) || null;
  }

  registerValidator(name: string, validator: ComplianceValidatorFunction): void {
    this.validators.set(name, validator);
    this.logger.info(`Registered compliance validator: ${name}`);
  }

  async getComplianceReport(
    workflowId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ComplianceReport> {
    // Generate compliance report for a workflow
    const violations = await this.getViolationHistory(workflowId, timeRange);
    const policies = Array.from(this.policies.values());
    
    return {
      workflowId,
      timeRange,
      totalExecutions: 0, // Would be fetched from execution history
      violationCount: violations.length,
      violations,
      policies: policies.map(p => p.id),
      complianceScore: this.calculateComplianceScore(violations),
      recommendations: await this.generateRecommendations(violations)
    };
  }

  private async loadDefaultPolicies(): Promise<void> {
    const defaultPolicies: CompliancePolicy[] = [
      {
        id: 'data-protection',
        name: 'Data Protection Policy',
        level: 'gold',
        rules: [
          {
            id: 'pii-encryption',
            name: 'PII Data Encryption',
            description: 'All PII data must be encrypted in transit and at rest',
            validator: 'pii-encryption-validator',
            severity: 'critical',
            phase: 'pre-execution'
          },
          {
            id: 'data-retention',
            name: 'Data Retention Limits',
            description: 'Data must not be retained beyond specified limits',
            validator: 'data-retention-validator',
            severity: 'high',
            phase: 'post-execution'
          }
        ],
        enabled: true,
        created: new Date(),
        updated: new Date()
      },
      {
        id: 'security-controls',
        name: 'Security Controls Policy',
        level: 'silver',
        rules: [
          {
            id: 'agent-authentication',
            name: 'Agent Authentication',
            description: 'All agents must authenticate using valid credentials',
            validator: 'agent-auth-validator',
            severity: 'critical',
            phase: 'pre-execution'
          },
          {
            id: 'secure-communication',
            name: 'Secure Communication',
            description: 'All inter-agent communication must use encrypted channels',
            validator: 'secure-comm-validator',
            severity: 'high',
            phase: 'continuous'
          }
        ],
        enabled: true,
        created: new Date(),
        updated: new Date()
      },
      {
        id: 'performance-standards',
        name: 'Performance Standards Policy',
        level: 'bronze',
        rules: [
          {
            id: 'response-time-limits',
            name: 'Response Time Limits',
            description: 'Agent response times must be within acceptable limits',
            validator: 'response-time-validator',
            severity: 'medium',
            phase: 'continuous'
          },
          {
            id: 'resource-utilization',
            name: 'Resource Utilization',
            description: 'Resource utilization must not exceed defined thresholds',
            validator: 'resource-utilization-validator',
            severity: 'medium',
            phase: 'continuous'
          }
        ],
        enabled: true,
        created: new Date(),
        updated: new Date()
      }
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.id, policy);
    }

    this.logger.info(`Loaded ${defaultPolicies.length} default compliance policies`);
  }

  private registerDefaultValidators(): void {
    // PII Encryption Validator
    this.registerValidator('pii-encryption-validator', async (context) => {
      const violations: ComplianceViolation[] = [];
      
      // Check if request contains PII data
      if (context.request && this.containsPII(context.request.input)) {
        // Simulate encryption check
        const isEncrypted = this.checkEncryption(context.request.input);
        
        if (!isEncrypted) {
          violations.push({
            policy: 'data-protection',
            severity: 'critical',
            message: 'PII data detected without proper encryption',
            remediation: 'Encrypt PII data before processing'
          });
        }
      }
      
      return violations;
    });

    // Data Retention Validator
    this.registerValidator('data-retention-validator', async (context) => {
      const violations: ComplianceViolation[] = [];
      
      // Check data retention policies
      if (context.result) {
        const hasDataRetentionViolation = this.checkDataRetention(context.result);
        
        if (hasDataRetentionViolation) {
          violations.push({
            policy: 'data-protection',
            severity: 'high',
            message: 'Data retention period exceeded',
            remediation: 'Implement automated data cleanup processes'
          });
        }
      }
      
      return violations;
    });

    // Agent Authentication Validator
    this.registerValidator('agent-auth-validator', async (context) => {
      const violations: ComplianceViolation[] = [];
      
      // Simulate authentication check
      const isAuthenticated = this.checkAgentAuthentication(context);
      
      if (!isAuthenticated) {
        violations.push({
          policy: 'security-controls',
          severity: 'critical',
          message: 'Agent authentication failed or missing',
          remediation: 'Ensure all agents have valid authentication credentials'
        });
      }
      
      return violations;
    });

    // Response Time Validator
    this.registerValidator('response-time-validator', async (context) => {
      const violations: ComplianceViolation[] = [];
      
      if (context.result && context.result.metrics) {
        const avgResponseTime = context.result.metrics.performance?.avgResponseTime || 0;
        
        if (avgResponseTime > 5000) { // 5 second threshold
          violations.push({
            policy: 'performance-standards',
            severity: 'medium',
            message: `Average response time (${avgResponseTime}ms) exceeds threshold`,
            remediation: 'Optimize agent performance or implement caching'
          });
        }
      }
      
      return violations;
    });

    this.logger.info('Registered default compliance validators');
  }

  private async validateRequirement(
    requirement: ComplianceRequirement,
    phase: string,
    context: any
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    for (const policyId of requirement.policies) {
      const policy = this.policies.get(policyId);
      if (!policy || !policy.enabled) {
        continue;
      }
      
      // Get relevant validation rules for this phase
      const relevantRules = policy.rules.filter(rule => 
        rule.phase === phase || rule.phase === 'all'
      );
      
      for (const rule of relevantRules) {
        const validator = this.validators.get(rule.validator);
        if (validator) {
          const ruleViolations = await validator(context);
          violations.push(...ruleViolations.map(v => ({
            ...v,
            policy: policyId,
            stage: context.stage
          })));
        }
      }
    }
    
    return violations;
  }

  private async validateWorkflowStructure(workflow: WorkflowDefinition): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    // Check for circular dependencies
    if (this.hasCircularDependencies(workflow)) {
      violations.push({
        policy: 'workflow-structure',
        severity: 'critical',
        message: 'Workflow contains circular dependencies',
        remediation: 'Remove circular dependencies from workflow stages'
      });
    }
    
    // Check for unreachable stages
    const unreachableStages = this.findUnreachableStages(workflow);
    if (unreachableStages.length > 0) {
      violations.push({
        policy: 'workflow-structure',
        severity: 'high',
        message: `Workflow contains unreachable stages: ${unreachableStages.join(', ')}`,
        remediation: 'Remove unreachable stages or fix dependencies'
      });
    }
    
    return violations;
  }

  private async validateWorkflowRequirement(
    workflow: WorkflowDefinition,
    requirement: ComplianceRequirement
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    // Validate compliance level requirements
    if (requirement.level === 'platinum' && !workflow.constraints.complianceRequired) {
      violations.push({
        policy: 'compliance-requirements',
        severity: 'critical',
        message: 'Platinum compliance level requires compliance to be enforced',
        remediation: 'Enable compliance enforcement in workflow constraints'
      });
    }
    
    return violations;
  }

  private async validateWorkflowStage(
    workflow: WorkflowDefinition,
    stage: any
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    // Validate stage configuration
    if (!stage.timeout || stage.timeout <= 0) {
      violations.push({
        policy: 'workflow-configuration',
        severity: 'medium',
        message: `Stage ${stage.id} has invalid timeout configuration`,
        stage: stage.id,
        remediation: 'Set appropriate timeout value for stage'
      });
    }
    
    // Validate retry policy
    if (!stage.retry || stage.retry.maxAttempts < 1) {
      violations.push({
        policy: 'workflow-configuration',
        severity: 'low',
        message: `Stage ${stage.id} has insufficient retry configuration`,
        stage: stage.id,
        remediation: 'Configure appropriate retry policy for stage'
      });
    }
    
    return violations;
  }

  private async validateAgentConfiguration(agent: AgentDefinition): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    // Validate agent endpoint
    if (!agent.endpoint || !this.isValidUrl(agent.endpoint)) {
      violations.push({
        policy: 'agent-configuration',
        severity: 'critical',
        message: 'Agent has invalid or missing endpoint',
        remediation: 'Configure valid agent endpoint URL'
      });
    }
    
    // Validate capabilities
    if (!agent.capabilities || agent.capabilities.length === 0) {
      violations.push({
        policy: 'agent-configuration',
        severity: 'high',
        message: 'Agent has no defined capabilities',
        remediation: 'Define at least one capability for the agent'
      });
    }
    
    return violations;
  }

  private async validateAgentSecurity(agent: AgentDefinition): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    // Check if endpoint uses HTTPS
    if (agent.endpoint && !agent.endpoint.startsWith('https://')) {
      violations.push({
        policy: 'security-controls',
        severity: 'high',
        message: 'Agent endpoint does not use HTTPS',
        remediation: 'Update agent endpoint to use HTTPS protocol'
      });
    }
    
    return violations;
  }

  private async validateAgentPerformance(agent: AgentDefinition): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    for (const capability of agent.capabilities) {
      if (capability.performance.responseTime.max > 30000) { // 30 seconds
        violations.push({
          policy: 'performance-standards',
          severity: 'medium',
          message: `Capability ${capability.id} has excessive maximum response time`,
          remediation: 'Optimize capability or reduce maximum response time threshold'
        });
      }
    }
    
    return violations;
  }

  private calculateComplianceResult(
    violations: ComplianceViolation[],
    requirements: ComplianceRequirement[]
  ): ComplianceResult {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high').length;
    const mediumViolations = violations.filter(v => v.severity === 'medium').length;
    const lowViolations = violations.filter(v => v.severity === 'low').length;
    
    // Calculate compliance score (0-100)
    let score = 100;
    score -= criticalViolations * 25;
    score -= highViolations * 10;
    score -= mediumViolations * 5;
    score -= lowViolations * 1;
    score = Math.max(0, score);
    
    // Determine compliance level
    let level: ComplianceLevel = 'bronze';
    if (score >= 95 && criticalViolations === 0) level = 'platinum';
    else if (score >= 85 && criticalViolations === 0) level = 'gold';
    else if (score >= 70 && criticalViolations === 0) level = 'silver';
    
    // Check if compliance passes
    const passed = criticalViolations === 0 && 
                   (requirements.length === 0 || 
                    requirements.every(req => this.meetsRequirementLevel(level, req.level)));
    
    return {
      level,
      passed,
      violations,
      score
    };
  }

  private meetsRequirementLevel(actual: ComplianceLevel, required: ComplianceLevel): boolean {
    const levels = { 'bronze': 1, 'silver': 2, 'gold': 3, 'platinum': 4 };
    return levels[actual] >= levels[required];
  }

  private calculateComplianceScore(violations: ComplianceViolation[]): number {
    let score = 100;
    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 1; break;
      }
    }
    return Math.max(0, score);
  }

  private async generateRecommendations(violations: ComplianceViolation[]): Promise<string[]> {
    const recommendations = new Set<string>();
    
    for (const violation of violations) {
      if (violation.remediation) {
        recommendations.add(violation.remediation);
      }
    }
    
    return Array.from(recommendations);
  }

  private async getWorkflowRequirements(workflowId: string): Promise<ComplianceRequirement[]> {
    // In a real implementation, this would fetch from workflow registry
    return [
      {
        level: 'silver',
        policies: ['data-protection', 'security-controls'],
        validation: {
          preExecution: ['pii-encryption-validator', 'agent-auth-validator'],
          postExecution: ['data-retention-validator'],
          continuous: ['secure-comm-validator', 'response-time-validator']
        }
      }
    ];
  }

  private async getViolationHistory(
    workflowId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ComplianceViolation[]> {
    // In a real implementation, this would fetch from violation history storage
    return [];
  }

  private hasCircularDependencies(workflow: WorkflowDefinition): boolean {
    // Simple cycle detection using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (stageId: string): boolean => {
      visited.add(stageId);
      recursionStack.add(stageId);
      
      const stage = workflow.stages.find(s => s.id === stageId);
      if (!stage) return false;
      
      const dependencies = workflow.dependencies.filter(d => d.stageId === stageId);
      
      for (const dep of dependencies) {
        for (const depStageId of dep.dependsOn) {
          if (!visited.has(depStageId)) {
            if (hasCycle(depStageId)) return true;
          } else if (recursionStack.has(depStageId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(stageId);
      return false;
    };
    
    for (const stage of workflow.stages) {
      if (!visited.has(stage.id)) {
        if (hasCycle(stage.id)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private findUnreachableStages(workflow: WorkflowDefinition): string[] {
    const reachable = new Set<string>();
    
    // Find stages with no dependencies (entry points)
    const entryStages = workflow.stages.filter(stage => {
      const dependencies = workflow.dependencies.find(d => d.stageId === stage.id);
      return !dependencies || dependencies.dependsOn.length === 0;
    });
    
    // DFS to mark reachable stages
    const markReachable = (stageId: string) => {
      if (reachable.has(stageId)) return;
      
      reachable.add(stageId);
      
      // Find stages that depend on this stage
      const dependentStages = workflow.dependencies
        .filter(d => d.dependsOn.includes(stageId))
        .map(d => d.stageId);
      
      for (const dependentStage of dependentStages) {
        markReachable(dependentStage);
      }
    };
    
    // Mark all reachable stages
    for (const entryStage of entryStages) {
      markReachable(entryStage.id);
    }
    
    // Return unreachable stages
    return workflow.stages
      .filter(stage => !reachable.has(stage.id))
      .map(stage => stage.id);
  }

  private containsPII(data: any): boolean {
    // Simple PII detection (in real implementation, use proper PII detection)
    const dataStr = JSON.stringify(data).toLowerCase();
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ // Credit card
    ];
    
    return piiPatterns.some(pattern => pattern.test(dataStr));
  }

  private checkEncryption(data: any): boolean {
    // Simulate encryption check
    return Math.random() > 0.3; // 70% encrypted for simulation
  }

  private checkDataRetention(result: OrchestrationResult): boolean {
    // Simulate data retention check
    return Math.random() < 0.1; // 10% violation rate for simulation
  }

  private checkAgentAuthentication(context: any): boolean {
    // Simulate authentication check
    return Math.random() > 0.05; // 95% success rate for simulation
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ComplianceValidator not initialized. Call initialize() first.');
    }
  }
}

interface CompliancePolicy {
  id: string;
  name: string;
  level: ComplianceLevel;
  rules: ComplianceRule[];
  enabled: boolean;
  created: Date;
  updated: Date;
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  validator: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  phase: 'pre-execution' | 'post-execution' | 'continuous' | 'all';
}

type ComplianceValidatorFunction = (context: any) => Promise<ComplianceViolation[]>;

interface ComplianceReport {
  workflowId: string;
  timeRange?: { start: Date; end: Date };
  totalExecutions: number;
  violationCount: number;
  violations: ComplianceViolation[];
  policies: string[];
  complianceScore: number;
  recommendations: string[];
}