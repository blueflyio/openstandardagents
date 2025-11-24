---
title: "OSSA COMPLIANT BADGE"
---

# OSSA Compliant Badge

Display the **OSSA Compliant** badge in your project to show that your AI agent follows the Open Standard for AI Agents (OSSA) specification.

---

## Badge Options

### Markdown

```markdown
[![OSSA Compliant](https://img.shields.io/badge/OSSA-Compliant-00B8D4.svg)](https://github.com/blueflyio/openstandardagents)
```

**Result**:
[![OSSA Compliant](https://img.shields.io/badge/OSSA-Compliant-00B8D4.svg)](https://github.com/blueflyio/openstandardagents)

### HTML

```html
<a href="https://github.com/blueflyio/openstandardagents">
  <img src="https://img.shields.io/badge/OSSA-Compliant-00B8D4.svg" alt="OSSA Compliant">
</a>
```

### reStructuredText

```rst
.. image:: https://img.shields.io/badge/OSSA-Compliant-00B8D4.svg
   :target: https://github.com/blueflyio/openstandardagents
   :alt: OSSA Compliant
```

---

## Compliance Requirements

To display the OSSA Compliant badge, your project must:

### Required

1. **Valid OSSA Manifest** - Your agent must have a valid `.ossa.yaml` manifest
2. **Schema Validation** - Manifest must pass `ossa validate` without errors
3. **Semantic Versioning** - Agent version follows semver (e.g., `1.0.0`)
4. **Required Fields** - All required OSSA fields must be present

### Recommended

1. **Examples** - Provide example manifests showing usage
2. **Documentation** - Document your agent's capabilities and usage
3. **Testing** - Include tests that validate your OSSA manifest
4. **CI/CD** - Automate OSSA validation in your pipeline

---

## Verification

### Manual Verification

```bash
# Install OSSA CLI
npm install -g @bluefly/openstandardagents

# Validate your manifest
ossa validate path/to/your-agent.ossa.yaml
```

### Automated Verification (CI/CD)

#### GitLab CI

```yaml
ossa-validation:
  stage: test
  image: node:20-alpine
  script:
    - npm install -g @bluefly/openstandardagents
    - ossa validate agents/*.ossa.yaml
```

#### GitHub Actions

```yaml
name: OSSA Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g @bluefly/openstandardagents
      - run: ossa validate agents/*.ossa.yaml
```

---

## Compliance Levels

### Level 1: Basic Compliance

- Valid OSSA manifest
- Required fields present
- Passes schema validation

### Level 2: Standard Compliance

- Level 1 requirements
- Best practices followed (descriptions, examples)
- Semantic versioning
- At least one capability defined

### Level 3: Advanced Compliance

- Level 2 requirements
- Platform extensions configured
- Observability enabled
- Resource constraints defined
- Security considerations documented

---

## OSSA Certified Projects

Projects that have achieved OSSA compliance:

| Project | Level | Version | Link |
|---------|-------|---------|------|
| Agent Buildkit | Advanced | v0.2.3 | [GitHub](https://github.com/blueflyio/openstandardagents) |
| Agent Studio | Advanced | v0.2.3 | [GitHub](https://github.com/blueflyio/openstandardagents) |
| KAgent | Advanced | v0.2.3 | [GitHub](https://github.com/blueflyio/openstandardagents) |

**Add your project**: Submit a merge request to update this table!

---

## Example Implementation

### Minimal OSSA Manifest

```yaml
apiVersion: ossa/v0.2.3
kind: Agent

metadata:
  name: my-agent
  version: 1.0.0
  description: A simple OSSA-compliant agent

spec:
  role: |
    You are a helpful assistant that processes data.

  llm:
    provider: openai
    model: gpt-4

  tools:
    - type: function
      name: process_data
      description: Process incoming data
```

### With Platform Extensions

```yaml
apiVersion: ossa/v0.2.3
kind: Agent

metadata:
  name: my-agent
  version: 1.0.0
  description: An advanced OSSA-compliant agent
  labels:
    environment: production
    team: ai-engineering

spec:
  role: |
    You are a production-ready agent with observability.

  llm:
    provider: openai
    model: gpt-4
    temperature: 0.7

  tools:
    - type: function
      name: analyze_data
      description: Analyze data and generate insights

  observability:
    tracing:
      enabled: true
      exporter: otlp
    metrics:
      enabled: true
      exporter: prometheus

extensions:
  buildkit:
    deployment:
      replicas: 3
      autoscaling: true
```

---

## FAQ

### Q: Can I use the badge if my agent partially implements OSSA?

**A**: The badge should only be used if your agent has a **valid, complete OSSA manifest** that passes validation. Partial implementations should work toward full compliance before displaying the badge.

### Q: Do I need to register my project?

**A**: No registration required! OSSA is an open standard. Simply ensure your manifest validates and add the badge.

### Q: What if my agent uses a custom runtime?

**A**: OSSA supports custom runtimes! Use platform extensions to define your custom runtime while maintaining OSSA compliance.

### Q: Can I modify the badge design?

**A**: The official badge design helps maintain consistency across the ecosystem. However, you can customize colors for your specific needs while keeping the "OSSA Compliant" text visible.

---

## Resources

- **OSSA Specification**: [spec/v0.2.3/](Specification/v0.2.3/)
- **Examples**: [examples/](Examples/)
- **CLI Documentation**: [docs/cli/](./cli/)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)
- **GitHub Repository**: https://github.com/blueflyio/openstandardagents

---

**Questions?** Open an issue on [GitHub](https://github.com/blueflyio/openstandardagents/issues)

**Want to contribute?** See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

*OSSA: The OpenAPI for AI Agents*
