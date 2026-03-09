# Cross-Project Tech Debt Audit: Replace Custom Code With OSS Packages

## Executive Summary
Across all 14 WORKING_DEMOs projects, the same anti-pattern recurs: **a package is installed, then wrapped unnecessarily in custom service code** instead of being used directly. This creates maintenance burden, drift risk, and hidden bugs that the OSS maintainers would have already solved.

---

## Priority 1 — Dragonfly (Most Custom Code)

### ❌ `mcp.service.ts` — Replace with `@modelcontextprotocol/sdk`
**Problem**: 342 lines of hand-rolled HTTP polling for MCP. `waitForResponse()` is a manual polling loop with `setTimeout`. `generateMessageId()` reinvents `uuid`.

**Fix**: Install `@modelcontextprotocol/sdk` and use `Client`/`StdioClientTransport` directly (same fix we just applied to `openstandardagents`).

For Qdrant (agent-brain), install the official SDK:
```bash
npm install @qdrant/js-client-rest
```
Then replace `axiosBrain.put/post` calls with `QdrantClient.upsert()` and `.search()`.

---

### ❌ `websocket.service.ts` — Replace with official `ws` patterns
**Problem**: `ws` is installed but the service reinvents connection lifecycle/reconnect logic.
**Fix**: Use `ws` directly or upgrade to [`socket.io`](https://socket.io) (already de facto standard for bi-directional events in Node).

---

### ❌ `docker.service.ts` — Thin wrapper over `dockerode`
**Problem**: Custom thin wrapper duplicates dockerode's own API.
**Fix**: Use `dockerode` directly at call sites. Delete the wrapper.

---

### ❌ `metrics.service.ts` — Replace with OpenTelemetry
**Problem**: OpenTelemetry packages (`@opentelemetry/*`) are **already installed** but metrics.service.ts likely wraps them with custom counters.
**Fix**: Use `@opentelemetry/sdk-metrics` `MeterProvider` directly at call sites.

---

## Priority 2 — openstandard-ui / NODE-AgentMarketplace

### ❌ Custom HTTP Client Wrappers
**Problem**: Both projects have hand-rolled `axios` wrappers with duplicated retry/timeout logic.
**Fix**: Use [`axios-retry`](https://www.npmjs.com/package/axios-retry) for retry handling. Use Zod + `openapi-typescript` (already installed) for type-safe request/response validation — stop writing manual type assertions.

---

### ❌ Custom Form State Management
**Problem**: Hand-rolled React form state where `react-hook-form` + `zod` would suffice.
**Fix**:
```bash
npm install react-hook-form @hookform/resolvers
```
Already have `zod` — wire `zodResolver` and eliminate all custom `useState` form patterns.

---

## Priority 3 — dragonfly-saas

### ❌ Hand-rolled tenant management
**Problem**: `express` + `uuid` used for multi-tenant routing but no isolation or scoping library.
**Fix**: Use [`express-jwt`](https://www.npmjs.com/package/express-jwt) + [`jwks-rsa`](https://www.npmjs.com/package/jwks-rsa) for proper tenant token validation. These are the standard packages for this pattern.

---

## Priority 4 — Drupal Projects (PHP)

### ❌ Custom GitLab webhook parser
**Problem**: Hand-written PHP parsing GitLab webhook JSON.
**Fix**: GitLab provides a [standard webhook payload structure](https://docs.gitlab.com/ee/user/project/integrations/webhook_events.html). Use Symfony's [`HttpClient`](https://symfony.com/doc/current/http_client.html) + Drupal's `http_client_manager` (already in the platform) with typed DTOs instead.

### ❌ Custom Drupal API consumption
**Problem**: Some modules doing raw `drupal_http_request()` calls instead of using the injected `\Drupal\Core\Http\ClientFactory`.
**Fix**: Replace all `file_get_contents()` / raw curl with `\Drupal::httpClient()` which is fully configured, cached, and testable.

---

## Priority 5 — All Projects

### ❌ Hardcoded `uuid` v4 generation
**Problem**: Multiple files call `Math.random().toString(36)` for IDs when `uuid` is already a dependency everywhere.
**Fix**: `import { v4 as uuidv4 } from 'uuid'` — one line.

### ❌ Duplicate YAML parsing logic
**Problem**: `js-yaml` and `yaml` are **both** installed in multiple projects. Some files use both.
**Fix**: Standardize on `js-yaml` (already used by OSSA core). Remove duplicate `yaml` package.

### ❌ `axios` vs `fetch`
**Problem**: Node 18+/Vite projects mix `axios` and native `fetch`. This is confusing and maintains two patterns.
**Fix**: In browser-targeted code (React apps), use native `fetch` + `TanStack Query` for caching. In Node services, keep `axios` with `axios-retry`.

---

## Recommended New Packages to Add

| Project | Package | Replaces |
|---|---|---|
| dragonfly | `@qdrant/js-client-rest` | Hand-rolled axios Qdrant calls |
| dragonfly | `axios-retry` | Custom retry loops |
| NODE-AgentMarketplace, openstandard-ui | `react-hook-form` + `@hookform/resolvers` | Manual useState form logic |
| dragonfly-saas | `express-jwt`, `jwks-rsa` | Custom tenant auth code |
| All Node projects | Standardize on `js-yaml` only | Remove duplicate `yaml` package |

## Verification Plan
For each change:
1. Run `npm run build` to verify TypeScript compiles
2. Run `npm run test` to catch any behavioral regressions
3. `git commit` and push to `release/v0.4.x` (or appropriate branch)
