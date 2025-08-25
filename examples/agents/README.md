# Example AI Agents

This directory contains example agent implementations demonstrating the OpenAPI AI Agents Standard v0.1.0.

## 🏗️ Dual-Format Architecture

Every agent follows the **dual-format architecture**:

```
agent-name/
├── agent.yml      # Agent metadata and configuration
└── openapi.yaml   # API specification and endpoints
```

### Agent Configuration (`agent.yml`)
Contains:
- **Metadata**: Name, version, labels, compliance info
- **Capabilities**: What the agent can do
- **Protocols**: Communication methods supported
- **Orchestration**: How it works with other agents
- **Governance**: Security and compliance settings

### OpenAPI Specification (`openapi.yaml`)
Contains:
- **API Endpoints**: REST API definition
- **Request/Response Schemas**: Data structures
- **Security Schemes**: Authentication methods
- **Extensions**: Standard-specific metadata

## 📚 Available Examples

### [CrewAI Agent](./crew-ai-agent/)
**Framework**: CrewAI  
**Certification**: Silver  
**Capabilities**: Collaborative planning, role-based execution, crew coordination

Example of integrating CrewAI framework with the standard. Demonstrates:
- Multi-agent crew formation
- Hierarchical task delegation
- Role-based specialization
- Agent-to-agent communication

## 🚀 Creating Your Own Agent

### 1. Create Directory Structure
```bash
mkdir my-agent
cd my-agent
```

### 2. Copy Templates
```bash
cp ../basic/agent.yml .
cp ../basic/openapi.yaml .
```

### 3. Customize Configuration
Edit `agent.yml`:
```yaml
metadata:
  name: "my-agent"
  labels:
    framework: "my-framework"
    
spec:
  capabilities:
    - "my_capability_1"
    - "my_capability_2"
```

### 4. Define API Endpoints
Edit `openapi.yaml`:
```yaml
paths:
  /my-endpoint:
    post:
      operationId: myOperation
      # ... endpoint definition
```

### 5. Validate Your Agent
```bash
cd ../../services/validation-api
node scripts/bulk-agent-validator.js
```

## 🎯 Best Practices

### Naming Conventions
- **Directory**: `kebab-case` (e.g., `my-awesome-agent`)
- **Agent Name**: `kebab-case` matching directory
- **Capabilities**: `snake_case` (e.g., `data_processing`)
- **API Endpoints**: `/kebab-case` paths

### Capability Guidelines
Use standard capability names when possible:
- `data_processing` - Process and transform data
- `web_search` - Search the internet
- `code_generation` - Generate source code
- `document_analysis` - Analyze documents
- `image_processing` - Process images/vision
- `orchestration` - Coordinate other agents

### OpenAPI Extensions
Always include the standard extension:
```yaml
x-openapi-ai-agents-standard:
  version: "0.1.0"
  agent_metadata:
    name: "my-agent"
    capabilities: ["my_capability"]
```

### Security Requirements
- Include security schemes in OpenAPI spec
- Use `API_KEY` authentication minimum
- Define proper CORS policies
- Include rate limiting headers

## 🏆 Certification Levels

### Bronze
- ✅ Valid agent.yml structure
- ✅ Basic OpenAPI 3.1 specification
- ✅ Security scheme defined

### Silver  
- ✅ All Bronze requirements
- ✅ Standard extensions included
- ✅ 5+ API endpoints defined
- ✅ Proper error handling

### Gold
- ✅ All Silver requirements
- ✅ Protocol bridge support (MCP/A2A)
- ✅ Token management configuration
- ✅ Compliance framework validation
- ✅ Comprehensive documentation

## 🔗 Integration Examples

### LangChain Integration
```python
from openapi_ai_agents import ValidationClient

# Validate your LangChain agent
validator = ValidationClient()
result = validator.validate_agent("./my-langchain-agent/")

if result.valid:
    print(f"✅ {result.certification_level} certification")
```

### CrewAI Integration
```python
from crewai import Agent
from openapi_ai_agents import CrewAIBridge

# Create standard-compliant CrewAI agent
agent = Agent(
    role="Data Analyst",
    goal="Analyze data and provide insights"
)

# Generate standard files
bridge = CrewAIBridge()
bridge.export_agent(agent, "./my-crewai-agent/")
```

## 📖 Related Documentation

- [Main README](../../README.md) - Project overview
- [Basic Templates](../basic/) - Template files
- [Specification Guide](../../docs/specification.md) - Detailed spec
- [Integration Guide](../../docs/integration-guide.md) - Framework integration

## 🤝 Contributing Examples

1. **Fork the repository**
2. **Create your agent** in this directory
3. **Test validation** passes
4. **Document unique features** in this README
5. **Submit pull request**

### Example Contribution
```yaml
### [My Framework Agent](./my-framework-agent/)
**Framework**: MyFramework  
**Certification**: Gold  
**Capabilities**: Custom processing, specialized workflow

Demonstrates integration with MyFramework, featuring:
- Custom protocol implementation
- Advanced token optimization
- Multi-modal processing
```

## ⚡ Quick Validation

Test all agents in this directory:
```bash
cd ../../services/validation-api
node scripts/bulk-agent-validator.js
```

Expected output:
```
🔍 OpenAPI AI Agents Standard v0.1.0 - Bulk Validator
===============================================

📁 Discovered X agent files
✅ agent-name - certification_level certification
...

📊 VALIDATION SUMMARY
=====================
Success Rate: 100.0%
```

---

**Need help?** Check the [integration guide](../../docs/integration-guide.md) or open an issue.