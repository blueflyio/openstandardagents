import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { ossaAgentService } from '../services/openai-agents-service.js';

export function createOpenAIAgentCommandsTS(): Command {
  const openai = new Command('agents')
    .description('OpenAI agents integration (TypeScript SDK)');

  // Spawn agent (TypeScript SDK)
  openai
    .command('spawn <name>')
    .description('Spawn a new OpenAI agent using TypeScript SDK')
    .option('--model <model>', 'Model to use', 'gpt-4o')
    .option('--instructions <instructions>', 'Agent instructions')
    .option('--temperature <temp>', 'Temperature setting', '0.7')
    .option('--max-tokens <tokens>', 'Max tokens per response')
    .option('--type <type>', 'Agent type (code|research|general)', 'general')
    .action(async (name, options) => {
      const spinner = ora(`Spawning agent ${name}...`).start();
      
      try {
        let agentId: string;
        
        // Create specialized agents based on type
        switch (options.type) {
          case 'code':
            agentId = await ossaAgentService.createCodeAgent(name, options.instructions);
            break;
          case 'research':
            agentId = await ossaAgentService.createResearchAgent(name, options.instructions);
            break;
          default:
            agentId = await ossaAgentService.createAgent({
              name,
              model: options.model,
              instructions: options.instructions || `You are ${name}, a helpful AI assistant`,
              temperature: parseFloat(options.temperature),
              maxTokens: options.maxTokens ? parseInt(options.maxTokens) : undefined
            });
        }
        
        spinner.succeed(`Agent spawned: ${agentId}`);
        console.log(chalk.blue('Agent Details:'));
        console.log(chalk.gray('  ID:'), agentId);
        console.log(chalk.gray('  Name:'), name);
        console.log(chalk.gray('  Model:'), options.model);
        console.log(chalk.gray('  Type:'), options.type);
        
      } catch (error: any) {
        spinner.fail(`Failed to spawn agent: ${error.message}`);
      }
    });

  // Run agent (TypeScript SDK)
  openai
    .command('run <agent_id>')
    .description('Run an agent with a message')
    .option('--message <message>', 'Message to send')
    .option('--file <file>', 'File containing message')
    .action(async (agentId, options) => {
      const spinner = ora('Running agent...').start();
      
      try {
        let message = options.message;
        
        if (options.file) {
          message = fs.readFileSync(options.file, 'utf8');
        }
        
        if (!message) {
          spinner.fail('No message provided');
          return;
        }
        
        const result = await ossaAgentService.runAgent(agentId, message);
        
        spinner.succeed('Agent executed');
        console.log('\n' + chalk.blue('Response:'));
        console.log(result.finalOutput);
        
        if (result.handoff) {
          console.log('\n' + chalk.yellow('Handoff suggested:'));
          console.log(chalk.gray('  To agent:'), result.handoff.agent);
        }
        
        if (result.usage) {
          console.log('\n' + chalk.gray('Token Usage:'));
          console.log(chalk.gray('  Input:'), result.usage.inputTokens);
          console.log(chalk.gray('  Output:'), result.usage.outputTokens);
        }
        
      } catch (error: any) {
        spinner.fail(`Failed to run agent: ${error.message}`);
      }
    });

  // List agents (TypeScript SDK)
  openai
    .command('list')
    .description('List all spawned agents')
    .action(async () => {
      const spinner = ora('Fetching agents...').start();
      
      try {
        const agents = ossaAgentService.listAgents();
        spinner.stop();
        
        if (agents.length === 0) {
          console.log(chalk.yellow('No agents spawned'));
          return;
        }
        
        console.log(chalk.blue.bold('OpenAI Agents:'));
        agents.forEach((agent, index) => {
          console.log(`\n${index + 1}. ${chalk.green(agent.config.name)} (${agent.id})`);
          console.log(chalk.gray('   Model:'), agent.config.model);
          console.log(chalk.gray('   Instructions:'), agent.config.instructions.substring(0, 50) + '...');
        });
        
      } catch (error: any) {
        spinner.fail(`Failed to list agents: ${error.message}`);
      }
    });

  // Multi-agent orchestration (TypeScript SDK)
  openai
    .command('orchestrate <task>')
    .description('Orchestrate multiple agents for a task')
    .option('--agents <ids>', 'Comma-separated agent IDs')
    .option('--mode <mode>', 'Orchestration mode (sequential|parallel)', 'sequential')
    .option('--auto-create', 'Auto-create default RFP processing pipeline')
    .action(async (task, options) => {
      const spinner = ora('Orchestrating agents...').start();
      
      try {
        if (options.autoCreate) {
          // Create and use RFP pipeline
          const rfpResults = await ossaAgentService.processRFP(task);
          
          spinner.succeed('RFP pipeline completed');
          
          console.log(chalk.blue.bold('\nRFP Processing Results:'));
          console.log('\n' + chalk.green('1. Extraction:'));
          console.log(rfpResults.extraction.finalOutput);
          console.log('\n' + chalk.green('2. Analysis:'));
          console.log(rfpResults.analysis.finalOutput);
          console.log('\n' + chalk.green('3. Proposal:'));
          console.log(rfpResults.proposal.finalOutput);
          console.log('\n' + chalk.green('4. Review:'));
          console.log(rfpResults.review.finalOutput);
          
          return;
        }
        
        if (!options.agents) {
          spinner.fail('No agent IDs provided. Use --agents or --auto-create');
          return;
        }
        
        const agentIds = options.agents.split(',').map((id: string) => id.trim());
        let results: any[];
        
        if (options.mode === 'parallel') {
          results = await ossaAgentService.orchestrateParallel(agentIds, task);
        } else {
          results = await ossaAgentService.orchestrateSequential(agentIds, task);
        }
        
        spinner.succeed('Orchestration complete');
        
        console.log(chalk.blue.bold('\nOrchestration Results:'));
        console.log(chalk.gray('Task:'), task);
        console.log(chalk.gray('Mode:'), options.mode);
        console.log(chalk.gray('Agents:'), agentIds.join(', '));
        
        results.forEach((result, index) => {
          console.log(`\n${chalk.green(`Agent ${index + 1} (${agentIds[index]}):`)}`);;
          console.log(result.finalOutput);
        });
        
      } catch (error: any) {
        spinner.fail(`Failed to orchestrate: ${error.message}`);
      }
    });

  // Handoff between agents
  openai
    .command('handoff <from_agent> <to_agent>')
    .description('Handoff from one agent to another')
    .option('--context <context>', 'Context to pass along')
    .action(async (fromAgent, toAgent, options) => {
      const spinner = ora('Performing handoff...').start();
      
      try {
        const context = options.context || 'No additional context provided';
        const result = await ossaAgentService.handoffToAgent(fromAgent, toAgent, context);
        
        spinner.succeed('Handoff completed');
        console.log('\n' + chalk.blue('Response from receiving agent:'));
        console.log(result.finalOutput);
        
      } catch (error: any) {
        spinner.fail(`Failed to handoff: ${error.message}`);
      }
    });

  // Get agent info (TypeScript SDK)
  openai
    .command('info <agent_id>')
    .description('Get information about an agent')
    .action(async (agentId) => {
      const spinner = ora('Fetching agent info...').start();
      
      try {
        const info = ossaAgentService.getAgentInfo(agentId);
        spinner.stop();
        
        if (!info) {
          console.log(chalk.red(`Agent ${agentId} not found`));
          return;
        }
        
        console.log(chalk.blue.bold(`Agent Information:`));
        console.log(chalk.gray('  ID:'), agentId);
        console.log(chalk.gray('  Name:'), info.name);
        console.log(chalk.gray('  Model:'), info.model);
        console.log(chalk.gray('  Instructions:'), info.instructions);
        console.log(chalk.gray('  Temperature:'), info.temperature);
        console.log(chalk.gray('  Max Tokens:'), info.maxTokens || 'default');
        
      } catch (error: any) {
        spinner.fail(`Failed to get agent info: ${error.message}`);
      }
    });

  // Terminate agent (TypeScript SDK)
  openai
    .command('terminate <agent_id>')
    .description('Terminate an agent')
    .action(async (agentId) => {
      const spinner = ora(`Terminating agent ${agentId}...`).start();
      
      try {
        const removed = ossaAgentService.removeAgent(agentId);
        
        if (removed) {
          spinner.succeed(`Agent terminated: ${agentId}`);
        } else {
          spinner.fail(`Agent not found: ${agentId}`);
        }
        
      } catch (error: any) {
        spinner.fail(`Failed to terminate agent: ${error.message}`);
      }
    });

  // Create RFP pipeline
  openai
    .command('rfp-pipeline')
    .description('Create specialized RFP processing agents')
    .action(async () => {
      const spinner = ora('Creating RFP pipeline...').start();
      
      try {
        const pipeline = await ossaAgentService.createRFPPipeline();
        
        spinner.succeed('RFP pipeline created');
        console.log(chalk.blue.bold('RFP Processing Pipeline:'));
        console.log(chalk.gray('  Extractor:'), pipeline.extractor);
        console.log(chalk.gray('  Analyzer:'), pipeline.analyzer);
        console.log(chalk.gray('  Writer:'), pipeline.writer);
        console.log(chalk.gray('  Reviewer:'), pipeline.reviewer);
        console.log('\n' + chalk.yellow('Use: ossa agents orchestrate --auto-create <rfp-content>'));
        
      } catch (error: any) {
        spinner.fail(`Failed to create RFP pipeline: ${error.message}`);
      }
    });

  return openai;
}