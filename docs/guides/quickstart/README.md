# Getting Started with OSSA
## Complete Setup and Tutorial Guide

> **Open Standards for Scalable Agents (OSSA) v0.1.8**  
> Enterprise-grade AI agent standards with zero-disruption migration

---

##  What is OSSA?

OSSA provides a universal standard for AI agents that enables:
-  **Zero-disruption migration** - Keep existing agents working exactly as before
-  **Cross-framework interoperability** - Use any agent format with any AI framework
-  **Enterprise compliance** - Built-in support for ISO 42001, NIST AI RMF, FedRAMP
-  **Progressive enhancement** - Add OSSA benefits incrementally

---

##  Quick Installation

### Prerequisites

**System Requirements:**
- Node.js 18+ required
- Git for version control
- Access to your existing agent codebase

### 1. Install OSSA CLI

```bash
# Install the official OSSA CLI globally
npm install -g @bluefly/open-standards-scalable-agents@0.1.8

# Verify installation
ossa --version
```

### 2. Initialize OSSA in Your Project

```bash
# Navigate to your project directory
cd /your/project/path

# Initialize OSSA (creates .ossa/ directory and config)
ossa init

# Discover existing agents automatically
ossa discover
```

### 3. Verify Installation

```bash
# Run system health check
ossa validate --pre-migration

# Expected output:
#  OSSA CLI v0.1.8 installed
#  Project structure validated
#  Discovery engine ready
#  Found X agents in project
```

---

##  Project Structure Setup

### Recommended Directory Structure

```
your-project/
├── .ossa/                       # OSSA configuration (auto-created)
│   ├── config.yaml             # Project settings
│   └── agents.registry.json    # Discovered agents
├── agents/                     # New OSSA-native agents
│   ├── content-creator.yaml
│   └── data-processor.yaml
├── src/
│   ├── drupal-plugins/         # Existing Drupal agents (unchanged)
│   ├── mcp-tools/             # MCP server tools (unchanged)
│   └── langchain-tools/       # LangChain tools (unchanged)
├── package.json
└── ossa.config.yaml           # Optional global configuration
```

### Configuration File (Optional)

```yaml
# ossa.config.yaml
version: "0.1.8"
project:
  name: "my-agent-project"
  version: "1.0.0"
discovery:
  paths:
    - "src/agents"
    - "src/drupal-plugins"
    - "src/mcp-tools"
    - "custom/ai-tools"
  exclude:
    - "node_modules"
    - "dist"
    - "*.test.*"
features:
  runtimeTranslation: true
  caching: true
  validation: "relaxed"  # or "strict"
```

---

##  Discovery and Migration

### Phase 1: Discovery (Zero Risk)

**Goal**: Discover and catalog your existing agents without any changes.

```bash
# Discover all agents in current project
ossa discover

# Show detailed discovery results
ossa list --capabilities

# Generate discovery report
ossa analyze --output discovery-report.json
```

**Expected Output:**
```
 Universal agent discovery completed
 Total agents found: 15
 By format:
   - Drupal: 8 agents
   - MCP: 4 agents
   - LangChain: 2 agents
   - CrewAI: 1 agent
```

### Phase 2: Runtime Translation (Non-Destructive)

**Goal**: Enable cross-format translation while keeping originals unchanged.

```bash
# Enable runtime translation
ossa config set features.runtimeTranslation true

# Test cross-format capabilities
ossa test --integration --frameworks drupal,mcp,langchain
```

### Phase 3: Progressive Enhancement (Optional)

**Goal**: Create new OSSA-native agents while keeping existing ones.

```bash
# Create your first OSSA agent
ossa create hello-world --tier basic

# Register with discovery system
ossa register agents/hello-world.yaml
```

---

##  Your First OSSA Agent

### Create a Simple Agent

```bash
# Create agent with CLI
ossa create hello-world --tier basic --domain general

# This creates: agents/hello-world.yaml
```

**Generated Agent Structure:**
```yaml
# agents/hello-world.yaml
apiVersion: ossa.bluefly.ai/v0.1.8
kind: Agent
metadata:
  name: hello-world
  description: A simple greeting agent
  version: 1.0.0
  tier: basic
  domain: general
spec:
  openapi: 3.1.0
  info:
    title: Hello World Agent
    version: 1.0.0
    description: Provides friendly greetings
  paths:
    /greet:
      post:
        operationId: ossa.greeting.greet
        summary: Generate a personalized greeting
        tags: ["greeting"]
        requestBody:
          required: true
          content:
            application/json:
              schema:
                type: object
                required: [name]
                properties:
                  name:
                    type: string
                    description: Name of person to greet
        responses:
          '200':
            description: Greeting response
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    greeting:
                      type: string
```

### Test Your Agent

```bash
# Validate agent specification
ossa validate agents/hello-world.yaml

# Test agent functionality
ossa test agents/hello-world.yaml --input '{"name": "World"}'

# Expected output:
#  Agent validation passed
#  Test execution successful
# 📤 Result: {"greeting": "Hello, World!"}
```

---

##  Working with Existing Agents

### Drupal AI Agents (Automatic Discovery)

**Your existing Drupal plugins work unchanged:**

```php
<?php
/**
 * @AIAgent(
 *   id = "content_generator",
 *   name = "Content Generator",
 *   description = "Generates content based on prompts"
 * )
 */
class ContentGeneratorPlugin extends AIAgentPluginBase {
  
  public function generateContent($prompt, $type = 'article') {
    // Your existing implementation - NO CHANGES NEEDED
    return $this->llm->generate($prompt);
  }
}
```

**OSSA automatically discovers this without modifications!**

```bash
# Discover Drupal agents specifically
ossa discover --type drupal

# Use Drupal agent in other frameworks
ossa translate content_generator --to langchain
```

### MCP Tools (Automatic Discovery)

**Your existing MCP tools work unchanged:**

```json
{
  "name": "file-manager",
  "version": "1.0.0",
  "tools": [
    {
      "name": "read_file",
      "description": "Read contents of a file",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        }
      }
    }
  ]
}
```

**OSSA discovers MCP tools automatically:**

```bash
# Discover MCP tools specifically
ossa discover --type mcp

# List MCP tool capabilities
ossa list --type mcp --capabilities
```

---

## 📋 Essential CLI Commands

### Core Commands

```bash
# Agent Management
ossa create <name>                    # Create new OSSA agent
ossa create <name> --tier advanced    # Create advanced tier agent
ossa create <name> --domain security  # Create domain-specific agent

# Discovery and Validation
ossa discover                         # Discover all agents
ossa discover --type drupal          # Discover specific format
ossa validate [path]                 # Validate agent specification
ossa validate --all --strict         # Validate all agents strictly

# Agent Operations
ossa list                           # List all discovered agents
ossa list --format json            # JSON output format
ossa test <path>                    # Test agent functionality
ossa upgrade [path]                 # Upgrade agent to v0.1.8
```

### Migration Commands

```bash
# Version Upgrades
ossa upgrade --from 0.1.6 --to 0.1.8    # Version-specific upgrade
ossa migrate --from oaas --to ossa       # Framework migration
ossa migrate --dry-run                   # Preview changes

# Legacy Script Migration
ossa migrate scripts --dry-run           # Preview script migration
ossa migrate scripts --execute           # Execute script migration
```

### UADP Discovery

```bash
# Universal Agent Discovery Protocol
ossa discovery init                 # Initialize UADP discovery
ossa discovery find                 # Find agents with capabilities
ossa discovery register <path>      # Register agent for discovery
ossa discovery health              # Check discovery service health
```

---

##  Verification and Testing

### Health Check

```bash
# Complete system health check
ossa validate --pre-migration

# Expected output:
#  OSSA CLI v0.1.8: Ready
#  Project Structure: Valid
#  Discovery Engine: Operational
#  Agent Registry: 15 agents registered
#  Runtime Translation: Enabled
```

### Integration Testing

```bash
# Test cross-format integration
ossa test --integration --frameworks drupal,mcp,langchain

# Test API compatibility
ossa test --api-compatibility

# Performance benchmarks
ossa benchmark --compare-with-legacy
```

### Compliance Validation

```bash
# Validate OSSA v0.1.8 compliance
ossa validate --version 0.1.8 --compliance-check

# Check enterprise compliance
ossa validate --compliance iso-42001,nist-ai-rmf,fedramp
```

---

##  Next Steps

### Level 1: Basic Usage (Completed )
-  Install OSSA CLI and run discovery
-  Find and catalog your existing agents
-  Create your first OSSA-native agent
-  Test agent execution and validation

### Level 2: Integration
-  **[Migration Guide](../resources/migration/complete-migration-guide.md)** - Comprehensive migration from legacy systems
-  **[Best Practices](../guides/best-practices.md)** - Recommended development patterns
-  **[Enterprise Features](../enterprise/governance.md)** - Advanced enterprise capabilities
-  **[API Reference](../reference/api/ossa-api-reference.md)** - Complete API documentation

### Level 3: Advanced
-  **[Agent Architecture](../reference/specifications/agent-spec.md)** - Deep dive into agent specifications
-  **[Discovery Protocol](../reference/specifications/discovery-spec.md)** - UADP and service discovery
- 🏢 **[Enterprise Deployment](../enterprise/deployment.md)** - Production deployment guides
-  **[Contributing](../development/contributing.md)** - Contribute to the OSSA project

---

## 🆘 Troubleshooting

### Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| **CLI Not Found** | `ossa: command not found` | Run `npm install -g @bluefly/open-standards-scalable-agents@0.1.8` |
| **No Agents Found** | Discovery returns 0 agents | Check `discoveryPaths` in configuration and file permissions |
| **Validation Errors** | Agent validation fails | Run `ossa validate --verbose` for detailed error messages |
| **Permission Denied** | Cannot access directories | Ensure read access to source directories |
| **Translation Failures** | Cross-format translation fails | Check agent format compliance with `ossa analyze` |
| **Performance Issues** | Slow discovery/translation | Enable caching with `ossa config set features.caching true` |

### Debug Mode

```bash
# Enable detailed logging for troubleshooting
export OSSA_DEBUG=true
ossa discover --verbose

# Check system diagnostics
ossa diagnose --full-report
```

### Getting Help

```bash
# CLI help system
ossa --help                    # General help
ossa validate --help          # Command-specific help
ossa discovery --help         # Discovery system help

# Version and system information
ossa --version                # CLI version
ossa diagnose --system-info   # System diagnostics
```

### Support Resources

1. **Documentation**: [Complete OSSA Documentation](../README.md)
2. **FAQ**: [Frequently Asked Questions](../resources/faq.md)
3. **Troubleshooting**: [Detailed troubleshooting guide](../resources/troubleshooting.md)
4. **Migration Support**: [Complete migration guide](../resources/migration/complete-migration-guide.md)
5. **Community**: Contact the OSSA team for enterprise support

---

##  Migration Summary

### What You've Accomplished

 **Installed OSSA CLI** with enterprise-grade agent standards  
 **Discovered existing agents** without any file modifications  
 **Created your first OSSA agent** following v0.1.8 specifications  
 **Validated system health** with comprehensive testing  
 **Enabled cross-format translation** for framework interoperability  

### What's Preserved

 **All existing agents work unchanged** - zero breaking changes  
 **Original file formats maintained** - no forced conversions  
 **Existing workflows continue** - progressive enhancement only  
 **Complete rollback safety** - can disable OSSA without impact  

---

** You're now ready to leverage OSSA's enterprise-grade agent standards with your existing codebase - no disruption, maximum benefit!**

For comprehensive migration from legacy systems, see the [Complete Migration Guide](../resources/migration/complete-migration-guide.md).