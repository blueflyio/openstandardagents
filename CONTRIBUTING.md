# Contributing to OSSA

## Repository Boundaries (CRITICAL)

### openstandardagents = Spec + CLI + Examples ONLY

This repository contains:
- ✅ OSSA specification (schemas, OpenAPI, documentation)
- ✅ CLI tooling (`ossa init|validate|run|export|providers`)
- ✅ Reference examples (in `examples/` directory)
- ✅ Documentation and guides

This repository does NOT contain:
- ❌ Production agent implementations
- ❌ Bot scripts (`scripts/bots/*`)
- ❌ Agent manifests (`.gitlab/agents/bot-*/*.ossa.yaml`)
- ❌ Production CI jobs for agents

### platform-agents = Canonical Agents ONLY

All canonical agent manifests and implementations belong in:
- `blueflyio/agent-platform/platform-agents`

## Single Source of Truth

**Rule**: One capability = one canonical agent in `platform-agents`.

Do NOT create duplicate agents in `openstandardagents`.

## Adding New Capabilities

If you need a new agent capability:

1. **Create manifest in platform-agents**:
   - `platform-agents/packages/@ossa/{agent-name}/agent.ossa.yaml`
   - Follow OSSA v0.3.3 specification
   - Map to separation-of-duties
   - Add version bump + changelog

2. **Reference from openstandardagents**:
   - Use canonical agent in CI/CD
   - Document in OSSA spec
   - Add examples if needed

3. **Do NOT**:
   - Create `scripts/bots/*` in openstandardagents
   - Create `.gitlab/agents/bot-*` in openstandardagents
   - Duplicate functionality that exists in platform-agents

## CI Guardrails

The pipeline will **fail** if you:
- Add files matching `scripts/bots/*` or `bots/*`
- Add files matching `.gitlab/agents/bot-*`
- Add production agent manifests outside `examples/`

## CODEOWNERS

All agent-related changes require approval from `@blueflyio/ossa-maintainers`.

## Questions?

- **Spec questions**: Create issue in `openstandardagents`
- **Agent implementation**: Create issue in `platform-agents`
- **Architecture questions**: Ask maintainers

---

**Remember**: OSSA = Standard. platform-agents = Implementation.
