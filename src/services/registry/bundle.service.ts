/**
 * Bundle Service
 * Creates and validates agent bundles for registry publishing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as tar from 'tar';
import { injectable } from 'inversify';
import type { OssaAgent } from '../../types/index.js';

export interface BundleInfo {
  path: string;
  checksum: string;
  size: number;
  sbom: SBOM;
  sbomChecksum: string;
}

export interface SBOM {
  bomFormat: 'CycloneDX';
  specVersion: '1.4';
  version: number;
  metadata: {
    timestamp: string;
    tools: Array<{ name: string; version: string }>;
  };
  components: Array<{
    type: 'application' | 'library' | 'framework';
    name: string;
    version: string;
    purl?: string;
  }>;
}

@injectable()
export class BundleService {
  async createBundle(
    manifestPath: string,
    manifest: OssaAgent,
    outputDir: string
  ): Promise<BundleInfo> {
    const agentId = manifest.metadata?.name || 'unknown-agent';
    const version = manifest.metadata?.version || '1.0.0';
    const bundleName = `${agentId}-${version}.tar.gz`;
    const bundlePath = path.join(outputDir, bundleName);
    const tempDir = path.join(outputDir, `.bundle-${agentId}-${Date.now()}`);

    await fs.mkdir(tempDir, { recursive: true });

    try {
      await fs.copyFile(manifestPath, path.join(tempDir, 'manifest.ossa.yaml'));
      const sbom = await this.generateSBOM(manifest);
      const sbomPath = path.join(tempDir, 'sbom.json');
      await fs.writeFile(sbomPath, JSON.stringify(sbom, null, 2));

      const sbomChecksum = await this.calculateChecksum(sbomPath);

      await tar.create({ gzip: true, file: bundlePath, cwd: tempDir }, ['.']);
      const checksum = await this.calculateChecksum(bundlePath);
      const stats = await fs.stat(bundlePath);

      return {
        path: bundlePath,
        checksum,
        size: stats.size,
        sbom,
        sbomChecksum,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  async generateSBOM(manifest: OssaAgent): Promise<SBOM> {
    const components: SBOM['components'] = [];
    return {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [{ name: '@bluefly/openstandardagents', version: '0.3.5' }],
      },
      components,
    };
  }

  async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }
}
