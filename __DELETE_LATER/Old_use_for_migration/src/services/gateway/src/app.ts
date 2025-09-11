/**
 * Gateway Service Express Application
 * Provides REST API endpoints for the OSSA gateway service
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { OAASService, DiscoveredAgent } from '../../index';
import { RuntimeBridge } from './runtime-bridge';

// Create Express app
export const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const oaasService = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  cacheEnabled: true,
  validationStrict: false,
  discoveryPaths: ['./src', './agents', './modules']
});

const runtimeBridge = new RuntimeBridge({
  projectRoot: process.cwd(),
  enabledFrameworks: ['drupal', 'mcp', 'langchain', 'crewai'],
  executionTimeout: 30000,
  maxConcurrentExecutions: 10,
  debugMode: process.env.NODE_ENV === 'development'
});

// In-memory storage for testing
const agents: Map<string, DiscoveredAgent & { registered_at: string }> = new Map();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  if (!apiKey || apiKey !== 'test-key') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Health endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      version: '0.1.8',
      ossa_version: '0.1.8',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: {
        agent_registry: 'healthy',
        discovery_engine: 'healthy',
        graphql_api: 'healthy'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Version endpoint
app.get('/version', (req: Request, res: Response) => {
  res.json({
    api: '0.1.8',
    ossa: '0.1.8',
    platform: process.platform
  });
});

// Agents endpoints
app.get('/agents', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const classFilter = req.query.class as string;

    let filteredAgents = Array.from(agents.values());
    
    if (classFilter) {
      filteredAgents = filteredAgents.filter(agent => 
        (agent as any).spec?.class === classFilter
      );
    }

    const paginatedAgents = filteredAgents.slice(offset, offset + limit);

    res.json({
      agents: paginatedAgents,
      total: filteredAgents.length,
      limit,
      offset
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/agents', requireAuth, async (req: Request, res: Response) => {
  try {
    const agentSpec = req.body;

    // Basic validation
    if (!agentSpec.name || !agentSpec.version || !agentSpec.spec) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, version, spec' 
      });
    }

    // Check for duplicates
    const existingAgent = Array.from(agents.values()).find(
      agent => agent.name === agentSpec.name && agent.version === agentSpec.version
    );
    
    if (existingAgent) {
      return res.status(409).json({ 
        error: 'Agent with this name and version already exists' 
      });
    }

    // Validate spec structure
    if (!agentSpec.spec.conformance_tier || 
        !agentSpec.spec.class || 
        !agentSpec.spec.capabilities ||
        !agentSpec.spec.endpoints?.health) {
      return res.status(400).json({ 
        error: 'Invalid agent spec: validation failed' 
      });
    }

    // Create agent record
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const agent = {
      id: agentId,
      name: agentSpec.name,
      version: agentSpec.version,
      format: 'oaas' as const,
      source_path: `virtual://${agentSpec.name}`,
      capabilities: [],
      resources: [],
      metadata: agentSpec,
      confidence: 1.0,
      oaas_spec: agentSpec.spec,
      last_discovered: new Date(),
      registered_at: new Date().toISOString(),
      description: agentSpec.description,
      endpoint: agentSpec.endpoint,
      spec: agentSpec.spec
    };

    agents.set(agentId, agent);

    res.status(201).json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/agents/:id', async (req: Request, res: Response) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/agents/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const updateData = req.body;
    
    // Update agent
    const updatedAgent = {
      ...agent,
      ...updateData,
      id: agent.id, // Preserve ID
      last_discovered: new Date()
    };

    agents.set(req.params.id, updatedAgent);

    res.json(updatedAgent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/agents/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agents.delete(req.params.id);

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Gateway error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

export default app;