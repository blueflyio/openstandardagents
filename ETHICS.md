# Ethical compliance statement

This project follows ethical-by-design principles for agentic systems, aligned with [ECMA-434](https://ecma-international.org/wp-content/uploads/ECMA-434_1st_edition_december_2025.pdf) (Security profiles for Natural Language Interaction Protocol) and the [Ethics Guidelines for Trustworthy AI](https://www.europarl.europa.eu/cmsdata/196377/AI%20HLEG_Ethics%20Guidelines%20for%20Trustworthy%20AI.pdf) (EU High-Level Expert Group).

---

## 1. Transparency and disclosure

- We clearly state when users or systems are interacting with OSSA-defined agents (spec, tooling, and exported runtimes).
- We document what the OSSA spec and CLI do, what they do not do, and known limitations in the [README](README.md), [docs](docs/), and [GitLab Wiki](https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/home).

## 2. User control

- The spec supports **off switch and override**: `spec.autonomy` (level, `approval_required`, `allowed_actions`, `blocked_actions`) lets deployers define human-in-the-loop and escalation.
- Configurable defaults and behaviours are documented in the schema and guides; deployers choose autonomy level and governance policies.

## 3. Privacy and data handling

- OSSA manifests do not require personal data in the repo; secrets and credentials are referenced via env or secret managers.
- Schema supports data governance (e.g. compliance, retention, PII handling) and observability (audit logs, retention). Data collection and storage are the responsibility of runtime implementations; we document patterns in docs and examples.

## 4. Fairness and accessibility

- We aim for inclusive contribution (see [CONTRIBUTING](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md)).
- Export adapters and examples are tested with diverse inputs where applicable; we encourage deployers to test agents for bias and accessibility.

## 5. Safety and robustness

- We validate manifests for security (e.g. no hardcoded secrets, auth on tool endpoints) via the security validator.
- Threat categories in the spec include prompt-injection, privilege-escalation, and information-disclosure; deployers are encouraged to add runtime safeguards (filters, sandboxing, audit).

## 6. Accountability

- Security and vulnerability reporting: [SECURITY.md](SECURITY.md).
- Ethical or user-experience concerns: open an issue or use the contact below. We track changes in [CHANGELOG](CHANGELOG.md) and encourage contributors to flag privacy, fairness, or safety issues in CONTRIBUTING.

---

## Contact

For ethical or trust-related questions: **ethics@openstandardagents.org** (or open an issue on the [GitLab project](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)).
