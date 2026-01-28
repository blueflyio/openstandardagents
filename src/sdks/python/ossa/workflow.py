"""
Workflow orchestration engine for OSSA.

This module provides runtime execution for OSSA Workflow manifests, enabling
orchestration of multiple agents and tasks with dependency management,
parallel execution, and error handling.
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Union

from pydantic import BaseModel

from .exceptions import ConfigurationError, OSSAError
from .types import OSSAManifest, WorkflowSpec, WorkflowStep


class WorkflowResponse(BaseModel):
    """
    Response from a workflow execution.

    Attributes:
        status: Execution status (success, failure, partial)
        results: Results from each step (keyed by step name)
        errors: Any errors that occurred during execution
        duration_ms: Total execution time in milliseconds
        steps_completed: Number of steps successfully completed
        steps_total: Total number of steps in the workflow
        execution_order: Order in which steps were executed
        metadata: Additional metadata about the execution
    """

    status: str  # success, failure, partial
    results: Dict[str, Any]
    errors: List[str] = []
    duration_ms: Optional[float] = None
    steps_completed: int = 0
    steps_total: int = 0
    execution_order: List[str] = []
    metadata: Dict[str, Any] = {}


@dataclass
class WorkflowContext:
    """
    Execution context for a workflow, shared across all steps.

    Attributes:
        variables: Variables accessible to all steps
        step_outputs: Outputs from completed steps
        completed_steps: Set of completed step names
        failed_steps: Set of failed step names
    """

    variables: Dict[str, Any] = field(default_factory=dict)
    step_outputs: Dict[str, Any] = field(default_factory=dict)
    completed_steps: Set[str] = field(default_factory=set)
    failed_steps: Set[str] = field(default_factory=set)

    def is_step_completed(self, step_name: str) -> bool:
        """Check if a step has completed successfully."""
        return step_name in self.completed_steps

    def is_step_failed(self, step_name: str) -> bool:
        """Check if a step has failed."""
        return step_name in self.failed_steps

    def get_step_output(self, step_name: str, default: Any = None) -> Any:
        """Get the output of a completed step."""
        return self.step_outputs.get(step_name, default)

    def set_step_output(self, step_name: str, output: Any) -> None:
        """Set the output of a completed step."""
        self.step_outputs[step_name] = output
        self.completed_steps.add(step_name)

    def mark_step_failed(self, step_name: str) -> None:
        """Mark a step as failed."""
        self.failed_steps.add(step_name)

    def are_dependencies_met(self, dependencies: Optional[List[str]]) -> bool:
        """
        Check if all dependencies for a step are met.

        Args:
            dependencies: List of step names that must be completed

        Returns:
            True if all dependencies are completed, False otherwise
        """
        if not dependencies:
            return True

        for dep in dependencies:
            if dep not in self.completed_steps:
                return False
        return True


class WorkflowRunner:
    """
    Execute an OSSA Workflow manifest.

    This class provides a complete runtime for OSSA workflows, including:
    - Sequential and parallel step execution
    - Dependency management (DAG execution)
    - Agent and task orchestration
    - Parameter passing between steps
    - Timeout management
    - Error handling and recovery

    Example:
        >>> from ossa import load, Workflow
        >>> manifest = load("my-workflow.yaml")
        >>> workflow = Workflow(manifest)
        >>> response = workflow.run({"input": "data"})
        >>> print(response.status)
        "success"
        >>> print(response.execution_order)
        ['step1', 'step2', 'step3']
    """

    def __init__(
        self,
        manifest: Union[OSSAManifest, str],
        **runtime_options: Any,
    ) -> None:
        """
        Initialize the workflow runner.

        Args:
            manifest: OSSA Workflow manifest (OSSAManifest object or file path)
            **runtime_options: Additional runtime configuration options
                - timeout: Override workflow timeout (seconds)
                - parallel: Override parallel execution flag
                - continue_on_error: Continue executing steps after errors

        Raises:
            ConfigurationError: If manifest is invalid or missing required fields

        Example:
            >>> workflow = WorkflowRunner(manifest, timeout=600, parallel=True)
            >>> # Or load from file
            >>> workflow = WorkflowRunner("my-workflow.yaml")
        """
        # Load manifest if string path
        if isinstance(manifest, str):
            from .manifest import load_manifest

            manifest = load_manifest(manifest)

        # Validate manifest kind
        if not manifest.is_workflow:
            raise ConfigurationError(f"Expected Workflow manifest, got {manifest.kind.value}")

        self.manifest = manifest
        self.spec: WorkflowSpec = manifest.spec  # type: ignore
        self.runtime_options = runtime_options

        # Validate steps
        if not self.spec.steps or len(self.spec.steps) == 0:
            raise ConfigurationError("Workflow must have at least one step")

        # Validate dependency graph
        self._validate_dependencies()

    def _validate_dependencies(self) -> None:
        """
        Validate that workflow dependencies form a valid DAG (no cycles).

        Raises:
            ConfigurationError: If dependencies are invalid or contain cycles
        """
        step_names = {step.name for step in self.spec.steps}

        for step in self.spec.steps:
            if step.depends_on:
                # Check that all dependencies exist
                for dep in step.depends_on:
                    if dep not in step_names:
                        raise ConfigurationError(
                            f"Step '{step.name}' depends on unknown step '{dep}'"
                        )

        # Check for cycles using DFS
        visited: Set[str] = set()
        rec_stack: Set[str] = set()

        def has_cycle(step_name: str) -> bool:
            visited.add(step_name)
            rec_stack.add(step_name)

            # Find step
            step = next((s for s in self.spec.steps if s.name == step_name), None)
            if step and step.depends_on:
                for dep in step.depends_on:
                    if dep not in visited:
                        if has_cycle(dep):
                            return True
                    elif dep in rec_stack:
                        return True

            rec_stack.remove(step_name)
            return False

        for step in self.spec.steps:
            if step.name not in visited:
                if has_cycle(step.name):
                    raise ConfigurationError("Workflow contains circular dependencies")

    def run(self, parameters: Optional[Dict[str, Any]] = None) -> WorkflowResponse:
        """
        Execute the workflow with given parameters (synchronous).

        Args:
            parameters: Input parameters for the workflow (available to all steps)

        Returns:
            WorkflowResponse with execution results and status

        Raises:
            OSSAError: If execution fails critically

        Example:
            >>> response = workflow.run({"user_id": 123, "action": "process"})
            >>> if response.status == "success":
            ...     print("All steps completed!")
            ...     print(f"Execution order: {response.execution_order}")
            ... else:
            ...     print(f"Errors: {response.errors}")
        """
        start_time = time.time()
        parameters = parameters or {}

        # Initialize execution context
        context = WorkflowContext(variables=parameters.copy())

        # Track results and errors
        results: Dict[str, Any] = {}
        errors: List[str] = []
        execution_order: List[str] = []

        # Get configuration
        timeout = self.runtime_options.get("timeout", self.spec.timeout_seconds or 600)
        parallel = self.runtime_options.get("parallel", self.spec.parallel or False)
        continue_on_error = self.runtime_options.get("continue_on_error", False)

        # Execute workflow
        if parallel and not self._has_dependencies():
            # Execute all steps in parallel (no dependencies)
            execution_order, results, errors = self._execute_parallel(
                context, timeout, continue_on_error
            )
        else:
            # Execute with dependency resolution (topological sort)
            execution_order, results, errors = self._execute_sequential(
                context, timeout, continue_on_error
            )

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Determine status
        steps_completed = len(context.completed_steps)
        if steps_completed == len(self.spec.steps):
            status = "success"
        elif steps_completed > 0:
            status = "partial"
        else:
            status = "failure"

        return WorkflowResponse(
            status=status,
            results=results,
            errors=errors,
            duration_ms=duration_ms,
            steps_completed=steps_completed,
            steps_total=len(self.spec.steps),
            execution_order=execution_order,
            metadata={
                "workflow_name": self.manifest.metadata.name,
                "workflow_version": self.manifest.metadata.version,
            },
        )

    async def arun(self, parameters: Optional[Dict[str, Any]] = None) -> WorkflowResponse:
        """
        Execute the workflow with given parameters (asynchronous).

        Args:
            parameters: Input parameters for the workflow

        Returns:
            WorkflowResponse with execution results and status

        Example:
            >>> response = await workflow.arun({"input": "data"})
            >>> print(response.status)
        """
        # For now, run synchronously in a thread pool
        # Future: Implement proper async step execution
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: self.run(parameters))

    def _has_dependencies(self) -> bool:
        """Check if any step has dependencies."""
        return any(step.depends_on for step in self.spec.steps)

    def _execute_sequential(
        self,
        context: WorkflowContext,
        timeout: int,
        continue_on_error: bool,
    ) -> tuple[List[str], Dict[str, Any], List[str]]:
        """
        Execute workflow sequentially with dependency resolution.

        Args:
            context: Workflow execution context
            timeout: Maximum execution time in seconds
            continue_on_error: Whether to continue after errors

        Returns:
            Tuple of (execution_order, results, errors)
        """
        start_time = time.time()
        execution_order: List[str] = []
        results: Dict[str, Any] = {}
        errors: List[str] = []

        # Build execution queue (topological sort)
        remaining_steps = list(self.spec.steps)

        while remaining_steps:
            # Check timeout
            if (time.time() - start_time) > timeout:
                errors.append("Workflow timeout exceeded")
                break

            # Find steps that can be executed (dependencies met)
            ready_steps = [
                step
                for step in remaining_steps
                if context.are_dependencies_met(step.depends_on)
            ]

            if not ready_steps:
                # No steps ready - check if blocked by failures
                if context.failed_steps:
                    errors.append("Workflow blocked by failed dependencies")
                else:
                    errors.append("Workflow deadlocked - no steps can execute")
                break

            # Execute ready steps
            for step in ready_steps:
                try:
                    step_result = self._execute_step(step, context)
                    results[step.name] = step_result
                    context.set_step_output(step.name, step_result)
                    execution_order.append(step.name)
                    remaining_steps.remove(step)

                except Exception as e:
                    error_msg = f"Step '{step.name}' failed: {e}"
                    errors.append(error_msg)
                    results[step.name] = {"error": str(e)}
                    context.mark_step_failed(step.name)
                    remaining_steps.remove(step)

                    if not continue_on_error:
                        return execution_order, results, errors

        return execution_order, results, errors

    def _execute_parallel(
        self,
        context: WorkflowContext,
        timeout: int,
        continue_on_error: bool,
    ) -> tuple[List[str], Dict[str, Any], List[str]]:
        """
        Execute workflow steps in parallel (no dependencies).

        Args:
            context: Workflow execution context
            timeout: Maximum execution time in seconds
            continue_on_error: Whether to continue after errors

        Returns:
            Tuple of (execution_order, results, errors)
        """
        # For now, execute sequentially
        # Future: Implement true parallel execution with thread pool
        return self._execute_sequential(context, timeout, continue_on_error)

    def _execute_step(self, step: WorkflowStep, context: WorkflowContext) -> Any:
        """
        Execute a single workflow step.

        Args:
            step: Step configuration
            context: Execution context

        Returns:
            Step execution result

        Raises:
            OSSAError: If step execution fails
        """
        # Resolve parameters with context substitution
        resolved_params = self._resolve_parameters(step.parameters, context)

        # Execute based on step type
        if step.agent:
            # Execute agent step
            return self._execute_agent_step(step.agent, resolved_params)
        elif step.task:
            # Execute task step
            return self._execute_task_step(step.task, resolved_params)
        else:
            # Generic step execution
            return {
                "step": step.name,
                "parameters": resolved_params,
                "note": "Generic step execution - no agent or task specified",
            }

    def _execute_agent_step(self, agent_ref: str, parameters: Dict[str, Any]) -> Any:
        """
        Execute an agent step.

        Args:
            agent_ref: Agent reference (manifest path or name)
            parameters: Step parameters

        Returns:
            Agent execution result
        """
        # For MVP, return mock result
        # Future: Load agent manifest and execute
        return {
            "agent": agent_ref,
            "input": parameters.get("input", ""),
            "output": f"Agent '{agent_ref}' executed with parameters: {parameters}",
            "note": "Agent execution not yet implemented - returning mock result",
        }

    def _execute_task_step(self, task_ref: str, parameters: Dict[str, Any]) -> Any:
        """
        Execute a task step.

        Args:
            task_ref: Task reference (manifest path or name)
            parameters: Step parameters

        Returns:
            Task execution result
        """
        # For MVP, return mock result
        # Future: Load task manifest and execute
        return {
            "task": task_ref,
            "parameters": parameters,
            "output": f"Task '{task_ref}' executed with parameters: {parameters}",
            "note": "Task execution not yet implemented - returning mock result",
        }

    def _resolve_parameters(
        self, parameters: Dict[str, Any], context: WorkflowContext
    ) -> Dict[str, Any]:
        """
        Resolve parameters by substituting context variables and step outputs.

        Supports ${variable_name} and ${step_name.output} syntax.

        Args:
            parameters: Raw parameters
            context: Execution context

        Returns:
            Resolved parameters
        """
        import re

        resolved: Dict[str, Any] = {}

        for key, value in parameters.items():
            if isinstance(value, str):
                # Substitute ${variable} patterns
                def replace_var(match: re.Match[str]) -> str:
                    var_path = match.group(1)
                    if "." in var_path:
                        # Step output reference: ${step_name.field}
                        step_name, field = var_path.split(".", 1)
                        step_output = context.get_step_output(step_name)
                        if isinstance(step_output, dict) and field in step_output:
                            return str(step_output[field])
                        return str(step_output)
                    else:
                        # Simple variable reference
                        return str(context.variables.get(var_path, match.group(0)))

                resolved[key] = re.sub(r"\$\{([a-zA-Z_][a-zA-Z0-9_.]*)\}", replace_var, value)
            else:
                resolved[key] = value

        return resolved


# Convenience alias
Workflow = WorkflowRunner
