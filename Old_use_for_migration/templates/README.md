# OSSA API-First Templates v0.1.8

This directory contains comprehensive API-first templates for building OSSA-compliant agents with 360° Feedback Loop and ACTA token optimization framework support.

## 📋 Template Overview

### Available Templates

| Template | Description | Protocol | Features |
|----------|-------------|----------|-----------|
| **OpenAPI** | REST API specification | HTTP/REST | Complete OSSA v0.1.8 compliance, 360° Feedback Loop, ACTA optimization |
| **GraphQL** | GraphQL schema definition | HTTP/GraphQL | Real-time subscriptions, federation support, streaming operations |
| **gRPC** | Protocol Buffers definition | gRPC/HTTP2 | High-performance streaming, bi-directional communication, type safety |

## 🏗️ OSSA v0.1.8 Architecture

### Core Components

#### 360° Feedback Loop
The templates implement the complete feedback loop cycle:

```
Plan → Execute → Review → Judge → Learn → Govern
```

**Agent Taxonomy Support:**
- **Orchestrators**: Goal decomposition, task planning, workflow management
- **Workers**: Task execution with self-reporting capabilities  
- **Critics**: Multi-dimensional reviews and feedback generation
- **Judges**: Binary decisions through pairwise comparisons
- **Trainers**: Synthesize feedback into learning signals
- **Governors**: Budget enforcement and compliance monitoring
- **Monitors**: Telemetry collection and system health tracking
- **Integrators**: Cross-system adapters and protocol bridges

#### ACTA Token Optimization Framework
Adaptive Contextual Token Architecture provides:

- **Vector-Semantic Compression**: 60-75% token reduction with 90%+ semantic fidelity
- **Dynamic Model Switching**: ML-based complexity analysis for optimal model selection
- **Persistent Context Graph**: Cross-session knowledge retention (82% vs 15% baseline)
- **Cost Optimization**: 40% average cost reduction

## 🚀 Quick Start

### 1. OpenAPI Template Usage

```bash
# Copy the OpenAPI template
cp templates/openapi-template.yaml your-agent-api.yaml

# Customize for your agent
vim your-agent-api.yaml

# Validate the specification
swagger-codegen validate -i your-agent-api.yaml

# Generate client SDKs
swagger-codegen generate -i your-agent-api.yaml -l typescript-fetch -o ./client
```

**Key Endpoints:**
- `/agents` - Agent discovery and registration
- `/feedback/*` - 360° Feedback Loop operations
- `/acta/*` - Token optimization and compression
- `/health` - Health monitoring and metrics

### 2. GraphQL Schema Usage

```bash
# Copy the GraphQL schema
cp templates/graphql-schema.graphql your-agent-schema.graphql

# Customize for your agent
vim your-agent-schema.graphql

# Generate TypeScript types
graphql-codegen --config codegen.yml

# Start GraphQL server (example with Apollo)
npm install apollo-server-express graphql
node graphql-server.js
```

**Key Features:**
- Real-time subscriptions for agent status and feedback loop events
- Federation support for multi-agent systems
- Custom directives for OSSA compliance and ACTA optimization

### 3. gRPC Service Usage

```bash
# Copy the proto definition
cp templates/grpc-service.proto your-agent.proto

# Customize for your agent
vim your-agent.proto

# Generate Go code
protoc --go_out=. --go-grpc_out=. your-agent.proto

# Generate other languages
protoc --python_out=. --python-grpc_out=. your-agent.proto
protoc --js_out=import_style=commonjs:. --grpc-web_out=import_style=commonjs,mode=grpcwebtext:. your-agent.proto
```

**Key Services:**
- `OSSAAgentService` - Core agent operations
- `OSSAFeedbackService` - 360° Feedback Loop management
- `OSSAACTAService` - Token optimization operations
- `OSSAGovernanceService` - Budget and compliance management

## 🔧 Configuration Examples

### Agent Registration (OpenAPI)

```json
{
  "id": "api-orchestrator-v1",
  "name": "API Orchestrator Agent",
  "version": "1.0.0",
  "taxonomy": {
    "primary_type": "orchestrator",
    "secondary_types": ["monitor"],
    "specialization": "api-coordination",
    "compliance_level": "silver"
  },
  "capabilities": [
    {
      "name": "coordinate_api_calls",
      "description": "Orchestrates multiple API calls with dependency management",
      "input_schema": { "type": "object" },
      "output_schema": { "type": "object" },
      "frameworks": ["langchain", "crewai"],
      "acta_optimized": true,
      "token_cost": {
        "estimated_tokens": 150,
        "cost_per_request": 0.0002
      }
    }
  ],
  "acta_config": {
    "enabled": true,
    "compression_strategy": "vector_semantic",
    "model_switching": {
      "enabled": true,
      "strategy": "complexity_based",
      "models": [
        {
          "tier": "lightweight",
          "model_id": "gpt-3.5-turbo",
          "max_tokens": 4096,
          "cost_per_token": 0.0000015
        },
        {
          "tier": "standard", 
          "model_id": "gpt-4",
          "max_tokens": 8192,
          "cost_per_token": 0.00003
        }
      ]
    }
  }
}
```

### 360° Feedback Loop Execution (GraphQL)

```graphql
# Create execution plan
mutation CreatePlan {
  createExecutionPlan(input: {
    goal: "Validate and optimize API endpoints"
    requirements: [
      "Check OpenAPI compliance",
      "Validate response schemas",
      "Optimize token usage"
    ]
    constraints: {
      maxTokens: 10000
      deadline: "2024-01-01T12:00:00Z"
      complianceRequired: ["ossa-v0.1.8"]
    }
    actaPreferences: {
      compressionLevel: "balanced"
      modelPreference: "cost_optimized"
    }
  }) {
    id
    budget {
      totalTokens
      remainingTokens
      enforcementPolicy
    }
    timeline {
      estimatedDurationMinutes
      deadline
    }
  }
}

# Execute the plan
mutation ExecutePlan {
  executePlan(planId: "plan-123") {
    id
    status
    tokensUsed
    performanceData {
      responseTimeMs
      tokenEfficiency {
        compressionRatio
        costReduction
      }
    }
  }
}

# Subscribe to execution updates
subscription ExecutionUpdates {
  executionStatusChanged(executionId: "exec-456") {
    status
    tokensUsed
    actaOptimizations {
      compressionApplied
      compressionRatio
      tokensSaved
    }
  }
}
```

### ACTA Token Compression (gRPC)

```go
// Compress context using ACTA
req := &pb.CompressContextRequest{
    Context: "Large context with repetitive patterns and verbose descriptions...",
    Strategy: pb.CompressionStrategy_COMPRESSION_STRATEGY_VECTOR_SEMANTIC,
    TargetReduction: 0.7, // 70% reduction target
    PreserveSemantics: true,
}

result, err := client.CompressContext(ctx, req)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Compressed context: %s\n", result.CompressedContext)
fmt.Printf("Compression ratio: %.2f\n", result.CompressionRatio)
fmt.Printf("Tokens saved: %d\n", result.TokensSaved)
fmt.Printf("Semantic fidelity: %.2f\n", result.SemanticFidelity)

// Later, expand the context
expandReq := &pb.ExpandContextRequest{
    Reference: result.ExpansionReference,
}

expanded, err := client.ExpandContext(ctx, expandReq)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Expanded context: %s\n", expanded.ExpandedContext)
```

## 📊 Compliance Levels

### Bronze Level (Basic)
- ✅ Basic object support
- ✅ Core endpoints
- ✅ JSON validation
- ✅ Simple agent registration

### Silver Level (Production)
- ✅ Full 360° Feedback Loop implementation
- ✅ Token budget enforcement
- ✅ Audit logging
- ✅ ACDL registration
- ✅ Basic ACTA optimization

### Gold Level (Enterprise)
- ✅ Multi-protocol support (REST/GraphQL/gRPC)
- ✅ Advanced ACTA optimization
- ✅ Props token resolution
- ✅ Learning signal processing
- ✅ Workspace management
- ✅ Real-time streaming
- ✅ Federation support

## 🔐 Security Features

### Authentication & Authorization
```yaml
# OpenAPI Security Schemes
security:
  - ApiKeyAuth: []
  - BearerAuth: []  
  - OAuth2: []

# GraphQL Authentication Context
type Mutation {
  registerAgent(input: AgentInput!): Agent! @auth(requires: ADMIN)
  executeAgent(id: ID!): ExecutionResult! @auth(requires: USER)
}

# gRPC Interceptors
func authInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    // Validate JWT token from metadata
    md, ok := metadata.FromIncomingContext(ctx)
    // ... authentication logic
}
```

### Data Protection
- **Encryption in Transit**: TLS 1.3 for all communications
- **Data Classification**: Public, Internal, Confidential, Restricted
- **Audit Trails**: Immutable logging with hash-chaining
- **Privacy Controls**: GDPR/CCPA compliance features

## 📈 Performance Optimization

### ACTA Token Strategies

1. **Key-based Context**: Pass IDs, not full documents
2. **Delta Prompting**: Send only changes between iterations  
3. **Tiered Depth**: Shallow initial prompts, expand as needed
4. **Output-only Critique**: Review results without full artifacts
5. **Cacheable Capsules**: Version-controlled policy/style guides
6. **Vector Pre-filters**: Top-k retrieval with late expansion
7. **Pre-LLM Validation**: Rules/regex/schema checks before LLM
8. **Compression Support**: zstd/base64 for payloads
9. **Checkpoint Memos**: Compressed summaries vs full history
10. **Early Exit Logic**: Heuristics to terminate unproductive paths

### Performance Targets
- **Token Reduction**: 50-70% vs baseline implementations
- **Response Latency**: <250ms p99 for standard operations
- **Compression Fidelity**: >90% semantic preservation
- **Cost Reduction**: 30-40% average savings

## 🛠️ Development Tools

### Code Generation
```bash
# OpenAPI
npm install -g @openapitools/openapi-generator-cli
openapi-generator-cli generate -i openapi-template.yaml -g typescript-fetch

# GraphQL  
npm install -g @graphql-codegen/cli
graphql-codegen --config codegen.yml

# gRPC
# Install protoc and plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

### Validation Tools
```bash
# OpenAPI validation
swagger-codegen validate -i openapi-template.yaml

# GraphQL validation  
graphql-schema-linter graphql-schema.graphql

# Proto validation
buf lint grpc-service.proto
```

### Testing Frameworks
```bash
# API Testing
npm install --save-dev @apidevtools/swagger-parser
npm install --save-dev newman

# GraphQL Testing
npm install --save-dev graphql-tools
npm install --save-dev apollo-server-testing

# gRPC Testing  
go get -u github.com/grpc-ecosystem/go-grpc-middleware/testing
```

## 🔄 Integration Patterns

### Multi-Agent Orchestration
```yaml
# Agent Composition Pattern
version: "3.8"
services:
  orchestrator:
    image: ossa-orchestrator:v1.0.0
    environment:
      - OSSA_COMPLIANCE_LEVEL=gold
      - ACTA_ENABLED=true
      - FEEDBACK_LOOP_ENABLED=true
    ports:
      - "8080:8080"
      - "50051:50051"
      
  worker-api:
    image: ossa-worker-api:v1.0.0
    environment:
      - OSSA_COMPLIANCE_LEVEL=silver
      - ACTA_COMPRESSION_STRATEGY=vector_semantic
    
  critic-reviewer:
    image: ossa-critic:v1.0.0
    environment:
      - OSSA_COMPLIANCE_LEVEL=gold
      - REVIEW_DIMENSIONS=quality,completeness,efficiency,compliance
```

### Framework Integration
```javascript
// LangChain Integration
import { OSSAAgent } from '@ossa/langchain-adapter';

const agent = new OSSAAgent({
  apiEndpoint: 'https://api.agent.ossa.bluefly.io/v1',
  complianceLevel: 'silver',
  actaConfig: {
    compressionStrategy: 'vector_semantic',
    modelSwitching: true
  }
});

// CrewAI Integration  
from ossa_crewai import OSSACrewAgent

agent = OSSACrewAgent(
    role="API Validator",
    goal="Ensure API compliance with OSSA standards", 
    backstory="Expert in API validation and optimization",
    ossa_config={
        "compliance_level": "gold",
        "acta_enabled": True,
        "feedback_loop": True
    }
)
```

## 🚦 Deployment Guide

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-agent
  labels:
    app: ossa-agent
    ossa-version: "0.1.8"
    compliance-level: "gold"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ossa-agent
  template:
    metadata:
      labels:
        app: ossa-agent
      annotations:
        ossa/agent-type: "orchestrator"
        ossa/acta-enabled: "true"
        ossa/feedback-loop: "enabled"
    spec:
      containers:
      - name: ossa-agent
        image: ossa-agent:v0.1.8
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 50051
          name: grpc
        env:
        - name: OSSA_COMPLIANCE_LEVEL
          value: "gold"
        - name: ACTA_VECTOR_STORE_URL
          value: "qdrant://qdrant:6333"
        - name: FEEDBACK_LOOP_ENABLED
          value: "true"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ossa-agent-service
spec:
  selector:
    app: ossa-agent
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: grpc
    port: 50051
    targetPort: 50051
```

### Docker Compose
```yaml
version: "3.8"

services:
  ossa-agent:
    build: .
    ports:
      - "8080:8080"
      - "50051:50051"
    environment:
      - OSSA_VERSION=0.1.8
      - COMPLIANCE_LEVEL=gold
      - ACTA_ENABLED=true
      - VECTOR_STORE_URL=qdrant://qdrant:6333
      - FEEDBACK_LOOP_ENABLED=true
    depends_on:
      - qdrant
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  qdrant_data:
```

## 📚 Additional Resources

### Documentation Links
- [OSSA Specification v0.1.8](../docs/reference/agent-specification.md)
- [ACTA Framework Documentation](../docs/resources/ACTA_FRAMEWORK_VALIDATION_REPORT.md) 
- [360° Feedback Loop Guide](../docs/guides/feedback-loop.md)
- [API Reference](../docs/api/ossa-api-reference.md)

### Example Implementations
- [Basic Worker Agent](../examples/04-agent-enterprise/)
- [Orchestrator Agent](../examples/12-enterprise-devops/)
- [Multi-Agent System](../examples/06-workspace-enterprise/)

### Community & Support
- **GitHub Issues**: Report bugs and request features
- **Discussion Forum**: Community support and best practices
- **Enterprise Support**: Commercial support and consulting

---

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](../LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](../docs/CONTRIBUTING.md) for details on our code of conduct and development process.

---

*Generated for OSSA v0.1.8 - Open Standards for Scalable Agents*