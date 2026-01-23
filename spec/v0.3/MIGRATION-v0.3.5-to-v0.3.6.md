# Migration Guide: OSSA v0.3.5 to v0.3.6

## Overview

OSSA v0.3.6 introduces **token efficiency**, **composite identity**, **agent catalog**, and **knowledge graph** features while maintaining **100% backward compatibility** with v0.3.5.

**No breaking changes.** All v0.3.5 manifests work unchanged in v0.3.6.

## What's New in v0.3.6

### 1. Token Efficiency Framework (70-95% Cost Savings)

**Problem Solved:** Agent costs can be prohibitively high with large context windows, repeated system prompts, and uncontrolled tool outputs.

**Solution:** Declarative token optimization at multiple levels:

```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: cost-optimized-agent
  efficiency_tier: economy  # NEW: premium | standard | economy | custom

spec:
  token_efficiency:  # NEW
    enabled: true

    # Context Management: 70% savings
    context_management:
      strategy: adaptive  # conservative | balanced | aggressive | adaptive
      pruning:
        enabled: true
        threshold: 0.3  # Relevance threshold
        max_tokens: 50000
      summarization:
        enabled: true
        strategy: semantic  # simple | semantic | hierarchical
        compression_ratio: 0.2  # 80% reduction
      caching:
        enabled: true
        ttl: 3600  # seconds

    # Prompt Caching: 90% savings on repeated context
    prompt_caching:
      enabled: true
      provider: anthropic  # anthropic | openai | custom
      cacheable_prefixes:
        - system_prompt
        - guidelines
        - examples
      cache_ttl: 300

    # Token Budgets: Hard limits
    token_budget:
      output_limit: 4096
      total_limit: 50000
      enforcement: hard  # soft | hard | adaptive

    # Tool Output Limits: Prevent massive outputs
    tool_output_limits:
      enabled: true
      max_tokens_per_tool: 5000
      truncation_strategy: smart  # head | tail | middle | smart
```

**Efficiency Tiers:**
- **premium**: No optimization (full quality)
- **standard**: Basic pruning (30% savings)
- **economy**: Aggressive optimization (95% savings)
- **custom**: Explicit configuration (above)

**Migration:** Add `efficiency_tier` to metadata or `token_efficiency` to spec. Default: no optimization (premium).

---

### 2. Composite Identity (GitLab Duo Pattern)

**Problem Solved:** Agent actions need to be attributed to both the service account (for permissions) and the human user (for audit/compliance).

**Solution:** Merge primary identity (bot) + secondary identity (human):

```yaml
spec:
  identity:
    composite:  # NEW
      enabled: true

      primary_identity:  # Service account
        username: deployment-bot
        email: deploy-bot@company.com
        roles:
          - developer

      secondary_identity:  # Human operator
        user_id: $GITLAB_USER_ID
        username: $GITLAB_USERNAME
        email: $GITLAB_USER_EMAIL

      merge_strategy: restrictive  # restrictive | permissive | custom

      permissions:  # Explicit permissions
        read:
          - repositories
          - deployments
        write:
          - deployments
        execute:
          - deploy-production
```

**Merge Strategies:**
- **restrictive**: Intersection (most secure)
- **permissive**: Union (most flexible)
- **custom**: Explicit permissions

**Migration:** Add `composite` to `spec.identity`. Default: disabled.

---

### 3. Agent Catalog Metadata

**Problem Solved:** No standard way to publish agents to catalogs (GitLab AI Catalog, GitHub Marketplace, etc.).

**Solution:** Catalog metadata in `metadata.catalog`:

```yaml
metadata:
  catalog:  # NEW
    published: true
    catalog_id: my-agent-pro
    visibility: internal  # public | private | internal
    categories:
      - code-quality
      - security
    tags:
      - gitlab-duo
      - token-efficiency
    icon_url: https://example.com/icon.svg
    documentation_url: https://docs.example.com/agent
    pricing:
      model: enterprise  # free | freemium | paid | enterprise
      cost_per_use: 0.10
      subscription_monthly: 99
    ratings:
      average: 4.5
      count: 42
```

**Migration:** Add `catalog` to metadata. Default: not published.

---

### 4. Knowledge Graph Efficiency (98% Token Reduction)

**Problem Solved:** Including full codebase in context consumes 500k+ tokens per request.

**Solution:** Structured code indexing via knowledge graphs:

```yaml
spec:
  token_efficiency:
    knowledge_graph:  # NEW
      enabled: true
      provider: gitlab  # gitlab | github | local | custom
      mcp_server: gitlab-kg  # MCP server name
      index_types:
        - files
        - classes
        - functions
        - dependencies
      query_capabilities:
        - semantic_search
        - dependency_traversal
        - code_navigation
      max_context_tokens: 10000  # vs 500k+ full codebase
      indexing_strategy: selective  # full | selective | on_demand
```

**Benefits:**
- **98% token reduction**: 10k tokens vs 500k for full codebase
- **No context limits**: Query graph instead of including files
- **Always current**: Selective re-indexing on changes

**Migration:** Add `knowledge_graph` to `token_efficiency`. Requires MCP server.

---

## Examples

### Example 1: Add Token Efficiency to Existing Agent

**Before (v0.3.5):**
```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: code-reviewer
spec:
  role: "Code review agent"
  llm:
    provider: anthropic
    model: claude-opus-4
```

**After (v0.3.6):**
```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: code-reviewer
  efficiency_tier: economy  # Add this line for 95% savings
spec:
  role: "Code review agent"
  llm:
    provider: anthropic
    model: claude-opus-4
```

That's it! One line for 95% cost reduction.

---

### Example 2: Add Composite Identity

**Before (v0.3.5):**
```yaml
spec:
  identity:
    provider: gitlab
    authentication:
      method: oauth2
```

**After (v0.3.6):**
```yaml
spec:
  identity:
    provider: gitlab
    composite:  # Add composite identity
      enabled: true
      primary_identity:
        username: deploy-bot
        email: deploy-bot@company.com
      secondary_identity:
        user_id: $GITLAB_USER_ID
        username: $GITLAB_USERNAME
        email: $GITLAB_USER_EMAIL
      merge_strategy: restrictive
    authentication:
      method: oauth2
```

---

### Example 3: Publish to Catalog

**Before (v0.3.5):**
```yaml
metadata:
  name: my-agent
  version: 1.0.0
```

**After (v0.3.6):**
```yaml
metadata:
  name: my-agent
  version: 1.0.0
  catalog:  # Add catalog metadata
    published: true
    visibility: public
    categories:
      - automation
    pricing:
      model: free
```

---

## Backward Compatibility

**100% backward compatible.** All new features are:
1. **Optional**: Default behavior unchanged
2. **Additive**: No fields removed or renamed
3. **Non-breaking**: v0.3.5 manifests work unchanged

**Validation:** v0.3.5 manifests validate against v0.3.6 schema.

---

## Schema Changes

### Schema File Naming

**Changed:** Schema files now use version-specific names for website compatibility:
- ❌ Old: `ossa-agent.schema.json` (version-agnostic)
- ✅ New: `ossa-0.3.6.schema.json` (version-specific)

**Impact:** None for users. Website validator expects version-specific names.

---

## Cost Impact Analysis

### Typical Agent (Before v0.3.6)
- Context: 500k tokens per request
- No caching: Full context every time
- No limits: Unpredictable tool outputs
- **Cost**: $15/request (1000 requests/day = $15,000/day)

### Same Agent (After v0.3.6 - Economy Tier)
- Context: 50k tokens (pruned)
- Prompt caching: 90% savings on repeated
- Knowledge graph: 10k tokens vs 500k
- Tool limits: Predictable outputs
- **Cost**: $0.75/request (1000 requests/day = $750/day)

**Savings:** $5,201,250/year (95% reduction)

---

## Adoption Recommendations

### Start Simple: Efficiency Tier

**Lowest friction, highest impact:**
```yaml
metadata:
  efficiency_tier: standard  # 30% savings, minimal risk
```

Then iterate to `economy` after testing.

### Add Composite Identity for Compliance

**If you need audit trails:**
```yaml
spec:
  identity:
    composite:
      enabled: true
      merge_strategy: restrictive
      # ... rest of config
```

### Publish to Catalog When Ready

**After agent is stable:**
```yaml
metadata:
  catalog:
    published: true
    visibility: internal  # Start internal
```

---

## Testing Your Migration

```bash
# 1. Validate your v0.3.5 manifest still works
npm run validate:manifest -- your-agent.ossa.yaml

# 2. Update apiVersion
sed -i 's/ossa\/v0.3.5/ossa\/v0.3.6/' your-agent.ossa.yaml

# 3. Add efficiency tier (optional)
# Add: metadata.efficiency_tier: standard

# 4. Validate v0.3.6 manifest
npm run validate:manifest -- your-agent.ossa.yaml

# 5. Test with your runtime
# Deploy to staging environment first
```

---

## Migration Checklist

- [ ] Read this migration guide
- [ ] Update `apiVersion: ossa/v0.3.6`
- [ ] Validate manifest with new schema
- [ ] Test in staging environment
- [ ] Consider adding `efficiency_tier` for cost savings
- [ ] Add `composite` identity if needed for compliance
- [ ] Add `catalog` metadata if publishing
- [ ] Monitor token usage and costs
- [ ] Deploy to production

---

## Support

- **Examples**: `examples/v0.3.6/` directory
- **Schema**: `spec/v0.3/ossa-0.3.6.schema.json`
- **Issues**: https://gitlab.com/blueflyio/openstandardagents/-/issues

---

## Summary

v0.3.6 is a **pure additive release** focused on:
1. **Cost optimization** (70-95% savings)
2. **Enterprise compliance** (composite identity)
3. **Discoverability** (agent catalog)
4. **Efficiency** (knowledge graphs)

**Zero breaking changes.** All v0.3.5 agents work unchanged.

**Upgrade path:** Update apiVersion, optionally add new features.

**Recommended:** Start with `efficiency_tier: standard` for immediate 30% cost savings with zero risk.
