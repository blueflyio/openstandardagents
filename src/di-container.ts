/**
 * Dependency Injection Container
 * Configure and export the DI container
 */

import { Container } from 'inversify';
import 'reflect-metadata';

// Repositories
import { ManifestRepository } from './repositories/manifest.repository';
import { SchemaRepository } from './repositories/schema.repository';

// Services
import { GenerationService } from './services/generation.service';
import { MigrationService } from './services/migration.service';
import { ValidationService } from './services/validation.service';

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
export function getService<T>(serviceIdentifier: new (...args: any[]) => T): T {
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
