# OSSA Roadmap

> **Generated from OSSA Ecosystem Strategy**

## Project Overview

Canonical schema, test suite, and validator for all agent definitions

**Layer:** Schema & Metadata

### Core Features

- OpenAPI-First agent schema definition
- Agent manifest versioning
- Cryptographic signature support
- Helm chart templates
- Validation tools and test suite
- Agent registry specifications

## Roadmap Items

### High Priority

#### Extend OSSA Schema with Enhanced Attributes

Add agent_roles, deployment_modes, mcp_policies, and llm_model_profile attributes

- **Category:** Schema Evolution

#### Implement MCP Integration

Support scoped Multi-Cloud Policy Profiles per agent class

- **Category:** Schema Evolution
- **Dependencies:** Extend OSSA Schema

#### Build Agent Registry v2

Manifest versioning, cryptographic signatures, artifact URL resolution

- **Category:** Schema Evolution

#### Create OSSA Helm Chart Templates

Public Helm repo with standardized templates

- **Category:** Adoption

#### Stand Up OSSA Registry

Docker Hub-like registry for sharing agents & blueprints

- **Category:** Adoption
- **Dependencies:** Build Agent Registry v2

### Medium Priority

#### Launch OSSA Certification Program

3rd-party provider certification and compliance validation

- **Category:** Adoption
- **Dependencies:** Stand Up OSSA Registry

## Integration Points

This project integrates with the broader OSSA ecosystem:

- **Layer:** Schema & Metadata
- **Direct Dependencies:** None (foundation layer)

## Next Steps

1. Review roadmap items with stakeholders
2. Create GitLab issues for high-priority items
3. Establish milestones and sprint planning
4. Begin implementation following OSSA standards
