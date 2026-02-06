/**
 * Smoke Test: Schema Validation Coverage
 *
 * Validates that the core specification logic works across all conformance fixtures.
 * This ensures the schema validator correctly accepts valid manifests and rejects invalid ones.
 *
 * DRY Principle: Fixture discovery and validation utilities
 * Zod: Runtime validation of test results
 */

import { describe, it, expect } from '@jest/globals';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { z } from 'zod';
import { ValidationService } from '../../src/services/validation.service';
import * as yaml from 'yaml';
import { API_VERSION } from '../../../src/version.js';

const projectRoot = join(__dirname, '../..');
const conformanceRoot = join(projectRoot, 'spec/v0.3/conformance/tests');

// Zod schema for validation result
const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.any()).optional(),
  warnings: z.array(z.any()).optional(),
});

/**
 * DRY Helper: Discover all fixture files in a directory
 */
function discoverFixtures(dir: string, pattern: RegExp): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const fixtures: string[] = [];
  const walk = (currentDir: string) => {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (pattern.test(entry.name)) {
        fixtures.push(fullPath);
      }
    }
  };

  walk(dir);
  return fixtures;
}

/**
 * DRY Helper: Load and parse YAML fixture
 */
function loadFixture(path: string): any {
  const content = readFileSync(path, 'utf-8');
  return yaml.parse(content);
}

/**
 * DRY Helper: Validate manifest and return structured result
 */
async function validateManifest(
  manifest: any
): Promise<z.infer<typeof ValidationResultSchema>> {
  try {
    // Import SchemaRepository and instantiate ValidationService
    const { SchemaRepository } =
      await import('../../src/repositories/schema.repository.js');
    const schemaRepo = new SchemaRepository();
    const validationService = new ValidationService(schemaRepo);

    const result = await validationService.validate(manifest);
    const parsed = ValidationResultSchema.safeParse(result);

    if (!parsed.success) {
      console.error('Validation result parsing failed:', parsed.error.format());
      throw new Error('Invalid validation result structure');
    }

    return parsed.data;
  } catch (error) {
    throw new Error(
      `Validation threw error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

describe('Smoke Test: Schema Validation Coverage', () => {
  describe('Baseline Profile', () => {
    const validFixtures = discoverFixtures(
      join(conformanceRoot, 'baseline/valid'),
      /\.yaml$/
    );
    const invalidFixtures = discoverFixtures(
      join(conformanceRoot, 'baseline/invalid'),
      /\.yaml$/
    );

    if (validFixtures.length === 0) {
      it.skip('no baseline valid fixtures found', () => {});
    }

    validFixtures.forEach((fixturePath) => {
      const relativePath = relative(conformanceRoot, fixturePath);

      it(`validates ${relativePath} without crashing`, async () => {
        const manifest = loadFixture(fixturePath);
        const result = await validateManifest(manifest);

        // Smoke test: Just verify validation runs and returns a result
        // Full conformance validation is tested in conformance suite
        expect(result).toBeDefined();
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
      });
    });

    if (invalidFixtures.length === 0) {
      it.skip('no baseline invalid fixtures found', () => {});
    }

    invalidFixtures.forEach((fixturePath) => {
      const relativePath = relative(conformanceRoot, fixturePath);

      it(`rejects ${relativePath}`, async () => {
        const manifest = loadFixture(fixturePath);
        const result = await validateManifest(manifest);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Enterprise Profile', () => {
    const validFixtures = discoverFixtures(
      join(conformanceRoot, 'enterprise/valid'),
      /\.yaml$/
    );

    if (validFixtures.length === 0) {
      it.skip('no enterprise valid fixtures found', () => {});
    }

    validFixtures.forEach((fixturePath) => {
      const relativePath = relative(conformanceRoot, fixturePath);

      it(`validates ${relativePath} without crashing`, async () => {
        const manifest = loadFixture(fixturePath);
        const result = await validateManifest(manifest);

        // Smoke test: Just verify validation runs and returns a result
        // Full conformance validation is tested in conformance suite
        expect(result).toBeDefined();
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
      });
    });
  });

  describe('GitLab Kagent Profile', () => {
    const validFixtures = discoverFixtures(
      join(conformanceRoot, 'gitlab-kagent/valid'),
      /\.yaml$/
    );

    if (validFixtures.length === 0) {
      it.skip('no kagent valid fixtures found', () => {});
    }

    validFixtures.forEach((fixturePath) => {
      const relativePath = relative(conformanceRoot, fixturePath);

      it(`validates ${relativePath} without crashing`, async () => {
        const manifest = loadFixture(fixturePath);
        const result = await validateManifest(manifest);

        // Smoke test: Just verify validation runs and returns a result
        // Full conformance validation is tested in conformance suite
        expect(result).toBeDefined();
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
      });
    });
  });

  describe('Validation Error Quality', () => {
    it('provides specific error messages for missing required fields', async () => {
      const invalidManifest = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        // Missing metadata and spec
      };

      const result = await validateManifest(invalidManifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);

      // Check that errors are specific, not generic
      const errorMessages = result.errors!.map(
        (e: any) => e.message || e.toString()
      );
      expect(
        errorMessages.some(
          (msg) => msg.includes('metadata') || msg.includes('spec')
        )
      ).toBe(true);
    });

    it('provides specific error messages for invalid field types', async () => {
      const invalidManifest = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 123, // Should be string
          version: '1.0.0',
        },
        spec: {},
      };

      const result = await validateManifest(invalidManifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Coverage Statistics', () => {
    it('validates minimum number of fixtures', () => {
      const allFixtures = [
        ...discoverFixtures(join(conformanceRoot, 'baseline/valid'), /\.yaml$/),
        ...discoverFixtures(
          join(conformanceRoot, 'enterprise/valid'),
          /\.yaml$/
        ),
        ...discoverFixtures(
          join(conformanceRoot, 'gitlab-kagent/valid'),
          /\.yaml$/
        ),
      ];

      // Ensure we have reasonable test coverage
      expect(allFixtures.length).toBeGreaterThanOrEqual(5);

      console.log(`Tested ${allFixtures.length} conformance fixtures`);
    });
  });
});
