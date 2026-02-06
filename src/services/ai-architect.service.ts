/**
 * AI Architect Service
 *
 * The "Brain" of the wizard. Transforms high-level user intent into
 * valid OSSA manifests with correct Adapters and Principals using LLM reasoning.
 *
 * CORE CONCEPT: THE BLUEPRINT
 * The "Blueprint" is an intermediate representation between abstract user intent
 * and the concrete, detailed OSSA Manifest. It captures the *architectural decisions*
 * (patterns, identity, capabilities) before they are compiled into the final spec.
 *
 * API-FIRST PRINCIPLE:
 * This service ensures that the generated manifest strictly adheres to the OSSA schema.
 * It uses the ValidationService to verify the output before returning it, preventing
 * the creation of invalid agents.
 */

import { injectable, inject } from 'inversify';
import type {
  OssaAgent,
  GenerationContext,
  Adapter,
  IValidationService,
  Blueprint,
  BlueprintKind,
  Principal,
} from '../types/index.js';
import { ValidationService } from './validation.service.js';
import { getVersionInfo } from '../utils/version.js';
import { AnthropicAdapter, OssaManifest } from './runtime/anthropic.adapter.js';

const ARCHITECT_MANIFEST: OssaManifest = {
  apiVersion: 'ossa/v0.3',
  kind: 'Agent',
  metadata: { name: 'ai-architect' },
  spec: {
    role: `You are an expert AI Systems Architect specialized in OSSA (Open Standard for Software Agents).
Your goal is to design robust, scalable agent systems based on user intent.

You know about:
1. OSSA Architecture: Principals, Adapters, Envelopes.
2. Deployment patterns: Kubernetes (Kagent), Serverless, Multi-agent Swarms.
3. Capabilities: RAG, Tool use, Code compliance.

Return a JSON object matching the Blueprint interface.`,
    llm: { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
  },
};

@injectable()
export class AIArchitectService {
  private apiKey?: string;
  private provider: 'anthropic' | 'openai' = 'anthropic';

  constructor(
    @inject(ValidationService) private validationService: IValidationService
  ) {}

  /**
   * Configure the architect with a user's API key
   */
  configure(apiKey: string, provider: 'anthropic' | 'openai' = 'anthropic') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  /**
   * Create an architectural blueprint from user intent
   */
  async createBlueprint(context: GenerationContext): Promise<Blueprint> {
    // If no API key, fall back to heuristic mode
    if (!this.apiKey) {
      return this.heuristicBlueprint(context);
    }

    try {
      const adapter = new AnthropicAdapter(ARCHITECT_MANIFEST, this.apiKey);
      adapter.initialize();

      const prompt = `
User Intent: "${context.intent}"

Analyze this intent and generate a comprehensive OSSA Blueprint.
The output MUST be valid JSON matching this structure:
{
  "title": "string",
  "summary": "string",
  "kind": "Agent" | "Task" | "Workflow",
  "architecture": { "pattern": "string", "reasoning": "string" },
  "identity": { 
    "principal": { "category": "string", "mode": "string", "policy": { "permissions": [] } },
    "adapters": [ { "type": "string", "version": "string", "config": {} } ]
  },
  "intelligence": { "provider": "string", "model": "string", "rationale": "string" },
  "capabilities": { "selected": [], "missing_but_needed": [] },
  "constraints": []
}

Consider best practices for "Build Once, Deploy Everywhere".
If the user mentions specific platforms (GitLab, Kagent, Drupal), include the relevant adapters.
`;

      const response = await adapter.chat(prompt);

      // Extract JSON from response (handling potential markdown blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Architect response');
      }

      const blueprint = JSON.parse(jsonMatch[0]) as Blueprint;
      return blueprint;
    } catch (error) {
      console.warn('AI Architect failed, falling back to heuristics:', error);
      return this.heuristicBlueprint(context);
    }
  }

  /**
   * Fallback heuristic blueprint generation
   */
  private async heuristicBlueprint(
    context: GenerationContext
  ): Promise<Blueprint> {
    const intent = context.intent.toLowerCase();

    // 1. Determine Kind
    let kind: BlueprintKind = 'Agent';
    if (
      intent.includes('workflow') ||
      intent.includes('pipeline') ||
      intent.includes('process')
    ) {
      kind = 'Workflow';
    } else if (
      intent.includes('task') ||
      intent.includes('job') ||
      intent.includes('function')
    ) {
      kind = 'Task';
    }

    // 2. Select Architecture Pattern
    let pattern: Blueprint['architecture']['pattern'] = 'single-agent';
    if (kind === 'Workflow') pattern = 'dag-workflow';
    if (intent.includes('swarm') || intent.includes('team'))
      pattern = 'multi-agent-swarm';

    // 3. Recommend Adapters
    const adapters = await this.recommendAdapters(intent);

    // 4. Default Principal
    const principal: Principal = {
      category: 'service',
      mode: 'service_account',
      credentialSource: {
        type: 'env',
        ref: 'OPENAI_API_KEY',
      },
      policy: {
        permissions: ['model.inference'],
      },
    };

    // 5. Build Blueprint
    return {
      title: `${kind} for ${context.intent.substring(0, 30)}...`,
      summary: `A ${pattern} system designed to handle: ${context.intent}`,
      kind,
      architecture: {
        pattern,
        reasoning: `Based on keywords in "${context.intent}", this architecture provides the best balance of control and autonomy.`,
      },
      identity: {
        principal,
        adapters,
      },
      intelligence: {
        provider: this.provider,
        model:
          this.provider === 'anthropic'
            ? 'claude-3-5-sonnet-20240620'
            : 'gpt-4o',
        rationale: 'Balanced performance and cost model selected by default.',
      },
      capabilities: {
        selected: [],
        missing_but_needed: [],
      },
      constraints: [],
    };
  }

  /**
   * Analyze intent and recommend Adapters (Heuristic)
   */
  private async recommendAdapters(intent: string): Promise<Adapter[]> {
    const adapters: Adapter[] = [];
    const lowerIntent = intent.toLowerCase();

    if (lowerIntent.includes('gitlab')) {
      adapters.push({
        type: 'scm.gitlab',
        version: '1.0.0',
        config: {
          projectId: '${GITLAB_PROJECT_ID}',
          branch: 'main',
        },
      });
    }

    if (lowerIntent.includes('github')) {
      adapters.push({
        type: 'scm.github',
        version: '1.0.0',
        config: {
          repo: 'org/repo',
          branch: 'main',
        },
      });
    }

    if (lowerIntent.includes('kagent') || lowerIntent.includes('kubernetes')) {
      adapters.push({
        type: 'runtime.kagent',
        version: '0.5.0',
        config: {
          namespace: 'agents',
          scaling: { min: 1, max: 5 },
        },
      });
    }

    if (lowerIntent.includes('drupal')) {
      adapters.push({
        type: 'export.drupal',
        version: '1.0.0',
        config: {
          bundle: 'ai_agent',
          mapping: { role: 'field_system_prompt' },
        },
      });
    }

    return adapters;
  }

  /**
   * Generate Full Manifest from Blueprint
   */
  async generateManifestFromBlueprint(
    blueprint: Blueprint
  ): Promise<Partial<OssaAgent>> {
    const versionInfo = getVersionInfo();

    const manifest: OssaAgent = {
      apiVersion: versionInfo.apiVersion,
      kind: blueprint.kind,
      metadata: {
        name: blueprint.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .substring(0, 63),
        version: '0.1.0',
        description: blueprint.summary,
        labels: {
          'architecture.pattern': blueprint.architecture.pattern,
        },
      },
      spec: {
        role: `You are an intelligent agent designed to execute the following blueprint: ${blueprint.summary}`,
        llm: {
          provider: blueprint.intelligence.provider,
          model: blueprint.intelligence.model,
        },
        principal: blueprint.identity.principal,
        adapters: blueprint.identity.adapters,
      },
    };

    // Validate
    const validationResult = await this.validationService.validate(
      manifest,
      versionInfo.version
    );
    if (!validationResult.valid) {
      console.warn(
        '⚠️ Generated manifest has validation warnings:',
        validationResult.errors
      );
    }

    return manifest;
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateManifest(
    context: GenerationContext
  ): Promise<Partial<OssaAgent>> {
    const blueprint = await this.createBlueprint(context);
    return this.generateManifestFromBlueprint(blueprint);
  }
}
