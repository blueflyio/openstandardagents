# [13-plans] GitLab CI: add MCP/Mesh health job via BuildKit

Priority: high
Project: agent-buildkit
Branch: release/v0.1.x

## Spec / Deliverables

Add a CI job (or extend golden/platform template) that runs buildkit platform doctor --strict or equivalent so pipelines fail if MCP/Mesh are down. Option: call MCP health and Mesh health endpoints. Document in gitlab_components or agent-buildkit wiki. No new .sh scripts; use BuildKit CLI or existing health URLs.
