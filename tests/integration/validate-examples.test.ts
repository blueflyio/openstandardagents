import { describe, expect, it } from '@jest/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import {
  discoverExampleFiles,
  shouldIgnoreExamplePath,
  validateManifest,
} from '../../src/tools/validation/validate-examples.js';

describe('validate-examples tool', () => {
  const rootDir = process.cwd();

  it('discovers skill manifests and keeps ignored example families out of the release gate', () => {
    const files = discoverExampleFiles().map((file) =>
      path.relative(rootDir, file)
    );

    expect(files.length).toBeGreaterThan(100);
    expect(files).toContain('examples/skills/tdd-workflow/skill.ossa.yaml');
    expect(files.some((file) => file.includes('swarm-to-ossa'))).toBe(false);
    expect(
      shouldIgnoreExamplePath(
        path.join(
          rootDir,
          'examples/migrations/swarm-to-ossa/example.ossa.yaml'
        )
      )
    ).toBe(true);
  });

  it('validates skill manifests against the skill schema', async () => {
    const skillManifest = yaml.parse(
      fs.readFileSync(
        path.join(rootDir, 'examples/skills/tdd-workflow/skill.ossa.yaml'),
        'utf8'
      )
    );

    const result = await validateManifest(skillManifest);

    expect(result.valid).toBe(true);
    expect(result.messages).toHaveLength(0);
  });
});
