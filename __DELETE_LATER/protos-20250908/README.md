# OSSA gRPC Protocol Buffer Definitions

This directory contains comprehensive Protocol Buffer definitions for high-performance agent communication in the Open Standards for Scalable Agents (OSSA) v0.1.8 project.

## Overview

The OSSA protobuf definitions provide a complete type-safe, high-performance communication framework for multi-agent systems, covering all aspects of agent lifecycle management, coordination, orchestration, monitoring, and security.

## Protocol Buffer Files

### Core Definitions

- **`common.proto`** - Common types and utilities used across all services
  - Universal identifiers and metadata structures
  - Performance metrics and SLA definitions
  - Health status and error handling
  - Framework integration metadata

### Service Definitions

- **`agent.proto`** - Core agent definition and management
  - Agent registration, configuration, and lifecycle
  - Conformance tiers and capability definitions
  - Framework integration (MCP, LangChain, CrewAI, AutoGen)
  - Deployment and scaling configurations

- **`coordination.proto`** - Multi-agent coordination protocols
  - Distributed coordination sessions and messaging
  - Consensus algorithms and leader election
  - Conflict resolution and state synchronization
  - Lock management and resource coordination

- **`discovery.proto`** - Universal Agent Discovery Protocol (UADP)
  - High-performance agent discovery and registration
  - Semantic search and capability matching
  - Network topology and relationship mapping
  - Performance-based agent selection

- **`orchestration.proto`** - Multi-agent workflow management
  - Complex workflow definition and execution
  - Task scheduling and resource allocation
  - Error handling and retry policies
  - Template and scheduling systems

- **`monitoring.proto`** - Comprehensive monitoring and observability
  - Health monitoring and metrics collection
  - Alerting and dashboard management
  - Distributed tracing and performance analytics
  - SLO/SLI management and reporting

- **`security.proto`** - Security and authentication framework
  - Multi-factor authentication and authorization
  - Role-based and attribute-based access control (RBAC/ABAC)
  - Cryptographic operations and key management
  - Security auditing and compliance reporting

## Key Features

### High-Performance Communication
- Protocol Buffer binary serialization for maximum efficiency
- Streaming APIs for real-time updates and monitoring
- Asynchronous operations with proper error handling
- Built-in pagination and filtering capabilities

### Enterprise Security
- Comprehensive authentication methods (API keys, OAuth, certificates, biometrics)
- Fine-grained authorization with context-aware policies
- End-to-end encryption and digital signatures
- Security auditing and compliance framework support

### Advanced Orchestration
- Support for complex workflow patterns (sequential, parallel, conditional, loops)
- Intelligent agent assignment and load balancing
- Resource management and capacity planning
- Error recovery and failover mechanisms

### Comprehensive Monitoring
- Multi-dimensional health monitoring with SLO/SLI tracking
- Real-time metrics collection and alerting
- Performance analytics and anomaly detection
- Distributed tracing for complex multi-agent workflows

### Framework Integration
- Native support for popular agent frameworks
- MCP (Model Context Protocol) for Claude Desktop integration
- LangChain, CrewAI, and AutoGen adapter patterns
- OpenAPI 3.1 specification compliance

## Architecture Compliance

### OSSA v0.1.8 Specification
- Full compliance with OSSA v0.1.8 standards
- Three-tier conformance system (Core, Enhanced, Advanced, Enterprise)
- Universal Agent Discovery Protocol (UADP) implementation
- Comprehensive security and privacy controls

### Industry Standards
- OpenAPI 3.1 compatibility
- ISO 42001 AI Management System compliance
- NIST AI Risk Management Framework alignment
- EU AI Act compliance features

## Code Generation

### Prerequisites
```bash
# Install Protocol Buffers compiler
# macOS
brew install protobuf

# Ubuntu/Debian
apt install protobuf-compiler

# Install language-specific plugins
# Go
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Node.js/TypeScript
npm install -g grpc-tools
npm install -g grpc_tools_node_protoc_ts

# Python
pip install grpcio-tools
```

### Generate Code

#### Go
```bash
# Generate Go code
protoc --go_out=./gen/go --go_opt=paths=source_relative \
       --go-grpc_out=./gen/go --go-grpc_opt=paths=source_relative \
       protos/*.proto
```

#### TypeScript/Node.js
```bash
# Generate TypeScript definitions
mkdir -p gen/typescript
protoc --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
       --ts_out=service=grpc-web:./gen/typescript \
       --js_out=import_style=commonjs:./gen/typescript \
       --grpc-web_out=import_style=typescript,mode=grpcwebtext:./gen/typescript \
       protos/*.proto
```

#### Python
```bash
# Generate Python code
python -m grpc_tools.protoc --python_out=./gen/python \
       --grpc_python_out=./gen/python \
       --proto_path=. \
       protos/*.proto
```

#### Rust
```bash
# Add to Cargo.toml:
# [build-dependencies]
# tonic-build = "0.10"
# 
# Create build.rs with tonic-build configuration
```

## Service Documentation

### AgentService (agent.proto)
Core agent management operations including registration, validation, and lifecycle management.

**Key RPCs:**
- `RegisterAgent` - Register new agents with validation
- `UpdateAgent` - Update agent configuration
- `ListAgents` - Query and filter registered agents
- `ValidateAgent` - Validate OSSA compliance
- `StreamAgentStatus` - Real-time agent status updates

### CoordinationService (coordination.proto)
Multi-agent coordination and communication protocols.

**Key RPCs:**
- `InitiateCoordination` - Start coordination sessions
- `SendMessage` - Inter-agent messaging
- `ElectLeader` - Distributed leader election
- `AcquireLock` - Distributed locking
- `ProposeConsensus` - Consensus proposal voting

### DiscoveryService (discovery.proto)
Universal Agent Discovery Protocol implementation.

**Key RPCs:**
- `DiscoverAgents` - Capability-based agent discovery
- `SemanticSearch` - Natural language agent search
- `GetTopology` - Network topology analysis
- `StreamDiscoveryUpdates` - Real-time discovery events
- `ProbeHealth` - Agent health verification

### OrchestrationService (orchestration.proto)
Multi-agent workflow orchestration and management.

**Key RPCs:**
- `CreateWorkflow` - Define new workflows
- `ExecuteWorkflow` - Execute workflow instances
- `StreamWorkflowExecution` - Real-time execution monitoring
- `CreateTemplate` - Create reusable workflow templates
- `ScheduleWorkflow` - Schedule recurring workflows

### MonitoringService (monitoring.proto)
Comprehensive monitoring and observability platform.

**Key RPCs:**
- `RegisterForMonitoring` - Register agents for monitoring
- `ReportMetrics` - Submit custom metrics
- `StreamHealthUpdates` - Real-time health monitoring
- `CreateDashboard` - Build monitoring dashboards
- `PerformHealthCheck` - Execute health checks

### SecurityService (security.proto)
Security, authentication, and authorization framework.

**Key RPCs:**
- `Authenticate` - Multi-method authentication
- `Authorize` - Fine-grained authorization
- `CreateSecurityPolicy` - Define security policies
- `EncryptData` / `DecryptData` - Cryptographic operations
- `PerformSecurityAudit` - Security auditing

## Usage Examples

### Basic Agent Registration
```typescript
// TypeScript example
import { AgentServiceClient } from './gen/typescript/agent_grpc_pb';
import { RegisterAgentRequest, Agent } from './gen/typescript/agent_pb';

const client = new AgentServiceClient('localhost:9090');
const request = new RegisterAgentRequest();

const agent = new Agent();
agent.getId().setId('my-agent-001');
agent.getMetadata().setName('My AI Agent');
// ... configure agent

request.setAgent(agent);

client.registerAgent(request, (error, response) => {
  if (error) {
    console.error('Registration failed:', error);
  } else {
    console.log('Agent registered:', response.getAgentId());
  }
});
```

### Workflow Execution
```python
# Python example
import grpc
from gen.python import orchestration_pb2, orchestration_pb2_grpc

channel = grpc.insecure_channel('localhost:9090')
client = orchestration_pb2_grpc.OrchestrationServiceStub(channel)

# Create workflow request
request = orchestration_pb2.ExecuteWorkflowRequest()
request.workflow_id.id = 'my-workflow-001'

# Execute workflow
response = client.ExecuteWorkflow(request)
print(f"Workflow execution started: {response.execution_id.id}")
```

### Agent Discovery
```go
// Go example
import (
    "context"
    "log"
    
    pb "github.com/ossa/proto/v1"
    "google.golang.org/grpc"
)

conn, err := grpc.Dial("localhost:9090", grpc.WithInsecure())
if err != nil {
    log.Fatal(err)
}
defer conn.Close()

client := pb.NewDiscoveryServiceClient(conn)

req := &pb.DiscoverAgentsRequest{
    Query: &pb.DiscoveryQuery{
        Capabilities: []string{"reasoning", "analysis"},
    },
}

resp, err := client.DiscoverAgents(context.Background(), req)
if err != nil {
    log.Fatal(err)
}

for _, agent := range resp.Agents {
    log.Printf("Found agent: %s", agent.Metadata.Name)
}
```

## Performance Considerations

### Optimization Features
- **Streaming APIs**: Reduce latency for real-time operations
- **Batch Operations**: Minimize round-trips for bulk operations
- **Compression**: Built-in gRPC compression for large payloads
- **Connection Pooling**: Reuse connections for better performance
- **Async Operations**: Non-blocking operations where appropriate

### Scalability Patterns
- **Load Balancing**: Client-side and server-side load balancing
- **Circuit Breaking**: Automatic failure detection and recovery
- **Rate Limiting**: Protect services from overload
- **Caching**: Reduce database load with intelligent caching
- **Horizontal Scaling**: Stateless service design for easy scaling

## Security Best Practices

### Transport Security
- Always use TLS 1.3+ for production deployments
- Implement mutual TLS (mTLS) for service-to-service communication
- Use certificate-based authentication for high-security environments

### Authentication & Authorization
- Implement proper token validation and refresh mechanisms
- Use fine-grained permissions with RBAC/ABAC
- Enable audit logging for all security-sensitive operations
- Implement proper session management and timeout policies

### Data Protection
- Encrypt sensitive data at rest and in transit
- Use proper key management and rotation policies
- Implement data classification and handling procedures
- Follow privacy regulations (GDPR, CCPA, etc.)

## Monitoring and Observability

### Metrics Collection
- Expose Prometheus-compatible metrics
- Track SLI/SLO compliance automatically
- Monitor service health and performance
- Collect custom business metrics

### Distributed Tracing
- Use OpenTelemetry for distributed tracing
- Trace requests across service boundaries
- Monitor latency and error rates
- Debug performance bottlenecks

### Alerting
- Configure alerts for SLO violations
- Implement escalation policies
- Use multiple notification channels
- Balance alert sensitivity vs. noise

## Contributing

### Adding New Services
1. Create new `.proto` file with service definition
2. Follow existing naming conventions and patterns
3. Include comprehensive documentation
4. Add proper error handling and validation
5. Update this README with service documentation

### Modifying Existing Services
1. Ensure backward compatibility
2. Update version numbers appropriately  
3. Add deprecation warnings for removed features
4. Update generated code and examples
5. Test all affected client implementations

## Testing

### Unit Testing
```bash
# Test protobuf compilation
protoc --proto_path=. --descriptor_set_out=/dev/null protos/*.proto

# Validate with buf (if using buf.build)
buf build
buf lint
buf breaking --against main
```

### Integration Testing
- Test generated clients with actual gRPC servers
- Verify cross-language compatibility
- Test streaming operations under load
- Validate security implementations

## Deployment

### Container Deployment
```dockerfile
# Example Dockerfile for gRPC service
FROM golang:1.21-alpine AS builder
COPY . /app
WORKDIR /app
RUN go build -o service ./cmd/service

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /service
EXPOSE 9090
CMD ["./service"]
```

### Kubernetes Deployment
```yaml
# Example Kubernetes service
apiVersion: v1
kind: Service
metadata:
  name: ossa-agent-service
spec:
  selector:
    app: ossa-agent
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP
```

## Support

For questions, issues, or contributions:
1. Check existing GitHub issues
2. Review the OSSA specification documentation
3. Join community discussions
4. Submit detailed bug reports with reproduction steps

---

## License

This protobuf definition is part of the OSSA project and follows the same licensing terms. See the main project LICENSE file for details.