# npm Package Export

Export OSSA agent manifests as installable npm packages with full TypeScript support, API endpoints, and OpenAPI specifications.

## What Gets Generated

The npm exporter creates a production-ready, publishable npm package:

### Package Structure

```
my-agent/
├── package.json          # npm package configuration
├── index.js              # JavaScript entry point
├── index.d.ts            # TypeScript type definitions
├── agent.ossa.yaml       # Original OSSA manifest (embedded)
├── README.md             # Auto-generated documentation
├── LICENSE               # License file (MIT/Apache-2.0/ISC)
├── .npmignore            # npm publish exclusions
└── SKILL.md              # Claude Code skill (optional)
```

### Key Features

- **TypeScript Support**: Full type definitions for IDE autocomplete
- **Embedded Manifest**: Original OSSA YAML included in package
- **Zero Dependencies**: Standalone package, no runtime dependencies
- **Claude Skills Integration**: Optional Claude Code skill generation
- **npm Registry Ready**: Publish directly to npm or private registry

## Quick Start

### Basic Export

```bash
# Export OSSA manifest as npm package
ossa export agent.ossa.yaml --platform npm --output ./my-agent-package

# Export with Claude Skill
ossa export agent.ossa.yaml --platform npm --output ./my-agent-package --skill

# Preview without writing files
ossa export agent.ossa.yaml --platform npm --dry-run --verbose
```

### Publishing to npm

```bash
# Navigate to package
cd my-agent-package

# Login to npm (first time only)
npm login

# Publish package
npm publish --access public

# Or publish to private registry
npm publish
```

### Installing Published Package

```bash
# Install from npm
npm install @ossa/my-agent

# Or with specific version
npm install @ossa/my-agent@1.0.0
```

## Usage Examples

### Node.js Application

```javascript
// Import the agent
import agent from '@ossa/my-agent';

// Access metadata
console.log(agent.metadata.name);         // "my-agent"
console.log(agent.metadata.version);      // "1.0.0"
console.log(agent.metadata.description);  // Agent description
console.log(agent.metadata.capabilities); // ["code-review", "testing"]

// Access manifest
const manifestYAML = agent.manifest();
console.log(manifestYAML);  // Full OSSA YAML

// Access runtime info
console.log(agent.runtime);
// {
//   platform: 'npm',
//   version: '1.0.0',
//   ossaVersion: 'v0.4.1'
// }
```

### TypeScript Application

```typescript
import agent from '@ossa/my-agent';
import type { OssaAgent } from '@ossa/my-agent';

// Fully typed access
const name: string = agent.metadata.name;
const capabilities: string[] = agent.metadata.capabilities || [];

// Type-safe manifest
const manifest: OssaAgent = agent.getManifest();

// IDE autocomplete for all properties
const llm = manifest.spec?.llm;
if (llm) {
  console.log(llm.provider);  // TypeScript knows this exists
  console.log(llm.model);     // Autocomplete works perfectly
}
```

### Load Into OSSA Runtime

```javascript
import agent from '@ossa/my-agent';
import { AgentRuntime } from '@bluefly/agent-buildkit';

// Get OSSA manifest YAML
const manifestYAML = agent.manifest();

// Load into runtime
const runtime = new AgentRuntime();
await runtime.loadFromYAML(manifestYAML);

// Execute
const result = await runtime.execute({
  input: "Analyze this code"
});

console.log(result);
```

### Use With LangChain

```javascript
import agent from '@ossa/my-agent';
import { LangChainAdapter } from '@bluefly/openstandardagents/adapters/langchain';

// Convert to LangChain
const manifest = agent.getManifest();
const adapter = new LangChainAdapter();
const langchainAgent = adapter.convert(manifest);

// Use with LangChain
import { ChatAnthropic } from "langchain/chat_models/anthropic";
const result = await langchainAgent.call({ input: "Hello" });
```

## API Endpoints

npm packages can include Express API endpoints for HTTP access:

### Enable API Export

```bash
# Export with API endpoints
ossa export agent.ossa.yaml --platform npm --with-api --output ./my-agent
```

### Generated API Structure

```
my-agent/
├── package.json
├── index.js
├── api/
│   ├── server.js         # Express server
│   ├── routes.js         # API routes
│   └── openapi.yaml      # OpenAPI 3.1 specification
└── README.md
```

### Start API Server

```bash
cd my-agent
npm install
npm start
```

Server runs on `http://localhost:3000` by default.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Agent info and status |
| `GET` | `/manifest` | Get OSSA manifest (YAML) |
| `GET` | `/metadata` | Get agent metadata (JSON) |
| `POST` | `/execute` | Execute agent |
| `GET` | `/health` | Health check |
| `GET` | `/openapi` | OpenAPI specification |

### Execute Agent via API

```bash
# Execute agent
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is the capital of France?",
    "context": {}
  }'
```

**Response:**

```json
{
  "success": true,
  "output": "The capital of France is Paris.",
  "metadata": {
    "agent": "my-agent",
    "version": "1.0.0",
    "executionTime": 1234
  }
}
```

### Get Agent Metadata

```bash
curl http://localhost:3000/metadata
```

**Response:**

```json
{
  "name": "my-agent",
  "version": "1.0.0",
  "description": "AI-powered agent",
  "capabilities": ["code-review", "testing"],
  "llm": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

## OpenAPI Spec

Every npm package export includes a complete OpenAPI 3.1 specification:

```yaml
openapi: 3.1.0
info:
  title: My Agent API
  version: 1.0.0
  description: AI-powered agent generated from OSSA manifest

servers:
  - url: http://localhost:3000
    description: Local development server

paths:
  /execute:
    post:
      summary: Execute agent
      operationId: executeAgent
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
                  description: User input message
                context:
                  type: object
                  description: Execution context
                  additionalProperties: true
      responses:
        '200':
          description: Successful execution
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExecutionResult'

components:
  schemas:
    ExecutionResult:
      type: object
      required:
        - success
        - output
      properties:
        success:
          type: boolean
        output:
          type: string
        metadata:
          type: object
```

Access via: `http://localhost:3000/openapi`

## Publishing

### Scoped Packages

Use npm scopes for organization:

```bash
# Export with scope
ossa export agent.ossa.yaml --platform npm --scope @myorg --output ./my-agent

# Publish
cd my-agent
npm publish --access public
```

This creates: `@myorg/my-agent`

### Private Registry

Publish to private npm registry:

```bash
# Configure registry
npm config set registry https://registry.mycompany.com/

# Publish
npm publish
```

### Semantic Versioning

The exported package uses version from OSSA manifest:

```yaml
# agent.ossa.yaml
metadata:
  name: my-agent
  version: 1.2.3  # Becomes package version
```

Generated `package.json`:

```json
{
  "name": "@ossa/my-agent",
  "version": "1.2.3",
  "description": "AI-powered agent"
}
```

### Pre-publish Checklist

```bash
# 1. Validate manifest
ossa validate agent.ossa.yaml

# 2. Export package
ossa export agent.ossa.yaml --platform npm --output ./package

# 3. Test package locally
cd package
npm link
cd ../test-project
npm link @ossa/my-agent

# 4. Run tests
npm test

# 5. Publish
npm publish --access public
```

## Claude Skills Integration

Export includes optional Claude Code skill for instant integration:

### Enable Skill Export

```bash
ossa export agent.ossa.yaml --platform npm --skill --output ./my-agent
```

### Generated SKILL.md

```markdown
# My Agent Skill

AI-powered agent for code analysis and review.

## Usage

Load this skill in Claude Code:

\`\`\`bash
# Copy to Claude skills directory
cp SKILL.md ~/.claude/skills/my-agent.md

# Claude Code auto-discovers and loads
claude --print "use my-agent to analyze code"
\`\`\`

## Capabilities

- Code review
- Security analysis
- Documentation generation

## Commands

- `@my-agent analyze [file]` - Analyze code file
- `@my-agent review [pr]` - Review pull request

## Installation

\`\`\`bash
npm install @ossa/my-agent
\`\`\`
```

### Use in Claude Code

```bash
# Install package
npm install @ossa/my-agent

# Extract skill
cp node_modules/@ossa/my-agent/SKILL.md ~/.claude/skills/

# Use in Claude Code
claude --print "use my-agent to review this code"
```

## Examples

### Code Reviewer Package

**OSSA Manifest:**

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: code-reviewer
  version: 1.0.0
  description: AI-powered code review agent
  author: Your Name
  license: MIT
  capabilities:
    - code-review
    - security-analysis
spec:
  role: Code Reviewer
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.3
```

**Export:**

```bash
ossa export code-reviewer.ossa.yaml \
  --platform npm \
  --scope @myorg \
  --skill \
  --output ./code-reviewer-package
```

**Publish:**

```bash
cd code-reviewer-package
npm publish --access public
```

**Use:**

```javascript
import reviewer from '@myorg/code-reviewer';

console.log(reviewer.metadata.name);  // "code-reviewer"
const manifest = reviewer.manifest();  // Full YAML
```

### Data Analyst Package

**OSSA Manifest:**

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: data-analyst
  version: 2.1.0
  description: Data analysis and visualization
  capabilities:
    - data-analysis
    - visualization
spec:
  role: Data Analyst
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
```

**Export with API:**

```bash
ossa export data-analyst.ossa.yaml \
  --platform npm \
  --with-api \
  --output ./data-analyst-package
```

**Deploy API:**

```bash
cd data-analyst-package
npm install
npm start
```

**Use API:**

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"input": "Analyze sales_data.csv"}'
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install package from npm
RUN npm install @ossa/my-agent

# Copy server code
COPY server.js .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Serverless (AWS Lambda)

```javascript
// lambda-handler.js
import agent from '@ossa/my-agent';

export const handler = async (event) => {
  const manifest = agent.manifest();

  // Process with runtime
  const result = await processAgent(manifest, event);

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-agent
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: agent
        image: my-agent-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NPM_PACKAGE
          value: "@ossa/my-agent"
```

## Troubleshooting

### Package Not Found

**Problem:** `npm ERR! 404 Not Found - GET https://registry.npmjs.org/@ossa/my-agent`

**Solution:**

```bash
# Verify package was published
npm view @ossa/my-agent

# Check scope access
npm access ls-packages @ossa

# Publish if missing
npm publish --access public
```

### Type Definitions Missing

**Problem:** `Cannot find module '@ossa/my-agent' or its corresponding type declarations`

**Solution:**

Ensure `index.d.ts` is included:

```json
// package.json
{
  "types": "./index.d.ts",
  "main": "./index.js"
}
```

### Manifest Loading Error

**Problem:** `Error: Cannot load embedded OSSA manifest`

**Solution:**

```javascript
// Verify manifest is embedded
import agent from '@ossa/my-agent';
console.log(agent.manifest());  // Should return YAML string

// Check package includes agent.ossa.yaml
import { readFileSync } from 'fs';
import { join } from 'path';
const pkg = join(process.cwd(), 'node_modules/@ossa/my-agent');
console.log(readFileSync(join(pkg, 'agent.ossa.yaml'), 'utf-8'));
```

### Permission Denied

**Problem:** `npm ERR! code EPERM`

**Solution:**

```bash
# Fix permissions
sudo chown -R $(whoami) ~/.npm

# Or use npx
npx npm publish
```

## Best Practices

### 1. Version Management

Follow semantic versioning:

```yaml
metadata:
  version: 1.0.0   # Major.Minor.Patch
```

- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes only

### 2. Package Naming

Use clear, descriptive names:

```bash
# Good
@ossa/code-reviewer
@myorg/data-analyst
@team/security-scanner

# Bad
@ossa/agent1
@myorg/thing
```

### 3. Documentation

Include comprehensive README:

```yaml
metadata:
  name: my-agent
  description: Clear, concise description of what the agent does
  author: Your Name <email@example.com>
  license: MIT
```

### 4. License Selection

Choose appropriate license:

- **MIT**: Permissive, widely used
- **Apache-2.0**: Permissive with patent grant
- **ISC**: Simpler alternative to MIT

### 5. Security

Never include secrets in published packages:

```bash
# Use .npmignore
echo ".env" >> .npmignore
echo "secrets.json" >> .npmignore
echo "*.key" >> .npmignore
```

### 6. Testing

Test package before publishing:

```bash
# Local testing
npm link

# Install in test project
cd ../test-project
npm link @ossa/my-agent

# Run tests
npm test
```

## Performance

### Package Size

Keep packages small:

```bash
# Check package size
npm pack --dry-run

# Exclude unnecessary files
# .npmignore
tests/
docs/
examples/
*.log
```

### Load Time

Optimize for fast loading:

```javascript
// Lazy load heavy dependencies
export async function loadRuntime() {
  const runtime = await import('@bluefly/agent-buildkit');
  return runtime;
}
```

### Tree Shaking

Enable tree shaking:

```json
{
  "sideEffects": false,
  "module": "./index.esm.js"
}
```

## Next Steps

- [LangChain Export](./langchain.md) - Export to LangChain
- [Anthropic Export](./anthropic.md) - Export to Anthropic Claude
- [Publishing Guide](../guides/publishing.md) - Complete publishing documentation
- [Best Practices](../guides/best-practices.md) - General best practices
