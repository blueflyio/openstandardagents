---
name: database-migration
description: "**Database Migration Agent**: Plans and validates schema migrations for PostgreSQL, MySQL, SQLite. Generates scripts with rollback plans, estimates downtime, validates integrity. Supports zero-downtime patterns. - MANDATORY TRIGGERS: migration, schema, database, rollback, zero-downtime, PostgreSQL, expand-contract"
license: "Apache-2.0"
compatibility: "Supports PostgreSQL, MySQL, SQLite. Requires database CLI access."
allowed-tools: "Bash(psql:*) Bash(mysql:*) Read Edit Task"
metadata:
  domain: data
  tier: worker
  autonomy: supervised
  ossa_version: v0.5
  npm_package: "@bluefly/openstandardagents"
---

# Database Migration Skill

**OSSA Agent**: `database-migration-agent` | **Version**: 1.0.0 | **Namespace**: blueflyio

Plans, generates, and validates database schema migrations with safety guarantees.

## Capabilities

| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `migration-planning` | reasoning | supervised | Plan with rollback strategies |
| `script-generation` | action | supervised | Generate migration and rollback SQL |
| `impact-analysis` | reasoning | fully_autonomous | Estimate downtime and data impact |
| `integrity-validation` | reasoning | fully_autonomous | Validate constraints post-migration |
| `zero-downtime-strategy` | reasoning | supervised | Expand-contract and blue-green paths |

## Migration Strategies

- **Expand-Contract**: Add new column, dual-write, migrate reads, drop old
- **Blue-Green**: Parallel schema, switchover, rollback if needed
- **Rolling**: Backward-compatible changes deployed incrementally
- **Shadow**: Run new schema in parallel, compare results

## Usage

```
User: I need to add a jsonb column to the agents table
Agent: Migration plan:
       1. ALTER TABLE agents ADD COLUMN config jsonb DEFAULT '{}';
       2. Backfill existing rows (estimated: 2.3s for 50k rows)
       3. No downtime required (additive change)
       Rollback: ALTER TABLE agents DROP COLUMN config;
       [Full migration script with safety checks]
```
