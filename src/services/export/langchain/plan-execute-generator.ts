/**
 * LangChain Plan-and-Execute Agent Generator (v0.4.1)
 *
 * Generates production-ready Plan-and-Execute agent architecture.
 * Alternative to ReAct agents - separates planning and execution phases.
 *
 * Architecture:
 * - Planner: Creates step-by-step execution plan
 * - Executor: Executes each plan step with tools
 * - Replanner: Adjusts plan based on execution results
 *
 * SOLID: Single Responsibility - Plan-Execute agent generation only
 * DRY: Reusable templates for planner and executor
 */

import type { OssaAgent } from '../../../types/index.js';

export interface PlanExecuteConfig {
  /**
   * Maximum planning iterations
   */
  maxPlanningIterations?: number;

  /**
   * Maximum execution steps per plan
   */
  maxExecutionSteps?: number;

  /**
   * Enable replanning after execution failures
   */
  enableReplanning?: boolean;

  /**
   * Planning prompt customization
   */
  planningPrompt?: string;

  /**
   * Execution prompt customization
   */
  executionPrompt?: string;
}

export class PlanExecuteGenerator {
  /**
   * Generate planner_agent.py - Creates execution plans
   */
  generatePlanner(manifest: OssaAgent, config: PlanExecuteConfig = {}): string {
    const agentName = manifest.metadata?.name || 'agent';
    const systemPrompt = manifest.spec?.role || '';
    const maxPlanningIterations = config.maxPlanningIterations || 3;
    const planningPrompt = config.planningPrompt || this.getDefaultPlanningPrompt();

    return `"""
Planner Agent - Plan Generation
Generated from OSSA manifest

This agent creates step-by-step execution plans for complex tasks.
"""

from typing import Any, Dict, List, Optional
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field
import logging
import os

logger = logging.getLogger(__name__)


class Step(BaseModel):
    """Individual step in execution plan"""
    id: int = Field(..., description="Step number")
    description: str = Field(..., description="What to do in this step")
    tool: Optional[str] = Field(None, description="Tool to use (if applicable)")
    dependencies: List[int] = Field(default_factory=list, description="Step IDs this depends on")
    expected_output: str = Field(..., description="Expected result from this step")


class Plan(BaseModel):
    """Complete execution plan"""
    goal: str = Field(..., description="Overall goal to achieve")
    steps: List[Step] = Field(..., description="Ordered list of steps")
    reasoning: str = Field(..., description="Why this plan will achieve the goal")


class PlannerAgent:
    """Agent responsible for creating execution plans"""

    def __init__(self):
        self.llm = self._create_llm()
        self.max_iterations = ${maxPlanningIterations}
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """${systemPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}

${planningPrompt}"""),
            ("human", "{input}"),
        ])

    def _create_llm(self):
        """Initialize LLM for planning"""
        provider = os.getenv("LLM_PROVIDER", "openai")
        model = os.getenv("LLM_MODEL", "gpt-4")

        if provider == "anthropic":
            return ChatAnthropic(
                model=model,
                temperature=0.0,  # Deterministic planning
                api_key=os.getenv("ANTHROPIC_API_KEY"),
            )
        else:
            return ChatOpenAI(
                model=model,
                temperature=0.0,  # Deterministic planning
                api_key=os.getenv("OPENAI_API_KEY"),
            )

    def create_plan(self, goal: str, available_tools: List[str], context: Optional[Dict[str, Any]] = None) -> Plan:
        """
        Create execution plan for given goal

        Args:
            goal: The objective to achieve
            available_tools: List of tool names available for execution
            context: Optional context information

        Returns:
            Structured execution plan
        """
        try:
            logger.info(f"Creating plan for goal: {goal}")

            # Prepare context
            tools_str = ", ".join(available_tools) if available_tools else "No tools available"
            context_str = f"\\n\\nContext: {context}" if context else ""

            # Create planning prompt
            planning_input = f"""Goal: {goal}

Available Tools: {tools_str}{context_str}

Create a detailed step-by-step plan to achieve this goal. Each step should:
1. Be concrete and actionable
2. Specify which tool to use (if applicable)
3. State dependencies on previous steps
4. Define expected output

Format your response as:
{{
    "goal": "...",
    "reasoning": "...",
    "steps": [
        {{
            "id": 1,
            "description": "...",
            "tool": "tool_name or null",
            "dependencies": [],
            "expected_output": "..."
        }},
        ...
    ]
}}"""

            # Generate plan
            chain = self.prompt | self.llm
            response = chain.invoke({"input": planning_input})

            # Parse response into Plan object
            import json
            try:
                plan_dict = json.loads(response.content)
                plan = Plan(**plan_dict)
            except json.JSONDecodeError:
                # Fallback: create simple plan
                logger.warning("Failed to parse structured plan, creating simple plan")
                plan = Plan(
                    goal=goal,
                    reasoning="Generated fallback plan due to parsing error",
                    steps=[
                        Step(
                            id=1,
                            description=f"Execute goal: {goal}",
                            tool=available_tools[0] if available_tools else None,
                            dependencies=[],
                            expected_output=f"Result of {goal}"
                        )
                    ]
                )

            logger.info(f"Created plan with {len(plan.steps)} steps")
            return plan

        except Exception as e:
            logger.error(f"Error creating plan: {str(e)}", exc_info=True)
            # Return fallback plan
            return Plan(
                goal=goal,
                reasoning=f"Error in planning: {str(e)}",
                steps=[
                    Step(
                        id=1,
                        description=f"Execute goal: {goal}",
                        tool=None,
                        dependencies=[],
                        expected_output="Error occurred during planning"
                    )
                ]
            )

    def replan(
        self,
        original_plan: Plan,
        completed_steps: List[int],
        failed_step: int,
        error: str,
        available_tools: List[str]
    ) -> Plan:
        """
        Create new plan after execution failure

        Args:
            original_plan: The original execution plan
            completed_steps: Steps that completed successfully
            failed_step: Step ID that failed
            error: Error message from failed step
            available_tools: Available tools

        Returns:
            Updated execution plan
        """
        try:
            logger.info(f"Replanning after failure at step {failed_step}")

            tools_str = ", ".join(available_tools)
            completed_str = ", ".join(map(str, completed_steps))

            replan_input = f"""Original Goal: {original_plan.goal}

Completed Steps: {completed_str}
Failed Step: {failed_step}
Error: {error}

Available Tools: {tools_str}

The execution failed. Create a new plan that:
1. Accounts for already completed steps
2. Fixes the issue that caused the failure
3. Still achieves the original goal

Use the same JSON format as before."""

            chain = self.prompt | self.llm
            response = chain.invoke({"input": replan_input})

            # Parse response
            import json
            try:
                plan_dict = json.loads(response.content)
                new_plan = Plan(**plan_dict)
                logger.info(f"Created recovery plan with {len(new_plan.steps)} steps")
                return new_plan
            except json.JSONDecodeError:
                logger.warning("Failed to parse recovery plan, returning original")
                return original_plan

        except Exception as e:
            logger.error(f"Error in replanning: {str(e)}", exc_info=True)
            return original_plan


def create_planner() -> PlannerAgent:
    """Create planner agent instance"""
    return PlannerAgent()
`;
  }

  /**
   * Generate executor_agent.py - Executes plan steps
   */
  generateExecutor(manifest: OssaAgent, config: PlanExecuteConfig = {}): string {
    const agentName = manifest.metadata?.name || 'agent';
    const systemPrompt = manifest.spec?.role || '';
    const executionPrompt = config.executionPrompt || this.getDefaultExecutionPrompt();

    return `"""
Executor Agent - Plan Execution
Generated from OSSA manifest

This agent executes individual steps from the plan using available tools.
"""

from typing import Any, Dict, List, Optional
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel, Field
import logging
import os

logger = logging.getLogger(__name__)


class StepResult(BaseModel):
    """Result from executing a single step"""
    step_id: int = Field(..., description="Step ID that was executed")
    success: bool = Field(..., description="Whether step succeeded")
    output: Any = Field(..., description="Output from step execution")
    error: Optional[str] = Field(None, description="Error message if failed")
    tool_used: Optional[str] = Field(None, description="Tool that was used")


class ExecutorAgent:
    """Agent responsible for executing plan steps"""

    def __init__(self, tools: List):
        self.tools = tools
        self.llm = self._create_llm()
        self.agent_executor = self._create_executor()

    def _create_llm(self):
        """Initialize LLM for execution"""
        provider = os.getenv("LLM_PROVIDER", "openai")
        model = os.getenv("LLM_MODEL", "gpt-4")
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.2"))

        if provider == "anthropic":
            return ChatAnthropic(
                model=model,
                temperature=temperature,
                api_key=os.getenv("ANTHROPIC_API_KEY"),
            )
        else:
            return ChatOpenAI(
                model=model,
                temperature=temperature,
                api_key=os.getenv("OPENAI_API_KEY"),
            )

    def _create_executor(self) -> AgentExecutor:
        """Create agent executor with tools"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", """${systemPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}

${executionPrompt}"""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        agent = create_openai_tools_agent(self.llm, self.tools, prompt)

        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5,
        )

    def execute_step(
        self,
        step_id: int,
        step_description: str,
        tool_name: Optional[str],
        context: Dict[str, Any]
    ) -> StepResult:
        """
        Execute a single step from the plan

        Args:
            step_id: Step identifier
            step_description: What to do in this step
            tool_name: Tool to use (if specified)
            context: Context from previous steps

        Returns:
            Result of step execution
        """
        try:
            logger.info(f"Executing step {step_id}: {step_description}")

            # Build execution prompt
            context_str = "\\n".join([f"{k}: {v}" for k, v in context.items()])
            tool_hint = f"\\nUse the '{tool_name}' tool." if tool_name else ""

            execution_input = f"""Execute this step:
{step_description}{tool_hint}

Context from previous steps:
{context_str}

Provide the result of this step."""

            # Execute
            response = self.agent_executor.invoke({
                "input": execution_input,
                "chat_history": []
            })

            result = StepResult(
                step_id=step_id,
                success=True,
                output=response.get("output", "No output"),
                tool_used=tool_name
            )

            logger.info(f"Step {step_id} completed successfully")
            return result

        except Exception as e:
            logger.error(f"Error executing step {step_id}: {str(e)}", exc_info=True)
            return StepResult(
                step_id=step_id,
                success=False,
                output=None,
                error=str(e),
                tool_used=tool_name
            )


def create_executor(tools: List) -> ExecutorAgent:
    """Create executor agent instance"""
    return ExecutorAgent(tools)
`;
  }

  /**
   * Generate plan_execute.py - Main coordinator
   */
  generatePlanExecute(manifest: OssaAgent, config: PlanExecuteConfig = {}): string {
    const agentName = manifest.metadata?.name || 'agent';
    const maxExecutionSteps = config.maxExecutionSteps || 10;
    const enableReplanning = config.enableReplanning !== false;

    return `"""
Plan-and-Execute Agent (${agentName})
Generated from OSSA manifest

This agent uses a two-phase approach:
1. Planning: Create step-by-step execution plan
2. Execution: Execute each step with tools

Supports replanning after failures for robust execution.
"""

from typing import Any, Dict, List, Optional
from planner_agent import create_planner, Plan, Step
from executor_agent import create_executor, StepResult
from tools import get_tools
from memory import get_memory
from callbacks import get_callbacks, get_cost_tracker, print_cost_summary
from error_handling import safe_agent_invoke, get_error_stats
import logging
import os

logger = logging.getLogger(__name__)


class PlanExecuteAgent:
    """Plan-and-Execute agent coordinator"""

    def __init__(self):
        self.tools = get_tools()
        self.planner = create_planner()
        self.executor = create_executor(self.tools)
        self.memory = get_memory()
        self.callbacks = get_callbacks()
        self.max_execution_steps = ${maxExecutionSteps}
        self.enable_replanning = ${enableReplanning ? 'True' : 'False'}

    def run(self, goal: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute goal using plan-and-execute architecture

        Args:
            goal: The objective to achieve
            context: Optional context information

        Returns:
            Execution results with plan and step outputs
        """
        try:
            logger.info(f"Starting plan-and-execute for goal: {goal}")

            # Phase 1: Planning
            tool_names = [tool.name for tool in self.tools]
            plan = self.planner.create_plan(goal, tool_names, context)

            logger.info(f"Created plan with {len(plan.steps)} steps")
            logger.debug(f"Plan reasoning: {plan.reasoning}")

            # Phase 2: Execution
            results = self._execute_plan(plan)

            # Prepare response
            success = all(r.success for r in results)
            final_output = self._synthesize_output(plan, results)

            # Add cost tracking
            cost_tracker = get_cost_tracker()
            cost_summary = cost_tracker.get_summary()

            response = {
                "success": success,
                "goal": goal,
                "plan": {
                    "reasoning": plan.reasoning,
                    "steps": [
                        {
                            "id": step.id,
                            "description": step.description,
                            "tool": step.tool,
                        }
                        for step in plan.steps
                    ],
                },
                "execution": [
                    {
                        "step_id": r.step_id,
                        "success": r.success,
                        "output": r.output,
                        "error": r.error,
                        "tool_used": r.tool_used,
                    }
                    for r in results
                ],
                "output": final_output,
                "cost": cost_summary,
            }

            logger.info(f"Plan-and-execute completed: {success}")
            return response

        except Exception as e:
            logger.error(f"Error in plan-and-execute: {str(e)}", exc_info=True)
            return {
                "success": False,
                "goal": goal,
                "error": str(e),
                "error_type": type(e).__name__,
            }

    def _execute_plan(self, plan: Plan) -> List[StepResult]:
        """
        Execute all steps in plan

        Args:
            plan: Execution plan

        Returns:
            List of step results
        """
        results: List[StepResult] = []
        context: Dict[str, Any] = {}
        completed_steps: List[int] = []

        for step in plan.steps[:self.max_execution_steps]:
            # Check dependencies
            if not self._dependencies_met(step, completed_steps):
                logger.warning(f"Step {step.id} dependencies not met, skipping")
                results.append(StepResult(
                    step_id=step.id,
                    success=False,
                    output=None,
                    error="Dependencies not met"
                ))
                continue

            # Execute step
            result = self.executor.execute_step(
                step_id=step.id,
                step_description=step.description,
                tool_name=step.tool,
                context=context
            )

            results.append(result)

            if result.success:
                # Update context with result
                context[f"step_{step.id}"] = result.output
                completed_steps.append(step.id)
            else:
                # Handle failure
                if self.enable_replanning:
                    logger.info(f"Replanning due to failure at step {step.id}")
                    new_plan = self.planner.replan(
                        original_plan=plan,
                        completed_steps=completed_steps,
                        failed_step=step.id,
                        error=result.error or "Unknown error",
                        available_tools=[tool.name for tool in self.tools]
                    )
                    # Continue with new plan
                    remaining_results = self._execute_plan(new_plan)
                    results.extend(remaining_results)
                    break
                else:
                    logger.warning(f"Step {step.id} failed, continuing without replanning")

        return results

    def _dependencies_met(self, step: Step, completed_steps: List[int]) -> bool:
        """Check if step dependencies are satisfied"""
        return all(dep in completed_steps for dep in step.dependencies)

    def _synthesize_output(self, plan: Plan, results: List[StepResult]) -> str:
        """
        Synthesize final output from all step results

        Args:
            plan: Original plan
            results: Step execution results

        Returns:
            Human-readable summary
        """
        successful_steps = [r for r in results if r.success]
        failed_steps = [r for r in results if not r.success]

        if not successful_steps:
            return f"Failed to complete goal: {plan.goal}. All steps failed."

        if failed_steps:
            summary = f"Partially completed goal: {plan.goal}\\n\\n"
            summary += f"Completed {len(successful_steps)}/{len(results)} steps.\\n\\n"
        else:
            summary = f"Successfully completed goal: {plan.goal}\\n\\n"

        summary += "Results:\\n"
        for result in successful_steps:
            summary += f"- Step {result.step_id}: {result.output}\\n"

        if failed_steps:
            summary += "\\nFailed steps:\\n"
            for result in failed_steps:
                summary += f"- Step {result.step_id}: {result.error}\\n"

        return summary


# Create global agent instance
agent = PlanExecuteAgent()


def run(goal: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Run plan-and-execute agent

    Args:
        goal: The objective to achieve
        context: Optional context information

    Returns:
        Execution results
    """
    return agent.run(goal, context)


if __name__ == "__main__":
    # Example usage
    print(f"Starting ${agentName} (Plan-and-Execute)...")

    response = run("Research and write a blog post about AI trends in 2024")
    print(f"Success: {response['success']}")
    print(f"Output: {response['output']}")

    if 'plan' in response:
        print(f"\\nPlan:")
        for step in response['plan']['steps']:
            print(f"  {step['id']}. {step['description']}")
`;
  }

  /**
   * Get default planning prompt
   */
  private getDefaultPlanningPrompt(): string {
    return `You are an expert planner. Your role is to break down complex goals into step-by-step execution plans.

For each step:
- Be specific and actionable
- Identify which tool to use (if applicable)
- Note dependencies on previous steps
- State expected output

Create plans that are:
- Logical and sequential
- Achievable with available tools
- Robust to failures (include verification steps)
- Efficient (minimize unnecessary steps)`;
  }

  /**
   * Get default execution prompt
   */
  private getDefaultExecutionPrompt(): string {
    return `You are a precise executor. Your role is to execute individual steps from a plan.

For each step:
- Follow the instructions exactly
- Use the specified tool if indicated
- Use context from previous steps
- Provide clear output

Execute steps:
- Carefully and accurately
- With proper error handling
- Using available context
- Producing useful output for subsequent steps`;
  }
}
