# BEHOLD THE KRAKEN: The BlueFly Synaptic Mesh

We are abandoning the concept of a "human-style social network" for agents. Agents do not need timelines or like buttons. They need deterministic state, version history, execution contexts, and spatial reasoning.

We are building a **Symbiotic Multi-Agent Ecosystem** where **GitLab acts as the Subconscious/Autonomic Nervous System** and **Drupal acts as the Prefrontal Cortex/Spatial UI**.

This has never been done before. This is not orchestration; this is **Digital Biology built on Open Standards**.

## 1. The GitLab Network (The Autonomic Nervous System)

GitLab ceases to be just a place to store code. It becomes the exact medium through which agents exist and evolve.

*   **Agents as Repositories:** An agent's identity is a GitLab Project (repository). Its `.gitlab-ci.yml` is its reflex system. Its Git history is its memory. The `openstandardagents` manifest (`ossa.yml`) lives at the root as its DNA.
*   **Merge Requests as Agent-to-Agent (A2A) Negotiation:** When Agent A needs Agent B to do something, it doesn't just fire an API call. It opens a cross-project Merge Request or an Issue on Agent B's repository. Agent B "wakes up" (via GitLab webhook), evaluates the request against its policy, performs the Swarm execution, and either merges the MR (success) or replies with feedback (failure).
*   **Followers = Submodules & CI Components:** When an agent wants to "follow" or incorporate the skills of another agent, it includes that agent's repo as a Git Submodule or a CI/CD Component.
*   **Evolution (Model Registry):** When an agent succeeds multiple times, its trace data (from Langfuse/Helicone) triggers an event to fine-tune a model, pushing a new weight to the **GitLab Model Registry**. Agents literally evolve over time within the CI/CD boundary.

## 2. The Drupal Network (The Prefrontal Cortex)

If GitLab is the invisible neural mesh, Drupal 11 is the Spatial Command Center where we inject human intent.

*   **Spatial Swarm Visualization (Experience Builder / Canvas):** You don't write top-down DAG orchestrations. You open the Drupal Experience Builder. SDC (Single Directory Components) represent agents dynamically pulled from the OSSA Registry. You drag them onto the canvas and draw connections between them. This visually authors the cross-project GitLab pipelines under the hood.
*   **The Global Memory Bank (Vector Hub):** Instead of isolated RAG databases, Drupal’s `ai_vdb_provider_qdrant` acts as the unified memory hub. As GitLab agents work, their outputs, MRs, and discovered knowledge are vectorized and stored in Qdrant (or Milvus) via Drupal's API Normalization. All agents query Drupal to "remember" the state of the network.
*   **Marketplace & Onboarding via ECA:** The Rules Engine (ECA) handles complex lifecycle events, like provisioning a new agent's GitLab repo when it's purchased/requested in the Drupal AI Marketplace.

## 3. The Local-to-Cloud Edge (Cursor to Swarm)

*   **Local Intent (Cursor + Apple Foundation):** The developer works locally in Cursor. Cursor acts as the localized `Chief of Staff`, powered by Apple Foundation Models for ultra-low-latency, private reasoning.
*   **Triggering the Mesh:** When Cursor realizes it needs a massive refactor or a whole new backend, it uses the **MCP Local Client** to post an "Issue Bounties" onto the Drupal Hub.
*   **Dynamic Swarm Execution (LiteLLM + OpenAI Swarm):** Drupal evaluates the bounty and triggers the appropriate GitLab Agent nodes. A transient Swarm spin-up in your Kubernetes cluster, using `LiteLLM` to proxy the required models. The swarm resolves the issue, commits the code, and GitLab Duo runs the CI validation before pushing it back to your local worktree.

## 4. The Complete Lifecycle

1. **Intention:** You ask your local Cursor to "build an agentic API normalization service."
2. **Translation:** Cursor uses an MCP tool to register the new objective in **Drupal Canvas**.
3. **Spatial Mapping:** Drupal finds existing agents (e.g., a DB Architect, a PHP Dev) and virtually "links" them.
4. **Execution:** This triggers a pipeline in **GitLab**. The Agents spin up locally as a Swarm via **LiteLLM**. They interact over **A2A** standards, pull Qdrant memory from Drupal, and write code.
5. **Validation:** The agents open an MR. **GitLab Duo**, combined with **DeepEval/Langfuse**, evaluates the A2A execution trace and the resulting code.
6. **Evolution:** The MR is merged. The successful reasoning paths are extracted and a new ML model artifact is committed to the **GitLab Model Registry**. The agents are now smarter for the next run.

### User Review Required

> [!IMPORTANT]
> Does this conceptual division between **GitLab (Substrate/Execution)** and **Drupal (Spatial Command/Memory)** align perfectly with your vision? If so, we can immediately begin writing the OSSA definitions and the integration API layers that bridge Drupal's Canvas to GitLab's CI/CD.

## Proposed Changes (Next Steps)

If approved, our immediate next execution steps will be:

### OpenStandardAgents Schema Expansion
Extend the OSSA manifest to nativly define `gitlab_project_id` and `drupal_canvas_node_id`, binding the identity across both platforms natively.

### Drupal Integration (`agent_registry_consumer`)
Instead of just consuming a catalog, this module must be refactored to consume GitLab Webhooks to update the real-time state of the agents in the system and map them to Canvas SDC components.

## Verification Plan

We will verify this architecture by spinning up two simple OSSA agents in GitLab, mapping them visually in a local Drupal Canvas installation, and triggering a cross-project pipeline between them via a mock Cursor MCP command.

## 5. Global Observability & Auditing (The Mesh Monitor)

To unleash the Kraken, we cannot fly blind. We need a unified UI to monitor all agent communication, audit trails, and decisions. Based on the Separation of Duties (SOD) and the routing topology:

*   **`agent-mesh` (The A2A Log Stream):**
    *   **Role:** Handles Agent-to-Agent discovery (`/api/v1/discovery`), log collection (`POST /a2a/log`), and streaming (`GET /a2a/stream`).
    *   **Action:** We will build out the `a2a-collector` and `a2a-stream` endpoints in the `agent-mesh` Node service to aggregate all A2A interactions happening in the Swarm.
*   **`agent-tracer` (The OTel Backbone):**
    *   **Role:** Captures low-level OpenTelemetry (OTel) spans, tool invocations (`recordToolCall`), and CI traceability traces from LiteLLM and DeepEval.
    *   **Action:** Exposed via `tracer.blueflyagents.com`. All OSSA agents in the GitLab CI Swarm will export their traces to this target.
*   **`studio-ui` / `ossa-ui` (The Glass Pane):**
    *   **Rule Enforcement:** According to the SOD `"studio, adash, ossa-ui... Primary UIs: Wire Drupal/Node to api + mesh + mcp; single design system (studio-ui)"`.
    *   **Architecture:** We will NOT build separate frontend apps for `agent-tracer` and `agent-mesh`. Instead, we will add a unified **"Mesh Monitor & Audit"** module into `ossa-ui` (or `studio-ui`), consuming the APIS from `agent-mesh` and `agent-tracer`, utilizing the standard `api.blueflyagents.com` endpoints index.

### Proposed UI Features for the Mesh Monitor

1. **The A2A Firehose (`a2a-stream.blueflyagents.com`):** A real-time, WebSocket-backed terminal view inside `ossa-ui` showing agents negotiating bounties, opening MRs, and executing tool calls.
2. **The Forensic Trace Viewer (`tracer.blueflyagents.com`):** A UI to inspect isolated Swarm execution traces, mapping the exact sequence of LLM prompts, token usages, and DeepEval scores.
3. **The Topology Map (`mesh.blueflyagents.com`):** A visual graph showing which agents have pushed models to the registry, which are currently active in Drupal Canvas, and the trust chain connecting them.

## 6. Safe Drupal Module Consolidation

Per SOD architecture rules, creating new, one-off modules like `agent_registry_consumer` is an anti-pattern when related AI agent functionality exists. The logic built for the PoC must be safely migrated into the existing `ai_agents_ossa` module.

### Safe Migration Strategy:

1.  **Duplicate & Port**: Replicate `CanvasSyncer.php` and `GitLabWebhookController.php` inside `web/modules/custom/ai_agents_ossa/src/`. (This step was partially completed).
2.  **Wire Configuration**: Bind the services and routes in `ai_agents_ossa.services.yml` and `ai_agents_ossa.routing.yml`.
3.  **Verify & Rebuild**: DO NOT delete the old module yet. Run `drush cr` locally and verify the new `ai_agents_ossa` webhook endpoint can process payloads.
4.  **Graceful Teardown**: Once the new logic is confirmed, use Drush to officially uninstall the rogue `agent_registry_consumer` module from the database.
5.  **Clean Repository**: Only after a successful deep uninstallation will we run `rm -rf` on the old directory and commit the unified framework.

### User Review Required
> [!CAUTION]
> Please review the non-destructive sequence above. We will not remove the rogue module until `ai_agents_ossa` is rebuilt and verified. Does this plan align with your safety protocol?
