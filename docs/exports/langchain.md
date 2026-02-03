# LangChain Export

Export OSSA agent manifests to LangChain format with production-ready API endpoints and OpenAPI specifications.

## What Gets Generated

The LangChain exporter generates a complete, production-ready implementation:

### Generated Files

```
langchain/
├── agent.py              # Python LangChain agent implementation
├── agent.ts              # TypeScript LangChain agent implementation
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
└── README.md             # Usage documentation
```

### Key Features

- **Dual Language Support**: Both Python and TypeScript implementations
- **LangChain Integration**: Native LangChain agent classes and tools
- **OSSA Compatibility**: Maintains full compatibility with OSSA manifests
- **Production-Ready**: Includes error handling, logging, and validation

## Quick Start

### Export to LangChain

```bash
# Export OSSA manifest to LangChain
ossa export agent.ossa.yaml --platform langchain --output ./langchain-agent

# With specific language format
ossa export agent.ossa.yaml --platform langchain --format python
ossa export agent.ossa.yaml --platform langchain --format typescript

# Dry-run to preview
ossa export agent.ossa.yaml --platform langchain --dry-run --verbose
```

### Python Implementation

The generated Python agent uses LangChain's Agent and Tool classes:

```python
from langchain.agents import initialize_agent, AgentType
from langchain.llms import ChatAnthropic
from langchain.tools import Tool

# Load agent from generated file
from agent import MyAgent

# Initialize
agent = MyAgent(
    model="claude-3-5-sonnet-20241022",
    temperature=0.7,
    api_key="your-api-key"
)

# Execute
result = agent.run("Analyze this code")
print(result)
```

### TypeScript Implementation

The generated TypeScript agent uses LangChain.js:

```typescript
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { MyAgent } from "./agent";

// Initialize
const agent = new MyAgent({
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Execute
const result = await agent.call({
  input: "Analyze this code"
});

console.log(result.output);
```

## API Endpoints

### Generated Express API

Each LangChain export can optionally include Express API endpoints:

```bash
# Export with API endpoints
ossa export agent.ossa.yaml --platform langchain --with-api
```

This generates:

```
langchain/
├── api/
│   ├── server.ts         # Express server
│   ├── routes.ts         # API routes
│   └── openapi.yaml      # OpenAPI 3.1 spec
├── agent.py
├── agent.ts
└── package.json
```

### API Usage

```bash
# Start the API server
cd langchain
npm install
npm start
```

```bash
# Execute agent via REST API
curl -X POST http://localhost:3000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Analyze this code",
    "context": {}
  }'
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/execute` | Execute agent with input |
| `GET` | `/api/v1/status` | Get agent status and info |
| `GET` | `/api/v1/tools` | List available tools |
| `POST` | `/api/v1/validate` | Validate input against schema |
| `GET` | `/api/v1/openapi` | Get OpenAPI specification |

### Request/Response Examples

**Execute Agent:**

```bash
curl -X POST http://localhost:3000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is the capital of France?",
    "context": {
      "language": "en"
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "output": "The capital of France is Paris.",
  "metadata": {
    "executionTime": 1234,
    "tokensUsed": 150,
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

## OpenAPI Spec

The LangChain export includes a complete OpenAPI 3.1 specification:

```yaml
openapi: 3.1.0
info:
  title: My Agent API
  version: 1.0.0
  description: LangChain agent API generated from OSSA manifest

paths:
  /api/v1/execute:
    post:
      summary: Execute agent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - input
              properties:
                input:
                  type: string
                  description: User input
                context:
                  type: object
                  description: Execution context
      responses:
        '200':
          description: Successful execution
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExecutionResult'
```

Access the spec at: `http://localhost:3000/api/v1/openapi`

## Deployment

### Docker Deployment

Build and deploy the LangChain agent as a Docker container:

```dockerfile
# Dockerfile (auto-generated)
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY agent.py .
COPY api/ ./api/

EXPOSE 3000
CMD ["python", "-m", "api.server"]
```

```bash
# Build
docker build -t my-langchain-agent .

# Run
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key \
  my-langchain-agent
```

### Kubernetes Deployment

Deploy to Kubernetes using the generated manifests:

```yaml
# deployment.yaml (auto-generated)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langchain-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: langchain-agent
  template:
    metadata:
      labels:
        app: langchain-agent
    spec:
      containers:
      - name: agent
        image: my-langchain-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
```

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

### Serverless Deployment

Deploy to AWS Lambda, Google Cloud Functions, or Azure Functions:

```bash
# Export with serverless wrapper
ossa export agent.ossa.yaml --platform langchain --serverless aws-lambda

# Deploy
cd langchain
serverless deploy
```

## Examples

### Code Review Agent

**OSSA Manifest** (`code-reviewer.ossa.yaml`):

```yaml
apiVersion: ossa/v0.4.0
kind: Agent
metadata:
  name: code-reviewer
  description: AI-powered code review agent
  version: 1.0.0
spec:
  role: Code Reviewer
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.3
  tools:
    - name: analyze_code
      description: Analyze code for issues
      parameters:
        - name: code
          type: string
          required: true
        - name: language
          type: string
          required: true
```

**Export:**

```bash
ossa export code-reviewer.ossa.yaml --platform langchain --output ./code-reviewer
```

**Usage:**

```python
from agent import CodeReviewer

reviewer = CodeReviewer()
result = reviewer.run({
    "code": "def hello():\n    print('world')",
    "language": "python"
})
print(result)
```

### Data Analysis Agent

**OSSA Manifest** (`data-analyst.ossa.yaml`):

```yaml
apiVersion: ossa/v0.4.0
kind: Agent
metadata:
  name: data-analyst
  description: Data analysis and visualization agent
spec:
  role: Data Analyst
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
  tools:
    - name: analyze_dataset
      description: Analyze CSV dataset
    - name: generate_visualization
      description: Create data visualizations
```

**Export with API:**

```bash
ossa export data-analyst.ossa.yaml --platform langchain --with-api
```

**API Usage:**

```bash
curl -X POST http://localhost:3000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Analyze sales_data.csv",
    "context": {
      "dataset": "sales_data.csv"
    }
  }'
```

## Configuration

### Supported LLM Providers

The LangChain adapter supports these providers:

- **Anthropic** (`anthropic`): Claude models
- **OpenAI** (`openai`): GPT models
- **Cohere** (`cohere`): Command models
- **HuggingFace** (`huggingface`): Open-source models

### Environment Variables

```bash
# Anthropic
export ANTHROPIC_API_KEY=your-key

# OpenAI
export OPENAI_API_KEY=your-key

# API Configuration
export PORT=3000
export LOG_LEVEL=info
export MAX_TOKENS=4096
```

### Advanced Options

```bash
# Export with specific Python version
ossa export agent.ossa.yaml --platform langchain --python-version 3.11

# Export with custom requirements
ossa export agent.ossa.yaml --platform langchain --requirements requirements.txt

# Export with type stubs
ossa export agent.ossa.yaml --platform langchain --with-types
```

## Troubleshooting

### Python Import Errors

**Problem:** `ModuleNotFoundError: No module named 'langchain'`

**Solution:**

```bash
cd langchain
pip install -r requirements.txt
```

### TypeScript Build Errors

**Problem:** `Cannot find module 'langchain'`

**Solution:**

```bash
cd langchain
npm install
npm run build
```

### API Server Not Starting

**Problem:** `Error: Port 3000 already in use`

**Solution:**

```bash
# Use different port
PORT=3001 npm start

# Or kill existing process
lsof -ti:3000 | xargs kill
```

### LLM Provider Authentication

**Problem:** `AuthenticationError: Invalid API key`

**Solution:**

```bash
# Set API key
export ANTHROPIC_API_KEY=your-actual-key

# Verify
echo $ANTHROPIC_API_KEY

# Restart server
npm start
```

### Tool Execution Failures

**Problem:** `ToolExecutionError: Tool 'analyze_code' failed`

**Solution:**

Check tool implementation in generated code:

```python
# agent.py
class AnalyzeCodeTool(Tool):
    def _run(self, code: str, language: str) -> str:
        # Implement your tool logic here
        try:
            # Your implementation
            return result
        except Exception as e:
            raise ToolExecutionError(f"Failed: {e}")
```

### Validation Warnings

**Problem:** `Warning: LLM provider 'custom' may not be supported`

**Solution:**

Use a supported provider or add custom provider configuration:

```yaml
spec:
  llm:
    provider: anthropic  # Use supported provider
    model: claude-3-5-sonnet-20241022
```

## Best Practices

### 1. Version Your Agents

```yaml
metadata:
  name: code-reviewer
  version: 1.2.0  # Use semantic versioning
```

### 2. Validate Before Export

```bash
# Validate manifest first
ossa validate agent.ossa.yaml

# Then export
ossa export agent.ossa.yaml --platform langchain
```

### 3. Use Environment Variables

Never hardcode API keys:

```python
# Good
api_key = os.getenv("ANTHROPIC_API_KEY")

# Bad
api_key = "sk-ant-..."
```

### 4. Implement Error Handling

```python
from langchain.tools import Tool

class MyTool(Tool):
    def _run(self, input: str) -> str:
        try:
            result = self.process(input)
            return result
        except Exception as e:
            logger.error(f"Tool execution failed: {e}")
            raise
```

### 5. Add Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

### 6. Test Your Agents

```python
import pytest
from agent import MyAgent

def test_agent_execution():
    agent = MyAgent()
    result = agent.run("test input")
    assert result is not None
    assert len(result) > 0
```

## Performance Optimization

### Caching

Enable LangChain caching for better performance:

```python
from langchain.cache import InMemoryCache
import langchain

langchain.llm_cache = InMemoryCache()
```

### Batch Processing

Process multiple inputs efficiently:

```python
inputs = ["input1", "input2", "input3"]
results = await agent.abatch(inputs)
```

### Streaming

Enable streaming for long-running operations:

```python
async for chunk in agent.astream({"input": "analyze large dataset"}):
    print(chunk, end="", flush=True)
```

## Next Steps

- [Anthropic Export](./anthropic.md) - Export to Anthropic Claude format
- [npm Export](./npm.md) - Package as installable npm module
- [Best Practices](../guides/best-practices.md) - General export best practices
- [API Endpoints Guide](../guides/api-endpoints.md) - Complete API documentation
