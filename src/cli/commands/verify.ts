/**
 * OSSA Verify Command - Verify agent identity via DID resolution
 *
 * Usage:
 *   ossa verify <gaid>
 *   ossa verify did:ossa:blueflyio:agent-123
 *   ossa verify did:ossa:blueflyio:agent-123 --card ./agent-card.yaml
 *   ossa verify did:ossa:blueflyio:agent-123 --json
 */

import { Command } from 'commander';
import chalk from 'chalk';
import axios from 'axios';
import * as fs from 'fs';
import * as yaml from 'yaml';
import * as crypto from 'crypto';

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
 * Agent Protocol Client for DID resolution
 */
class AgentProtocolClient {
  private baseUrl: string;
  private token?: string;

  constructor() {
    // Get configuration from environment
    this.baseUrl =
      process.env.AGENT_PROTOCOL_URL ||
      process.env.AGENT_PROTOCOL_BASE_URL ||
      'http://localhost:3000';
    this.token =
      process.env.AGENT_PROTOCOL_TOKEN || process.env.GITLAB_PRIVATE_TOKEN;
  }

  /**
   * Resolve a GAID to its DID document
   */
  async resolveDID(gaid: string): Promise<DIDResolutionResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await axios.get(
        `${this.baseUrl}/api/v1/agents/resolve/${encodeURIComponent(gaid)}`,
        {
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Agent not found: ${gaid}`);
        } else if (error.response?.status === 401) {
          throw new Error(
            'Authentication failed. Set AGENT_PROTOCOL_TOKEN environment variable.'
          );
        } else if (error.code === 'ECONNREFUSED') {
          throw new Error(
            `Cannot connect to agent-protocol service at ${this.baseUrl}. ` +
              `Set AGENT_PROTOCOL_URL to the correct endpoint.`
          );
        }
        throw new Error(
          `DID resolution failed: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
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
      chalk.white(
        `  Trust Level:  ${(result.trustLevel * 100).toFixed(0)}%`
      )
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
      console.log(
        chalk.green(`    ✓ ${signatureCheck.message}`)
      );
    } else {
      console.log(
        chalk.red(`    ✗ ${signatureCheck.message}`)
      );

      if (signatureCheck.cardSignature && signatureCheck.didSignature) {
        console.log(chalk.gray(`    Card:     ${signatureCheck.cardSignature.slice(0, 16)}...`));
        console.log(chalk.gray(`    DID:      ${signatureCheck.didSignature.slice(0, 16)}...`));
      }
    }
  }

  // Timestamps
  if (result.createdAt || result.updatedAt) {
    console.log(chalk.white(`\n  Metadata:`));
    if (result.createdAt) {
      console.log(
        chalk.gray(`    Created:  ${new Date(result.createdAt).toLocaleString()}`)
      );
    }
    if (result.updatedAt) {
      console.log(
        chalk.gray(`    Updated:  ${new Date(result.updatedAt).toLocaleString()}`)
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
  .option('--json', 'Output JSON format')
  .action(
    async (
      gaid: string,
      options: {
        card?: string;
        json?: boolean;
      }
    ) => {
      try {
        const client = new AgentProtocolClient();

        if (!options.json) {
          console.log(chalk.blue(`\nVerifying agent: ${gaid}...`));
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
              chalk.yellow(
                '⚠ Agent identity could not be fully verified'
              )
            );
          }

          if (signatureCheck && !signatureCheck.match) {
            console.log(
              chalk.red(
                '✗ Warning: Signature mismatch detected'
              )
            );
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
            console.log(
              chalk.gray('  1. Ensure agent-protocol service is running')
            );
            console.log(
              chalk.gray(
                '  2. Set AGENT_PROTOCOL_URL environment variable if needed'
              )
            );
            console.log(
              chalk.gray('  3. Check network connectivity and firewall rules')
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
