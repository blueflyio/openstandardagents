/**
 * OSSA Wizard Command
 * 
 * Interactive wizard that walks users through creating a complete OSSA agent
 * step-by-step with helpful guidance and examples.
 * 
 * SOLID: Single Responsibility - Agent creation wizard only
 * DRY: Reuses existing services and utilities
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import readline from 'readline';
import type { OssaAgent } from '../../types/index.js';
import { getApiVersion } from '../../utils/version.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

function printSection(title: string) {
  console.log('');
  console.log(chalk.blue.bold('═'.repeat(60)));
  console.log(chalk.blue.bold(`  ${title}`));
  console.log(chalk.blue.bold('═'.repeat(60)));
  console.log('');
}

function printStep(step: number, total: number, description: string) {
  console.log(chalk.cyan(`\n[Step ${step}/${total}] ${description}`));
  console.log(chalk.gray('─'.repeat(60)));
}

function printExample(text: string) {
  console.log(chalk.gray(`  Example: ${text}`));
}

function printInfo(text: string) {
  console.log(chalk.blue(`  ℹ ${text}`));
}

function validateDNS1123(name: string): boolean {
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name) && name.length <= 253;
}

function validateVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(version);
}

async function askWithValidation(
  prompt: string,
  validator: (value: string) => boolean,
  errorMsg: string,
  defaultValue?: string
): Promise<string> {
  while (true) {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    const answer = await question(chalk.blue(`${prompt}${defaultText}: `));
    const value = answer.trim() || defaultValue || '';
    
    if (!value) {
      console.log(chalk.red('  ✗ This field is required'));
      continue;
    }
    
    if (validator(value)) {
      return value;
    }
    
    console.log(chalk.red(`  ✗ ${errorMsg}`));
  }
}

async function askYesNo(prompt: string, defaultValue: boolean = false): Promise<boolean> {
  const defaultText = defaultValue ? 'Y/n' : 'y/N';
  const answer = await question(chalk.blue(`${prompt} (${defaultText}): `));
  const normalized = answer.trim().toLowerCase();
  
  if (!normalized) return defaultValue;
  return normalized === 'y' || normalized === 'yes';
}

async function askChoice<T>(
  prompt: string,
  choices: Array<{ value: T; label: string; description?: string }>,
  defaultValue?: T
): Promise<T> {
  console.log(chalk.blue(`${prompt}`));
  choices.forEach((choice, index) => {
    const marker = defaultValue === choice.value ? chalk.green('→') : ' ';
    const desc = choice.description ? chalk.gray(` - ${choice.description}`) : '';
    console.log(`  ${marker} ${index + 1}. ${choice.label}${desc}`);
  });
  
  while (true) {
    const answer = await question(chalk.blue(`\nSelect (1-${choices.length}): `));
    const index = parseInt(answer.trim()) - 1;
    
    if (index >= 0 && index < choices.length) {
      return choices[index].value;
    }
    
    if (!answer.trim() && defaultValue) {
      return defaultValue;
    }
    
    console.log(chalk.red(`  ✗ Please enter a number between 1 and ${choices.length}`));
  }
}

async function askMultiChoice<T>(
  prompt: string,
  choices: Array<{ value: T; label: string; description?: string }>,
  defaultValue: T[] = []
): Promise<T[]> {
  console.log(chalk.blue(`${prompt}`));
  choices.forEach((choice, index) => {
    const selected = defaultValue.includes(choice.value) ? chalk.green('✓') : ' ';
    const desc = choice.description ? chalk.gray(` - ${choice.description}`) : '';
    console.log(`  ${selected} ${index + 1}. ${choice.label}${desc}`);
  });
  
  const answer = await question(chalk.blue(`\nSelect (comma-separated numbers, e.g., 1,3,5): `));
  
  if (!answer.trim() && defaultValue.length > 0) {
    return defaultValue;
  }
  
  const indices = answer
    .split(',')
    .map(s => parseInt(s.trim()) - 1)
    .filter(i => i >= 0 && i < choices.length);
  
  return indices.map(i => choices[i].value);
}

export const wizardCommand = new Command('wizard')
  .description('Interactive wizard to create a complete OSSA agent step-by-step')
  .option('-o, --output <path>', 'Output file path', 'agent.ossa.yaml')
  .option('-d, --directory <dir>', 'Create agent in directory structure', '.agents')
  .action(async (options?: { output?: string; directory?: string }) => {
    try {
      printSection('OSSA Agent Creation Wizard');
      console.log(chalk.gray('This wizard will guide you through creating a complete OSSA agent.'));
      console.log(chalk.gray('You can press Enter to use defaults or skip optional sections.\n'));

      const agent: Partial<OssaAgent> = {
        apiVersion: getApiVersion(),
        kind: 'Agent',
        metadata: {},
        spec: {},
      };

      // ========================================================================
      // STEP 1: Basic Information
      // ========================================================================
      printStep(1, 9, 'Basic Agent Information');

      const agentName = await askWithValidation(
        'Agent ID (DNS-1123 format, lowercase alphanumeric with hyphens)',
        validateDNS1123,
        'Must be DNS-1123 compliant (e.g., "my-agent", "code-reviewer")',
        'my-agent'
      );
      printExample('my-agent, code-reviewer, security-scanner');

      const displayName = await question(chalk.blue(`Display Name (default: ${agentName}): `)) || agentName;
      
      const description = await question(chalk.blue('Description (what does this agent do?): ')) || 
        `${displayName} - An OSSA-compliant agent`;

      const version = await askWithValidation(
        'Version (semver format)',
        validateVersion,
        'Must be semver format (e.g., 1.0.0, 0.1.0-beta)',
        '1.0.0'
      );
      printExample('1.0.0, 0.1.0, 2.3.4-beta');

      agent.metadata = {
        name: agentName,
        version,
        description,
      };

      // ========================================================================
      // STEP 2: Agent Role & System Prompt
      // ========================================================================
      printStep(2, 9, 'Agent Role & System Prompt');

      printInfo('Define the agent\'s role, capabilities, and behavior guidelines.');
      printInfo('This becomes the system prompt that guides the agent\'s actions.\n');

      const role = await question(chalk.blue('System Prompt / Role (detailed description):\n') + 
        chalk.gray('  (Press Enter twice when done, or type "skip" for template)\n')) || 
        `You are ${displayName}. ${description}\n\nYour responsibilities:\n- Provide helpful and accurate assistance\n- Follow best practices and safety guidelines\n- Be transparent about your capabilities and limitations`;

      agent.spec = {
        ...agent.spec,
        role: role === 'skip' ? `You are ${displayName}. ${description}` : role,
      };

      // ========================================================================
      // STEP 3: LLM Provider & Model
      // ========================================================================
      printStep(3, 9, 'LLM Configuration');

      const llmProvider = await askChoice(
        'Select LLM Provider:',
        [
          { value: 'anthropic', label: 'Anthropic Claude', description: 'Claude Sonnet, Opus, Haiku' },
          { value: 'openai', label: 'OpenAI', description: 'GPT-4, GPT-3.5' },
          { value: 'google', label: 'Google', description: 'Gemini Pro, Gemini Ultra' },
          { value: 'mistral', label: 'Mistral AI', description: 'Mistral Large, Mixtral' },
          { value: 'cohere', label: 'Cohere', description: 'Command R+' },
        ],
        'anthropic'
      );

      const modelChoices: Record<string, Array<{ value: string; label: string }>> = {
        anthropic: [
          { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (recommended)' },
          { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
          { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4' },
        ],
        openai: [
          { value: 'gpt-4o', label: 'GPT-4o (recommended)' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        ],
        google: [
          { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (recommended)' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        ],
        mistral: [
          { value: 'mistral-large-latest', label: 'Mistral Large' },
          { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
        ],
        cohere: [
          { value: 'command-r-plus', label: 'Command R+' },
          { value: 'command-r', label: 'Command R' },
        ],
      };

      const model = await askChoice(
        'Select Model:',
        modelChoices[llmProvider] || [{ value: 'default', label: 'Default' }],
        modelChoices[llmProvider]?.[0]?.value
      );

      const temperature = await question(chalk.blue('Temperature (0.0-2.0, default: 0.7): ')) || '0.7';
      const tempValue = parseFloat(temperature);
      const validTemp = isNaN(tempValue) ? 0.7 : Math.max(0, Math.min(2, tempValue));

      agent.spec.llm = {
        provider: llmProvider,
        model,
        temperature: validTemp,
      };

      // ========================================================================
      // STEP 4: Tools
      // ========================================================================
      printStep(4, 9, 'Tools & Capabilities');

      printInfo('Tools allow your agent to interact with external systems.');
      printInfo('You can add MCP servers, function tools, or skip for now.\n');

      const addTools = await askYesNo('Do you want to add tools?', false);
      const tools: any[] = [];

      if (addTools) {
        while (true) {
          const toolType = await askChoice(
            'Select Tool Type:',
            [
              { value: 'mcp', label: 'MCP Server', description: 'Model Context Protocol server' },
              { value: 'function', label: 'Function Tool', description: 'Custom function definition' },
              { value: 'done', label: 'Done adding tools' },
            ],
            'mcp'
          );

          if (toolType === 'done') break;

          if (toolType === 'mcp') {
            const mcpName = await question(chalk.blue('MCP Server Name (e.g., github, filesystem): '));
            const mcpServer = await question(chalk.blue('MCP Server Command (e.g., npx -y @modelcontextprotocol/server-github): '));
            const mcpDesc = await question(chalk.blue('Description (optional): ')) || '';

            tools.push({
              type: 'mcp',
              name: mcpName,
              description: mcpDesc || `MCP server: ${mcpName}`,
              config: {
                server: mcpServer,
              },
            });

            printInfo(`Added MCP server: ${mcpName}`);
          } else if (toolType === 'function') {
            const funcName = await question(chalk.blue('Function Name (snake_case): '));
            const funcDesc = await question(chalk.blue('Description: '));
            const funcInput = await question(chalk.blue('Input Schema (JSON, or press Enter for simple object): ')) || '{}';

            try {
              const inputSchema = JSON.parse(funcInput);
              tools.push({
                type: 'function',
                name: funcName,
                description: funcDesc,
                input_schema: inputSchema,
              });
              printInfo(`Added function tool: ${funcName}`);
            } catch {
              console.log(chalk.red('  ✗ Invalid JSON schema'));
            }
          }
        }
      }

      if (tools.length > 0) {
        agent.spec.tools = tools;
      }

      // ========================================================================
      // STEP 5: Safety Controls
      // ========================================================================
      printStep(5, 9, 'Safety & Security Controls');

      printInfo('Configure content filtering, PII detection, rate limiting, and guardrails.\n');

      const addSafety = await askYesNo('Do you want to configure safety controls?', false);

      if (addSafety) {
        const contentFiltering = await askYesNo('Enable content filtering?', true);
        const piiDetection = await askYesNo('Enable PII detection?', true);
        const rateLimiting = await askYesNo('Enable rate limiting?', false);

        const safety: any = {};

        if (contentFiltering) {
          const categories = await askMultiChoice(
            'Select content categories to filter:',
            [
              { value: 'hate_speech', label: 'Hate Speech' },
              { value: 'violence', label: 'Violence' },
              { value: 'self_harm', label: 'Self Harm' },
              { value: 'illegal_activity', label: 'Illegal Activity' },
            ],
            ['hate_speech', 'violence']
          );

          safety.content_filtering = {
            enabled: true,
            categories,
            threshold: 'medium',
            action: 'block',
          };
        }

        if (piiDetection) {
          const piiTypes = await askMultiChoice(
            'Select PII types to detect:',
            [
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone Number' },
              { value: 'ssn', label: 'SSN' },
              { value: 'credit_card', label: 'Credit Card' },
              { value: 'api_key', label: 'API Key' },
              { value: 'password', label: 'Password' },
              { value: 'ip_address', label: 'IP Address' },
            ],
            ['email', 'phone', 'ssn', 'credit_card']
          );

          safety.pii_detection = {
            enabled: true,
            types: piiTypes,
            action: 'redact',
          };
        }

        if (rateLimiting) {
          const rpm = await question(chalk.blue('Requests per minute (default: 30): ')) || '30';
          safety.rate_limiting = {
            enabled: true,
            requests_per_minute: parseInt(rpm) || 30,
            burst_limit: 5,
          };
        }

        if (Object.keys(safety).length > 0) {
          agent.spec.safety = safety;
        }
      }

      // ========================================================================
      // STEP 6: Autonomy Level
      // ========================================================================
      printStep(6, 9, 'Autonomy & Human-in-the-Loop');

      printInfo('Configure how autonomous the agent should be and when human approval is required.\n');

      const configureAutonomy = await askYesNo('Do you want to configure autonomy settings?', false);

      if (configureAutonomy) {
        const autonomyLevel = await askChoice(
          'Autonomy Level:',
          [
            { value: 'full', label: 'Full Autonomy', description: 'No human approval required' },
            { value: 'assisted', label: 'Assisted', description: 'Human approval for sensitive actions' },
            { value: 'supervised', label: 'Supervised', description: 'Human approval for most actions' },
          ],
          'assisted'
        );

        const autonomy: any = {
          level: autonomyLevel,
        };

        if (autonomyLevel !== 'full') {
          const approvalActions = await askMultiChoice(
            'Actions requiring approval:',
            [
              { value: 'delete_data', label: 'Delete Data' },
              { value: 'modify_permissions', label: 'Modify Permissions' },
              { value: 'external_api_calls', label: 'External API Calls' },
              { value: 'deploy_code', label: 'Deploy Code' },
              { value: 'modify_production', label: 'Modify Production' },
            ],
            ['delete_data', 'modify_permissions', 'deploy_code']
          );

          autonomy.approval_required = approvalActions;
        }

        agent.spec.autonomy = autonomy;
      }

      // ========================================================================
      // STEP 7: Observability
      // ========================================================================
      printStep(7, 9, 'Observability & Monitoring');

      printInfo('Configure tracing, metrics, and logging for production monitoring.\n');

      const addObservability = await askYesNo('Do you want to configure observability?', false);

      if (addObservability) {
        const tracing = await askYesNo('Enable tracing (OpenTelemetry)?', true);
        const metrics = await askYesNo('Enable metrics?', true);
        const logging = await askYesNo('Enable structured logging?', true);

        const observability: any = {};

        if (tracing) {
          observability.tracing = {
            enabled: true,
            exporter: 'otlp',
            endpoint: '${OTEL_ENDPOINT:-http://localhost:4317}',
          };
        }

        if (metrics) {
          observability.metrics = {
            enabled: true,
            custom_labels: {
              service: agentName,
              environment: 'production',
            },
          };
        }

        if (logging) {
          observability.logging = {
            level: 'info',
            include_prompts: false,
            include_responses: false,
          };
        }

        if (Object.keys(observability).length > 0) {
          agent.spec.observability = observability;
        }
      }

      // ========================================================================
      // STEP 8: Platform Extensions
      // ========================================================================
      printStep(8, 9, 'Platform Extensions');

      printInfo('Enable platform-specific integrations (Cursor, OpenAI, LangChain, etc.).\n');

      const addExtensions = await askYesNo('Do you want to add platform extensions?', false);

      if (addExtensions) {
        const platforms = await askMultiChoice(
          'Select platforms to enable:',
          [
            { value: 'cursor', label: 'Cursor', description: 'Cursor IDE integration' },
            { value: 'openai', label: 'OpenAI Assistants', description: 'OpenAI Assistants API' },
            { value: 'langchain', label: 'LangChain', description: 'LangChain framework' },
            { value: 'langflow', label: 'Langflow', description: 'Langflow visual builder' },
            { value: 'crewai', label: 'CrewAI', description: 'CrewAI multi-agent' },
            { value: 'anthropic', label: 'Anthropic', description: 'Anthropic platform' },
            { value: 'vercel', label: 'Vercel AI', description: 'Vercel AI SDK' },
            { value: 'llamaindex', label: 'LlamaIndex', description: 'LlamaIndex RAG' },
          ],
          []
        );

        if (platforms.length > 0) {
          agent.extensions = {};

          platforms.forEach(platform => {
            if (platform === 'cursor') {
              agent.extensions!.cursor = { enabled: true, agent_type: 'composer' };
            } else if (platform === 'openai') {
              agent.extensions!.openai_agents = { enabled: true };
            } else if (platform === 'crewai') {
              agent.extensions!.crewai = { enabled: true, agent_type: 'worker' };
            } else if (platform === 'langchain') {
              agent.extensions!.langchain = { enabled: true };
            } else if (platform === 'langflow') {
              agent.extensions!.langflow = { enabled: true };
            } else if (platform === 'anthropic') {
              agent.extensions!.anthropic = { enabled: true };
            } else if (platform === 'vercel') {
              agent.extensions!.vercel_ai = { enabled: true };
            } else if (platform === 'llamaindex') {
              agent.extensions!.llamaindex = { enabled: true };
            }
          });
        }
      }

      // ========================================================================
      // STEP 9: Output & Summary
      // ========================================================================
      printStep(9, 9, 'Output & Summary');

      const useDirectory = await askYesNo('Create agent in directory structure (.agents/)?', false);
      
      let outputPath: string;
      if (useDirectory && options?.directory) {
        const agentDir = path.join(options.directory, agentName);
        fs.mkdirSync(agentDir, { recursive: true });
        outputPath = path.join(agentDir, 'manifest.ossa.yaml');
      } else {
        outputPath = options?.output || 'agent.ossa.yaml';
      }

      // Summary
      console.log('');
      printSection('Summary');
      console.log(chalk.green('✓ Agent Name:'), agent.metadata?.name);
      console.log(chalk.green('✓ Version:'), agent.metadata?.version);
      console.log(chalk.green('✓ LLM:'), `${agent.spec.llm?.provider}/${agent.spec.llm?.model}`);
      console.log(chalk.green('✓ Tools:'), agent.spec.tools?.length || 0);
      console.log(chalk.green('✓ Safety Controls:'), agent.spec.safety ? 'Yes' : 'No');
      console.log(chalk.green('✓ Autonomy:'), agent.spec.autonomy?.level || 'Not configured');
      console.log(chalk.green('✓ Observability:'), agent.spec.observability ? 'Yes' : 'No');
      console.log(chalk.green('✓ Extensions:'), agent.extensions ? Object.keys(agent.extensions).length : 0);
      console.log(chalk.green('✓ Output:'), outputPath);
      console.log('');

      // Write file
      const yamlContent = yaml.stringify(agent as OssaAgent, {
        indent: 2,
        lineWidth: 0,
      });

      fs.writeFileSync(outputPath, yamlContent, 'utf-8');

      console.log(chalk.green.bold('✓ Agent created successfully!'));
      console.log('');
      console.log(chalk.blue('Next steps:'));
      console.log(chalk.gray(`  1. Review: ${outputPath}`));
      console.log(chalk.gray(`  2. Validate: ossa validate ${outputPath}`));
      console.log(chalk.gray(`  3. Test: ossa run ${outputPath}`));
      if (useDirectory) {
        console.log(chalk.gray(`  4. Register: ossa workspace discover`));
      }

      rl.close();
      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      rl.close();
      process.exit(1);
    }
  });
