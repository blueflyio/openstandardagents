/**
 * OSSA Tool Validate Command
 * Validate tool configurations against OSSA schema
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import { container } from '../../../di-container.js';
import { ValidationService } from '../../../services/validation.service.js';
import { validateToolConfig, type Tool } from '../../../types/tool.js';
import {
  addGlobalOptions,
  shouldUseColor,
  ExitCode,
} from '../../utils/standard-options.js';

interface ValidateToolOptions {
  strict?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  color?: boolean;
}

export const toolValidateCommand = new Command('validate')
  .argument('<path>', 'Path to tool configuration file (JSON or YAML)')
  .option('--strict', 'Use strict schema validation', false)
  .description('Validate OSSA tool configuration against schema')
  .action(async (path: string, options: ValidateToolOptions) => {
    const useColor = shouldUseColor(options);
    const log = (msg: string, color?: (s: string) => string) => {
      if (options.quiet) return;
      const output = useColor && color ? color(msg) : msg;
      console.log(output);
    };

    try {
      // Load tool configuration
      if (!fs.existsSync(path)) {
        throw new Error(`File not found: ${path}`);
      }

      const content = fs.readFileSync(path, 'utf-8');
      let tool: Tool;

      try {
        tool = JSON.parse(content);
      } catch (parseError) {
        throw new Error(
          `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        );
      }

      log(`Validating tool configuration: ${path}`, chalk.blue);

      // Basic validation using type guards
      const errors = validateToolConfig(tool);

      if (errors.length > 0) {
        if (options.json) {
          console.log(
            JSON.stringify(
              {
                valid: false,
                path,
                errors: errors.map((e) => ({ message: e })),
              },
              null,
              2
            )
          );
        } else {
          console.error(chalk.red('✗ Validation Failed\n'));
          console.error(chalk.red(`Found ${errors.length} error(s):\n`));
          errors.forEach((error, index) => {
            console.error(chalk.red(`  ${index + 1}. ${error}`));
          });
        }
        process.exit(ExitCode.GENERAL_ERROR);
      }

      // Success
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              valid: true,
              path,
              tool: {
                type: tool.type,
                name: tool.name,
                description: tool.description,
              },
            },
            null,
            2
          )
        );
      } else {
        log('✓ Tool configuration is valid', chalk.green);

        if (options.verbose) {
          log('\nTool Details:', chalk.gray);
          log(`  Type: ${useColor ? chalk.cyan(tool.type) : tool.type}`);
          log(`  Name: ${useColor ? chalk.cyan(tool.name) : tool.name}`);
          if (tool.description) {
            log(
              `  Description: ${useColor ? chalk.cyan(tool.description) : tool.description}`
            );
          }
          if (tool.server) {
            log(
              `  Server: ${useColor ? chalk.cyan(tool.server) : tool.server}`
            );
          }
          if (tool.endpoint) {
            log(
              `  Endpoint: ${useColor ? chalk.cyan(tool.endpoint) : tool.endpoint}`
            );
          }
          if (tool.config) {
            log(
              `  Config: ${useColor ? chalk.cyan(JSON.stringify(tool.config)) : JSON.stringify(tool.config)}`
            );
          }
        }
      }

      process.exit(ExitCode.SUCCESS);
    } catch (error) {
      if (!options.quiet) {
        const errMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(useColor ? chalk.red(errMsg) : errMsg);

        if (options.verbose && error instanceof Error) {
          const stack = error.stack || '';
          console.error(useColor ? chalk.gray(stack) : stack);
        }
      }

      process.exit(ExitCode.GENERAL_ERROR);
    }
  });

// Apply standard options
addGlobalOptions(toolValidateCommand);
