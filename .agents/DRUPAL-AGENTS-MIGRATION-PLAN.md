# Drupal Agents Migration Plan

## Issue

Drupal agents in OSSA project violate repository boundaries per CONTRIBUTING.md:

**OSSA project should NOT contain:**
- ❌ Production agent implementations
- ❌ Platform-specific agents

**Current Drupal agents in OSSA:**
- `.agents/workers/drupal-module-developer/agent.ossa.yaml`
- `.agents/workers/drupal-security-compliance/agent.ossa.yaml`
- `.agents/workers/drupal-migration-intelligence/agent.ossa.yaml`

## Analysis

### platform-agents Already Has:
- ✅ `drupal-standards-checker` - Drupal standards validation
- ✅ `drupal-standards-worker` - Drupal standards enforcement

### OSSA Project Has (DUPLICATES?):
- `drupal-module-developer` - Module development specialist
- `drupal-security-compliance` - Security and compliance specialist
- `drupal-migration-intelligence` - Migration specialist

## Recommendation

**Option 1: Move to platform-agents (RECOMMENDED)**

These are production agents and belong in `platform-agents/packages/@ossa/`:

1. **drupal-module-developer** → `platform-agents/packages/@ossa/drupal-module-developer/`
2. **drupal-security-compliance** → `platform-agents/packages/@ossa/drupal-security-compliance/`
3. **drupal-migration-intelligence** → `platform-agents/packages/@ossa/drupal-migration-intelligence/`

**Action:**
- Move agents to platform-agents
- Register in platform-agents registry.yaml
- Remove from OSSA project
- Update any references

**Option 2: Move to examples/ (if reference only)**

If these are meant to be reference examples:

- Move to `examples/drupal-agents/`
- Keep as educational/showcase material
- Document as examples, not production agents

**Option 3: Remove (if duplicates)**

If platform-agents already has equivalent agents:
- Consolidate capabilities into existing platform-agents
- Remove duplicates from OSSA

## Decision Needed

**Question:** Are these production agents or reference examples?

- **Production** → Move to platform-agents
- **Examples** → Move to examples/
- **Duplicates** → Remove and consolidate

---

*Created: 2026-01-11*
