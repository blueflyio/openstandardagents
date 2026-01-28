# GitLab Duo Agent Platform - OSSA Integration

**PUBLIC** - This integration can be used by ANY GitLab project for OSSA validation

## Overview

This repository includes a complete GitLab Duo Agent Platform integration for validating OSSA (Open Standard for Software Agents) manifests. The integration provides:

✅ **Automated Validation** - Automatically validate OSSA manifests on every push/MR
✅ **AI-Powered Features** - Duo Code Suggestions, AI MR Summaries, Knowledge Graph
✅ **Production-Ready** - Used in production for the OSSA specification itself
✅ **Public & Reusable** - Copy to your project and start using immediately

## Quick Start

### 1. Enable OSSA Validation in Your Project

**Option A: Remote Include (Recommended)**

Add to your `.gitlab-ci.yml`:

```yaml
include:
  # OSSA Agent for validation
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/agents/ossa-validator/config.yaml'

  # OSSA Flow for orchestration
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/workflows/ossa-validation-flow.yaml'

  # OSSA Trigger for file detection
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/triggers/ossa-agent-files.yaml'
```

**Option B: Copy Files Locally**

```bash
# Copy agent, flow, and trigger to your project
mkdir -p .gitlab/agents/ossa-validator
mkdir -p .gitlab/workflows
mkdir -p .gitlab/triggers

curl -o .gitlab/agents/ossa-validator/config.yaml \
  https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/agents/ossa-validator/config.yaml

curl -o .gitlab/workflows/ossa-validation-flow.yaml \
  https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/workflows/ossa-validation-flow.yaml

curl -o .gitlab/triggers/ossa-agent-files.yaml \
  https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/triggers/ossa-agent-files.yaml

# Commit and push
git add .gitlab/
git commit -m "feat: add OSSA validation with GitLab Duo Agent Platform"
git push
```

### 2. Test the Integration

Create a test OSSA manifest:

```bash
# Create a sample agent
cat > my-agent.ossa.yaml <<EOF
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: my-test-agent
  version: 1.0.0
  description: "Test agent for OSSA validation"
spec:
  access_tier: tier_1_read
  capabilities:
    - name: read_files
      description: "Read files from repository"
EOF

# Commit and push
git add my-agent.ossa.yaml
git commit -m "feat: add test agent"
git push
```

The validation will run automatically! Check the pipeline to see results.

### 3. Enable GitLab Duo Features (Optional)

Enable AI-powered features for enhanced developer experience:

```yaml
# Add to .gitlab-ci.yml
include:
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/ci/duo-platform-features.yml'

# Your jobs can now extend Duo templates:
my:validation:job:
  extends:
    - .ai_mr_summary_template      # AI-powered MR summaries
    - .value_stream_analytics       # DORA metrics tracking
    - .knowledge_graph_config       # Semantic code search
  script:
    - echo "Your validation here"
```

## Components

### 1. OSSA Validator Agent

**Location**: `.gitlab/agents/ossa-validator/config.yaml`

The validator agent checks OSSA manifests against schemas and best practices.

**Features:**
- ✅ Schema validation (OSSA v0.3.0 through v0.3.3)
- ✅ Access tier validation
- ✅ Separation of duties enforcement
- ✅ Taxonomy classification validation
- ✅ Security policy validation
- ✅ Best practices checking

**File Patterns Validated:**
- `**/*.ossa.yaml`
- `**/*.ossa.yml`
- `**/.agent`
- `**/agent.json`
- `**/agent.yaml`
- `.gitlab/agents/**/config.yaml`

**Configuration:**

```yaml
# Customize validation behavior
environment:
  OSSA_SCHEMA_REGISTRY: "https://openstandardagents.com/schemas"
  VALIDATION_LEVEL: "strict"  # strict, normal, or permissive
  TAXONOMY_VALIDATION: "true"
  SECURITY_VALIDATION: "true"
```

### 2. OSSA Validation Flow

**Location**: `.gitlab/workflows/ossa-validation-flow.yaml`

Orchestrates the complete validation workflow across multiple stages.

**Stages:**
1. **detect_ossa_files** - Find OSSA manifests in changed files
2. **validate_schema** - Validate against OSSA schema
3. **validate_access_tiers** - Check access tier definitions
4. **validate_separation_of_duties** - Enforce separation rules
5. **validate_taxonomy** - Check taxonomy classifications
6. **validate_security** - Validate security policies
7. **validate_best_practices** - Check OSSA best practices
8. **aggregate_results** - Combine all validation results
9. **generate_report** - Create detailed validation report
10. **post_mr_comment** - Post results to merge request
11. **update_knowledge_graph** - Update GitLab Knowledge Graph

**Inputs:**

```yaml
inputs:
  schema_version: "0.3.3"      # OSSA schema version
  validation_level: "strict"   # Strictness level
  fail_fast: false             # Stop on first error
  post_mr_comment: true        # Post results to MR
```

**Outputs:**

```yaml
outputs:
  validation_result: "pass"    # Overall result
  errors_found: 0              # Number of errors
  warnings_found: 2            # Number of warnings
  report_url: "..."            # Link to report
```

### 3. OSSA Agent Files Trigger

**Location**: `.gitlab/triggers/ossa-agent-files.yaml`

Automatically detects changes to OSSA agent files and triggers validation.

**Trigger Events:**
- Push to any branch
- Merge request opened/updated
- Scheduled (optional, disabled by default)

**File Patterns:**
- `**/*.ossa.yaml`
- `**/*.ossa.yml`
- `**/.agent`
- `**/agent.json`
- `**/agent.yaml`
- `.gitlab/agents/**/config.yaml`

**Skip Validation:**

```bash
# Use commit message to skip
git commit -m "docs: update README [skip ossa]"
```

**Customize:**

```yaml
# Exclude certain paths
filters:
  exclude_paths:
    - '**/examples/**/*.yaml'
    - '**/test/fixtures/**'
```

## GitLab Duo Features

### Duo Code Suggestions

**What**: AI-powered code completion as you type

**How to Enable:**
1. Ensure GitLab Ultimate license is active
2. Settings > General > Duo > Enable Code Suggestions
3. Install GitLab Workflow extension in your IDE
4. Start coding - suggestions appear automatically

**Configuration:**

```yaml
duo_code_suggestions:
  variables:
    DUO_CODE_SUGGESTIONS_ENABLED: "true"
    DUO_CODE_SUGGESTIONS_LANGUAGES: "typescript,javascript,yaml,json"
    DUO_CODE_SUGGESTIONS_FROM_COMMENTS: "true"
```

**Example:**

```yaml
# Type a comment describing what you want:
# Create a tier_2_write_limited agent that validates schemas

# Duo generates:
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: schema-validator
  version: 1.0.0
  description: "Validates schemas"
spec:
  access_tier: tier_2_write_limited
  capabilities:
    - name: validate_schema
      description: "Validate JSON schemas"
```

### AI-Powered MR Summaries

**What**: Automatically generate merge request descriptions

**How to Use:**
1. Create a merge request
2. AI automatically analyzes changes
3. Summary appears in MR description
4. Review and edit if needed

**Configuration:**

```yaml
extends: .ai_mr_summary_template

variables:
  AI_MR_SUMMARY_INCLUDE_CHANGES: "true"
  AI_MR_SUMMARY_INCLUDE_IMPACT: "true"
  AI_MR_SUMMARY_INCLUDE_RISKS: "true"
  AI_MR_SUMMARY_SUGGEST_REVIEWERS: "true"
```

**Example Summary:**

```markdown
## Summary
This MR adds OSSA validation for tier_3_full_access agents.

## Changes
- Added schema validation for tier_3 access tier
- Updated separation of duties rules
- Enhanced security policy validation

## Impact
- Affects all tier_3 agents (estimated 15 manifests)
- No breaking changes to existing agents
- Improves security posture

## Suggested Reviewers
- @security-team (security policy changes)
- @agent-platform (OSSA schema changes)
```

### Value Stream Analytics

**What**: Track development workflow efficiency and DORA metrics

**Metrics Tracked:**
- ⏱️ Lead time for changes
- 🚀 Deployment frequency
- 🔧 Time to restore service
- ❌ Change failure rate

**How to View:**
1. Navigate to: Project > Analytics > Value Stream Analytics
2. View metrics dashboard
3. Identify bottlenecks
4. Optimize based on data

**Configuration:**

```yaml
extends: .value_stream_analytics

variables:
  VSA_DORA_DEPLOYMENT_FREQUENCY: "true"
  VSA_DORA_LEAD_TIME: "true"
  VSA_DORA_TIME_TO_RESTORE: "true"
  VSA_DORA_CHANGE_FAILURE_RATE: "true"
```

**Example Metrics:**

```
Deployment Frequency: 3.2 per day (Elite)
Lead Time: 45 minutes (Elite)
Time to Restore: 15 minutes (Elite)
Change Failure Rate: 8% (Elite)
```

### Knowledge Graph

**What**: Semantic code search powered by AI

**How to Use:**
1. Search bar in GitLab UI
2. Type natural language query
3. Get semantic search results
4. Click to navigate to code

**Example Queries:**

```
"Where is OSSA schema validation handled?"
→ Points to validation-jobs.yml and ossa-validator agent

"Show me all tier_2_write_limited agents"
→ Lists all tier_2 agents in the project

"Find code that handles separation of duties"
→ Shows separation validation logic
```

**Configuration:**

```yaml
extends: .knowledge_graph_config

variables:
  KNOWLEDGE_GRAPH_INDEX_PATTERNS: |
    **/*.ts
    **/*.yaml
    **/*.ossa.yaml
    AGENTS.md
  KNOWLEDGE_GRAPH_SIMILARITY_THRESHOLD: "0.8"
```

### Duo Chat

**What**: Conversational AI for code assistance

**How to Use:**
1. Open Duo Chat sidebar in GitLab UI
2. Ask questions about your codebase
3. Get AI-powered answers with code examples

**Example Questions:**

```
Q: "How do I create a tier_1_read agent?"

A: To create a tier_1_read agent, use this template:

apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
  description: "Your agent description"
spec:
  access_tier: tier_1_read
  capabilities:
    - name: read_repository
      description: "Read files"
  permissions:
    repository:
      - read

Tier 1 agents can only read, not write or approve.
```

## Validation Levels

Choose the right validation strictness for your project:

### Strict (Recommended for Production)

```yaml
VALIDATION_LEVEL: "strict"
```

- ✅ All rules enforced
- ✅ No warnings allowed
- ✅ Breaking changes blocked
- ✅ Best practices required

**Use when:**
- Production agents
- Public APIs
- Security-critical systems

### Normal (Default)

```yaml
VALIDATION_LEVEL: "normal"
```

- ✅ Required rules enforced
- ⚠️ Best practices warned
- ⚠️ Deprecations warned
- ✅ Breaking changes blocked

**Use when:**
- Internal tools
- Development environments
- Gradual adoption

### Permissive (For Migration)

```yaml
VALIDATION_LEVEL: "permissive"
```

- ⚠️ All violations warned
- ✅ Nothing blocked
- 📝 Detailed feedback provided

**Use when:**
- Migrating from older OSSA versions
- Learning OSSA standards
- Experimental projects

## Schema Versions

Validate against specific OSSA schema versions:

```yaml
OSSA_SCHEMA_VERSION: "0.3.3"  # Latest (recommended)
```

**Supported versions:**
- `0.3.3` (Latest) - Taxonomy, enhanced security
- `0.3.2` - Separation of duties, access tiers
- `0.3.1` - Enhanced metadata
- `0.3.0` - Initial OSSA specification

## Examples

### Example 1: Basic Validation

```yaml
# .gitlab-ci.yml
include:
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/triggers/ossa-agent-files.yaml'
```

That's it! Validation runs automatically on push/MR.

### Example 2: Custom Validation Level

```yaml
include:
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/triggers/ossa-agent-files.yaml'

variables:
  OSSA_VALIDATION_LEVEL: "normal"
  OSSA_SCHEMA_VERSION: "0.3.2"
```

### Example 3: MR Validation Only

```yaml
validate:ossa:mr:
  trigger:
    include:
      - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/workflows/ossa-validation-flow.yaml'
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

### Example 4: Full Duo Integration

```yaml
include:
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/triggers/ossa-agent-files.yaml'
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/ci/duo-platform-features.yml'

validate:ossa:
  extends:
    - .duo_ossa_integration  # All Duo features enabled
  script:
    - npx @bluefly/compliance-engine validate-ossa
```

## Troubleshooting

### Validation Not Running

**Problem**: OSSA validation doesn't trigger on push/MR

**Solutions:**
1. Check file patterns match your agent files
2. Verify `.gitlab/workflows/ossa-validation-flow.yaml` exists
3. Ensure GitLab Duo Agent Platform is enabled (Settings > General > Duo)
4. Check CI/CD pipeline logs for errors

### Validation Failing

**Problem**: Validation fails with errors

**Solutions:**
1. Review error messages in MR comments or pipeline logs
2. Check OSSA schema version matches your manifests
3. Try lowering validation level (strict → normal → permissive)
4. Validate manually:
   ```bash
   npx @bluefly/compliance-engine validate-ossa my-agent.ossa.yaml
   ```

### Too Many False Positives

**Problem**: Validation reports too many warnings/errors

**Solutions:**
1. Use `VALIDATION_LEVEL: "permissive"` for gradual adoption
2. Exclude non-production paths:
   ```yaml
   filters:
     exclude_paths:
       - '**/examples/**'
       - '**/test/fixtures/**'
   ```
3. Upgrade to latest OSSA schema version
4. Open issue at: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues

### Duo Features Not Working

**Problem**: Duo Code Suggestions or AI MR Summaries not working

**Solutions:**
1. Verify GitLab Ultimate license is active
2. Enable in Settings > General > Duo
3. Check browser console for errors
4. Try incognito/private browsing mode
5. Clear browser cache
6. Contact GitLab support

## Migration Guide

### From Manual Validation

**Before:**

```yaml
validate:ossa:
  script:
    - npm install -g @bluefly/compliance-engine
    - ossa validate **/*.ossa.yaml
```

**After:**

```yaml
include:
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/triggers/ossa-agent-files.yaml'

# That's it! Validation runs automatically
```

**Benefits:**
- ✅ Automatic validation on every push/MR
- ✅ Consistent validation across team
- ✅ No need to remember to run validation
- ✅ Immediate feedback in MRs
- ✅ AI-powered features included

### From OSSA v0.3.0/v0.3.1

**Update your manifests:**

```yaml
# Before (v0.3.0)
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: my-agent
spec:
  permissions:
    - read
    - write

# After (v0.3.3)
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0  # Required in v0.3.3
  description: "Agent description"  # Required in v0.3.3
spec:
  access_tier: tier_3_full_access  # New in v0.3.2
  capabilities:
    - name: read_write
      description: "Read and write access"
  permissions:
    repository:
      - read
      - write
```

**Migration steps:**
1. Set `OSSA_SCHEMA_VERSION: "0.3.0"` initially
2. Run validation to see what needs updating
3. Fix validation errors incrementally
4. Increase schema version: `0.3.0` → `0.3.1` → `0.3.2` → `0.3.3`
5. Use `VALIDATION_LEVEL: "permissive"` during migration

## Support

### Documentation

- **OSSA Specification**: https://openstandardagents.com
- **GitLab Duo Docs**: https://docs.gitlab.com/ee/user/duo/
- **Agent Platform**: https://docs.gitlab.com/user/duo_agent_platform/
- **Value Stream Analytics**: https://docs.gitlab.com/ee/user/group/value_stream_analytics/

### Community

- **Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- **Discussions**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/discussions
- **Examples**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/tree/main/examples

### Contributing

This is a PUBLIC project! Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a merge request
5. Include tests and documentation

### License

MIT - Use freely in your projects!

## Credits

Created by the BlueFly Agents Platform team.

Powered by:
- GitLab Duo Agent Platform
- OSSA (Open Standard for Software Agents)
- GitLab Ultimate features

---

**Need help?** Open an issue at https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
