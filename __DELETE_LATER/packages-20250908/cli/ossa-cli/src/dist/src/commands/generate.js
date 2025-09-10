import { Command } from 'commander';
import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const generateCommand = new Command('generate')
    .description('Generate SDKs, clients, and framework adapters from OSSA specifications')
    .addCommand(new Command('client')
    .description('Generate client SDKs in multiple languages')
    .option('-l, --lang <language>', 'Target language (python, typescript, go, java, rust, csharp)', 'typescript')
    .option('-o, --output <path>', 'Output directory', './generated/clients')
    .option('-s, --spec <path>', 'OSSA specification file', '../../api/schemas/agent.yaml')
    .option('-t, --template <path>', 'Custom template directory')
    .option('--additional-properties <props>', 'Additional generator properties')
    .action(generateClient))
    .addCommand(new Command('server')
    .description('Generate server stubs and implementations')
    .option('-l, --lang <language>', 'Target language/framework', 'nodejs-express')
    .option('-o, --output <path>', 'Output directory', './generated/servers')
    .option('-s, --spec <path>', 'OSSA specification file', '../../api/schemas/agent.yaml')
    .action(generateServer))
    .addCommand(new Command('adapter')
    .description('Generate framework-specific adapters')
    .option('-f, --framework <framework>', 'Target framework (langchain, crewai, openai, anthropic)', 'langchain')
    .option('-o, --output <path>', 'Output directory', './generated/adapters')
    .option('-s, --spec <path>', 'OSSA specification file', '../../api/schemas/agent.yaml')
    .action(generateAdapter))
    .addCommand(new Command('docs')
    .description('Generate comprehensive documentation')
    .option('-f, --format <format>', 'Documentation format (redoc, swagger-ui, gitbook)', 'redoc')
    .option('-o, --output <path>', 'Output directory', './generated/docs')
    .option('-s, --spec <path>', 'OSSA specification file', '../../api/schemas/agent.yaml')
    .action(generateDocs))
    .addCommand(new Command('discovery')
    .description('Generate UADP discovery clients')
    .option('-l, --lang <language>', 'Target language', 'typescript')
    .option('-o, --output <path>', 'Output directory', './generated/discovery')
    .action(generateDiscovery))
    .addCommand(new Command('all')
    .description('Generate complete SDK ecosystem (all languages + frameworks)')
    .option('-o, --output <path>', 'Base output directory', './generated')
    .option('-s, --spec <path>', 'OSSA specification file', '../../api/schemas/agent.yaml')
    .action(generateAll));
async function generateClient(options) {
    const spinner = ora(`Generating ${options.lang} client SDK...`).start();
    try {
        const specPath = path.resolve(options.spec || '../../api/schemas/agent.yaml');
        const outputPath = path.resolve(options.output || './generated/clients');
        // Ensure spec exists
        if (!await fs.pathExists(specPath)) {
            throw new Error(`OSSA specification not found: ${specPath}`);
        }
        // Create output directory
        await fs.ensureDir(outputPath);
        const generatorMap = {
            'python': 'python',
            'typescript': 'typescript-fetch',
            'javascript': 'javascript',
            'go': 'go',
            'java': 'java',
            'rust': 'rust',
            'csharp': 'csharp',
            'php': 'php',
            'ruby': 'ruby',
            'kotlin': 'kotlin',
            'swift': 'swift'
        };
        const generator = generatorMap[options.lang || 'typescript'];
        if (!generator) {
            throw new Error(`Unsupported language: ${options.lang}`);
        }
        // Generate client using OpenAPI Generator
        const args = [
            'generate',
            '-i', specPath,
            '-g', generator,
            '-o', path.join(outputPath, options.lang || 'typescript'),
            '--additional-properties', `packageName=@ossa/${options.lang}-sdk,packageVersion=0.1.8`
        ];
        if (options.template) {
            args.push('-t', options.template);
        }
        if (options.additionalProperties) {
            args.push('--additional-properties', options.additionalProperties);
        }
        await execa('npx', ['@openapitools/openapi-generator-cli', ...args]);
        spinner.succeed(`${chalk.green('✓')} ${options.lang} client SDK generated at ${outputPath}`);
        // Generate package.json for the SDK
        await generateSDKPackageJson(outputPath, options.lang || 'typescript');
    }
    catch (error) {
        spinner.fail(`Failed to generate ${options.lang} client: ${error.message}`);
        throw error;
    }
}
async function generateServer(options) {
    const spinner = ora(`Generating ${options.lang} server stub...`).start();
    try {
        const specPath = path.resolve(options.spec || '../../api/schemas/agent.yaml');
        const outputPath = path.resolve(options.output || './generated/servers');
        await fs.ensureDir(outputPath);
        const serverGenerators = {
            'nodejs-express': 'nodejs-express-server',
            'python-flask': 'python-flask',
            'go-gin': 'go-gin-server',
            'java-spring': 'spring',
            'rust-axum': 'rust-server'
        };
        const generator = serverGenerators[options.lang || 'nodejs-express'];
        await execa('npx', [
            '@openapitools/openapi-generator-cli',
            'generate',
            '-i', specPath,
            '-g', generator,
            '-o', path.join(outputPath, options.lang || 'nodejs-express')
        ]);
        spinner.succeed(`${chalk.green('✓')} Server stub generated at ${outputPath}`);
    }
    catch (error) {
        spinner.fail(`Failed to generate server: ${error.message}`);
        throw error;
    }
}
async function generateAdapter(options) {
    const spinner = ora(`Generating ${options.framework} framework adapter...`).start();
    try {
        const outputPath = path.resolve(options.output || './generated/adapters');
        await fs.ensureDir(outputPath);
        // Generate framework-specific adapters
        const adapterTemplates = {
            'langchain': generateLangChainAdapter,
            'crewai': generateCrewAIAdapter,
            'openai': generateOpenAIAdapter,
            'anthropic': generateAnthropicAdapter
        };
        const generator = adapterTemplates[options.framework];
        if (!generator) {
            throw new Error(`Unsupported framework: ${options.framework}`);
        }
        await generator(outputPath, options);
        spinner.succeed(`${chalk.green('✓')} ${options.framework} adapter generated at ${outputPath}`);
    }
    catch (error) {
        spinner.fail(`Failed to generate ${options.framework} adapter: ${error.message}`);
        throw error;
    }
}
async function generateDocs(options) {
    const spinner = ora(`Generating ${options.format} documentation...`).start();
    try {
        const specPath = path.resolve(options.spec || '../../api/schemas/agent.yaml');
        const outputPath = path.resolve(options.output || './generated/docs');
        await fs.ensureDir(outputPath);
        if (options.format === 'redoc') {
            // Generate ReDoc documentation
            await execa('npx', [
                'redoc-cli',
                'bundle', specPath,
                '--output', path.join(outputPath, 'index.html')
            ]);
        }
        else if (options.format === 'swagger-ui') {
            // Generate Swagger UI
            await execa('npx', [
                '@openapitools/openapi-generator-cli',
                'generate',
                '-i', specPath,
                '-g', 'html2',
                '-o', outputPath
            ]);
        }
        spinner.succeed(`${chalk.green('✓')} Documentation generated at ${outputPath}`);
    }
    catch (error) {
        spinner.fail(`Failed to generate documentation: ${error.message}`);
        throw error;
    }
}
async function generateDiscovery(options) {
    const spinner = ora(`Generating UADP discovery client...`).start();
    try {
        const outputPath = path.resolve(options.output || './generated/discovery');
        await fs.ensureDir(outputPath);
        // Generate UADP discovery client template
        const discoveryClient = `
// OSSA v0.1.8 Universal Agent Discovery Protocol (UADP) Client
// Auto-generated from OSSA specification

export interface UADPClient {
  discoverAgents(capabilities?: string[], domain?: string): Promise<Agent[]>;
  registerAgent(agent: Agent): Promise<void>;
  heartbeat(agentId: string): Promise<void>;
}

export class OSSADiscoveryClient implements UADPClient {
  constructor(private endpoint: string) {}

  async discoverAgents(capabilities?: string[], domain?: string): Promise<Agent[]> {
    const params = new URLSearchParams();
    if (capabilities?.length) params.append('capabilities', capabilities.join(','));
    if (domain) params.append('domain', domain);

    const response = await fetch(\`\${this.endpoint}/discover?\${params}\`);
    const result = await response.json();
    return result.agents || [];
  }

  async registerAgent(agent: Agent): Promise<void> {
    await fetch(\`\${this.endpoint}/agents\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    });
  }

  async heartbeat(agentId: string): Promise<void> {
    await fetch(\`\${this.endpoint}/agents/\${agentId}/heartbeat\`, {
      method: 'POST'
    });
  }
}
`;
        await fs.writeFile(path.join(outputPath, 'uadp-client.ts'), discoveryClient);
        spinner.succeed(`${chalk.green('✓')} UADP discovery client generated at ${outputPath}`);
    }
    catch (error) {
        spinner.fail(`Failed to generate discovery client: ${error.message}`);
        throw error;
    }
}
async function generateAll(options) {
    const spinner = ora('Generating complete SDK ecosystem...').start();
    try {
        const languages = ['typescript', 'python', 'go', 'java', 'rust', 'csharp'];
        const frameworks = ['langchain', 'crewai', 'openai', 'anthropic'];
        spinner.text = 'Generating client SDKs...';
        for (const lang of languages) {
            await generateClient({
                ...options,
                lang,
                output: path.join(options.output || './generated', 'clients')
            });
        }
        spinner.text = 'Generating framework adapters...';
        for (const framework of frameworks) {
            await generateAdapter({
                ...options,
                framework,
                output: path.join(options.output || './generated', 'adapters')
            });
        }
        spinner.text = 'Generating documentation...';
        await generateDocs({
            ...options,
            format: 'redoc',
            output: path.join(options.output || './generated', 'docs')
        });
        spinner.text = 'Generating discovery client...';
        await generateDiscovery({
            ...options,
            output: path.join(options.output || './generated', 'discovery')
        });
        spinner.succeed(`${chalk.green('✓')} Complete SDK ecosystem generated at ${options.output || './generated'}`);
        console.log(chalk.cyan('\n🚀 Generated SDK Ecosystem:'));
        console.log(chalk.white('├── clients/     (6 languages: TypeScript, Python, Go, Java, Rust, C#)'));
        console.log(chalk.white('├── adapters/    (4 frameworks: LangChain, CrewAI, OpenAI, Anthropic)'));
        console.log(chalk.white('├── docs/        (ReDoc documentation)'));
        console.log(chalk.white('└── discovery/   (UADP client)'));
    }
    catch (error) {
        spinner.fail(`Failed to generate SDK ecosystem: ${error.message}`);
        throw error;
    }
}
// Framework adapter generators
async function generateLangChainAdapter(outputPath, options) {
    const adapterCode = `
# OSSA LangChain Integration
# Auto-generated from OSSA v0.1.8 specification

from langchain.tools import BaseTool
from typing import Optional, Dict, Any
import requests

class OSSAAgentTool(BaseTool):
    name = "ossa_agent"
    description = "Execute OSSA v0.1.8 compliant agent capabilities"
    
    def __init__(self, agent_endpoint: str, capability: str):
        self.agent_endpoint = agent_endpoint
        self.capability = capability
        super().__init__()
    
    def _run(self, input_data: str) -> str:
        response = requests.post(
            f"{self.agent_endpoint}/capabilities/{self.capability}/execute",
            json={"input": input_data}
        )
        return response.json().get("result", "")
`;
    await fs.writeFile(path.join(outputPath, 'langchain', 'ossa_adapter.py'), adapterCode);
}
async function generateCrewAIAdapter(outputPath, options) {
    const adapterCode = `
// OSSA CrewAI Integration
// Auto-generated from OSSA v0.1.8 specification

import { Agent } from '@crewai/crewai';

export class OSSACrewAgent extends Agent {
  constructor(
    private ossaEndpoint: string,
    private capabilities: string[]
  ) {
    super({
      role: 'OSSA Agent',
      goal: 'Execute OSSA v0.1.8 compliant operations',
      backstory: 'I am an OSSA-compliant agent with specialized capabilities'
    });
  }

  async executeCapability(capability: string, input: any): Promise<any> {
    const response = await fetch(\`\${this.ossaEndpoint}/capabilities/\${capability}/execute\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });
    return response.json();
  }
}
`;
    await fs.ensureDir(path.join(outputPath, 'crewai'));
    await fs.writeFile(path.join(outputPath, 'crewai', 'ossa_agent.ts'), adapterCode);
}
async function generateOpenAIAdapter(outputPath, options) {
    const adapterCode = `
// OSSA OpenAI Function Calling Integration
// Auto-generated from OSSA v0.1.8 specification

export const ossaFunctionDefinitions = [
  {
    name: "execute_ossa_capability",
    description: "Execute an OSSA v0.1.8 compliant agent capability",
    parameters: {
      type: "object",
      properties: {
        capability: {
          type: "string",
          description: "The capability name to execute"
        },
        input: {
          type: "object",
          description: "Input data for the capability"
        }
      },
      required: ["capability", "input"]
    }
  }
];

export async function executeOSSAFunction(
  functionCall: any,
  ossaEndpoint: string
): Promise<string> {
  const { capability, input } = JSON.parse(functionCall.arguments);
  
  const response = await fetch(\`\${ossaEndpoint}/capabilities/\${capability}/execute\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input })
  });
  
  const result = await response.json();
  return JSON.stringify(result);
}
`;
    await fs.ensureDir(path.join(outputPath, 'openai'));
    await fs.writeFile(path.join(outputPath, 'openai', 'ossa_functions.ts'), adapterCode);
}
async function generateAnthropicAdapter(outputPath, options) {
    const adapterCode = `
// OSSA Anthropic Tool Integration
// Auto-generated from OSSA v0.1.8 specification

export const ossaToolDefinitions = [
  {
    name: "ossa_capability_executor",
    description: "Execute OSSA v0.1.8 compliant agent capabilities",
    input_schema: {
      type: "object",
      properties: {
        capability: {
          type: "string",
          description: "The OSSA capability to execute"
        },
        parameters: {
          type: "object",
          description: "Parameters for the capability execution"
        }
      },
      required: ["capability", "parameters"]
    }
  }
];

export class OSSAAnthropicClient {
  constructor(private ossaEndpoint: string) {}

  async handleToolCall(toolCall: any): Promise<any> {
    if (toolCall.name === "ossa_capability_executor") {
      const { capability, parameters } = toolCall.input;
      
      const response = await fetch(\`\${this.ossaEndpoint}/capabilities/\${capability}/execute\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      });
      
      return response.json();
    }
    
    throw new Error(\`Unknown tool: \${toolCall.name}\`);
  }
}
`;
    await fs.ensureDir(path.join(outputPath, 'anthropic'));
    await fs.writeFile(path.join(outputPath, 'anthropic', 'ossa_tools.ts'), adapterCode);
}
async function generateSDKPackageJson(outputPath, language) {
    const packageJson = {
        name: `@ossa/${language}-sdk`,
        version: '0.1.8',
        description: `OSSA v0.1.8 ${language} SDK - Auto-generated client library`,
        main: language === 'typescript' ? 'dist/index.js' : 'index.js',
        types: language === 'typescript' ? 'dist/index.d.ts' : undefined,
        scripts: {
            build: language === 'typescript' ? 'tsc' : undefined,
            test: 'npm test'
        },
        keywords: ['ossa', 'sdk', language, 'agents', 'ai'],
        license: 'Apache-2.0',
        repository: {
            type: 'git',
            url: 'https://github.com/ossa-ai/ossa-sdks'
        }
    };
    await fs.writeJson(path.join(outputPath, language, 'package.json'), packageJson, { spaces: 2 });
}
