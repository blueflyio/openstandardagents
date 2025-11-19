# Pre-Release Specifications

> **Warning**: These specifications are in development and may change before stable release. Do not use in production.

## Development Versions

OSSA follows semantic versioning. Development specs are marked with `-dev` suffix to indicate they are not yet stable.

### v0.2.4-dev - Transport & Security

**Status**: Development
**Target Release**: February 2025
**Milestone**: [v0.2.4 - Transport & Security](https://github.com/blueflyio/openstandardagents/milestones/12)

#### New Features

1. **Transport Metadata for Capabilities**
   - Protocol support: `http`, `grpc`, `a2a`, `mcp`, `websocket`, `custom`
   - Streaming modes: `none`, `request`, `response`, `bidirectional`
   - Binding paths for endpoints

2. **State/Memory Specification**
   - Mode: `stateless`, `session`, `long_running`
   - Storage types: `memory`, `vector-db`, `kv`, `rdbms`, `custom`
   - Retention configuration

3. **Security Scopes and Compliance Tags**
   - OAuth2-style scopes per capability
   - Compliance tags: `pii`, `hipaa`, `gdpr`, `fedramp`, `soc2`

4. **Capability Versioning**
   - Version field (major.minor)
   - Deprecation flags and messages

5. **Google ADK Extension**
   - A2A protocol support
   - Agent hierarchies
   - MCP integration
   - Streaming modalities

#### Framework Alignment

- Google Agent Development Kit (ADK)
- OpenAI Agents SDK
- Microsoft Agent Framework

---

### v0.2.5-dev - Multi-Agent Composition

**Status**: Development
**Target Release**: March 2025
**Milestone**: [v0.2.5 - Multi-Agent Composition](https://github.com/blueflyio/openstandardagents/milestones/13)

#### New Features

1. **AgentGraph Resource Type**
   ```yaml
   apiVersion: ossa/v0.2.5
   kind: AgentGraph  # New!
   metadata:
     name: customer-support-cluster
   spec:
     agents:
       - ref: triage-agent
         role: entry
       - ref: resolver-agent
         role: worker
     edges:
       - from: triage-agent
         to: resolver-agent
         condition: standard-issue
     process: sequential
   ```

2. **Process Patterns**
   - `sequential`: Agents execute one after another
   - `parallel`: Agents execute simultaneously
   - `hierarchical`: Manager delegates to workers
   - `conditional`: Branching based on conditions
   - `loop`: Iterative execution

3. **Edge Routing**
   - From/to agent references
   - Condition expressions
   - Priority ordering

4. **Shared State**
   - Schema definition
   - Persistence options
   - Checkpointing and recovery

#### Framework Alignment

- CrewAI (crews, manager agents)
- MetaGPT (SOPs, role pipelines)
- Microsoft AF (workflows)
- Google ADK (agent graphs)
- LangGraph (state machines)

---

## Using Development Specs

### Installation

Development specs are available in the repository:

```bash
# Clone the repository
git clone https://github.com/blueflyio/openstandardagents.git
cd openstandardagents

# View development specs
ls spec/v0.2.4-dev/
ls spec/v0.2.5-dev/
```

### Validation

```bash
# Install CLI (if not already installed)
npm install -g @bluefly/open-standards-scalable-agents

# Validate against development schema
ossa validate your-agent.yaml --version 0.2.4-dev
```

### Examples

Development examples are in the spec directories:

- `spec/v0.2.5-dev/examples/customer-support-graph.ossa.yaml` - Sequential process
- `spec/v0.2.5-dev/examples/research-team.ossa.yaml` - Hierarchical process
- `spec/v0.2.5-dev/examples/parallel-processors.ossa.yaml` - Parallel process

---

## Providing Feedback

We welcome feedback on development specifications:

1. **GitLab Issues**: [Create an issue](https://github.com/blueflyio/openstandardagents/issues/new)
2. **Discussions**: Comment on milestone issues
3. **Pull Requests**: Submit improvements

### v0.2.4 Issues
- [#220 - Transport metadata](https://github.com/blueflyio/openstandardagents/issues/220)
- [#221 - State/memory block](https://github.com/blueflyio/openstandardagents/issues/221)
- [#222 - Security scopes](https://github.com/blueflyio/openstandardagents/issues/222)
- [#223 - Capability versioning](https://github.com/blueflyio/openstandardagents/issues/223)
- [#224 - Google ADK extension](https://github.com/blueflyio/openstandardagents/issues/224)
- [#225 - MS AF adapter](https://github.com/blueflyio/openstandardagents/issues/225)

### v0.2.5 Issues
- [#211-212 - AgentGraph resource](https://github.com/blueflyio/openstandardagents/issues/211)
- [#213 - Process patterns](https://github.com/blueflyio/openstandardagents/issues/213)
- [#214 - Edge routing](https://github.com/blueflyio/openstandardagents/issues/214)
- [#215 - Shared state](https://github.com/blueflyio/openstandardagents/issues/215)
- [#216-218 - Adapter examples](https://github.com/blueflyio/openstandardagents/issues/216)
- [#219 - Validation rules](https://github.com/blueflyio/openstandardagents/issues/219)

---

## Roadmap

| Version | Focus | Status | Target |
|---------|-------|--------|--------|
| v0.2.3 | Documentation & Examples | **Stable** | Released |
| v0.2.4 | Transport & Security | Development | Feb 2025 |
| v0.2.5 | Multi-Agent Composition | Development | Mar 2025 |
| v0.3.0 | Gamma Release | Planned | Apr 2025 |
| v1.0.0 | Genesis Release | Planned | TBD |

See [milestones](https://github.com/blueflyio/openstandardagents/milestones) for full details.
