# Contributing to OpenAPI AI Agents Standard (OAAS)

Thank you for contributing to OAAS - the universal standard for AI agent interoperability with automatic discovery through the Universal Agent Discovery Protocol (UADP).

## 🌟 **Our Mission**

We're building the definitive agent standard that:
- **Automatically discovers agents** through UADP (`.agents/` folders)
- **Bridges all protocols** (MCP, A2A, LangChain, OpenAI)
- **Provides progressive complexity** (50 lines → enterprise)
- **Uses industry standards** (OpenAPI 3.1, not proprietary formats)

## 🌟 Why Contribute?

You're helping build:
- **The only standard with automatic discovery** - No manual configuration
- **Universal interoperability** - Work with ALL AI frameworks
- **Developer-first tools** - 2-minute agent creation
- **Production-ready agents** - Not theory, working code
- **Open ecosystem** - Vendor-neutral, community-driven

## 🎯 **Current Priorities (from ROADMAP)**

### **Phase 1: Core Agents (Active Now)**
1. **Configuration Optimizer** - Smart config optimization
2. **Discovery Engine** - UADP implementation 
3. **Protocol Bridge System** - MCP/A2A compatibility
4. **Developer Experience Suite** - CLI, templates, VS Code
5. **Performance Analytics** - Real metrics and benchmarks

### **What We Need Help With**
- **Discovery Engine**: File system monitoring, agent indexing
- **MCP Bridge**: Working integration with Claude Desktop
- **A2A Bridge**: Agent card generation and routing
- **CLI Tools**: `oaas create`, `oaas validate`, `oaas deploy`
- **VS Code Extension**: IntelliSense, validation, discovery panel
- **Framework Templates**: LangChain, CrewAI, AutoGen, OpenAI

## 📋 How to Contribute

### 1. Join the Discussion
- **GitHub Discussions**: Participate in design discussions and proposals
- **Working Groups**: Join our technical working groups (see below)
- **Community Calls**: Attend our bi-weekly community calls (Thursdays, 10am PT)

### 2. Types of Contributions

#### 🔧 Technical Contributions

**Immediate Needs**:
- **Working examples** using the `.agents/` structure
- **Framework integrations** that actually work
- **Performance benchmarks** with real data
- **Protocol bridges** that pass round-trip tests
- **Developer tools** that save time

**Code Quality Requirements**:
- Everything must work (no theoretical implementations)
- Tests required (80%+ coverage)
- Documentation required
- Examples required
- Performance metrics required

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

### 3. How to Start Contributing

1. **Read the ROADMAP.md** - Understand our priorities
2. **Check existing issues** - Find something you can help with
3. **Join discussions** - Share your ideas and feedback
4. **Submit PRs** - Start with small, focused changes
5. **Test everything** - Make sure it actually works

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

## 🏆 Recognition

### Contributors
All contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Project documentation

### Contribution Levels
- **Contributor**: 1+ merged PRs
- **Active Contributor**: 5+ merged PRs
- **Core Contributor**: 10+ merged PRs
- **Maintainer**: Ongoing commitment to project

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