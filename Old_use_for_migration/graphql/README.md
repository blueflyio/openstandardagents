# OSSA v0.1.8 GraphQL Schemas

This directory contains comprehensive GraphQL schemas for the Open Standards for Scalable Agents (OSSA) v0.1.8 system.

## Schema Organization

### Core Schemas
- `agent-discovery.graphql` - Agent discovery and registration
- `agent-orchestration.graphql` - Multi-agent orchestration and workflow management
- `agent-telemetry.graphql` - Performance monitoring and metrics
- `agent-subscriptions.graphql` - Real-time events and notifications

### Supporting Schemas
- `scalars.graphql` - Custom scalar types and directives
- `enums.graphql` - Enumeration definitions
- `inputs.graphql` - Input type definitions
- `types.graphql` - Core type definitions

### Integration
- `federation.graphql` - Apollo Federation configuration
- `schema.graphql` - Complete combined schema

## Key Features

### Agent Discovery
- Multi-protocol agent discovery (REST, GraphQL, gRPC, WebSocket, MCP)
- Capability-based agent matching
- Performance-aware routing
- Health status monitoring

### Orchestration
- Multi-agent workflow coordination
- Task dependency management
- Resource allocation and budgeting
- Compliance validation

### Telemetry
- Real-time performance metrics
- Historical data analysis
- SLA monitoring
- Cost tracking

### Real-time Updates
- Agent status changes
- Workflow progress updates
- Performance alerts
- Compliance notifications

## Usage

### With Apollo Server
```typescript
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFileSync } from 'fs';

const schema = makeExecutableSchema({
  typeDefs: readFileSync('./graphql/schema.graphql', 'utf8'),
  resolvers: // your resolvers
});
```

### With Federation
```typescript
import { buildFederatedSchema } from '@apollo/federation';

const federatedSchema = buildFederatedSchema({
  typeDefs: readFileSync('./graphql/federation.graphql', 'utf8'),
  resolvers: // your resolvers
});
```

## Standards Compliance

- OSSA v0.1.8 compliant
- Supports all OSSA agent taxonomy types
- Implements 360° feedback loops
- Includes ACTA token optimization
- Federal compliance ready (FedRAMP, NIST)