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
import { ValidationService } from './services/validation.service.js';

// Create container
export const container = new Container();

// Bind repositories
container.bind(SchemaRepository).toSelf().inSingletonScope();
container.bind(ManifestRepository).toSelf().inSingletonScope();

// Bind services
container.bind(ValidationService).toSelf();
container.bind(GenerationService).toSelf();
container.bind(MigrationService).toSelf();

/**
 * Get service from container
 * @param serviceIdentifier - Service class or token
 * @returns Service instance
 */
export function getService<T>(serviceIdentifier: new (...args: unknown[]) => T): T {
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
  container.bind(ValidationService).toSelf();
  container.bind(GenerationService).toSelf();
  container.bind(MigrationService).toSelf();
}
