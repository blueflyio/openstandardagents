/**
 * ExportService — Wraps adapter registry for platform exports
 *
 * Delegates to the adapter registry for all platform conversions.
 * No TUI/HTTP dependencies.
 */

import { injectable } from 'inversify';
import {
  initializeAdapters,
  registry as adapterRegistry,
} from '../../adapters/index.js';
import type { OssaAgent } from '../../types/index.js';

export interface ExportInput {
  manifest: OssaAgent;
  target: string;
  output_dir?: string;
}

export interface ExportResult {
  target: string;
  filename: string;
  content: Record<string, unknown>;
  written_to?: string;
}

export interface PlatformInfo {
  id: string;
  name: string;
  description?: string;
}

@injectable()
export class ExportService {
  constructor() {
    initializeAdapters();
  }

  async export(input: ExportInput): Promise<ExportResult> {
    const adapter = adapterRegistry.getAdapter(input.target);
    if (!adapter) {
      throw new Error(`Unknown export target: ${input.target}`);
    }

    const result = await adapter.toConfig(input.manifest);
    return {
      target: input.target,
      filename: result.filename,
      content: result.config,
    };
  }

  listPlatforms(): PlatformInfo[] {
    const adapters = adapterRegistry.getAdapterInfo();
    return adapters.map((a) => ({
      id: a.platform,
      name: a.displayName || a.platform,
      description: a.description,
    }));
  }

  getTargetInfo(target: string): PlatformInfo | null {
    const platforms = this.listPlatforms();
    return platforms.find((p) => p.id === target) ?? null;
  }
}
