# OSSA Documentation Index

Welcome to the Open Standards for Scalable Agents (OSSA) v0.1.8 documentation.

## 📚 Documentation Structure

### 🎯 Quick Start
- [README](../README.md) - Project overview and quick start
- [CLAUDE.md](../CLAUDE.md) - Development guide for Claude Code
- [Getting Started Guide](guides/getting-started.md)

### 📋 Project Overview
- [Project Overview](overview/project-overview.md) - High-level project description
- [Architecture Overview](overview/architecture.md) - System architecture
- [Features](overview/features.md) - Key features and capabilities
- [Changelog](../CHANGELOG.md) - Version history

### 🔧 Specifications
- [OSSA v0.1.8 Specification](specifications/ossa-v0.1.8.md) - Current specification
- [API Specifications](api/openapi-specs.md) - OpenAPI documentation
- [Agent Structure](specifications/agent-structure.md) - OSSA-compliant agent format
- [Compliance Standards](specifications/compliance.md) - OSSA compliance requirements

### 👨‍💻 Development
- [Development Guide](development/development-guide.md) - Complete development workflow
- [Testing Guide](development/testing.md) - Testing strategies and commands
- [Contributing](development/CONTRIBUTING.md) - Contribution guidelines
- [Code of Conduct](development/CODE_OF_CONDUCT.md) - Community standards

### 🚀 Deployment & Operations
- [Deployment Guide](deployment/deployment-guide.md) - Production deployment
- [Docker Setup](deployment/docker-setup.md) - Container orchestration
- [Kubernetes Deployment](deployment/k8s-deployment.md) - K8s configuration
- [Monitoring & Logging](deployment/monitoring.md) - Observability setup

### 📊 Status & Reports
- [Implementation Status](status/implementation-status.md) - Current implementation status
- [Migration Status](status/migration-status.md) - v0.1.2 to v0.1.8 migration
- [E2E Test Results](status/e2e-test-summary.md) - End-to-end test suite results
- [Performance Benchmarks](status/performance.md) - Performance test results

### 💡 Ideas & Roadmap
- [Roadmap Overview](ideas/roadmap-overview.md) - Project roadmap
- [Feature Ideas](ideas/features/) - Feature proposals and ideas
- [Research Topics](ideas/research/) - Research and exploration
- [Future Vision](ideas/vision.md) - Long-term project vision

### 📚 Guides & Tutorials
- [Migration Guide](guides/migration-guide.md) - Migrating from v0.1.2
- [API Integration](guides/api-integration.md) - Integrating with OSSA APIs
- [Agent Development](guides/agent-development.md) - Creating OSSA agents
- [Framework Integration](guides/framework-integration.md) - MCP, LangChain, CrewAI

### 🗄️ Archive
- [Legacy Documentation](archive/) - Historical documentation
- [Old Specifications](archive/specifications/) - Previous OSSA versions
- [Deprecated Features](archive/deprecated/) - Removed functionality

## 🔍 Quick Links

### Essential Commands
```bash
# Build and run
npm run build
npm test
npm run services:start:dev

# CLI operations
./src/cli/bin/ossa validate
./src/cli/bin/ossa serve

# API development
npm run api:validate
npm run api:generate
```

### Key Files
- [package.json](../package.json) - Project dependencies and scripts
- [vitest.config.ts](../vitest.config.ts) - Test configuration
- [OpenAPI Spec](../src/api/openapi.yaml) - Main API specification

### Support & Resources
- [Issue Tracker](https://gitlab.com/bluefly-ai/ossa-standard/issues)
- [CI/CD Pipeline](.gitlab/ci-components/README.md)
- [Security Policy](development/security.md)

## 📝 Documentation Standards

All documentation follows these standards:
- **Markdown formatting** with clear headers
- **Code examples** with syntax highlighting
- **Cross-references** to related documents
- **Version tracking** for specifications
- **Regular updates** aligned with releases

---

*Last updated: September 2025 | OSSA v0.1.8*