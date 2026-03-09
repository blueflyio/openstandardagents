# Todo – agent-buildkit

Single canonical todo root for spawn-team and task-queue.  
After recovery: only this directory and `plans/` are authoritative; archive and old dirs are gone.

- **RUNBOOK.md** – Main runbook (token, push, MR merge order, sync, Drupal_AgentDash at NAS, Phase 8).
- **INDEX.md** – Index of runbook and plans.
- **NEXT.md** – What to do next (points at runbook).
- **RECOVERY.md** – Incident doc: what was lost and what was restored from the thread.
- **RECOVERY-*.md** – Thread-specific recovery docs (workflow-engine, UADP/OSSA, SOD/Drupal/openstandard-ui).
- **Task files** – `01-runbook-next-commands.md` … `router-live.md` (8 total) for spawn-team.
- **plans/** – `00-ORIGINAL-PLAN-build-order.plan.md`, `drupal-recipes-gaps-and-bridge.plan.md` (content restored from memory where possible; plans text may need re-entry from backup).
