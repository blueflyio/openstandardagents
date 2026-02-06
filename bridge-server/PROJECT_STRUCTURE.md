# OSSA Bridge Server - Project Structure

Complete overview of the project structure and file organization.

---

## Directory Tree

```
bridge-server/
├── src/                                    # TypeScript source code
│   ├── server.ts                          # Main Express application (149 lines)
│   ├── routes/                            # HTTP route handlers
│   │   ├── execute.ts                     # POST /api/v1/execute (125 lines)
│   │   ├── agents.ts                      # GET /api/v1/agents (75 lines)
│   │   └── health.ts                      # GET /health (51 lines)
│   ├── services/                          # Business logic services
│   │   ├── agent-runtime.service.ts       # Agent execution & caching (208 lines)
│   │   └── tracing.service.ts             # OpenTelemetry tracing (130 lines)
│   └── types/                             # TypeScript types & schemas
│       └── index.ts                       # Type definitions & Zod schemas (84 lines)
├── package.json                           # NPM package configuration
├── tsconfig.json                          # TypeScript compiler configuration
├── .eslintrc.json                         # ESLint configuration
├── .env.example                           # Environment variable template
├── .gitignore                             # Git ignore rules
├── Dockerfile                             # Multi-stage Docker build
├── docker-compose.yml                     # Docker Compose configuration
├── test-api.sh                            # API test script (109 lines)
├── README.md                              # Complete project documentation (523 lines)
├── QUICKSTART.md                          # 5-minute quick start guide (294 lines)
├── INTEGRATION.md                         # Integration guide (623 lines)
├── IMPLEMENTATION_SUMMARY.md              # Implementation summary (812 lines)
├── NEXT_STEPS.md                          # Next steps checklist (445 lines)
└── PROJECT_STRUCTURE.md                   # This file
```

**Total Source Code**: 822 lines of TypeScript
**Total Documentation**: 2,697 lines of Markdown
**Total Project**: 3,600+ lines

---

## File Descriptions

### Source Code (`src/`)

#### Core Application

**`src/server.ts`** (149 lines)
- Express app initialization and configuration
- Middleware setup (CORS, JSON parsing, logging)
- Route registration (health, agents, execute)
- Root endpoint with API information
- 404 and error handlers
- Graceful shutdown logic (SIGTERM, SIGINT)
- Startup diagnostics and logging

**Key Functions**:
- `startServer()` - Initialize and start HTTP server
- Request logging middleware
- Error handling middleware
- Graceful shutdown handlers

**Dependencies**: express, cors, route handlers, tracing service

---

#### Route Handlers (`src/routes/`)

**`src/routes/execute.ts`** (125 lines)
- POST `/api/v1/execute` endpoint
- Request body validation using Zod
- Agent execution via agent-runtime service
- OpenTelemetry span tracking
- Comprehensive error handling
- Execution time tracking
- Response formatting with metadata

**Request Schema**:
```typescript
{
  agentId: string,
  input: Record<string, unknown>,
  context: Record<string, unknown>,
  timeout: number (default 300000, max 300000)
}
```

**Response Schema**:
```typescript
{
  success: boolean,
  result?: unknown,
  error?: { code, message, details },
  metadata: { agentId, executionTime, traceId, timestamp }
}
```

**Error Handling**:
- 400: Invalid input
- 404: Agent not found
- 500: Execution failed
- 504: Timeout

---

**`src/routes/agents.ts`** (75 lines)
- GET `/api/v1/agents` - List all agents
- GET `/api/v1/agents/:agentId` - Get agent details
- Agent metadata response formatting
- Error handling for not found and server errors

**Response Schema**:
```typescript
{
  success: boolean,
  agents: AgentMetadata[],
  count: number,
  timestamp: string
}
```

---

**`src/routes/health.ts`** (51 lines)
- GET `/health` endpoint
- Server uptime tracking
- Component health checks (agent runtime, tracing)
- Overall status calculation (ok, degraded, error)
- HTTP status codes (200 for ok/degraded, 503 for error)

**Response Schema**:
```typescript
{
  status: 'ok' | 'degraded' | 'error',
  version: string,
  uptime: number,
  timestamp: string,
  services: {
    agentRuntime: 'ok' | 'error',
    tracing: 'ok' | 'error'
  }
}
```

---

#### Services (`src/services/`)

**`src/services/agent-runtime.service.ts`** (208 lines)
- Agent execution orchestration
- In-memory caching (Map-based)
- Cache TTL management (1 min default)
- LRU eviction (100 entry limit)
- Timeout handling
- Integration points for agent-protocol
- Placeholder implementation (for testing)

**Key Methods**:
- `executeAgent()` - Execute agent with caching and tracing
- `listAgents()` - Get available agents from registry
- `getAgent()` - Get specific agent metadata
- `executeAgentViaProtocol()` - Delegate to agent-protocol (placeholder)
- `getFromCache()` - Retrieve cached result
- `setInCache()` - Store result in cache
- `clearCache()` - Clear all cached results

**Caching Strategy**:
- Key: `${agentId}:${JSON.stringify(input)}`
- TTL: 60 seconds
- Max entries: 100 (LRU eviction)
- Per-instance (not shared across replicas)

**Future**: Replace with Redis for shared cache

---

**`src/services/tracing.service.ts`** (130 lines)
- OpenTelemetry SDK initialization
- OTLP HTTP exporter configuration
- Span creation and management
- Agent execution span tracking
- Error recording in traces
- Trace ID extraction
- Graceful degradation when disabled

**Key Methods**:
- `initialize()` - Set up OpenTelemetry SDK
- `startAgentExecutionSpan()` - Create span for agent execution
- `recordAgentResult()` - Add result attributes to span
- `recordError()` - Record error in span
- `endSpan()` - End span
- `getTraceId()` - Extract trace ID
- `shutdown()` - Clean shutdown
- `isEnabled()` - Check if tracing is active

**Span Attributes**:
- `agent.id` - Agent identifier
- `agent.input.size` - Input data size
- `agent.execution.time_ms` - Execution time
- `agent.result.size` - Result size

**Configuration**:
- Requires `OTEL_EXPORTER_OTLP_ENDPOINT` env var
- Sends traces to OTLP HTTP endpoint
- Service name: `ossa-bridge-server`

---

#### Types (`src/types/`)

**`src/types/index.ts`** (84 lines)
- Zod schema for request validation
- TypeScript interfaces for responses
- Custom error class
- Error code enum

**Exports**:
- `ExecuteAgentRequestSchema` - Zod schema for POST /api/v1/execute
- `ExecuteAgentRequest` - Inferred TypeScript type
- `ExecuteAgentResponse` - Response interface
- `AgentMetadata` - Agent information interface
- `HealthResponse` - Health check response interface
- `BridgeErrorCode` - Error code enum
- `BridgeError` - Custom error class

**Request Validation**:
```typescript
const ExecuteAgentRequestSchema = z.object({
  agentId: z.string().min(1),
  input: z.record(z.unknown()).optional().default({}),
  context: z.record(z.unknown()).optional().default({}),
  timeout: z.number().int().positive().max(300000).optional().default(300000),
});
```

**Error Codes**:
- `AGENT_NOT_FOUND` (404)
- `AGENT_EXECUTION_FAILED` (500)
- `INVALID_INPUT` (400)
- `TIMEOUT` (504)
- `INTERNAL_ERROR` (500)

---

### Configuration Files

**`package.json`** (42 lines)
- Package name: `@bluefly/ossa-bridge-server`
- Version: `0.1.0`
- Type: `module` (ES modules)
- Main: `dist/server.js`
- Scripts: dev, build, start, lint, type-check
- Dependencies: Express, CORS, OpenTelemetry, Zod
- Dev dependencies: TypeScript, tsx, ESLint, type definitions
- Engines: Node.js >=18.0.0

**`tsconfig.json`** (23 lines)
- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Source maps and declarations
- Output directory: `./dist`
- Root directory: `./src`

**`.eslintrc.json`** (20 lines)
- Parser: @typescript-eslint/parser
- Plugins: @typescript-eslint
- Extends: recommended configs
- Custom rules for unused vars and any types

**`.env.example`** (13 lines)
- Server configuration (PORT, HOST, NODE_ENV)
- OSSA configuration (REGISTRY_PATH)
- OpenTelemetry configuration (OTLP_ENDPOINT)

**`.gitignore`** (29 lines)
- node_modules
- dist
- .env
- logs
- IDE files
- OS files
- cache directories

---

### Deployment Files

**`Dockerfile`** (49 lines)
- Multi-stage build (builder + production)
- Base: node:18-alpine
- Builder stage: Install deps, build TypeScript
- Production stage: Copy built files, production deps only
- Non-root user (nodejs:1001)
- Health check command
- Expose port 9090
- Optimized layer caching

**Size**: ~150MB (Alpine-based)

**`docker-compose.yml`** (35 lines)
- Bridge server service definition
- Port mapping: 9090:9090
- Environment variables
- Volume mounts (agents, logs)
- Network configuration
- Health check configuration
- Restart policy: unless-stopped
- Optional Tempo service (commented)

---

### Testing Files

**`test-api.sh`** (109 lines)
- Bash script for API testing
- 8 test cases covering all endpoints
- Colored output (red/green/yellow)
- JSON response formatting with jq
- Exit code based on test results
- Configurable base URL

**Test Cases**:
1. Health Check (GET /health)
2. Root Endpoint (GET /)
3. List Agents (GET /api/v1/agents)
4. Get Specific Agent (GET /api/v1/agents/:id)
5. Execute Agent - Valid (POST /api/v1/execute)
6. Execute Agent - Invalid (missing agentId)
7. Execute Agent - Not Found (nonexistent agent)
8. Unknown Endpoint (404 test)

**Usage**:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

### Documentation Files

**`README.md`** (523 lines)
- Project overview and features
- Architecture diagram
- Installation instructions
- Configuration guide
- Complete API reference
- Development guide
- Integration with agent-protocol
- Monitoring setup
- Deployment options (Docker, Kubernetes)
- Troubleshooting guide

**`QUICKSTART.md`** (294 lines)
- 5-minute setup guide
- Installation steps
- Configuration examples
- Testing commands
- Docker quick start
- Next steps checklist
- Environment variables table
- Common troubleshooting

**`INTEGRATION.md`** (623 lines)
- agent-protocol integration (HTTP & SDK options)
- Complete PHP client library for Drupal
- Drupal service definition examples
- OpenTelemetry setup (Tempo, Jaeger)
- Grafana dashboard configuration
- Kubernetes deployment manifests
- Docker Compose production examples
- Nginx configuration
- GitLab CI/CD pipeline
- Security considerations
- Troubleshooting common issues

**`IMPLEMENTATION_SUMMARY.md`** (812 lines)
- Complete implementation overview
- Architecture details
- File-by-file explanations
- API endpoint documentation
- Configuration reference
- Features implemented checklist
- Integration points (agent-protocol, Drupal)
- Testing guide
- Deployment options
- Security considerations
- Performance characteristics
- Known limitations
- Success criteria

**`NEXT_STEPS.md`** (445 lines)
- 9-phase implementation plan
- Detailed checklists for each phase
- Time estimates
- Priority order
- Quick reference commands
- Support resources
- Success metrics

**`PROJECT_STRUCTURE.md`** (This file)
- Complete project structure overview
- File descriptions
- Line counts
- Dependencies
- Code organization

---

## Code Statistics

### TypeScript Source Code

| File | Lines | Purpose |
|------|-------|---------|
| `src/server.ts` | 149 | Main application |
| `src/services/agent-runtime.service.ts` | 208 | Agent execution |
| `src/services/tracing.service.ts` | 130 | OpenTelemetry |
| `src/routes/execute.ts` | 125 | Execute endpoint |
| `src/types/index.ts` | 84 | Type definitions |
| `src/routes/agents.ts` | 75 | Agent endpoints |
| `src/routes/health.ts` | 51 | Health check |
| **Total** | **822** | **7 files** |

### Documentation

| File | Lines | Purpose |
|------|-------|---------|
| `IMPLEMENTATION_SUMMARY.md` | 812 | Implementation details |
| `INTEGRATION.md` | 623 | Integration guide |
| `README.md` | 523 | Main documentation |
| `NEXT_STEPS.md` | 445 | Roadmap |
| `QUICKSTART.md` | 294 | Quick start guide |
| `PROJECT_STRUCTURE.md` | ~300 | This file |
| **Total** | **~3000** | **6 files** |

### Configuration & Deployment

| File | Lines | Purpose |
|------|-------|---------|
| `test-api.sh` | 109 | API tests |
| `Dockerfile` | 49 | Docker build |
| `package.json` | 42 | NPM config |
| `docker-compose.yml` | 35 | Docker Compose |
| `.gitignore` | 29 | Git ignore |
| `tsconfig.json` | 23 | TypeScript config |
| `.eslintrc.json` | 20 | ESLint config |
| `.env.example` | 13 | Environment template |
| **Total** | **320** | **8 files** |

### Grand Total

- **Source Code**: 822 lines
- **Documentation**: ~3,000 lines
- **Configuration**: 320 lines
- **Total Project**: ~4,100 lines
- **Total Files**: 21 files

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@bluefly/openstandardagents` | workspace:* | OSSA core package |
| `@opentelemetry/api` | ^1.9.0 | OpenTelemetry API |
| `@opentelemetry/sdk-node` | ^0.53.0 | OpenTelemetry SDK |
| `@opentelemetry/exporter-trace-otlp-http` | ^0.53.0 | OTLP exporter |
| `@opentelemetry/resources` | ^1.28.0 | Resource detection |
| `@opentelemetry/semantic-conventions` | ^1.28.0 | Semantic conventions |
| `express` | ^4.21.2 | HTTP server |
| `cors` | ^2.8.5 | CORS middleware |
| `zod` | ^3.24.1 | Schema validation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/express` | ^5.0.0 | Express types |
| `@types/cors` | ^2.8.17 | CORS types |
| `@types/node` | ^22.10.5 | Node.js types |
| `@typescript-eslint/eslint-plugin` | ^8.20.0 | ESLint TypeScript support |
| `@typescript-eslint/parser` | ^8.20.0 | TypeScript parser |
| `eslint` | ^9.18.0 | Code linting |
| `tsx` | ^4.19.2 | TypeScript executor |
| `typescript` | ^5.7.3 | TypeScript compiler |

**Total Dependencies**: 17 packages

---

## Code Organization Principles

### Separation of Concerns

1. **Routes** (`src/routes/`)
   - HTTP endpoint handlers
   - Request/response formatting
   - Input validation
   - Status code management

2. **Services** (`src/services/`)
   - Business logic
   - External integrations
   - Caching
   - Tracing

3. **Types** (`src/types/`)
   - Type definitions
   - Validation schemas
   - Error classes

### Design Patterns

- **Singleton Services**: `agentRuntimeService`, `tracingService`
- **Middleware Pattern**: Express middlewares (CORS, logging, error handling)
- **Repository Pattern**: Agent runtime service (abstract agent-protocol)
- **Decorator Pattern**: OpenTelemetry tracing (wrap operations with spans)
- **Strategy Pattern**: Cache eviction (LRU)

### Error Handling

- **Custom Error Class**: `BridgeError` with error codes
- **Error Codes**: Enum for standardized error codes
- **HTTP Status Mapping**: Error codes map to HTTP status codes
- **Error Context**: Errors include details for debugging

### Code Quality

- **TypeScript Strict Mode**: Full type safety
- **ESLint**: Code style enforcement
- **No `any` Types**: Prefer `unknown` with type guards
- **Explicit Return Types**: For public methods
- **JSDoc Comments**: For complex functions
- **Unused Variables**: Prefixed with `_` or removed

---

## Build Process

### Development Build

```bash
npm run dev
```

- Uses `tsx` for hot reload
- Watches `src/` directory
- Starts server immediately
- No build step required

### Production Build

```bash
npm run build
npm start
```

1. TypeScript compilation (`tsc`)
2. Output to `dist/` directory
3. Source maps generated
4. Declaration files (.d.ts) created
5. Run with `node dist/server.js`

### Docker Build

```bash
docker build -t ossa-bridge-server .
```

**Multi-stage build**:
1. **Builder stage**: Install deps, compile TypeScript
2. **Production stage**: Copy built files, install prod deps only
3. **Result**: Optimized ~150MB image

---

## Testing Strategy

### Unit Tests (TODO)

- Test individual functions
- Mock external dependencies
- Use Jest or Vitest

### Integration Tests (TODO)

- Test API endpoints
- Use Supertest
- Test with real Express app

### API Tests (Implemented)

- `test-api.sh` script
- 8 smoke tests
- Covers all endpoints

### Load Tests (TODO)

- Use k6 or Apache Bench
- Test performance under load
- Identify bottlenecks

---

## Deployment Strategy

### Local Development

- Run with `npm run dev`
- Use `.env` for configuration
- Connect to local agent-protocol

### Staging

- Deploy with Docker Compose
- Use staging environment variables
- Connect to staging agent-protocol
- Enable tracing to staging Tempo

### Production

- Deploy to Kubernetes
- Use Helm charts
- Multiple replicas (3+)
- HTTPS/TLS termination
- Production tracing backend
- Monitoring and alerts

---

## Future Enhancements

### Short Term

- [ ] Implement agent-protocol integration
- [ ] Add authentication middleware
- [ ] Enable rate limiting
- [ ] Shared cache (Redis)

### Medium Term

- [ ] Streaming responses
- [ ] WebSocket support
- [ ] Batch execution
- [ ] Result webhooks
- [ ] Prometheus metrics

### Long Term

- [ ] GraphQL API
- [ ] Admin UI
- [ ] Agent versioning
- [ ] Circuit breaker pattern
- [ ] Request replay

---

## References

- **Main Documentation**: [README.md](./README.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Integration Guide**: [INTEGRATION.md](./INTEGRATION.md)
- **Implementation Summary**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Next Steps**: [NEXT_STEPS.md](./NEXT_STEPS.md)
- **OSSA Specification**: https://openstandardagents.org
- **GitLab Repository**: https://gitlab.com/blueflyio/openstandardagents

---

**Last Updated**: 2026-02-04
**Version**: 0.1.0
**Status**: Ready for Integration Testing
