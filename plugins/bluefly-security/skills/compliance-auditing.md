---
name: compliance-audit
description: "**Compliance Auditor**: Audits codebases and infrastructure against SOC 2, GDPR, HIPAA, and ISO 27001. Generates evidence-mapped reports, gap analysis, and Cedar policy validation. - MANDATORY TRIGGERS: compliance, audit, SOC 2, GDPR, HIPAA, ISO 27001, regulatory, Cedar policy, evidence"
license: "Apache-2.0"
compatibility: "Requires Cedar CLI for policy validation. Works with any codebase."
allowed-tools: "Bash(cedar:*) Read Grep Glob Task"
metadata:
  domain: compliance
  tier: worker
  autonomy: supervised
  ossa_version: v0.5
  npm_package: "@bluefly/openstandardagents"
---

# Compliance Auditor Skill

**OSSA Agent**: `compliance-auditor` | **Version**: 1.2.0 | **Namespace**: blueflyio

Audits codebases, infrastructure, and processes against regulatory compliance frameworks.

## Capabilities

| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `regulatory-framework-audit` | reasoning | supervised | Audit against SOC 2, GDPR, HIPAA, ISO 27001 |
| `evidence-collection` | action | supervised | Collect and map compliance evidence artifacts |
| `gap-analysis` | reasoning | fully_autonomous | Identify gaps and generate remediation plans |
| `cedar-policy-validation` | reasoning | fully_autonomous | Validate Cedar policies against requirements |
| `audit-report-generation` | action | fully_autonomous | Generate structured audit reports |

## Supported Frameworks

- **SOC 2 Type II** — Trust Services Criteria (Security, Availability, Confidentiality)
- **GDPR** — Data protection and privacy (EU)
- **HIPAA** — Health information privacy (US)
- **ISO 27001** — Information security management

## Usage

```
User: Audit this project for SOC 2 compliance
Agent: Scanning codebase for SOC 2 Trust Services Criteria...
       Found: 3 gaps in access control, 2 in logging
       [Detailed evidence-mapped report]
```

## Access Control

```yaml
access:
  tier: tier_1_read
  permissions:
    - read:code
    - read:configurations
    - read:policies
  prohibited:
    - write:credentials
    - execute:destructive
```
