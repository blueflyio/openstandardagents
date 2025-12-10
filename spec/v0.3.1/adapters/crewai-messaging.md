# CrewAI Messaging Adapter

**Version**: 0.3.1
**Framework**: CrewAI
**Status**: Draft

## Overview

This document specifies how OSSA v0.3.1 messaging concepts map to CrewAI primitives. CrewAI uses Crews, Agents, and Tasks for multi-agent orchestration with hierarchical delegation.

## Mapping Table

| OSSA Concept | CrewAI Equivalent |
|--------------|-------------------|
| `publishes` | Task outputs / Crew results |
| `subscribes` | Task inputs / Context |
| `commands` | Agent tools / Task definitions |
| `routing` | Crew process / Task dependencies |
| `reliability` | Task retry / Error handling |

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

**CrewAI Implementation**:
```python
from crewai import Agent, Task, Crew
from pydantic import BaseModel

class VulnerabilityOutput(BaseModel):
    vulnerability_id: str
    severity: str
    cve_id: str | None = None
    affected_package: str | None = None

class OSSAPublisher:
    """Publish CrewAI task outputs to OSSA channels."""

    def __init__(self, broker_client):
        self.broker = broker_client

    async def publish_task_output(
        self,
        channel: str,
        task_output,
        source_agent: str
    ):
        """Publish task output to OSSA channel."""
        payload = task_output.model_dump() if hasattr(task_output, 'model_dump') else task_output

        await self.broker.publish(
            channel=channel,
            payload=payload,
            source=source_agent
        )

# Task that publishes to OSSA channel
def create_publishing_task(
    agent: Agent,
    channel: str,
    broker_client
) -> Task:
    publisher = OSSAPublisher(broker_client)

    async def callback(output):
        await publisher.publish_task_output(
            channel=channel,
            task_output=output,
            source_agent=agent.role
        )

    return Task(
        description="Scan for vulnerabilities and report findings",
        expected_output="Vulnerability report with severity ratings",
        agent=agent,
        output_pydantic=VulnerabilityOutput,
        callback=callback
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

**CrewAI Implementation**:
```python
from crewai import Agent, Task, Crew
from crewai.tasks.task_output import TaskOutput

class OSSASubscriber:
    """Subscribe to OSSA channels and create CrewAI tasks."""

    def __init__(self, broker_client, crew: Crew):
        self.broker = broker_client
        self.crew = crew

    async def subscribe(
        self,
        channel: str,
        agent: Agent,
        filter_fields: dict | None = None
    ):
        async def message_handler(message):
            # Apply filter
            if filter_fields:
                for field, allowed_values in filter_fields.items():
                    if message.payload.get(field) not in allowed_values:
                        return

            # Create task from message
            task = Task(
                description=f"Process {channel} message: {message.payload}",
                expected_output="Processed result",
                agent=agent,
                context=[TaskOutput(raw=str(message.payload))]
            )

            # Execute task
            result = await self.crew.kickoff_async(tasks=[task])

            # Acknowledge
            await self.broker.ack(message.id)

            return result

        await self.broker.subscribe(channel, message_handler)

# Usage
subscriber = OSSASubscriber(broker, crew)
await subscriber.subscribe(
    channel="dependency.updates",
    agent=security_agent,
    filter_fields={"severity": ["high", "critical"]}
)
```

### Commands as Agent Tools

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
        outputSchema:
          type: object
          properties:
            vulnerabilities: { type: array }
```

**CrewAI Implementation**:
```python
from crewai import Agent
from crewai_tools import BaseTool
from pydantic import BaseModel, Field

class ScanPackageInput(BaseModel):
    package_name: str = Field(description="Package name to scan")
    version: str | None = Field(default=None, description="Package version")

class OSSACommandTool(BaseTool):
    """CrewAI tool that invokes OSSA commands on remote agents."""

    name: str = "scan_package"
    description: str = "Scan a package for vulnerabilities via OSSA messaging"

    broker_client: Any
    target_agent: str
    timeout: int = 30

    def _run(self, package_name: str, version: str | None = None) -> str:
        import asyncio
        return asyncio.run(self._arun(package_name, version))

    async def _arun(self, package_name: str, version: str | None = None) -> str:
        response = await self.broker_client.command(
            target=self.target_agent,
            command="scan_package",
            input={"package_name": package_name, "version": version},
            timeout=self.timeout
        )
        return str(response)

# Create agent with OSSA tools
security_scanner = Agent(
    role="Security Scanner",
    goal="Identify vulnerabilities in dependencies",
    backstory="Expert security analyst",
    tools=[
        OSSACommandTool(
            broker_client=broker,
            target_agent="vulnerability-db"
        )
    ]
)
```

### Routing via Crew Process

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

**CrewAI Implementation**:
```python
from crewai import Crew, Agent, Task, Process

# Define agents (targets)
security_scanner = Agent(
    role="Security Scanner",
    goal="Analyze vulnerabilities in detail",
    backstory="Security expert"
)

monitoring_agent = Agent(
    role="Monitoring Agent",
    goal="Track and alert on security issues",
    backstory="Operations specialist"
)

# Routing is handled by crew process
class OSSARoutingCrew:
    """Crew that routes OSSA messages to appropriate agents."""

    def __init__(self, broker_client):
        self.broker = broker_client
        self.agents = {
            "security-scanner": security_scanner,
            "monitoring-agent": monitoring_agent
        }

    def create_routing_crew(
        self,
        targets: list[str],
        process: Process = Process.parallel
    ) -> Crew:
        agents = [self.agents[t] for t in targets if t in self.agents]

        return Crew(
            agents=agents,
            process=process,
            verbose=True
        )

    async def route_message(
        self,
        message,
        rule: dict
    ):
        # Apply filter
        if rule.get("filter", {}).get("fields"):
            for field, allowed in rule["filter"]["fields"].items():
                if message.payload.get(field) not in allowed:
                    return None

        # Create crew for targets
        crew = self.create_routing_crew(
            targets=rule["targets"],
            process=Process.parallel  # Fan-out to all targets
        )

        # Create tasks for each agent
        tasks = [
            Task(
                description=f"Process vulnerability: {message.payload}",
                expected_output="Analysis result",
                agent=agent
            )
            for agent in crew.agents
        ]

        # Execute
        return await crew.kickoff_async(tasks=tasks)

# Usage
router = OSSARoutingCrew(broker)
await router.route_message(message, routing_rule)
```

### Reliability with Task Retries

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

**CrewAI Implementation**:
```python
from crewai import Task
import asyncio

class ReliableTask(Task):
    """Task with OSSA-style retry logic."""

    max_attempts: int = 3
    initial_delay_ms: int = 1000
    backoff_strategy: str = "exponential"

    async def execute_with_retry(self) -> TaskOutput:
        last_error = None

        for attempt in range(self.max_attempts):
            try:
                return await self.execute_async()
            except Exception as e:
                last_error = e

                if attempt < self.max_attempts - 1:
                    delay = self._calculate_delay(attempt)
                    await asyncio.sleep(delay / 1000)

        raise last_error

    def _calculate_delay(self, attempt: int) -> int:
        if self.backoff_strategy == "exponential":
            return self.initial_delay_ms * (2 ** attempt)
        elif self.backoff_strategy == "linear":
            return self.initial_delay_ms * (attempt + 1)
        return self.initial_delay_ms

# Usage
task = ReliableTask(
    description="Process message with retry",
    expected_output="Processed result",
    agent=agent,
    max_attempts=3,
    initial_delay_ms=1000,
    backoff_strategy="exponential"
)
```

## Complete Example

```python
from crewai import Agent, Task, Crew, Process
from crewai_tools import BaseTool

# OSSA manifest equivalent
OSSA_MANIFEST = {
    "apiVersion": "ossa/v0.3.1",
    "kind": "Agent",
    "metadata": {"name": "security-crew"},
    "spec": {
        "role": "Multi-agent security analysis crew",
        "messaging": {
            "publishes": [{
                "channel": "security.analysis.complete",
                "schema": {"type": "object"}
            }],
            "subscribes": [{
                "channel": "security.vulnerabilities",
                "handler": "analyze_vulnerability"
            }],
            "commands": [{
                "name": "full_security_audit",
                "inputSchema": {"type": "object"}
            }]
        }
    }
}

class OSSACrewAIAgent:
    """OSSA-compliant CrewAI multi-agent system."""

    def __init__(self, manifest: dict, broker_client):
        self.manifest = manifest
        self.broker = broker_client
        self._setup_crew()
        self._setup_messaging()

    def _setup_crew(self):
        self.scanner = Agent(
            role="Vulnerability Scanner",
            goal="Identify security vulnerabilities",
            backstory="Expert in CVE databases"
        )

        self.analyzer = Agent(
            role="Security Analyst",
            goal="Assess vulnerability impact",
            backstory="Risk assessment specialist"
        )

        self.reporter = Agent(
            role="Report Generator",
            goal="Create actionable security reports",
            backstory="Technical writer"
        )

        self.crew = Crew(
            agents=[self.scanner, self.analyzer, self.reporter],
            process=Process.sequential,
            verbose=True
        )

    def _setup_messaging(self):
        messaging = self.manifest["spec"].get("messaging", {})

        # Setup subscribers
        for sub in messaging.get("subscribes", []):
            asyncio.create_task(self._subscribe(sub))

    async def _subscribe(self, subscription: dict):
        async def handler(message):
            result = await self.analyze(message.payload)
            await self.broker.ack(message.id)
            return result

        await self.broker.subscribe(
            subscription["channel"],
            handler
        )

    async def analyze(self, vulnerability: dict) -> dict:
        """Run crew analysis on vulnerability."""
        scan_task = Task(
            description=f"Scan vulnerability: {vulnerability}",
            expected_output="Detailed vulnerability data",
            agent=self.scanner
        )

        analyze_task = Task(
            description="Assess impact and exploitability",
            expected_output="Risk assessment",
            agent=self.analyzer,
            context=[scan_task]
        )

        report_task = Task(
            description="Generate security report",
            expected_output="Actionable report with remediation",
            agent=self.reporter,
            context=[scan_task, analyze_task]
        )

        result = await self.crew.kickoff_async(
            tasks=[scan_task, analyze_task, report_task]
        )

        # Publish result
        await self.broker.publish(
            channel="security.analysis.complete",
            payload=result.raw,
            source=self.manifest["metadata"]["name"]
        )

        return result

# Usage
crew_agent = OSSACrewAIAgent(OSSA_MANIFEST, broker_client)
result = await crew_agent.analyze({"cve_id": "CVE-2024-1234"})
```

## Tracing Integration

CrewAI task execution maps to OSSA spans:

```python
from crewai import Crew
from opentelemetry import trace

class TracedCrew(Crew):
    """Crew with OSSA trace propagation."""

    def __init__(self, *args, ossa_trace_context=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.trace_context = ossa_trace_context

    async def kickoff_async(self, tasks=None):
        tracer = trace.get_tracer(__name__)

        with tracer.start_as_current_span(
            "crewai.crew.execute",
            attributes={
                "ossa.trace_id": self.trace_context.get("traceId"),
                "ossa.source": self.trace_context.get("source"),
                "crew.agent_count": len(self.agents)
            }
        ):
            return await super().kickoff_async(tasks)
```

## References

- [CrewAI Documentation](https://docs.crewai.com/)
- [CrewAI Tools](https://docs.crewai.com/tools/)
- [CrewAI Processes](https://docs.crewai.com/concepts/processes/)
