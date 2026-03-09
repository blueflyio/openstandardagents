# Unified Agent Registry Audit & Remediation (UADP + OSSA Aligned)

## 1. Security & Consumer Governance (Phase 1)
**Objective**: Enforce cryptographic validation of agent manifests at the consumer level and dynamically filter revoked/deprecated agents.
*   **Drupal 11 Consumer `CatalogController`**: Added Ed25519 signature verification using `sodium_crypto_sign_verify_detached`. The code extracts `require_signature` and `trust_public_key` from config (`agent_registry_consumer.settings`), decrypting the raw YAML stream to ensure supply chain integrity before allowing it to write to `private://agents`.
*   **Interactive Playground**: Modified `openstandardagents.org/website/components/playground/InteractivePlayground.tsx` to read the `lifecycle` property. Agents marked as `revoked` are natively filtered from the discovery UI, and agents marked as `deprecated` display a prominent warning badge.

## 2. CI/CD & Execution Model Stability (Phase 2)
**Objective**: Prevent V8 runtime memory exhaustion during BuildKit compilations and ensure deterministic hook execution.
*   **V8 Memory Limits**: Refactored `agent-buildkit/package.json` to swap all `npx tsc` and `tsc` CLI build commands with `node --max-old-space-size=8192 ./node_modules/.bin/tsc`. This allows NextJS, SWC, and TypeScript to tap into 8GB of heap, permanently resolving the `134` aborts.
*   **Lefthook Determinism**: Updated `agent-buildkit/lefthook.yml`. Swapped raw `npx tsc` usage to `npm run typecheck` which executes safely inside npm's `$PATH` resolution sandbox, ensuring CI pipelines do not fail on missing Node binaries in non-interactive hooks.

## 3. Tooling Parity & Documentation (Phase 3)
**Objective**: Align OSSA CLI behavior with the new registry lifecycle statuses and define cryptographic boundaries.
*   **OSSA Verification**: Injected lifecycle enforcement into `openstandardagents/src/cli/commands/validate.command.ts` and `lint.command.ts`. If an agent defines `metadata.status` or `metadata.lifecycle` as `revoked`, the CLI forcefully fails validation with `ExitCode.GENERAL_ERROR`, preventing accidental deployments or executions.
*   **Governance Documentation**: Authored `Governance-Key-Management.md` outlining clear Separation of Duties (SOD). It maps the Private Key generation strictly to developer boundaries, distributing immutable signed payloads via the agent-mesh, and executing zero-trust Ed25519 pubkey validation exclusively at the consumer edge.

## 4. Frontend UI Thin Client Migration (Phase 4)
**Objective**: Decouple `openstandardagents.org` and proxy logic directly to `ossa-ui.blueflyagents.com`.
*   **API Route Pruning**: Deleted mocked internal triggering scripts. Redirected `/builder` endpoints inside `gitlab-trigger.ts` to `https://ossa-ui.blueflyagents.com/api/builder`.
*   **CORS Support**: Added permissive cross-origin resource sharing (`OPTIONS`, `GET`, `POST`) to the `openstandard-ui` target API so the static site playground can interface securely without local passthroughs.
*   **Homepage Conversion**: Reconfigured the call-to-action to link strictly to the centralized OSSA UI instead of proxying a Next.js form.

## 5. Builder UI Parity (Phase 5)
**Objective**: Achieve total 1:1 parity between the headless OSSA CLI generator and the React-powered `openstandard-ui` frontend without spinning up disjointed tooling wrappers.
*   **Persona Native Mappings (`Step1Template.tsx`)**: Injected dropdowns for `uncertainty_handling`, `error_response`, `proactivity`, and `risk_tolerance`, passing standard BehavioralTraits directly via `WizardState`. Extended the template selection with robust `expertiseDomains` domain toggles perfectly mirroring `04a-persona.ts`.
*   **Autonomy Shape Compilation (`lib/manifest/generator.ts`)**: Rewrote the generator sequence to map generic JSON state shapes directly to the rigid `snake_case` definitions required by the OpenStandard specification schema (`approval_required`, `allowed_actions`, `approval_timeout`), successfully mitigating schema divergence errors.
*   **UX Cohesion (`Step5Autonomy.tsx`)**: Aligned the sliders inside the UI to map standard textual autonomy thresholds natively (`assisted`, `supervised`, `full`, `manual`).
