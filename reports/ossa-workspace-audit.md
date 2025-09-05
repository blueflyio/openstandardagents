# OSSA Workspace .agents Audit Report

**Date:** 2025-09-05  
**Workspace:** `/Users/flux423/Sites/LLM`  
**Total .agents directories:** 57

## Issues Found

### 🚨 Critical Issues
1. **Nested .agents directories** (3 found):
   - `/all_drupal_custom/modules/ai_agentic_workflows/.agents/.agents`
   - `/all_drupal_custom/modules/gov_compliance/.agents/.agents`
   - `/all_drupal_custom/modules/code_executor/.agents/.agents`

### 📊 Distribution
- **Common NPM Packages:** 23 .agents directories
- **Drupal Modules:** 19 .agents directories  
- **Models:** 3 .agents directories
- **Other locations:** 12 .agents directories

## Cleanup Plan

### Phase 1: Fix Nested .agents
- Merge nested .agents/.agents into single .agents
- Preserve all agent definitions
- Remove duplicate structures

### Phase 2: Standardize Structure
- Ensure each .agents has proper agents in subdirectories
- Standardize agent.yml filenames
- Add missing README.md files

### Phase 3: Deduplicate
- Identify duplicate agents across projects
- Consolidate common agents
- Update registries

### Phase 4: Optimize
- Remove empty .agents directories
- Clean up non-agent files
- Generate compliance reports per project