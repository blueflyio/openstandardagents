# Task: Orchestrate Parallel Agent Teams for Infrastructure Integration

To execute the "Lighting It Up" plan swiftly, we are dividing the workload so two agents can work entirely independently without stepping on each other's toes.

This plan separates the **Application Orchestration Layer (n8n/GitLab)** from the **Network Ingress Layer (Cloudflare/Tailscale)**.

---

## Agent Pipeline A: The Orchestrator
**Focus:** Proving the bidirectional communication loop between GitLab webhooks and n8n webhook triggers utilizing Service Account Tokens.
**Target Constraints:** This agent works *exclusively* inside the n8n UI, n8n JSON exports, and the GitLab project Webhook settings.

### Mission
Establish the foundational event-driven trigger loop between the source of truth (GitLab) and the Flow Engine (n8n). No Chef or infrastructure routing is involved yet.

### Steps for Agent A
1.  **GitLab Service Account Creation**: Generate a dedicated `srv-agent-n8n-orchestrator` Service Account in the GitLab target project/group. Generate a Personal Access Token (PAT) for this account with `api` and `read_repository` permissions.
2.  **n8n Credential Configuration**: Securely inject this PAT into n8n as a "GitLab OAuth2 API" or "Header Auth" credential. *(Do not store this token anywhere in the local `blueflyio` codebase)*.
3.  **Webhook Configuration**: Create a basic n8n workflow consisting of an HTTP Webhook trigger node. Copy the generated Webhook URL (e.g., `https://n8n.blueflyagents.com/webhook/gitlab-issue-listener`).
4.  **GitLab Event Binding**: In the target GitLab project, navigate to **Settings > Webhooks**. Paste the n8n URL and set it to trigger on **Issue Events** and **Merge Request Events**.
5.  **Bi-Directional Verification**: Within the same n8n workflow, add a GitLab Action node ("Edit Issue" or "Create Comment"). Upon receiving an issue payload, have n8n use the Service Account to post a comment back to the issue saying: `"Agent Pipeline A: n8n bidirectional communication verified."`
6.  **Export & Push**: Export the verified n8n workflow JSON, commit it to a `workflows/` directory in the agent workspace, and push to a new feature branch via CLI.

---

## Agent Pipeline B: The Network Ingress Architect
**Focus:** Establishing "Cloudflare Tunnel Config-as-Code" via the Cloudflare API, moving zero-trust ingress out of manual UI clicks and into the repository.
**Target Constraints:** This agent works *exclusively* on infrastructure repositories, Cloudflare API scripts, and GitLab CI YAML files. It does not touch n8n or webhooks.

### Mission
Ensure that whenever a new internal service or agent requires public ingress, the DNS record and Cloudflare Tunnel routing (`cloudflared`) are declared in code and provisioned automatically.

### Steps for Agent B
1.  **Identify Source of Truth**: Locate the existing `agent-docker` or `config-templates` YAML files (e.g., `configmap.yaml` or `nas-infrastructure-reference.json`) that dictate what internal Tailscale/NAS IP maps to what external `*.blueflyagents.com` hostname.
2.  **API Script Generation**: Write an idempotent Node.js or Python CLI script (using `openstandardagents` standards) that:
    *   Reads the YAML/JSON topology file.
    *   Authenticates with the Cloudflare API (using injected 1Password or CI variable secrets).
    *   Creates or updates the `cloudflared` tunnel ingress rules (`ingress: - hostname... service...`).
    *   Creates or updates the corresponding CNAME record mapping the subdomain to the Tunnel UUID.
3.  **GitLab CI Integration**: Create a `.gitlab-ci.yml` job in the infra repository named `deploy:cloudflare-tunnel`. This job should execute the script developed in Step 2 whenever a change is merged to the main branch that alters the topology file.
4.  **Local Simulation**: Run a local simulation of the script (printing the expected API payload instead of making live POST calls to Cloudflare) to verify it accurately maps an internal `http://blueflynas.tailcf98b3.ts.net:9001` to an external ingress block.
5.  **Commit & MR**: Push the script and CI definition to a feature branch and open a Merge Request assigned to the `srv-agent-n8n-orchestrator` or a human for approval.
