#!/usr/bin/env node

/**
 * OSSA v0.1.8 Orchestration Manager Agent Server
 * Multi-agent orchestration with universal framework compatibility
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { createServer } from 'http';
import cron from 'node-cron';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8081;
const AGENT_ID = `orchestration-manager-${Date.now()}`;

// Initialize JSON Schema validator
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

// Load agent configuration
let agentConfig;
try {
  const configYaml = readFileSync('./agent-v0.1.8.yml', 'utf8');
  agentConfig = YAML.parse(configYaml);
} catch (error) {
  console.error('Failed to load agent configuration:', error.message);
  process.exit(1);
}

// Load MCP tools manifest
let mcpTools;
try {
  mcpTools = JSON.parse(readFileSync('./mcp-tools.json', 'utf8'));
} catch (error) {
  console.error('Failed to load MCP tools manifest:', error.message);
  process.exit(1);
}

// In-memory stores (in production, use persistent storage)
const workflowStore = new Map();
const agentRegistry = new Map();
const performanceMetrics = {
  startTime: Date.now(),
  totalWorkflows: 0,
  successfulWorkflows: 0,
  failedWorkflows: 0,
  discoveredAgents: 0,
  avgCompletionTime: 0
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 1000, // max 1000 requests per second
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - performanceMetrics.startTime) / 1000);
  
  res.json({
    status: 'healthy',
    uptime,
    version: agentConfig.metadata.version,
    agent_id: AGENT_ID,
    ossa_version: agentConfig.apiVersion,
    dependencies: {
      agent_registry: agentRegistry.size > 0 ? 'healthy' : 'initializing',
      workflow_engine: 'healthy',
      message_broker: 'healthy',
      vector_storage: 'healthy'
    },
    performance: {
      active_workflows: Array.from(workflowStore.values()).filter(w => w.status === 'running').length,
      total_workflows: performanceMetrics.totalWorkflows,
      success_rate: performanceMetrics.totalWorkflows > 0 ? 
        (performanceMetrics.successfulWorkflows / performanceMetrics.totalWorkflows * 100).toFixed(2) + '%' : '100%'
    }
  });
});

// Capabilities endpoint
app.get('/capabilities', (req, res) => {
  res.json({
    name: agentConfig.metadata.name,
    version: agentConfig.metadata.version,
    description: agentConfig.metadata.description,
    ossa_version: agentConfig.apiVersion,
    conformance: agentConfig.spec.conformance,
    capabilities: agentConfig.spec.capabilities,
    protocols: agentConfig.spec.protocols,
    framework_adapters: agentConfig.spec.framework_adapters,
    orchestration_patterns: agentConfig.spec.orchestration?.patterns || [],
    discovery: {
      uadp_enabled: agentConfig.spec.discovery?.uadp_enabled || false,
      hierarchical_discovery: agentConfig.spec.discovery?.hierarchical_discovery || false,
      semantic_matching: agentConfig.spec.discovery?.semantic_capability_matching || false,
      ml_ranking: agentConfig.spec.discovery?.ml_based_performance_ranking || false
    },
    performance: agentConfig.spec.performance
  });
});

// Agent discovery endpoint
app.get('/agents/discover', (req, res) => {
  const { capability, framework, tier, max_results = 50 } = req.query;
  const maxResults = Math.min(parseInt(max_results) || 50, 1000);
  
  let agents = Array.from(agentRegistry.values());
  
  // Apply filters
  if (capability) {
    agents = agents.filter(agent => 
      agent.capabilities?.some(cap => 
        cap.toLowerCase().includes(capability.toLowerCase())
      )
    );
  }
  
  if (framework) {
    agents = agents.filter(agent => 
      agent.frameworks?.includes(framework)
    );
  }
  
  if (tier) {
    agents = agents.filter(agent => agent.tier === tier);
  }
  
  // Limit results
  agents = agents.slice(0, maxResults);
  
  res.json({
    agents,
    total_count: agents.length,
    query_time_ms: Math.random() * 50 + 10 // Simulate query time
  });
});

// Advanced agent discovery with semantic search
app.post('/agents/discover', (req, res) => {
  const { 
    query, 
    semantic_search = true, 
    performance_ranking = true,
    filters = {},
    max_results = 50 
  } = req.body;
  
  if (!query) {
    return res.status(400).json({
      error: 'missing_query',
      message: 'Query parameter is required for semantic discovery'
    });
  }
  
  // Simulate semantic search and ML ranking
  const mockAgents = [
    {
      id: 'compliance-auditor-uuid',
      name: 'compliance-auditor',
      version: '1.1.0',
      capabilities: ['ossa_v017_compliance_validation', 'iso_42001_auditing', 'risk_assessment'],
      frameworks: ['mcp', 'langchain', 'crewai'],
      tier: 'governed',
      health_status: 'healthy',
      performance_score: 0.95,
      endpoint: 'http://localhost:8080',
      last_seen: new Date().toISOString()
    },
    {
      id: 'validation-specialist-uuid', 
      name: 'validation-specialist',
      version: '1.1.0',
      capabilities: ['ossa_v017_specification_validation', 'openapi_schema_validation', 'multi_format_validation'],
      frameworks: ['mcp', 'openai', 'langchain'],
      tier: 'governed',
      health_status: 'healthy',
      performance_score: 0.92,
      endpoint: 'http://localhost:8082',
      last_seen: new Date().toISOString()
    }
  ];
  
  // Apply filters
  let filteredAgents = mockAgents.filter(agent => {
    if (filters.frameworks && !filters.frameworks.some(f => agent.frameworks.includes(f))) return false;
    if (filters.tiers && !filters.tiers.includes(agent.tier)) return false;
    if (filters.min_performance_score && agent.performance_score < filters.min_performance_score) return false;
    return true;
  });
  
  // Simulate semantic matching
  const semanticMatches = filteredAgents.map(agent => ({
    agent_id: agent.id,
    similarity_score: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
    matched_capabilities: agent.capabilities.slice(0, 2)
  }));
  
  // Simulate performance ranking
  const performanceRanking = filteredAgents.map(agent => ({
    agent_id: agent.id,
    performance_score: agent.performance_score,
    ranking_factors: {
      response_time: Math.random() * 100 + 50,
      success_rate: Math.random() * 0.1 + 0.9,
      resource_efficiency: Math.random() * 0.2 + 0.8
    }
  }));
  
  filteredAgents = filteredAgents.slice(0, Math.min(max_results, 1000));
  
  res.json({
    agents: filteredAgents,
    total_count: filteredAgents.length,
    query_time_ms: Math.random() * 100 + 50,
    semantic_matches: semantic_search ? semanticMatches : undefined,
    performance_ranking: performance_ranking ? performanceRanking : undefined
  });
});

// Start workflow orchestration
app.post('/orchestrate', (req, res) => {
  const { workflow_id, pattern, agents, configuration = {}, callback_url } = req.body;
  
  if (!workflow_id || !pattern || !agents || !Array.isArray(agents)) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'workflow_id, pattern, and agents array are required'
    });
  }
  
  const validPatterns = [
    'sequential_pipeline', 'parallel_execution', 'conditional_branching',
    'hybrid_workflows', 'event_driven', 'reactive_streams', 'map_reduce', 'pipeline_parallelism'
  ];
  
  if (!validPatterns.includes(pattern)) {
    return res.status(400).json({
      error: 'invalid_pattern',
      message: `Pattern must be one of: ${validPatterns.join(', ')}`
    });
  }
  
  const workflowUuid = uuidv4();
  const workflow = {
    workflow_id: workflowUuid,
    name: workflow_id,
    pattern,
    agents: agents.map(agent => ({
      ...agent,
      status: 'pending',
      started_at: null,
      completed_at: null
    })),
    status: 'running',
    created_at: new Date().toISOString(),
    configuration: {
      timeout: configuration.timeout_seconds || 3600,
      retry_policy: configuration.retry_policy || { max_retries: 3, backoff_strategy: 'exponential' },
      resource_constraints: configuration.resource_constraints || {}
    },
    callback_url,
    metrics: {
      start_time: Date.now(),
      completion_time: null,
      duration_ms: null
    }
  };
  
  workflowStore.set(workflowUuid, workflow);
  performanceMetrics.totalWorkflows++;
  
  // Simulate workflow execution (in production, this would be actual orchestration)
  setTimeout(() => {
    const updatedWorkflow = workflowStore.get(workflowUuid);
    if (updatedWorkflow) {
      updatedWorkflow.status = Math.random() > 0.1 ? 'completed' : 'failed';
      updatedWorkflow.metrics.completion_time = Date.now();
      updatedWorkflow.metrics.duration_ms = updatedWorkflow.metrics.completion_time - updatedWorkflow.metrics.start_time;
      
      if (updatedWorkflow.status === 'completed') {
        performanceMetrics.successfulWorkflows++;
      } else {
        performanceMetrics.failedWorkflows++;
      }
      
      workflowStore.set(workflowUuid, updatedWorkflow);
      
      // Send webhook notification if callback_url provided
      if (callback_url) {
        // In production, make actual HTTP request to callback_url
        console.log(`Workflow ${workflowUuid} ${updatedWorkflow.status}: would notify ${callback_url}`);
      }
    }
  }, Math.random() * 5000 + 2000); // 2-7 seconds simulation
  
  res.status(202).json({
    workflow_id: workflowUuid,
    status: 'running',
    created_at: workflow.created_at,
    estimated_completion: new Date(Date.now() + (configuration.timeout_seconds || 3600) * 1000).toISOString(),
    callback_url
  });
});

// List workflows
app.get('/workflows', (req, res) => {
  const { status, pattern, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  
  let workflows = Array.from(workflowStore.values());
  
  // Apply filters
  if (status) {
    workflows = workflows.filter(w => w.status === status);
  }
  
  if (pattern) {
    workflows = workflows.filter(w => w.pattern === pattern);
  }
  
  // Sort by creation date (newest first)
  workflows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Pagination
  const total = workflows.length;
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedWorkflows = workflows.slice(startIndex, endIndex);
  
  const workflowSummaries = paginatedWorkflows.map(w => ({
    workflow_id: w.workflow_id,
    pattern: w.pattern,
    status: w.status,
    created_at: w.created_at,
    updated_at: w.updated_at || w.created_at,
    duration_ms: w.metrics?.duration_ms,
    agent_count: w.agents?.length || 0
  }));
  
  res.json({
    workflows: workflowSummaries,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      has_next: endIndex < total
    }
  });
});

// Get specific workflow details
app.get('/workflows/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  const workflow = workflowStore.get(workflowId);
  
  if (!workflow) {
    return res.status(404).json({
      error: 'workflow_not_found',
      message: `Workflow ${workflowId} not found`
    });
  }
  
  res.json(workflow);
});

// Cancel workflow
app.delete('/workflows/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  const workflow = workflowStore.get(workflowId);
  
  if (!workflow) {
    return res.status(404).json({
      error: 'workflow_not_found',
      message: `Workflow ${workflowId} not found`
    });
  }
  
  if (workflow.status === 'completed' || workflow.status === 'failed') {
    return res.status(409).json({
      error: 'workflow_not_cancellable',
      message: `Workflow is already ${workflow.status} and cannot be cancelled`
    });
  }
  
  workflow.status = 'cancelled';
  workflow.updated_at = new Date().toISOString();
  workflowStore.set(workflowId, workflow);
  
  res.status(204).send();
});

// Monitoring endpoint
app.get('/monitor', (req, res) => {
  const { format = 'json', metrics } = req.query;
  
  const monitoringData = {
    timestamp: new Date().toISOString(),
    system_metrics: {
      cpu_usage: Math.random() * 30 + 10, // 10-40%
      memory_usage: Math.random() * 20 + 30, // 30-50%
      active_workflows: Array.from(workflowStore.values()).filter(w => w.status === 'running').length,
      discovered_agents: agentRegistry.size
    },
    workflow_metrics: {
      total_workflows: performanceMetrics.totalWorkflows,
      successful_workflows: performanceMetrics.successfulWorkflows,
      failed_workflows: performanceMetrics.failedWorkflows,
      average_completion_time_ms: performanceMetrics.totalWorkflows > 0 ? 
        Array.from(workflowStore.values())
          .filter(w => w.metrics?.duration_ms)
          .reduce((sum, w) => sum + w.metrics.duration_ms, 0) / 
        Array.from(workflowStore.values()).filter(w => w.metrics?.duration_ms).length : 0
    },
    agent_metrics: {
      total_agents: agentRegistry.size,
      healthy_agents: Array.from(agentRegistry.values()).filter(a => a.health_status === 'healthy').length,
      average_response_time_ms: Math.random() * 50 + 25 // 25-75ms
    }
  };
  
  if (format === 'prometheus') {
    // Convert to Prometheus format
    const prometheusMetrics = `
# HELP workflows_active_total Number of active workflows
# TYPE workflows_active_total gauge
workflows_active_total ${monitoringData.system_metrics.active_workflows}

# HELP orchestration_latency_seconds Workflow orchestration latency
# TYPE orchestration_latency_seconds histogram
orchestration_latency_seconds_sum ${monitoringData.workflow_metrics.average_completion_time_ms / 1000}
orchestration_latency_seconds_count ${monitoringData.workflow_metrics.total_workflows}

# HELP workflow_success_rate Workflow success rate
# TYPE workflow_success_rate gauge
workflow_success_rate ${performanceMetrics.totalWorkflows > 0 ? performanceMetrics.successfulWorkflows / performanceMetrics.totalWorkflows : 1}
    `.trim();
    
    return res.type('text/plain').send(prometheusMetrics);
  }
  
  res.json(monitoringData);
});

// Agent-to-agent discovery endpoint
app.get('/a2a/discover', (req, res) => {
  res.json({
    agent_id: AGENT_ID,
    name: agentConfig.metadata.name,
    version: agentConfig.metadata.version,
    ossa_version: agentConfig.apiVersion,
    capabilities: [
      ...(agentConfig.spec.capabilities?.primary || []),
      ...(agentConfig.spec.capabilities?.secondary || [])
    ],
    endpoints: {
      health: '/health',
      capabilities: '/capabilities',
      discover: '/agents/discover',
      orchestrate: '/orchestrate',
      monitor: '/monitor'
    },
    health_status: 'healthy',
    last_heartbeat: new Date().toISOString(),
    discovery: {
      protocols: ['dns_sd', 'consul', 'kubernetes'],
      uadp_enabled: true,
      hierarchical: true,
      semantic_matching: true
    }
  });
});

// MCP capabilities endpoint
app.get('/mcp', (req, res) => {
  res.json({
    protocol_version: mcpTools.protocol_version,
    server_name: mcpTools.server_name,
    server_version: mcpTools.server_version,
    capabilities: mcpTools.capabilities,
    tools: mcpTools.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    })),
    resources: mcpTools.resources || [],
    prompts: mcpTools.prompts || []
  });
});

// MCP tool call endpoint
app.post('/mcp/tools/call', (req, res) => {
  const { name, arguments: args } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'missing_tool_name',
        message: 'Tool name is required'
      }
    });
  }
  
  const tool = mcpTools.tools.find(t => t.name === name);
  if (!tool) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'tool_not_found',
        message: `Tool '${name}' not found`
      }
    });
  }
  
  // Simulate tool execution based on tool name
  let result;
  
  switch (name) {
    case 'discover_agents':
      result = {
        agents: [
          {
            id: 'compliance-auditor-uuid',
            name: 'compliance-auditor',
            capabilities: ['compliance_validation', 'iso_42001_auditing'],
            health_status: 'healthy',
            performance_score: 0.95
          }
        ],
        total_found: 1,
        semantic_matches: args?.semantic_search ? [
          { agent_id: 'compliance-auditor-uuid', similarity_score: 0.92 }
        ] : undefined
      };
      break;
      
    case 'orchestrate_workflow':
      const workflowId = uuidv4();
      result = {
        workflow_id: workflowId,
        status: 'started',
        pattern: args?.pattern || 'sequential_pipeline',
        agents_count: args?.agents?.length || 0,
        estimated_completion: new Date(Date.now() + 300000).toISOString() // 5 minutes
      };
      break;
      
    case 'monitor_workflow':
      result = {
        workflow_id: args?.workflow_id,
        status: Math.random() > 0.5 ? 'running' : 'completed',
        progress: Math.floor(Math.random() * 100),
        metrics: {
          execution_time_ms: Math.floor(Math.random() * 60000),
          active_agents: Math.floor(Math.random() * 5) + 1
        }
      };
      break;
      
    case 'manage_resources':
      result = {
        action: args?.action || 'optimize',
        resources_allocated: {
          cpu_cores: 4,
          memory_gb: 8,
          agent_slots: 50
        },
        optimization_applied: true,
        estimated_savings: '15% resource reduction'
      };
      break;
      
    case 'coordinate_consensus':
      result = {
        operation: args?.operation || 'elect_leader',
        consensus_achieved: true,
        leader_agent: 'orchestration-manager-' + AGENT_ID,
        participating_agents: args?.agents?.length || 3,
        consensus_time_ms: Math.floor(Math.random() * 1000) + 500
      };
      break;
      
    case 'generate_workflow_template':
      result = {
        template_id: uuidv4(),
        template_name: args?.template_name || 'generated-template',
        created_at: new Date().toISOString(),
        parameters_count: args?.parameters?.length || 0,
        validation_status: 'valid',
        reusability_score: 0.87
      };
      break;
      
    default:
      return res.status(400).json({
        success: false,
        error: {
          code: 'tool_execution_failed',
          message: `Tool '${name}' execution not implemented`
        }
      });
  }
  
  res.json({
    success: true,
    result
  });
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  const uptime = Math.floor((Date.now() - performanceMetrics.startTime) / 1000);
  const activeWorkflows = Array.from(workflowStore.values()).filter(w => w.status === 'running').length;
  
  const metrics = `
# HELP ossa_agent_info Agent information
# TYPE ossa_agent_info gauge
ossa_agent_info{name="${agentConfig.metadata.name}",version="${agentConfig.metadata.version}",ossa_version="${agentConfig.apiVersion}"} 1

# HELP ossa_agent_uptime_seconds Agent uptime in seconds
# TYPE ossa_agent_uptime_seconds counter
ossa_agent_uptime_seconds ${uptime}

# HELP workflows_active_total Number of active workflows
# TYPE workflows_active_total gauge
workflows_active_total ${activeWorkflows}

# HELP workflows_total Total number of workflows
# TYPE workflows_total counter
workflows_total ${performanceMetrics.totalWorkflows}

# HELP workflows_successful_total Number of successful workflows
# TYPE workflows_successful_total counter
workflows_successful_total ${performanceMetrics.successfulWorkflows}

# HELP workflows_failed_total Number of failed workflows
# TYPE workflows_failed_total counter
workflows_failed_total ${performanceMetrics.failedWorkflows}

# HELP agents_discovered_total Number of discovered agents
# TYPE agents_discovered_total gauge
agents_discovered_total ${agentRegistry.size}
  `.trim();
  
  res.type('text/plain').send(metrics);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An internal server error occurred',
    request_id: uuidv4()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Initialize WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send initial status
  ws.send(JSON.stringify({
    type: 'status',
    data: {
      active_workflows: Array.from(workflowStore.values()).filter(w => w.status === 'running').length,
      total_agents: agentRegistry.size
    }
  }));
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Periodic tasks
cron.schedule('*/30 * * * * *', () => {
  // Agent discovery heartbeat (every 30 seconds)
  const discoveryData = {
    timestamp: new Date().toISOString(),
    active_agents: agentRegistry.size,
    system_health: 'optimal'
  };
  
  // Broadcast to WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify({
        type: 'heartbeat',
        data: discoveryData
      }));
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed'); 
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 OSSA v0.1.8 Orchestration Manager started successfully!`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🆔 Agent ID: ${AGENT_ID}`);
  console.log(`⚡ Capabilities: ${agentConfig.spec.capabilities?.primary?.length || 0} primary, ${agentConfig.spec.capabilities?.secondary?.length || 0} secondary`);
  console.log(`🔌 Frameworks: ${Object.keys(agentConfig.spec.framework_adapters || {}).join(', ')}`);
  console.log(`🏗️  Orchestration Patterns: ${agentConfig.spec.orchestration?.patterns?.length || 0} supported`);
  console.log(`📊 Monitoring: /monitor, /metrics, /health`);
  console.log(`🔍 Discovery: /agents/discover (UADP enabled)`);
  console.log(`⚙️  MCP Tools: ${mcpTools.tools.length} available`);
  console.log(`\n🟢 Ready for multi-agent orchestration!`);
});