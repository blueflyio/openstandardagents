import { Command } from 'commander';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { signAgentManifest } from '../../services/trust/trust.service.js';

export const signCommand = new Command('sign')
  .description('Cryptographically sign an OSSA manifest using an Ed25519 private key')
  .argument('<manifest>', 'Path to the OSSA manifest file (.yaml or .json)')
  .requiredOption('-k, --private-key <hex>', 'Ed25519 private key in hex format')
  .option('-i, --issuer <did>', 'Optional DID of the signing entity (e.g. did:web:example.com)')
  .option('-o, --output <file>', 'Optional output file path. Defaults to overwriting the input file.')
  .action(async (manifestPath: string, options) => {
    try {
      const fullPath = path.resolve(process.cwd(), manifestPath);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: Manifest file not found at ${fullPath}`);
        process.exit(1);
      }

      const isJson = fullPath.endsWith('.json');
      const content = fs.readFileSync(fullPath, 'utf-8');

      let manifest: Record<string, unknown>;
      try {
        manifest = isJson ? JSON.parse(content) : yaml.load(content) as Record<string, unknown>;
      } catch (e: unknown) {
        console.error(`Error parsing manifest: ${e instanceof Error ? e.message : 'Unknown error'}`);
        process.exit(1);
      }

      const signedManifest = await signAgentManifest(manifest, options.privateKey, options.issuer);

      const outputContent = isJson
        ? JSON.stringify(signedManifest, null, 2)
        : yaml.dump(signedManifest, { noRefs: true, indent: 2 });

      const outputPath = options.output ? path.resolve(process.cwd(), options.output) : fullPath;

      fs.writeFileSync(outputPath, outputContent, 'utf-8');

      console.log(`Successfully signed manifest. Output saved to ${outputPath}`);
    } catch (e: unknown) {
      console.error(`Error signing manifest: ${e instanceof Error ? e.message : 'Unknown error'}`);
      process.exit(1);
    }
  });
