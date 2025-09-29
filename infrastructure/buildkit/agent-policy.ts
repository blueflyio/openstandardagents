/**
 * Converted from agent-policy.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash
    // OSSA Agent-First Policy Enforcement
    // Prevents token waste by encouraging agent usage

    execSync("set -e", { stdio: 'inherit' });

    // Load configuration
    execSync("CONFIG_FILE=\"$(dirname \"$0\")/config.yaml\"", { stdio: 'inherit' });
    const TOKEN_THRESHOLD = "${TOKEN_THRESHOLD:-500}";

    // Colors for output
    const RED = "\\033[0;31m";
    const GREEN = "\\033[0;32m";
    const YELLOW = "\\033[1;33m";
    const BLUE = "\\033[0;34m";
    execSync("NC='\\033[0m' # No Color", { stdio: 'inherit' });

    // Check if task should use agents
    // Function: check_agent_first_policy
    execSync("local task_description=\"$1\"", { stdio: 'inherit' });
    execSync("local estimated_tokens=\"${2:-0}\"", { stdio: 'inherit' });

    console.log("-e ${BLUE}🔍 Analyzing task:${NC} $task_description");
    console.log("-e ${BLUE}📊 Estimated tokens:${NC} $estimated_tokens");

    execSync("if [ \"$estimated_tokens\" -gt \"$TOKEN_THRESHOLD\" ]; then", { stdio: 'inherit' });
    console.log("-e ${YELLOW}⚠️  LARGE TASK DETECTED (>$TOKEN_THRESHOLD tokens)${NC}");
    console.log("-e ${GREEN}💡 Recommendation: Use agents to prevent token waste${NC}");
    console.log("");
    console.log("Suggested OSSA commands:");
    console.log("  ossa agents list --search $task_description");
    console.log("  ossa agents spawn --type worker --task $task_description");
    console.log("  ossa orchestrate --multi-agent --task $task_description");
    console.log("");
    console.log("Agent BuildKit commands:");
    console.log("  buildkit agents list --capability $task_description");
    console.log("  buildkit agents coordinate --multi-agent");
    console.log("");
    execSync("read -p \"Continue with manual implementation? (y/N): \" -n 1 -r", { stdio: 'inherit' });
    execSync("echo", { stdio: 'inherit' });
    execSync("if [[ ! $REPLY =~ ^[Yy]$ ]]; then", { stdio: 'inherit' });
    console.log("-e ${GREEN}✅ Good choice! Use agents for better token efficiency.${NC}");
    execSync("exit 1", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    console.log("-e ${YELLOW}⚠️  Proceeding with manual implementation (token inefficient)${NC}");
    execSync("fi", { stdio: 'inherit' });

    // Check for repetitive patterns
    execSync("if echo \"$task_description\" | grep -i -E \"(multi-file|database|api.*integration|test.*generation|deployment|refactor|documentation|migrate)\" >/dev/null; then", { stdio: 'inherit' });
    console.log("-e ${BLUE}🤖 AGENT-RECOMMENDED:${NC} This task type benefits from agent automation");
    execSync("local agent_type=\"\"", { stdio: 'inherit' });

    // Determine agent type based on task
    execSync("if echo \"$task_description\" | grep -i \"test\" >/dev/null; then", { stdio: 'inherit' });
    const agent_type = "critic";
    execSync("elif echo \"$task_description\" | grep -i \"database\\|api\" >/dev/null; then", { stdio: 'inherit' });
    const agent_type = "integrator";
    execSync("elif echo \"$task_description\" | grep -i \"monitor\\|metric\" >/dev/null; then", { stdio: 'inherit' });
    const agent_type = "monitor";
    execSync("elif echo \"$task_description\" | grep -i \"orchestrat\\|workflow\" >/dev/null; then", { stdio: 'inherit' });
    const agent_type = "orchestrator";
    execSync("else", { stdio: 'inherit' });
    const agent_type = "worker";
    execSync("fi", { stdio: 'inherit' });

    console.log("-e    ${GREEN}Recommended agent type:${NC} $agent_type");
    console.log("-e    ${BLUE}Command:${NC} ossa agents spawn --type $agent_type --task $task_description");
    execSync("fi", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    // Token optimization suggestions
    // Function: optimize_tokens
    console.log("-e ${GREEN}💰 TOKEN OPTIMIZATION ACTIVE${NC}");
    console.log("");
    console.log("OSSA Agent Commands:");
    console.log("  ossa agents list              - Show available agents");
    console.log("  ossa agents spawn             - Create task-specific agent");
    console.log("  ossa orchestrate              - Multi-agent workflows");
    console.log("  ossa agents status            - Check agent availability");
    console.log("");
    console.log("BuildKit Integration:");
    console.log("  buildkit agents coordinate    - Coordinate multiple agents");
    console.log("  buildkit monitor status       - Check system health");
    console.log("");
    console.log("-e ${GREEN}🎯 Remember: Agents prevent token waste on complex tasks!${NC}");
    execSync("}", { stdio: 'inherit' });

    // Validate task before execution
    // Function: validate_task
    execSync("local task_type=\"$1\"", { stdio: 'inherit' });
    execSync("local task_description=\"$2\"", { stdio: 'inherit' });

    console.log("-e ${BLUE}📋 Validating task type:${NC} $task_type");

    execSync("case \"$task_type\" in", { stdio: 'inherit' });
    execSync("orchestrator|worker|monitor|critic|governor|integrator|judge)", { stdio: 'inherit' });
    console.log("-e ${GREEN}✅ Valid agent type${NC}");
    execSync(";;", { stdio: 'inherit' });
    execSync("*)", { stdio: 'inherit' });
    console.log("-e ${RED}❌ Invalid agent type: $task_type${NC}");
    console.log("Valid types: orchestrator, worker, monitor, critic, governor, integrator, judge");
    execSync("exit 1", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });
    execSync("esac", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    // Main execution
    execSync("case \"$1\" in", { stdio: 'inherit' });
    execSync("--check)", { stdio: 'inherit' });
    execSync("check_agent_first_policy \"$2\" \"${3:-0}\"", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });
    execSync("--optimize)", { stdio: 'inherit' });
    execSync("optimize_tokens", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });
    execSync("--validate)", { stdio: 'inherit' });
    execSync("validate_task \"$2\" \"$3\"", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });
    execSync("--help|-h)", { stdio: 'inherit' });
    console.log("OSSA Agent-First Policy Enforcement");
    console.log("");
    console.log("Usage:");
    console.log("  $0 --check task description [estimated_tokens]");
    console.log("  $0 --optimize                 - Show token optimization tips");
    console.log("  $0 --validate type task     - Validate agent type for task");
    console.log("  $0 --help                     - Show this help message");
    console.log("");
    console.log("Environment variables:");
    console.log("  TOKEN_THRESHOLD - Token count threshold (default: 500)");
    execSync(";;", { stdio: 'inherit' });
    execSync("*)", { stdio: 'inherit' });
    console.log("-e ${RED}Error: Invalid option${NC}");
    console.log("Use $0 --help for usage information");
    execSync("exit 1", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });
    execSync("esac", { stdio: 'inherit' });
    console.log(chalk.green("✅ Script completed successfully"));
  } catch (error) {
    console.error(chalk.red("❌ Script failed:"), error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}