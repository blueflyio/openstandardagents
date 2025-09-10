# 🔌 Framework Integration Guide - Level 2

> **Master the art of connecting OAAS agents with every major AI framework**

## 📚 Table of Contents
1. [MCP (Model Context Protocol) - Claude Desktop](#mcp-integration)
2. [LangChain - Python Tools](#langchain-integration)
3. [CrewAI - Agent Teams](#crewai-integration)
4. [AutoGen - Microsoft's Framework](#autogen-integration)
5. [OpenAI Assistants - Function Calling](#openai-integration)
6. [Testing Your Integrations](#testing)
7. [Common Issues & Solutions](#troubleshooting)

---

## 🤖 MCP Integration
*Connect your agent with Claude Desktop*

### Configuration in agent.yml
```yaml
frameworks:
  mcp:
    enabled: true
    server_name: "my-agent-server"  # Unique name for Claude Desktop
    server_config:
      host: "localhost"              # Where your agent runs
      port: 3100                     # Port to listen on
```

### Generate MCP Server Configuration
```bash
# Generate the MCP server config
oaas export --format=mcp > mcp-server.json

# The generated config looks like:
{
  "name": "my-agent-server",
  "version": "2.0.0",
  "description": "Integration-ready agent",
  "tools": [
    {
      "name": "analyze_project",
      "description": "Comprehensive project analysis",
      "parameters": { /* from OpenAPI spec */ }
    }
  ]
}
```

### Register with Claude Desktop
1. Copy `mcp-server.json` to Claude's config directory
2. Restart Claude Desktop
3. Your agent appears in Claude's tools menu

### MCP-Specific Best Practices
- Use descriptive `server_name` (appears in Claude UI)
- Keep descriptions under 100 characters
- Support streaming responses for better UX
- Implement proper error messages

---

## 🐍 LangChain Integration
*Use your agent as a LangChain tool*

### Configuration in agent.yml
```yaml
frameworks:
  langchain:
    enabled: true
    tool_type: "structured"      # structured | simple | async
    async_support: true          # Enable async operations
    streaming: true              # Support streaming responses
    memory_compatible: true      # Work with LangChain memory
    chain_compatible: true       # Can be used in chains
```

### Python Integration Code
```python
from langchain.tools import Tool
from oaas import OAASAgent

# Load your OAAS agent
agent = OAASAgent.from_path("./02-agent-integration")

# Convert to LangChain tool
tool = agent.to_langchain_tool()

# Or manually create tool
tool = Tool(
    name=agent.name,
    func=agent.execute,
    description=agent.expertise,
    args_schema=agent.get_input_schema()  # From OpenAPI
)

# Use in a chain
from langchain.chains import LLMChain
from langchain.llms import OpenAI

llm = OpenAI()
chain = LLMChain(
    llm=llm,
    tools=[tool],
    verbose=True
)

result = chain.run("Analyze this project")
```

### LangChain-Specific Features
```yaml
# Advanced LangChain configuration
frameworks:
  langchain:
    enabled: true
    tool_type: "structured"
    
    # Tool metadata
    return_direct: false        # Return result directly to user
    handle_tool_error: true     # Graceful error handling
    
    # Compatibility flags
    memory_compatible: true     # Works with ConversationBufferMemory
    chain_compatible: true      # Can be chained with other tools
    agent_compatible: true      # Works with LangChain agents
    
    # Performance
    async_support: true         # Support async execution
    streaming: true            # Stream responses
    batch_support: true        # Handle batch operations
    
    # Caching
    cache_enabled: true        # Cache responses
    cache_ttl: 3600           # Cache for 1 hour
```

---

## 👥 CrewAI Integration
*Deploy your agent in CrewAI teams*

### Configuration in agent.yml
```yaml
frameworks:
  crewai:
    enabled: true
    role: "senior_analyst"           # Agent's role in the crew
    goal: "Provide expert analysis"  # What the agent aims to achieve
    backstory: |                     # Agent's background (personality)
      You are a senior analyst with 10+ years of experience
      in code quality and security analysis. You excel at
      finding subtle bugs and suggesting improvements.
    
    # CrewAI specific settings
    allow_delegation: true            # Can delegate tasks to others
    verbose: true                     # Detailed execution logs
    max_iterations: 5                 # Max planning iterations
    memory: true                      # Enable memory
```

### Python Integration Code
```python
from crewai import Agent, Task, Crew
from oaas import OAASAgent

# Load OAAS agent
oaas_agent = OAASAgent.from_path("./02-agent-integration")

# Create CrewAI agent
analyst = Agent(
    role=oaas_agent.config['frameworks']['crewai']['role'],
    goal=oaas_agent.config['frameworks']['crewai']['goal'],
    backstory=oaas_agent.config['frameworks']['crewai']['backstory'],
    tools=oaas_agent.to_crewai_tools(),
    allow_delegation=True,
    verbose=True
)

# Create task
analysis_task = Task(
    description="Analyze the codebase for security issues",
    agent=analyst,
    expected_output="Security report with recommendations"
)

# Create crew
crew = Crew(
    agents=[analyst],
    tasks=[analysis_task],
    verbose=True
)

# Execute
result = crew.kickoff()
```

### CrewAI Team Patterns
```yaml
# Multi-agent configuration
frameworks:
  crewai:
    enabled: true
    role: "lead_developer"
    
    # Team collaboration
    delegation_preferences:
      - "security_agent"     # Prefer delegating to security specialist
      - "test_agent"        # Then to test specialist
    
    collaboration_style: "collaborative"  # collaborative | supervisory | autonomous
    
    # Communication
    communication_protocol: "structured"   # How agents communicate
    update_frequency: "on_completion"     # How often to report progress
```

---

## 🤖 AutoGen Integration
*Microsoft's multi-agent framework*

### Configuration in agent.yml
```yaml
frameworks:
  autogen:
    enabled: true
    agent_type: "assistant"          # assistant | user_proxy | executor
    system_message: |                # System prompt for the agent
      You are a code analysis assistant that helps developers
      improve their code quality and security.
    
    # AutoGen specific
    max_consecutive_auto_reply: 5    # Max automated responses
    human_input_mode: "NEVER"        # NEVER | TERMINATE | ALWAYS
    code_execution: true              # Can execute code
    function_map:                     # Map capabilities to functions
      analyze: "analyze_project"
      generate: "generate_code"
```

### Python Integration Code
```python
import autogen
from oaas import OAASAgent

# Load OAAS agent
oaas_agent = OAASAgent.from_path("./02-agent-integration")

# Create AutoGen agent
assistant = autogen.AssistantAgent(
    name=oaas_agent.name,
    system_message=oaas_agent.config['frameworks']['autogen']['system_message'],
    llm_config={
        "functions": oaas_agent.to_autogen_functions(),
        "timeout": 600,
        "seed": 42
    }
)

# Create user proxy
user_proxy = autogen.UserProxyAgent(
    name="user",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    code_execution_config={"work_dir": "coding"}
)

# Start conversation
user_proxy.initiate_chat(
    assistant,
    message="Analyze this repository for security issues"
)
```

---

## 🧪 Testing Your Integrations

### 1. Unit Tests for Each Framework
```python
# test_integrations.py
import pytest
from oaas import OAASAgent

@pytest.fixture
def agent():
    return OAASAgent.from_path("./02-agent-integration")

def test_langchain_tool_creation(agent):
    tool = agent.to_langchain_tool()
    assert tool.name == agent.name
    assert tool.description == agent.expertise
    assert callable(tool.func)

def test_crewai_agent_creation(agent):
    crewai_agent = agent.to_crewai_agent()
    assert crewai_agent.role == agent.config['frameworks']['crewai']['role']
    assert len(crewai_agent.tools) > 0

def test_mcp_server_config(agent):
    config = agent.to_mcp_config()
    assert config['name'] == agent.config['frameworks']['mcp']['server_name']
    assert 'tools' in config
```

### 2. Integration Tests
```bash
# Test MCP integration
oaas test mcp --agent=./02-agent-integration

# Test LangChain integration
oaas test langchain --agent=./02-agent-integration

# Test all frameworks
oaas test all --agent=./02-agent-integration
```

### 3. End-to-End Tests
```python
# e2e_test.py
def test_full_workflow():
    # 1. Load agent
    agent = OAASAgent.from_path("./02-agent-integration")
    
    # 2. Test with each framework
    results = {}
    
    # LangChain
    tool = agent.to_langchain_tool()
    results['langchain'] = tool.run("test input")
    
    # CrewAI
    crew_agent = agent.to_crewai_agent()
    results['crewai'] = crew_agent.execute("test input")
    
    # Verify consistency
    assert all(r is not None for r in results.values())
```

---

## 🔧 Troubleshooting

### Issue: "Framework not found"
```yaml
# Check frameworks are enabled
frameworks:
  langchain:
    enabled: true  # Must be true
```

### Issue: "Tool creation fails"
```yaml
# Ensure OpenAPI spec exists
openapi: "./openapi.yaml"  # Required for Level 2+

# Check capability format
capabilities:
  - name: analyze_project      # Must have name
    description: "Description"  # Must have description
    frameworks: [langchain]     # Must list compatible frameworks
```

### Issue: "MCP server not discovered"
```bash
# Check server is running
curl http://localhost:3100/health

# Verify MCP config
cat mcp-server.json

# Check Claude Desktop logs
tail -f ~/Library/Logs/Claude/server.log
```

### Issue: "CrewAI delegation fails"
```yaml
# Enable delegation
frameworks:
  crewai:
    allow_delegation: true  # Must be true
    delegation_preferences:
      - "other_agent_name"  # Must reference real agents
```

---

## 📋 Framework Comparison Matrix

| Feature | MCP | LangChain | CrewAI | AutoGen |
|---------|-----|-----------|---------|---------|
| **Language** | Any | Python | Python | Python |
| **Async** | ✅ | ✅ | ✅ | ✅ |
| **Streaming** | ✅ | ✅ | ❌ | ✅ |
| **Memory** | ❌ | ✅ | ✅ | ✅ |
| **Delegation** | ❌ | ❌ | ✅ | ✅ |
| **Code Execution** | ❌ | ❌ | ❌ | ✅ |
| **GUI Integration** | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Next Steps

1. **Test each framework integration**
   ```bash
   cd 02-agent-integration
   python test_langchain.py
   python test_crewai.py
   ```

2. **Monitor performance**
   - Track response times per framework
   - Monitor error rates
   - Measure token usage

3. **Optimize for production** (Level 3)
   - Add caching
   - Implement rate limiting
   - Add security layers
   - Set up monitoring

---

**Remember**: Not every agent needs every framework. Enable only what you'll actually use to reduce complexity and maintenance overhead.