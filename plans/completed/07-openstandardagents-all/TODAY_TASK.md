# Master Task List (Organized by Epics)

## Epic 1: Infrastructure Stabilization & CI/CD (The Foundation)
*Goal: Stop the bleeding on infrastructure costs, remove dead endpoints, and set up self-hosted test runners.*
- [ ] Audit Oracle Cloud & Synology NAS to quarantine and kill unused deployments.
- [ ] Clean up reverse proxy / ingress routing tables (remove dead routes).
- [ ] Investigate and install self-hosted GitLab Runners on local infrastructure to stop consuming SaaS CI credits.
- [ ] Fix Kubernetes IaC resilience (add/tune liveness/readiness probes to stop pods from piling up in CrashLoopBackOff).

## Epic 2: Core Standard & Testing Setup (The Standard)
*Goal: Define testing methodology, align OSSA with federal standards, release the OSSA standard, and fix the core UI builders.*
- [ ] Define the testing framework approach for Drupal and Frontend (PHPUnit, Playwright, etc.).
- [ ] Align OSSA with NIST AI Agent Standards Initiative (in `~/Sites/blueflyio/WORKING_DEMOs/openstandardagents`):
  - [x] Audit OSSA schema against NIST requirements for agent identity, authorization, and secure interoperability.
  - [ ] Prepare responses/documentation for CAISI's Request for Information on AI Agent Security (if applicable).
  - [x] Update OSSA 0.4.6 manifesto and schema to explicitly cite compliance or alignment with NIST CAISI guidelines.
- [/] Deploy and publish OSSA 0.4.6.
  - [x] Build passed, all NIST + fix commits on branch `nist-compliance-v0.4.6` → MR #805
  - [x] `semantic-release` wired: `.releaserc.json`, `.spectral.yml`, `publint`, `depcheck` added; 3 manual CI jobs replaced with single `release:semantic`
  - [ ] Merge MR #805 into `release/v0.4.x` → then merge to `main` → CI `release:semantic` auto-publishes to npmjs.org
  - [ ] Ensure `NPM_TOKEN` + `GITLAB_TOKEN` set in GitLab CI/CD variables
- [x] Fix `ossa-ui.blueflyagents.com` in production (resolve runtime/connection issues).
- [ ] Refactor the website agent builder:
  - [ ] Integrate with `ossa-ui` API endpoints and components (stop duplicate building).
  - [ ] Point agent saving/filtering/curation into the `openstandard-generated-agents` backend.
  - [ ] Build a leaderboard ranking in GitLab Pages using React.
- [ ] Deploy `openstandardagents.org` proxy/static site to GitLab Pages.

## Epic 3: Drupal Module Hardening & Releases (The Engine)
*Goal: Establish secure auth (NIST aligned), test the modules via CI, and release the suite to Drupal.org.*
- [ ] Implement Token Rotation & Identity (NIST Alignment):
  - [ ] Shift to Service Accounts connected to Agent Nodes with self-rotation semantic.
  - [ ] Ensure agent identity and authorization protocols align with ITL's AI Agent Identity guidelines.
- [ ] Setup systematic automated tests in the new self-hosted GitLab CI for the following:
  - [ ] Deploy and stabilize new `ai_agents_ossa`.
  - [ ] Deploy and publish `api_normalization` alpha4.
  - [ ] Deploy `ditta_ccms` initial version.
- [ ] Test and Release the following *new* modules to Drupal.org:
  - [ ] `ai_agents_kagent`
  - [ ] `alternative_services`
  - [ ] `cedar_policy`
  - [ ] `code_executor`
  - [ ] `dragonfly_client`
  - [ ] `mcp_registry`
  - [ ] `recipe_onboarding`
  - [ ] `agent_registry_consumer`
  - [ ] `agentic_canvas_blocks`
  - [ ] `ai_agents_client`
  - [ ] `ai_agents_communication`
  - [ ] `ai_agents_tunnel`
  - [ ] `ai_provider_routing_eca`
  - [ ] `agentic_canvas` (theme)
- [ ] Evaluate for Drupal.org release (Needs Decision):
  - [ ] `drupal_patch_framework`, `external_migration`, `layout_system_converter`

## Epic 4: Marketplace POC & Agent Wiring (The Product)
*Goal: Wire agents to production endpoints and deliver the final User Marketplace.*
- [ ] Finish wiring up deployed agents using their service accounts so they are actively executing against endpoints.
- [ ] Finish the Marketplace POC:
  - [ ] Implement embedded frontend user auth to GitLab (logging into node logs the user into Drupal).
  - [ ] Build the Drupal marketplace loosely coupled into GitLab projects per user.
- [ ] Determine the future architecture of Agent Dash:
  - [ ] Evaluate building it entirely into the Drupal marketplace backend.
  - [ ] Evaluate merging it with Fleet Demo (current admin for managing mass amounts of Drupal sites).
