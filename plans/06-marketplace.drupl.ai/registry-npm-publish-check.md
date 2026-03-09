# [npm Registry] Verify all platform packages publish to GitLab registry

Priority: high
Project: agent-buildkit
Branch: release/v0.1.x

## Spec / Deliverables

From deploy-services or package list, list all @bluefly/* packages. Run npm view @bluefly/<pkg> version --registry https://gitlab.com/api/v4/groups/87749026/-/packages/npm/ for each. Document any missing or stale in todo. No code change required if all pass.
