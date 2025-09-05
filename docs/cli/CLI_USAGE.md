# OSSA Working CLI Usage Guide v0.1.8

**Functional CLI implementation - no fantasy claims**

The OSSA Working CLI provides real, tested functionality for creating, validating, and managing OSSA-compliant AI agents.

## Installation

```bash
npm install -g @bluefly/open-standards-scalable-agents

# Verify installation
ossa-working version
```

## Commands Overview

| Command | Description | Status |
|---------|-------------|---------|
| `version` | Show version and system info | ✅ Working |
| `help` | Show available commands | ✅ Working |
| `create <name>` | Create new agent | ✅ Working |
| `validate <file>` | Validate agent specification | ✅ Working |
| `list` | List all available agents | ✅ Working |
| `serve` | Start validation server | ✅ Working |
| `demo` | Run working demonstrations | ✅ Working |
| `test` | Run validation tests | ✅ Working |
| `status` | Check system status | ✅ Working |
| `examples` | Show available examples | ✅ Working |

## Command Reference

### `ossa-working version`

Shows version and system information.

```bash
$ ossa-working version
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

Version: 0.1.8
Root Path: /path/to/ossa
Node.js: v18.17.0
Available Agents: 3
Working Services: 1/1
```

### `ossa-working create <name>`

Creates a new OSSA-compliant agent with proper directory structure.

```bash
$ ossa-working create my-agent
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

📝 Creating agent: my-agent
   Directory: /current/path/.agents/my-agent

✅ Agent created successfully!

Generated files:
   - agent.yml         Agent specification
   - openapi.yaml      API specification
   - README.md         Documentation
   - data/             Training data directory
   - schemas/          JSON schemas directory

Next steps:
   1. Edit agent.yml to customize your agent
   2. Add capabilities and expertise descriptions
   3. Update openapi.yaml with your API endpoints
   4. Validate with: ossa-working validate .agents/my-agent/agent.yml
```

**Requirements:**
- Agent name must be lowercase
- Must start with a letter
- Can contain letters, numbers, hyphens, and underscores
- Cannot already exist

**Generated Structure:**
```
.agents/my-agent/
├── agent.yml          # OSSA specification
├── openapi.yaml       # API specification
├── README.md          # Documentation
├── data/              # Training data directory
└── schemas/           # JSON schemas directory
```

### `ossa-working validate <file>`

Validates an OSSA agent specification file.

```bash
$ ossa-working validate .agents/my-agent/agent.yml
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

🔍 Validating: .agents/my-agent/agent.yml
✅ Valid OSSA agent specification
   API Version: open-standards-scalable-agents/v0.1.8
   Agent Name: My Agent
   Capabilities: 2
   Frameworks: mcp, langchain

⚠️  Warnings:
   - Consider adding OpenAPI specification for better interoperability
```

**Validation Checks:**
- Required fields (apiVersion, kind, metadata, spec)
- Field format validation
- Semantic validation
- Framework consistency
- Version format checking

**Output:**
- ✅ Valid specifications show compliance level and details
- ❌ Invalid specifications show specific error messages
- ⚠️ Warnings for improvements and best practices

### `ossa-working list`

Lists all discovered OSSA agents in the workspace.

```bash
$ ossa-working list
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

🔍 Scanning for OSSA agents...

Found 3 agents:

📋 My Agent
   Path: ./.agents/my-agent/agent.yml
   Capabilities: 2
   Frameworks: mcp, langchain
   API Version: open-standards-scalable-agents/v0.1.8

📋 Demo Agent
   Path: ./.agents/demo-agent/agent.yml
   Capabilities: 1
   Frameworks: mcp
   API Version: open-standards-scalable-agents/v0.1.8

📋 Test Agent
   Path: ./examples/.agents/test-agent/agent.yml
   Capabilities: 3
   Frameworks: mcp, langchain, crewai
   API Version: open-standards-scalable-agents/v0.1.8
```

**Discovery Rules:**
- Scans current directory and subdirectories
- Looks for `.agents/*/agent.yml` files
- Includes examples directory
- Shows relative paths from current directory

### `ossa-working serve`

Starts the validation server on port 3003.

```bash
$ ossa-working serve
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

🚀 Starting validation server on port 3003...
   Script: /path/to/ossa/services/validation-server.js

🧪 Testing server...
   ✅ Server healthy: healthy

✅ Validation server started successfully!
   Health check: http://localhost:3003/health
   API docs: http://localhost:3003/api-docs

   Press Ctrl+C to stop the server
```

**Server Features:**
- Real API endpoints (not mock)
- Health check endpoint
- Agent validation API
- Batch validation support
- OpenAPI specification validation
- Token estimation
- Comprehensive error reporting

**API Endpoints:**
- `GET /health` - Health check
- `GET /api/v1/info` - Server information
- `POST /api/v1/validate/agent` - Validate agent
- `POST /api/v1/validate/batch` - Batch validation
- `GET /api/v1/schemas` - Available schemas

### `ossa-working demo`

Runs working demonstrations of OSSA functionality.

```bash
$ ossa-working demo
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

🎭 Running OSSA Working Demonstration

This demo shows ONLY working functionality - no fantasy claims!

1️⃣  Available Agents:
   Found 3 agents
   - ./examples/.agents/01-agent-basic/agent.yml
   - ./examples/.agents/02-agent-integration/agent.yml
   - ./examples/.agents/03-agent-production/agent.yml

2️⃣  Agent Validation:
   Validation result: PASS

3️⃣  Validation Server:
   ✅ Server running on port 3003

4️⃣  Real Capabilities Summary:
   ✅ Agent validation - functional
   ✅ Agent creation - functional
   ✅ Agent listing - functional
   ✅ Validation server - running
   ❌ No fantasy port claims (4021-4040)
   ❌ No non-existent services
   ✅ Only working implementations included

🎉 Demo completed - all features are functional!
```

### `ossa-working test`

Runs validation tests across the system.

```bash
$ ossa-working test
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

🧪 Running OSSA Validation Tests

1️⃣  Testing agent validation...
   ✅ Agent validation tests passed

2️⃣  Testing agent creation...
   ✅ Agent creation tests passed

3️⃣  Testing validation server...
   ✅ Validation server tests passed

📊 Test Results:
==================================================
   Agent Validation: ✅ PASS (3/3)
   Agent Creation: ✅ PASS (1/1)
   Validation Server: ✅ PASS (1/1)
==================================================
   Overall: 5/5 tests passed
   Success Rate: 100%
```

### `ossa-working status`

Shows comprehensive system status.

```bash
$ ossa-working status
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

📊 OSSA System Status

🤖 Agents:
   Available: 3
   Valid: 3/3

🔧 Services:
   validation-server:
     Script: ✅ /path/to/ossa/services/validation-server.js
     Running: ✅ Port 3003
     Description: OSSA validation API server

💻 System:
   Node.js: v18.17.0
   OSSA CLI: v0.1.8
   Root Path: /path/to/ossa
   Working Directory: /current/path
```

### `ossa-working examples`

Shows available examples and templates.

```bash
$ ossa-working examples
🤖 OSSA Working CLI v0.1.8
   Open Standards for Scalable Agents - Functional Implementation

📚 OSSA Examples and Templates

🎯 Example Agents (/path/to/ossa/examples/.agents):
   📋 Basic Agent
      Path: ./examples/.agents/01-agent-basic/agent.yml
      Expertise: Basic agent demonstrating core OSSA functionality
      Capabilities: 2

   📋 Integration Agent
      Path: ./examples/.agents/02-agent-integration/agent.yml
      Expertise: Integration-ready agent with framework support
      Capabilities: 3

🚀 Create New Agent:
   ossa-working create <agent-name>

📖 Validate Agent:
   ossa-working validate <path-to-agent.yml>

🔍 List All Agents:
   ossa-working list
```

## Error Handling

### Common Errors and Solutions

#### Agent Creation Errors

```bash
❌ Agent directory already exists: .agents/my-agent
```
**Solution**: Choose a different name or remove the existing directory.

```bash
❌ Agent name must be lowercase, start with a letter, and contain only letters, numbers, hyphens, and underscores
```
**Solution**: Use valid naming: `my-agent`, `test_agent_1`, `data-processor`

#### Validation Errors

```bash
❌ File not found: agent.yml
```
**Solution**: Check file path and ensure file exists.

```bash
❌ Invalid OSSA agent specification
Errors:
   - Missing required field: apiVersion
   - Missing required field: spec.agent.name
```
**Solution**: Add missing required fields to agent specification.

#### Server Errors

```bash
❌ Port 3003 is already in use
   Try a different port: PORT=3004 node /path/to/validation-server.js
```
**Solution**: Stop existing server or use different port.

## Best Practices

### Agent Creation
1. Use descriptive agent names
2. Provide detailed expertise descriptions (20+ characters)
3. Define clear capability descriptions (10+ characters)
4. Include framework integrations as needed
5. Add OpenAPI specifications for production use

### Validation
1. Validate agents after any changes
2. Address warnings for better compliance
3. Aim for higher compliance levels (Silver, Gold, Platinum)
4. Use batch validation for multiple agents

### Development Workflow
1. Create agent with `ossa-working create`
2. Edit agent specification
3. Validate with `ossa-working validate`
4. Test integration with `ossa-working demo`
5. Deploy with validation server

## Integration Examples

### Using with CI/CD

```yaml
# .github/workflows/validate-agents.yml
name: Validate OSSA Agents
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g @bluefly/open-standards-scalable-agents
      - run: ossa-working test
```

### Using in Scripts

```bash
#!/bin/bash
# validate-all-agents.sh

echo "Validating all agents..."
for agent in .agents/*/agent.yml; do
    if ossa-working validate "$agent"; then
        echo "✅ $agent is valid"
    else
        echo "❌ $agent has errors"
        exit 1
    fi
done
echo "All agents validated successfully!"
```

### Using with NPM Scripts

```json
{
  "scripts": {
    "validate-agents": "ossa-working test",
    "create-agent": "ossa-working create",
    "start-server": "ossa-working serve",
    "demo": "ossa-working demo"
  }
}
```

## Troubleshooting

### CLI Not Found
```bash
ossa-working: command not found
```
**Solutions:**
1. Reinstall package: `npm install -g @bluefly/open-standards-scalable-agents`
2. Check global npm path: `npm config get prefix`
3. Use npx: `npx @bluefly/open-standards-scalable-agents version`

### Permission Errors
```bash
EACCES: permission denied
```
**Solutions:**
1. Use sudo: `sudo npm install -g @bluefly/open-standards-scalable-agents`
2. Configure npm prefix: `npm config set prefix ~/.npm-global`
3. Use a Node version manager (nvm)

### Server Won't Start
1. Check if port is in use: `lsof -i :3003`
2. Try different port: `PORT=3004 ossa-working serve`
3. Check Node.js version: `node --version` (requires ≥18.0.0)

## Support

### Get Help
- Run `ossa-working help` for command overview
- Check `ossa-working version` for system information
- Use `ossa-working status` to diagnose issues

### Report Issues
Include in bug reports:
1. Command that failed
2. Full error message
3. Output of `ossa-working version`
4. Steps to reproduce

---

**✅ All functionality in this guide has been tested and verified to work.**

This CLI provides real, functional tools for OSSA agent management with no fantasy claims or mock implementations.