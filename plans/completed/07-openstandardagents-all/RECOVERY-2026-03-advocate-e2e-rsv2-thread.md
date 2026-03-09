# Recovery: Advocate Registration + E2E Setup (rsv2-cln thread, March 2026)

**Source:** Conversation thread summarized after rm -rf / handoff. Workspace in that thread: `/Users/arslan/Desktop/rsv2-cln` (different from blueflyio). This doc lives in todo so it is not lost.

---

## What This Thread Contained (Reconstructed)

### 1. Stage 6 Advocate Registration (DONE)

- **Option A flow:** n2wZipCode -> n2wState -> n2wCity -> phoneNumberFilter -> validateEmail -> addUnauthenticatedUser -> Advocate Registration.
- Component registry and page were in place and verified.

### 2. Step 2 – Golden E2E for Advocate Registration

Work done in the thread (path `/Users/arslan/Desktop/rsv2-cln` or equivalent):

- **STRIPE_MOCK_HOST / STRIPE_MOCK_PORT** in server/dev-api.ts.
- **.env.local** with Stripe, Supabase, Vite vars.
- **Supabase migration** creating organization / campaign_info / user and seed default-org.
- **Migration version fix:** e.g. 20241226 -> 20241227000000.
- **20241230_user_onboarding_fields.sql** fix: `ADD CONSTRAINT IF NOT EXISTS` -> use `DO $$ ... END $$` block for conditional constraint.
- **edge_runtime/analytics** disabled in supabase/config.toml.
- **supabase/seed.sql** present.
- **.cursor/setup.sh** (idempotent): stripe-mock, Supabase from Docker Hub, wait for Postgres/Hasura, Hasura CLI, apply:hasura, generate:sdk, .env.local from `supabase status -o json`.
- **package.json** `generate:compose` fixed to use node.
- **.cursor/setup_summary.json** with correctly_setup, infeasible, verification_guidance.

If the worktree for rsv2-cln was destroyed, recreate from Git; any uncommitted changes are only recoverable from backup. Use this list to re-implement or verify setup.

### 3. Spawn Teams (BuildKit)

- **Most impactful single run:** epic-mega (13 agents).
- **Most impactful parallel:** Open Agent Registry 4-track (spawn-mesh-integration, spawn-registry-metadata, spawn-drupal-consumer, spawn-frontend-ux).
- Other manifests: ossa-fleet, ossa-registry-bridge, studio-apps, Phase 8. See AGENTS.md for full spawn-team commands and `--seed-todo` / `WORKTREE_SOURCE_DIR`.

### 4. api_normalization / Dragonfly

- Fetch/pull api_normalization, fix it “all and do it right,” run Dragonfly on it.
- PHPCS/PHPCBF fixes; bootstrap fix for tests (project vendor fallback).

---

## Where Docs Live (User Rule)

- **Do not** put recovery or planning docs in `.cursor`.
- **Do** put them in: `/Users/flux423/.agent-platform/agent-buildkit/todo` (this folder).
- Optional: `todo/plans/` for Cursor/Claude plans; align with `buildkit todo plans-sync`.

---

## If Recreating rsv2-cln Setup

1. Clone repo to a worktree or WORKING_DEMOs path.
2. Idempotent setup script should: start stripe-mock, Supabase (Docker), wait for Postgres/Hasura, run Hasura CLI apply, generate SDK, write .env.local from `supabase status -o json`.
3. Migrations: correct version ordering; use `DO $$ ... END $$` for conditional constraints where needed.
4. server/dev-api.ts: STRIPE_MOCK_HOST, STRIPE_MOCK_PORT.
5. package.json: generate:compose via node (not shell).
6. Verification: setup_summary.json (or equivalent) with correctly_setup / infeasible / verification_guidance.
