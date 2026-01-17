#!/usr/bin/env python3
"""
Complete OSSA Python SDK Example

Demonstrates the full capabilities of the OSSA Python SDK:
- Loading and validating manifests
- Running agents with different LLM providers
- Conversation history management
- Error handling and retries
- Cost tracking
- Async execution

Requirements:
    pip install ossa-sdk[anthropic]  # or [openai] or [all-providers]

Environment Variables:
    ANTHROPIC_API_KEY - Your Anthropic API key
    OPENAI_API_KEY - Your OpenAI API key (if using OpenAI)
"""

import asyncio
import os
from pathlib import Path

from ossa import Agent, load, validate, ConfigurationError, OSSAError


def example_1_basic_agent():
    """Example 1: Basic agent execution with Anthropic Claude."""
    print("\n" + "=" * 60)
    print("EXAMPLE 1: Basic Agent Execution")
    print("=" * 60)

    # Create a simple agent manifest
    manifest_yaml = """
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: calculator-agent
  version: 1.0.0
  description: A helpful calculator agent
spec:
  role: |
    You are a helpful calculator assistant.
    Answer math questions accurately and concisely.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.0
    """

    # Save to temp file
    temp_file = Path("/tmp/calculator-agent.yaml")
    temp_file.write_text(manifest_yaml)

    try:
        # Load and validate manifest
        print("\n1. Loading manifest...")
        manifest = load(str(temp_file))
        print(f"   ✓ Loaded: {manifest.metadata.name} v{manifest.metadata.version}")

        # Validate
        print("\n2. Validating manifest...")
        result = validate(manifest)
        if result.is_valid:
            print("   ✓ Validation passed")
        else:
            print(f"   ✗ Validation failed: {result.errors}")
            return

        # Create agent
        print("\n3. Creating agent...")
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("   ✗ ANTHROPIC_API_KEY not set")
            return

        agent = Agent(manifest, api_key=api_key)
        print("   ✓ Agent initialized")

        # Run agent
        print("\n4. Running agent...")
        response = agent.run("What is 42 * 137?")
        print(f"   Agent: {response.content}")
        print(f"   Duration: {response.duration_ms:.2f}ms")
        print(f"   Provider: {response.metadata['provider']}")
        print(f"   Model: {response.metadata['model']}")

    except ConfigurationError as e:
        print(f"   ✗ Configuration error: {e}")
    except OSSAError as e:
        print(f"   ✗ OSSA error: {e}")
    except Exception as e:
        print(f"   ✗ Unexpected error: {e}")
    finally:
        temp_file.unlink(missing_ok=True)


def example_2_conversation_history():
    """Example 2: Multi-turn conversation with history."""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Conversation History")
    print("=" * 60)

    manifest_yaml = """
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: chat-agent
  version: 1.0.0
spec:
  role: You are a helpful assistant that remembers context from previous messages.
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
    """

    temp_file = Path("/tmp/chat-agent.yaml")
    temp_file.write_text(manifest_yaml)

    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("✗ ANTHROPIC_API_KEY not set")
            return

        manifest = load(str(temp_file))
        agent = Agent(manifest, api_key=api_key)

        # Turn 1
        print("\n1. User: My name is Alice")
        response = agent.run("My name is Alice")
        print(f"   Agent: {response.content}")

        # Turn 2 - Agent should remember the name
        print("\n2. User: What's my name?")
        response = agent.run("What's my name?")
        print(f"   Agent: {response.content}")

        # Turn 3 - Reset and ask again
        print("\n3. Resetting conversation history...")
        agent.reset()
        print("\n4. User: What's my name?")
        response = agent.run("What's my name?")
        print(f"   Agent: {response.content}")
        print("   (Agent should not remember after reset)")

        print(f"\n   Total requests: {agent.get_request_count()}")

    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        temp_file.unlink(missing_ok=True)


async def example_3_async_execution():
    """Example 3: Async execution with concurrent agents."""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Async Execution")
    print("=" * 60)

    manifest_yaml = """
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: async-agent
  version: 1.0.0
spec:
  role: You are a helpful assistant.
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    """

    temp_file = Path("/tmp/async-agent.yaml")
    temp_file.write_text(manifest_yaml)

    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("✗ ANTHROPIC_API_KEY not set")
            return

        manifest = load(str(temp_file))
        agent = Agent(manifest, api_key=api_key)

        # Run multiple requests concurrently
        print("\nRunning 3 requests concurrently...")

        tasks = [
            agent.arun("What is 2 + 2?"),
            agent.arun("What is the capital of France?"),
            agent.arun("What is Python?"),
        ]

        responses = await asyncio.gather(*tasks)

        for i, response in enumerate(responses, 1):
            print(f"\n{i}. Response: {response.content[:100]}...")
            print(f"   Duration: {response.duration_ms:.2f}ms")

    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        temp_file.unlink(missing_ok=True)


def example_4_error_handling():
    """Example 4: Error handling and retries."""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Error Handling")
    print("=" * 60)

    manifest_yaml = """
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: error-agent
  version: 1.0.0
spec:
  role: You are a helpful assistant.
  llm:
    provider: invalid-provider  # This will fail
    model: test-model
    """

    temp_file = Path("/tmp/error-agent.yaml")
    temp_file.write_text(manifest_yaml)

    try:
        print("\n1. Loading manifest with invalid provider...")
        manifest = load(str(temp_file))

        print("\n2. Attempting to create agent...")
        agent = Agent(manifest, api_key="test-key")

        print("\n3. Attempting to run agent...")
        response = agent.run("Hello")
        print(f"   Response: {response.content}")

    except ConfigurationError as e:
        print(f"   ✓ Caught ConfigurationError as expected: {e}")
    except OSSAError as e:
        print(f"   ✓ Caught OSSAError: {e}")
    except Exception as e:
        print(f"   ✗ Unexpected error: {e}")
    finally:
        temp_file.unlink(missing_ok=True)


def example_5_openai_provider():
    """Example 5: Using OpenAI instead of Anthropic."""
    print("\n" + "=" * 60)
    print("EXAMPLE 5: OpenAI Provider")
    print("=" * 60)

    manifest_yaml = """
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: openai-agent
  version: 1.0.0
spec:
  role: You are a helpful assistant.
  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.7
    """

    temp_file = Path("/tmp/openai-agent.yaml")
    temp_file.write_text(manifest_yaml)

    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("✗ OPENAI_API_KEY not set, skipping OpenAI example")
            return

        manifest = load(str(temp_file))
        agent = Agent(manifest, api_key=api_key)

        print("\nRunning agent with OpenAI...")
        response = agent.run("Explain OSSA in one sentence.")
        print(f"   Agent: {response.content}")
        print(f"   Provider: {response.metadata['provider']}")
        print(f"   Model: {response.metadata['model']}")

    except ConfigurationError as e:
        print(f"   Note: {e}")
    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        temp_file.unlink(missing_ok=True)


def main():
    """Run all examples."""
    print("\n" + "=" * 60)
    print("OSSA Python SDK - Complete Examples")
    print("=" * 60)
    print("\nThese examples demonstrate the full capabilities of the")
    print("OSSA Python SDK for building and running AI agents.")

    # Run synchronous examples
    example_1_basic_agent()
    example_2_conversation_history()
    example_4_error_handling()
    example_5_openai_provider()

    # Run async example
    print("\nRunning async example...")
    asyncio.run(example_3_async_execution())

    print("\n" + "=" * 60)
    print("Examples complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  - Read the docs: https://openstandardagents.org/docs/sdks/python")
    print("  - Check out more examples: ./examples/")
    print("  - Build your own agents!")


if __name__ == "__main__":
    main()
