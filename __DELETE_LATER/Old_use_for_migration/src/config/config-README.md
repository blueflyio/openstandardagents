# OSSA Configuration

Configuration files and templates for OSSA v0.1.8 components.

## Structure

- `ci/` - CI/CD pipeline configurations
- `federation/` - Cross-organization federation settings
- `ossa/` - Core OSSA framework configurations
- `langchain-config.json` - LangChain integration settings
- `reports.ts` - Reporting configuration

## Configuration Guidelines

### Environment-Specific Configs
- Use `.env` files for secrets (never commit to Git)
- Environment variables override config file values
- Production configs should be minimal and secure

### OSSA Agent Configuration
All agent configurations must follow ACDL (Agent Capability Description Language) specification:

```yaml
agentId: "agent-name-v1.0.0"
agentType: "execution|analysis|feedback|governance"
agentSubType: "worker.specific|critic.reviewer|..."
supportedDomains: ["domain1", "domain2"]
protocols:
  rest: "https://api.agent.local/v1"
  grpc: "grpc://agent.local:50051"
  websocket: "wss://agent.local/stream"
capabilities:
  specific_capability:
    operations: ["validate", "generate", "analyze"]
    timeout: 30000
performance:
  throughput: 100  # requests/second
  latency_p99: 250  # milliseconds
```

### Federation Configuration
Cross-organizational agent coordination requires:
- Trust scoring configuration
- Policy management settings
- Discovery protocol configuration
- Multi-tenant security settings

## Usage

```bash
# Validate OSSA configuration
ossa validate --config src/config/ossa/

# Load environment-specific config
export OSSA_ENV=production
ossa start --config src/config/ossa/framework-config.yml
```