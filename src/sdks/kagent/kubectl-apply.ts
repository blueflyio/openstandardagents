/**
 * kubectl apply adapter for kagent v1alpha2 bundles.
 * Applies CRDs in APPLY_ORDER: ModelConfig → RemoteMCPServer → Agent.
 */

import { spawn } from 'child_process';
import * as yaml from 'yaml';
import type { KAgentV1Alpha2Bundle } from './types.js';
import { KAGENT_APPLY_ORDER } from './types.js';

interface ApplyItemResult {
  kind: string;
  name: string;
  status: 'created' | 'configured' | 'unchanged' | 'error';
  message?: string;
}

interface ApplyBundleResult {
  success: boolean;
  applied: number;
  results: ApplyItemResult[];
  error?: string;
}

/**
 * Apply a single YAML manifest via kubectl stdin.
 */
async function kubectlApplyManifest(
  manifestYaml: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const kubectl = spawn('kubectl', ['apply', '-f', '-'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    kubectl.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    kubectl.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    kubectl.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`kubectl apply failed (exit ${code}): ${stderr}`));
      }
    });

    kubectl.on('error', (err: Error) => {
      reject(new Error(`kubectl not found or failed to spawn: ${err.message}`));
    });

    kubectl.stdin.write(manifestYaml);
    kubectl.stdin.end();
  });
}

/**
 * Parse kubectl apply output to determine status.
 */
function parseApplyOutput(stdout: string): 'created' | 'configured' | 'unchanged' {
  if (stdout.includes('created')) return 'created';
  if (stdout.includes('configured')) return 'configured';
  return 'unchanged';
}

/**
 * Apply a complete v1alpha2 bundle to Kubernetes in APPLY_ORDER.
 *
 * Order: ModelConfig → RemoteMCPServer(s) → Agent
 * This ensures dependencies exist before the Agent references them.
 */
export async function applyV1Alpha2Bundle(
  bundle: KAgentV1Alpha2Bundle
): Promise<ApplyBundleResult> {
  const results: ApplyItemResult[] = [];
  let applied = 0;

  try {
    // 1. ModelConfig (if present)
    if (bundle.modelConfig) {
      const yamlStr = yaml.stringify(bundle.modelConfig);
      const { stdout } = await kubectlApplyManifest(yamlStr);
      results.push({
        kind: 'ModelConfig',
        name: bundle.modelConfig.metadata.name,
        status: parseApplyOutput(stdout),
      });
      applied++;
    }

    // 2. RemoteMCPServer(s)
    for (const server of bundle.remoteMCPServers) {
      const yamlStr = yaml.stringify(server);
      const { stdout } = await kubectlApplyManifest(yamlStr);
      results.push({
        kind: 'RemoteMCPServer',
        name: server.metadata.name,
        status: parseApplyOutput(stdout),
      });
      applied++;
    }

    // 3. Agent (last — depends on ModelConfig and RemoteMCPServer)
    const agentYaml = yaml.stringify(bundle.agent);
    const { stdout } = await kubectlApplyManifest(agentYaml);
    results.push({
      kind: 'Agent',
      name: bundle.agent.metadata.name,
      status: parseApplyOutput(stdout),
    });
    applied++;

    return { success: true, applied, results };
  } catch (error) {
    return {
      success: false,
      applied,
      results,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Flatten a bundle into an ordered array of CRD objects for serialization.
 * Follows KAGENT_APPLY_ORDER.
 */
export function flattenBundle(
  bundle: KAgentV1Alpha2Bundle
): Array<{ kind: string; name: string; manifest: Record<string, unknown> }> {
  const ordered: Array<{ kind: string; name: string; manifest: Record<string, unknown> }> = [];

  if (bundle.modelConfig) {
    ordered.push({
      kind: 'ModelConfig',
      name: bundle.modelConfig.metadata.name,
      manifest: bundle.modelConfig as unknown as Record<string, unknown>,
    });
  }

  for (const server of bundle.remoteMCPServers) {
    ordered.push({
      kind: 'RemoteMCPServer',
      name: server.metadata.name,
      manifest: server as unknown as Record<string, unknown>,
    });
  }

  ordered.push({
    kind: 'Agent',
    name: bundle.agent.metadata.name,
    manifest: bundle.agent as unknown as Record<string, unknown>,
  });

  return ordered;
}
