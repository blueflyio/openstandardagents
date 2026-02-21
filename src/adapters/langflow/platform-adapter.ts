/**
 * LangFlow Platform Adapter
 *
 * Exports OSSA agent manifests to LangFlow flow JSON (visual flow format).
 * First-class platform in the OSSA export registry; CI can export to LangFlow
 * and publish flow artifacts for import into LangFlow UI or API.
 *
 * SOLID: Single Responsibility - LangFlow export only
 * DRY: Reuses LangflowAdapter for conversion
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ExportFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import { LangflowAdapter } from '../langflow-adapter.js';

export class LangflowPlatformAdapter extends BaseAdapter {
  readonly platform = 'langflow';
  readonly displayName = 'LangFlow';
  readonly description =
    'LangFlow visual flow builder (flow JSON for import at langflow.blueflyagents.com or localhost:7860)';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v0.3.6', 'v0.4', 'v{{VERSION}}'];

  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      const flowJson = LangflowAdapter.toJSON(manifest);
      const baseName = (manifest.metadata?.name || 'agent').replace(
        /[^a-z0-9-_]/gi,
        '-'
      );
      const fileName = `${baseName}-langflow.json`;

      const files: ExportFile[] = [
        this.createFile(fileName, flowJson, 'config', 'json'),
      ];

      if (options?.outputDir) {
        // Single file; path is relative to outputDir in orchestrator
      }

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '1.0',
      });
    } catch (err) {
      return this.createResult(
        false,
        [],
        err instanceof Error ? err.message : String(err),
        { duration: Date.now() - startTime }
      );
    }
  }

  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const base = await super.validate(manifest);
    if (!base.valid) return base;

    const errors: ValidationError[] = [...(base.errors ?? [])];
    const warnings: ValidationWarning[] = [...(base.warnings ?? [])];

    const specAny = manifest.spec as Record<string, unknown> | undefined;
    const hasPrompt =
      manifest.spec?.role ||
      (specAny?.prompts && typeof specAny.prompts === 'object' && (specAny.prompts as Record<string, unknown>)?.system);
    if (!hasPrompt) {
      warnings.push({
        message: 'spec.role or spec.prompts.system.template recommended for LangFlow prompt node',
        path: 'spec.role',
        suggestion: 'Add a system prompt for the agent',
        code: 'LANGFLOW_PROMPT_RECOMMENDED',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: {
        name: 'langflow-example-agent',
        version: '1.0.0',
        description: 'Example agent for LangFlow visual flow export',
      },
      spec: {
        role: 'You are a helpful AI assistant. Answer concisely.',
        llm: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 2000,
        },
        tools: [
          {
            type: 'mcp',
            name: 'search',
            description: 'Search the web',
            server: 'mcp-default',
          },
        ],
      },
    };
  }
}
