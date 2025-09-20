#!/usr/bin/env node

/**
 * Enhanced BuildKit Setup Installation for OSSA
 * Installs comprehensive branching workflow and token optimization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper function to ensure directory exists
function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper function to write JSON
function writeJsonSync(filePath, data, options = {}) {
  const spaces = options.spaces || 0;
  fs.writeFileSync(filePath, JSON.stringify(data, null, spaces));
}

console.log('🚀 Installing Agent BuildKit Enhanced Setup on OSSA...\n');

const projectPath = process.cwd();
console.log(`📁 Project: ${path.basename(projectPath)}`);

try {
  // 1. Create .buildkit directory
  const buildkitDir = path.join(projectPath, '.buildkit');
  ensureDirSync(buildkitDir);
  console.log('✅ Created .buildkit directory');

  // 2. Install branching workflow specification
  console.log('🌿 Installing branching & CI workflow enforcement...');
  
  const branchingSpec = {
    version: '1.0.0',
    enabled: true,
    workflow: {
      feature_branches_only: true,
      ci_driven_development: true,
      no_direct_development_commits: true,
      main_branch_protection: true
    },
    branch_naming: {
      patterns: {
        feature: 'feature/<scope-kebab-case>',
        fix: 'fix/<scope-kebab-case>',
        chore: 'chore/<scope-kebab-case>',
        bot: 'bot/<agent-name>/<task>'
      },
      validation: {
        enforce_naming: true,
        reject_version_numbers: true,
        require_kebab_case: true
      }
    },
    ci_rules: {
      target_branch: 'development',
      require_approval: true,
      auto_fast_forward: true,
      pipeline_success_required: true
    },
    protection: {
      block_direct_development_push: true,
      block_direct_main_push: true,
      quarantine_deleted_branches: true,
      backup_on_conflicts: true
    },
    token_optimization: {
      agent_first_policy: true,
      prevent_manual_coding_over_500_tokens: true,
      require_agent_justification: true,
      track_token_usage: true
    }
  };
  
  writeJsonSync(
    path.join(buildkitDir, 'branching-workflow.json'),
    branchingSpec,
    { spaces: 2 }
  );
  console.log('✅ Installed branching workflow specification');

  // 3. Install GitLab CI template with golden workflow
  console.log('🏗️ Installing GitLab CI with golden workflow integration...');
  
  const gitlabCITemplate = `# GitLab CI - Agent BuildKit Enhanced Pipeline
# Uses golden workflow component for enterprise-grade CI/CD

include:
  - component: gitlab.bluefly.io/llm/gitlab_components/workflow/golden@v0.1.0
    inputs:
      project_name: "\${CI_PROJECT_NAME}"
      enable_auto_flow: true
      enable_comprehensive_testing: true
      enable_security_scanning: true
      test_coverage_threshold: 80
      enable_agent_buildkit_validation: true
      branch_protection_enabled: true

variables:
  # Agent BuildKit Configuration
  BUILDKIT_ENABLED: "true"
  BUILDKIT_TOKEN_OPTIMIZATION: "true"
  BUILDKIT_BRANCH_ENFORCEMENT: "true"
  
  # Branch Protection
  DEVELOPMENT_BRANCH_PROTECTED: "true"
  MAIN_BRANCH_PROTECTED: "true"
  FEATURE_BRANCH_REQUIRED: "true"

stages:
  - validate
  - test
  - security
  - build
  - deploy

# Agent BuildKit Branch Validation
buildkit:branch-validation:
  stage: validate
  image: node:18-alpine
  script:
    - npm install -g @bluefly/agent-build-kit
    - buildkit hooks validate git "branch --show-current"
    - |
      BRANCH=$(git branch --show-current)
      case "$BRANCH" in
        feature/*|fix/*|chore/*|bot/*)
          echo "✅ Valid branch naming: $BRANCH"
          ;;
        development|main)
          echo "❌ Direct work on $BRANCH is not allowed"
          exit 1
          ;;
        *)
          echo "❌ Invalid branch naming: $BRANCH"
          echo "ℹ️  Use: feature/<scope>, fix/<scope>, chore/<scope>, or bot/<agent>/<task>"
          exit 1
          ;;
      esac
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH != "main" && $CI_COMMIT_BRANCH != "development"

# Token Optimization Check
buildkit:token-optimization:
  stage: validate
  image: node:18-alpine
  script:
    - npm install -g @bluefly/agent-build-kit
    - buildkit agents list --check-availability
    - echo "🤖 Verifying agent-first policy compliance"
    - |
      # Check if large changes should use agents instead
      CHANGED_LINES=$(git diff --stat HEAD~1 | tail -1 | grep -o '[0-9]\\+ insertions' | grep -o '[0-9]\\+' || echo "0")
      if [ "$CHANGED_LINES" -gt 500 ]; then
        echo "⚠️  Large changeset detected ($CHANGED_LINES lines)"
        echo "💡 Consider using buildkit agents for token optimization"
        echo "   Run: buildkit agents spawn --type worker --task 'large-refactor'"
      fi
  allow_failure: true
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# Prevent AI Attribution in Commits
buildkit:employment-protection:
  stage: validate
  image: alpine/git
  script:
    - |
      echo "🔍 Checking commits for AI attribution..."
      if git log --oneline -10 | grep -i -E "(claude|🤖|generated.*with|anthropic)"; then
        echo "❌ AI attribution detected in commit messages"
        echo "🚨 EMPLOYMENT RISK: Remove AI references from commit history"
        exit 1
      fi
      echo "✅ No AI attribution found"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
`;
  
  fs.writeFileSync(path.join(projectPath, '.gitlab-ci.yml'), gitlabCITemplate);
  console.log('✅ Installed GitLab CI with golden workflow integration');

  // 4. Create agent-first policy enforcement script
  console.log('🤖 Installing agent-first policy enforcement...');
  
  const agentFirstScript = `#!/bin/bash
# Agent-First Policy Enforcement
# Prevents token waste by encouraging agent usage

set -e

BUILDKIT_CONFIG=".buildkit/branching-workflow.json"
TOKEN_THRESHOLD=500

# Check if task should use agents
check_agent_first_policy() {
    local task_description="$1"
    local estimated_tokens="$2"
    
    echo "🔍 Analyzing task: $task_description"
    echo "📊 Estimated tokens: $estimated_tokens"
    
    if [ "$estimated_tokens" -gt "$TOKEN_THRESHOLD" ]; then
        echo "⚠️  LARGE TASK DETECTED (>$TOKEN_THRESHOLD tokens)"
        echo "💡 Recommendation: Use agents to prevent token waste"
        echo ""
        echo "Suggested commands:"
        echo "  buildkit agents list --search '$task_description'"
        echo "  buildkit agents spawn --type worker --task '$task_description'"
        echo "  buildkit agents coordinate --multi-agent"
        echo ""
        read -p "Continue with manual implementation? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "✅ Good choice! Use agents for better token efficiency."
            exit 1
        fi
        echo "⚠️  Proceeding with manual implementation (token inefficient)"
    fi
    
    # Check for repetitive patterns
    if echo "$task_description" | grep -i -E "(multi-file|database|api.*integration|test.*generation|deployment|refactor)" >/dev/null; then
        echo "🤖 AGENT-RECOMMENDED: This task type benefits from agent automation"
        echo "   Consider: buildkit agents spawn --type $(echo "$task_description" | head -c 20)"
    fi
}

# Token optimization suggestions
optimize_tokens() {
    echo "💰 TOKEN OPTIMIZATION ACTIVE"
    echo ""
    echo "Available agent commands:"
    echo "  buildkit agents list              - Show available agents"
    echo "  buildkit agents spawn             - Create task-specific agent"
    echo "  buildkit agents coordinate        - Multi-agent workflows"
    echo "  buildkit agents status            - Check agent availability"
    echo ""
    echo "🎯 Remember: Agents prevent token waste on complex tasks!"
}

# Main execution
if [ "$1" = "--check" ]; then
    check_agent_first_policy "$2" "$3"
elif [ "$1" = "--optimize" ]; then
    optimize_tokens
else
    echo "Agent-First Policy Enforcement"
    echo "Usage: $0 --check 'task description' estimated_tokens"
    echo "       $0 --optimize"
fi
`;
  
  fs.writeFileSync(path.join(buildkitDir, 'agent-first-policy.sh'), agentFirstScript);
  fs.chmodSync(path.join(buildkitDir, 'agent-first-policy.sh'), '755');
  console.log('✅ Installed agent-first policy enforcement script');

  // 5. Install enhanced lefthook.yml with employment protection
  console.log('🛡️ Installing employment protection (lefthook.yml)...');
  
  const lefthookConfig = `# GitHook Management - Agent BuildKit Employment Protection
pre-push:
  commands:
    block-claude-on-development:
      run: |
        BRANCH=$(git branch --show-current)
        if [ "$BRANCH" = "development" ]; then
          echo "❌ BLOCKED: Claude Code is not allowed to push to development branch"
          echo "🚨 EMPLOYMENT PROTECTION: Development branch is for human developers only"
          echo "ℹ️  Use: git checkout -b feature/your-feature"
          exit 1
        fi

commit-msg:
  commands:
    block-claude-attribution:
      run: |
        MSG_FILE={1}
        if grep -i -E "(claude|🤖|generated with.*claude|co-authored-by.*claude|anthropic)" "$MSG_FILE"; then
          echo "❌ COMMIT REJECTED: Claude/AI attribution detected"
          echo "🚨 EMPLOYMENT RISK: Commits must appear to be from human developers"
          echo "ℹ️  Remove AI attribution and commit as yourself"
          exit 1
        fi

pre-commit:
  commands:
    prevent-ai-signatures:
      run: |
        if git diff --cached | grep -i -E "(generated.*claude|ai.*generated|anthropic|claude.*code)"; then
          echo "❌ COMMIT BLOCKED: AI signature detected in code"
          echo "🚨 EMPLOYMENT PROTECTION: Remove AI references from code"
          exit 1
        fi
`;
  
  fs.writeFileSync(path.join(projectPath, 'lefthook.yml'), lefthookConfig);
  console.log('✅ Installed branch protection (lefthook.yml)');

  // 6. Create comprehensive CLAUDE.md with workflow specification
  console.log('📋 Creating comprehensive CLAUDE.md with workflow specification...');
  
  const claudeConfig = `# CLAUDE.md - OSSA Project Configuration

## 🚨 CRITICAL: Branching & CI Workflow Specification

### 1. Feature Branches Only (MANDATORY)
- All new work must start from the latest \`development\` branch
- Branch names use the format:
  - \`feature/<scope-kebab-case>\` for new capabilities
  - \`fix/<scope-kebab-case>\` for bug fixes  
  - \`chore/<scope-kebab-case>\` for non-feature work (docs, refactors, CI config)
  - \`bot/<agent-name>/<task>\` for AI bot work

### 2. CI-Driven Development Branch (ENFORCED)
- Merge requests target \`development\`, never \`main\` directly
- CI/CD enforces: linting, type checks, tests, coverage thresholds
- Approval requirements defined in CODEOWNERS
- Automatic fast-forward merge after approval and pipeline success
- **No manual merges to development are allowed. Only CI merges.**

### 3. AI Bots Sync from Development
- Bots always pull from \`development\` before creating new branches
- Bot branches follow naming convention: \`bot/<agent-name>/<task>\`
- CI ensures bot-created branches are isolated and only merged via standard MR flow

### 4. No Direct Development Commits (BLOCKED)
- Direct pushes to \`development\` are blocked at Git server level
- Developers must create feature/fix branches and submit merge requests
- Development is managed exclusively through automation and CI

### 5. Main Branch Protection (AUTOMATED)
- \`main\` only accepts merges from \`development\` via release workflow
- Releases follow semantic versioning:
  - \`feat:\` → minor version bump
  - \`fix:\` → patch version bump  
  - \`BREAKING CHANGE:\` → major version bump
- \`main\` is always deployable and tagged automatically with semantic-release

### 6. Safety & Recovery Rules (AUTOMATIC)
- Backup branches auto-created by CI on merge conflicts or failed automations
- Deleted branches quarantined to \`__DELETE_LATER/\` until cleanup job runs

## 💰 TOKEN OPTIMIZATION (MANDATORY)

### Agent-First Policy - STOP WASTING TOKENS
Before writing ANY code, you MUST check for agents:

\`\`\`bash
# Step 1: MANDATORY token estimation
echo "Task: [description]"
echo "Estimated tokens: [amount]" 
echo "Is this > 500 tokens? [yes/no]"
echo "Is this repetitive? [yes/no]"

# Step 2: MANDATORY agent check
buildkit agents list
buildkit agents search --tag [keyword]
buildkit agents search --description "[task-description]"

# Step 3: Decision matrix
if [estimated_tokens > 500] || [is_repetitive]; then
    echo "MUST use agents - token waste prevention"
    buildkit agents spawn --type worker --task "[description]"
else
    echo "Manual coding approved - justification: [reason]"
fi
\`\`\`

### MANDATORY Agent Spawning for These Tasks:
- **Multi-file operations** (3+ files) → ALWAYS spawn agents
- **Database operations** → ALWAYS use database agents
- **API integrations** → ALWAYS use integration agents
- **Testing workflows** → ALWAYS use test agents
- **Deployment tasks** → ALWAYS use deployment agents
- **Documentation generation** → ALWAYS use doc agents
- **Code analysis** (linting, security) → ALWAYS use analysis agents
- **Refactoring tasks** → ALWAYS use refactoring agents

### Token Waste Prevention Rules:
- ❌ **NEVER manually code tasks > 500 tokens without checking agents**
- ❌ **NEVER repeat similar tasks without creating/using agents**
- ❌ **NEVER ignore existing agent capabilities**
- ❌ **NEVER write multi-step workflows manually**
- ❌ **NEVER generate boilerplate code manually**

## 🛡️ EMPLOYMENT PROTECTION ACTIVE

### Critical Restrictions:
- **Claude Code is BLOCKED from development branch**
- **All AI assistants must work on feature branches only**
- **Commits must NOT contain AI attribution**
- **No Claude/Anthropic references in code or commits**

### Required Workflow:
\`\`\`bash
# ALWAYS start from development
git checkout development
git pull origin development

# Create feature branch (REQUIRED)
git checkout -b feature/your-description

# Work on feature branch only
# ... make changes ...

# Commit as human developer (NO AI attribution)
git commit -m "feat: implement new feature"

# Push feature branch
git push origin feature/your-description
\`\`\`

### Blocked Actions:
- ❌ Direct work on development branch
- ❌ AI attribution in commits (\`🤖 Generated with Claude\`)
- ❌ Claude Code signatures in code
- ❌ Anthropic references in commits
- ❌ Co-authored-by Claude entries

## 🎯 Success Criteria

An AI assistant is properly configured when:
- ✅ Always checks agent-buildkit before manual coding
- ✅ Uses correct branch naming patterns
- ✅ Works only from development branch locally
- ✅ Implements golden workflow CI/CD
- ✅ Follows TDD and API-first principles  
- ✅ Never creates ad-hoc scripts outside agent-buildkit

Generated by Agent BuildKit Enhanced Setup
Protected by comprehensive governance system
`;
  
  fs.writeFileSync(path.join(projectPath, 'CLAUDE.md'), claudeConfig);
  console.log('✅ Created comprehensive CLAUDE.md with workflow specification');

  // 7. Update .gitignore
  const gitignorePath = path.join(projectPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.buildkit/cache')) {
      fs.appendFileSync(gitignorePath, '\n# Agent BuildKit\n.buildkit/cache/\n.buildkit/logs/\n');
      console.log('✅ Updated .gitignore for Agent BuildKit');
    }
  }

  // 8. Try to install lefthook if available
  try {
    console.log('🔗 Attempting to install lefthook hooks...');
    execSync('npx lefthook install', { stdio: 'ignore' });
    console.log('✅ Lefthook hooks activated');
  } catch {
    console.log('⚠️  Lefthook not available - install with: npm install -g lefthook');
  }

  // Final summary
  console.log('\n📊 Installation Summary:');
  console.log('  ✅ Branching workflow specification installed');
  console.log('  ✅ GitLab CI golden workflow template installed');
  console.log('  ✅ Agent-first policy enforcement installed');
  console.log('  ✅ Employment protection activated');
  console.log('  ✅ Comprehensive CLAUDE.md created');
  console.log('  ✅ Token optimization enabled');

  console.log('\n🤖 Token Optimization Enabled:');
  console.log('  • Use "buildkit agents list" to check available agents');
  console.log('  • Use "buildkit agents spawn" for complex tasks');
  console.log('  • Agent-first policy prevents token waste');
  console.log('  • Branching workflow enforces CI-driven development');

  console.log('\n🎉 Agent BuildKit Enhanced Setup complete! Ready for enterprise development.');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}