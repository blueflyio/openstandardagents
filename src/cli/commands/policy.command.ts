/**
 * OSSA Policy Command — Cedar policy validation for OSSA manifests
 *
 * Usage:
 *   ossa policy validate <manifest>
 *   ossa policy validate agent.ossa.yaml
 *   ossa policy validate agent.ossa.json --verbose
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

import { validateManifestCedarPolicies } from '../../services/governance/cedar-validator.service.js';

const validateSubcommand = new Command('validate')
  .description(
    'Validate Cedar policies embedded in an OSSA manifest (extensions.security.cedar)',
  )
  .argument('<manifest>', 'Path to the OSSA manifest file (.yaml or .json)')
  .option('-v, --verbose', 'Show detailed validation output')
  .action(async (manifestPath: string, options) => {
    const fullPath = path.resolve(process.cwd(), manifestPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`Error: Manifest file not found at ${fullPath}`);
      process.exit(1);
    }

    const isJson = fullPath.endsWith('.json');
    const content = fs.readFileSync(fullPath, 'utf-8');

    let manifest: Record<string, unknown>;
    try {
      manifest = isJson
        ? JSON.parse(content)
        : (yaml.load(content) as Record<string, unknown>);
    } catch (e: unknown) {
      console.error(
        `Error parsing manifest: ${e instanceof Error ? e.message : 'Unknown error'}`,
      );
      process.exit(1);
    }

    // Check for governance.authorization.policy_references (external refs)
    const governance = manifest.governance as
      | Record<string, unknown>
      | undefined;
    const authorization = governance?.authorization as
      | Record<string, unknown>
      | undefined;
    const policyRefs = authorization?.policy_references as
      | string[]
      | undefined;
    if (policyRefs && policyRefs.length > 0) {
      console.log(
        `ℹ  Found ${policyRefs.length} external policy reference(s) in governance.authorization.policy_references`,
      );
      console.log(
        '   External references cannot be validated offline. Use DUADP node for runtime evaluation.',
      );
    }

    // Validate inline Cedar policies
    const result = validateManifestCedarPolicies(manifest);

    if (result.policyCount === 0) {
      console.log(
        'No inline Cedar policies found in extensions.security.cedar',
      );
      if (!policyRefs || policyRefs.length === 0) {
        console.log(
          'Tip: Add Cedar policies to extensions.security.cedar or governance.authorization.policy_references',
        );
      }
      process.exit(0);
    }

    console.log(
      `Validating ${result.policyCount} Cedar polic${result.policyCount === 1 ? 'y' : 'ies'}${result.hasSchema ? ' (with schema)' : ''}...\n`,
    );

    for (const r of result.results) {
      const icon = r.valid ? 'PASS' : 'FAIL';
      console.log(`  [${icon}] ${r.policyId || 'unnamed'}`);

      if (r.errors.length > 0) {
        for (const err of r.errors) {
          console.log(`         Error: ${err}`);
        }
      }
      if (r.warnings.length > 0) {
        for (const warn of r.warnings) {
          console.log(`         Warn: ${warn}`);
        }
      }

      if (options.verbose && r.valid) {
        console.log('         Cedar syntax valid');
      }
    }

    console.log('');

    if (result.valid) {
      console.log(
        `All ${result.policyCount} Cedar polic${result.policyCount === 1 ? 'y' : 'ies'} validated successfully.`,
      );
      process.exit(0);
    } else {
      const failCount = result.results.filter((r) => !r.valid).length;
      console.error(
        `${failCount} of ${result.policyCount} Cedar polic${result.policyCount === 1 ? 'y' : 'ies'} failed validation.`,
      );
      process.exit(1);
    }
  });

export const policyCommand = new Command('policy')
  .description('Cedar authorization policy management')
  .addCommand(validateSubcommand);
