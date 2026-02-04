/**
 * OSSA Dev Command
 *
 * Development server with hot reload and live validation
 *
 * Features:
 * - Watch manifest files for changes
 * - Real-time validation
 * - WebSocket updates
 * - Test UI with live feedback
 *
 * Usage:
 *   ossa dev <path>              # Watch single file or directory
 *   ossa dev <path> --port 3000  # Custom port
 *   ossa dev <path> --open       # Auto-open browser
 *   ossa dev <path> --verbose    # Verbose logging
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { DevServer } from '../../services/dev-server/dev-server.service.js';

export const devCommand = new Command('dev')
  .argument('<path>', 'Path to OSSA manifest file or directory to watch')
  .option('-p, --port <port>', 'HTTP server port', '3000')
  .option('--open', 'Auto-open browser', false)
  .option('-d, --debounce <ms>', 'Debounce delay for file changes (ms)', '300')
  .option('-v, --verbose', 'Verbose logging', false)
  .description('Start development server with hot reload and live validation')
  .action(
    async (
      watchPath: string,
      options: {
        port?: string;
        open?: boolean;
        debounce?: string;
        verbose?: boolean;
      }
    ) => {
      try {
        // Parse options
        const port = parseInt(options.port || '3000', 10);
        const debounceMs = parseInt(options.debounce || '300', 10);

        if (isNaN(port) || port < 1 || port > 65535) {
          console.error(chalk.red('Invalid port number'));
          process.exit(1);
        }

        if (isNaN(debounceMs) || debounceMs < 0) {
          console.error(chalk.red('Invalid debounce delay'));
          process.exit(1);
        }

        // Create dev server
        const server = new DevServer({
          watch: watchPath,
          port,
          open: options.open || false,
          debounceMs,
          verbose: options.verbose || false,
        });

        // Handle graceful shutdown
        let isShuttingDown = false;

        const shutdown = async () => {
          if (isShuttingDown) return;
          isShuttingDown = true;

          console.log('\n');
          await server.stop();
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        // Start server
        await server.start();

        // Keep process alive
        await new Promise(() => {
          // Never resolves - server runs until interrupted
        });
      } catch (error: any) {
        console.error(chalk.red('\n❌ Error starting dev server:'));
        console.error(chalk.red(error.message));

        if (options.verbose && error.stack) {
          console.error(chalk.gray(error.stack));
        }

        process.exit(1);
      }
    }
  );
