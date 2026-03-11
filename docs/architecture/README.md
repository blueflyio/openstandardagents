# OSSA Architecture

This directory contains documentation for the OSSA (Open Standard for Software Agents) system architecture.

## Overview

OSSA is designed as an extensible, vendor-neutral standard for AI agents. Its architecture is based on the following core components:

1.  **OSSA Manifests**: YAML definitions of agents, tasks, and workflows.
2.  **OSSA Runtimes**: Execution environments that interpret manifests and manage the agentic loop.
3.  **MCP (Model Context Protocol)**: Used for connecting agents to external data and tools.
4.  **A2A (Agent-to-Agent)**: The protocol for secure, inter-agent communication.
5.  **[DUADP](http://duadp.org/) (Decentralized Universal AI Discovery Protocol)**: The discovery layer.

## Discovery Layer: DUADP

The **[DUADP](http://duadp.org/)** protocol is central to the OSSA ecosystem. It provides the mechanism for agents to be discovered and federated across networks.

- **DNS for Agents**: DUADP resolves Global Agent IDs (GAIDs) to metadata and endpoints.
- **Node Network**: A decentralized network of nodes (e.g., `discover.duadp.org`) indexes OSSA manifests.
- **Federated Governance**: Governance policies can be attached to discovery records.

**OSSA defines the agent. DUADP discovers it.**

## Documentation

- [Agent Folder Structure](./agent-folder-structure.md) - Standard layout for OSSA agents.
- [Messenger Architecture](./messenger-architecture.md) - Secure messaging and inter-agent communication.
