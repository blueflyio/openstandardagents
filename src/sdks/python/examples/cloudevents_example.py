#!/usr/bin/env python3
"""
CloudEvents Example for OSSA Python SDK

Demonstrates:
- Basic event emission
- Event batching
- Multiple sinks (stdout, HTTP, Kafka)
- OSSA event types
- Distributed tracing context
"""

import time
from ossa.events import (
    CloudEventsEmitter,
    CloudEvent,
    HttpSink,
    KafkaSink,
    StdoutSink,
    OSSA_EVENT_TYPES,
)


def example_basic_emission():
    """Example: Basic event emission to stdout."""
    print("=" * 60)
    print("Example 1: Basic Event Emission")
    print("=" * 60)

    # Create emitter with stdout sink
    emitter = CloudEventsEmitter(
        source="ossa/example-agent",
        sink=StdoutSink(pretty=True),
    )

    # Emit agent started event
    emitter.emit(
        OSSA_EVENT_TYPES.AGENT_STARTED,
        {
            "agent_id": "example-001",
            "version": "1.0.0",
            "status": "initializing",
        },
        ossaagentid="example-agent",
        ossainteractionid="interaction-123",
    )

    print()


def example_batching():
    """Example: Event batching with auto-flush."""
    print("=" * 60)
    print("Example 2: Event Batching")
    print("=" * 60)

    # Create emitter with batching
    with CloudEventsEmitter(
        source="ossa/batch-agent",
        sink=StdoutSink(pretty=False),
        batch_size=3,
    ) as emitter:
        print("Emitting 5 events (batch_size=3)...")

        for i in range(5):
            emitter.emit(
                OSSA_EVENT_TYPES.TOOL_CALLED,
                {"tool": f"tool-{i}", "iteration": i},
                ossaagentid="batch-agent",
            )
            print(f"  Emitted event {i+1}")

        print("\nContext manager will auto-flush remaining events on exit...")

    print()


def example_http_sink():
    """Example: HTTP sink configuration."""
    print("=" * 60)
    print("Example 3: HTTP Sink (Demo Only)")
    print("=" * 60)

    # Configure HTTP sink (would send to actual endpoint)
    sink = HttpSink(
        url="https://events.example.com/webhook",
        headers={"Authorization": "Bearer YOUR_TOKEN"},
        mode="structured",  # or "binary"
        timeout=30,
    )

    emitter = CloudEventsEmitter(
        source="ossa/http-agent",
        sink=sink,
    )

    print("HTTP sink configured:")
    print(f"  URL: {sink.config.url}")
    print(f"  Mode: {sink.config.mode}")
    print(f"  Timeout: {sink.config.timeout}s")
    print("\n(Would send events to HTTP endpoint)")
    print()


def example_kafka_sink():
    """Example: Kafka sink configuration."""
    print("=" * 60)
    print("Example 4: Kafka Sink (Demo Only)")
    print("=" * 60)

    # Configure Kafka sink (requires kafka-python package)
    sink = KafkaSink(
        bootstrap_servers=["localhost:9092"],
        topic="ossa-events",
        client_id="ossa-example",
        key_field="ossaagentid",  # Use agent ID as message key
    )

    emitter = CloudEventsEmitter(
        source="ossa/kafka-agent",
        sink=sink,
    )

    print("Kafka sink configured:")
    print(f"  Bootstrap servers: {sink.config.bootstrap_servers}")
    print(f"  Topic: {sink.config.topic}")
    print(f"  Key field: {sink.config.key_field}")
    print("\n(Would send events to Kafka topic)")
    print()


def example_workflow_events():
    """Example: Complete agent workflow with events."""
    print("=" * 60)
    print("Example 5: Agent Workflow Events")
    print("=" * 60)

    with CloudEventsEmitter(
        source="ossa/workflow-agent",
        sink=StdoutSink(pretty=True),
    ) as emitter:
        # Agent started
        emitter.emit(
            OSSA_EVENT_TYPES.AGENT_STARTED,
            {
                "agent_id": "workflow-001",
                "task": "data processing",
            },
            ossaagentid="workflow-agent",
            ossainteractionid="workflow-session-456",
            ossatraceid="trace-abc123",
        )

        # Turn started
        emitter.emit(
            OSSA_EVENT_TYPES.TURN_STARTED,
            {"turn_number": 1, "user_input": "Process data"},
            ossaagentid="workflow-agent",
            ossainteractionid="workflow-session-456",
            ossatraceid="trace-abc123",
            ossaspanid="span-001",
        )

        # Tool called
        emitter.emit(
            OSSA_EVENT_TYPES.TOOL_CALLED,
            {
                "tool_name": "database_query",
                "parameters": {"query": "SELECT * FROM users"},
            },
            ossaagentid="workflow-agent",
            ossainteractionid="workflow-session-456",
            ossatraceid="trace-abc123",
            ossaspanid="span-002",
        )

        # Tool completed
        emitter.emit(
            OSSA_EVENT_TYPES.TOOL_COMPLETED,
            {
                "tool_name": "database_query",
                "result": {"rows": 100, "duration_ms": 45},
            },
            ossaagentid="workflow-agent",
            ossainteractionid="workflow-session-456",
            ossatraceid="trace-abc123",
            ossaspanid="span-002",
        )

        # Turn completed
        emitter.emit(
            OSSA_EVENT_TYPES.TURN_COMPLETED,
            {
                "turn_number": 1,
                "status": "success",
                "response": "Data processed successfully",
            },
            ossaagentid="workflow-agent",
            ossainteractionid="workflow-session-456",
            ossatraceid="trace-abc123",
            ossaspanid="span-001",
        )

        # Agent completed
        emitter.emit(
            OSSA_EVENT_TYPES.AGENT_COMPLETED,
            {
                "agent_id": "workflow-001",
                "status": "success",
                "duration_ms": 250,
            },
            ossaagentid="workflow-agent",
            ossainteractionid="workflow-session-456",
            ossatraceid="trace-abc123",
        )

    print()


def example_custom_events():
    """Example: Custom event types."""
    print("=" * 60)
    print("Example 6: Custom Event Types")
    print("=" * 60)

    emitter = CloudEventsEmitter(
        source="ossa/custom-agent",
        sink=StdoutSink(pretty=True),
    )

    # Custom domain event
    emitter.emit(
        "com.example.order.created",
        {
            "order_id": "ORDER-12345",
            "customer": "john@example.com",
            "total": 99.99,
            "items": 3,
        },
        subject="orders/ORDER-12345",
        datacontenttype="application/json",
    )

    # Custom OSSA extension event
    emitter.emit(
        "dev.ossa.custom.model.loaded",
        {
            "model": "claude-3-5-sonnet-20241022",
            "provider": "anthropic",
            "cache_hit": True,
        },
        ossaagentid="custom-agent",
    )

    print()


def main():
    """Run all examples."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "OSSA CloudEvents Python SDK Examples" + " " * 11 + "║")
    print("╚" + "═" * 58 + "╝")
    print()

    example_basic_emission()
    example_batching()
    example_http_sink()
    example_kafka_sink()
    example_workflow_events()
    example_custom_events()

    print("=" * 60)
    print("All examples completed!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  1. Install optional dependencies: pip install ossa-sdk[events]")
    print("  2. Configure your preferred sink (HTTP, Kafka, stdout)")
    print("  3. Integrate CloudEvents into your agent workflows")
    print("  4. See docs: https://openstandardagents.org/docs/events")
    print()


if __name__ == "__main__":
    main()
