# LangChain Messaging Adapter

**Version**: 0.3.1
**Framework**: LangChain
**Status**: Draft

## Overview

This document specifies how OSSA v0.3.1 messaging concepts map to LangChain primitives. LangChain uses callbacks, event streams, and tool definitions for inter-component communication.

## Mapping Table

| OSSA Concept | LangChain Equivalent |
|--------------|---------------------|
| `publishes` | Callbacks / Event emitters |
| `subscribes` | Event listeners / Callback handlers |
| `commands` | Tool definitions |
| `routing` | Chain composition |
| `reliability` | Retry decorators / Error handlers |

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

**LangChain Implementation**:
```python
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import AIMessage
from pydantic import BaseModel
from enum import Enum

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class VulnerabilityMessage(BaseModel):
    vulnerability_id: str
    severity: Severity
    cve_id: str | None = None
    affected_package: str | None = None

class OSSAMessagingCallback(BaseCallbackHandler):
    """Callback handler that publishes to OSSA channels."""

    def __init__(self, channel: str, broker_client):
        self.channel = channel
        self.broker = broker_client

    async def on_agent_action(self, action, **kwargs):
        if action.tool == "report_vulnerability":
            message = VulnerabilityMessage(**action.tool_input)
            await self.broker.publish(
                channel=self.channel,
                payload=message.model_dump()
            )

# Usage in agent
agent = create_agent(
    llm=llm,
    tools=tools,
    callbacks=[
        OSSAMessagingCallback(
            channel="security.vulnerabilities",
            broker_client=broker
        )
    ]
)
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

**LangChain Implementation**:
```python
from langchain_core.runnables import RunnableLambda
import asyncio

class OSSAMessageSubscriber:
    """Subscribe to OSSA channels and invoke LangChain chains."""

    def __init__(self, broker_client, chain):
        self.broker = broker_client
        self.chain = chain

    async def subscribe(
        self,
        channel: str,
        handler: str,
        filter_fields: dict | None = None
    ):
        async def message_handler(message):
            # Apply filter
            if filter_fields:
                for field, allowed_values in filter_fields.items():
                    if message.payload.get(field) not in allowed_values:
                        return  # Skip filtered messages

            # Invoke chain with message
            result = await self.chain.ainvoke({
                "message": message.payload,
                "metadata": message.metadata
            })

            # Acknowledge message
            await self.broker.ack(message.id)

        await self.broker.subscribe(channel, message_handler)

# Usage
subscriber = OSSAMessageSubscriber(broker, analysis_chain)
await subscriber.subscribe(
    channel="dependency.updates",
    handler="process_dependency_update",
    filter_fields={"severity": ["high", "critical"]}
)
```

### Commands as Tools

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
            version: { type: string }
          required: [package_name]
        outputSchema:
          type: object
          properties:
            vulnerabilities: { type: array }
```

**LangChain Implementation**:
```python
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

class ScanPackageInput(BaseModel):
    package_name: str = Field(description="Package to scan")
    version: str | None = Field(default=None, description="Package version")

class ScanPackageOutput(BaseModel):
    vulnerabilities: list[dict]
    scan_status: str

class OSSACommandTool(BaseTool):
    """Tool that wraps an OSSA command."""

    name: str = "scan_package"
    description: str = "Scan a package for security vulnerabilities"
    args_schema: type[BaseModel] = ScanPackageInput
    return_direct: bool = False

    broker_client: Any
    target_agent: str
    timeout: int = 30

    async def _arun(
        self,
        package_name: str,
        version: str | None = None
    ) -> ScanPackageOutput:
        response = await self.broker_client.command(
            target=self.target_agent,
            command="scan_package",
            input={"package_name": package_name, "version": version},
            timeout=self.timeout
        )
        return ScanPackageOutput(**response)

# Register tool with agent
tools = [
    OSSACommandTool(
        broker_client=broker,
        target_agent="security-scanner"
    )
]
```

### Routing via Chain Composition

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

**LangChain Implementation**:
```python
from langchain_core.runnables import RunnableParallel, RunnableBranch

# Create routing chain
def severity_filter(message):
    return message["severity"] in ["high", "critical"]

routing_chain = RunnableBranch(
    (
        lambda x: severity_filter(x),
        RunnableParallel(
            security_scanner=security_scanner_chain,
            monitoring_agent=monitoring_agent_chain
        )
    ),
    # Default: drop message
    RunnableLambda(lambda x: {"dropped": True})
)

# Process messages through routing
async def process_message(message):
    if message["source"] == "dependency-healer" and \
       message["channel"] == "security.vulnerabilities":
        return await routing_chain.ainvoke(message["payload"])
```

### Reliability with Retries

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

**LangChain Implementation**:
```python
from langchain_core.runnables import RunnableRetry
from tenacity import retry, stop_after_attempt, wait_exponential

# Using RunnableRetry
reliable_chain = chain.with_retry(
    stop_after_attempt=3,
    wait_exponential_jitter=True
)

# Or using tenacity decorator
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=30)
)
async def send_with_retry(broker, channel, payload):
    await broker.publish(channel=channel, payload=payload)
```

## Complete Example

```python
from langchain_openai import ChatOpenAI
from langchain_core.agents import AgentExecutor
from langchain.agents import create_openai_tools_agent

# OSSA manifest equivalent
OSSA_MANIFEST = {
    "apiVersion": "ossa/v0.3.1",
    "kind": "Agent",
    "metadata": {"name": "security-scanner"},
    "spec": {
        "role": "Scan dependencies for vulnerabilities",
        "messaging": {
            "publishes": [{
                "channel": "security.vulnerabilities",
                "schema": {"type": "object"}
            }],
            "subscribes": [{
                "channel": "dependency.updates",
                "handler": "process_update"
            }],
            "commands": [{
                "name": "scan_package",
                "inputSchema": {"type": "object"}
            }]
        }
    }
}

class OSSALangChainAgent:
    """OSSA-compliant LangChain agent with messaging."""

    def __init__(self, manifest: dict, broker_client):
        self.manifest = manifest
        self.broker = broker_client
        self.llm = ChatOpenAI(model="gpt-4")
        self._setup_messaging()

    def _setup_messaging(self):
        messaging = self.manifest["spec"].get("messaging", {})

        # Setup publishers
        self.publishers = {}
        for pub in messaging.get("publishes", []):
            self.publishers[pub["channel"]] = OSSAMessagingCallback(
                channel=pub["channel"],
                broker_client=self.broker
            )

        # Setup command tools
        self.tools = []
        for cmd in messaging.get("commands", []):
            self.tools.append(self._create_command_tool(cmd))

    def _create_command_tool(self, command: dict) -> BaseTool:
        # Create Pydantic model from schema
        input_schema = self._schema_to_pydantic(command["inputSchema"])

        return OSSACommandTool(
            name=command["name"],
            description=command.get("description", ""),
            args_schema=input_schema,
            broker_client=self.broker,
            target_agent=self.manifest["metadata"]["name"],
            timeout=command.get("timeoutSeconds", 30)
        )

    async def publish(self, channel: str, payload: dict):
        """Publish message to OSSA channel."""
        await self.broker.publish(
            channel=channel,
            payload=payload,
            source=self.manifest["metadata"]["name"]
        )

    async def run(self, input: str):
        """Run the agent with OSSA messaging support."""
        agent = create_openai_tools_agent(
            self.llm,
            self.tools,
            prompt=self._create_prompt()
        )

        executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            callbacks=list(self.publishers.values())
        )

        return await executor.ainvoke({"input": input})

# Usage
agent = OSSALangChainAgent(OSSA_MANIFEST, broker_client)
await agent.run("Scan lodash@4.17.20 for vulnerabilities")
```

## Tracing Integration

LangChain's LangSmith tracing integrates with OSSA observability:

```python
from langsmith import Client

# Propagate OSSA trace context to LangSmith
def create_langsmith_run(ossa_message):
    return {
        "name": f"ossa:{ossa_message['channel']}",
        "run_type": "chain",
        "inputs": ossa_message["payload"],
        "extra": {
            "ossa_trace_id": ossa_message["metadata"]["traceId"],
            "ossa_span_id": ossa_message["metadata"]["spanId"],
            "ossa_source": ossa_message["source"]
        }
    }
```

## References

- [LangChain Callbacks](https://python.langchain.com/docs/modules/callbacks/)
- [LangChain Tools](https://python.langchain.com/docs/modules/tools/)
- [LangChain Runnables](https://python.langchain.com/docs/expression_language/)
