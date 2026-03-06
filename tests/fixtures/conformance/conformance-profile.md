# OSSA NIST CAISI Conformance Profile (v0.5.0)

This conformance profile defines the minimum mandatory fields and validation policies an Open Standard Agent (OSSA) manifest must implement to be considered "CAISI Compliant" under the NIST SP 800-53 mapping.

## Tier 1 & Tier 2 Mandatory Elements

To pass the `ossa validate --profile=caisi` conformance check, an agent must satisfy the base JSON Schema *and* the following normative blocks:

### 1. Cryptographic Identity & Provenance
* **`metadata.x-signature`**: Cryptographic signature validating the agent's publisher, model, and origin. Must include the public key and signing standard (`Ed25519` or `RSA-PSS`).
* **`metadata.sbom_pointer`**: A URI pointing to a valid CycloneDX or SPDX Software Bill of Materials.

### 2. Runtime Transparency & Consent (Tier 2)
* **`spec.transparency.self_disclosure`**: Must be set to `true`, guaranteeing the agent announces it is an AI system when interacting with humans.
* **`spec.consent.data_collected`**: Must enumerate what data is collected, or explicitly be an empty array.
* **`spec.consent.opt_out`**: Must be explicitly declared `true` or `false`.

### 3. Granular User Controls
* **`spec.user_controls`**: Must explicitly declare the availability of `pause`, `stop`, and `undo` hooks that orchestrators can target.

### 4. Cognition Governance
* **`spec.cognition.pattern`**: Must declare the reasoning mechanism (e.g., `sequential`, `react`, `plan_and_execute`).
* **`spec.cognition.trace`**: Must set observability formats (`otel_spans` or `ossa_native`) for explainability logs.

## Validation Fixtures
Refer to the `.yaml` files in this directory for concrete examples of compliant and non-compliant representations for automated tests.
