# 🔄 Migration Guide - From Other Standards to OAAS

> **Already using another agent standard? This guide shows you exactly how to migrate to OAAS with minimal disruption.**

## 📊 Migration Overview

| From Standard | Effort | Time | OAAS Level | Key Changes |
|---------------|--------|------|------------|-------------|
| **LangChain Tools** | Low | 1-2 hours | Level 2 | Add agent.yml wrapper |
| **CrewAI Agents** | Low | 2-4 hours | Level 2 | Map role/goal to OAAS |
| **AutoGen Agents** | Medium | 4-8 hours | Level 2-3 | Restructure configs |
| **MCP Servers** | Medium | 1 day | Level 2 | Convert to OAAS + bridge |
| **OpenAI Assistants** | High | 2-3 days | Level 3 | Full restructure |
| **Custom/Proprietary** | High | 3-5 days | Level 1-4 | Complete rewrite |

---

## 🐍 From LangChain Tools

### Current LangChain Tool Structure
```python
# Old: my_tool.py
from langchain.tools import Tool, tool

@tool
def analyze_code(code: str) -> str:
    """Analyzes code and returns insights."""
    return analysis_result

# Or class-based
class CodeAnalyzer(Tool):
    name = "code_analyzer"
    description = "Analyzes code quality"
    
    def _run(self, code: str) -> str:
        return self.analyze(code)
```

### Migration to OAAS

#### Step 1: Create agent.yml (Level 2)
```yaml
# .agents/code-analyzer/agent.yml
name: code-analyzer
version: "1.0.0"
expertise: "Analyzes code quality and returns insights"

capabilities:
  - analyze_code: "Analyzes code and returns insights"

frameworks:
  langchain:
    enabled: true
    tool_type: "structured"
    
openapi: "./openapi.yaml"
```

#### Step 2: Create OpenAPI Specification
```yaml
# .agents/code-analyzer/openapi.yaml
openapi: 3.1.0
info:
  title: Code Analyzer API
  version: 1.0.0

paths:
  /analyze:
    post:
      operationId: analyze_code
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                code:
                  type: string
      responses:
        '200':
          description: Analysis complete
          content:
            application/json:
              schema:
                type: object
                properties:
                  result:
                    type: string
```

#### Step 3: Adapter Code
```python
# .agents/code-analyzer/adapter.py
from oaas import OAASAgent
from my_tool import analyze_code  # Your existing tool

class CodeAnalyzerAgent(OAASAgent):
    def execute(self, operation_id: str, **kwargs):
        if operation_id == "analyze_code":
            return analyze_code(**kwargs)
```

#### Migration Benefits
- ✅ Keep existing tool logic
- ✅ Add discovery capabilities
- ✅ Enable multi-framework support
- ✅ Standardized documentation

---

## 👥 From CrewAI Agents

### Current CrewAI Agent Structure
```python
# Old: crew_agents.py
from crewai import Agent

researcher = Agent(
    role='Senior Research Analyst',
    goal='Uncover cutting-edge developments',
    backstory="""You work at a leading tech think tank.
    Your expertise lies in identifying emerging trends.""",
    tools=[search_tool, scrape_tool],
    verbose=True,
    allow_delegation=False
)
```

### Migration to OAAS

#### Step 1: Create agent.yml (Level 2)
```yaml
# .agents/research-analyst/agent.yml
name: research-analyst
version: "1.0.0"
expertise: "Uncover cutting-edge developments in technology"

capabilities:
  - search_trends: "Search for emerging technology trends"
  - analyze_developments: "Analyze cutting-edge developments"
  - generate_reports: "Create research reports"

frameworks:
  crewai:
    enabled: true
    role: "Senior Research Analyst"
    goal: "Uncover cutting-edge developments"
    backstory: |
      You work at a leading tech think tank.
      Your expertise lies in identifying emerging trends.
    allow_delegation: false
    verbose: true

openapi: "./openapi.yaml"
```

#### Step 2: Tool Mapping
```yaml
# Map CrewAI tools to OAAS capabilities
capabilities:
  - search_trends: "Uses search_tool from CrewAI"
  - scrape_data: "Uses scrape_tool from CrewAI"

# In your adapter
tools_mapping:
  search_trends: search_tool
  scrape_data: scrape_tool
```

#### Step 3: Bridge Configuration
```python
# .agents/research-analyst/bridge.py
from oaas import OAASAgent, CrewAIBridge

agent = OAASAgent.from_path(".")
crew_agent = CrewAIBridge.convert(agent)

# Now works in both OAAS and CrewAI contexts
```

---

## 🤖 From AutoGen Agents

### Current AutoGen Structure
```python
# Old: autogen_config.py
import autogen

assistant = autogen.AssistantAgent(
    name="assistant",
    llm_config={
        "timeout": 600,
        "seed": 42,
        "config_list": config_list,
    },
    system_message="You are a helpful AI assistant."
)

user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    code_execution_config={"work_dir": "coding"},
)
```

### Migration to OAAS

#### Step 1: Create agent.yml (Level 3 - Production features needed)
```yaml
# .agents/autogen-assistant/agent.yml
name: autogen-assistant
version: "1.0.0"
expertise: "Helpful AI assistant with code execution capabilities"

capabilities:
  - execute_code: "Execute Python code safely"
  - analyze_results: "Analyze execution results"
  - suggest_improvements: "Suggest code improvements"

frameworks:
  autogen:
    enabled: true
    agent_type: "assistant"
    system_message: "You are a helpful AI assistant."
    max_consecutive_auto_reply: 10
    human_input_mode: "NEVER"
    code_execution:
      enabled: true
      work_dir: "coding"
      timeout: 600

# Production features for code execution
security:
  sandboxing: true
  resource_limits:
    cpu: "1000m"
    memory: "512Mi"
    
monitoring:
  track_executions: true
  log_code: true
```

---

## 🖥️ From MCP Servers

### Current MCP Server Structure
```javascript
// Old: mcp-server.js
import { MCPServer } from '@modelcontextprotocol/server';

const server = new MCPServer({
  name: 'my-mcp-server',
  version: '1.0.0',
  tools: [
    {
      name: 'get_data',
      description: 'Gets data',
      parameters: { /* ... */ },
      handler: async (params) => { /* ... */ }
    }
  ]
});
```

### Migration to OAAS

#### Step 1: Create agent.yml
```yaml
# .agents/mcp-data-server/agent.yml
name: mcp-data-server
version: "1.0.0"
expertise: "Data retrieval and processing server"

capabilities:
  - get_data: "Retrieves data from various sources"
  - process_data: "Processes and transforms data"

frameworks:
  mcp:
    enabled: true
    server_name: "my-mcp-server"
    server_config:
      host: "localhost"
      port: 3100

openapi: "./openapi.yaml"
```

#### Step 2: Generate MCP Bridge
```bash
# OAAS automatically generates MCP config
oaas export --format=mcp > mcp-config.json

# Use existing MCP server with OAAS discovery
oaas bridge mcp --existing-server=./mcp-server.js
```

---

## 🤖 From OpenAI Assistants

### Current OpenAI Assistant Structure
```python
# Old: openai_assistant.py
from openai import OpenAI

client = OpenAI()

assistant = client.beta.assistants.create(
    name="Data Analyst",
    instructions="You are a data analyst. Analyze data and create visualizations.",
    tools=[{"type": "code_interpreter"}],
    model="gpt-4-1106-preview"
)

# Functions
functions = [
    {
        "name": "analyze_data",
        "description": "Analyze dataset",
        "parameters": { /* ... */ }
    }
]
```

### Migration to OAAS

#### Step 1: Create agent.yml (Level 3)
```yaml
# .agents/data-analyst/agent.yml
name: data-analyst
version: "1.0.0"
expertise: "Data analysis and visualization expert"

capabilities:
  - analyze_data: "Analyze datasets and find patterns"
  - create_visualization: "Generate data visualizations"
  - interpret_results: "Interpret analysis results"

frameworks:
  openai:
    enabled: true
    assistant_id: "${OPENAI_ASSISTANT_ID}"  # Reference existing
    model: "gpt-4-1106-preview"
    tools:
      - type: "code_interpreter"
    
  # Also enable other frameworks
  langchain:
    enabled: true
    
compliance:
  data_handling:
    pii_detection: true
    anonymization: true

openapi: "./openapi.yaml"
```

---

## 🔧 From Custom/Proprietary Standards

### Assessment Questions
Before migrating, answer these:

1. **What format are your agents in?**
   - JSON → Easy migration to YAML
   - XML → Need conversion tool
   - Code-based → Need extraction

2. **What features do you need?**
   - Basic discovery → Level 1
   - API endpoints → Level 2
   - Production features → Level 3
   - Compliance → Level 4

3. **What frameworks do you use?**
   - List all AI frameworks
   - Map to OAAS framework configs

### Generic Migration Steps

#### Step 1: Extract Agent Metadata
```python
# extract_metadata.py
def extract_agent_info(custom_agent):
    return {
        "name": custom_agent.id or "unnamed",
        "version": custom_agent.version or "0.1.8",
        "expertise": custom_agent.description or "Custom agent",
        "capabilities": extract_capabilities(custom_agent)
    }
```

#### Step 2: Generate OAAS Structure
```python
# generate_oaas.py
import yaml

def create_oaas_agent(metadata, level=2):
    agent_config = {
        "name": metadata["name"],
        "version": metadata["version"],
        "expertise": metadata["expertise"],
        "capabilities": metadata["capabilities"]
    }
    
    if level >= 2:
        agent_config["openapi"] = "./openapi.yaml"
        agent_config["frameworks"] = detect_frameworks(metadata)
    
    if level >= 3:
        agent_config["monitoring"] = create_monitoring_config()
        agent_config["security"] = create_security_config()
    
    return yaml.dump(agent_config)
```

#### Step 3: Create Adapter Layer
```python
# adapter.py
from oaas import OAASAgent

class CustomToOAASAdapter:
    def __init__(self, custom_agent):
        self.custom = custom_agent
        self.oaas = OAASAgent.from_config(
            self.convert_to_oaas_config()
        )
    
    def execute(self, operation, **kwargs):
        # Map OAAS operations to custom agent methods
        custom_method = self.map_operation(operation)
        return custom_method(**kwargs)
```

---

## 🎯 Migration Best Practices

### 1. Start Simple
- Begin with Level 1 or 2
- Get basic functionality working
- Upgrade levels as needed

### 2. Maintain Backwards Compatibility
```python
# Keep old interface working
class HybridAgent:
    def __init__(self):
        self.oaas = OAASAgent.from_path("./agent.yml")
        self.legacy = LegacyAgent()
    
    def execute_legacy(self, *args):
        return self.legacy.execute(*args)
    
    def execute_oaas(self, *args):
        return self.oaas.execute(*args)
```

### 3. Test Thoroughly
```python
# test_migration.py
def test_compatibility():
    # Old way
    legacy_result = legacy_agent.execute(input_data)
    
    # New way
    oaas_result = oaas_agent.execute("operation", input_data)
    
    # Should produce same result
    assert legacy_result == oaas_result
```

### 4. Gradual Migration
1. Week 1: Create OAAS wrapper
2. Week 2: Test in parallel
3. Week 3: Switch primary to OAAS
4. Week 4: Deprecate legacy

---

## 📊 Migration Validation Checklist

### Pre-Migration
- [ ] Inventory existing agents
- [ ] Document current capabilities
- [ ] Identify framework dependencies
- [ ] Choose target OAAS level

### During Migration
- [ ] Create agent.yml files
- [ ] Generate OpenAPI specs (Level 2+)
- [ ] Map capabilities to operations
- [ ] Configure framework bridges
- [ ] Create adapter layer

### Post-Migration
- [ ] Validate with `oaas validate`
- [ ] Test discovery with `oaas scan`
- [ ] Verify framework integrations
- [ ] Run compatibility tests
- [ ] Update documentation

### Success Metrics
- [ ] All agents discoverable
- [ ] Existing integrations work
- [ ] No functionality lost
- [ ] Performance maintained
- [ ] Documentation updated

---

## 🆘 Getting Help

### Migration Tools
```bash
# Analyze existing agents
oaas migrate analyze --path=./old-agents

# Generate migration plan
oaas migrate plan --from=langchain --to=oaas-level-2

# Auto-convert (best effort)
oaas migrate convert --input=./old --output=./new
```

### Community Resources
- Migration examples: `/examples/migrations/`
- Discord: Join #migration-help
- GitHub: Open issue with `migration` tag

---

**Remember**: Migration doesn't have to be all-or-nothing. You can run OAAS alongside existing standards and migrate gradually.