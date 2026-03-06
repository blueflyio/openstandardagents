"""Shared fixtures for OSSA SDK tests."""

import sys
from pathlib import Path

import pytest

# Ensure the SDK root and tests dir are on sys.path.
SDK_ROOT = Path(__file__).resolve().parent.parent
TESTS_DIR = Path(__file__).resolve().parent
for p in [str(SDK_ROOT), str(TESTS_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from ossa.types import Kind, LLMConfig, Metadata, OSSAManifest
from _testdata import FULL_AGENT_DICT, MINIMAL_AGENT_DICT


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
