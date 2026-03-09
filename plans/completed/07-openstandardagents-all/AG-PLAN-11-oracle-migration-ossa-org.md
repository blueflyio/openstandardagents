# Oracle Migration Checklist for `.org`

With the heavy CLI execution now correctly offloaded to `ossa-ui.blueflyagents.com`, `openstandardagents.org` is completely decoupled from OS-level constraints (like Docker, Python, or local Git worktrees) and exists strictly as a thin frontend wrapper.

This makes it primed for deployment onto managed cloud environments like Oracle. Here is the checklist to ensure a smooth cutover:

### 1. Environment Variable Configuration
- [ ] Add `OSSA_UI_EXTERNAL_URI=https://ossa-ui.blueflyagents.com` to the CI/CD pipeline secrets and production runtime environment.
- [ ] Verify that there are no lingering dependencies on `OSSA_WORKTREE` or `OSSA_CLI_PATH` in the deployed instance (we removed them from `route.ts`, but it's good to confirm they aren't relied upon elsewhere in the `.org` wrapper).

### 2. Dependency Audit
- [ ] Ensure that `@bluefly/openstandardagents` CLI is no longer listed as a hard Next.js server dependency in `website/package.json`, which significantly cuts down on container bloat. *(The `.org` image can now omit all child_process executions).*

### 3. Container Updates (Dockerfile)
- [ ] Simplify the `.org` `Dockerfile` (if one exists specifically for `.org`) to a standard lightweight `node:20-alpine` stage rather than needing DIND (Docker-in-Docker) or system-level dependencies.
- [ ] Ensure the container correctly binds on port `3000` (or `9173` locally, as specified in `package.json`) and sets `NODE_ENV=production`.

### 4. Oracle CI/CD Integration
- [ ] Under `.gitlab-ci.yml`, verify that the deploy stage pushes the new lightweight image to the Oracle Container Registry (OCR).
- [ ] Ensure networking configs / ingress route traffic to `.org` effectively without conflicting with the actual UI hub APIs.

### 5. Post-Deployment Validation Tasks
- [ ] Ensure the `/api/agent-builder` endpoint effectively hits `ossa-ui`'s equivalent endpoint without CORS or Timeout issues.
- [ ] Go onto the interactive playground and ensure `Agent Mesh Discovery` can fetch directly from the mesh endpoint seamlessly.
- [ ] Test the "Clone Design" button locally/remotely and confirm it fills the interactive customizer.
