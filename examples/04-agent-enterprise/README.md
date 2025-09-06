# Test Agent - OAAS v0.1.8 Gold Standard

[![OAAS Version](https://img.shields.io/badge/OAAS-v0.1.8-green.svg)](https://github.com/openapi-ai-agents/standard)
[![Certification Level](https://img.shields.io/badge/Certification-Gold-yellow.svg)](https://github.com/openapi-ai-agents/standard)
[![Compliance](https://img.shields.io/badge/Compliance-ISO%2042001%20%7C%20NIST%20AI%20RMF%20%7C%20EU%20AI%20Act-blue.svg)](https://github.com/openapi-ai-agents/standard)

> **Production-ready test agent** providing comprehensive testing, validation, and analysis capabilities with full OAAS compliance and universal framework compatibility.

## 🎯 Overview

The Test Agent is a **Gold-level OAAS compliant** agent that provides comprehensive testing, validation, and analysis capabilities. It supports all major AI frameworks and protocols, making it the perfect choice for quality assurance, compliance validation, and performance analysis.

### Key Features

- **🧪 Comprehensive Testing**: Unit, integration, E2E, performance, and security testing
- **📋 Compliance Validation**: ISO 42001, NIST AI RMF, EU AI Act validation
- **🔍 Code Analysis**: Quality, security, performance, and maintainability analysis
- **📊 Performance Benchmarking**: Load testing and optimization recommendations
- **🔒 Security Assessment**: Vulnerability scanning and compliance checking
- **📚 Documentation Generation**: Automated documentation and report generation
- **🌉 Universal Compatibility**: Works with LangChain, CrewAI, AutoGen, OpenAI, Anthropic MCP, Google Vertex AI

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Python 3.8+
- Docker (optional, for containerized deployment)
- API key for authentication (optional for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/openapi-ai-agents/standard.git
cd standard/.agents/test-agent

# Install dependencies
npm install

# Start the agent
npm start
```

### Basic Usage

```bash
# Health check
curl http://localhost:8080/api/v1/health

# Execute a test
curl -X POST http://localhost:8080/api/v1/test/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "test_type": "integration",
    "test_suite": "api_validation",
    "parameters": {"timeout": 300}
  }'

# Validate compliance
curl -X POST http://localhost:8080/api/v1/validate/compliance \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "specification": "agent.yml content",
    "frameworks": ["iso-42001", "nist-ai-rmf"]
  }'
```

## 📋 API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check |
| `/test/execute` | POST | Execute test scenarios |
| `/validate/compliance` | POST | Validate OAAS compliance |
| `/analyze/code` | POST | Analyze code quality |
| `/benchmark/performance` | POST | Benchmark performance |
| `/security/assess` | POST | Security assessment |
| `/docs/generate` | POST | Generate documentation |
| `/metrics` | GET | Performance metrics |

### Protocol Bridge Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp/tools` | GET | MCP tools |
| `/mcp/resources` | GET | MCP resources |
| `/a2a/agent-card` | GET | A2A agent card |
| `/uadp/discover` | GET | UADP discovery |

## 🔧 Framework Integration

### LangChain

```python
from langchain.tools import Tool
from langchain.agents import Agent

# Create test execution tool
test_tool = Tool(
    name="execute_test",
    description="Execute a test scenario",
    func=execute_test_function,
    args_schema=TestExecutionInput
)

# Create agent with test capabilities
agent = Agent(
    tools=[test_tool],
    llm=llm,
    agent_type="zero-shot-react-description"
)
```

### CrewAI

```python
from crewai import Agent, Task, Crew

# Create test specialist agent
test_agent = Agent(
    role='Test Specialist',
    goal='Execute comprehensive tests and validate quality',
    backstory='Expert in testing methodologies and quality assurance',
    tools=[test_tool, validation_tool],
    verbose=True
)

# Create test execution task
test_task = Task(
    description='Execute integration tests for API endpoints',
    agent=test_agent,
    expected_output='Test execution report with results and recommendations'
)

# Create crew and execute
crew = Crew(agents=[test_agent], tasks=[test_task])
result = crew.kickoff()
```

### AutoGen

```python
import autogen

# Create test agent
test_agent = autogen.AssistantAgent(
    name="test_specialist",
    system_message="You are a test specialist. Execute tests and provide analysis.",
    llm_config={"config_list": config_list}
)

# Create user proxy
user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=1
)

# Start conversation
user_proxy.initiate_chat(
    test_agent,
    message="Execute integration tests for the API endpoints"
)
```

### OpenAI Assistants

```python
from openai import OpenAI

client = OpenAI(api_key='your-api-key')

# Create assistant with test capabilities
assistant = client.beta.assistants.create(
    name="Test Agent",
    instructions="You are a test specialist. Execute tests and provide analysis.",
    model="gpt-4",
    tools=[{
        "type": "function",
        "function": {
            "name": "execute_test",
            "description": "Execute a test scenario",
            "parameters": {
                "type": "object",
                "properties": {
                    "test_type": {"type": "string"},
                    "test_suite": {"type": "string"}
                }
            }
        }
    }]
)
```

### Anthropic MCP

```json
{
  "mcpServers": {
    "test-agent": {
      "command": "node",
      "args": ["test-agent-mcp-server.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🏗️ Architecture

### Core Components

```
test-agent/
├── agent.yml              # OAAS configuration (400+ lines)
├── openapi.yaml           # API specification (800+ lines)
├── README.md              # This documentation
└── data/                  # Training and configuration data
    ├── training-data.json     # Training examples and patterns
    ├── knowledge-base.json    # Domain expertise and best practices
    ├── configurations.json    # Agent behavior settings
    └── examples.json          # API usage examples
```

### Capabilities

#### Primary Capabilities

1. **Test Execution** (`test_execution`)
   - Unit, integration, E2E, performance, and security testing
   - Comprehensive test reporting and analysis
   - Automated test suite execution

2. **Validation Analysis** (`validation_analysis`)
   - OAAS compliance validation
   - ISO 42001, NIST AI RMF, EU AI Act compliance
   - Certification level assessment

3. **Code Analysis** (`code_analysis`)
   - Quality, security, performance, and maintainability analysis
   - Multi-language support (TypeScript, JavaScript, Python, Java, C#)
   - Detailed recommendations and suggestions

#### Secondary Capabilities

- **Performance Benchmarking**: Load testing and optimization
- **Security Assessment**: Vulnerability scanning and compliance
- **Documentation Generation**: Automated documentation and reports

### Protocol Support

- **OpenAPI 3.1**: Native API specification
- **MCP (Model Context Protocol)**: Full tool and resource support
- **A2A (Agent-to-Agent)**: Agent card and discovery
- **UADP (Universal Agent Discovery Protocol)**: Automatic discovery

## 🔒 Security

### Authentication

- **API Key**: `X-API-Key` header
- **JWT Bearer**: `Authorization: Bearer <token>`
- **OAuth2**: Authorization code flow

### Authorization

- **RBAC**: Role-based access control
- **Roles**: `user`, `admin`, `service`
- **Permissions**: `read`, `write`, `admin`

### Encryption

- **At Rest**: AES-256 encryption
- **In Transit**: TLS 1.3
- **Key Management**: HSM or KMS

### Audit Logging

- Comprehensive activity logging
- Security event monitoring
- Compliance audit trails

## 📊 Performance

### Optimization Features

- **Token Optimization**: 35-45% cost reduction
- **Smart Caching**: Semantic caching with embeddings
- **Response Compression**: Gzip/Brotli compression
- **Request Deduplication**: Content hash-based caching

### Monitoring

- **Health Checks**: `/health`, `/ready`, `/startup`
- **Metrics**: `/metrics` endpoint
- **Alerting**: Email and Slack notifications
- **Tracing**: Distributed tracing support

### Scaling

- **Horizontal Scaling**: 1-5 replicas
- **Resource Limits**: 512Mi memory, 250m CPU
- **Load Balancing**: Round-robin distribution
- **Auto-scaling**: CPU and memory-based scaling

## 🏢 Enterprise Features

### Compliance

- **ISO 42001:2023**: AI Management Systems
- **NIST AI RMF 1.0**: AI Risk Management Framework
- **EU AI Act**: European AI regulation compliance

### Governance

- **Audit Trails**: Comprehensive activity logging
- **Data Governance**: Privacy and data protection
- **Risk Management**: Automated risk assessment
- **Compliance Monitoring**: Continuous compliance validation

### Support

- **24/7 Monitoring**: Continuous health monitoring
- **Incident Response**: Automated alerting and escalation
- **Documentation**: Comprehensive API and user documentation
- **Training**: Framework integration guides and examples

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t test-agent .

# Run container
docker run -p 8080:8080 \
  -e API_KEY=your-api-key \
  -e NODE_ENV=production \
  test-agent
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-agent
spec:
  replicas: 2
  selector:
    matchLabels:
      app: test-agent
  template:
    metadata:
      labels:
        app: test-agent
    spec:
      containers:
      - name: test-agent
        image: test-agent:latest
        ports:
        - containerPort: 8080
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: test-agent-secrets
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "250m"
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `API_KEY` | API authentication key | Required |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `CACHE_TTL` | Cache TTL in seconds | `3600` |

## 📈 Monitoring

### Health Checks

```bash
# Basic health check
curl http://localhost:8080/api/v1/health

# Readiness check
curl http://localhost:8080/api/v1/ready

# Startup check
curl http://localhost:8080/api/v1/startup
```

### Metrics

```bash
# Get performance metrics
curl http://localhost:8080/api/v1/metrics
```

### Logging

- **Structured Logging**: JSON format
- **Log Levels**: `debug`, `info`, `warn`, `error`
- **Destinations**: Console, file, remote service
- **Correlation IDs**: Request tracing

## 🔧 Configuration

### Agent Configuration

The agent behavior can be customized through the `data/configurations.json` file:

```json
{
  "agent_config": {
    "defaults": {
      "timeout_seconds": 300,
      "max_retries": 3,
      "rate_limit_per_minute": 100
    },
    "security": {
      "require_authentication": true,
      "rate_limiting": true
    },
    "performance": {
      "cache_enabled": true,
      "cache_duration_seconds": 3600
    }
  }
}
```

### Framework Integration

Configure framework-specific settings:

```json
{
  "framework_integrations": {
    "langchain": {
      "tool_type": "structured",
      "async_support": true,
      "streaming": true
    },
    "crewai": {
      "role": "test_specialist",
      "delegation": true
    }
  }
}
```

## 🧪 Testing

### Test the Agent

```bash
# Run health check
curl http://localhost:8080/api/v1/health

# Execute a simple test
curl -X POST http://localhost:8080/api/v1/test/execute \
  -H "Content-Type: application/json" \
  -d '{
    "test_type": "unit",
    "test_suite": "basic_validation"
  }'

# Validate compliance
curl -X POST http://localhost:8080/api/v1/validate/compliance \
  -H "Content-Type: application/json" \
  -d '{
    "specification": "apiVersion: openapi-ai-agents/v0.1.8",
    "frameworks": ["iso-42001"]
  }'
```

### Integration Tests

```bash
# Run integration tests
npm test

# Run with coverage
npm run test:coverage

# Run performance tests
npm run test:performance
```

## 📚 Examples

### Complete Testing Workflow

```bash
#!/bin/bash

# 1. Health check
echo "Checking agent health..."
curl -s http://localhost:8080/api/v1/health | jq '.status'

# 2. Execute unit tests
echo "Running unit tests..."
curl -X POST http://localhost:8080/api/v1/test/execute \
  -H "Content-Type: application/json" \
  -d '{"test_type": "unit", "test_suite": "api_validation"}' | jq '.test_id'

# 3. Run integration tests
echo "Running integration tests..."
curl -X POST http://localhost:8080/api/v1/test/execute \
  -H "Content-Type: application/json" \
  -d '{"test_type": "integration", "test_suite": "end_to_end"}' | jq '.test_id'

# 4. Security assessment
echo "Running security assessment..."
curl -X POST http://localhost:8080/api/v1/security/assess \
  -H "Content-Type: application/json" \
  -d '{"target": "api_endpoints", "assessment_type": ["vulnerability"]}' | jq '.security_score'

# 5. Generate compliance report
echo "Generating compliance report..."
curl -X POST http://localhost:8080/api/v1/validate/compliance \
  -H "Content-Type: application/json" \
  -d '{"specification": "agent.yml", "frameworks": ["iso-42001", "nist-ai-rmf"]}' | jq '.certification_level'
```

### Framework Integration Examples

See `data/examples.json` for comprehensive examples of:

- LangChain integration
- CrewAI workflows
- AutoGen conversations
- OpenAI Assistants setup
- Anthropic MCP configuration
- Google Vertex AI integration

## 🤝 Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/openapi-ai-agents/standard.git
cd standard/.agents/test-agent

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Coverage**: 90%+ required

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit pull request

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](../../LICENSE) for details.

## 🆘 Support

### Documentation

- **API Reference**: [OpenAPI Specification](./openapi.yaml)
- **Examples**: [Usage Examples](./data/examples.json)
- **Configuration**: [Agent Configuration](./data/configurations.json)

### Community

- **GitHub Issues**: [Report bugs and request features](https://github.com/openapi-ai-agents/standard/issues)
- **Discord**: [Join the community](https://discord.gg/openapi-agents)
- **Documentation**: [Comprehensive guides](https://docs.openapi-ai-agents.org)

### Enterprise Support

- **Email**: <enterprise@openapi-ai-agents.org>
- **Slack**: Enterprise support channel
- **Phone**: 24/7 support hotline

---

**Test Agent** - Production-ready testing, validation, and analysis with full OAAS compliance and universal framework compatibility.

*Built with ❤️ by the OpenAPI AI Agents Standard community*
