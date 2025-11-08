# Issue Labels Structure

This document defines the label structure for organizing OSSA issues.

## Component Labels

Labels that identify which part of OSSA is affected:

- `component:spec` - Specification changes (JSON Schema, spec definition)
- `component:cli` - CLI tooling (ossa command, validation, generation)
- `component:examples` - Example improvements (new examples, example updates)
- `component:docs` - Documentation (wiki, README, guides)
- `component:validation` - Validation service (schema validation logic)
- `component:migration` - Migration tooling (version migration, framework migration)
- `component:types` - TypeScript types and type definitions
- `component:build` - Build system and CI/CD

## Type Labels

Labels that identify the type of issue:

- `type:bug` - Bug reports
- `type:feature` - New features
- `type:enhancement` - Improvements to existing features
- `type:documentation` - Documentation updates
- `type:question` - Questions and support requests
- `type:discussion` - Discussion and RFCs

## Priority Labels

Labels that indicate issue priority:

- `priority:p0` - Critical (blocks release, security issues)
- `priority:p1` - High (important features, significant bugs)
- `priority:p2` - Medium (normal priority)
- `priority:p3` - Low (nice to have, minor improvements)

## Status Labels

Labels that indicate issue status:

- `status:needs-triage` - Needs initial review
- `status:needs-info` - Waiting for more information
- `status:in-progress` - Currently being worked on
- `status:blocked` - Blocked by another issue
- `status:ready-for-review` - Ready for code review

## Audience Labels

Labels that identify target audience:

- `audience:students` - For students and researchers
- `audience:developers` - For developers
- `audience:architects` - For architects and platform engineers
- `audience:enterprises` - For enterprises

## Usage Guidelines

### Label Combinations

Issues should typically have:
- **One** component label
- **One** type label
- **One** priority label
- **Zero or one** status label (if applicable)
- **Zero or one** audience label (if applicable)

### Examples

- `component:cli` + `type:bug` + `priority:p1` - High priority CLI bug
- `component:docs` + `type:documentation` + `priority:p2` + `audience:developers` - Developer documentation update
- `component:spec` + `type:feature` + `priority:p0` - Critical specification feature

## Creating Labels in GitLab

To create these labels in GitLab:

1. Go to **Settings** → **Labels**
2. Click **New label**
3. Enter label name (e.g., `component:spec`)
4. Choose color (suggested colors below)
5. Add description

### Suggested Colors

- **Component labels**: Blue shades (`#428BCA`, `#5CB85C`, etc.)
- **Type labels**: Green shades (`#5CB85C`, `#5BC0DE`, etc.)
- **Priority labels**: Red/Orange/Yellow (`#D9534F`, `#F0AD4E`, `#FFC107`)
- **Status labels**: Gray/Purple (`#999999`, `#9E9E9E`, etc.)
- **Audience labels**: Purple/Teal (`#9C27B0`, `#009688`, etc.)

## Migration

When migrating existing issues:

1. Review each issue
2. Apply appropriate component label
3. Apply appropriate type label
4. Apply appropriate priority label
5. Add status/audience labels if applicable
6. Update issue description with label explanation if needed

