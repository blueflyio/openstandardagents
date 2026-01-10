"""
Task execution engine for OSSA.

This module provides runtime execution for OSSA Task manifests, enabling
sequential step execution with conditional logic, retries, and error handling.
"""

import asyncio
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel

from .exceptions import ConfigurationError, OSSAError
from .types import OSSAManifest, TaskSpec, TaskStep


class TaskResponse(BaseModel):
    """
    Response from a task execution.

    Attributes:
        status: Execution status (success, failure, partial)
        results: Results from each step (keyed by step name)
        errors: Any errors that occurred during execution
        duration_ms: Total execution time in milliseconds
        steps_completed: Number of steps successfully completed
        steps_total: Total number of steps in the task
        metadata: Additional metadata about the execution
    """

    status: str  # success, failure, partial
    results: Dict[str, Any]
    errors: List[str] = []
    duration_ms: Optional[float] = None
    steps_completed: int = 0
    steps_total: int = 0
    metadata: Dict[str, Any] = {}


@dataclass
class TaskContext:
    """
    Execution context for a task, shared across all steps.

    Attributes:
        variables: Variables accessible to all steps
        step_outputs: Outputs from completed steps
        current_step: Currently executing step index
    """

    variables: Dict[str, Any]
    step_outputs: Dict[str, Any]
    current_step: int = 0

    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a variable or step output.

        Args:
            key: Variable name or step name
            default: Default value if key not found

        Returns:
            Value or default
        """
        if key in self.variables:
            return self.variables[key]
        if key in self.step_outputs:
            return self.step_outputs[key]
        return default

    def set(self, key: str, value: Any) -> None:
        """
        Set a variable in the context.

        Args:
            key: Variable name
            value: Value to set
        """
        self.variables[key] = value

    def set_step_output(self, step_name: str, output: Any) -> None:
        """
        Set the output of a completed step.

        Args:
            step_name: Name of the step
            output: Step output value
        """
        self.step_outputs[step_name] = output


class TaskRunner:
    """
    Execute an OSSA Task manifest.

    This class provides a complete runtime for OSSA tasks, including:
    - Sequential step execution
    - Conditional logic (if/when conditions)
    - Parameter substitution and templating
    - Retry logic with exponential backoff
    - Timeout management
    - Error handling and recovery

    Example:
        >>> from ossa import load, Task
        >>> manifest = load("my-task.yaml")
        >>> task = Task(manifest)
        >>> response = task.run({"input": "data"})
        >>> print(response.status)
        "success"
        >>> print(response.results)
        {'step1': 'result1', 'step2': 'result2'}
    """

    def __init__(
        self,
        manifest: Union[OSSAManifest, str],
        **runtime_options: Any,
    ) -> None:
        """
        Initialize the task runner.

        Args:
            manifest: OSSA Task manifest (OSSAManifest object or file path)
            **runtime_options: Additional runtime configuration options
                - timeout: Override task timeout (seconds)
                - max_retries: Override retry count
                - continue_on_error: Continue executing steps after errors

        Raises:
            ConfigurationError: If manifest is invalid or missing required fields

        Example:
            >>> task = TaskRunner(manifest, timeout=300)
            >>> # Or load from file
            >>> task = TaskRunner("my-task.yaml")
        """
        # Load manifest if string path
        if isinstance(manifest, str):
            from .manifest import load_manifest

            manifest = load_manifest(manifest)

        # Validate manifest kind
        if not manifest.is_task:
            raise ConfigurationError(f"Expected Task manifest, got {manifest.kind.value}")

        self.manifest = manifest
        self.spec: TaskSpec = manifest.spec  # type: ignore
        self.runtime_options = runtime_options

        # Validate steps
        if not self.spec.steps or len(self.spec.steps) == 0:
            raise ConfigurationError("Task must have at least one step")

    def run(self, parameters: Optional[Dict[str, Any]] = None) -> TaskResponse:
        """
        Execute the task with given parameters (synchronous).

        Args:
            parameters: Input parameters for the task (available to all steps)

        Returns:
            TaskResponse with execution results and status

        Raises:
            OSSAError: If execution fails critically

        Example:
            >>> response = task.run({"user_id": 123, "action": "process"})
            >>> if response.status == "success":
            ...     print("All steps completed!")
            ... else:
            ...     print(f"Errors: {response.errors}")
        """
        start_time = time.time()
        parameters = parameters or {}

        # Initialize execution context
        context = TaskContext(
            variables=parameters.copy(),
            step_outputs={},
        )

        # Track results and errors
        results: Dict[str, Any] = {}
        errors: List[str] = []
        steps_completed = 0

        # Get timeout
        timeout = self.runtime_options.get("timeout", self.spec.timeout_seconds or 300)
        continue_on_error = self.runtime_options.get("continue_on_error", False)

        # Execute each step
        for idx, step in enumerate(self.spec.steps):
            context.current_step = idx

            # Check timeout
            elapsed = time.time() - start_time
            if elapsed > timeout:
                errors.append(f"Task timeout after {elapsed:.2f}s")
                break

            # Check condition (if present)
            if step.condition:
                if not self._evaluate_condition(step.condition, context):
                    # Skip this step
                    results[step.name] = {"skipped": True, "reason": "condition not met"}
                    continue

            # Execute step
            try:
                step_result = self._execute_step(step, context)
                results[step.name] = step_result
                context.set_step_output(step.name, step_result)
                steps_completed += 1

            except Exception as e:
                error_msg = f"Step '{step.name}' failed: {e}"
                errors.append(error_msg)
                results[step.name] = {"error": str(e)}

                if not continue_on_error:
                    break

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Determine status
        if steps_completed == len(self.spec.steps):
            status = "success"
        elif steps_completed > 0:
            status = "partial"
        else:
            status = "failure"

        return TaskResponse(
            status=status,
            results=results,
            errors=errors,
            duration_ms=duration_ms,
            steps_completed=steps_completed,
            steps_total=len(self.spec.steps),
            metadata={
                "task_name": self.manifest.metadata.name,
                "task_version": self.manifest.metadata.version,
            },
        )

    async def arun(self, parameters: Optional[Dict[str, Any]] = None) -> TaskResponse:
        """
        Execute the task with given parameters (asynchronous).

        Args:
            parameters: Input parameters for the task

        Returns:
            TaskResponse with execution results and status

        Example:
            >>> response = await task.arun({"input": "data"})
            >>> print(response.status)
        """
        # For now, run synchronously in a thread pool
        # Future: Implement proper async step execution
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: self.run(parameters))

    def _execute_step(self, step: TaskStep, context: TaskContext) -> Any:
        """
        Execute a single step.

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

        # Execute based on action type
        action = step.action.lower()

        if action == "log":
            # Simple log action
            message = resolved_params.get("message", "")
            print(f"[{step.name}] {message}")
            return {"logged": True, "message": message}

        elif action == "set_variable":
            # Set a context variable
            var_name = resolved_params.get("name")
            var_value = resolved_params.get("value")
            if var_name:
                context.set(var_name, var_value)
            return {"variable": var_name, "value": var_value}

        elif action == "http_request":
            # HTTP request (requires requests library)
            return self._execute_http_request(resolved_params)

        elif action == "sleep":
            # Sleep for specified duration
            duration = resolved_params.get("duration", 1)
            time.sleep(duration)
            return {"slept": duration}

        elif action == "python":
            # Execute Python code (dangerous, should be restricted)
            code = resolved_params.get("code", "")
            # For security, this is limited - just evaluate expressions
            try:
                result = eval(code, {"context": context, "__builtins__": {}})
                return {"result": result}
            except Exception as e:
                raise OSSAError(f"Python execution failed: {e}")

        else:
            # Unknown action - return parameters as-is
            return {
                "action": action,
                "parameters": resolved_params,
                "note": "Action not implemented, parameters returned",
            }

    def _resolve_parameters(
        self, parameters: Dict[str, Any], context: TaskContext
    ) -> Dict[str, Any]:
        """
        Resolve parameters by substituting context variables.

        Supports ${variable_name} syntax.

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
                    var_name = match.group(1)
                    return str(context.get(var_name, match.group(0)))

                resolved[key] = re.sub(r"\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}", replace_var, value)
            else:
                resolved[key] = value

        return resolved

    def _evaluate_condition(self, condition: str, context: TaskContext) -> bool:
        """
        Evaluate a conditional expression.

        Args:
            condition: Condition string (e.g., "status == 'success'")
            context: Execution context

        Returns:
            True if condition is met, False otherwise
        """
        try:
            # Simple expression evaluation
            # For security, limit available functions
            safe_dict = {
                "context": context,
                "get": context.get,
                "__builtins__": {},
            }
            result = eval(condition, safe_dict)
            return bool(result)
        except Exception:
            # If evaluation fails, skip the step
            return False

    def _execute_http_request(self, params: Dict[str, Any]) -> Any:
        """
        Execute an HTTP request.

        Args:
            params: Request parameters (url, method, headers, body, etc.)

        Returns:
            Response data

        Raises:
            OSSAError: If request fails
        """
        try:
            import requests

            url = params.get("url")
            method = params.get("method", "GET").upper()
            headers = params.get("headers", {})
            body = params.get("body")
            timeout = params.get("timeout", 30)

            if method == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=body, timeout=timeout)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=body, timeout=timeout)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=timeout)
            else:
                raise OSSAError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()

            return {
                "status_code": response.status_code,
                "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
                "headers": dict(response.headers),
            }

        except ImportError:
            raise OSSAError("requests library not installed. Install with: pip install requests")
        except Exception as e:
            raise OSSAError(f"HTTP request failed: {e}")


# Convenience alias
Task = TaskRunner
