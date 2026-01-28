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
├── .agents/              # Local agent runtime data and configuration
├── .agents-workspace/      # Temporary or shared workspace files
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
├── CHANGELOG.md          # Project history
├── LICENSE               # Project license
├── Makefile              # Build and task automation (optional)
├── package.json          # Project dependencies and scripts
├── README.md             # Project overview
└── tsconfig.json         # TypeScript configuration
```

### `.agents/` Directory

The `.agents/` directory is intended for local, agent-specific runtime data that should be managed by the agent itself or its local environment. It is typically *not* version-controlled and may contain:

-   **Runtime State**: Data relevant to the agent's current operational state (e.g., cached data, session information, local databases).
-   **Local Configuration**: Agent-specific configuration files that are not sensitive but are specific to the local runtime environment.
-   **Secrets (Encrypted)**: Sensitive information like API keys or credentials, which should be encrypted at rest and managed securely. Avoid storing plaintext secrets here.
-   **Temporary Data**: Data that is periodically cleaned up or recreated.

**Usage**:
Agents can read from and write to this directory, but it's crucial to ensure that:
-   This directory is listed in `.gitignore`.
-   Sensitive data is encrypted.
-   Agents do not rely on the persistence of all data within `.agents/` across restarts unless explicitly designed for it.

### `.agents-workspace/` Directory

The `.agents-workspace/` directory serves as a temporary or shared workspace for agent-related operations that might involve external tools, build artifacts, or data that is not part of the core agent code but is needed for its operation or development lifecycle. It is also typically *not* version-controlled.

Examples of data that might reside here:

-   **Downloaded Models/Assets**: Machine learning models, datasets, or other assets downloaded for agent use.
-   **Build Artifacts**: Intermediate files generated during the agent's build or compilation process (though `dist/` is more common for final build output).
-   **External Tool Mounts**: For containerized agents, this could be a mount point for shared volumes or data accessed by the agent and external processes.
-   **Ephemeral Logs**: Logs that are not critical for long-term storage but useful for immediate debugging during development.

**Usage**:
Similar to `.agents/`, this directory should be ignored by Git. It's useful for isolating transient data from the core codebase.

## API-First and OpenAPI Strict Validation

All agent interfaces, capabilities, and messaging protocols MUST be defined using OpenAPI specifications or equivalent schema definitions (e.g., JSON Schema, Zod schemas). This API-First approach ensures:

-   **Clear Contracts**: Precise definition of agent inputs, outputs, and communication protocols.
-   **Interoperability**: Enables seamless integration between different agents and systems.
-   **Strict Validation**: Allows for automated validation of requests and responses against the defined schema, catching errors early and enforcing consistency.

The `spec/` directory contains the versioned OSSA schemas. Tools like `ajv-cli` are used to enforce strict validation against these schemas during development and CI. New agent capabilities or messaging interfaces should always be accompanied by their schema definitions.
