# Node.js/npm Package with OSSA Agents

This example demonstrates how to organize OSSA agents within an npm package using the standard `.agents/` folder structure.

## Structure

```
my-npm-package/
├── .agents/                    # Package-specific agents
│   └── package-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── src/
└── package.json
```

## Discovery

npm packages can include `.agents/` in their distribution. Tools scan `node_modules/*/.agents/` to discover package agents from installed packages.

## Agent Example

See `.agents/package-agent/` for a complete example of an API operations agent.

## Usage

### Include Agents in Package

```json
// In package.json
{
  "name": "my-npm-package",
  "files": [
    ".agents/**/*",
    "src/**/*"
  ]
}
```

### Use Agent in Code

```javascript
// In src/index.js
const { discoverAgent } = require('@ossa/nodejs');

function getAgent() {
  return discoverAgent('package-agent', 'my-npm-package');
}

// Use agent
const agent = getAgent();
const response = await agent.makeApiRequest('/api/endpoint');
```

## Related

- [OSSA Node.js Integration Guide](../../../../website/content/docs/ecosystems/nodejs-agents.md)
- [Workspace Discovery](../../../../website/content/docs/core-concepts/Workspace-Discovery.md)

