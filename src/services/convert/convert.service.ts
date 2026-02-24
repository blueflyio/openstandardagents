/**
 * ConvertService — Wraps adapter toConfig() for platform conversion
 *
 * Thin layer over the adapter registry, callable from CLI, REST, and MCP.
 */

import { injectable, inject } from 'inversify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import { initializeAdapters, registry as adapterRegistry } from '../../adapters/index.js';
import type { OssaAgent } from '../../types/index.js';

export interface ConvertInput {
  manifest: OssaAgent;
  target: string;
  output_dir?: string;
}

export interface ConvertResult {
  target: string;
  filename: string;
  content: Record<string, unknown>;
  written_to?: string;
}

@injectable()
export class ConvertService {
  constructor() {
    initializeAdapters();
  }

  async convert(input: ConvertInput): Promise<ConvertResult> {
    const adapter = adapterRegistry.getAdapter(input.target);
    if (!adapter) {
      throw new Error(`Unknown target: ${input.target}`);
    }

    const result = await adapter.toConfig(input.manifest);
    const converted = result.config;
    const filename = result.filename;

    if (input.output_dir) {
      const outDir = path.resolve(input.output_dir);
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, filename);

      const multiRes = converted as Record<string, unknown>;
      let content: string;
      if (multiRes._ossa_multi_resource && Array.isArray(multiRes.resources)) {
        content = (multiRes.resources as Record<string, unknown>[])
          .map((r) => yaml.dump(r, { lineWidth: 120, noRefs: true }))
          .join('---\n');
      } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        content = yaml.dump(converted, { lineWidth: 120, noRefs: true });
      } else {
        content = JSON.stringify(converted, null, 2);
      }

      fs.writeFileSync(outPath, content, 'utf8');
      return { target: input.target, filename, content: converted, written_to: outPath };
    }

    return { target: input.target, filename, content: converted };
  }

  listTargets(): Array<{ id: string; name: string }> {
    const adapters = adapterRegistry.getAdapterInfo();
    return adapters.map((a) => ({ id: a.platform, name: a.displayName || a.platform }));
  }
}
