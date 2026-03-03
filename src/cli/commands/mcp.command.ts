/**
 * OSSA MCP Bridge CLI Command
 *
 * SOD: Presentation and arg-parsing only. All logic delegates to McpBridgeService.
 */

import chalk from 'chalk';
import { Command } from 'commander';

const mcpCommand = new Command('mcp').description(
  'Manage the OSSA MCP Bridge for interoperable tool access (NIST Pillar 2)'
);

const bridgeCommand = new Command('bridge').description(
  'OSSA MCP Bridge — broker external MCP servers through the OSSA policy engine'
);

/**
 * ossa mcp bridge sync <source>
 * Uses @modelcontextprotocol/sdk Client to connect to each server and discover tools.
 */
bridgeCommand
  .command('sync <source>')
  .description(
    'Sync MCP server configs from an external app (cursor | claude-desktop) into OSSA'
  )
  .option('--dir <directory>', 'Base workspace directory', '.')
  .action(async (source: string, options: { dir: string }) => {
    try {
      const { container } = await import('../../di-container.js');
      const { McpBridgeService } = await import('../../services/mcp/bridge.service.js');
      const service = container.get(McpBridgeService);

      console.log(chalk.blue(`Syncing MCP config from "${source}" into OSSA registry (${options.dir})...`));

      const result = await service.sync(source, options.dir);

      console.log(chalk.green(`\n✓ MCP Bridge sync completed`));
      console.log(chalk.gray(`  Source:            ${result.source}`));
      console.log(chalk.gray(`  Servers found:     ${result.serversFound}`));
      console.log(chalk.gray(`  Servers imported:  ${result.serversImported}`));
      console.log(chalk.gray(`  Registry:          ${result.registryPath}`));

      if (result.servers.length > 0) {
        console.log(chalk.cyan(`\n  Newly imported servers:`));
        for (const s of result.servers) {
          const loc = s.command ? `cmd: ${s.command} ${(s.args ?? []).join(' ')}` : `url: ${s.url}`;
          console.log(chalk.gray(`    • ${s.name} [${s.transport}]  ${loc}`));
          if (s.tools && s.tools.length > 0) {
            console.log(chalk.gray(`      tools (via SDK): ${s.tools.join(', ')}`));
          }
        }
      } else {
        console.log(chalk.yellow(`\n  All servers from "${source}" are already registered.`));
      }
    } catch (error) {
      console.error(chalk.red('Bridge sync error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * ossa mcp bridge list
 */
bridgeCommand
  .command('list')
  .description('List all MCP servers registered in the OSSA bridge registry')
  .option('--dir <directory>', 'Base workspace directory', '.')
  .action(async (options: { dir: string }) => {
    try {
      const { container } = await import('../../di-container.js');
      const { McpBridgeService } = await import('../../services/mcp/bridge.service.js');
      const service = container.get(McpBridgeService);

      const result = await service.list(options.dir);

      if (result.servers.length === 0) {
        console.log(chalk.yellow('No MCP servers registered in OSSA bridge.'));
        console.log(chalk.gray(`  Run: ossa mcp bridge sync <cursor|claude-desktop>`));
        return;
      }

      console.log(chalk.green(`\nOSSA MCP Bridge Registry (${result.servers.length} servers)`));
      console.log(chalk.gray(`  Registry: ${result.registryPath}\n`));
      for (const s of result.servers) {
        console.log(chalk.cyan(`  • ${s.name}`));
        console.log(chalk.gray(`    source:    ${s.source}`));
        console.log(chalk.gray(`    transport: ${s.transport}`));
        if (s.command) console.log(chalk.gray(`    command:   ${s.command} ${(s.args ?? []).join(' ')}`));
        if (s.url) console.log(chalk.gray(`    url:       ${s.url}`));
        if (s.tools?.length) console.log(chalk.gray(`    tools:     ${s.tools.join(', ')}`));
        console.log(chalk.gray(`    imported:  ${s.importedAt}`));
      }
    } catch (error) {
      console.error(chalk.red('Bridge list error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * ossa mcp bridge check <agentId> <toolName>
 */
bridgeCommand
  .command('check <agentId> <toolName>')
  .description('Validate whether OSSA policy allows agentId to call toolName (format: serverName/method)')
  .option('--dir <directory>', 'Base workspace directory', '.')
  .action(async (agentId: string, toolName: string, options: { dir: string }) => {
    try {
      const { container } = await import('../../di-container.js');
      const { McpBridgeService } = await import('../../services/mcp/bridge.service.js');
      const service = container.get(McpBridgeService);

      const result = await service.executeTool(agentId, toolName, options.dir);
      console.log(result.allowed ? chalk.green(`✓ ALLOWED`) : chalk.red(`✗ DENIED`));
      console.log(chalk.gray(`  ${result.reason}`));
    } catch (error) {
      console.error(chalk.red('Bridge check error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

mcpCommand.addCommand(bridgeCommand);

export { mcpCommand };
