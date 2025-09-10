import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ossaAgentService } from '../services/openai-agents-service.js';

const BRIDGE_URL = process.env.OSSA_PYTHON_BRIDGE_URL || 'http://localhost:8001';

interface AgentConfig {
  name: string;
  model?: string;
  tools?: string[];
  instructions?: string;
  temperature?: number;
  max_tokens?: number;
}

export function createOpenAIAgentCommands(): Command {
  const openai = new Command('openai')
    .description('OpenAI agent integration commands');

  // Start bridge server
  openai
    .command('bridge:start')
    .description('Start the Python bridge server for OpenAI agents')
    .option('--port <port>', 'Port to run bridge on', '8001')
    .action(async (options) => {
      const spinner = ora('Starting OpenAI agent bridge...').start();
      
      try {
        // Check if virtual environment exists
        const venvPath = path.join(process.cwd(), 'venv');
        if (!fs.existsSync(venvPath)) {
          spinner.fail('Virtual environment not found. Run: python3 -m venv venv');
          return;
        }
        
        // Start the Python bridge
        const pythonPath = path.join(venvPath, 'bin', 'python');
        const bridgePath = path.join(__dirname, '..', 'services', 'openai-bridge.py');
        
        const bridge = spawn(pythonPath, [bridgePath], {
          env: {
            ...process.env,
            OSSA_PYTHON_BRIDGE_PORT: options.port
          },
          stdio: 'inherit'
        });
        
        bridge.on('error', (err) => {
          spinner.fail(`Failed to start bridge: ${err.message}`);
        });
        
        spinner.succeed(`OpenAI agent bridge started on port ${options.port}`);
        console.log(chalk.gray('Press Ctrl+C to stop the bridge'));
        
      } catch (error: any) {
        spinner.fail(`Failed to start bridge: ${error.message}`);
      }
    });

  // Spawn agent
  openai
    .command('spawn <name>')
    .description('Spawn a new OpenAI agent')
    .option('--model <model>', 'Model to use', 'gpt-4o')
    .option('--tools <tools>', 'Comma-separated list of tools')
    .option('--instructions <instructions>', 'Agent instructions')
    .option('--temperature <temp>', 'Temperature setting', '0.7')
    .option('--max-tokens <tokens>', 'Max tokens per response')
    .action(async (name, options) => {
      const spinner = ora(`Spawning agent ${name}...`).start();
      
      try {
        const config: AgentConfig = {
          name,
          model: options.model,
          tools: options.tools ? options.tools.split(',') : [],
          instructions: options.instructions || `You are ${name}, a helpful AI assistant`,
          temperature: parseFloat(options.temperature),
          max_tokens: options.maxTokens ? parseInt(options.maxTokens) : undefined
        };
        
        const response = await axios.post(`${BRIDGE_URL}/agents/spawn`, config);
        
        spinner.succeed(`Agent spawned: ${response.data.agent_id}`);
        console.log(chalk.blue('Agent Details:'));
        console.log(chalk.gray('  ID:'), response.data.agent_id);
        console.log(chalk.gray('  Model:'), response.data.model);
        console.log(chalk.gray('  Status:'), response.data.status);
        
      } catch (error: any) {
        spinner.fail(`Failed to spawn agent: ${error.message}`);
        if (error.response?.status === 404) {
          console.log(chalk.yellow('Bridge not running. Start with: ossa openai bridge:start'));
        }
      }
    });

  // Execute turn
  openai
    .command('execute <agent_id>')
    .description('Execute a turn with an agent')
    .option('--message <message>', 'Message to send')
    .option('--file <file>', 'File containing message')
    .option('--stream', 'Stream response')
    .action(async (agentId, options) => {
      const spinner = ora('Executing turn...').start();
      
      try {
        let message = options.message;
        
        if (options.file) {
          message = fs.readFileSync(options.file, 'utf8');
        }
        
        if (!message) {
          spinner.fail('No message provided');
          return;
        }
        
        const response = await axios.post(`${BRIDGE_URL}/agents/${agentId}/execute`, {
          agent_id: agentId,
          messages: [{ role: 'user', content: message }],
          stream: options.stream || false
        });
        
        spinner.succeed('Turn executed');
        console.log('\n' + chalk.blue('Response:'));
        console.log(response.data.response);
        
        if (response.data.usage) {
          console.log('\n' + chalk.gray('Token Usage:'));
          console.log(chalk.gray('  Prompt:'), response.data.usage.prompt_tokens);
          console.log(chalk.gray('  Completion:'), response.data.usage.completion_tokens);
          console.log(chalk.gray('  Total:'), response.data.usage.total_tokens);
        }
        
      } catch (error: any) {
        spinner.fail(`Failed to execute turn: ${error.message}`);
      }
    });

  // List agents
  openai
    .command('list')
    .description('List all spawned agents')
    .action(async () => {
      const spinner = ora('Fetching agents...').start();
      
      try {
        const response = await axios.get(`${BRIDGE_URL}/agents/list`);
        spinner.stop();
        
        if (response.data.agents.length === 0) {
          console.log(chalk.yellow('No agents spawned'));
          return;
        }
        
        console.log(chalk.blue.bold('OpenAI Agents:'));
        response.data.agents.forEach((agent: any, index: number) => {
          console.log(`\n${index + 1}. ${chalk.green(agent.name)} (${agent.id})`);
          console.log(chalk.gray('   Model:'), agent.model);
          console.log(chalk.gray('   Created:'), agent.created_at);
          console.log(chalk.gray('   Turns:'), agent.total_turns);
          console.log(chalk.gray('   Tokens:'), agent.total_tokens);
        });
        
      } catch (error: any) {
        spinner.fail(`Failed to list agents: ${error.message}`);
      }
    });

  // Get agent history
  openai
    .command('history <agent_id>')
    .description('Get conversation history for an agent')
    .action(async (agentId) => {
      const spinner = ora('Fetching history...').start();
      
      try {
        const response = await axios.get(`${BRIDGE_URL}/agents/${agentId}/history`);
        spinner.stop();
        
        console.log(chalk.blue.bold(`History for ${agentId}:`));
        response.data.history.forEach((message: any, index: number) => {
          const roleColor = message.role === 'user' ? chalk.cyan : chalk.green;
          console.log(`\n${roleColor(message.role.toUpperCase())}:`);
          console.log(message.content);
        });
        
      } catch (error: any) {
        spinner.fail(`Failed to get history: ${error.message}`);
      }
    });

  // Terminate agent
  openai
    .command('terminate <agent_id>')
    .description('Terminate an agent')
    .action(async (agentId) => {
      const spinner = ora(`Terminating agent ${agentId}...`).start();
      
      try {
        const response = await axios.delete(`${BRIDGE_URL}/agents/${agentId}`);
        spinner.succeed(`Agent terminated: ${response.data.agent_id}`);
        
      } catch (error: any) {
        spinner.fail(`Failed to terminate agent: ${error.message}`);
      }
    });

  // Multi-agent orchestration
  openai
    .command('orchestrate <task>')
    .description('Orchestrate multiple agents for a task')
    .option('--agents <names>', 'Comma-separated agent names', 'analyzer,processor,reviewer')
    .option('--models <models>', 'Comma-separated models', 'gpt-4o,gpt-4o-mini,gpt-4o-mini')
    .action(async (task, options) => {
      const spinner = ora('Orchestrating agents...').start();
      
      try {
        const agentNames = options.agents.split(',');
        const models = options.models.split(',');
        
        const agentsConfig = agentNames.map((name: string, index: number) => ({
          name: name.trim(),
          model: models[index] || 'gpt-4o',
          instructions: `You are ${name}, part of a multi-agent system. Focus on your specific role.`
        }));
        
        const response = await axios.post(`${BRIDGE_URL}/orchestrate/multi-agent`, {
          agents_config: agentsConfig,
          task
        });
        
        spinner.succeed('Orchestration complete');
        
        console.log(chalk.blue.bold('\nOrchestration Results:'));
        console.log(chalk.gray('Task:'), task);
        console.log(chalk.gray('Agents:'), response.data.agents.join(', '));
        
        response.data.results.forEach((result: any, index: number) => {
          console.log(`\n${chalk.green(`Agent ${index + 1} (${result.agent_id}):`)}}`);
          console.log(result.response);
        });
        
      } catch (error: any) {
        spinner.fail(`Failed to orchestrate: ${error.message}`);
      }
    });

  // Health check
  openai
    .command('health')
    .description('Check bridge health status')
    .action(async () => {
      const spinner = ora('Checking bridge health...').start();
      
      try {
        const response = await axios.get(`${BRIDGE_URL}/health`);
        spinner.succeed('Bridge is healthy');
        console.log(chalk.gray('Status:'), response.data.status);
        console.log(chalk.gray('Active agents:'), response.data.agents_count);
        console.log(chalk.gray('API key configured:'), response.data.api_key_configured ? '✓' : '✗');
        
      } catch (error: any) {
        spinner.fail('Bridge is not running or unhealthy');
        console.log(chalk.yellow('Start with: ossa openai bridge:start'));
      }
    });

  return openai;
}