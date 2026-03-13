import { describe, expect, it, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationService } from '../../src/services/validation.service.js';
import { ManifestRepository } from '../../src/repositories/manifest.repository.js';
import { SchemaRepository } from '../../src/repositories/schema.repository.js';
import type { SchemaVersion } from '../../src/types/index.js';
import { API_VERSION, SPEC_PATH, VERSION } from '../../src/version.js';

describe('Release surface', () => {
  const rootDir = process.cwd();
  const gettingStartedDir = path.join(rootDir, 'examples/getting-started');
  const schemaRepo = new SchemaRepository();
  const validationService = new ValidationService(schemaRepo);
  const manifestRepo = new ManifestRepository();
  let currentSchemaVersion: SchemaVersion;

  beforeAll(() => {
    currentSchemaVersion = schemaRepo.getCurrentVersion() as SchemaVersion;
  });

  it('keeps getting-started manifests on the current apiVersion', () => {
    const manifestFiles = fs
      .readdirSync(gettingStartedDir)
      .filter((file) => file.endsWith('.ossa.yaml'))
      .sort();

    expect(manifestFiles.length).toBeGreaterThan(0);

    for (const file of manifestFiles) {
      const content = fs.readFileSync(
        path.join(gettingStartedDir, file),
        'utf8'
      );
      expect(content).toContain(`apiVersion: ${API_VERSION}`);
    }
  });

  it('validates every getting-started manifest against the current schema', async () => {
    const manifestFiles = fs
      .readdirSync(gettingStartedDir)
      .filter((file) => file.endsWith('.ossa.yaml'))
      .sort();

    for (const file of manifestFiles) {
      const fullPath = path.join(gettingStartedDir, file);
      const manifest = await manifestRepo.load(fullPath);
      const result = await validationService.validate(
        manifest,
        currentSchemaVersion
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it('keeps release-facing docs aligned with the current release', () => {
    const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
    const llms = fs.readFileSync(path.join(rootDir, 'llms.txt'), 'utf8');
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
    ) as {
      exports?: Record<string, string>;
    };
    const gettingStartedReadme = fs.readFileSync(
      path.join(gettingStartedDir, 'README.md'),
      'utf8'
    );

    expect(readme).toContain(`## What's New in v${VERSION}`);
    expect(readme).toContain(`ossa migrate agent.ossa.yaml --to ${VERSION}`);
    expect(readme).toContain(`apiVersion: ${API_VERSION}`);
    expect(readme).toContain(`[JSON Schema](./${SPEC_PATH}/agent.schema.json)`);
    expect(readme).not.toContain('ossa migrate agent.ossa.yaml --to 0.4.6');
    expect(readme).not.toContain('apiVersion: ossa/v0.4.6');
    expect(readme).not.toContain('## Production Status (v0.4.6)');

    expect(packageJson.exports?.['./schema']).toBe(`./${SPEC_PATH}/agent.schema.json`);
    expect(packageJson.exports?.['./agent-card-schema']).toBe(
      `./${SPEC_PATH}/agent-card.schema.json`
    );

    expect(llms).toContain(`ossa migrate agent.yaml --to ${VERSION}`);
    expect(llms).toContain(`apiVersion: ${API_VERSION}`);
    expect(llms).toContain(`Spec: v${VERSION}`);
    expect(llms).not.toContain('ossa/v0.4');
    expect(llms).not.toContain('Vitest');
    expect(llms).not.toContain('0.4.6');

    expect(gettingStartedReadme).toContain(
      'npm install -g @bluefly/openstandardagents'
    );
    expect(gettingStartedReadme).toContain('--platform langchain');
    expect(gettingStartedReadme).toContain(
      `[Schema Reference](../../${SPEC_PATH}/agent.schema.json)`
    );
    expect(gettingStartedReadme).not.toContain('@bluefly/ossa-cli');
    expect(gettingStartedReadme).not.toContain('--format langchain');
    expect(gettingStartedReadme).not.toContain('spec/v0.3.0');
  });
});
