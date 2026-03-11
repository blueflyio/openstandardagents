# OSSA Integrations

OSSA is designed to be highly interoperable, providing seamless integration with various platforms, frameworks, and tools.

## Supported Integrations

### Platforms
- **[GitLab](./gitlab/README.md)** - GitLab CI/CD, Duo, and Ultimate Observability.
- **[Drupal](./drupal/README.md)** - Drupal module and AI agent integration.
- **[KAgent](./kagent/README.md)** - Kubernetes-native AI agent orchestration.

### Frameworks
- **[LangChain](./langchain/README.md)** - Export OSSA agents to LangChain format.
- **[CrewAI](./crewai/README.md)** - Integrate OSSA agents into CrewAI teams.
- **[Temporal](./temporal/README.md)** - Durable execution and state management.

## Discovery and Federation (DUADP)

All integrated agents can leverage **[DUADP](http://duadp.org/)** for universal discovery. This allows agents deployed on different platforms (e.g., one on GitLab, another on Drupal) to find and interact with each other using a common discovery protocol.

**OSSA defines the agent. DUADP discovers it.**

## Community Integrations

Check out the [OSSA Marketplace](https://marketplace.openstandardagents.org/) for community-contributed integrations and adapters.
