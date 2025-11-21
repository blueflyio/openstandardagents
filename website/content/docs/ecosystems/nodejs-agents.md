---
title: OSSA Agents in Node.js/npm
description: How to organize and discover OSSA agents in npm packages
---

# OSSA Agents in Node.js/npm

This guide explains how to organize and discover OSSA agents within npm packages using the standard `.agents/` folder structure.

## Folder Structure

### Package-Level Agents

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

## Using Agents

### Load Agent

```javascript
// In src/index.js
const { discoverAgent } = require('@ossa/nodejs');

function getAgent() {
  return discoverAgent('package-agent', 'my-npm-package');
}

// Use agent
const agent = getAgent();
const result = await agent.processTask(data);
```

### Discover All Package Agents

```javascript
// Discover all agents in a package
const { discoverPackageAgents } = require('@ossa/nodejs');

const agents = await discoverPackageAgents('my-npm-package');
for (const agent of agents) {
  // Use agent
  const result = await agent.processTask(data);
}
```

## Example: Package Agent

See [examples/nodejs/package-with-agents/.agents/package-agent/](../../../../examples/nodejs/package-with-agents/.agents/package-agent/) for a complete example.

## Best Practices

- **Include agents in package distribution** via `files` in `package.json`
- **Use package-level agents** for package-specific functionality
- **Include README.md** in each agent folder
- **Use taxonomy** to enable capability-based discovery
- **Scan node_modules** for installed package agents

## Related

- [Workspace Discovery](/docs/core-concepts/Workspace-Discovery)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Example: npm Package](../../../../examples/nodejs/package-with-agents/)

