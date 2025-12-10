# Langflow Messaging Adapter

**Version**: 0.3.1
**Framework**: Langflow
**Status**: Draft

## Overview

This document specifies how OSSA v0.3.1 messaging concepts map to Langflow primitives. Langflow is a visual flow-based framework for building LLM applications with nodes, edges, and data flows.

## Mapping Table

| OSSA Concept | Langflow Equivalent |
|--------------|---------------------|
| `publishes` | Output nodes / Webhook output |
| `subscribes` | Input nodes / Webhook triggers |
| `commands` | Custom components / API endpoints |
| `routing` | Flow connections / Conditional edges |
| `reliability` | Component retry / Error nodes |

## Detailed Mappings

### Publishing Messages

**OSSA Definition**:
```yaml
spec:
  messaging:
    publishes:
      - channel: security.vulnerabilities
        schema:
          type: object
          properties:
            vulnerability_id: { type: string }
            severity: { enum: [low, medium, high, critical] }
```

**Langflow Implementation**:

Custom Component (`ossa_publisher.py`):
```python
from langflow.custom import Component
from langflow.io import MessageTextInput, Output
from langflow.schema import Data
import httpx

class OSSAPublisherComponent(Component):
    """Publish messages to OSSA channels."""

    display_name = "OSSA Publisher"
    description = "Publish messages to OSSA messaging channels"
    icon = "send"

    inputs = [
        MessageTextInput(
            name="channel",
            display_name="Channel",
            info="OSSA channel name (e.g., security.vulnerabilities)",
            required=True
        ),
        MessageTextInput(
            name="broker_url",
            display_name="Broker URL",
            info="OSSA message broker URL",
            required=True
        ),
        DataInput(
            name="payload",
            display_name="Payload",
            info="Message payload to publish",
            required=True
        ),
    ]

    outputs = [
        Output(display_name="Published", name="published", method="publish")
    ]

    async def publish(self) -> Data:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.broker_url}/publish",
                json={
                    "channel": self.channel,
                    "payload": self.payload.data,
                    "source": self.flow_name
                }
            )
            response.raise_for_status()

        return Data(
            data={
                "status": "published",
                "channel": self.channel,
                "message_id": response.json().get("id")
            }
        )
```

**Flow Configuration (JSON)**:
```json
{
  "nodes": [
    {
      "id": "ossa_publisher_1",
      "type": "OSSAPublisherComponent",
      "data": {
        "channel": "security.vulnerabilities",
        "broker_url": "http://ossa-broker:8080"
      }
    }
  ],
  "edges": [
    {
      "source": "llm_output_1",
      "target": "ossa_publisher_1",
      "sourceHandle": "output",
      "targetHandle": "payload"
    }
  ]
}
```

### Subscribing to Messages

**OSSA Definition**:
```yaml
spec:
  messaging:
    subscribes:
      - channel: dependency.updates
        handler: process_dependency_update
        filter:
          fields:
            severity: [high, critical]
```

**Langflow Implementation**:

Custom Component (`ossa_subscriber.py`):
```python
from langflow.custom import Component
from langflow.io import MessageTextInput, Output, BoolInput
from langflow.schema import Data

class OSSASubscriberComponent(Component):
    """Subscribe to OSSA channels and receive messages."""

    display_name = "OSSA Subscriber"
    description = "Receive messages from OSSA channels"
    icon = "inbox"

    inputs = [
        MessageTextInput(
            name="channel",
            display_name="Channel",
            info="OSSA channel to subscribe to",
            required=True
        ),
        MessageTextInput(
            name="broker_url",
            display_name="Broker URL",
            info="OSSA message broker URL",
            required=True
        ),
        MessageTextInput(
            name="filter_field",
            display_name="Filter Field",
            info="Field to filter messages on",
            required=False
        ),
        MessageTextInput(
            name="filter_values",
            display_name="Filter Values",
            info="Comma-separated allowed values",
            required=False
        ),
    ]

    outputs = [
        Output(display_name="Message", name="message", method="receive")
    ]

    async def receive(self) -> Data:
        # This would typically be triggered by webhook
        # For flow execution, we poll for messages
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.broker_url}/subscribe",
                params={
                    "channel": self.channel,
                    "filter_field": self.filter_field,
                    "filter_values": self.filter_values
                }
            )

        message = response.json()

        return Data(
            data={
                "payload": message.get("payload"),
                "metadata": message.get("metadata"),
                "channel": self.channel
            }
        )
```

**Webhook Trigger Flow**:
```json
{
  "nodes": [
    {
      "id": "webhook_trigger_1",
      "type": "WebhookTrigger",
      "data": {
        "endpoint": "/ossa/dependency.updates",
        "method": "POST"
      }
    },
    {
      "id": "filter_1",
      "type": "ConditionalComponent",
      "data": {
        "condition": "severity in ['high', 'critical']"
      }
    },
    {
      "id": "process_1",
      "type": "LLMChain",
      "data": {
        "template": "Analyze this dependency update: {message}"
      }
    }
  ],
  "edges": [
    {
      "source": "webhook_trigger_1",
      "target": "filter_1"
    },
    {
      "source": "filter_1",
      "sourceHandle": "true",
      "target": "process_1"
    }
  ]
}
```

### Commands as API Components

**OSSA Definition**:
```yaml
spec:
  messaging:
    commands:
      - name: scan_package
        inputSchema:
          type: object
          properties:
            package_name: { type: string }
          required: [package_name]
```

**Langflow Implementation**:

Custom Component (`ossa_command.py`):
```python
from langflow.custom import Component
from langflow.io import MessageTextInput, Output, IntInput
from langflow.schema import Data

class OSSACommandComponent(Component):
    """Invoke OSSA commands on remote agents."""

    display_name = "OSSA Command"
    description = "Execute commands on OSSA agents"
    icon = "terminal"

    inputs = [
        MessageTextInput(
            name="target_agent",
            display_name="Target Agent",
            info="OSSA agent to send command to",
            required=True
        ),
        MessageTextInput(
            name="command_name",
            display_name="Command",
            info="Command name to execute",
            required=True
        ),
        MessageTextInput(
            name="broker_url",
            display_name="Broker URL",
            info="OSSA message broker URL",
            required=True
        ),
        DataInput(
            name="input_data",
            display_name="Input",
            info="Command input data",
            required=True
        ),
        IntInput(
            name="timeout",
            display_name="Timeout (seconds)",
            value=30,
            required=False
        ),
    ]

    outputs = [
        Output(display_name="Result", name="result", method="execute")
    ]

    async def execute(self) -> Data:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.broker_url}/command",
                json={
                    "target": self.target_agent,
                    "command": self.command_name,
                    "input": self.input_data.data
                }
            )
            response.raise_for_status()

        return Data(data=response.json())
```

### Routing via Flow Connections

**OSSA Definition**:
```yaml
spec:
  rules:
    - source: dependency-healer
      channel: security.vulnerabilities
      targets:
        - security-scanner
        - monitoring-agent
      filter:
        fields:
          severity: [high, critical]
```

**Langflow Implementation**:

Router Component (`ossa_router.py`):
```python
from langflow.custom import Component
from langflow.io import MessageTextInput, Output, HandleInput
from langflow.schema import Data

class OSSARouterComponent(Component):
    """Route messages to multiple OSSA targets."""

    display_name = "OSSA Router"
    description = "Route messages based on OSSA routing rules"
    icon = "git-branch"

    inputs = [
        DataInput(
            name="message",
            display_name="Message",
            info="Incoming message to route",
            required=True
        ),
        MessageTextInput(
            name="filter_expression",
            display_name="Filter",
            info="Filter expression (e.g., severity in ['high', 'critical'])",
            required=False
        ),
    ]

    outputs = [
        Output(display_name="Target 1", name="target_1", method="route_1"),
        Output(display_name="Target 2", name="target_2", method="route_2"),
        Output(display_name="Filtered Out", name="filtered", method="filter_out"),
    ]

    def _passes_filter(self) -> bool:
        if not self.filter_expression:
            return True

        # Evaluate filter expression against message
        payload = self.message.data.get("payload", {})
        # Simple evaluation - production would use safe eval
        return eval(self.filter_expression, {"severity": payload.get("severity")})

    def route_1(self) -> Data:
        if self._passes_filter():
            return self.message
        return Data(data={"routed": False})

    def route_2(self) -> Data:
        if self._passes_filter():
            return self.message
        return Data(data={"routed": False})

    def filter_out(self) -> Data:
        if not self._passes_filter():
            return self.message
        return Data(data={"routed": True})
```

**Flow JSON with Routing**:
```json
{
  "nodes": [
    {
      "id": "subscriber_1",
      "type": "OSSASubscriberComponent",
      "data": {
        "channel": "security.vulnerabilities"
      }
    },
    {
      "id": "router_1",
      "type": "OSSARouterComponent",
      "data": {
        "filter_expression": "severity in ['high', 'critical']"
      }
    },
    {
      "id": "security_scanner_flow",
      "type": "SubFlow",
      "data": {
        "flow_id": "security-scanner"
      }
    },
    {
      "id": "monitoring_flow",
      "type": "SubFlow",
      "data": {
        "flow_id": "monitoring-agent"
      }
    }
  ],
  "edges": [
    {
      "source": "subscriber_1",
      "target": "router_1",
      "targetHandle": "message"
    },
    {
      "source": "router_1",
      "sourceHandle": "target_1",
      "target": "security_scanner_flow"
    },
    {
      "source": "router_1",
      "sourceHandle": "target_2",
      "target": "monitoring_flow"
    }
  ]
}
```

### Reliability with Retry Components

**OSSA Definition**:
```yaml
spec:
  messaging:
    reliability:
      retry:
        maxAttempts: 3
        backoff:
          strategy: exponential
          initialDelayMs: 1000
```

**Langflow Implementation**:

Retry Component (`ossa_retry.py`):
```python
from langflow.custom import Component
from langflow.io import HandleInput, Output, IntInput, DropdownInput
from langflow.schema import Data
import asyncio

class OSSARetryComponent(Component):
    """Retry failed operations with backoff."""

    display_name = "OSSA Retry"
    description = "Retry operations with configurable backoff"
    icon = "refresh-cw"

    inputs = [
        HandleInput(
            name="operation",
            display_name="Operation",
            info="Operation to retry",
            input_types=["Data"]
        ),
        IntInput(
            name="max_attempts",
            display_name="Max Attempts",
            value=3
        ),
        IntInput(
            name="initial_delay_ms",
            display_name="Initial Delay (ms)",
            value=1000
        ),
        DropdownInput(
            name="backoff_strategy",
            display_name="Backoff Strategy",
            options=["exponential", "linear", "fixed"],
            value="exponential"
        ),
    ]

    outputs = [
        Output(display_name="Success", name="success", method="execute"),
        Output(display_name="Failed", name="failed", method="on_failure"),
    ]

    async def execute(self) -> Data:
        last_error = None

        for attempt in range(self.max_attempts):
            try:
                # Execute the connected operation
                result = await self._execute_operation()
                return result
            except Exception as e:
                last_error = e
                if attempt < self.max_attempts - 1:
                    delay = self._calculate_delay(attempt)
                    await asyncio.sleep(delay / 1000)

        # All retries failed
        self._failed_result = Data(data={"error": str(last_error)})
        raise last_error

    def on_failure(self) -> Data:
        return getattr(self, '_failed_result', Data(data={"error": "Unknown"}))

    def _calculate_delay(self, attempt: int) -> int:
        if self.backoff_strategy == "exponential":
            return self.initial_delay_ms * (2 ** attempt)
        elif self.backoff_strategy == "linear":
            return self.initial_delay_ms * (attempt + 1)
        return self.initial_delay_ms
```

## Complete Flow Example

```json
{
  "name": "OSSA Security Scanner Flow",
  "description": "Langflow implementation of OSSA security-scanner agent",
  "data": {
    "nodes": [
      {
        "id": "webhook_input",
        "type": "WebhookTrigger",
        "position": {"x": 100, "y": 200},
        "data": {
          "endpoint": "/ossa/scan-request",
          "method": "POST"
        }
      },
      {
        "id": "ossa_subscribe",
        "type": "OSSASubscriberComponent",
        "position": {"x": 100, "y": 400},
        "data": {
          "channel": "dependency.updates",
          "broker_url": "${OSSA_BROKER_URL}",
          "filter_field": "severity",
          "filter_values": "high,critical"
        }
      },
      {
        "id": "merge_inputs",
        "type": "DataMerge",
        "position": {"x": 300, "y": 300}
      },
      {
        "id": "llm_analyzer",
        "type": "OpenAIModel",
        "position": {"x": 500, "y": 300},
        "data": {
          "model_name": "gpt-4",
          "temperature": 0,
          "system_message": "You are a security vulnerability analyzer..."
        }
      },
      {
        "id": "retry_wrapper",
        "type": "OSSARetryComponent",
        "position": {"x": 700, "y": 300},
        "data": {
          "max_attempts": 3,
          "initial_delay_ms": 1000,
          "backoff_strategy": "exponential"
        }
      },
      {
        "id": "ossa_publish",
        "type": "OSSAPublisherComponent",
        "position": {"x": 900, "y": 300},
        "data": {
          "channel": "security.vulnerabilities",
          "broker_url": "${OSSA_BROKER_URL}"
        }
      },
      {
        "id": "dlq_handler",
        "type": "OSSAPublisherComponent",
        "position": {"x": 900, "y": 500},
        "data": {
          "channel": "messaging.dlq",
          "broker_url": "${OSSA_BROKER_URL}"
        }
      }
    ],
    "edges": [
      {
        "source": "webhook_input",
        "target": "merge_inputs",
        "sourceHandle": "output",
        "targetHandle": "input_1"
      },
      {
        "source": "ossa_subscribe",
        "target": "merge_inputs",
        "sourceHandle": "message",
        "targetHandle": "input_2"
      },
      {
        "source": "merge_inputs",
        "target": "llm_analyzer",
        "sourceHandle": "merged",
        "targetHandle": "input"
      },
      {
        "source": "llm_analyzer",
        "target": "retry_wrapper",
        "sourceHandle": "output",
        "targetHandle": "operation"
      },
      {
        "source": "retry_wrapper",
        "target": "ossa_publish",
        "sourceHandle": "success",
        "targetHandle": "payload"
      },
      {
        "source": "retry_wrapper",
        "target": "dlq_handler",
        "sourceHandle": "failed",
        "targetHandle": "payload"
      }
    ]
  },
  "ossa_manifest": {
    "apiVersion": "ossa/v0.3.1",
    "kind": "Agent",
    "metadata": {
      "name": "security-scanner"
    },
    "spec": {
      "role": "Scan dependencies for security vulnerabilities",
      "messaging": {
        "publishes": [
          {
            "channel": "security.vulnerabilities",
            "schema": {"type": "object"}
          }
        ],
        "subscribes": [
          {
            "channel": "dependency.updates",
            "handler": "process_update",
            "filter": {
              "fields": {"severity": ["high", "critical"]}
            }
          }
        ]
      }
    }
  }
}
```

## Tracing Integration

Langflow spans integrate with OSSA tracing:

```python
from langflow.custom import Component
from opentelemetry import trace

class TracedComponent(Component):
    """Base component with OSSA trace propagation."""

    def _start_span(self, operation_name: str):
        tracer = trace.get_tracer(__name__)

        # Extract OSSA trace context from input
        ossa_context = self.inputs.get("ossa_metadata", {})

        return tracer.start_as_current_span(
            f"langflow.{operation_name}",
            attributes={
                "ossa.trace_id": ossa_context.get("traceId"),
                "ossa.channel": ossa_context.get("channel"),
                "langflow.node_id": self.id,
                "langflow.flow_id": self.flow_id
            }
        )
```

## References

- [Langflow Documentation](https://docs.langflow.org/)
- [Langflow Custom Components](https://docs.langflow.org/components-custom-components)
- [Langflow API](https://docs.langflow.org/workspace-api)
