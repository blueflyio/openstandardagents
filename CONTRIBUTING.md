# Contributing to OpenAPI AI Agents Standard

Thank you for your interest in contributing to the OpenAPI AI Agents Standard - the "Switzerland of AI Agents"! This document provides guidelines for contributing to make the process smooth and effective.

## 🌟 Why Contribute?

By contributing to this standard, you're helping build the necessary bridge between competing AI ecosystems. Your contributions will:
- Enable seamless communication between MCP, A2A, and other protocols
- Provide enterprise-grade compliance (ISO 42001, NIST AI RMF, EU AI Act)
- Reduce development time through protocol bridges, not new protocols
- Establish the de facto standard for AI agent governance
- Create monetization opportunities through certification programs

## 📋 How to Contribute

### 1. Join the Discussion
- **GitHub Discussions**: Participate in design discussions and proposals
- **Working Groups**: Join our technical working groups (see below)
- **Community Calls**: Attend our bi-weekly community calls (Thursdays, 10am PT)

### 2. Types of Contributions

#### 🔧 Technical Contributions (PRIORITY AREAS)
- **Protocol Bridges**: MCP and A2A bridges are CRITICAL - we embrace, not compete
- **Enterprise Integrations**: Salesforce→OpenAI, Copilot→Vertex bridges needed
- **Compliance Tools**: ISO 42001, NIST AI RMF validation tools
- **Reference Implementations**: Focus on enterprise use cases that matter
- **Token Optimization**: Achieve 35-45% savings with tiktoken integration

#### 📚 Documentation
- **Tutorials**: Create getting-started guides and tutorials
- **Examples**: Provide real-world implementation examples
- **Translations**: Help translate documentation to other languages
- **Use Cases**: Document enterprise use cases and success stories

#### 🧪 Testing & Validation
- **Test Cases**: Contribute test scenarios and edge cases
- **Performance Benchmarks**: Share benchmarking results
- **Security Testing**: Help identify and fix security vulnerabilities
- **Compliance Validation**: Test against ISO 42001, NIST AI RMF

### 3. Working Groups

Join one of our specialized working groups:

| Working Group | Focus Area | Meeting Schedule |
|--------------|------------|------------------|
| Core Specification | Dual-format (agent.yml + OpenAPI) development | Weekly - Mondays 2pm PT |
| Protocol Bridges | MCP, A2A integration (not competition) | Weekly - Tuesdays 11am PT |
| Enterprise Compliance | ISO 42001, NIST, EU AI Act certification | Bi-weekly - Wednesdays 3pm PT |
| Partner Integration | Big 4, tool vendors, platforms | Weekly - Thursdays 10am PT |
| Certification Program | $10K enterprise certification development | Weekly - Fridays 1pm PT |

To join a working group, submit a request via [GitHub Discussions](https://github.com/openapi-ai-agents/standard/discussions).

## 🚀 Getting Started

### Prerequisites
```bash
# Node.js 18+ required
node --version

# Git
git --version

# TypeScript
npm install -g typescript
```

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/openapi-ai-agents-standard.git
cd openapi-ai-agents-standard

# Install dependencies
npm install

# Run validation tests
npm run validate

# Run compliance checks
npm run compliance:check
```

## 📝 Contribution Process

### 1. Create an Issue
Before starting work, create an issue describing your proposed contribution:
- **Bug Report**: Use the bug report template
- **Feature Request**: Use the feature request template
- **Specification Change**: Use the RFC (Request for Comments) template

### 2. Fork and Branch
```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 3. Make Your Changes
- Follow the coding standards (see below)
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 4. Commit Guidelines
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

feat(spec): add new orchestration pattern
fix(mcp): resolve protocol negotiation issue
docs(readme): update installation instructions
test(validation): add edge case scenarios
refactor(tokens): optimize token counting logic
```

### 5. Submit a Pull Request
- Ensure your branch is up to date with main
- Create a pull request with a clear description
- Reference any related issues
- Wait for review from maintainers

## 🎯 Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Maintain 90%+ test coverage
- Use async/await over callbacks

### OpenAPI Specification
- Follow OpenAPI 3.1 standards
- Include comprehensive descriptions
- Provide examples for all schemas
- Use consistent naming conventions

### Documentation
- Write clear, concise documentation
- Include code examples
- Keep README files up to date
- Add JSDoc comments for public APIs

## 🏆 Recognition & Opportunities

### Contributors
All contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Annual AI Governance Summit
- Enterprise certification materials
- Partner consulting opportunities

### Levels of Recognition
- 🥉 **Bronze**: 1-5 merged PRs + Community badge
- 🥈 **Silver**: 6-15 merged PRs + Certified implementer status
- 🥇 **Gold**: 16+ merged PRs + Speaking opportunities
- 💎 **Diamond**: Core maintainer + Revenue sharing from certifications
- 🚀 **Platinum**: Strategic partner + Big 4 consulting referrals

## 🔒 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

Key principles:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## 📅 Release Process

We follow a regular release cycle:
- **Major releases**: Annually (breaking changes allowed)
- **Minor releases**: Quarterly (new features, backward compatible)
- **Patch releases**: As needed (bug fixes only)

## 🆘 Getting Help

Need help with your contribution?

- **Documentation**: [docs.openapi-ai-agents.org](https://docs.openapi-ai-agents.org)
- **Discord**: [Join our Discord server](https://discord.gg/openapi-agents)
- **GitHub Discussions**: Ask questions in the Q&A section
- **Office Hours**: Thursdays 2-3pm PT on Discord

## 📜 License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0, ensuring maximum enterprise adoption.

## 🙏 Thank You!

Thank you for contributing to the OpenAPI for AI Agents Standard. Your efforts help create a more interoperable, secure, and efficient AI ecosystem for everyone.

---

**Questions?** Open a discussion or reach out to the maintainers at standards@openapi-ai-agents.org