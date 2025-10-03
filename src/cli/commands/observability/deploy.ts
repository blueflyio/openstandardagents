/**
 * OSSA CLI - Deploy Observability Enhancements
 *
 * Replaces messy bash scripts with clean OpenAPI-driven CLI
 *
 * @command ossa observability deploy
 * @module cli/commands/observability/deploy
 */

import { Command } from 'commander';
import { OpenAPIClient } from '../../core/openapi-client.js';
import { logger } from '../../utils/logger.js';
import { spinner } from '../../utils/spinner.js';

interface DeployConfig {
  target: 'agent-tracer' | 'agent-ops' | 'all';
  environment: 'docker' | 'kubernetes' | 'auto';
  dryRun?: boolean;
  skipBackup?: boolean;
}

interface DeploymentResult {
  success: boolean;
  services: string[];
  errors: string[];
  warnings: string[];
  nextSteps: string[];
}

export class ObservabilityDeployCommand {
  private client: OpenAPIClient;

  constructor() {
    this.client = new OpenAPIClient({
      baseURL: process.env.OSSA_API_URL || 'http://localhost:8080',
      apiVersion: 'v1'
    });
  }

  /**
   * Main deployment orchestration
   */
  async deploy(config: DeployConfig): Promise<DeploymentResult> {
    logger.info('🚀 Starting observability deployment');

    const result: DeploymentResult = {
      success: true,
      services: [],
      errors: [],
      warnings: [],
      nextSteps: []
    };

    try {
      // Step 1: Detect infrastructure
      const infra = await this.detectInfrastructure(config.environment);
      logger.info(`✅ Detected infrastructure: ${infra.type}`);

      // Step 2: Validate prerequisites
      await this.validatePrerequisites(infra);

      // Step 3: Deploy ClickHouse schema
      if (config.target === 'agent-tracer' || config.target === 'all') {
        await this.deployClickHouseSchema(infra, config.dryRun);
        result.services.push('clickhouse-schema');
      }

      // Step 4: Deploy TypeScript services
      await this.deployServices(config.target, config.dryRun);
      result.services.push('typescript-services');

      // Step 5: Update API routes
      await this.updateAPIRoutes(config.target, config.dryRun);
      result.services.push('api-routes');

      // Step 6: Restart services
      if (!config.dryRun) {
        await this.restartServices(infra, config.target);
      }

      result.nextSteps = this.generateNextSteps(config.target);
    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      logger.error(`❌ Deployment failed: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Detect infrastructure using OpenAPI
   */
  private async detectInfrastructure(env: string) {
    const spin = spinner('Detecting infrastructure...');
    spin.start();

    try {
      const response = await this.client.get('/infrastructure/detect', {
        params: { environment: env }
      });

      spin.succeed('Infrastructure detected');
      return response.data;
    } catch (error) {
      spin.fail('Failed to detect infrastructure');
      throw error;
    }
  }

  /**
   * Validate prerequisites using OpenAPI
   */
  private async validatePrerequisites(infra: any) {
    const spin = spinner('Validating prerequisites...');
    spin.start();

    const response = await this.client.post('/deployment/validate', {
      infrastructure: infra.type,
      services: ['clickhouse', 'postgres', 'redis']
    });

    if (!response.data.valid) {
      spin.fail('Prerequisites validation failed');
      throw new Error(`Missing: ${response.data.missing.join(', ')}`);
    }

    spin.succeed('Prerequisites validated');
  }

  /**
   * Deploy ClickHouse schema using OpenAPI
   */
  private async deployClickHouseSchema(infra: any, dryRun?: boolean) {
    const spin = spinner('Deploying ClickHouse schema...');
    spin.start();

    try {
      const response = await this.client.post('/database/schema/deploy', {
        database: 'clickhouse',
        schema_file: 'rag-metrics-extension.sql',
        infrastructure: infra.type,
        dry_run: dryRun
      });

      if (dryRun) {
        spin.info('Dry run: Schema would be applied');
        logger.info(response.data.preview);
      } else {
        spin.succeed('ClickHouse schema deployed');
      }
    } catch (error) {
      spin.fail('Schema deployment failed');
      throw error;
    }
  }

  /**
   * Deploy TypeScript services using OpenAPI
   */
  private async deployServices(target: string, dryRun?: boolean) {
    const spin = spinner('Deploying TypeScript services...');
    spin.start();

    const services = this.getServicesForTarget(target);

    try {
      for (const service of services) {
        await this.client.post('/services/deploy', {
          service_name: service,
          dry_run: dryRun
        });
      }

      spin.succeed(`Deployed ${services.length} services`);
    } catch (error) {
      spin.fail('Service deployment failed');
      throw error;
    }
  }

  /**
   * Update API routes using OpenAPI
   */
  private async updateAPIRoutes(target: string, dryRun?: boolean) {
    const spin = spinner('Updating API routes...');
    spin.start();

    try {
      await this.client.post('/api/routes/update', {
        target,
        routes: ['/api/v1/evaluation/rag', '/api/v1/experiments', '/api/v1/experiments/:id/runs'],
        dry_run: dryRun
      });

      spin.succeed('API routes updated');
    } catch (error) {
      spin.fail('Route update failed');
      throw error;
    }
  }

  /**
   * Restart services using OpenAPI
   */
  private async restartServices(infra: any, target: string) {
    const spin = spinner('Restarting services...');
    spin.start();

    try {
      await this.client.post('/services/restart', {
        infrastructure: infra.type,
        services: this.getServicesForTarget(target)
      });

      spin.succeed('Services restarted');
    } catch (error) {
      spin.warn('Service restart failed (non-critical)');
    }
  }

  /**
   * Get services for deployment target
   */
  private getServicesForTarget(target: string): string[] {
    const serviceMap: Record<string, string[]> = {
      'agent-tracer': ['rag-evaluator', 'llm-assertions', 'experiment-tracker'],
      'agent-ops': ['ops-dashboard', 'deployment-manager'],
      all: ['rag-evaluator', 'llm-assertions', 'experiment-tracker', 'ops-dashboard', 'deployment-manager']
    };

    return serviceMap[target] || [];
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(target: string): string[] {
    return [
      '1. Review deployment logs',
      '2. Verify services are healthy',
      `3. Test ${target} endpoints`,
      '4. Update documentation',
      '5. Create first experiment'
    ];
  }
}

/**
 * Register CLI command
 */
export function registerCommand(program: Command) {
  const cmd = program
    .command('observability:deploy')
    .description('Deploy observability enhancements using OpenAPI')
    .option('-t, --target <target>', 'Deployment target', 'agent-tracer')
    .option('-e, --environment <env>', 'Infrastructure environment', 'auto')
    .option('--dry-run', 'Preview deployment without applying changes')
    .option('--skip-backup', 'Skip backup step')
    .action(async (options) => {
      const deployer = new ObservabilityDeployCommand();

      const config: DeployConfig = {
        target: options.target,
        environment: options.environment,
        dryRun: options.dryRun,
        skipBackup: options.skipBackup
      };

      const result = await deployer.deploy(config);

      if (result.success) {
        logger.success('\n✅ Deployment completed successfully!');
        logger.info('\n📋 Next Steps:');
        result.nextSteps.forEach((step, i) => {
          logger.info(`  ${i + 1}. ${step}`);
        });
      } else {
        logger.error('\n❌ Deployment failed');
        logger.error('\n🔥 Errors:');
        result.errors.forEach((error) => logger.error(`  - ${error}`));
        process.exit(1);
      }
    });

  return cmd;
}

export default { ObservabilityDeployCommand, registerCommand };
