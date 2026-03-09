// =============================================================================
// Bluefly.io — SOD Sprint 3: Cedar Forbid Policies
// =============================================================================
// 4 forbid rules enforcing Separation of Duties across the agent fleet.
//
// Rule 1: Self-Review Block
//   An agent cannot review a workflow where it was the executor.
//
// Rule 2: Executor-Approve Block
//   An executor (T3) cannot approve (T4 action) — prevents self-approval.
//
// Rule 3: Analyzer-Execute Block
//   An analyzer (T1) cannot execute — segregation of analysis and action.
//
// Rule 4: Multi-Phase Different-Agent Requirement
//   The deploy action requires the approval_agent to differ from execution_agent.
// =============================================================================

// --- Rule 1: Self-Review Block ---
// An agent that executed a workflow cannot also review it.
forbid (
  principal is BlueflySOD::Agent,
  action == BlueflySOD::Action::"review",
  resource is BlueflySOD::Workflow
)
when {
  principal.agent_id == resource.execution_agent
};

// --- Rule 2: Executor Cannot Approve ---
// T3 Executor tier agents are forbidden from approving any workflow.
forbid (
  principal is BlueflySOD::Agent,
  action == BlueflySOD::Action::"approve",
  resource is BlueflySOD::Workflow
)
when {
  principal.tier == "T3"
};

// --- Rule 3: Analyzer Cannot Execute ---
// T1 Analyzer tier agents are forbidden from executing any workflow.
forbid (
  principal is BlueflySOD::Agent,
  action == BlueflySOD::Action::"execute",
  resource is BlueflySOD::Workflow
)
when {
  principal.tier == "T1"
};

// --- Rule 4: Deploy Requires Different Approval Agent ---
// The deploy action is forbidden if the approval agent is the same
// as the execution agent (prevents self-approval of deployments).
forbid (
  principal is BlueflySOD::Agent,
  action == BlueflySOD::Action::"deploy",
  resource is BlueflySOD::Workflow
)
when {
  resource.approval_agent == resource.execution_agent
};
