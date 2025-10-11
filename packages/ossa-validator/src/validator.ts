import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  AgentManifest,
  WorkflowSpec,
  ConformanceLevel,
  agentManifestSchema,
  workflowSchema,
  conformanceSchema,
  capabilitySchema,
  CONFORMANCE_LEVELS
} from '@ossa/specification';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  conformanceLevel?: string;
  score?: number;
}

export interface ValidationError {
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
  code?: string;
}

export class OSSAValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);

    // Add OSSA schemas
    this.ajv.addSchema(agentManifestSchema, 'agent-manifest');
    this.ajv.addSchema(workflowSchema, 'workflow');
    this.ajv.addSchema(conformanceSchema, 'conformance');
    this.ajv.addSchema(capabilitySchema, 'capability');
  }

  validateAgentManifest(manifest: any): ValidationResult {
    const validate = this.ajv.getSchema('agent-manifest');
    if (!validate) {
      throw new Error('Agent manifest schema not found');
    }

    const valid = validate(manifest);
    const errors = this.convertAjvErrors(validate.errors || []);

    if (!valid) {
      return { valid: false, errors };
    }

    // Check conformance level
    const conformance = this.assessConformance(manifest as AgentManifest);

    return {
      valid: true,
      errors,
      conformanceLevel: conformance.level,
      score: conformance.score
    };
  }

  validateWorkflow(workflow: any): ValidationResult {
    const validate = this.ajv.getSchema('workflow');
    if (!validate) {
      throw new Error('Workflow schema not found');
    }

    const valid = validate(workflow);
    const errors = this.convertAjvErrors(validate.errors || []);

    return { valid, errors };
  }

  validateCapability(capability: any): ValidationResult {
    const validate = this.ajv.getSchema('capability');
    if (!validate) {
      throw new Error('Capability schema not found');
    }

    const valid = validate(capability);
    const errors = this.convertAjvErrors(validate.errors || []);

    return { valid, errors };
  }

  private assessConformance(manifest: AgentManifest): { level: string; score: number } {
    const features = {
      agent_manifest: true, // Always true if we get here
      openapi_spec: !!manifest.spec.configuration.openapi,
      capability_declaration: manifest.spec.capabilities.length > 0,
      health_endpoint: !!manifest.spec.health,
      discovery_endpoint: !!manifest.spec.discovery,
      error_handling: true, // Assume true for now
      authentication: !!manifest.spec.configuration.authentication &&
                     manifest.spec.configuration.authentication.type !== 'none',
      authorization: !!manifest.spec.configuration.authentication &&
                    manifest.spec.configuration.authentication.type !== 'none',
      audit_logging: false, // Would need to check actual implementation
      performance_metrics: false, // Would need to check actual implementation
      feedback_loop: false, // Would need to check actual implementation
      multi_agent_coordination: manifest.spec.type === 'orchestrator'
    };

    // Calculate score
    const totalFeatures = Object.keys(features).length;
    const enabledFeatures = Object.values(features).filter(Boolean).length;
    const score = Math.round((enabledFeatures / totalFeatures) * 100);

    // Determine conformance level
    let level = 'bronze';

    if (features.agent_manifest && features.openapi_spec && features.capability_declaration &&
        features.health_endpoint && features.discovery_endpoint && features.error_handling) {
      level = 'bronze';
    }

    if (features.authentication && features.authorization) {
      level = 'silver';
    }

    if (features.audit_logging && features.performance_metrics) {
      level = 'gold';
    }

    if (features.feedback_loop && features.multi_agent_coordination) {
      level = 'advanced';
    }

    return { level, score };
  }

  private convertAjvErrors(ajvErrors: any[]): ValidationError[] {
    return ajvErrors.map(error => ({
      severity: 'error' as const,
      path: error.instancePath || error.schemaPath,
      message: `${error.instancePath || 'root'} ${error.message}`,
      code: error.keyword
    }));
  }

  validateConformanceLevel(level: any): ValidationResult {
    const validate = this.ajv.getSchema('conformance');
    if (!validate) {
      throw new Error('Conformance schema not found');
    }

    const valid = validate(level);
    const errors = this.convertAjvErrors(validate.errors || []);

    return { valid, errors };
  }

  async validateDirectory(directory: string): Promise<ValidationResult[]> {
    // Implementation for validating entire directories
    // Would scan for agent.yml, workflows, etc.
    throw new Error('Directory validation not yet implemented');
  }

  async validateRemoteAgent(url: string): Promise<ValidationResult> {
    // Implementation for validating remote agents via HTTP
    // Would fetch /capabilities and /health endpoints
    throw new Error('Remote agent validation not yet implemented');
  }
}