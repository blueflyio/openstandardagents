#!/bin/bash
# OSSA Multi-Agent Template Script for Auto-Spawning
# Usage: ./ossa-auto-spawn.sh <TASK_DESCRIPTION>

set -euo pipefail

# Input validation
if [ $# -ne 1 ]; then
    echo "Usage: $0 '<TASK_DESCRIPTION>'"
    echo "Example: $0 'Implement user authentication with JWT tokens'"
    exit 1
fi

TASK_DESCRIPTION="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🤖 OSSA Multi-Agent Auto-Spawning"
echo "Task: ${TASK_DESCRIPTION}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Check if we're in a worktree
if [ ! -f ".env" ] || [ ! -d ".agents-workspace" ]; then
    echo "⚠️  Error: Not in an OSSA agent worktree"
    echo "Run ./ossa-worktree.sh first to create the worktree environment"
    exit 1
fi

# Load environment variables
source .env

echo "📋 Environment Loaded:"
echo "Repository: ${OSSA_REPO_NAME}"
echo "Agent Type: ${OSSA_AGENT_TYPE}"
echo "Task Name: ${OSSA_TASK_NAME}"
echo ""

# 1) SPAWN CODER AGENT
echo "👨‍💻 Step 1: Spawning Coder Agent..."
CODER_CONFIG=".agents-workspace/agents/coder-${TIMESTAMP}.yaml"
cat > "${CODER_CONFIG}" << EOF
# OSSA Coder Agent Configuration
agentId: "coder-${OSSA_REPO_NAME}-${TIMESTAMP}"
agentType: "execution"
agentSubType: "worker.coder"
supportedDomains: ["${OSSA_REPO_NAME}", "typescript", "javascript", "coding"]
protocols:
  rest: "http://localhost:4000/v1"
capabilities:
  coding:
    languages: ["typescript", "javascript", "python", "go"]
    frameworks: ["node", "react", "express", "fastify"]
    operations: ["implement", "refactor", "optimize", "debug"]
    maxFileSize: 1048576
    timeout: 60000
performance:
  throughput: 5
  latency_p99: 2000
budget:
  tokens: ${OSSA_TOKEN_BUDGET_SUBTASK}
instructions: |
  You are a TypeScript/JavaScript expert specializing in ${OSSA_REPO_NAME}.
  Your task: ${TASK_DESCRIPTION}
  
  Follow these guidelines:
  - Write clean, maintainable code
  - Include proper error handling
  - Add comprehensive tests
  - Follow existing code patterns
  - Optimize for performance and readability
EOF

echo "ossa agents spawn coder --config ${CODER_CONFIG}"
echo "✅ Coder agent configuration created"

# 2) SPAWN RESEARCHER AGENT  
echo ""
echo "🔍 Step 2: Spawning Researcher Agent..."
RESEARCHER_CONFIG=".agents-workspace/agents/researcher-${TIMESTAMP}.yaml"
cat > "${RESEARCHER_CONFIG}" << EOF
# OSSA Researcher Agent Configuration
agentId: "researcher-${OSSA_REPO_NAME}-${TIMESTAMP}"
agentType: "analysis" 
agentSubType: "critic.researcher"
supportedDomains: ["${OSSA_REPO_NAME}", "research", "analysis", "documentation"]
protocols:
  rest: "http://localhost:4000/v1"
capabilities:
  research:
    operations: ["analyze", "investigate", "document", "benchmark"]
    sources: ["codebase", "documentation", "web", "api"]
    timeout: 45000
performance:
  throughput: 3
  latency_p99: 3000
budget:
  tokens: ${OSSA_TOKEN_BUDGET_SUBTASK}
instructions: |
  You are a technical researcher specializing in ${OSSA_REPO_NAME}.
  Your task: Research and analyze requirements for: ${TASK_DESCRIPTION}
  
  Your responsibilities:
  - Analyze existing codebase patterns
  - Research best practices and standards
  - Identify potential issues and solutions
  - Document findings and recommendations
  - Provide technical specifications
EOF

echo "ossa agents spawn researcher --config ${RESEARCHER_CONFIG}"
echo "✅ Researcher agent configuration created"

# 3) SPAWN REVIEWER AGENT
echo ""
echo "👥 Step 3: Spawning Reviewer Agent..."
REVIEWER_CONFIG=".agents-workspace/agents/reviewer-${TIMESTAMP}.yaml"
cat > "${REVIEWER_CONFIG}" << EOF
# OSSA Reviewer Agent Configuration
agentId: "reviewer-${OSSA_REPO_NAME}-${TIMESTAMP}"
agentType: "feedback"
agentSubType: "critic.reviewer"
supportedDomains: ["${OSSA_REPO_NAME}", "quality", "review", "validation"]
protocols:
  rest: "http://localhost:4000/v1"
capabilities:
  review:
    operations: ["validate", "critique", "improve", "approve"]
    criteria: ["correctness", "performance", "security", "maintainability"]
    timeout: 30000
performance:
  throughput: 8
  latency_p99: 1500
budget:
  tokens: ${OSSA_TOKEN_BUDGET_PLANNING}
instructions: |
  You are a code reviewer specializing in ${OSSA_REPO_NAME}.
  Your task: Review implementation of: ${TASK_DESCRIPTION}
  
  Review criteria:
  - Code quality and standards compliance
  - Security best practices
  - Performance optimization
  - Test coverage and quality
  - Documentation completeness
EOF

echo "ossa agents spawn reviewer --config ${REVIEWER_CONFIG}"
echo "✅ Reviewer agent configuration created"

# 4) CREATE WORKFLOW ORCHESTRATION
echo ""
echo "🔄 Step 4: Creating workflow orchestration..."
WORKFLOW_CONFIG=".agents-workspace/workflows/360-feedback-loop-${TIMESTAMP}.yaml"
cat > "${WORKFLOW_CONFIG}" << EOF
# OSSA 360° Feedback Loop Workflow
workflowId: "360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"
workflowType: "ossa.360-feedback-loop"
description: "${TASK_DESCRIPTION}"

agents:
  - agentId: "researcher-${OSSA_REPO_NAME}-${TIMESTAMP}"
    role: "research"
    phase: "plan"
  - agentId: "coder-${OSSA_REPO_NAME}-${TIMESTAMP}"
    role: "execute"
    phase: "execute"
  - agentId: "reviewer-${OSSA_REPO_NAME}-${TIMESTAMP}"
    role: "review"
    phase: "review"

phases:
  1_plan:
    agent: "researcher"
    timeout: 300
    success_criteria: "Research findings documented"
  2_execute:
    agent: "coder"
    timeout: 600
    depends_on: "1_plan"
    success_criteria: "Implementation complete with tests"
  3_review:
    agent: "reviewer"
    timeout: 180
    depends_on: "2_execute"
    success_criteria: "Code review passed"
  4_judge:
    type: "automated"
    criteria: ["tests_pass", "linting_pass", "security_scan_pass"]
  5_learn:
    type: "memory_update"
    target: "all_agents"
  6_govern:
    type: "budget_check"
    escalation_policy: "delegate"

budget:
  total: ${OSSA_TOKEN_BUDGET_TASK}
  per_agent: ${OSSA_TOKEN_BUDGET_SUBTASK}
  escalation: "pause_and_notify"
EOF

echo "ossa workflow orchestrate --config ${WORKFLOW_CONFIG}"
echo "✅ 360° Feedback Loop workflow created"

# 5) CREATE EXECUTION SCRIPT
echo ""
echo "🚀 Step 5: Creating execution script..."
EXEC_SCRIPT=".agents-workspace/execute-task.sh"
cat > "${EXEC_SCRIPT}" << 'EOF'
#!/bin/bash
# OSSA Task Execution Script (Auto-generated)

set -euo pipefail

echo "🚀 Starting OSSA 360° Feedback Loop Execution"
echo "Task: ${TASK_DESCRIPTION}"
echo ""

# Phase 1: Research
echo "🔍 Phase 1: Research & Planning"
ossa workflow execute phase --name "1_plan" --workflow "360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"

# Phase 2: Implementation  
echo ""
echo "👨‍💻 Phase 2: Implementation"
ossa workflow execute phase --name "2_execute" --workflow "360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"

# Phase 3: Review
echo ""
echo "👥 Phase 3: Code Review"
ossa workflow execute phase --name "3_review" --workflow "360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"

# Phase 4: Automated Judgment
echo ""
echo "⚖️ Phase 4: Automated Quality Gates"
ossa workflow execute phase --name "4_judge" --workflow "360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"

# Phase 5: Learning
echo ""
echo "🧠 Phase 5: Learning Signal Generation"
ossa workflow execute phase --name "5_learn" --workflow "360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"

# Phase 6: Governance
echo ""
echo "🏛️ Phase 6: Budget & Compliance Check"
ossa workflow execute phase --name "6_govern" --workflow "360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"

echo ""
echo "✅ OSSA 360° Feedback Loop Complete!"
EOF

chmod +x "${EXEC_SCRIPT}"
echo "✅ Execution script created: ${EXEC_SCRIPT}"

# 6) FINAL INSTRUCTIONS
echo ""
echo "🎯 OSSA Multi-Agent Environment Ready!"
echo ""
echo "📋 Available Commands:"
echo "1. Execute full 360° feedback loop:"
echo "   ./${EXEC_SCRIPT}"
echo ""
echo "2. Individual agent commands:"
echo "   ossa agents list"
echo "   ossa agents run researcher-${OSSA_REPO_NAME}-${TIMESTAMP} --message 'Analyze requirements'"
echo "   ossa agents run coder-${OSSA_REPO_NAME}-${TIMESTAMP} --message 'Implement solution'"
echo "   ossa agents run reviewer-${OSSA_REPO_NAME}-${TIMESTAMP} --message 'Review implementation'"
echo ""
echo "3. Workflow orchestration:"
echo "   ossa workflow status --workflow 360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"
echo "   ossa workflow logs --workflow 360-loop-${OSSA_REPO_NAME}-${TIMESTAMP}"
echo ""
echo "📊 Agent Configurations:"
echo "- Coder: ${CODER_CONFIG}"
echo "- Researcher: ${RESEARCHER_CONFIG}"
echo "- Reviewer: ${REVIEWER_CONFIG}"
echo "- Workflow: ${WORKFLOW_CONFIG}"
echo ""
echo "✅ Auto-Spawning Complete! Ready to execute task:"
echo "   ${TASK_DESCRIPTION}"