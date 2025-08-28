# Agent Deployment API Documentation

## Overview

The Agent Deployment System provides comprehensive APIs for managing a 20-agent ecosystem with orchestration and communication capabilities. All services are currently running and operational.

## Active Services

### Agent Deployment Service (Port 4020)

Base URL: `http://localhost:4020`

#### Endpoints

##### `GET /health`
Health check endpoint for the deployment service.

**Response:**
```json
{
  "status": "healthy",
  "agents": 20,
  "port": 4020
}
```

##### `POST /api/v1/deploy-all`
Deploy all 20 agents across all phases.

**Response:**
```json
{
  "success": true,
  "message": "20-agent deployment initiated",
  "deployed": 20
}
```

##### `POST /api/v1/deploy-phase/{phase}`
Deploy agents for a specific phase.

**Parameters:**
- `phase` (string): Phase name (Foundation, Development, Content & Compliance, Quality Assurance, Specialized)

**Response:**
```json
{
  "success": true,
  "phase": "Development",
  "deployed": 5
}
```

##### `GET /api/v1/agents`
Get status of all deployed agents.

**Response:**
```json
{
  "agents": [
    {
      "name": "orchestrator-supreme",
      "status": "running",
      "type": "orchestration",
      "port": 4021,
      "health": "healthy"
    }
    // ... 19 more agents
  ],
  "total": 20
}
```

##### `POST /api/v1/route-task`
Route a task to the appropriate agent based on capabilities.

**Request Body:**
```json
{
  "task": {
    "type": "module_development",
    "description": "Create new Drupal module"
  },
  "capabilities": ["module_development", "drupal_standards"],
  "priority": "normal"
}
```

**Response:**
```json
{
  "agent": "drupal-expert",
  "result": {
    "status": "completed",
    "output": "Module created successfully"
  }
}
```

### Agent Communication Router (Port 4050)

Base URL: `http://localhost:4050`

#### Endpoints

##### `GET /health`
Health check endpoint for the communication router.

**Response:**
```json
{
  "status": "healthy",
  "protocols": 4,
  "discoveredAgents": 20,
  "port": 4050
}
```

##### `POST /api/v1/route-message`
Route a message between agents.

**Request Body:**
```json
{
  "fromAgent": "orchestrator-supreme",
  "toAgent": "drupal-expert",
  "message": {
    "type": "task_assignment",
    "content": "Create authentication module"
  },
  "priority": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "fromAgent": "orchestrator-supreme",
  "toAgent": "drupal-expert",
  "protocol": "Development Coordination Protocol",
  "timestamp": "2025-08-28T04:09:32.151Z",
  "result": {
    "success": true,
    "responseTime": 45
  }
}
```

##### `POST /api/v1/broadcast`
Broadcast a message to all agents with a specific capability.

**Request Body:**
```json
{
  "capability": "security_scanning",
  "message": {
    "task": "security_audit",
    "target": "new_module"
  },
  "excludeAgents": []
}
```

**Response:**
```json
{
  "results": [
    {
      "agent": "security-guardian",
      "success": true,
      "result": "Scan completed"
    }
  ],
  "broadcasted": 1
}
```

##### `POST /api/v1/delegate-task`
Create a task delegation workflow.

**Request Body:**
```json
{
  "task": {
    "type": "module_development",
    "description": "Build payment gateway module"
  },
  "requiredCapabilities": ["module_development", "api_integration"],
  "priority": "high",
  "workflow": "sequential"
}
```

**Response:**
```json
{
  "id": "delegation-1756354172151",
  "task": {...},
  "assignedAgents": [
    {
      "name": "drupal-expert",
      "type": "development",
      "role": "coordinator"
    }
  ],
  "status": "completed",
  "results": [...]
}
```

##### `POST /api/v1/coordinate`
Coordinate multiple agents for complex workflows.

**Request Body:**
```json
{
  "agents": ["drupal-expert", "qa-lead", "security-guardian", "documentation-specialist"],
  "coordinationType": "drupal_development",
  "parameters": {
    "module": "ai_agent_test",
    "features": ["module_creation", "testing", "security_scan", "documentation"]
  }
}
```

**Response:**
```json
{
  "id": "coordination-1756354172151",
  "type": "drupal_development",
  "agents": [...],
  "status": "completed",
  "results": [
    {
      "step": "module_development",
      "agent": "drupal-expert",
      "result": {...}
    }
  ]
}
```

##### `GET /api/v1/coordination-status`
Get current coordination status and agent details.

**Response:**
```json
{
  "totalAgents": 20,
  "activeProtocols": 4,
  "agents": [
    {
      "name": "orchestrator-supreme",
      "type": "orchestration",
      "status": "running",
      "capabilities": ["agent_coordination", "task_routing"],
      "lastContact": "2025-08-28T04:08:54.123Z"
    }
    // ... 19 more agents
  ]
}
```

## Communication Protocols

The system implements 4 communication protocols:

| Protocol | Priority | Timeout | Retry | Use Case |
|----------|----------|---------|-------|----------|
| Orchestration | High | 30s | 3x exponential | Complex multi-agent workflows |
| Development | Normal | 60s | 2x linear | Development task coordination |
| Compliance | High | 45s | 3x exponential | Compliance and security workflows |
| Emergency | Critical | 5s | 5x immediate | Critical system issues |

## Pre-configured Workflows

### Drupal Development Workflow
**Type:** `drupal_development`  
**Sequence:** Sequential  
**Agents:** drupal-expert → qa-lead → security-guardian → documentation-specialist

### Security Audit Workflow
**Type:** `security_audit`  
**Sequence:** Parallel  
**Agents:** security-guardian, gov-compliance-agent, accessibility-guardian

### Performance Optimization Workflow
**Type:** `performance_optimization`  
**Sequence:** Sequential  
**Agents:** performance-engineer → ai-ml-specialist → mobile-optimization-agent

### Content Pipeline Workflow
**Type:** `content_pipeline`  
**Sequence:** Sequential  
**Agents:** content-manager → documentation-specialist → search-optimization-agent

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Successful operation
- `404 Not Found`: Resource or agent not found
- `500 Internal Server Error`: Server error with error message

Error response format:
```json
{
  "error": "Error message description"
}
```

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing:
- Per-agent rate limits
- Global API rate limits
- Priority-based throttling

## Authentication

Currently no authentication is required. In production, implement:
- API key authentication
- JWT tokens for agent-to-agent communication
- Role-based access control (RBAC)