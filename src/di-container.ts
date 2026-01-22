/**
 * Dependency Injection Container
 * Configure and export the DI container
 */

import { Container } from 'inversify';
import 'reflect-metadata';

// Repositories
import { ManifestRepository } from './repositories/manifest.repository.js';
import { SchemaRepository } from './repositories/schema.repository.js';

// Services
import { GenerationService } from './services/generation.service.js';
import { MigrationService } from './services/migration.service.js';
import { MigrationTransformService } from './services/migration-transform.service.js';
import { LangChainMigrationService } from './services/migration/langchain-migration.service.js';
import { ValidationService } from './services/validation.service.js';
import { ValidationZodService } from './services/validation-zod.service.js';
import { VersionDetectionService } from './services/version-detection.service.js';
import { AgentsMdService } from './services/agents-md/agents-md.service.js';
import { LlmsTxtService } from './services/llms-txt/llms-txt.service.js';
import { TestRunnerService } from './services/test-runner/test-runner.service.js';
import { GitService } from './services/git.service.js';
import { GitRollbackService } from './services/git-rollback.service.js';
import { ExtensionTeamKickoffService } from './services/extension-team/extension-team-kickoff.service.js';
import { TaxonomyService } from './services/taxonomy.service.js';
import { TaxonomyValidatorService } from './services/taxonomy-validator.service.js';
import { TemplateService } from './services/template.service.js';
import { RegistryService } from './services/registry.service.js';

// Codegen Service and Generators
import { CodegenService } from './services/codegen/codegen.service.js';
import { ManifestGenerator } from './services/codegen/generators/manifest.generator.js';
import { VSCodeGenerator } from './services/codegen/generators/vscode.generator.js';
import { OpenAPIGenerator } from './services/codegen/generators/openapi.generator.js';
import { TypesGenerator } from './services/codegen/generators/types.generator.js';
import { ZodGenerator } from './services/codegen/generators/zod.generator.js';
import { OpenAPIZodGenerator } from './services/codegen/generators/openapi-zod.generator.js';

// Validators
import { DependenciesValidator } from './services/validators/dependencies.validator.js';
import { ContractValidator } from './services/validators/contract.validator.js';

// Conformance Services
import { ConformanceService } from './services/conformance/conformance.service.js';
import { ConformanceProfileLoader } from './services/conformance/profile-loader.service.js';
import { FeatureDetector } from './services/conformance/feature-detector.service.js';
import { ConformanceScoreCalculator } from './services/conformance/score-calculator.service.js';

// Registry Services
import { BundleService } from './services/registry/bundle.service.js';
import { IndexService } from './services/registry/index.service.js';

// Create container
export const container = new Container();

// Bind repositories
container.bind(SchemaRepository).toSelf().inSingletonScope();
container.bind(ManifestRepository).toSelf().inSingletonScope();

// Bind services - Use Zod-based validation (DRY, SOLID, ZOD, OPENAPI-FIRST)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
container.bind(ValidationService).to(ValidationZodService as any);
container.bind(GenerationService).toSelf();
container.bind(MigrationService).toSelf();
container.bind(MigrationTransformService).toSelf();
container.bind(LangChainMigrationService).toSelf();
container.bind(VersionDetectionService).toSelf();
container.bind(AgentsMdService).toSelf();
container.bind(LlmsTxtService).toSelf();
container.bind(TestRunnerService).toSelf();
container.bind(GitService).toSelf();
container.bind(GitRollbackService).toSelf();
container.bind(ExtensionTeamKickoffService).toSelf();
container.bind(TaxonomyService).toSelf().inSingletonScope();
container.bind(TaxonomyValidatorService).toSelf().inSingletonScope();
container.bind(TemplateService).toSelf().inSingletonScope();
container.bind(RegistryService).toSelf().inSingletonScope();

// Bind codegen generators (must be bound before CodegenService)
container.bind(ManifestGenerator).toSelf();
container.bind(VSCodeGenerator).toSelf();
container.bind(OpenAPIGenerator).toSelf();
container.bind(TypesGenerator).toSelf();
container.bind(ZodGenerator).toSelf();
container.bind(OpenAPIZodGenerator).toSelf();
container.bind(CodegenService).toSelf();

// Bind validators
container.bind(ContractValidator).toSelf();
container.bind(DependenciesValidator).toSelf();

// Bind conformance services
container.bind(ConformanceProfileLoader).toSelf().inSingletonScope();
container.bind(FeatureDetector).toSelf();
container.bind(ConformanceScoreCalculator).toSelf();
container.bind(ConformanceService).toSelf();

// Bind registry services
container.bind(BundleService).toSelf();
container.bind(IndexService).toSelf();

/**
 * Get service from container
 * @param serviceIdentifier - Service class or token
 * @returns Service instance
 */
export function getService<T>(
  serviceIdentifier: new (...args: unknown[]) => T
): T {
  return container.get<T>(serviceIdentifier);
}

/**
 * Reset container (useful for testing)
 */
export function resetContainer(): void {
  container.unbindAll();

  // Rebind all services
  container.bind(SchemaRepository).toSelf().inSingletonScope();
  container.bind(ManifestRepository).toSelf().inSingletonScope();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container.bind(ValidationService).to(ValidationZodService as any);
  container.bind(GenerationService).toSelf();
  container.bind(MigrationService).toSelf();
  container.bind(MigrationTransformService).toSelf();
  container.bind(LangChainMigrationService).toSelf();
  container.bind(VersionDetectionService).toSelf();
  container.bind(AgentsMdService).toSelf();
  container.bind(LlmsTxtService).toSelf();
  container.bind(TestRunnerService).toSelf();
  container.bind(GitService).toSelf();
  container.bind(GitRollbackService).toSelf();
  container.bind(ManifestGenerator).toSelf();
  container.bind(VSCodeGenerator).toSelf();
  container.bind(OpenAPIGenerator).toSelf();
  container.bind(TypesGenerator).toSelf();
  container.bind(ZodGenerator).toSelf();
  container.bind(OpenAPIZodGenerator).toSelf();
  container.bind(CodegenService).toSelf();
  container.bind(ContractValidator).toSelf();
  container.bind(DependenciesValidator).toSelf();
  container.bind(ConformanceProfileLoader).toSelf().inSingletonScope();
  container.bind(FeatureDetector).toSelf();
  container.bind(ConformanceScoreCalculator).toSelf();
  container.bind(ConformanceService).toSelf();
  container.bind(BundleService).toSelf();
  container.bind(IndexService).toSelf();
}
