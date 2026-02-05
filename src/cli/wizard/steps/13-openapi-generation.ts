/**
 * Step 13: Generate OpenAPI Specification
 * Uses OSSA OpenAPIAdapter to generate OpenAPI spec from manifest
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { OpenAPIAdapter } from '../../../adapters/openapi-adapter.js';
import { ManifestRepository } from '../../../repositories/manifest.repository.js';
import type { WizardState, WizardOptions } from '../types.js';
import { console_ui } from '../ui/console.js';
import * as yaml from 'yaml';

export async function generateOpenAPIStep(
  state: WizardState,
  options: WizardOptions
): Promise<WizardState> {
  console_ui.step(14, state.totalSteps, 'Generate OpenAPI Specification');

  const agentName = state.agent.metadata?.name;
  if (!agentName) {
    console_ui.error('Agent name is required');
    return state;
  }

  console_ui.info('Generating OpenAPI 3.1 specification from OSSA manifest...');
  console_ui.info(
    'This will create openapi.yaml with all agent capabilities as API endpoints.'
  );

  const { generateOpenAPI } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateOpenAPI',
      message: 'Generate OpenAPI specification?',
      default: true,
    },
  ]);

  if (!generateOpenAPI) {
    console_ui.warning('Skipping OpenAPI generation');
    return state;
  }

  try {
    // Determine output directory based on structure type
    const basePath = options.directory || '.agents';
    const agentDir = path.join(basePath, agentName);
    const openapiPath = path.join(agentDir, 'openapi.yaml');

    // Ensure directory exists
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }

    // Convert OSSA manifest to OpenAPI using OpenAPIAdapter
    const manifest = state.agent as any;
    const openapi = OpenAPIAdapter.toOpenAPI(manifest);

    // Write OpenAPI spec
    const openapiContent = yaml.stringify(openapi, { indent: 2, lineWidth: 0 });
    fs.writeFileSync(openapiPath, openapiContent, 'utf-8');

    console_ui.success('OpenAPI specification generated');
    console_ui.info(`Saved to: ${openapiPath}`);

    // Show summary
    const pathCount = Object.keys(openapi.paths || {}).length;
    console_ui.info(`Generated ${pathCount} API endpoint(s)`);

    return state;
  } catch (error) {
    console_ui.error('Failed to generate OpenAPI specification');
    console_ui.error(error instanceof Error ? error.message : String(error));
    return state;
  }
}
