/**
 * OSSA Discover Command - Search for agents in the agent-protocol registry
 *
 * Usage:
 *   ossa discover [query]
 *   ossa discover "machine learning" --capability nlp
 *   ossa discover --org blueflyio --min-trust 0.8
 *   ossa discover --json
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import axios from 'axios';

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
 * Agent Protocol Client for interacting with agent-protocol service
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
   * Search for agents in the registry
   */
  async searchAgents(
    query?: string,
    filters?: Omit<SearchFilters, 'query'>
  ): Promise<AgentSearchResult[]> {
    try {
      const params = new URLSearchParams();

      if (query) {
        params.append('q', query);
      }

      if (filters?.capability) {
        params.append('capability', filters.capability);
      }

      if (filters?.org) {
        params.append('org', filters.org);
      }

      if (filters?.minTrust !== undefined) {
        params.append('minTrust', filters.minTrust.toString());
      }

      if (filters?.limit !== undefined) {
        params.append('limit', filters.limit.toString());
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await axios.get(
        `${this.baseUrl}/api/v1/agents/search`,
        {
          params,
          headers,
          timeout: 30000,
        }
      );

      return response.data.agents || response.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(
            'Agent search endpoint not found. Ensure agent-protocol service is running.'
          );
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
          `Agent search failed: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
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
  .option('--limit <number>', 'Maximum results', '10')
  .action(
    async (
      query: string | undefined,
      options: {
        capability?: string;
        org?: string;
        minTrust?: number;
        json?: boolean;
        limit?: string;
      }
    ) => {
      try {
        const client = new AgentProtocolClient();

        const limit = options.limit ? parseInt(options.limit, 10) : 10;

        // Validate limit
        if (isNaN(limit) || limit < 1 || limit > 100) {
          console.error(
            chalk.red('✗ Invalid limit. Must be between 1 and 100')
          );
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
          console.log(chalk.blue('\nSearching agents...'));
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
          console.log(
            chalk.green(`Found ${results.length} agent(s):\n`)
          );
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
          }
        }
        process.exit(1);
      }
    }
  );
