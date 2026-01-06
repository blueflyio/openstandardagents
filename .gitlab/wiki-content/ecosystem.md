<!--
OSSA Ecosystem Page
Purpose: Showcase tools, integrations, and adopters of OSSA
Audience: Developers and organizations evaluating OSSA
Educational Focus: Demonstrate growing ecosystem and community
-->

# OSSA Ecosystem

## Official Tools

### OSSA CLI
Command-line tool for validation, generation, and migration.

```bash
npm install -g @bluefly/openstandardagents
```

**Features:**
- Validate agent definitions
- Generate TypeScript/Python types
- Migrate between versions
- Create agent templates

**Repository**: [GitLab](https://gitlab.com/blueflyio/openstandardagents)

### OSSA Validator
JSON Schema validator for OSSA specifications.

```typescript
import { ValidationService } from '@bluefly/openstandardagents/validation';

const validator = new ValidationService();
const result = await validator.validate(agentDefinition);
```

### OSSA Generator
Code generation from OSSA specs.

```bash
ossa generate types agent.json --output ./types
ossa generate docs agent.json --output ./docs
```

## Framework Integrations

### LangChain (Planned)
Integration with LangChain for OSSA-compliant agents.

### AutoGPT (Planned)
Support for OSSA agent definitions in AutoGPT.

### Custom Frameworks
Build your own integration using OSSA validation library.

## Community Tools

### OSSA Playground (Planned)
Web-based editor and validator for OSSA agents.

### OSSA Registry (Planned)
Public registry for sharing OSSA agent definitions.

### IDE Extensions (Planned)
- VS Code extension
- JetBrains plugin
- Vim/Neovim support

## Adopters

Organizations and projects using OSSA:

- **BlueFly.io** - Agent platform built on OSSA
- *Your organization here* - [Submit a PR](contributing.md)

## Contributing to the Ecosystem

### Build a Tool
- Validators for other languages
- Code generators
- Documentation tools
- Testing frameworks

### Create Integrations
- Framework adapters
- CI/CD plugins
- Monitoring tools
- Deployment utilities

### Share Agents
- Publish to registry (coming soon)
- Open source your agents
- Write tutorials

## Ecosystem Roadmap

### Q1 2025
- [ ] Python validation library
- [ ] VS Code extension
- [ ] Agent registry MVP

### Q2 2025
- [ ] LangChain integration
- [ ] Playground web app
- [ ] Documentation generator

### Q3 2025
- [ ] AutoGPT support
- [ ] Kubernetes operator
- [ ] Monitoring tools

## Get Involved

- **Contribute**: [Contributing Guide](contributing.md)
- **Discuss**: [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Build**: Create tools and integrations
- **Share**: Publish your agents

---

**Want to add your tool or project?** [Submit a merge request](contributing.md)
