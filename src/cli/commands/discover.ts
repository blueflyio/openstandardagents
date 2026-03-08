/**
 * OSSA Discover Command - Search for agents in the agent-protocol registry
 *
 * Usage:
 *   ossa discover [query]
 *   ossa discover "machine learning" --capability nlp
 *   ossa discover --org blueflyio --min-trust 0.8
 *   ossa discover --json
 */

import { DuadpClient } from '@bluefly/duadp';
import chalk from 'chalk';
import Table from 'cli-table3';
import { Command } from 'commander';
import {
    addRegistryOptions,
    resolveRegistryUrl,
} from '../utils/standard-options.js';

/**
 * Agent search result from agent-protocol API
 */
interface AgentSearchResult {
  gaid: string;
  name: string;
  organization?: string;
  capabilities: string[];
  trustLevel?: number;
  trustTier?: string;
  description?: string;
  verified?: boolean;
}

/**
 * Search filters for agent discovery
 */
interface SearchFilters {
  query?: string;
  capability?: string;
  org?: string;
  minTrust?: number;
  limit?: number;
}

/**
 * Agent Protocol Client for interacting with UADP registry
 */
class AgentProtocolClient {
  private client: DuadpClient;

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    const baseUrl = config?.baseUrl || process.env.OSSA_REGISTRY_URL || 'https://uadp.blueflyagents.com';
    this.client = new DuadpClient(baseUrl, {
      token: config?.apiKey || process.env.AGENT_PROTOCOL_TOKEN || process.env.GITLAB_PRIVATE_TOKEN,
    });
  }

  /**
   * Search for agents in the registry using UADP
   */
  async searchAgents(
    query?: string,
    filters?: Omit<SearchFilters, 'query'>
  ): Promise<AgentSearchResult[]> {
    try {
      const response = await this.client.listAgents({
        search: query,
        limit: filters?.limit,
      });

      // Map UADP OssaAgent to AgentSearchResult
      return response.data.map((agent: any) => {
        // Handle variations in agent schema mapping
        const capabilities: any[] = agent.spec?.capabilities || [];
        const mappedCapabilities = capabilities.map((c: any) => typeof c === 'string' ? c : (c.name || 'unknown'));

        // Map Tier 1 to 4 to a trust score 0-1
        let trustLevel = 0.5;
        const tier = agent.security?.tier;
        if (tier === 'tier_4_system_admin') trustLevel = 1.0;
        else if (tier === 'tier_3_write_elevated') trustLevel = 0.8;
        else if (tier === 'tier_2_write_limited') trustLevel = 0.6;
        else if (tier === 'tier_1_read') trustLevel = 0.4;

        return {
          gaid: (agent.metadata?.catalog as any)?.catalog_id || `uadp://${(this.client as any).nodeInfo?.node_id || 'remote'}/${agent.metadata?.name}`,
          name: agent.metadata?.name || 'unknown',
          organization: (agent.metadata?.identity as any)?.namespace || 'community',
          capabilities: mappedCapabilities,
          trustLevel: trustLevel,
          trustTier: tier || 'unverified',
          description: agent.metadata?.description || '',
          verified: !!(agent.metadata?.identity as any)?.publisher?.pgp_key,
        };
      }).filter((a: AgentSearchResult) => {
        if (filters?.minTrust && (a.trustLevel || 0) < filters.minTrust) return false;
        if (filters?.org && a.organization !== filters.org) return false;
        if (filters?.capability && !a.capabilities.includes(filters.capability)) return false;
        return true;
      });
    } catch (error: any) {
      throw new Error(`UADP search failed: ${error.message}`);
    }
  }
}

/**
 * Display search results in table format
 */
function displayTable(results: AgentSearchResult[]): void {
  const table = new Table({
    head: [
      chalk.cyan('Name'),
      chalk.cyan('GAID'),
      chalk.cyan('Capabilities'),
      chalk.cyan('Trust Level'),
    ],
    colWidths: [25, 30, 35, 15],
    wordWrap: true,
  });

  for (const agent of results) {
    const capabilities = agent.capabilities.slice(0, 3).join(', ');
    const capDisplay =
      agent.capabilities.length > 3
        ? `${capabilities}... (+${agent.capabilities.length - 3})`
        : capabilities;

    const trustDisplay = agent.trustLevel
      ? `${(agent.trustLevel * 100).toFixed(0)}%`
      : agent.trustTier || 'N/A';

    table.push([
      agent.name,
      chalk.gray(agent.gaid),
      capDisplay || chalk.gray('None'),
      trustDisplay,
    ]);
  }

  console.log(table.toString());
}

/**
 * Main discover command
 */
export const discoverCommand = new Command('discover')
  .description('Search for agents in the agent-protocol registry')
  .argument('[query]', 'Search query')
  .option('--capability <capability>', 'Filter by capability')
  .option('--org <organization>', 'Filter by organization')
  .option('--min-trust <level>', 'Minimum trust level (0.0 - 1.0)', parseFloat)
  .option('--json', 'Output JSON format')
  .option('--limit <number>', 'Maximum results', '10');

addRegistryOptions(discoverCommand);

discoverCommand.action(
  async (
    query: string | undefined,
    options: {
      capability?: string;
      org?: string;
      minTrust?: number;
      json?: boolean;
      limit?: string;
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

      const limit = options.limit ? parseInt(options.limit, 10) : 10;

      // Validate limit
      if (isNaN(limit) || limit < 1 || limit > 100) {
        console.error(chalk.red('✗ Invalid limit. Must be between 1 and 100'));
        process.exit(1);
      }

      // Validate min-trust
      if (
        options.minTrust !== undefined &&
        (isNaN(options.minTrust) ||
          options.minTrust < 0 ||
          options.minTrust > 1)
      ) {
        console.error(
          chalk.red('✗ Invalid min-trust. Must be between 0.0 and 1.0')
        );
        process.exit(1);
      }

      // Show search parameters
      if (!options.json) {
        console.log(chalk.blue(`\nSearching agents on ${registryUrl}...`));
        if (query) {
          console.log(chalk.gray(`  Query: ${query}`));
        }
        if (options.capability) {
          console.log(chalk.gray(`  Capability: ${options.capability}`));
        }
        if (options.org) {
          console.log(chalk.gray(`  Organization: ${options.org}`));
        }
        if (options.minTrust !== undefined) {
          console.log(
            chalk.gray(`  Min Trust: ${(options.minTrust * 100).toFixed(0)}%`)
          );
        }
        console.log(chalk.gray(`  Limit: ${limit}`));
        console.log('');
      }

      // Execute search
      const results = await client.searchAgents(query, {
        capability: options.capability,
        org: options.org,
        minTrust: options.minTrust,
        limit,
      });

      // Handle no results
      if (results.length === 0) {
        if (options.json) {
          console.log(JSON.stringify({ agents: [], count: 0 }, null, 2));
        } else {
          console.log(chalk.yellow('No agents found'));
          if (query || options.capability || options.org || options.minTrust) {
            console.log(chalk.gray('  Try adjusting your search filters'));
          }
        }
        process.exit(0);
      }

      // Output results
      if (options.json) {
        console.log(
          JSON.stringify({ agents: results, count: results.length }, null, 2)
        );
      } else {
        console.log(chalk.green(`Found ${results.length} agent(s):\n`));
        displayTable(results);

        console.log('');
        console.log(
          chalk.gray(
            `Use ${chalk.white('ossa verify <gaid>')} to view agent details`
          )
        );
      }

      process.exit(0);
    } catch (error) {
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error),
              agents: [],
              count: 0,
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
        }
      }
      process.exit(1);
    }
  }
);
