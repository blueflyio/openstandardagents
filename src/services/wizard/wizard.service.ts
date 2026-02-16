/**
 * Wizard Service
 * Interactive wizard for creating OSSA agents
 *
 * SOLID: Single Responsibility - Agent creation wizard logic only
 * DRY: Reuses GenerationService and ValidationService
 */

import { injectable, inject } from 'inversify';
import inquirer from 'inquirer';
import type { OssaAgent } from '../../types/index.js';
import { GenerationService } from '../generation.service.js';
import { ValidationService } from '../validation.service.js';
import { getApiVersion } from '../../utils/version.js';
import { allPrompts, type WizardAnswers } from './prompts.js';

export interface WizardResult {
  manifest: OssaAgent;
  answers: WizardAnswers;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@injectable()
export class WizardService {
  constructor(
    @inject(GenerationService) private generationService: GenerationService,
    @inject(ValidationService) private validationService: ValidationService
  ) {}

  /**
   * Run interactive wizard to create agent manifest
   * @returns Complete wizard result with manifest and validation
   */
  async runWizard(): Promise<WizardResult> {
    // Run all prompts
    const answers = await inquirer.prompt<WizardAnswers>(allPrompts);

    // Generate manifest from answers
    const manifest = this.generateManifest(answers);

    // Validate generated manifest
    const validationResult = await this.validationService.validate(manifest);

    return {
      manifest,
      answers,
      valid: validationResult.valid,
      errors: validationResult.errors.map(
        (e) => e.message || 'Validation error'
      ),
      warnings: validationResult.warnings,
    };
  }

  /**
   * Generate OSSA manifest from wizard answers
   * @param answers - User responses from prompts
   * @returns Complete OSSA agent manifest
   */
  private generateManifest(answers: WizardAnswers): OssaAgent {
    const manifest: OssaAgent = {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: answers.name,
        version: answers.version,
        description: answers.description,
        labels: {},
        annotations: {},
      },
      spec: {
        role: answers.role,
        llm: {
          provider: answers.llm_provider,
          model: answers.model,
          temperature: answers.temperature,
        },
        tools: this.generateTools(answers.tools),
      },
    };

    // Add memory configuration
    if (answers.memory && answers.memory !== 'none') {
      (manifest.spec as any).memory = {
        type: answers.memory,
      };
    }

    // Add safety controls
    if (answers.addSafety) {
      (manifest.spec as any).safety = this.generateSafetyConfig(answers);
    }

    // Add autonomy configuration
    if (answers.configureAutonomy && answers.autonomyLevel && manifest.spec) {
      manifest.spec.autonomy = {
        level: answers.autonomyLevel as 'full' | 'assisted' | 'supervised',
      };
    }

    // Add observability
    if (answers.addObservability && manifest.spec) {
      manifest.spec.observability = {
        tracing: {
          enabled: true,
          exporter: 'otlp',
        },
        metrics: {
          enabled: true,
        },
        logging: {
          level: 'info',
        },
      };
    }

    // Add platform extensions
    if (answers.addExtensions && answers.platforms) {
      manifest.extensions = this.generateExtensions(answers.platforms);
    }

    return manifest;
  }

  /**
   * Generate tools from selected tool types
   * @param toolTypes - Array of tool type selections (v0.4 schema types)
   * @returns Array of tool configurations
   */
  private generateTools(toolTypes: string[]): Array<{
    type: string;
    name?: string;
    description?: string;
    config?: Record<string, unknown>;
  }> {
    // Map of schema tool types to default configurations
    const toolMap: Record<
      string,
      {
        type: string;
        name: string;
        description: string;
        config?: Record<string, unknown>;
      }
    > = {
      // Common Tools
      mcp: {
        type: 'mcp',
        name: 'filesystem',
        description: 'Model Context Protocol server for filesystem operations',
        config: {
          server: 'npx -y @modelcontextprotocol/server-filesystem',
          args: ['./'],
        },
      },
      function: {
        type: 'function',
        name: 'example_function',
        description: 'Example local function call',
      },
      http: {
        type: 'http',
        name: 'http_request',
        description: 'HTTP endpoint integration',
      },
      api: {
        type: 'api',
        name: 'api_integration',
        description: 'REST API integration',
      },
      browser: {
        type: 'browser',
        name: 'browser_automation',
        description: 'Puppeteer/Playwright browser automation',
      },
      library: {
        type: 'library',
        name: 'reusable_library',
        description: 'Reusable logic library',
      },

      // Event-Driven Tools
      webhook: {
        type: 'webhook',
        name: 'webhook_trigger',
        description: 'Webhook event trigger',
      },
      schedule: {
        type: 'schedule',
        name: 'cron_schedule',
        description: 'Cron-based schedule trigger',
        config: {
          cron: '0 0 * * *', // Daily at midnight
        },
      },
      pipeline: {
        type: 'pipeline',
        name: 'ci_pipeline',
        description: 'CI/CD pipeline event integration',
      },
      workflow: {
        type: 'workflow',
        name: 'workflow_status',
        description: 'Workflow status change trigger',
      },

      // Output Types
      artifact: {
        type: 'artifact',
        name: 'file_artifact',
        description: 'File artifact output',
      },
      'git-commit': {
        type: 'git-commit',
        name: 'commit_output',
        description: 'Git commit output',
      },
      'ci-status': {
        type: 'ci-status',
        name: 'pipeline_status',
        description: 'CI/CD pipeline status',
      },
      comment: {
        type: 'comment',
        name: 'mr_comment',
        description: 'Merge request or issue comment',
      },

      // Advanced Integration
      grpc: {
        type: 'grpc',
        name: 'grpc_service',
        description: 'gRPC service integration',
      },
      a2a: {
        type: 'a2a',
        name: 'agent_communication',
        description: 'Agent-to-agent communication',
      },
      kubernetes: {
        type: 'kubernetes',
        name: 'k8s_api',
        description: 'Kubernetes API integration',
      },
      custom: {
        type: 'custom',
        name: 'custom_integration',
        description: 'Custom integration',
      },
    };

    return toolTypes.map((type) => toolMap[type]).filter(Boolean);
  }

  /**
   * Generate safety configuration
   * @param answers - Wizard answers
   * @returns Safety configuration object
   */
  private generateSafetyConfig(
    answers: WizardAnswers
  ): Record<string, unknown> {
    const safety: Record<string, unknown> = {};

    if (answers.contentFiltering) {
      safety.content_filtering = {
        enabled: true,
        categories: [
          'hate_speech',
          'violence',
          'self_harm',
          'illegal_activity',
        ],
        threshold: 'medium',
        action: 'block',
      };
    }

    if (answers.piiDetection) {
      safety.pii_detection = {
        enabled: true,
        types: ['email', 'phone', 'ssn', 'credit_card', 'api_key'],
        action: 'redact',
      };
    }

    return safety;
  }

  /**
   * Generate platform extensions
   * @param platforms - Selected platform IDs
   * @returns Extensions configuration
   */
  private generateExtensions(
    platforms: string[]
  ): Record<string, Record<string, unknown>> {
    const extensions: Record<string, Record<string, unknown>> = {};

    platforms.forEach((platform) => {
      switch (platform) {
        case 'cursor':
          extensions.cursor = {
            enabled: true,
            agent_type: 'composer',
          };
          break;
        case 'openai':
          extensions.openai_agents = {
            enabled: true,
          };
          break;
        case 'langchain':
          extensions.langchain = {
            enabled: true,
          };
          break;
        case 'langflow':
          extensions.langflow = {
            enabled: true,
          };
          break;
        case 'crewai':
          extensions.crewai = {
            enabled: true,
            agent_type: 'worker',
          };
          break;
        case 'anthropic':
          extensions.anthropic = {
            enabled: true,
          };
          break;
        case 'vercel':
          extensions.vercel_ai = {
            enabled: true,
          };
          break;
        case 'llamaindex':
          extensions.llamaindex = {
            enabled: true,
          };
          break;
      }
    });

    return extensions;
  }

  /**
   * Export manifest to platform-specific format
   * @param manifest - OSSA manifest
   * @param platform - Target platform
   * @returns Platform-specific configuration
   */
  async exportToPlatform(
    manifest: OssaAgent,
    platform: string
  ): Promise<Record<string, unknown>> {
    return this.generationService.exportToPlatform(manifest, platform as any);
  }
}
