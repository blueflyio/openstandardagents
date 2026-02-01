# Open Standard Agents (OSSA)

> **⚠️ IMPORTANT: This repository is mirrored from GitLab. For the latest code, issues, and contributions, please visit our [primary GitLab repository](https://gitlab.com/blueflyio/ossa/openstandardagents).**

## 🎯 What is OSSA?

**Open Standard Agents (OSSA)** is a comprehensive framework and specification for building, deploying, and managing AI agents in a standardized, interoperable way. OSSA provides:

- **Standardized Agent Specifications**: Define agents using a consistent schema
- **Multi-Language SDKs**: TypeScript, Python, and Go SDKs for agent development
- **CLI Tools**: Command-line interface for agent management and operations
- **Agent Registry**: Centralized registry for discovering and sharing agents
- **Interoperability**: Agents built with OSSA can communicate and collaborate seamlessly

## 🚀 Quick Start

### Installation

```bash
npm install @bluefly/openstandardagents
```

### Basic Usage

```typescript
import { OSSAClient } from '@bluefly/openstandardagents';

const client = new OSSAClient({
  registryUrl: 'https://registry.blueflyagents.com'
});

// List available agents
const agents = await client.listAgents();

// Get agent details
const agent = await client.getAgent('agent-id');
```

## 📚 Documentation

**Full documentation is available on GitLab:**

- **[Main Documentation](https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/home)**
- **[API Reference](https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/api-reference)**
- **[Getting Started Guide](https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/getting-started)**
- **[Agent Development Guide](https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/agent-development)**

## 🔗 Primary Repository

**All development, issues, and contributions happen on GitLab:**

👉 **[https://gitlab.com/blueflyio/ossa/openstandardagents](https://gitlab.com/blueflyio/ossa/openstandardagents)**

### Why GitLab?

- **Active Development**: All code changes, pull requests, and discussions happen on GitLab
- **CI/CD Integration**: Comprehensive CI/CD pipelines for testing and deployment
- **Issue Tracking**: All bugs and feature requests are tracked on GitLab
- **Wiki Documentation**: Complete documentation and guides on GitLab Wiki
- **Release Management**: Semantic versioning and automated releases

## 📦 Packages

OSSA is distributed as npm packages:

- **`@bluefly/openstandardagents`**: Core OSSA framework and CLI
- **`@bluefly/openstandardagents-typescript`**: TypeScript SDK
- **`@bluefly/openstandardagents-python`**: Python SDK (via PyPI)
- **`@bluefly/openstandardagents-go`**: Go SDK (via Go modules)

## 🛠️ Development

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Git

### Setup

```bash
# Clone from GitLab (primary repository)
git clone https://gitlab.com/blueflyio/ossa/openstandardagents.git
cd openstandardagents

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## 🤝 Contributing

**Contributions are welcome! Please contribute via GitLab:**

1. Fork the repository on [GitLab](https://gitlab.com/blueflyio/ossa/openstandardagents)
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Merge Request on GitLab

See our [Contributing Guide](https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/contributing) for detailed guidelines.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🌟 Features

- ✅ **Standardized Agent Schema**: Define agents with consistent structure
- ✅ **Multi-Agent Communication**: Agents can communicate via standardized protocols
- ✅ **Agent Discovery**: Find and use agents from the registry
- ✅ **CLI Tools**: Comprehensive command-line interface
- ✅ **Type Safety**: Full TypeScript support with type definitions
- ✅ **SDK Support**: TypeScript, Python, and Go SDKs
- ✅ **OpenAPI Specs**: Complete API specifications for all services
- ✅ **Extensible**: Plugin system for custom functionality

## 📞 Support

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Discussions**: [GitLab Discussions](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Documentation**: [GitLab Wiki](https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/home)

## 🔄 Repository Status

This GitHub repository is a **read-only mirror** of the primary GitLab repository. The mirror may not always be up-to-date, and GitHub branches may be out of sync.

**For the latest code and active development, always use GitLab.**

---

**Made with ❤️ by the BlueFly.io team**

**Primary Repository**: [https://gitlab.com/blueflyio/ossa/openstandardagents](https://gitlab.com/blueflyio/ossa/openstandardagents)
