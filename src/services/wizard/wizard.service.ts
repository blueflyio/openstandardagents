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
    if (answers.configureAutonomy && answers.autonomyLevel) {
      manifest.spec.autonomy = {
        level: answers.autonomyLevel as 'full' | 'assisted' | 'supervised',
      };
    }

    // Add observability
    if (answers.addObservability) {
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
   * @param toolTypes - Array of tool type selections
   * @returns Array of tool configurations
   */
  private generateTools(toolTypes: string[]): Array<{
    type: string;
    name?: string;
    description?: string;
    config?: Record<string, unknown>;
  }> {
    const toolMap: Record<
      string,
      {
        type: string;
        name: string;
        description: string;
        config?: Record<string, unknown>;
      }
    > = {
      search: {
        type: 'mcp',
        name: 'search',
        description: 'Web search capabilities',
        config: {
          server: 'npx -y @modelcontextprotocol/server-brave-search',
        },
      },
      file_ops: {
        type: 'mcp',
        name: 'filesystem',
        description: 'File system operations',
        config: {
          server: 'npx -y @modelcontextprotocol/server-filesystem',
        },
      },
      web: {
        type: 'function',
        name: 'http_request',
        description: 'Make HTTP requests',
      },
      calculator: {
        type: 'function',
        name: 'calculate',
        description: 'Perform mathematical calculations',
      },
      database: {
        type: 'mcp',
        name: 'database',
        description: 'Database query capabilities',
        config: {
          server: 'npx -y @modelcontextprotocol/server-postgres',
        },
      },
      api: {
        type: 'function',
        name: 'api_call',
        description: 'Call external APIs',
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
