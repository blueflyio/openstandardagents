# [13-plans] agent-docker: validate tunnel ConfigMap in CI

Priority: high
Project: agent-docker
Branch: release/v0.1.x

## Spec / Deliverables

Add a CI job that validates k8s/cloudflared-oracle/config-configmap.yaml (or equivalent): required hostnames present, no duplicate routes, valid URLs. Can be a node script or buildkit subcommand; no .sh. Run on MR and main.
