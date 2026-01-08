# Contributing to OSSA

Thank you for your interest in contributing to OSSA! This document provides guidelines and instructions for contributing to the Open Standard for Scalable AI Agents.

## 🌟 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm, pnpm, or yarn
- Git

### Setup

```bash
# Fork and clone the repository
git clone https://gitlab.com/blueflyio/ossa/openstandardagents.git
cd openstandardagents

# Install dependencies
npm install

# Run tests to verify setup
npm test

# Validate examples
npm run validate:all
```

## 📝 How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [GitLab Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Relevant logs or error messages

### Suggesting Features

1. Check existing issues and discussions
2. Create an issue describing:
   - The feature and its use case
   - Why it would be valuable for the community
   - Potential implementation approach (if you have ideas)

### Submitting Changes

1. **Create a branch** from `development`:
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, well-documented code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Run validations**:
   ```bash
   npm run validate:all  # Validate all manifests
   npm test              # Run tests
   npm run lint          # Check code style
   ```

4. **Commit your changes**:
   - Follow [Conventional Commits](https://www.conventionalcommits.org/)
   - Use clear, descriptive commit messages
   - Example: `feat: add support for custom triggers`

5. **Push and create Merge Request**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Merge Request targeting `development` branch.

## 📋 Contribution Guidelines

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(cli): add validate command
fix(schema): correct trigger validation
docs: update quickstart guide
```

### Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Use ESLint and Prettier (configured in project)
- Write self-documenting code with clear variable names

### Testing

- Write tests for new features
- Ensure all tests pass before submitting
- Aim for high test coverage
- Include both unit and integration tests

### Documentation

- Update README.md if adding new features
- Add JSDoc comments for public APIs
- Update examples if behavior changes
- Keep migration guides up to date

## 🏗️ Project Structure

### Repository Boundaries

**This repository (`openstandardagents`) contains:**
- ✅ OSSA specification (schemas, OpenAPI, documentation)
- ✅ CLI tooling (`ossa` commands)
- ✅ Reference examples (`examples/` directory)
- ✅ SDKs (TypeScript, Python)
- ✅ Documentation and guides

**This repository does NOT contain:**
- ❌ Production agent implementations (use `platform-agents` repo)
- ❌ Bot scripts or production CI jobs
- ❌ Website code (use `openstandardagents.org` repo)

### Directory Structure

```
openstandardagents/
├── spec/              # OSSA specification schemas
├── src/              # TypeScript source code
│   ├── cli/          # CLI commands
│   ├── services/     # Core services
│   ├── tools/        # Development tools
│   └── sdks/         # SDK implementations
├── examples/         # Reference examples
├── openapi/          # OpenAPI specifications
├── tests/            # Test suite
└── docs/             # Documentation
```

## 🔍 Review Process

1. **Automated Checks**: CI/CD will run:
   - Linting and formatting checks
   - Test suite
   - Manifest validation
   - Type checking

2. **Code Review**: Maintainers will review:
   - Code quality and style
   - Test coverage
   - Documentation updates
   - Alignment with project goals

3. **Feedback**: We'll provide constructive feedback and work with you to improve your contribution.

## 📚 Resources

- **[OSSA Specification](https://openstandardagents.org)** - Official specification
- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started quickly
- **[API Reference](docs/api-reference/)** - Complete API docs
- **[Examples](examples/)** - Reference implementations

## ❓ Questions?

- **General questions**: [GitLab Discussions](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Technical questions**: Create an issue with the `question` label
- **Security issues**: See [SECURITY.md](SECURITY.md)

## 🙏 Thank You!

Your contributions make OSSA better for everyone. We appreciate your time and effort!

---

**Remember**: OSSA is for the community. Keep contributions clear, well-tested, and well-documented.
