# Agent Definition and Structure

This document outlines the canonical definition of an Agent within the OSSA (Open Standard for Software Agents) framework, detailing its core qualities, attributes, and standard project structure, including the purpose and usage of the `.agents` and `.agents-workspace` directories.

## What is an Agent?

An Agent is a sovereign, autonomous software entity designed to perform specific tasks or achieve defined goals. It operates independently, making decisions based on its programming, available tools, and environmental context. Agents are the fundamental building blocks of OSSA-compliant systems, enabling complex workflows and intelligent automation.

### Core Qualities and Attributes

Agents are characterized by the following core qualities and attributes:

-   **Identity**: Each agent has a unique identity, defined by its manifest. This includes its name, version, description, and role.
-   **Autonomy**: Agents can operate without direct human intervention, making decisions and taking actions based on their goals and environment.
-   **Capability**: Agents possess specific skills and abilities, often exposed as tools or functions, that allow them to interact with the world or other agents.
-   **Observability**: Agents should provide mechanisms for monitoring their state, performance, and actions, facilitating debugging and system management.
-   **Controllability**: While autonomous, agents should be controllable, allowing for configuration, stopping, and interaction through defined interfaces.
-   **API-First Contract**: Agents interact through well-defined APIs and message schemas, ensuring interoperability and adherence to OSSA standards.

## Project Structure for Agents

A standard OSSA Agent project follows a conventional structure to promote consistency and maintainability.

```
agent-project/
├── .agents/              # Per-agent runtime state and manifest home (see below)
├── .agents-workspace/    # Project-level agent registry and optional transient data (see agents-workspace-registry.md)
├── .vscode/              # VS Code specific settings (optional)
├── docs/                 # Project documentation
│   ├── agent-definition.md # This document
│   ├── ...               # Other guides and references
├── examples/             # Example usage of the agent
├── openapi/              # OpenAPI specifications for the agent's API (if applicable)
├── packages/             # Sub-packages or modules (for monorepos)
│   └── ...
├── src/                  # Source code for the agent logic
│   ├── adapters/         # Platform-specific adapters
│   ├── cli/              # Command-line interface implementation
│   ├── services/         # Core services (validation, generation, etc.)
│   ├── types/            # TypeScript types and interfaces
│   └── ...               # Other source files
├── spec/                 # OSSA Manifest and Schema definitions
│   └── vX.Y.Z/           # Versioned schemas
│       └── ...
├── tests/                # Unit, integration, and e2e tests
├── .env                  # Environment variables (local development)
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore patterns
├── AGENTS.md             # Project-specific agent details (high-level)
├── changelog.md          # Project history
├── LICENSE               # Project license
├── Makefile              # Build and task automation (optional)
├── package.json          # Project dependencies and scripts
├── README.md             # Project overview
└── tsconfig.json         # TypeScript configuration
```

### `.agents/` Directory

The `.agents/` directory is the **per-agent runtime and manifest home**. Each subdirectory `.agents/{agent-name}/` holds one agent's manifest (`manifest.ossa.yaml`), prompts, tools, config, and source tree (see [Agent Folder Structure](../architecture/agent-folder-structure.md)). It also holds runtime-only data that is typically *not* version-controlled:

-   **Runtime State**: Cached data, session information, local databases.
-   **Local Configuration**: Agent-specific overrides for the local environment.
-   **Secrets (Encrypted)**: API keys or credentials; encrypt at rest and avoid plaintext.
-   **Temporary Data**: Ephemeral files that may be recreated.

**Usage**:
-   Manifest and agent code under `.agents/{agent-name}/` may be version-controlled; runtime state and secrets should not be.
-   List runtime-only paths (e.g. `.agents/*/.state/` or `.agents/*/cache/`) in `.gitignore`.
-   Agents read and write this directory; do not rely on full persistence across restarts unless designed for it.

### `.agents-workspace/` Directory

The `.agents-workspace/` directory serves two roles:

1.  **Project-level agent registry (primary)**  
    It is the **decentralized agent registry** for the project: an index of agents defined in this repo (under `.agents/`) and of remote registries (company, department, team) that the project pulls from via MCP and auth. Runtimes discover agents through this registry and communicate with them via A2A. See [Agents Workspace and Registry](agents-workspace-registry.md) for structure (`registry.yaml`, `sources/`, scopes, MCP).

2.  **Optional transient workspace data**  
    It may also hold temporary or shared data not part of core code: downloaded models/assets, build artifacts, external tool mounts, ephemeral logs. That data is typically *not* version-controlled.

**Usage**:
-   Registry index and source config (`registry.yaml`, `sources/*.yaml`) may be version-controlled.
-   Cache, tokens, and transient data should be in `.gitignore`.
-   Discovery uses the registry; agent-to-agent communication uses A2A.

## API-First and OpenAPI Strict Validation

All agent interfaces, capabilities, and messaging protocols MUST be defined using OpenAPI specifications or equivalent schema definitions (e.g., JSON Schema, Zod schemas). This API-First approach ensures:

-   **Clear Contracts**: Precise definition of agent inputs, outputs, and communication protocols.
-   **Interoperability**: Enables seamless integration between different agents and systems.
-   **Strict Validation**: Allows for automated validation of requests and responses against the defined schema, catching errors early and enforcing consistency.

The `spec/` directory contains the versioned OSSA schemas. Tools like `ajv-cli` are used to enforce strict validation against these schemas during development and CI. New agent capabilities or messaging interfaces should always be accompanied by their schema definitions.
