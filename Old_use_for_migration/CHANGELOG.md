# Changelog

## 0.1.8 (2025-09-07)

### Added
- Minimal OssA OrbStack stack for local development:
  - `infrastructure/docker/docker-compose.orbstack.yml` — Redis service bound to host port 6382 (container 6379)
  - `infrastructure/docker/docker-compose.gateway.yml` — Gateway service bound to host port 4003 (container 3000)
  - `infrastructure/docker/docker-compose.override.yml` — Override scaffolding for future multi-service bring-up
- Gateway Dockerfile with Node 20 and CLI build/start:
  - `infrastructure/docker/Dockerfile.gateway` updated to use Node 20, install dependencies, build CLI at `src/cli`, and run via `bin/ossa serve`

### Changed
- Integration tests updated to be CLI bin–aware and service-aware:
  - `tests/integration/agent-lifecycle.test.ts` now uses `/Users/flux423/Sites/LLM/OSSA/src/cli/bin/ossa` and skips when services are down
- README will now include service run instructions and ports (see Services section)

### Infrastructure & DX
- OrbStack project name guidance: use `-p ossa` for Compose; ports adjusted to avoid conflicts (Redis 6382, Gateway 4003)
- Health and logs commands documented for quick diagnostics

### How to Run (Summary)
```bash
# Minimal stack: Redis only (host 6382)
docker compose -f infrastructure/docker/docker-compose.orbstack.yml -p ossa up -d

# Gateway on 4003; connects to host Redis on 6382
docker compose -f infrastructure/docker/docker-compose.gateway.yml -p ossa up -d

# Status / Logs
docker compose -p ossa ps
docker compose -p ossa logs -f ossa-gateway-1
curl http://127.0.0.1:4003/health
```

### Notes
- This release aligns with Node 20 standard and prepares for expanded services (discovery, coordination, orchestration, monitoring) in subsequent iterations.
