# Audit Rules Catalog

Standard catalog of **Agent Audit Rules** for AI-generated code quality. Consumed by Dragonfly and other audit engines to report "Areas of Improvement" (security, performance, accessibility, best-practices, syntax).

- **Schema:** `schema.json` (single rule), `catalog.schema.json` (index).
- **Index:** `index.yaml` lists rule ids and file paths.
- **Rules:** `rules/*.yaml` — one file per rule (id, description, anti_pattern, fix_suggestion, severity, dimension, target_languages, tags).

Engines should: load `index.yaml`, resolve each rule from `rules/<id>.yaml` (or by convention `rules/<id>.yaml` from rule id), validate against `schema.json`, then run patterns against code/diffs.
