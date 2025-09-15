#!/usr/bin/env node

/**
 * Claude Code Multi-Agent CLI
 * 
 * Command line interface for orchestrating multiple Claude Code agents
 */

import { ClaudeCodeOrchestrator, OrchestrationRequest } from './claude-code-orchestrator.js';

class ClaudeCodeCLI {
  private orchestrator: ClaudeCodeOrchestrator;

  constructor() {
    this.orchestrator = new ClaudeCodeOrchestrator();
  }

  async run(args: string[]) {
    const command = args[2];
    
    switch (command) {
      case 'health':
        await this.showHealth();
        break;
      case 'capabilities':
        await this.showCapabilities();
        break;
      case 'analyze':
        await this.analyzeCode(args.slice(3));
        break;
      case 'orchestrate':
        await this.runOrchestration(args.slice(3));
        break;
      case 'discover':
        await this.discoverAgents(args.slice(3));
        break;
      default:
        this.showHelp();
    }
  }

  private async showHealth() {
    console.log('🏥 Claude Code Agents Health Status');
    console.log('=' * 50);
    
    const health = await this.orchestrator.getAgentsHealth();
    
    health.forEach(agent => {
      const status = agent.status === 'healthy' ? '✅' : 
                    agent.status === 'degraded' ? '⚠️' : '❌';
      console.log(`${status} ${agent.agent_id}: ${agent.status}`);
      console.log(`   Last check: ${agent.last_check.toISOString()}`);
    });
  }

  private async showCapabilities() {
    console.log('🛠️  Available Agent Capabilities');
    console.log('=' * 50);
    
    const capabilities = this.orchestrator.getAvailableCapabilities();
    
    capabilities.forEach(cap => {
      console.log(`\n📋 ${cap.name} (${cap.id})`);
      console.log(`   Agent: ${cap.agent_id}`);
      console.log(`   Description: ${cap.description}`);
      console.log(`   Frameworks: ${cap.frameworks.join(', ')}`);
      console.log(`   Target Response: ${cap.performance.response_time_ms.target}ms`);
      console.log(`   Max Throughput: ${cap.performance.throughput_rps.max} RPS`);
    });
  }

  private async analyzeCode(args: string[]) {
    const codeOrPath = args[0];
    const language = args[1] || 'javascript';
    
    if (!codeOrPath) {
      console.error('❌ Error: Please provide code or path to analyze');
      return;
    }

    console.log('🔍 Analyzing code with Claude Code agents...');
    
    const request: OrchestrationRequest = {
      workflow: 'sequential',
      task: `Analyze the following code for quality, security, and performance: ${codeOrPath}`,
      context: {
        language: language,
        codebase_path: codeOrPath.includes('/') ? codeOrPath : undefined
      }
    };

    const result = await this.orchestrator.orchestrate(request);
    this.displayOrchestrationResult(result);
  }

  private async runOrchestration(args: string[]) {
    const workflow = args[0] as any;
    const task = args.slice(1).join(' ');
    
    if (!workflow || !task) {
      console.error('❌ Error: Please provide workflow and task');
      console.log('Example: orchestrate sequential "analyze my typescript project"');
      return;
    }

    const validWorkflows = ['sequential', 'parallel', 'intelligent_routing', 'fanout', 'pipeline'];
    if (!validWorkflows.includes(workflow)) {
      console.error(`❌ Error: Invalid workflow. Valid options: ${validWorkflows.join(', ')}`);
      return;
    }

    console.log(`🎭 Running ${workflow} orchestration...`);
    
    const request: OrchestrationRequest = {
      workflow,
      task,
      requirements: {
        compliance_level: 'silver'
      }
    };

    const result = await this.orchestrator.orchestrate(request);
    this.displayOrchestrationResult(result);
  }

  private async discoverAgents(args: string[]) {
    const workspacePath = args[0] || process.cwd();
    
    console.log(`🔍 Discovering agents in workspace: ${workspacePath}`);
    
    const agents = await this.orchestrator.discoverAgents(workspacePath);
    
    console.log(`\n📊 Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`\n🤖 ${agent.name} (${agent.id})`);
      console.log(`   Type: ${agent.type}`);
      console.log(`   Endpoint: ${agent.endpoint}`);
      console.log(`   Status: ${agent.health_status}`);
      console.log(`   Capabilities: ${agent.capabilities.length}`);
    });
  }

  private displayOrchestrationResult(result: any) {
    console.log('\n🎯 Orchestration Results');
    console.log('=' * 50);
    console.log(`ID: ${result.orchestration_id}`);
    console.log(`Status: ${result.status}`);
    console.log(`Workflow: ${result.workflow_used}`);
    console.log(`Agents Used: ${result.agents_used.join(', ')}`);
    console.log(`Execution Time: ${result.execution_time_ms}ms`);
    console.log(`Token Optimization: ${result.token_usage.optimization_savings} savings`);
    
    console.log('\n📊 Individual Results:');
    result.results.forEach((res: any, index: number) => {
      const status = res.status === 'success' ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${res.agent_id} - ${res.capability_used}`);
      console.log(`   Time: ${res.execution_time_ms}ms`);
      
      if (res.status === 'success' && res.result) {
        console.log(`   Result: ${JSON.stringify(res.result, null, 2)}`);
      } else if (res.error) {
        console.log(`   Error: ${res.error}`);
      }
    });
  }

  private showHelp() {
    console.log(`
🚀 Claude Code Multi-Agent CLI

USAGE:
  claude-code <command> [options]

COMMANDS:
  health                      Show health status of all agents
  capabilities               List all available agent capabilities
  analyze <code|path> [lang] Analyze code using multiple agents
  orchestrate <workflow> <task> Run orchestrated workflow
  discover [path]            Discover agents in workspace

WORKFLOWS:
  sequential       Execute agents one after another
  parallel         Execute agents concurrently
  intelligent_routing  Route to best agent automatically
  fanout           Send request to multiple agents
  pipeline         Chain agent outputs as inputs

EXAMPLES:
  claude-code health
  claude-code analyze "function test() { var x = 1; }" javascript  
  claude-code orchestrate sequential "analyze security vulnerabilities"
  claude-code discover /path/to/workspace

INTEGRATION:
  🔗 OAAS-compliant agents with universal framework support
  🔗 MCP integration for Claude Desktop
  🔗 Token optimization (35-45% savings)
  🔗 Enterprise compliance (ISO 42001, NIST AI RMF)
`);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ClaudeCodeCLI();
  cli.run(process.argv).catch(console.error);
}

export { ClaudeCodeCLI };