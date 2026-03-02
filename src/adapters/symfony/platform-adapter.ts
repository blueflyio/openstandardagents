/**
 * Symfony AI Agent Export Adapter
 *
 * Exports OSSA agent manifests to PHP bootstrap for symfony/ai-agent:
 * Platform + Model + system message + Toolbox from manifest.
 * See: https://symfony.com/doc/current/ai/components/agent.html
 *
 * Generated: composer.json, agent_bootstrap.php, README.md, agent.ossa.yaml.
 */

import * as yaml from 'yaml';
import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ExportFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ConfigResult,
} from '../base/adapter.interface.js';

function sanitizeName(name: string): string {
  return (
    name.replace(/[^a-z0-9_]/gi, '_').replace(/^_+|_+$/g, '') || 'ossa_agent'
  );
}

function escapePhpString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

export class SymfonyAiPlatformAdapter extends BaseAdapter {
  readonly platform = 'symfony';
  readonly displayName = 'Symfony AI Agent';
  readonly description =
    'PHP bootstrap for symfony/ai-agent (Platform + Model + Toolbox from OSSA)';
  readonly status = 'alpha' as const;
  readonly supportedVersions = ['v0.4.x'];

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

      const name = sanitizeName(manifest.metadata?.name || 'agent');
      const files: ExportFile[] = [];

      files.push(
        this.createFile(
          `${name}/composer.json`,
          this.generateComposerJson(manifest),
          'config',
          'json'
        )
      );
      files.push(
        this.createFile(
          `${name}/agent_bootstrap.php`,
          this.generateBootstrapPhp(manifest),
          'code',
          'php'
        )
      );
      files.push(
        this.createFile(
          `${name}/README.md`,
          this.generateReadme(manifest, name),
          'documentation'
        )
      );
      files.push(
        this.createFile(
          `${name}/agent.ossa.yaml`,
          yaml.stringify(manifest),
          'config',
          'yaml'
        )
      );

      // Generate #[AsTool] stub classes for each tool
      const toolStubs = this.generateToolStubs(manifest);
      files.push(...toolStubs);

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

  private generateComposerJson(manifest: OssaAgent): string {
    const name = sanitizeName(manifest.metadata?.name || 'agent');
    return JSON.stringify(
      {
        name: `ossa/${name}`,
        description:
          manifest.metadata?.description || `OSSA agent ${name} (Symfony AI)`,
        type: 'project',
        require: {
          php: '>=8.2',
          'symfony/ai-agent': '*',
          'symfony/ai-platform': '*',
        },
        autoload: {
          files: ['agent_bootstrap.php'],
        },
      },
      null,
      2
    );
  }

  private generateBootstrapPhp(manifest: OssaAgent): string {
    const name = sanitizeName(manifest.metadata?.name || 'agent');
    const spec = manifest.spec as Record<string, unknown> | undefined;
    const prompts = spec?.prompts as Record<string, unknown> | undefined;
    const role =
      manifest.spec?.role ||
      (prompts?.system ? String(prompts.system) : undefined) ||
      'You are a helpful assistant.';
    const systemMessage = escapePhpString(role);

    const llm = manifest.spec?.llm as
      | {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
        }
      | undefined;
    const provider = llm?.provider || 'openai';
    const model = llm?.model || 'gpt-4o-mini';
    const temperature = llm?.temperature ?? 0.7;
    const maxTokens = llm?.maxTokens ?? 4096;

    const tools =
      (manifest.spec?.tools as Array<{
        name?: string;
        description?: string;
      }>) || [];
    const toolNames = tools
      .map((t) => t.name || 'unknown')
      .filter((n) => n !== 'unknown');

    return `<?php

declare(strict_types=1);

/**
 * OSSA Agent bootstrap for Symfony AI Agent
 * Generated from manifest: ${manifest.metadata?.name || name} v${manifest.metadata?.version || '1.0.0'}
 *
 * Requires: composer require symfony/ai-agent symfony/ai-platform
 * Usage: see README.md
 */

use Symfony\\Component\\Ai\\Agent\\Agent;
use Symfony\\Component\\Ai\\Agent\\Toolbox;
use Symfony\\Component\\Ai\\Agent\\InputProcessor\\AgentProcessor;
use Symfony\\Component\\Ai\\Platform\\PlatformFactory;
use Symfony\\Component\\Ai\\Platform\\Model\\Model;
use Symfony\\Component\\Ai\\Message\\MessageBag;
use Symfony\\Component\\Ai\\Message\\Message;

(function () {
    $platform = PlatformFactory::create('${escapePhpString(provider)}');
    $model = new Model('${escapePhpString(model)}', options: [
        'temperature' => ${temperature},
        'max_tokens' => ${maxTokens},
    ]);

    $systemMessage = '${systemMessage}';
    $messageBag = new MessageBag();
    $messageBag->add(Message::forSystem($systemMessage));

    ${
      toolNames.length
        ? `$toolbox = new Toolbox([
        ${toolNames
          .map((n) => {
            const cls =
              n
                .split(/[-_ ]+/)
                .map(
                  (w: string) =>
                    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                )
                .join('') + 'Tool';
            return `new \\App\\Agent\\Tool\\${cls}(),`;
          })
          .join('\n        ')}
    ]);`
        : `$toolbox = new Toolbox([]);
    // Add your #[AsTool] classes: $toolbox = new Toolbox([new MyTool(), ...]);`
    }

    $agent = new Agent(
        platform: $platform,
        model: $model,
        inputProcessors: [new AgentProcessor($toolbox)],
        outputProcessors: [],
        messageBag: $messageBag
    );

    return $agent;
})();
`;
  }

  private generateReadme(manifest: OssaAgent, name: string): string {
    const desc =
      manifest.metadata?.description || 'OSSA agent exported for Symfony AI';
    return `# ${name}

${desc}

Generated from OSSA manifest (agent.ossa.yaml). Runs with Symfony AI Agent.

## Requirements

- PHP 8.2+
- Composer
- API key for the LLM provider (e.g. OPENAI_API_KEY, ANTHROPIC_API_KEY)

## Install

\`\`\`bash
composer install
\`\`\`

Set your provider API key in the environment before running.

## Run

Bootstrap returns an Agent instance. Use it in your Symfony app or a small runner:

\`\`\`php
$agent = require 'agent_bootstrap.php';
$response = $agent->run('Hello');
\`\`\`

## Customize

- Edit \`agent_bootstrap.php\` to add tools (Toolbox with #[AsTool] classes).
- Re-export from OSSA with: \`ossa export manifest.ossa.yaml --platform symfony -o .\`

## Docs

- [Symfony AI Agent](https://symfony.com/doc/current/ai/components/agent.html)
- [OSSA](https://openstandardagents.org)
`;
  }

  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const base = await super.validate(manifest);
    if (!base.valid) return base;

    const errors: ValidationError[] = [...(base.errors ?? [])];
    const warnings: ValidationWarning[] = [...(base.warnings ?? [])];

    if (
      !manifest.spec?.role &&
      !(manifest.spec as Record<string, unknown>)?.prompts
    ) {
      warnings.push({
        message:
          'spec.role or spec.prompts.system recommended for Symfony system message',
        path: 'spec.role',
        suggestion: 'Add a system prompt',
        code: 'SYMFONY_PROMPT_RECOMMENDED',
      });
    }

    const llm = manifest.spec?.llm as { provider?: string } | undefined;
    const provider = llm?.provider;
    const supportedProviders = [
      'openai',
      'anthropic',
      'google',
      'mistral',
      'ollama',
    ];
    if (provider && !supportedProviders.includes(provider)) {
      warnings.push({
        message: `LLM provider "${provider}" may not be supported by Symfony AI`,
        path: 'spec.llm.provider',
        suggestion: `Use one of: ${supportedProviders.join(', ')}`,
        code: 'SYMFONY_UNSUPPORTED_PROVIDER',
      });
    }

    const tools =
      (manifest.spec?.tools as Array<{
        name?: string;
        description?: string;
      }>) || [];
    for (let i = 0; i < tools.length; i++) {
      if (!tools[i].description) {
        warnings.push({
          message: `Tool "${tools[i].name}" missing description (used for #[AsTool] attribute)`,
          path: `spec.tools[${i}].description`,
          suggestion:
            'Add a description for better Symfony AI tool documentation',
          code: 'SYMFONY_TOOL_DESCRIPTION',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    const llm = manifest.spec?.llm as
      | {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
        }
      | undefined;
    const tools =
      (manifest.spec?.tools as Array<{
        name?: string;
        description?: string;
      }>) || [];

    return {
      config: {
        platform: llm?.provider || 'openai',
        model: llm?.model || 'gpt-4o-mini',
        temperature: llm?.temperature ?? 0.7,
        max_tokens: llm?.maxTokens ?? 4096,
        system_message: manifest.spec?.role || '',
        tools: tools.map((t) => ({ name: t.name, description: t.description })),
        metadata: {
          ossa_name: manifest.metadata?.name,
          ossa_version: manifest.metadata?.version,
          api_version: manifest.apiVersion,
        },
      },
      filename: `${sanitizeName(manifest.metadata?.name || 'agent')}.symfony.json`,
    };
  }

  /**
   * Generate PHP stub classes for each tool in spec.tools.
   * Each stub uses the Symfony #[AsTool] attribute.
   */
  generateToolStubs(manifest: OssaAgent): ExportFile[] {
    const tools =
      (manifest.spec?.tools as Array<{
        name?: string;
        description?: string;
      }>) || [];
    const name = sanitizeName(manifest.metadata?.name || 'agent');

    return tools
      .filter((t) => t.name)
      .map((tool) => {
        const className =
          tool
            .name!.split(/[-_ ]+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('') + 'Tool';

        const desc = escapePhpString(tool.description || tool.name || '');

        const content = `<?php

declare(strict_types=1);

namespace App\\Agent\\Tool;

use Symfony\\Component\\Ai\\Agent\\Toolbox\\Attribute\\AsTool;

#[AsTool(name: '${escapePhpString(tool.name!)}', description: '${desc}')]
final class ${className}
{
    /**
     * @param string $input The input for this tool
     * @return string The tool result
     */
    public function __invoke(string $input): string
    {
        // TODO: Implement ${tool.name} tool logic
        return '';
    }
}
`;
        return this.createFile(
          `${name}/src/Tool/${className}.php`,
          content,
          'code',
          'php'
        );
      });
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: {
        name: 'example-symfony-agent',
        version: '1.0.0',
        description: 'Example agent for Symfony AI',
      },
      spec: {
        role: 'You are a helpful PHP assistant.',
        llm: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 4096,
        },
      },
    };
  }
}
