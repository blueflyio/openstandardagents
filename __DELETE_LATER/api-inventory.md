# Stop → Figure Out → Fix Plan

- What happened: API surface collected from OpenAPI spec
- Current state: 10 operations parsed
- Impact: Enables test generation and roadmap sizing
- Root-cause hypotheses: N/A
- Remediation plan: Implement endpoints to satisfy spec
- Verification plan: Contract tests pass in CI

## Operations
-     GET:   /health:
-     GET:   /version:
-     GET:   /agents:
-     POST:   /agents:
-     GET:   /agents/{agentId}:
-     PUT:   /agents/{agentId}:
-     DELETE:   /agents/{agentId}:
-     GET:   /discover:
-     GET:   /metrics:
-     POST:   /graphql:
