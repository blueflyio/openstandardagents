# OSSA Registry Governance & Publishing Guidelines

This document outlines the governance model, publishing workflow, and required metadata for agents distributed via the Agent Registry (`agent-mesh` and UADP discovery layer). Compliance with these guidelines ensures ecosystem trust, supply-chain security, and proper lifecycle management.

## 1. Required Registry Identifiers
To participate in the Open Agent Registry, an OSSA manifest MUST include the following identifiers in its `metadata` section:

- **`uuid`**: A stable, universally unique identifier (v4) used for cross-system mapping (e.g., matching the agent to a Drupal entity in `agentDash`).
- **`machine_name`**: A Drupal-friendly string (`^[a-z0-9_]+$`) used for configuration exports and stable routing.
- **`publisher_namespace`**: The vendor or organizational domain bound to the publisher (e.g., `@bluefly`).

## 2. Supply-Chain Security (Trust Signals)
Production agents MUST implement basic integrity checks:

- **`checksum`**: A `sha256:` or `sha512:` digest of the canonical manifest content.
- **`signature`**: Cryptographic signature validation (e.g., sigstore, Ed25519) binding the checksum to the authorized publisher.
- **`sbom_url`**: Pointer to a Software Bill of Materials (SBOM), such as a CycloneDX JSON file, enumerating the agent's dependencies, models, and runtimes.

## 3. The Publishing Workflow (BuildKit)
The openstandardagents registry follows a **push-from-source** model via `agent-buildkit`:

1. **Local Development**: Authors define `.agents/` YAML files in their respective project repositories.
2. **Validation**: Run `ossa validate --strict` to ensure structural integrity.
3. **Commit & CI**: Once pushed, the agent platform CLI automatically triggers standard linting (`ossa lint`).
4. **BuildKit UADP Sync**: The `agent-buildkit publish` command extracts the manifest data and publishes it to `agent-mesh`. Direct database writes to consumers (like the Legacy Node API in `marketplace/api`) are deprecated. `agent-mesh` is the single source of truth.

## 4. Lifecycle & Disclosure Process
Publishers are fully responsible for the maintenance and explicit revocation of their agents.

### Deprecation
When an agent is being sunset:
- Set `metadata.lifecycle.state` (or `metadata.status`) to `'deprecated'`.
- Provide a clear migration path in `metadata.lifecycle.deprecation.replacement` or `deprecated_message`.

### Revocation
In the event of a critical security vulnerability, policy violation, or publisher withdrawal:
- The agent's `status` must be forcefully set to `'revoked'`.
- The `revoked_at` timestamp MUST be populated.
- **Enforcement:** The Node proxy API and `agent_registry_consumer` modules are strictly instructed to drop or flag any interactions involving a revoked agent.

## 5. Automated Governance Checks
Authors should locally verify their agents via the OSSA CLI:
```bash
ossa lint --rule revocation-status
ossa lint --rule signed-artifact
ossa lint --rule drupal-identifiers
```
Our CD pipelines enforce these checks automatically via `ossa governance evaluate-quality-gate`.
