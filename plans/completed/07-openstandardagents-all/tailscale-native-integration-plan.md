# Tailscale Native Integration Plan

**Purpose:** Own Tailscale end-to-end and integrate it natively into the Bluefly platform (not just "install and log in"). Single source of truth for ACL, devices, DNS, and automation.

**References:** [Tailscale Docs](https://tailscale.com/docs), [Tailscale API](https://tailscale.com/api), [Admin Resource Hub](https://login.tailscale.com/admin/resource-hub) (login required). Tailnet: `tailcf98b3.ts.net`.

---

## 1. What Tailscale Provides (Research Summary)

### Core
- **Tailnet:** Identity-based mesh (WireGuard). Devices get Tailscale IPs; MagicDNS gives `hostname.tailnet.ts.net`.
- **ACLs / Grants:** Deny-by-default policy file (HuJSON). Tags, groups, autogroups, port rules. Tailscale recommends migrating to **grants** (next-gen); ACLs still supported.
- **Auth keys:** One-time or reusable; tag-based; ephemeral option. Max 90-day expiry for API tokens.
- **OAuth clients:** Scoped API access (e.g. Devices Core, Auth Keys, Services). Used by Kubernetes operator and automation.

### Automation
- **API:** Full control (devices, keys, ACL, DNS, etc.). Auth via access token from Admin > Keys. [Interactive API docs](https://tailscale.com/api).
- **GitOps:** Policy file in Git; CI applies via API. **GitLab CI:** [Sync Tailscale ACLs](https://tailscale.com/docs/integrations/gitlab/gitops) template (`tailscale-dev/gitops-acl-ci`); test on MR, apply on merge to main.
- **Webhooks:** Subscribe to events (nodeCreated, nodeDeleted, nodeApproved, policyUpdate, etc.). HTTPS POST; verify with `Tailscale-Webhook-Signature` (HMAC-SHA256).
- **Terraform / Pulumi:** Official providers for devices, ACL, DNS, etc.

### Features We Care About
- **Subnet routers:** Advertise LAN routes (e.g. 192.168.8.0/24) so tailnet can reach local subnets.
- **Exit nodes:** Route all traffic through a device (we use sparingly).
- **Docker:** Official image `tailscale/tailscale`; `TS_AUTHKEY`, `TS_HOSTNAME`, `TS_EXTRA_ARGS=--advertise-tags=tag:xyz`, `TS_STATE_DIR`, `TS_USERSPACE`.
- **Kubernetes operator:** Ingress, egress, Connector (exit/subnet), API server proxy. OAuth client + tag `tag:k8s-operator`; optional workload identity federation.
- **Funnel / Serve:** Expose local services to the internet. We keep Funnel OFF on production; private-only.
- **Tailnet Lock:** Require signature from trusted node before new device is allowed. Optional for hardening.

---

## 2. Current State (What We Have)

| Area | Current | Owner |
|------|---------|--------|
| **Devices** | Mac (mac-m4), NAS (blueflynas), Oracle (oracle-platform), iPhone, GL-BE3600 (subnet), Vast.ai when used | Manual / agent-docker |
| **ACL** | JSON in admin console; documented in openstandard-ui docs (acl-policy.md). Tags: home-subnet, agent-host, travel-router | Manual |
| **Hostnames** | Hardcoded in agent-docker tunnel ConfigMap and platform-endpoints.json (e.g. oracle-platform.tailcf98b3.ts.net) | agent-docker, config-templates |
| **agent-tailscale** | Package TailscaleClient (status, ip, up, down, ping), TailscaleDiscovery (peers, compute, topology). 26 services in agent-buildkit experimental not yet migrated | @bluefly/agent-tailscale |
| **agent-docker** | TailscaleService: spawn tailscaled, `tailscale up --authkey --hostname`. Used by VastaiStartupService | agent-docker |
| **GitLab** | Terraform tailscale-mesh (ephemeral keys, tags, subnet routes); CI component tailscale-runner | gitlab_components |
| **Docs** | openstandard-ui website tailscale readme, configuration, devices, routing, acl-policy; agent-tailscale-status | openstandard-ui, agent-buildkit |

**Gaps:** No GitOps for ACL; no single source for device list (API); endpoint URLs hardcoded; API token not in platform env template; no webhooks; agent-tailscale build issues and migration incomplete.

---

## 3. Native Integration Plan (Phased)

### Phase 1: Single Source of Truth for Policy and Devices
- **ACL in GitLab (GitOps):**
  - Create private repo (e.g. `blueflyio/agent-platform/tools/tailscale-policy` or under security-policies) with `policy.hujson`.
  - Use [GitLab CI template](https://tailscale.com/docs/integrations/gitlab/gitops): include `tailscale-dev/gitops-acl-ci`, provide `TS_API_KEY` and `TS_TAILNET` as CI variables (masked). Test on MR, apply on push to main.
  - Lock admin console policy editor (Admin > Policy file management > Prevent edits; set External reference to repo URL).
- **Device list from API:**
  - Add Tailscale API token to platform env template (`config-templates/agent-platform.env.template`): `TAILSCALE_API_TOKEN` (or reuse key from 1Password). Document: create at Admin > Keys, 90-day expiry; rotate before expiry.
  - **agent-tailscale:** Implement (or extend) client that calls Tailscale API: list devices, get device by name, list keys (if scoped). Use token from env. No hardcoded hostnames in code.
- **Endpoints and MCP:**
  - Derive Tailscale fallback URLs from API (devices with tag e.g. `tag:agent-host` or hostnames oracle-platform, blueflynas) or from a small generated config (e.g. `buildkit platform endpoints --tailscale`) that reads API and writes platform-endpoints.json-compatible structure. Alternatively keep a single "tailscale_backup" in platform-endpoints.json but populate it from API in CI or on demand.

### Phase 2: Automation and Secrets
- **Auth keys for automation:**
  - Oracle/NAS/Vast: Use tagged auth keys (or OAuth client) so each service joins with a tag (e.g. `tag:oracle`, `tag:nas`, `tag:ci-runner`). Store key in 1Password or GitLab CI variables; inject into deploy/runner. No long-lived keys in repo.
- **Webhooks:**
  - Register webhook in Admin > Webhooks: endpoint e.g. `https://n8n.blueflyagents.com/webhook/tailscale` (or platform-agents orchestrator). Subscribe to: nodeCreated, nodeDeleted, nodeApproved, policyUpdate. Verify signature (HMAC-SHA256) in receiver. Use for: alert on new device, sync device list to GKG or config, audit log.
- **agent-docker:**
  - Keep TailscaleService for Vast.ai (and any ephemeral node). Ensure it uses auth key from env (e.g. `TAILSCALE_AUTHKEY`) and tag from config; no secrets in code.

### Phase 3: Kubernetes and Docker
- **Oracle k3s (optional):**
  - If we want Tailscale Ingress or egress for k3s services: install [Tailscale Kubernetes Operator](https://tailscale.com/docs/features/kubernetes-operator) (Helm from pkgs.tailscale.com/helmcharts). Create OAuth client with scopes Devices Core, Auth Keys, Services; tag `tag:k8s-operator`. Use for cluster ingress or connector (exit/subnet) if needed. Not required for current tunnel setup (Cloudflare handles public ingress).
- **Docker:**
  - Any container that must join the tailnet: use official image `tailscale/tailscale` with `TS_AUTHKEY`, `TS_HOSTNAME`, `TS_EXTRA_ARGS=--advertise-tags=...`, persistent state (volume or K8s secret). agent-docker already uses TailscaleService for Vast.ai; align with same env-based auth pattern.

### Phase 4: agent-tailscale and BuildKit
- **agent-tailscale package:**
  - Fix TypeScript build (module resolution). Implement Tailscale API client (devices, keys, ACL preview) using `TAILSCALE_API_TOKEN`. Keep TailscaleClient (CLI) for local status/ip/up/down. Publish to GitLab npm; document in AGENTS.md.
- **agent-buildkit:**
  - Add `@bluefly/agent-tailscale` as dependency. Migrate 26 experimental Tailscale services from agent-buildkit to agent-tailscale (or delete duplicates and use only agent-tailscale). Commands that need Tailscale (e.g. deploy, platform endpoints) call agent-tailscale.
- **Separation of duties:**
  - **agent-tailscale:** Tailscale daemon, API, ACL templates, device list, DNS templates. **agent-docker:** Tunnel ingress (Cloudflare ConfigMap), Tailscale hostnames in ConfigMap (source of truth for tunnel routes), optional TailscaleService for ephemeral nodes (Vast.ai). No duplicate ACL or device logic in agent-docker.

### Phase 5: Documentation and Runbooks
- **Wiki:**
  - One page: Tailscale (this plan + runbooks). Link from AGENTS.md. Runbooks: rotate API token, add device with tag, GitOps policy update, webhook verify signature.
- **Config:**
  - platform-endpoints.json: keep `tailscale_backup`; document that oracle_platform and NAS hostnames come from MagicDNS. Optionally add `buildkit platform tailscale devices` that outputs current devices from API.
- **Admin resource hub:**
  - Use [Resource Hub](https://login.tailscale.com/admin/resource-hub) (after login) for quick links to Keys, ACL, Webhooks, Machines, DNS. No automation there; human reference.

---

## 4. Checklist (Concrete Actions)

- [ ] Create GitLab repo for tailnet policy file; add `.gitlab-ci.yml` with GitOps template; set `TS_API_KEY` and `TS_TAILNET`; lock admin console policy.
- [ ] Add `TAILSCALE_API_TOKEN` to platform env template and document rotation (Admin > Keys, 90 days).
- [ ] In agent-tailscale: add Tailscale API client (devices list, optional keys/ACL); fix build; publish.
- [ ] In agent-buildkit: depend on @bluefly/agent-tailscale; migrate or remove experimental Tailscale services; add `platform endpoints` or `tailscale devices` using API when needed.
- [ ] Register Tailscale webhook (n8n or orchestrator); implement signature verification; use for audit or device sync.
- [ ] Document in AGENTS.md: Tailscale native integration pointer (this wiki page); token location; GitOps flow; no hardcoded hostnames in new code.
- [ ] (Optional) Install Tailscale Kubernetes operator on Oracle k3s if we need Tailscale Ingress/egress for services.

---

## 5. References

- [Tailscale Docs](https://tailscale.com/docs)
- [Tailscale API](https://tailscale.com/api)
- [ACLs](https://tailscale.com/docs/features/access-control/acls) and [Grants](https://tailscale.com/docs/features/access-control/grants)
- [GitLab GitOps](https://tailscale.com/docs/integrations/gitlab/gitops)
- [Webhooks](https://tailscale.com/docs/features/webhooks)
- [Kubernetes operator](https://tailscale.com/docs/features/kubernetes-operator)
- [Docker](https://tailscale.com/docs/features/containers/docker)
- [Automations](https://tailscale.com/docs/automations) (API, Terraform, Pulumi)
- Platform: AGENTS.md "Tailscale native integration"; config-templates/platform-endpoints.json; agent-docker tunnel ConfigMap.
