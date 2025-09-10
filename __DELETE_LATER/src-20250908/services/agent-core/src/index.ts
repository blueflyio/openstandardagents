/**
 * OSSA Agent Core Service
 * Main entry point for the agent type system
 */

import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { AgentRegistry } from './services/agent-registry.js';
import { AgentFactory } from './services/agent-factory.js';
import { TaskAgent } from './agents/task-agent.js';
import { AgentType } from './types/agent-types.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3010;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const agentRegistry = new AgentRegistry();
const agentFactory = new AgentFactory(agentRegistry);

// Register agent types
agentFactory.registerAgentType(AgentType.TASK, TaskAgent);
// TODO: Register other agent types as they are implemented

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'agent-core',
    timestamp: new Date().toISOString()
  });
});

// Get all registered agents
app.get('/api/v1/agents', async (req: Request, res: Response) => {
  try {
    const agents = await agentRegistry.getAllAgents();
    res.json(agents);
  } catch (error) {
    logger.error('Failed to get agents:', error);
    res.status(500).json({ error: 'Failed to retrieve agents' });
  }
});

// Get agents by type
app.get('/api/v1/agents/type/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as AgentType;
    const agents = await agentRegistry.getAgentsByType(type);
    res.json(agents);
  } catch (error) {
    logger.error(`Failed to get agents of type ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to retrieve agents' });
  }
});

// Create a new agent
app.post('/api/v1/agents', async (req: Request, res: Response) => {
  try {
    const { type, config } = req.body;
    
    if (!type || !config) {
      return res.status(400).json({ error: 'Type and config are required' });
    }
    
    const agent = await agentFactory.createAgent(type as AgentType, config);
    const registration = await agentRegistry.registerAgent(agent, type as AgentType);
    
    res.status(201).json(registration);
  } catch (error) {
    logger.error('Failed to create agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Get agent by ID
app.get('/api/v1/agents/:id', async (req: Request, res: Response) => {
  try {
    const agent = await agentRegistry.getAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agent);
  } catch (error) {
    logger.error(`Failed to get agent ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve agent' });
  }
});

// Get agent health
app.get('/api/v1/agents/:id/health', async (req: Request, res: Response) => {
  try {
    const agent = await agentRegistry.getAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const isHealthy = await agent.agent.healthCheck();
    const metrics = await agent.agent.getMetrics();
    
    res.json({
      agentId: req.params.id,
      healthy: isHealthy,
      metrics
    });
  } catch (error) {
    logger.error(`Failed to get agent health ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get agent health' });
  }
});

// Execute task (for task agents)
app.post('/api/v1/agents/:id/execute', async (req: Request, res: Response) => {
  try {
    const registration = await agentRegistry.getAgent(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    if (registration.type !== AgentType.TASK) {
      return res.status(400).json({ error: 'Agent is not a task agent' });
    }
    
    const taskAgent = registration.agent as any as TaskAgent;
    const result = await taskAgent.capabilities.executeTask(req.body);
    
    res.json(result);
  } catch (error) {
    logger.error(`Failed to execute task on agent ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to execute task' });
  }
});

// Delete agent
app.delete('/api/v1/agents/:id', async (req: Request, res: Response) => {
  try {
    const agent = await agentRegistry.getAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    if (agent.agent.shutdown) {
      await agent.agent.shutdown();
    }
    await agentRegistry.unregisterAgent(req.params.id);
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Failed to delete agent ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Get available agent types
app.get('/api/v1/agent-types', (req: Request, res: Response) => {
  const types = agentFactory.getAvailableTypes();
  res.json(types);
});

// Integration with Agent Forge
app.post('/api/v1/integrate/agent-forge', async (req: Request, res: Response) => {
  try {
    // This endpoint will integrate with agent-forge agents
    // Creating a bridge between OSSA and agent-forge
    
    const { agentPath, agentType } = req.body;
    
    // TODO: Load agent from agent-forge and wrap it
    
    res.json({
      message: 'Integration endpoint - to be implemented',
      agentPath,
      agentType
    });
  } catch (error) {
    logger.error('Failed to integrate with agent-forge:', error);
    res.status(500).json({ error: 'Integration failed' });
  }
});

// Start server
app.listen(port, () => {
  logger.info(`⚡️ OSSA Agent Core Service running on port ${port}`);
  logger.info(`📍 Health check: http://localhost:${port}/health`);
  logger.info(`📍 API Base: http://localhost:${port}/api/v1`);
  
  // Create a sample task agent
  agentFactory.createAgent(AgentType.TASK, {
    name: 'default-task-agent',
    description: 'Default task execution agent',
    maxConcurrentTasks: 10
  }).then(agent => {
    logger.info('✅ Default task agent created');
  }).catch(error => {
    logger.error('Failed to create default task agent:', error);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  // Shutdown all agents
  const agents = await agentRegistry.getAllAgents();
  for (const registration of agents) {
    if (registration.agent.shutdown) {
      await registration.agent.shutdown();
    }
  }
  
  process.exit(0);
});

export { app, agentRegistry, agentFactory };