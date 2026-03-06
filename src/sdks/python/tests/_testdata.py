"""Shared test data constants for OSSA SDK tests."""

MINIMAL_AGENT_DICT = {
    "apiVersion": "ossa/v0.5",
    "kind": "Agent",
    "metadata": {"name": "test-agent"},
}

FULL_AGENT_DICT = {
    "apiVersion": "ossa/v0.5",
    "kind": "Agent",
    "metadata": {
        "name": "full-agent",
        "version": "1.0.0",
        "namespace": "testing",
        "description": "A fully specified test agent",
        "labels": {"env": "test", "tier": "free"},
    },
    "spec": {
        "role": "You are a helpful test assistant.",
        "llm": {
            "provider": "anthropic",
            "model": "claude-sonnet-4-20250514",
            "temperature": 0.7,
            "maxTokens": 4096,
        },
        "tools": [
            {
                "name": "web_search",
                "type": "function",
                "description": "Search the web",
            }
        ],
    },
}

MINIMAL_AGENT_YAML = """\
apiVersion: ossa/v0.5
kind: Agent
metadata:
  name: test-agent
"""

FULL_AGENT_YAML = """\
apiVersion: ossa/v0.5
kind: Agent
metadata:
  name: full-agent
  version: 1.0.0
  description: A fully specified test agent
spec:
  role: You are a helpful test assistant.
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
    maxTokens: 4096
  tools:
    - name: web_search
      type: function
      description: Search the web
"""

TASK_YAML = """\
apiVersion: ossa/v0.5
kind: Task
metadata:
  name: test-task
  version: 1.0.0
"""

WORKFLOW_YAML = """\
apiVersion: ossa/v0.5
kind: Workflow
metadata:
  name: test-workflow
  version: 1.0.0
"""
