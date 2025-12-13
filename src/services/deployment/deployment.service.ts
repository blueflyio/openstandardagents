/**
 * OSSA Deployment Service
 * Manages agent deployments across environments
 */

import type { OssaAgent } from '../../types/index.js';

export interface EnvironmentDeployment {
  version: string;
  deployedAt: string;
  deployedBy: string;
  status: 'deployed' | 'healthy' | 'degraded' | 'failed';
  endpoint?: string;
}

export class DeploymentService {
  async deploy(
    manifest: OssaAgent,
    manifestPath: string,
    environment: string,
    version?: string
  ): Promise<void> {
    if (!manifest.metadata || !manifest.spec) {
      throw new Error('Invalid manifest: missing metadata or spec');
    }
    const deployVersion = version || manifest.metadata.version || '1.0.0';

    if (!manifest.spec.environments) {
      manifest.spec.environments = {};
    }

    manifest.spec.environments[environment] = {
      version: deployVersion,
      deployedAt: new Date().toISOString(),
      deployedBy: process.env.USER || process.env.CI_COMMIT_AUTHOR || 'unknown',
      status: 'deployed',
    };

    const { ManifestRepository } = await import(
      '../../repositories/manifest.repository.js'
    );
    const repo = new ManifestRepository();
    await repo.save(manifestPath, manifest);
  }

  async promote(
    manifest: OssaAgent,
    manifestPath: string,
    fromEnv: string,
    toEnv: string
  ): Promise<void> {
    if (!manifest.spec) {
      throw new Error('Invalid manifest: missing spec');
    }
    if (!manifest.spec.environments?.[fromEnv]) {
      throw new Error(`Agent not deployed to ${fromEnv}`);
    }

    const source = manifest.spec.environments[fromEnv];

    if (!manifest.spec.environments) {
      manifest.spec.environments = {};
    }

    manifest.spec.environments[toEnv] = {
      ...source,
      deployedAt: new Date().toISOString(),
      deployedBy: process.env.USER || process.env.CI_COMMIT_AUTHOR || 'unknown',
      status: 'deployed',
    };

    const { ManifestRepository } = await import(
      '../../repositories/manifest.repository.js'
    );
    const repo = new ManifestRepository();
    await repo.save(manifestPath, manifest);
  }

  getStatus(
    manifest: OssaAgent,
    environment?: string
  ): Record<string, EnvironmentDeployment> | EnvironmentDeployment {
    if (!manifest.spec) {
      throw new Error('Invalid manifest: missing spec');
    }
    const environments = manifest.spec.environments || {};

    if (environment) {
      const env = environments[environment];
      if (!env) {
        throw new Error(`Not deployed to ${environment}`);
      }
      return env as EnvironmentDeployment;
    }

    return environments as Record<string, EnvironmentDeployment>;
  }

  async retire(
    manifest: OssaAgent,
    manifestPath: string,
    effectiveDate: string,
    replacement?: string
  ): Promise<void> {
    if (!manifest.metadata) {
      throw new Error('Invalid manifest: missing metadata');
    }
    if (!manifest.metadata.lifecycle) {
      manifest.metadata.lifecycle = {
        state: 'active',
        maturity: 'alpha',
      };
    }

    manifest.metadata.lifecycle.state = 'retired';

    if (effectiveDate) {
      if (!manifest.metadata.lifecycle.deprecation) {
        manifest.metadata.lifecycle.deprecation = {};
      }
      manifest.metadata.lifecycle.deprecation.sunsetDate = effectiveDate;
    }

    if (replacement) {
      if (!manifest.metadata.lifecycle.deprecation) {
        manifest.metadata.lifecycle.deprecation = {};
      }
      manifest.metadata.lifecycle.deprecation.replacement = replacement;
    }

    const { ManifestRepository } = await import(
      '../../repositories/manifest.repository.js'
    );
    const repo = new ManifestRepository();
    await repo.save(manifestPath, manifest);
  }
}
