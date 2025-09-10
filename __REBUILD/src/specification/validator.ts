import { components } from '../types/api';

type AgentManifest = components['schemas']['AgentManifest'];
type ValidationResult = components['schemas']['ValidationResult'];
type ValidationError = components['schemas']['ValidationError'];
type AgentTaxonomy = components['schemas']['AgentTaxonomy'];

export class SpecificationValidator {
  private readonly ossaVersion = '0.2.0';
  private readonly validAgentTypes = [
    'orchestrator', 'worker', 'critic', 'judge', 
    'trainer', 'governor', 'monitor', 'integrator'
  ];

  async validate(manifest: AgentManifest): Promise<ValidationResult | ValidationError> {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    
    // Validate agentId format
    if (!manifest.agentId || !/^[a-z0-9-]+$/.test(manifest.agentId)) {
      errors.push({
        field: 'agentId',
        message: 'Agent ID must be lowercase with hyphens only',
        code: 'INVALID_FORMAT'
      });
    }
    
    // Validate agent type
    if (!this.validAgentTypes.includes(manifest.agentType)) {
      errors.push({
        field: 'agentType',
        message: `Invalid agent type: ${manifest.agentType}`,
        code: 'INVALID_TYPE'
      });
    }
    
    // Validate version format
    if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push({
        field: 'version',
        message: 'Version must be in semver format (x.y.z)',
        code: 'INVALID_VERSION'
      });
    }
    
    // Validate capabilities
    if (!manifest.capabilities?.supportedDomains?.length) {
      errors.push({
        field: 'capabilities.supportedDomains',
        message: 'At least one supported domain is required',
        code: 'EMPTY_ARRAY'
      });
    }
    
    if (errors.length > 0) {
      return {
        valid: false,
        errors
      };
    }
    
    // Check for warnings
    const warnings: string[] = [];
    if (manifest.version && manifest.version.startsWith('0.')) {
      warnings.push(`Version ${manifest.version} uses legacy format`);
    }
    
    return {
      valid: true,
      version: this.ossaVersion,
      warnings,
      compliance: {
        ossaVersion: this.ossaVersion,
        level: 'standard'
      }
    };
  }

  getTaxonomy(): AgentTaxonomy {
    return {
      version: this.ossaVersion,
      feedbackLoop: {
        phases: ['plan', 'execute', 'review', 'judge', 'learn', 'govern']
      },
      types: [
        {
          name: 'orchestrator',
          description: 'Manages goal decomposition and workflow coordination',
          capabilities: ['goal-decomposition', 'task-planning', 'workflow-management']
        },
        {
          name: 'worker',
          description: 'Executes specific tasks with self-reporting',
          capabilities: ['task-execution', 'self-reporting', 'result-validation']
        },
        {
          name: 'critic',
          description: 'Provides multi-dimensional reviews and feedback',
          capabilities: ['review-generation', 'feedback-analysis', 'quality-assessment']
        },
        {
          name: 'judge',
          description: 'Makes binary decisions through pairwise comparisons',
          capabilities: ['decision-making', 'comparison', 'evaluation']
        }
      ]
    };
  }

  getSchema(agentType: string): any {
    if (!this.validAgentTypes.includes(agentType)) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }
    
    return {
      type: 'object',
      properties: {
        agentId: { type: 'string', pattern: '^[a-z0-9-]+$' },
        agentType: { type: 'string', enum: this.validAgentTypes },
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        capabilities: {
          type: 'object',
          properties: {
            supportedDomains: { type: 'array', items: { type: 'string' } },
            inputFormats: { type: 'array', items: { type: 'string' } },
            outputFormats: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['agentId', 'agentType', 'version', 'capabilities']
    };
  }
}