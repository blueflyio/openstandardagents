/**
 * Drupal MCP Server Implementation
 * Implements Model Context Protocol server for Drupal operations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { DrupalClient } from './client/drupal-client.js';
import { AuthConfig } from './types/drupal.js';

// Import tool implementations
import { ContentTools, contentToolDefinitions } from './tools/content.js';
import { EntityTools, entityToolDefinitions } from './tools/entities.js';
import { ViewsTools, viewsToolDefinitions } from './tools/views.js';
import { UserTools, userToolDefinitions } from './tools/users.js';
import { ConfigTools, configToolDefinitions } from './tools/config.js';
import { ModuleTools, moduleToolDefinitions } from './tools/modules.js';
import { CacheTools, cacheToolDefinitions } from './tools/cache.js';

export class DrupalMCPServer {
  private server: Server;
  private client: DrupalClient;

  // Tool instances
  private contentTools: ContentTools;
  private entityTools: EntityTools;
  private viewsTools: ViewsTools;
  private userTools: UserTools;
  private configTools: ConfigTools;
  private moduleTools: ModuleTools;
  private cacheTools: CacheTools;

  // All tool definitions
  private toolDefinitions: any[];

  constructor(authConfig: AuthConfig) {
    this.server = new Server(
      {
        name: 'drupal-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Drupal client
    this.client = new DrupalClient(authConfig);

    // Initialize tool instances
    this.contentTools = new ContentTools(this.client);
    this.entityTools = new EntityTools(this.client);
    this.viewsTools = new ViewsTools(this.client);
    this.userTools = new UserTools(this.client);
    this.configTools = new ConfigTools(this.client);
    this.moduleTools = new ModuleTools(this.client);
    this.cacheTools = new CacheTools(this.client);

    // Combine all tool definitions (20+ tools)
    this.toolDefinitions = [
      ...contentToolDefinitions, // 5 tools
      ...entityToolDefinitions, // 4 tools
      ...viewsToolDefinitions, // 2 tools
      ...userToolDefinitions, // 3 tools
      ...configToolDefinitions, // 2 tools
      ...moduleToolDefinitions, // 3 tools
      ...cacheToolDefinitions, // 2 tools
    ];

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.toolDefinitions,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        let result: any;

        // Content management tools
        if (name === 'drupal_create_node') {
          result = await this.contentTools.createNode(args as any);
        } else if (name === 'drupal_update_node') {
          result = await this.contentTools.updateNode(args as any);
        } else if (name === 'drupal_delete_node') {
          result = await this.contentTools.deleteNode(args.nid as string);
        } else if (name === 'drupal_get_node') {
          result = await this.contentTools.getNode(args.nid as string);
        } else if (name === 'drupal_search_content') {
          result = await this.contentTools.searchContent(args as any);
        }

        // Entity operation tools
        else if (name === 'drupal_create_entity') {
          result = await this.entityTools.createEntity(args as any);
        } else if (name === 'drupal_update_entity') {
          result = await this.entityTools.updateEntity(args as any);
        } else if (name === 'drupal_delete_entity') {
          result = await this.entityTools.deleteEntity(args as any);
        } else if (name === 'drupal_query_entities') {
          result = await this.entityTools.queryEntities(args as any);
        }

        // Views integration tools
        else if (name === 'drupal_execute_view') {
          result = await this.viewsTools.executeView(args as any);
        } else if (name === 'drupal_get_view_results') {
          result = await this.viewsTools.getViewResults(args as any);
        }

        // User management tools
        else if (name === 'drupal_create_user') {
          result = await this.userTools.createUser(args as any);
        } else if (name === 'drupal_update_user') {
          result = await this.userTools.updateUser(args as any);
        } else if (name === 'drupal_get_user') {
          result = await this.userTools.getUser(args.uid as string);
        }

        // Configuration tools
        else if (name === 'drupal_get_config') {
          result = await this.configTools.getConfig(args as any);
        } else if (name === 'drupal_set_config') {
          result = await this.configTools.setConfig(args as any);
        }

        // Module management tools
        else if (name === 'drupal_list_modules') {
          result = await this.moduleTools.listModules(args as any);
        } else if (name === 'drupal_enable_module') {
          result = await this.moduleTools.enableModule(args as any);
        } else if (name === 'drupal_disable_module') {
          result = await this.moduleTools.disableModule(args as any);
        }

        // Cache operation tools
        else if (name === 'drupal_clear_cache') {
          result = await this.cacheTools.clearCache(args as any);
        } else if (name === 'drupal_rebuild_cache') {
          result = await this.cacheTools.rebuildCache(args as any);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Drupal MCP server running on stdio');
  }
}
