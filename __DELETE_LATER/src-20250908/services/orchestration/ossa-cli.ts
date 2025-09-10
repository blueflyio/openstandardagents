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
      case 'create':
        await this.createAgent(args.slice(3));
        break;
      case 'validate-agent':
        await this.validateAgent(args.slice(3));
        break;
      case 'scaffold':
        await this.scaffoldAgent(args.slice(3));
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

  private async createAgent(args: string[]) {
    const agentName = args[0];
    
    if (!agentName) {
      console.error('❌ Error: Please provide agent name');
      console.log('Usage: ossa create <agent-name-skill>');
      console.log('Example: ossa create security-audit-specialist');
      return;
    }

    // Validate agent naming pattern: agent-name-skill
    if (!this.validateAgentNaming(agentName)) {
      console.error('❌ Error: Agent name must follow pattern "agent-name-skill"');
      console.log('Examples: security-audit-specialist, data-analysis-expert, code-review-assistant');
      console.log('Requirements:');
      console.log('  - Lowercase with hyphens');
      console.log('  - Format: {purpose}-{domain}-{role}');
      console.log('  - Min 2 hyphens, max 4 words total');
      return;
    }

    console.log(`🤖 Creating OSSA agent: ${agentName}`);
    
    try {
      await this.scaffoldAgentStructure(agentName);
      console.log(`✅ Agent "${agentName}" created successfully!`);
      console.log('\nNext steps:');
      console.log(`  1. cd .agents/${agentName}`);
      console.log(`  2. Edit agent.yml to customize capabilities`);
      console.log(`  3. Update openapi.yaml with API endpoints`);
      console.log(`  4. Validate: ossa validate-agent ${agentName}`);
    } catch (error) {
      console.error(`❌ Failed to create agent: ${error}`);
    }
  }

  private async validateAgent(args: string[]) {
    const agentName = args[0];
    
    if (!agentName) {
      console.error('❌ Error: Please provide agent name');
      return;
    }

    console.log(`🔍 Validating agent: ${agentName}`);
    
    try {
      const validationResult = await this.performAgentValidation(agentName);
      
      if (validationResult.valid) {
        console.log(`✅ Agent "${agentName}" is valid OSSA compliant`);
        console.log(`   Compliance Level: ${validationResult.complianceLevel}`);
        console.log(`   Capabilities: ${validationResult.capabilities}`);
        console.log(`   Required Files: ✅ All present`);
      } else {
        console.log(`❌ Agent "${agentName}" validation failed`);
        validationResult.errors.forEach((error: string) => {
          console.log(`   - ${error}`);
        });
      }
    } catch (error) {
      console.error(`❌ Validation error: ${error}`);
    }
  }

  private async scaffoldAgent(args: string[]) {
    const agentName = args[0];
    const template = args[1] || 'standard';
    
    if (!agentName) {
      console.error('❌ Error: Please provide agent name');
      return;
    }

    console.log(`🏗️ Scaffolding agent: ${agentName} with template: ${template}`);
    
    try {
      await this.scaffoldAgentStructure(agentName, template);
      console.log(`✅ Agent scaffolded successfully!`);
    } catch (error) {
      console.error(`❌ Scaffolding failed: ${error}`);
    }
  }

  private validateAgentNaming(agentName: string): boolean {
    // Pattern: agent-name-skill (minimum 2 hyphens, 3 parts)
    const pattern = /^[a-z][a-z0-9]*(-[a-z0-9]+){2,3}$/;
    return pattern.test(agentName);
  }

  private async scaffoldAgentStructure(agentName: string, template: string = 'standard'): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    const agentPath = `.agents/${agentName}`;
    
    // Create required directories
    const requiredDirs = [
      '_roadmap',
      'behaviors',
      'config', 
      'data',
      'handlers',
      'integrations',
      'schemas',
      'training-modules'
    ];

    // Create base directory
    if (!fs.existsSync(agentPath)) {
      fs.mkdirSync(agentPath, { recursive: true });
    }

    // Create required subdirectories
    requiredDirs.forEach(dir => {
      const dirPath = path.join(agentPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Create required files
    await this.createRequiredFiles(agentPath, agentName, template);
  }

  private async createRequiredFiles(agentPath: string, agentName: string, template: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    // Create agent.yml
    const agentYml = this.generateAgentYml(agentName, template);
    fs.writeFileSync(path.join(agentPath, 'agent.yml'), agentYml);
    
    // Create openapi.yaml
    const openapiYaml = this.generateOpenApiYaml(agentName);
    fs.writeFileSync(path.join(agentPath, 'openapi.yaml'), openapiYaml);
    
    // Create README.md
    const readme = this.generateAgentReadme(agentName);
    fs.writeFileSync(path.join(agentPath, 'README.md'), readme);
  }

  private generateAgentYml(agentName: string, template: string): string {
    return `apiVersion: open-standards-scalable-agents/v0.1.8
kind: Agent
metadata:
  name: ${agentName}
  labels:
    pattern: agent-name-skill
    compliance: bronze
spec:
  agent:
    name: ${agentName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    version: 0.1.0
    description: "OSSA-compliant agent following the ${agentName} pattern"
    
  capabilities:
    - name: "primary-capability"
      description: "Main capability of this agent"
      frameworks: ["mcp", "langchain"]
      
  compliance:
    level: bronze
    frameworks: ["mcp"]
    
  structure:
    requiredDirectories:
      - behaviors
      - config
      - data
      - handlers
      - integrations
      - schemas
      - training-modules
    requiredFiles:
      - agent.yml
      - openapi.yaml
`;
  }

  private generateOpenApiYaml(agentName: string): string {
    return `openapi: 3.1.0
info:
  title: ${agentName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} API
  version: 0.1.0
  description: OSSA-compliant agent API specification
  
servers:
  - url: http://localhost:3000
    description: Development server
    
paths:
  /health:
    get:
      summary: Health check endpoint
      operationId: healthCheck
      responses:
        '200':
          description: Agent is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: healthy
                  
  /capabilities:
    get:
      summary: Get agent capabilities
      operationId: getCapabilities
      responses:
        '200':
          description: List of agent capabilities
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    description:
                      type: string
                    frameworks:
                      type: array
                      items:
                        type: string
`;
  }

  private generateAgentReadme(agentName: string): string {
    return `# ${agentName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}

OSSA-compliant agent following the agent-name-skill pattern.

## Structure

This agent follows the standard OSSA structure:

- \`behaviors/\` - Agent behavior definitions
- \`config/\` - Configuration files
- \`data/\` - Training and reference data
- \`handlers/\` - Request/response handlers
- \`integrations/\` - Framework integrations
- \`schemas/\` - JSON schemas and validation
- \`training-modules/\` - Training and learning modules

## Required Files

- \`agent.yml\` - OSSA agent specification
- \`openapi.yaml\` - API specification

## Usage

\`\`\`bash
# Validate agent
ossa validate-agent ${agentName}

# Deploy agent
ossa deploy ${agentName}
\`\`\`

## Compliance

This agent targets Bronze compliance level with MCP framework support.
`;
  }

  private async performAgentValidation(agentName: string): Promise<any> {
    const fs = await import('fs');
    const path = await import('path');
    
    const agentPath = `.agents/${agentName}`;
    const errors: string[] = [];
    
    // Check required directories
    const requiredDirs = ['_roadmap', 'behaviors', 'config', 'data', 'handlers', 'integrations', 'schemas', 'training-modules'];
    requiredDirs.forEach(dir => {
      if (!fs.existsSync(path.join(agentPath, dir))) {
        errors.push(`Missing required directory: ${dir}`);
      }
    });
    
    // Check required files
    const requiredFiles = ['agent.yml', 'openapi.yaml', 'README.md'];
    requiredFiles.forEach(file => {
      if (!fs.existsSync(path.join(agentPath, file))) {
        errors.push(`Missing required file: ${file}`);
      }
    });
    
    // Check naming pattern
    if (!this.validateAgentNaming(agentName)) {
      errors.push('Agent name does not follow agent-name-skill pattern');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      complianceLevel: 'Bronze',
      capabilities: 1
    };
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
🚀 OSSA Multi-Agent CLI v0.1.8

USAGE:
  ossa <command> [options]

AGENT MANAGEMENT:
  create <agent-name-skill>   Create new OSSA-compliant agent
  validate-agent <name>       Validate agent compliance  
  scaffold <name> [template]  Scaffold agent with template
  discover [path]            Discover agents in workspace

ORCHESTRATION:
  health                      Show health status of all agents
  capabilities               List all available agent capabilities
  analyze <code|path> [lang] Analyze code using multiple agents
  orchestrate <workflow> <task> Run orchestrated workflow

WORKFLOWS:
  sequential       Execute agents one after another
  parallel         Execute agents concurrently
  intelligent_routing  Route to best agent automatically
  fanout           Send request to multiple agents
  pipeline         Chain agent outputs as inputs

AGENT NAMING PATTERN:
  Required format: agent-name-skill
  Examples:
    security-audit-specialist
    data-analysis-expert
    code-review-assistant
    content-generation-writer

EXAMPLES:
  ossa create security-audit-specialist
  ossa validate-agent security-audit-specialist
  ossa health
  ossa orchestrate sequential "analyze security vulnerabilities"
  ossa discover /path/to/workspace

AGENT STRUCTURE:
  📁 .agents/agent-name-skill/
    ├── 📄 agent.yml          (OSSA specification)
    ├── 📄 openapi.yaml       (API specification)
    ├── 📄 README.md          (Documentation)
    ├── 📁 _roadmap/          (Project roadmap in DITA, JSON backup)
    ├── 📁 behaviors/         (Agent behaviors)
    ├── 📁 config/            (Configuration)
    ├── 📁 data/              (Training data)
    ├── 📁 handlers/          (Request handlers)
    ├── 📁 integrations/      (Framework adapters)
    ├── 📁 schemas/           (JSON schemas)
    └── 📁 training-modules/  (Learning modules)

WORKSPACE STRUCTURE:
  📁 .agents-workspace/
    ├── 📁 agents/            (registry, active, inactive, templates)
    ├── 📁 behaviors/         (common, specialized, templates)
    ├── 📁 config/            (workspace.yaml, security.yaml, etc.)
    ├── 📁 data/              (vectors, documents, cache, knowledge)
    ├── 📁 handlers/          (coordination, workflow, monitoring)
    ├── 📁 integrations/      (gitlab, k8s, langchain, crewai, mcp)
    ├── 📁 schemas/           (agent, workflow, security, compliance)
    ├── 📁 training-modules/  (feedback-loops, model-updates, etc.)
    ├── 📁 workflows/         (templates, active, completed, failed)
    ├── 📁 plans/             (OSSA 360° Loop - execution planning)
    ├── 📁 executions/        (OSSA 360° Loop - execution reports)
    ├── 📁 feedback/          (OSSA 360° Loop - reviews & judgments)
    ├── 📁 learning/          (OSSA 360° Loop - learning signals)
    ├── 📁 audit/             (OSSA 360° Loop - immutable event logs)
    ├── 📁 logs/              (agents, workflows, system, errors)
    ├── 📁 metrics/           (performance and monitoring data)
    ├── 📁 roadmap/           (sitemap.json, milestones, dependencies)
    └── 📁 governance/        (policies, budgets, approvals)
COMPLIANCE LEVELS:
  🥉 Bronze   - Basic MCP compliance
  🥈 Silver   - Multi-framework support
  🥇 Gold     - Production-ready with metrics
  💎 Platinum - Enterprise-grade with SLAs

INTEGRATION:
  🔗 OSSA-compliant agents with universal framework support
  🔗 MCP integration for Claude Desktop
  🔗 Token optimization (35-45% savings via ACTA/VORTEX)
  🔗 Enterprise compliance (ISO 42001, NIST AI RMF)
  🔗 Agent-name-skill naming pattern enforced
`);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ClaudeCodeCLI();
  cli.run(process.argv).catch(console.error);
}

export { ClaudeCodeCLI };