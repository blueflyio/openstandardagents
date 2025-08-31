#!/usr/bin/env node

/**
 * Agent Communication Router
 * Handles inter-agent communication protocols and task routing
 * Routes through LLM Gateway (port 4000) - NO direct provider calls
 */

import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AgentCommunicationRouter {
  constructor() {
    this.app = express();
    this.port = 4050; // Communication router port
    this.gatewayUrl = 'http://localhost:4000'; // LLM Gateway
    this.agentServiceUrl = 'http://localhost:4020'; // Agent Deployment Service
    this.agents = new Map();
    this.communicationProtocols = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeCommunicationProtocols();
    this.startAgentDiscovery();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      console.log(`[AGENT-COMM] ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        protocols: this.communicationProtocols.size,
        discoveredAgents: this.agents.size,
        port: this.port 
      });
    });

    // Route message between agents
    this.app.post('/api/v1/route-message', async (req, res) => {
      try {
        const { fromAgent, toAgent, message, priority } = req.body;
        const result = await this.routeMessage(fromAgent, toAgent, message, priority);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Broadcast message to all agents with capability
    this.app.post('/api/v1/broadcast', async (req, res) => {
      try {
        const { capability, message, excludeAgents = [] } = req.body;
        const results = await this.broadcastToCapability(capability, message, excludeAgents);
        res.json({ results, broadcasted: results.length });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get agent coordination status
    this.app.get('/api/v1/coordination-status', (req, res) => {
      const status = {
        totalAgents: this.agents.size,
        activeProtocols: this.communicationProtocols.size,
        agents: Array.from(this.agents.entries()).map(([name, agent]) => ({
          name,
          type: agent.type,
          status: agent.status,
          capabilities: agent.capabilities,
          lastContact: agent.lastContact
        }))
      };
      res.json(status);
    });

    // Create task delegation workflow
    this.app.post('/api/v1/delegate-task', async (req, res) => {
      try {
        const { task, requiredCapabilities, priority = 'normal', workflow } = req.body;
        const delegation = await this.createTaskDelegation(task, requiredCapabilities, priority, workflow);
        res.json(delegation);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Agent coordination protocols
    this.app.post('/api/v1/coordinate', async (req, res) => {
      try {
        const { agents, coordinationType, parameters } = req.body;
        const coordination = await this.coordinateAgents(agents, coordinationType, parameters);
        res.json(coordination);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  initializeCommunicationProtocols() {
    // Define communication protocols for different agent interactions
    this.communicationProtocols.set('orchestration', {
      name: 'Agent Orchestration Protocol',
      description: 'Coordinates complex multi-agent workflows',
      messageFormat: 'openapi',
      priority: 'high',
      timeout: 30000,
      retryPolicy: { attempts: 3, backoff: 'exponential' }
    });

    this.communicationProtocols.set('development', {
      name: 'Development Coordination Protocol',
      description: 'Coordinates development tasks between specialists',
      messageFormat: 'json',
      priority: 'normal',
      timeout: 60000,
      retryPolicy: { attempts: 2, backoff: 'linear' }
    });

    this.communicationProtocols.set('compliance', {
      name: 'Compliance Verification Protocol',
      description: 'Handles government and enterprise compliance workflows',
      messageFormat: 'structured',
      priority: 'high',
      timeout: 45000,
      retryPolicy: { attempts: 3, backoff: 'exponential' },
      audit: true
    });

    this.communicationProtocols.set('emergency', {
      name: 'Emergency Response Protocol',
      description: 'Fast response for critical system issues',
      messageFormat: 'minimal',
      priority: 'critical',
      timeout: 5000,
      retryPolicy: { attempts: 5, backoff: 'immediate' }
    });

    console.log(`[AGENT-COMM] Initialized ${this.communicationProtocols.size} communication protocols`);
  }

  async startAgentDiscovery() {
    // Discover agents from deployment service
    try {
      console.log('[AGENT-COMM] Starting agent discovery...');
      await this.discoverAgents();
      
      // Schedule periodic agent discovery
      setInterval(() => this.discoverAgents(), 30000);
    } catch (error) {
      console.error('[AGENT-COMM] Agent discovery failed:', error.message);
    }
  }

  async discoverAgents() {
    try {
      const response = await axios.get(`${this.agentServiceUrl}/api/v1/agents`, {
        timeout: 10000
      });

      const discoveredAgents = response.data.agents;
      
      for (const agent of discoveredAgents) {
        this.agents.set(agent.name, {
          ...agent,
          lastContact: new Date().toISOString(),
          communicationEndpoint: `http://localhost:${agent.port}`
        });
      }

      console.log(`[AGENT-COMM] Discovered ${discoveredAgents.length} agents`);
    } catch (error) {
      console.warn('[AGENT-COMM] Agent discovery failed:', error.message);
    }
  }

  async routeMessage(fromAgent, toAgent, message, priority = 'normal') {
    console.log(`[AGENT-COMM] Routing message: ${fromAgent} → ${toAgent}`);
    
    const targetAgent = this.agents.get(toAgent);
    if (!targetAgent) {
      throw new Error(`Target agent ${toAgent} not found`);
    }

    // Select appropriate communication protocol
    const protocol = this.selectProtocol(targetAgent.type, priority);
    
    try {
      // Route through LLM Gateway for AI-enhanced communication
      const enhancedMessage = await this.enhanceMessage(message, protocol);
      
      // Send message to target agent
      const result = await this.sendMessage(targetAgent, enhancedMessage, protocol);
      
      return {
        success: true,
        fromAgent,
        toAgent,
        protocol: protocol.name,
        timestamp: new Date().toISOString(),
        result
      };
    } catch (error) {
      console.error(`[AGENT-COMM] Message routing failed:`, error.message);
      throw error;
    }
  }

  async broadcastToCapability(capability, message, excludeAgents = []) {
    console.log(`[AGENT-COMM] Broadcasting to agents with capability: ${capability}`);
    
    const targetAgents = Array.from(this.agents.values()).filter(agent => 
      agent.capabilities && 
      agent.capabilities.includes(capability) &&
      !excludeAgents.includes(agent.name) &&
      agent.status === 'running'
    );

    console.log(`[AGENT-COMM] Found ${targetAgents.length} target agents`);

    const results = await Promise.allSettled(
      targetAgents.map(agent => this.sendMessage(agent, message, this.selectProtocol(agent.type)))
    );

    return results.map((result, index) => ({
      agent: targetAgents[index].name,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : result.reason.message
    }));
  }

  async createTaskDelegation(task, requiredCapabilities, priority, workflow) {
    console.log(`[AGENT-COMM] Creating task delegation for:`, task.type);
    
    // Find suitable agents for task
    const suitableAgents = Array.from(this.agents.values()).filter(agent => {
      return agent.status === 'running' && 
             requiredCapabilities.every(cap => agent.capabilities.includes(cap));
    });

    if (suitableAgents.length === 0) {
      throw new Error('No suitable agents found for task');
    }

    // Create delegation plan
    const delegation = {
      id: `delegation-${Date.now()}`,
      task,
      requiredCapabilities,
      priority,
      workflow: workflow || 'sequential',
      assignedAgents: suitableAgents.map(agent => ({
        name: agent.name,
        type: agent.type,
        role: this.determineAgentRole(agent, task)
      })),
      status: 'created',
      createdAt: new Date().toISOString()
    };

    // Execute delegation based on workflow
    if (workflow === 'parallel') {
      delegation.results = await this.executeParallelDelegation(delegation);
    } else {
      delegation.results = await this.executeSequentialDelegation(delegation);
    }

    delegation.status = 'completed';
    delegation.completedAt = new Date().toISOString();

    return delegation;
  }

  async coordinateAgents(agentNames, coordinationType, parameters) {
    console.log(`[AGENT-COMM] Coordinating agents for: ${coordinationType}`);
    
    const agents = agentNames.map(name => this.agents.get(name)).filter(Boolean);
    
    if (agents.length !== agentNames.length) {
      throw new Error('Some agents not found for coordination');
    }

    const coordination = {
      id: `coordination-${Date.now()}`,
      type: coordinationType,
      agents: agents.map(a => a.name),
      parameters,
      status: 'started',
      startedAt: new Date().toISOString()
    };

    switch (coordinationType) {
      case 'drupal_development':
        coordination.results = await this.coordinateDrupalDevelopment(agents, parameters);
        break;
        
      case 'security_audit':
        coordination.results = await this.coordinateSecurityAudit(agents, parameters);
        break;
        
      case 'performance_optimization':
        coordination.results = await this.coordinatePerformanceOptimization(agents, parameters);
        break;
        
      case 'content_pipeline':
        coordination.results = await this.coordinateContentPipeline(agents, parameters);
        break;
        
      default:
        coordination.results = await this.coordinateGeneric(agents, parameters);
    }

    coordination.status = 'completed';
    coordination.completedAt = new Date().toISOString();

    return coordination;
  }

  selectProtocol(agentType, priority = 'normal') {
    if (priority === 'critical') {
      return this.communicationProtocols.get('emergency');
    }
    
    if (agentType === 'compliance' || agentType === 'security') {
      return this.communicationProtocols.get('compliance');
    }
    
    if (agentType === 'orchestration') {
      return this.communicationProtocols.get('orchestration');
    }
    
    return this.communicationProtocols.get('development');
  }

  async enhanceMessage(message, protocol) {
    try {
      // Route through LLM Gateway for message enhancement
      const response = await axios.post(`${this.gatewayUrl}/api/v1/enhance-message`, {
        message,
        protocol: protocol.name,
        format: protocol.messageFormat
      }, {
        timeout: 5000
      });

      return response.data.enhancedMessage || message;
    } catch (error) {
      console.warn('[AGENT-COMM] Message enhancement failed, using original:', error.message);
      return message;
    }
  }

  async sendMessage(agent, message, protocol) {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = protocol.retryPolicy.attempts;

    while (attempts < maxAttempts) {
      try {
        // Simulate agent communication (in real implementation, would call agent endpoint)
        console.log(`[AGENT-COMM] → ${agent.name} (attempt ${attempts + 1}/${maxAttempts})`);
        
        // Update agent last contact
        agent.lastContact = new Date().toISOString();
        
        return {
          success: true,
          agent: agent.name,
          protocol: protocol.name,
          responseTime: Date.now() - startTime,
          attempt: attempts + 1
        };
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Apply backoff strategy
        const delay = this.calculateBackoff(attempts, protocol.retryPolicy.backoff);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  calculateBackoff(attempt, strategy) {
    switch (strategy) {
      case 'exponential':
        return Math.pow(2, attempt) * 1000;
      case 'linear':
        return attempt * 1000;
      case 'immediate':
        return 0;
      default:
        return 1000;
    }
  }

  determineAgentRole(agent, task) {
    // Determine agent's role in task based on capabilities
    if (agent.capabilities.includes('orchestration')) return 'coordinator';
    if (agent.capabilities.includes('security_scanning')) return 'security_validator';
    if (agent.capabilities.includes('code_quality_analysis')) return 'quality_assurer';
    if (agent.capabilities.includes('content_generation')) return 'content_provider';
    return 'executor';
  }

  async executeParallelDelegation(delegation) {
    const results = await Promise.allSettled(
      delegation.assignedAgents.map(agent => 
        this.sendMessage(
          this.agents.get(agent.name), 
          { task: delegation.task, role: agent.role },
          this.selectProtocol(agent.type, delegation.priority)
        )
      )
    );

    return results.map((result, index) => ({
      agent: delegation.assignedAgents[index].name,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : result.reason.message
    }));
  }

  async executeSequentialDelegation(delegation) {
    const results = [];
    
    for (const agentInfo of delegation.assignedAgents) {
      try {
        const result = await this.sendMessage(
          this.agents.get(agentInfo.name),
          { task: delegation.task, role: agentInfo.role },
          this.selectProtocol(agentInfo.type, delegation.priority)
        );
        
        results.push({
          agent: agentInfo.name,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          agent: agentInfo.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async coordinateDrupalDevelopment(agents, parameters) {
    console.log('[AGENT-COMM] Coordinating Drupal development workflow');
    
    // Sequence: drupal-expert → qa-lead → security-guardian → documentation-specialist
    const workflow = [
      { agent: 'drupal-expert', task: 'module_development' },
      { agent: 'qa-lead', task: 'code_testing' },
      { agent: 'security-guardian', task: 'security_scan' },
      { agent: 'documentation-specialist', task: 'documentation_generation' }
    ];

    const results = [];
    for (const step of workflow) {
      const agent = agents.find(a => a.name === step.agent);
      if (agent) {
        const result = await this.sendMessage(agent, { task: step.task, parameters }, this.selectProtocol(agent.type));
        results.push({ step: step.task, agent: step.agent, result });
      }
    }

    return results;
  }

  async coordinateSecurityAudit(agents, parameters) {
    console.log('[AGENT-COMM] Coordinating security audit workflow');
    
    // Parallel security scanning with different specialists
    const securityTasks = [
      { agent: 'security-guardian', task: 'vulnerability_scan' },
      { agent: 'gov-compliance-agent', task: 'compliance_check' },
      { agent: 'accessibility-guardian', task: 'accessibility_audit' }
    ];

    const results = await Promise.all(
      securityTasks.map(async task => {
        const agent = agents.find(a => a.name === task.agent);
        if (agent) {
          return this.sendMessage(agent, { task: task.task, parameters }, this.selectProtocol(agent.type));
        }
        return null;
      })
    );

    return results.filter(Boolean);
  }

  async coordinatePerformanceOptimization(agents, parameters) {
    console.log('[AGENT-COMM] Coordinating performance optimization workflow');
    
    // Performance optimization workflow
    const optimizationTasks = [
      { agent: 'performance-engineer', task: 'performance_analysis' },
      { agent: 'ai-ml-specialist', task: 'model_optimization' },
      { agent: 'mobile-optimization-agent', task: 'mobile_performance' }
    ];

    const results = [];
    for (const task of optimizationTasks) {
      const agent = agents.find(a => a.name === task.agent);
      if (agent) {
        const result = await this.sendMessage(agent, { task: task.task, parameters }, this.selectProtocol(agent.type));
        results.push({ task: task.task, agent: task.agent, result });
      }
    }

    return results;
  }

  async coordinateContentPipeline(agents, parameters) {
    console.log('[AGENT-COMM] Coordinating content pipeline workflow');
    
    // Content creation and management workflow
    const contentTasks = [
      { agent: 'content-manager', task: 'content_generation' },
      { agent: 'documentation-specialist', task: 'content_review' },
      { agent: 'search-optimization-agent', task: 'seo_optimization' }
    ];

    const results = [];
    for (const task of contentTasks) {
      const agent = agents.find(a => a.name === task.agent);
      if (agent) {
        const result = await this.sendMessage(agent, { task: task.task, parameters }, this.selectProtocol(agent.type));
        results.push({ task: task.task, agent: task.agent, result });
      }
    }

    return results;
  }

  async coordinateGeneric(agents, parameters) {
    console.log('[AGENT-COMM] Coordinating generic multi-agent workflow');
    
    const results = await Promise.all(
      agents.map(agent => 
        this.sendMessage(agent, { task: 'generic_coordination', parameters }, this.selectProtocol(agent.type))
      )
    );

    return results;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`[AGENT-COMM] Agent Communication Router running on port ${this.port}`);
      console.log(`[AGENT-COMM] Gateway URL: ${this.gatewayUrl}`);
      console.log(`[AGENT-COMM] Agent Service URL: ${this.agentServiceUrl}`);
      console.log(`[AGENT-COMM] Health check: http://localhost:${this.port}/health`);
      console.log(`[AGENT-COMM] Route message: POST /api/v1/route-message`);
      console.log(`[AGENT-COMM] Broadcast: POST /api/v1/broadcast`);
      console.log(`[AGENT-COMM] Delegate task: POST /api/v1/delegate-task`);
      console.log(`[AGENT-COMM] Coordinate: POST /api/v1/coordinate`);
    });
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const communicationRouter = new AgentCommunicationRouter();
  communicationRouter.start();
}

export default AgentCommunicationRouter;