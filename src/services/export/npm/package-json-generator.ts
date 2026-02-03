/**
 * Package.json Generator
 *
 * Generates package.json with correct dependencies based on LLM provider
 *
 * SOLID: Single Responsibility - Package.json generation only
 * DRY: Centralized dependency management
 */

import type { OssaAgent } from '../../../types/index.js';

export interface PackageJsonOptions {
  scope?: string;
  additionalDeps?: Record<string, string>;
}

/**
 * Package.json Generator
 */
export class PackageJsonGenerator {
  /**
   * Generate package.json content
   */
  generate(manifest: OssaAgent, options: PackageJsonOptions = {}): string {
    const metadata = manifest.metadata || { name: 'agent', version: '1.0.0' };
    const spec = manifest.spec || {};
    const llm = (spec as any).llm || {};
    const provider = llm.provider || 'openai';

    // Sanitize package name
    const sanitizedName = this.sanitizePackageName(metadata.name);
    const packageName = options.scope ? `${options.scope}/${sanitizedName}` : sanitizedName;

    // Get dependencies based on provider
    const dependencies = this.getDependencies(provider, options.additionalDeps);

    const pkg = {
      name: packageName,
      version: metadata.version || '1.0.0',
      description: metadata.description || `OSSA agent: ${metadata.name}`,
      type: 'module',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      bin: metadata.annotations?.cli
        ? {
            [sanitizedName]: 'dist/server.js',
          }
        : undefined,
      scripts: {
        build: 'tsc',
        dev: 'tsx src/server.ts',
        start: 'node dist/server.js',
        test: 'jest',
        'test:watch': 'jest --watch',
        typecheck: 'tsc --noEmit',
        lint: 'eslint src --ext .ts',
        'lint:fix': 'eslint src --ext .ts --fix',
        format: 'prettier --write "src/**/*.ts"',
        'format:check': 'prettier --check "src/**/*.ts"',
      },
      keywords: [
        'ossa',
        'agent',
        'ai',
        'llm',
        provider,
        ...(metadata.labels ? Object.values(metadata.labels) : []),
      ],
      author: metadata.author || undefined,
      license: metadata.license || 'MIT',
      repository:
        metadata.annotations?.repository
          ? {
              type: 'git',
              url: metadata.annotations.repository as string,
            }
          : undefined,
      bugs:
        metadata.annotations?.repository
          ? {
              url: `${metadata.annotations.repository}/issues`,
            }
          : undefined,
      homepage: metadata.annotations?.homepage
        ? (metadata.annotations.homepage as string)
        : undefined,
      engines: {
        node: '>=18.0.0',
        npm: '>=9.0.0',
      },
      files: ['dist/', 'openapi.yaml', 'README.md', 'LICENSE'],
      dependencies,
      devDependencies: {
        '@types/express': '^4.17.21',
        '@types/node': '^20.10.0',
        '@typescript-eslint/eslint-plugin': '^6.15.0',
        '@typescript-eslint/parser': '^6.15.0',
        eslint: '^8.56.0',
        jest: '^29.7.0',
        '@jest/globals': '^29.7.0',
        'ts-jest': '^29.1.1',
        prettier: '^3.1.1',
        tsx: '^4.7.0',
        typescript: '^5.3.3',
      },
      publishConfig: {
        access: 'public',
      },
      ossa: {
        apiVersion: manifest.apiVersion || 'ossa/v0.4.0',
        kind: manifest.kind || 'Agent',
        originalName: metadata.name,
      },
    };

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Get dependencies based on LLM provider
   */
  private getDependencies(
    provider: string,
    additionalDeps?: Record<string, string>
  ): Record<string, string> {
    // Base dependencies (always included)
    const base: Record<string, string> = {
      express: '^4.18.2',
      yaml: '^2.3.4',
    };

    // Provider-specific dependencies
    const providerDeps: Record<string, Record<string, string>> = {
      openai: {
        openai: '^4.24.0',
      },
      anthropic: {
        '@anthropic-ai/sdk': '^0.71.0',
      },
      'google-ai': {
        '@google/generative-ai': '^0.21.0',
      },
      bedrock: {
        '@aws-sdk/client-bedrock-runtime': '^3.490.0',
      },
      azure: {
        '@azure/openai': '^1.0.0-beta.11',
      },
      mistral: {
        '@mistralai/mistralai': '^0.1.3',
      },
    };

    // Merge dependencies
    const deps = {
      ...base,
      ...(providerDeps[provider] || providerDeps.openai),
      ...additionalDeps,
    };

    return deps;
  }

  /**
   * Sanitize package name for npm
   */
  private sanitizePackageName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
}
