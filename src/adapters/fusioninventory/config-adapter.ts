/**
 * FusionInventory Config-Only Adapter
 *
 * Converts an OSSA agent manifest to FusionInventory agent.cfg format.
 * Config-only: produces a single key=value config file for the agent daemon.
 *
 * SOLID: Single Responsibility — FusionInventory config export only.
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ConfigResult,
} from '../base/adapter.interface.js';
import type { FusionInventoryAgentConfig } from './types.js';
import { serialiseAgentCfg } from './types.js';

export class FusionInventoryConfigAdapter extends BaseAdapter {
  readonly platform = 'fusioninventory';
  readonly displayName = 'FusionInventory';
  readonly description = 'FusionInventory agent.cfg for IT asset inventory';
  readonly status = 'alpha' as const;
  readonly supportedVersions = ['v0.4'];

  async export(
    manifest: OssaAgent,
    _options?: ExportOptions
  ): Promise<ExportResult> {
    const cfg = this.buildConfig(manifest);
    const content = serialiseAgentCfg(cfg);
    const name = manifest.metadata?.name || 'agent';

    return this.createResult(true, [
      this.createFile(
        `fusioninventory/${name}/agent.cfg`,
        content,
        'config',
        'ini'
      ),
      this.createManifestFile(manifest),
    ]);
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: {
        name: 'inventory-collector',
        version: '1.0.0',
        description: 'FusionInventory agent for hardware/software inventory',
      },
      spec: {
        role: 'Collect hardware and software inventory from endpoints',
        tools: [
          { type: 'function', name: 'inventory', description: 'Hardware/software inventory collection' },
          { type: 'function', name: 'deploy', description: 'Software deployment tasks' },
          { type: 'function', name: 'esx', description: 'VMware ESX/ESXi inventory' },
        ],
      },
      extensions: {
        fusioninventory: {
          server: 'https://glpi.example.com/plugins/fusioninventory/',
          delaytime: 3600,
          'httpd-port': 62354,
          debug: 1,
          tag: 'production',
        },
      },
    };
  }

  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    const cfg = this.buildConfig(manifest);
    return {
      config: cfg as unknown as Record<string, unknown>,
      filename: `agent.cfg`,
    };
  }

  private buildConfig(manifest: OssaAgent): FusionInventoryAgentConfig {
    const meta = manifest.metadata || { name: 'agent', version: '0.0.0' };
    const ext = (manifest.extensions?.fusioninventory || {}) as Record<string, unknown>;

    const cfg: FusionInventoryAgentConfig = {};

    // Map OSSA spec to FusionInventory directives
    if (ext.server) cfg.server = String(ext.server);
    if (ext.delaytime !== undefined) cfg.delaytime = Number(ext.delaytime);
    if (ext.lazy !== undefined) cfg.lazy = Boolean(ext.lazy);
    if (ext.proxy) cfg.proxy = String(ext.proxy);
    if (ext.timeout !== undefined) cfg.timeout = Number(ext.timeout);

    // SSL
    if (ext['ca-cert-dir']) cfg['ca-cert-dir'] = String(ext['ca-cert-dir']);
    if (ext['ca-cert-file']) cfg['ca-cert-file'] = String(ext['ca-cert-file']);
    if (ext['no-ssl-check'] !== undefined) cfg['no-ssl-check'] = Boolean(ext['no-ssl-check']);

    // HTTP daemon
    if (ext['no-httpd'] !== undefined) cfg['no-httpd'] = Boolean(ext['no-httpd']);
    if (ext['httpd-ip']) cfg['httpd-ip'] = String(ext['httpd-ip']);
    if (ext['httpd-port'] !== undefined) cfg['httpd-port'] = Number(ext['httpd-port']);
    if (Array.isArray(ext['httpd-trust'])) cfg['httpd-trust'] = ext['httpd-trust'] as string[];

    // Logging
    if (ext.logger) cfg.logger = ext.logger as FusionInventoryAgentConfig['logger'];
    if (ext.logfile) cfg.logfile = String(ext.logfile);
    if (ext['logfile-maxsize'] !== undefined) cfg['logfile-maxsize'] = Number(ext['logfile-maxsize']);
    if (ext.logfacility) cfg.logfacility = String(ext.logfacility);
    if (ext.color !== undefined) cfg.color = Boolean(ext.color);
    if (ext.debug !== undefined) cfg.debug = Number(ext.debug);

    // Tasks — derive disabled tasks from manifest tools (if tools are listed, others are disabled)
    if (Array.isArray(ext['no-task'])) cfg['no-task'] = ext['no-task'] as string[];

    // Inventory-specific
    if (ext.tag) cfg.tag = String(ext.tag);
    else if (meta.name) cfg.tag = meta.name;

    if (Array.isArray(ext['no-category'])) cfg['no-category'] = ext['no-category'] as string[];
    if (ext['additional-content']) cfg['additional-content'] = String(ext['additional-content']);
    if (ext['scan-homedirs'] !== undefined) cfg['scan-homedirs'] = Boolean(ext['scan-homedirs']);
    if (ext.force !== undefined) cfg.force = Boolean(ext.force);
    if (ext['collect-timeout'] !== undefined) cfg['collect-timeout'] = Number(ext['collect-timeout']);
    if (ext['no-p2p'] !== undefined) cfg['no-p2p'] = Boolean(ext['no-p2p']);

    // Auth
    if (ext.user) cfg.user = String(ext.user);
    if (ext.password) cfg.password = String(ext.password);

    return cfg;
  }
}
