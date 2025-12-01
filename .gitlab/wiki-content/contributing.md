<!--
OSSA Contributing Guide
Purpose: Guide contributors to the project
Audience: Developers wanting to contribute
Educational Focus: How to contribute effectively
-->

# Contributing to OSSA

## Welcome!

OSSA is an open standard. We welcome contributions from everyone.

## Ways to Contribute

### 1. Specification Improvements
Propose changes to the OSSA specification.

**Process:**
1. Open an issue describing the problem
2. Discuss with community
3. Submit MR with spec changes
4. Update documentation

### 2. Tooling Enhancements
Improve CLI tools and libraries.

**Areas:**
- Validation improvements
- New generators
- Better error messages
- Performance optimizations

### 3. Documentation
Improve guides and examples.

**Needs:**
- More tutorials
- Better examples
- Translation
- Video content

### 4. Ecosystem Tools
Build tools that use OSSA.

**Ideas:**
- IDE extensions
- Web playground
- Registry service
- Framework integrations

## Development Setup

```bash
# Clone repository
git clone https://gitlab.com/blueflyio/openstandardagents.git
cd openstandardagents

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Contribution Workflow

### 1. Create Issue
Open an issue describing your contribution.

### 2. Create Branch
```bash
git checkout -b feature/my-contribution
```

### 3. Make Changes
Follow coding standards:
- TypeScript strict mode
- ESLint + Prettier
- 80% test coverage
- Conventional commits

### 4. Test
```bash
npm test
npm run lint
npm run typecheck
```

### 5. Submit MR
- Clear title and description
- Link to issue
- Include tests
- Update documentation

## Coding Standards

- **TypeScript**: Strict mode, explicit types
- **Tests**: Jest, 80% coverage minimum
- **Commits**: Conventional commits format
- **Documentation**: JSDoc for public APIs

## Review Process

1. Automated checks (CI/CD)
2. Code review by maintainers
3. Community feedback
4. Approval and merge

## Community

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Discussions**: [GitLab Discussions](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Email**: team@bluefly.io

## License

Apache 2.0 - See [LICENSE](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/LICENSE)

---

**Thank you for contributing to OSSA!**
