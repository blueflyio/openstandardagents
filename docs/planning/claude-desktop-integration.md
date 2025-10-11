# OSSA Claude Desktop Integration

Complete integration of the Open Standards for Scalable Agents (OSSA) platform with Claude Desktop, providing first-class agent development, validation, and lifecycle management capabilities.

##  Features

### Core Integration
- **Project-Based Interface**: Dedicated OSSA project in Claude Desktop
- **Agent-Aware Navigation**: Parse OSSA Git repo and roadmap for intelligent code navigation
- **Open Standard Validation**: Real-time OSSA schema compliance checking
- **Agent Schema Reflection**: Deep introspection of agent capabilities and dependencies

### MCP Tools
- `ossa_generate_agent`: Generate OSSA-compliant agent manifests
- `ossa_validate`: Validate agents, schemas, or entire projects
- `ossa_introspect`: Analyze agent capabilities and dependencies
- `ossa_lifecycle`: Manage agent lifecycle (spawn, stop, restart, health)
- `ossa_test_compliance`: Run comprehensive compliance tests

### Real-Time Features
- **Live Dashboard**: Stream lifecycle events via WebSocket/SSE
- **Voice Integration**: Support for voice-enabled agents
- **MCP Protocol**: Full Model Context Protocol compatibility
- **CI/CD Integration**: Test, lint, and package using OSSA's GitLab CI

##  Installation

### 1. Install MCP Server
```bash
npm install -g @ossa/mcp-server
```

### 2. Install Claude Desktop Extension
```bash
# Download the .dxt extension package
wget https://releases.ossa.dev/claude-desktop-extension.dxt

# Install in Claude Desktop
# (Follow Claude Desktop extension installation process)
```

### 3. Configure Project
```bash
# Copy project configuration template
cp templates/mcp/.mcp.json .

# Customize for your project
nano .mcp.json
```

## 🛠 Usage

### Generate Agent
```bash
# In Claude Desktop, use the OSSA tools:
ossa generate agent --name voice-assistant --type worker --capabilities voice_processing,real_time_communication
```

### Validate Compliance
```bash
# Validate agent manifest
ossa validate --target agent --path .agents/voice-assistant/agent.yml --strict

# Validate entire project
ossa validate --target project --path . --strict
```

### Test Compliance
```bash
# Run comprehensive compliance tests
ossa test compliance --test_type all --agent_path .agents/voice-assistant --output_format report
```

### Agent Lifecycle Management
```bash
# Spawn agent
ossa lifecycle --action spawn --agent_id voice-assistant

# Check health
ossa lifecycle --action health --agent_id voice-assistant

# Stop agent
ossa lifecycle --action stop --agent_id voice-assistant
```

##  Project Structure

```
OSSA Project/
├── .agents/                    # Agent manifests and implementations
│   ├── registry.yml           # Agent registry
│   ├── voice-assistant/       # Example agent
│   │   ├── agent.yml          # Agent manifest
│   │   ├── handlers/          # Agent handlers
│   │   ├── schemas/           # Agent schemas
│   │   └── tests/            # Agent tests
│   └── ...
├── src/
│   ├── schemas/               # OSSA schemas
│   ├── templates/             # Agent templates
│   └── mcp-server/           # MCP server implementation
├── docs/                      # Documentation
├── infrastructure/            # Deployment configs
├── .mcp.json                 # Claude Desktop project config
└── ROADMAP.md                # OSSA roadmap
```

##  Configuration

### Environment Variables
```bash
OSSA_API_URL=https://api.ossa.dev/v2
OSSA_COMPLIANCE_LEVEL=governed
OSSA_PROJECT_ROOT=.
OSSA_VOICE_ENABLED=true
OSSA_MCP_EVENTS=true
```

### Compliance Levels
- **basic**: Minimal OSSA compliance
- **standard**: Standard OSSA compliance
- **governed**: Full OSSA governance (recommended)
- **enterprise**: Enterprise-grade compliance

##  Agent Types

OSSA supports 8 agent types from the taxonomy:

1. **Orchestrators**: Goal decomposition, workflow management
2. **Workers**: Task execution with self-reporting
3. **Critics**: Multi-dimensional review and feedback
4. **Judges**: Binary decisions through pairwise comparison
5. **Trainers**: Synthesize feedback into learning signals
6. **Governors**: Budget enforcement and compliance
7. **Monitors**: Telemetry and system health
8. **Integrators**: Cross-system adapters and bridges

##  Resources

The MCP server provides access to:

- **OSSA Schemas**: Complete v0.2.0 schema definitions
- **Agent Templates**: Implementation patterns and examples
- **Compliance Rules**: Validation rules and standards
- **Documentation**: Implementation guides and best practices
- **Roadmap**: Development roadmap and milestones
- **Agent Registry**: Registered agents and capabilities

##  Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Compliance Tests
```bash
npm run test:compliance
```

##  Monitoring

### Real-Time Dashboard
- Agent status and health monitoring
- Performance metrics and analytics
- Voice interaction visualization
- MCP protocol monitoring

### Logging
- Structured logging with context
- Configurable log levels
- Audit trail for compliance

##  Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t ossa-mcp-server .
docker run -p 3000:3000 ossa-mcp-server
```

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

##  License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: https://bluefly-ai.gitlab.io/ossa-standard/
- **Issues**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues
- **Community**: ossa@bluefly.io

##  Links

- **OSSA Platform**: https://ossa.bluefly.io
- **Claude Desktop**: https://claude.ai/desktop
- **MCP Protocol**: https://modelcontextprotocol.io
- **GitLab Repository**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard
