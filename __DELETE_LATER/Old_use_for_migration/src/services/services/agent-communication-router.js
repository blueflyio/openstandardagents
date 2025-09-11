#!/usr/bin/env node

/**
 * OSSA Agent Communication Router
 * Handles inter-agent communication, coordination, and message routing
 */

import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

class AgentCommunicationRouter {
  constructor() {
    this.registeredAgents = new Map();
    this.activeOrchestrations = new Map();
    this.messageQueue = new Map(); // Agent message queues
    this.coordinationRules = new Map();
  }

  /**
   * Register an agent with the communication router
   */
  registerAgent(agentId, config) {
    console.log(`📡 Registering agent: ${agentId}`);
    
    this.registeredAgents.set(agentId, {
      ...config,
      status: 'online',
      last_heartbeat: new Date(),
      message_queue: []
    });

    // Initialize message queue for agent
    this.messageQueue.set(agentId, []);
  }

  /**
   * Route message to specific agent
   */
  async routeMessage(fromAgent, toAgent, message) {
    if (!this.registeredAgents.has(toAgent)) {
      throw new Error(`Target agent ${toAgent} not found`);
    }

    const targetAgent = this.registeredAgents.get(toAgent);
    
    const routedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromAgent,
      to: toAgent,
      message,
      timestamp: new Date(),
      status: 'pending'
    };

    try {
      // Try direct delivery first
      const response = await axios.post(`${targetAgent.endpoint}/message`, {
        from: fromAgent,
        message,
        message_id: routedMessage.id
      });

      routedMessage.status = 'delivered';
      routedMessage.response = response.data;

    } catch (error) {
      // Queue message for later delivery
      this.messageQueue.get(toAgent).push(routedMessage);
      routedMessage.status = 'queued';
      console.log(`📬 Message queued for ${toAgent}: ${error.message}`);
    }

    return routedMessage;
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcastMessage(fromAgent, targetAgents, message) {
    const results = await Promise.allSettled(
      targetAgents.map(agent => this.routeMessage(fromAgent, agent, message))
    );

    return results.map((result, index) => ({
      target: targetAgents[index],
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : result.reason
    }));
  }

  /**
   * Coordinate multi-agent orchestration
   */
  async orchestrateAgents(orchestrationConfig) {
    const orchestrationId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎭 Starting orchestration: ${orchestrationId}`);
    console.log(`Pattern: ${orchestrationConfig.pattern}`);
    console.log(`Agents: ${orchestrationConfig.agents.map(a => a.id).join(', ')}`);

    const orchestration = {
      id: orchestrationId,
      pattern: orchestrationConfig.pattern,
      agents: orchestrationConfig.agents,
      status: 'running',
      started_at: new Date(),
      results: []
    };

    this.activeOrchestrations.set(orchestrationId, orchestration);

    try {
      let results = [];

      switch (orchestrationConfig.pattern) {
        case 'sequential':
          results = await this.executeSequentialOrchestration(orchestration);
          break;
        case 'parallel':
          results = await this.executeParallelOrchestration(orchestration);
          break;
        case 'hierarchical':
          results = await this.executeHierarchicalOrchestration(orchestration);
          break;
        case 'pipeline':
          results = await this.executePipelineOrchestration(orchestration);
          break;
        default:
          throw new Error(`Unsupported orchestration pattern: ${orchestrationConfig.pattern}`);
      }

      orchestration.status = 'completed';
      orchestration.completed_at = new Date();
      orchestration.results = results;

      return orchestration;

    } catch (error) {
      orchestration.status = 'failed';
      orchestration.error = error.message;
      orchestration.completed_at = new Date();
      throw error;
    }
  }

  /**
   * Execute sequential orchestration
   */
  async executeSequentialOrchestration(orchestration) {
    const results = [];
    let previousResult = null;

    for (const agentConfig of orchestration.agents) {
      console.log(`🔄 Executing ${agentConfig.id} sequentially`);
      
      const task = {
        ...orchestration.task,
        previous_result: previousResult
      };

      const result = await this.executeAgentTask(agentConfig.id, agentConfig.capability, task);
      results.push(result);
      previousResult = result.result;
    }

    return results;
  }

  /**
   * Execute parallel orchestration
   */
  async executeParallelOrchestration(orchestration) {
    console.log(`⚡ Executing ${orchestration.agents.length} agents in parallel`);
    
    const promises = orchestration.agents.map(agentConfig =>
      this.executeAgentTask(agentConfig.id, agentConfig.capability, orchestration.task)
    );

    return await Promise.all(promises);
  }

  /**
   * Execute hierarchical orchestration
   */
  async executeHierarchicalOrchestration(orchestration) {
    // Find coordinator agent
    const coordinator = orchestration.agents.find(a => a.role === 'coordinator');
    if (!coordinator) {
      throw new Error('Hierarchical orchestration requires a coordinator agent');
    }

    // Execute coordinator first
    const coordinatorResult = await this.executeAgentTask(
      coordinator.id, 
      coordinator.capability, 
      orchestration.task
    );

    // Execute subordinate agents based on coordinator's plan
    const subordinates = orchestration.agents.filter(a => a.role !== 'coordinator');
    const subordinateResults = await Promise.all(
      subordinates.map(agent =>
        this.executeAgentTask(agent.id, agent.capability, {
          ...orchestration.task,
          coordinator_plan: coordinatorResult.result
        })
      )
    );

    return [coordinatorResult, ...subordinateResults];
  }

  /**
   * Execute pipeline orchestration
   */
  async executePipelineOrchestration(orchestration) {
    const results = [];
    let pipelineData = orchestration.task;

    for (const agentConfig of orchestration.agents) {
      console.log(`🔀 Pipeline stage: ${agentConfig.id}`);
      
      const result = await this.executeAgentTask(agentConfig.id, agentConfig.capability, pipelineData);
      results.push(result);
      
      // Pass result to next stage
      pipelineData = {
        ...pipelineData,
        pipeline_input: result.result
      };
    }

    return results;
  }

  /**
   * Execute task on specific agent
   */
  async executeAgentTask(agentId, capability, task) {
    const agent = this.registeredAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not registered`);
    }

    const startTime = Date.now();

    try {
      console.log(`📤 Sending task to ${agentId}: ${capability}`);
      
      const response = await axios.post(`${agent.endpoint}/execute`, {
        capability,
        task: task.description || task,
        parameters: task.parameters || {}
      });

      return {
        agent_id: agentId,
        capability,
        status: 'success',
        result: response.data,
        execution_time_ms: Date.now() - startTime
      };

    } catch (error) {
      return {
        agent_id: agentId,
        capability,
        status: 'error',
        error: error.message,
        execution_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Get coordination status for all agents
   */
  getCoordinationStatus() {
    const agentStatuses = Array.from(this.registeredAgents.entries()).map(([id, agent]) => ({
      agent_id: id,
      status: agent.status,
      endpoint: agent.endpoint,
      capabilities: agent.capabilities,
      queued_messages: this.messageQueue.get(id)?.length || 0,
      last_heartbeat: agent.last_heartbeat
    }));

    const activeOrchestrations = Array.from(this.activeOrchestrations.values()).map(orch => ({
      id: orch.id,
      pattern: orch.pattern,
      status: orch.status,
      agents_count: orch.agents.length,
      started_at: orch.started_at,
      completed_at: orch.completed_at
    }));

    return {
      agents: agentStatuses,
      active_orchestrations: activeOrchestrations,
      total_registered_agents: agentStatuses.length,
      online_agents: agentStatuses.filter(a => a.status === 'online').length
    };
  }

  /**
   * Update agent heartbeat
   */
  updateHeartbeat(agentId) {
    if (this.registeredAgents.has(agentId)) {
      const agent = this.registeredAgents.get(agentId);
      agent.last_heartbeat = new Date();
      agent.status = 'online';
    }
  }

  /**
   * Check for stale agents and mark as offline
   */
  checkAgentHealth() {
    const staleThreshold = 60000; // 1 minute
    const now = new Date();

    for (const [agentId, agent] of this.registeredAgents) {
      if (now - agent.last_heartbeat > staleThreshold) {
        agent.status = 'offline';
        console.log(`⚠️  Agent ${agentId} marked as offline (stale heartbeat)`);
      }
    }
  }

  /**
   * Process queued messages
   */
  async processQueuedMessages() {
    for (const [agentId, queue] of this.messageQueue) {
      if (queue.length === 0) continue;

      const agent = this.registeredAgents.get(agentId);
      if (!agent || agent.status !== 'online') continue;

      // Try to deliver queued messages
      const messagesToDeliver = queue.splice(0, 5); // Process up to 5 at a time
      
      for (const message of messagesToDeliver) {
        try {
          await axios.post(`${agent.endpoint}/message`, message);
          message.status = 'delivered';
          console.log(`📨 Delivered queued message to ${agentId}`);
        } catch (error) {
          // Put message back in queue
          queue.unshift(message);
          console.log(`📬 Failed to deliver queued message to ${agentId}`);
          break; // Stop trying if agent is still unreachable
        }
      }
    }
  }
}

// Initialize router
const router = new AgentCommunicationRouter();

// Start background tasks
setInterval(() => router.checkAgentHealth(), 30000); // Check every 30 seconds
setInterval(() => router.processQueuedMessages(), 10000); // Process queue every 10 seconds

// API Routes

app.post('/api/v1/register', (req, res) => {
  const { agent_id, endpoint, capabilities, type } = req.body;
  
  if (!agent_id || !endpoint) {
    return res.status(400).json({
      error: 'agent_id and endpoint are required'
    });
  }

  router.registerAgent(agent_id, {
    endpoint,
    capabilities: capabilities || [],
    type: type || 'generic'
  });

  res.json({
    success: true,
    message: `Agent ${agent_id} registered successfully`
  });
});

app.post('/api/v1/message', async (req, res) => {
  const { from, to, message } = req.body;

  try {
    const result = await router.routeMessage(from, to, message);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/broadcast', async (req, res) => {
  const { from, targets, message } = req.body;

  try {
    const results = await router.broadcastMessage(from, targets, message);
    res.json({ results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/orchestrate', async (req, res) => {
  const orchestrationConfig = req.body;

  try {
    const result = await router.orchestrateAgents(orchestrationConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Orchestration failed',
      message: error.message
    });
  }
});

app.get('/api/v1/coordination-status', (req, res) => {
  res.json(router.getCoordinationStatus());
});

app.post('/api/v1/heartbeat/:agentId', (req, res) => {
  router.updateHeartbeat(req.params.agentId);
  res.json({ success: true });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Agent Communication Router',
    status: 'healthy',
    registered_agents: router.registeredAgents.size,
    active_orchestrations: router.activeOrchestrations.size,
    timestamp: new Date().toISOString()
  });
});

// Start the service
const PORT = 4050;
app.listen(PORT, () => {
  console.log(`🌐 OSSA Agent Communication Router running on port ${PORT}`);
  console.log(`📡 Ready to coordinate agent communications`);
  console.log(`🎭 Supporting sequential, parallel, hierarchical, and pipeline orchestration`);
});