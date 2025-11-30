# OSSA ↔ GitLab Duo Integration

## Vision
**OSSA as the OpenAPI for AI Agents** - Universal agent definition format that works across all platforms, including GitLab Duo.

## Three Agent Types

### 1. Foundational Agents (`foundational/`)
GitLab's pre-built, production-ready agents documented in OSSA format.

**Available:**
- `planner-agent.yaml` - Product management and planning
- `security-analyst-agent.yaml` - Security analysis and vulnerability management

**Purpose:** Document GitLab's agents in OSSA format for:
- Interoperability understanding
- Capability mapping
- External integration reference

### 2. Custom Agents (`custom/`)
OSSA-defined agents deployed to GitLab Duo.

**Examples:**
- Issue triage automation
- CI/CD optimization
- Code review assistance
- Documentation generation

**Workflow:**
1. Define agent in OSSA format
2. Use adapter to transform to GitLab Duo format
3. Deploy via GitLab API
4. Enable in project
5. Use with GitLab Duo Chat

### 3. External Agents (`external/`)
OSSA agents that integrate external AI providers (Claude, OpenAI, etc.) with GitLab.

**Use Cases:**
- Use Claude Sonnet 4 for code review
- Use GPT-4 for documentation
- Use specialized models for specific tasks

**Workflow:**
1. Define external agent in OSSA
2. Configure provider credentials
3. Deploy to GitLab as external agent
4. Trigger from issues/MRs

## Adapter (`adapters/`)

### OSSA → GitLab Duo Adapter
Transforms OSSA agent definitions into GitLab Duo custom agents.

**Features:**
- Parse OSSA YAML/JSON
- Generate system prompts from capabilities
- Map OSSA tools to GitLab built-in tools
- Deploy via GitLab API
- Sync multiple agents

**Usage:**
```bash
# Deploy single agent
ossa deploy gitlab-duo \
  --agent issue-triage-agent.yaml \
  --project blueflyio/openstandardagents

# Sync all agents
ossa sync gitlab-duo \
  --directory custom/ \
  --project blueflyio/openstandardagents
```

## Benefits

### For GitLab Users
- Define agents in version-controlled YAML
- Portable across GitLab instances
- Validated before deployment
- Self-documenting capabilities

### For OSSA Ecosystem
- GitLab Duo as execution platform
- Real-world agent deployment
- Dogfooding OSSA standard
- Proof of interoperability

### For the Industry
- Standard agent definition format
- Framework-agnostic approach
- Vendor-neutral specification
- OpenAPI-style for AI agents

## Architecture

```
┌─────────────────────────────────────────┐
│         OSSA Agent Definition           │
│  (Universal, Version-Controlled)        │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│         OSSA → GitLab Adapter           │
│  - Parse OSSA                           │
│  - Generate system prompts              │
│  - Map tools                            │
│  - Deploy via API                       │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│       GitLab Duo Agent Platform         │
│  - Custom Agents                        │
│  - Foundational Agents                  │
│  - External Agents                      │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│         GitLab Duo Chat                 │
│  (User Interaction)                     │
└─────────────────────────────────────────┘
```

## Roadmap

### Phase 1: Documentation ✅
- [x] Document foundational agents in OSSA
- [x] Define adapter specification
- [x] Create integration architecture

### Phase 2: Adapter Implementation
- [ ] Build OSSA parser
- [ ] Implement system prompt generator
- [ ] Create tool mapper
- [ ] Build GitLab API client

### Phase 3: Deployment
- [ ] Deploy custom agents to GitLab
- [ ] Test with GitLab Duo Chat
- [ ] Iterate based on feedback

### Phase 4: External Agents
- [ ] Define external agent spec
- [ ] Implement provider integrations
- [ ] Deploy external agents

### Phase 5: Ecosystem
- [ ] Publish adapter as npm package
- [ ] Document best practices
- [ ] Create agent templates
- [ ] Build agent marketplace

## Contributing

See main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](../../LICENSE)
