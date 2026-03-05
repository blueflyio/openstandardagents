"""Shared fixtures for OSSA SDK tests."""

import sys
from pathlib import Path

import pytest

# Ensure the SDK root is on sys.path so 'import ossa' works.
SDK_ROOT = Path(__file__).resolve().parent.parent
if str(SDK_ROOT) not in sys.path:
    sys.path.insert(0, str(SDK_ROOT))

from ossa.types import Kind, LLMConfig, Metadata, OSSAManifest


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


@pytest.fixture
def minimal_manifest() -> OSSAManifest:
    """Minimal valid Agent manifest."""
    return OSSAManifest(
        apiVersion="ossa/v0.5",
        kind=Kind.AGENT,
        metadata=Metadata(name="test-agent"),
    )


@pytest.fixture
def full_manifest() -> OSSAManifest:
    """Fully specified Agent manifest."""
    return OSSAManifest.model_validate(FULL_AGENT_DICT)


@pytest.fixture
def task_manifest() -> OSSAManifest:
    """Task manifest."""
    return OSSAManifest(
        apiVersion="ossa/v0.5",
        kind=Kind.TASK,
        metadata=Metadata(name="test-task", version="1.0.0"),
    )


@pytest.fixture
def workflow_manifest() -> OSSAManifest:
    """Workflow manifest."""
    return OSSAManifest(
        apiVersion="ossa/v0.5",
        kind=Kind.WORKFLOW,
        metadata=Metadata(name="test-workflow", version="1.0.0"),
    )
