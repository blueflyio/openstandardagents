/**
 * Dependency Injection Container
 * Configure and export the DI container
 */

import { Container, type Newable } from 'inversify';
import 'reflect-metadata';

// Repositories
import { ManifestRepository } from './repositories/manifest.repository.js';
import { SchemaRepository } from './repositories/schema.repository.js';

// Services
import { AgentTypeDetectorService } from './services/agent-type-detector.service.js';
import { AgentsMdApiService } from './services/agents-md/agents-md-api.service.js';
import { AgentsMdDiscoveryService } from './services/agents-md/agents-md-discovery.service.js';
import { AgentsMdService } from './services/agents-md/agents-md.service.js';
import { RepoAgentsMdService } from './services/agents-md/repo-agents-md.service.js';
import { AIArchitectService } from './services/ai-architect.service.js';
import { ExtensionTeamKickoffService } from './services/extension-team/extension-team-kickoff.service.js';
import { GenerationService } from './services/generation.service.js';
import { GitRollbackService } from './services/git-rollback.service.js';
import { GitService } from './services/git.service.js';
import { KnowledgeService } from './services/knowledge.service.js';
import { LlmsTxtService } from './services/llms-txt/llms-txt.service.js';
import { ManifestCrudService } from './services/manifest/manifest-crud.service.js';
import { McpBridgeService } from './services/mcp/bridge.service.js';
import { MigrationTransformService } from './services/migration-transform.service.js';
import { MigrationService } from './services/migration.service.js';
import { LangChainMigrationService } from './services/migration/langchain-migration.service.js';
import { RegistryService } from './services/registry.service.js';
import { TaxonomyValidatorService } from './services/taxonomy-validator.service.js';
import { TaxonomyService } from './services/taxonomy.service.js';
import { TemplateProcessorService } from './services/template-processor.service.js';
import { TemplateService } from './services/template.service.js';
import { TestRunnerService } from './services/test-runner/test-runner.service.js';
import { ValidationZodService } from './services/validation-zod.service.js';
import { ValidationService } from './services/validation.service.js';
import { VersionDetectionService } from './services/version-detection.service.js';
import { WizardService } from './services/wizard/wizard.service.js';
import { WorkspaceService } from './services/workspace/workspace.service.js';
// Codegen Service and Generators
import { CodegenService } from './services/codegen/codegen.service.js';
import { ManifestGenerator } from './services/codegen/generators/manifest.generator.js';
import { OpenAPIZodGenerator } from './services/codegen/generators/openapi-zod.generator.js';
import { OpenAPIGenerator } from './services/codegen/generators/openapi.generator.js';
import { TypesGenerator } from './services/codegen/generators/types.generator.js';
import { VSCodeGenerator } from './services/codegen/generators/vscode.generator.js';
import { ZodGenerator } from './services/codegen/generators/zod.generator.js';

// Validators
import { ContractValidator } from './services/validators/contract.validator.js';
import { DependenciesValidator } from './services/validators/dependencies.validator.js';

// Conformance Services
import { ConformanceService } from './services/conformance/conformance.service.js';
import { FeatureDetector } from './services/conformance/feature-detector.service.js';
import { ConformanceProfileLoader } from './services/conformance/profile-loader.service.js';
import { ConformanceScoreCalculator } from './services/conformance/score-calculator.service.js';

// Registry Services
import { BundleService } from './services/registry/bundle.service.js';
import { IndexService } from './services/registry/index.service.js';

// Skills Pipeline Services
import {
    SkillsExportService,
    SkillsGeneratorService,
    SkillsInstallService,
    SkillsResearchService,
} from './services/skills-pipeline/index.js';

// DI Type Identifiers
export const TYPES = {
  ManifestRepository: Symbol.for('ManifestRepository'),
  SchemaRepository: Symbol.for('SchemaRepository'),
  AgentTypeDetectorService: Symbol.for('AgentTypeDetectorService'),
};

// Create container
export const container = new Container();

// Bind repositories
container.bind(SchemaRepository).toSelf().inSingletonScope();
container.bind(ManifestRepository).toSelf().inSingletonScope();
container.bind(TYPES.ManifestRepository).to(ManifestRepository);

// Bind validation: ValidationZodService is the single validation implementation.
// Both classes implement IValidationService. The Newable cast is required because
// Inversify's .to() expects a subclass of the bound type, but ValidationZodService
// is a sibling implementation, not a subclass.
container
  .bind(ValidationService)
  .to(ValidationZodService as unknown as Newable<ValidationService>);
container.bind(GenerationService).toSelf();
container.bind(MigrationService).toSelf();
container.bind(MigrationTransformService).toSelf();
container.bind(LangChainMigrationService).toSelf();
container.bind(VersionDetectionService).toSelf();
container.bind(AgentsMdService).toSelf();
container.bind(AgentsMdApiService).toSelf();
container.bind(AgentsMdDiscoveryService).toSelf();
container.bind(RepoAgentsMdService).toSelf().inSingletonScope();
container.bind(TemplateProcessorService).toSelf().inSingletonScope();
container.bind(LlmsTxtService).toSelf();
container.bind(TestRunnerService).toSelf();
container.bind(GitService).toSelf();
container.bind(GitRollbackService).toSelf();
container.bind(AIArchitectService).toSelf();
container.bind(ExtensionTeamKickoffService).toSelf();
container.bind(TaxonomyService).toSelf().inSingletonScope();
container.bind(KnowledgeService).toSelf();
container.bind(TaxonomyValidatorService).toSelf().inSingletonScope();
container.bind(TemplateService).toSelf().inSingletonScope();
container.bind(RegistryService).toSelf().inSingletonScope();
container.bind(WizardService).toSelf();
container.bind(AgentTypeDetectorService).toSelf();
container.bind(TYPES.AgentTypeDetectorService).to(AgentTypeDetectorService);
container.bind(ManifestCrudService).toSelf();
container.bind(WorkspaceService).toSelf();
container.bind(McpBridgeService).toSelf();

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

// Bind skills pipeline services
container.bind(SkillsResearchService).toSelf();
container.bind(SkillsGeneratorService).toSelf();
container.bind(SkillsExportService).toSelf();
container.bind(SkillsInstallService).toSelf();

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
  container
    .bind(ValidationService)
    .to(ValidationZodService as unknown as Newable<ValidationService>);
  container.bind(GenerationService).toSelf();
  container.bind(MigrationService).toSelf();
  container.bind(MigrationTransformService).toSelf();
  container.bind(LangChainMigrationService).toSelf();
  container.bind(VersionDetectionService).toSelf();
  container.bind(AgentsMdService).toSelf();
  container.bind(AgentsMdApiService).toSelf();
  container.bind(AgentsMdDiscoveryService).toSelf();
  container.bind(LlmsTxtService).toSelf();
  container.bind(TestRunnerService).toSelf();
  container.bind(GitService).toSelf();
  container.bind(GitRollbackService).toSelf();
  container.bind(ManifestCrudService).toSelf();
  container.bind(WorkspaceService).toSelf();
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
  container.bind(SkillsResearchService).toSelf();
  container.bind(SkillsGeneratorService).toSelf();
  container.bind(SkillsExportService).toSelf();
  container.bind(SkillsInstallService).toSelf();
}
