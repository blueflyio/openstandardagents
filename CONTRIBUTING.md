# Contributing to OSSA

Thank you for your interest in contributing to **OSSA (Open Standard for Scalable AI Agents)**!

## 📋 Table of Contents

- [Repository Structure](#repository-structure)
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Release Process](#release-process)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## 🏗️ Repository Structure

OSSA uses a **dual-repository workflow**:

| Repository | Purpose | Access |
|------------|---------|--------|
| [GitLab](https://gitlab.com/blueflyio/openstandardagents) | Primary development, CI/CD, releases | Private (core team) |
| [GitHub](https://github.com/blueflyio/openstandardagents) | Public mirror, community contributions | Public |

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     Community Contribution Flow                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   GitHub (Public)              GitLab (Private)                 │
│   ┌─────────────┐              ┌─────────────┐                 │
│   │   Issue     │──── sync ───▶│   Issue     │                 │
│   │   or PR     │              │   or MR     │                 │
│   └─────────────┘              └──────┬──────┘                 │
│                                       │                         │
│                                       ▼                         │
│                                ┌─────────────┐                 │
│                                │   CI/CD     │                 │
│                                │   Tests     │                 │
│                                └──────┬──────┘                 │
│                                       │                         │
│                                       ▼                         │
│   ┌─────────────┐              ┌─────────────┐                 │
│   │   Mirror    │◀── push ────│   Merge     │                 │
│   │   Updated   │              │   to main   │                 │
│   └─────────────┘              └─────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Where to Contribute

| Contribution Type | Where | Notes |
|-------------------|-------|-------|
| Bug reports | GitHub Issues | Auto-synced to GitLab |
| Feature requests | GitHub Issues | Auto-synced to GitLab |
| Code changes | GitHub PR | Reviewed here, merged on GitLab |
| Documentation | GitHub PR | Same as code |
| Security issues | Email only | ops@openstandardagents.org |

### Why Dual Repositories?

1. **Privacy**: Internal development, CI/CD secrets, and infrastructure stay private
2. **Public Access**: Open specification accessible to the community
3. **Best of Both**: GitLab's superior CI/CD + GitHub's community reach
4. **Agent-Powered**: OSSA agents automate sync between platforms

## 🤝 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/blueflyio/openstandardagents.git
cd openstandardagents

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Validate OSSA examples
npm run validate
```

## 🔄 Development Workflow

We use **GitHub Flow**:

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following our commit convention

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Push and create a Pull Request**

### Branch Naming Convention

- `feat/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation changes
- `refactor/*` - Code refactoring
- `test/*` - Test additions/modifications
- `chore/*` - Build process or auxiliary tool changes

## 📝 Commit Convention

We use **Conventional Commits** specification. This is **CRITICAL** for automated semantic versioning.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature (triggers MINOR version bump)
- `fix`: Bug fix (triggers PATCH version bump)
- `docs`: Documentation only changes
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement (triggers PATCH version bump)
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools
- `ci`: Changes to CI configuration files

### Breaking Changes

Add `BREAKING CHANGE:` in the commit footer or `!` after the type:

```bash
# MAJOR version bump
git commit -m "feat!: redesign agent manifest schema

BREAKING CHANGE: The manifest schema now requires apiVersion field"
```

### Examples

```bash
# Feature (MINOR version bump: 0.2.3 → 0.3.0)
git commit -m "feat(validation): add CrewAI extension validator"

# Bug fix (PATCH version bump: 0.2.3 → 0.2.4)
git commit -m "fix(schema): correct required fields in LangChain extension"

# Breaking change (MAJOR version bump: 0.2.3 → 1.0.0)
git commit -m "feat!: migrate to apiVersion from ossaVersion

BREAKING CHANGE: All manifests must now use apiVersion instead of ossaVersion"

# Documentation (no version bump)
git commit -m "docs: update getting started guide"
```

## 🎯 Release Process

**Releases are fully automated using semantic-release.**

### How It Works

1. **Merge to `main`** with conventional commits
2. **GitHub Actions automatically**:
   - Analyzes commit messages
   - Determines next version (major.minor.patch)
   - Generates CHANGELOG.md
   - Creates GitHub Release
   - Publishes to npm
   - Deploys website to GitHub Pages
   - Comments on related PRs/issues

### Version Determination

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | PATCH | 0.2.3 → 0.2.4 |
| `feat:` | MINOR | 0.2.3 → 0.3.0 |
| `feat!:` or `BREAKING CHANGE:` | MAJOR | 0.2.3 → 1.0.0 |
| `docs:`, `chore:`, `test:` | No release | - |

### Release Branches

- **`main`**: Production releases (latest tag on npm)
- **`develop`**: Beta releases (beta tag on npm)

## 🔍 Pull Request Process

1. **Update tests** for any code changes
2. **Update documentation** as needed
3. **Ensure CI passes**:
   - All tests pass
   - Linting passes
   - Build succeeds
   - Security audit passes
4. **Request review** from maintainers
5. **Address feedback**
6. **Squash commits** for feature branches (recommended)
7. **Merge** using "Squash and Merge" (default for feature branches)

### Squash Merge Workflow

**This project encourages squash merging for feature branches** to maintain a clean, readable git history.

#### When to Squash

- **Feature branches** (`feat/*`, `fix/*`, `refactor/*`): Always squash
- **Documentation branches** (`docs/*`): Squash if multiple commits
- **Major releases**: May preserve commit history (case-by-case)

#### Best Practices

1. **Enable squash** when creating the merge request (encouraged by default)
2. **Write a clear squash commit message** following conventional commits format
3. **Include issue references** in the squash commit message (e.g., `Closes #123`)
4. **Summarize all changes** in the squash commit body if multiple features were added

#### Squash Commit Message Format

When squashing, the final commit message should be:

```
<type>(<scope>): <summary of all changes>

- Detailed change 1
- Detailed change 2
- Detailed change 3

Closes #123
```

**Example:**

```
feat(validation): add multi-framework extension support

- Add CrewAI extension validator
- Add LangGraph extension validator
- Update schema documentation with examples
- Add integration tests for all validators

Closes #123, Closes #124
```

### PR Title Convention

PR titles should follow the conventional commit format (this becomes the squash commit title):

```
feat: add LangGraph extension support
fix: resolve schema validation edge case
docs: improve OpenAPI extension examples
```

## ✅ Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- schema.repository.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Test Requirements

- All new features **must** have tests
- All bug fixes **must** have regression tests
- Maintain **>80% code coverage**

## 📚 Documentation

### Public Documentation
Public-facing documentation is managed in the [GitLab Wiki](https://gitlab.com/blueflyio/openstandardagents/-/wikis/home) and automatically synced to [openstandardagents.org](https://openstandardagents.org).

**Public docs include:**
- OSSA specification and standard
- Usage guides and tutorials
- API reference and schema documentation
- Migration guides
- Community contribution guidelines

### Internal Documentation
Internal project documentation is located in `.gitlab/docs/`:
- `/development` - Development workflows and coding standards
  - **VERSIONING.md** - Automated version management (CRITICAL: never manually update versions)
- `/releases` - Release management and versioning
- `/infrastructure` - CI/CD, GitLab agents, Kubernetes setup
- `/processes` - Project governance and internal processes

### Code Documentation

- Use **JSDoc** for all public APIs
- Include **examples** in JSDoc comments
- Document **parameters** and **return types**

## 🔐 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Email: ops@openstandardagents.org

## 📊 Code Style

We use:
- **ESLint** for linting
- **Prettier** for formatting (auto-format on commit)
- **TypeScript** for type safety

```bash
# Lint code
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## 🎓 Resources

- **Conventional Commits**: https://www.conventionalcommits.org/
- **Semantic Versioning**: https://semver.org/
- **OSSA Specification**: https://openstandardagents.org/docs
- **GitHub Actions**: https://github.com/blueflyio/openstandardagents/actions

---

**Questions?** Open an [Issue](https://github.com/blueflyio/openstandardagents/issues).
