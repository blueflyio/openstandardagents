/**
 * OSSA Verify Command - Verify agent identity via DID resolution
 *
 * Usage:
 *   ossa verify <gaid>
 *   ossa verify did:ossa:blueflyio:agent-123
 *   ossa verify did:ossa:blueflyio:agent-123 --card ./agent-card.yaml
 *   ossa verify did:ossa:blueflyio:agent-123 --json
 */

import { DuadpClient, resolveGaid } from '@bluefly/duadp';
import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as yaml from 'yaml';
import {
    addRegistryOptions,
    resolveRegistryUrl,
} from '../utils/standard-options.js';

/**
 * DID resolution result from agent-protocol API
 */
interface DIDResolutionResult {
  gaid: string;
  did: string;
  name: string;
  organization?: string;
  trustTier: string;
  trustLevel?: number;
  verified: boolean;
  capabilities: string[];
  endpoints?: {
    http?: string;
    grpc?: string;
    websocket?: string;
  };
  publicKey?: string;
  signature?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Agent card structure for signature verification
 */
interface AgentCard {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    gaid?: string;
    signature?: string;
    [key: string]: unknown;
  };
  spec: {
    capabilities?: Array<string | { name: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
}

/**
 * Agent Protocol Client for DID resolution using UADP
 */
class AgentProtocolClient {
  private client: DuadpClient;

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    const baseUrl = config?.baseUrl || process.env.OSSA_REGISTRY_URL || 'https://registry.openstandardagents.org';
    this.client = new DuadpClient(baseUrl, {
      token: config?.apiKey || process.env.AGENT_PROTOCOL_TOKEN || process.env.GITLAB_PRIVATE_TOKEN,
    });
  }

  /**
   * Resolve a GAID to its DID document
   */
  async resolveDID(gaid: string): Promise<DIDResolutionResult> {
    try {
      // 1. If it's a URI, resolve directly
      if (gaid.startsWith('uadp://') || gaid.startsWith('uadp://')) {
        const resolution = resolveGaid(gaid, { token: this.client['token'] });
        if (resolution.kind === 'agents') {
           const agent = await resolution.client.getAgent(resolution.name);
           return this.mapToDIDResult(agent, gaid);
        } else {
           throw new Error(`Expected an agent URI, but got kind: ${resolution.kind}`);
        }
      }

      // 2. Otherwise use WebFinger to resolve the DID/GAID string
      const wfResponse = await this.client.resolveGaid(gaid);

      // We expect the webfinger response to return JRD+JSON containing the agent profile link
      const agentLink = wfResponse.links?.find((l: any) => l.rel === 'http://openstandardagents.org/rels/profile');
      if (!agentLink || !agentLink.href) {
         throw new Error(`WebFinger resolution missing agent profile link for ${gaid}`);
      }

      // Fetch the agent profile from the href
      // If the href is a fully qualified URL we could fetch it, but usually it's on the same node
      const url = new URL(agentLink.href, this.client.baseUrl);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Failed to fetch mapped agent: ${res.statusText}`);

      const agent = await res.json();
      return this.mapToDIDResult(agent, gaid);

    } catch (error: any) {
      throw new Error(`DID resolution failed: ${error.message}`);
    }
  }

  private mapToDIDResult(agent: any, originalGaid: string): DIDResolutionResult {
     const tier = agent.security?.tier;
     let trustLevel = 0.5;
     if (tier === 'tier_4_system_admin') trustLevel = 1.0;
     else if (tier === 'tier_3_write_elevated') trustLevel = 0.8;
     else if (tier === 'tier_2_write_limited') trustLevel = 0.6;
     else if (tier === 'tier_1_read') trustLevel = 0.4;

     return {
        gaid: originalGaid,
        did: agent.metadata?.annotations?.['ossa.org/gaid'] || originalGaid,
        name: agent.metadata?.name || 'unknown',
        organization: agent.metadata?.identity?.namespace || 'community',
        trustTier: tier || 'unverified',
        trustLevel,
        verified: !!agent.metadata?.identity?.publisher?.pgp_key,
        capabilities: (agent.spec?.capabilities || []).map((c: any) => typeof c === 'string' ? c : c.name),
        endpoints: agent.endpoints,
        publicKey: agent.metadata?.identity?.publisher?.pgp_key,
        signature: agent.metadata?.identity?.signature,
        createdAt: agent.metadata?.created_at,
        updatedAt: agent.metadata?.updated_at,
     };
  }
}

/**
 * Load agent card from file
 */
function loadAgentCard(filePath: string): AgentCard {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Agent card not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  try {
    return yaml.parse(content) as AgentCard;
  } catch (error) {
    throw new Error(
      `Failed to parse agent card: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Verify signature matches between agent card and DID document
 */
function verifySignature(
  agentCard: AgentCard,
  didResult: DIDResolutionResult
): {
  match: boolean;
  cardSignature?: string;
  didSignature?: string;
  message?: string;
} {
  const cardSignature = agentCard.metadata.signature;
  const didSignature = didResult.signature;

  if (!cardSignature && !didSignature) {
    return {
      match: false,
      message: 'No signatures found in agent card or DID document',
    };
  }

  if (!cardSignature) {
    return {
      match: false,
      didSignature,
      message: 'Agent card has no signature',
    };
  }

  if (!didSignature) {
    return {
      match: false,
      cardSignature,
      message: 'DID document has no signature',
    };
  }

  const match = cardSignature === didSignature;

  return {
    match,
    cardSignature,
    didSignature,
    message: match
      ? 'Signatures match'
      : 'Signatures do not match - potential tampering detected',
  };
}

/**
 * Display verification result in human-readable format
 */
function displayResult(
  result: DIDResolutionResult,
  signatureCheck?: ReturnType<typeof verifySignature>
): void {
  console.log(chalk.cyan.bold('\nAgent Verification Result\n'));
  console.log(chalk.gray('─'.repeat(60)));

  // Basic Info
  console.log(chalk.white(`  GAID:         ${result.gaid}`));
  console.log(chalk.white(`  DID:          ${result.did}`));
  console.log(chalk.white(`  Name:         ${result.name}`));

  if (result.organization) {
    console.log(chalk.white(`  Organization: ${result.organization}`));
  }

  // Trust Information
  const trustColor =
    result.trustTier === 'high'
      ? chalk.green
      : result.trustTier === 'medium'
        ? chalk.yellow
        : chalk.red;

  console.log(
    chalk.white(`  Trust Tier:   ${trustColor(result.trustTier.toUpperCase())}`)
  );

  if (result.trustLevel !== undefined) {
    console.log(
      chalk.white(`  Trust Level:  ${(result.trustLevel * 100).toFixed(0)}%`)
    );
  }

  // Verification Status
  const verifiedIcon = result.verified ? chalk.green('✓') : chalk.red('✗');
  const verifiedText = result.verified
    ? chalk.green('VERIFIED')
    : chalk.red('NOT VERIFIED');
  console.log(chalk.white(`  Verified:     ${verifiedIcon} ${verifiedText}`));

  // Capabilities
  console.log(chalk.white(`\n  Capabilities:`));
  if (result.capabilities.length === 0) {
    console.log(chalk.gray('    None'));
  } else {
    for (const capability of result.capabilities) {
      console.log(chalk.gray(`    • ${capability}`));
    }
  }

  // Endpoints
  if (result.endpoints) {
    console.log(chalk.white(`\n  Endpoints:`));
    if (result.endpoints.http) {
      console.log(chalk.gray(`    HTTP:      ${result.endpoints.http}`));
    }
    if (result.endpoints.grpc) {
      console.log(chalk.gray(`    gRPC:      ${result.endpoints.grpc}`));
    }
    if (result.endpoints.websocket) {
      console.log(chalk.gray(`    WebSocket: ${result.endpoints.websocket}`));
    }
  }

  // Signature Verification
  if (signatureCheck) {
    console.log(chalk.white(`\n  Signature Verification:`));

    if (signatureCheck.match) {
      console.log(chalk.green(`    ✓ ${signatureCheck.message}`));
    } else {
      console.log(chalk.red(`    ✗ ${signatureCheck.message}`));

      if (signatureCheck.cardSignature && signatureCheck.didSignature) {
        console.log(
          chalk.gray(
            `    Card:     ${signatureCheck.cardSignature.slice(0, 16)}...`
          )
        );
        console.log(
          chalk.gray(
            `    DID:      ${signatureCheck.didSignature.slice(0, 16)}...`
          )
        );
      }
    }
  }

  // Timestamps
  if (result.createdAt || result.updatedAt) {
    console.log(chalk.white(`\n  Metadata:`));
    if (result.createdAt) {
      console.log(
        chalk.gray(
          `    Created:  ${new Date(result.createdAt).toLocaleString()}`
        )
      );
    }
    if (result.updatedAt) {
      console.log(
        chalk.gray(
          `    Updated:  ${new Date(result.updatedAt).toLocaleString()}`
        )
      );
    }
  }

  console.log(chalk.gray('─'.repeat(60)));
}

/**
 * Main verify command
 */
export const verifyCommand = new Command('verify')
  .description('Verify agent identity via DID resolution')
  .argument('<gaid>', 'Global Agent ID (GAID) or DID to verify')
  .option(
    '--card <path>',
    'Path to local agent-card.yaml for signature verification'
  )
  .option('--json', 'Output JSON format');

addRegistryOptions(verifyCommand);

verifyCommand.action(
  async (
    gaid: string,
    options: {
      card?: string;
      json?: boolean;
      registry?: string;
      apiKey?: string;
    }
  ) => {
    const registryUrl = resolveRegistryUrl(options);
    try {
      const client = new AgentProtocolClient({
        baseUrl: registryUrl,
        apiKey: options.apiKey,
      });

      if (!options.json) {
        console.log(
          chalk.blue(`\nVerifying agent: ${gaid} on ${registryUrl}...`)
        );
      }

      // Resolve DID
      const result = await client.resolveDID(gaid);

      // Load and verify agent card if provided
      let signatureCheck: ReturnType<typeof verifySignature> | undefined;

      if (options.card) {
        if (!options.json) {
          console.log(chalk.gray(`Loading agent card: ${options.card}`));
        }

        const agentCard = loadAgentCard(options.card);
        signatureCheck = verifySignature(agentCard, result);
      }

      // Output results
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              ...result,
              signatureVerification: signatureCheck,
            },
            null,
            2
          )
        );
      } else {
        displayResult(result, signatureCheck);

        // Summary
        console.log('');
        if (result.verified) {
          console.log(chalk.green('✓ Agent identity verified successfully'));
        } else {
          console.log(
            chalk.yellow('⚠ Agent identity could not be fully verified')
          );
        }

        if (signatureCheck && !signatureCheck.match) {
          console.log(chalk.red('✗ Warning: Signature mismatch detected'));
        }
      }

      // Exit with appropriate code
      const exitCode =
        result.verified && (!signatureCheck || signatureCheck.match) ? 0 : 1;
      process.exit(exitCode);
    } catch (error) {
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error),
              verified: false,
            },
            null,
            2
          )
        );
      } else {
        console.error(
          chalk.red(
            `\n✗ Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );

        // Show helpful troubleshooting
        if (error instanceof Error && error.message.includes('connect')) {
          console.log(chalk.yellow('\nTroubleshooting:'));
          console.log(chalk.gray(`  Registry: ${registryUrl}`));
          console.log(
            chalk.gray('  1. Check network connectivity and firewall rules')
          );
          console.log(
            chalk.gray('  2. Use --registry <url> or set OSSA_REGISTRY_URL')
          );
        } else if (
          error instanceof Error &&
          error.message.includes('not found')
        ) {
          console.log(chalk.yellow('\nNote:'));
          console.log(
            chalk.gray(
              '  The GAID may be invalid or the agent may not be registered'
            )
          );
          console.log(
            chalk.gray(
              `  Use ${chalk.white('ossa discover')} to search for agents`
            )
          );
        }
      }
      process.exit(1);
    }
  }
);
