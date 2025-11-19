# Changelog - OSSA v0.2.5-dev

All notable changes to the OSSA specification are documented in this file.

## [0.2.5-dev] - 2024-11-18

### Status: DEVELOPMENT/UNSTABLE

This is a development version. The API may change without notice.

### Added

#### New Resource Type: AgentGraph
- Introduced `AgentGraph` kind for multi-agent composition
- Support for defining complex agent workflows and orchestration patterns
- Shared state management across agent graphs

#### AgentGraphSpec Properties
- `agents`: Array of agent references with role assignments
- `edges`: Graph connections with conditions and priorities
- `process`: Execution pattern (sequential, parallel, hierarchical, conditional, loop)
- `entry_point`: Starting agent for graph execution
- `exit_points`: Agents that can terminate execution
- `state`: Shared state configuration with persistence options

#### Execution Patterns
- **sequential**: Agents execute one after another
- **parallel**: Agents execute simultaneously
- **hierarchical**: Manager delegates to workers (CrewAI style)
- **conditional**: Branching based on conditions
- **loop**: Iterative execution until termination

#### New Framework Extensions
- `google_adk`: Google Agent Development Kit integration
  - Support for SequentialAgent, ParallelAgent, LoopAgent
  - Gemini model configuration
  - Session service options
- `microsoft_af`: Microsoft AutoGen 0.4+ / Magentic-One
  - Team types: round_robin, selector, swarm, magentic_one
  - Agent types: assistant, orchestrator, web_surfer, coder
  - Termination conditions
- `metagpt`: MetaGPT software development teams
  - Role types: product_manager, architect, engineer, qa_engineer
  - SOP (Standard Operating Procedure) configuration
  - Action definitions

#### Enhanced Existing Extensions
- `crewai`: Added `crew` property for Process configuration
  - Process type (sequential/hierarchical)
  - Manager LLM configuration
  - Verbose mode

### Changed

#### Schema Updates
- `kind` enum now includes: `Agent`, `AgentGraph`
- `spec` uses `oneOf` to support AgentSpec or AgentGraphSpec
- `apiVersion` pattern updated to support v0.2.5-dev

#### API Version Pattern
```regex
^ossa/v(0\.2\.[2-5]|1)(\.[0-9]+)?(-[a-zA-Z0-9]+)?$
```

### Framework Mapping Examples

#### CrewAI Crews
```yaml
apiVersion: ossa/v0.2.5-dev
kind: AgentGraph
metadata:
  name: research-crew
spec:
  process: hierarchical
  agents:
    - ref: researcher
      role: worker
    - ref: writer
      role: worker
extensions:
  crewai:
    enabled: true
    crew:
      process: hierarchical
      manager_llm: gpt-4
```

#### Google ADK Sequential
```yaml
apiVersion: ossa/v0.2.5-dev
kind: AgentGraph
metadata:
  name: processing-pipeline
spec:
  process: sequential
  agents:
    - ref: intake
    - ref: process
    - ref: output
extensions:
  google_adk:
    enabled: true
    agent_type: sequential_agent
```

#### Microsoft AutoGen Team
```yaml
apiVersion: ossa/v0.2.5-dev
kind: AgentGraph
metadata:
  name: dev-team
spec:
  process: conditional
  agents:
    - ref: orchestrator
    - ref: coder
    - ref: web-surfer
extensions:
  microsoft_af:
    enabled: true
    framework: magentic_one
    team_type: magentic_one
```

#### MetaGPT SOP
```yaml
apiVersion: ossa/v0.2.5-dev
kind: AgentGraph
metadata:
  name: software-team
spec:
  process: hierarchical
  agents:
    - ref: product-manager
    - ref: architect
    - ref: engineer
extensions:
  metagpt:
    enabled: true
    sop:
      name: software_development
      phases:
        - requirements
        - design
        - implementation
        - testing
```

### Migration Notes

See `migrations/v0.2.4-to-v0.2.5.md` for detailed migration guidance.

#### Quick Migration
1. Update `apiVersion` to `ossa/v0.2.5-dev`
2. Existing Agent manifests remain unchanged
3. New AgentGraph manifests use `kind: AgentGraph`

### Known Limitations
- Graph validation is not fully implemented
- Some framework mappings may require manual configuration
- State persistence options are runtime-dependent

### Roadmap
- v0.2.5: Stabilize AgentGraph API based on feedback
- v0.2.6: Add resource dependencies and imports
- v0.3.0: Multi-file manifest support
- v1.0.0: Stable release

### Feedback
Report issues and feedback at:
https://gitlab.bluefly.io/llm/ossa/-/issues
