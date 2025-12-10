# KAgent Messaging Adapter

**Version**: 0.3.1
**Framework**: KAgent (Kubernetes-native AI Agents)
**Status**: Draft

## Overview

This document specifies how OSSA v0.3.1 messaging concepts map to KAgent and Kubernetes primitives. KAgent is a Kubernetes-native framework for deploying and orchestrating AI agents using Custom Resource Definitions (CRDs).

## Mapping Table

| OSSA Concept | KAgent/K8s Equivalent |
|--------------|----------------------|
| `publishes` | Kubernetes Events / CloudEvents |
| `subscribes` | Event Watchers / Knative Triggers |
| `commands` | Custom Resource operations |
| `routing` | Service Mesh (Istio) / Knative Eventing |
| `reliability` | K8s Job retry / Message broker acknowledgment |

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

**KAgent Implementation**:

Custom Resource Definition (`ossa-agent-crd.yaml`):
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: ossaagents.ossa.openstandardagents.org
spec:
  group: ossa.openstandardagents.org
  versions:
    - name: v1alpha1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                messaging:
                  type: object
                  properties:
                    publishes:
                      type: array
                      items:
                        type: object
                        properties:
                          channel:
                            type: string
                          schema:
                            type: object
                            x-kubernetes-preserve-unknown-fields: true
            status:
              type: object
              properties:
                publishedMessages:
                  type: integer
                lastPublished:
                  type: string
                  format: date-time
  scope: Namespaced
  names:
    plural: ossaagents
    singular: ossaagent
    kind: OSSAAgent
    shortNames:
      - ossa
```

Agent Controller (`agent_controller.py`):
```python
import kopf
from kubernetes import client, config
from cloudevents.http import CloudEvent
from cloudevents.kafka import to_binary
import json

config.load_incluster_config()

@kopf.on.create('ossa.openstandardagents.org', 'v1alpha1', 'ossaagents')
async def create_agent(spec, name, namespace, logger, **kwargs):
    """Handle OSSA Agent creation."""
    messaging = spec.get('messaging', {})
    publishes = messaging.get('publishes', [])

    for pub in publishes:
        logger.info(f"Agent {name} will publish to channel: {pub['channel']}")

    return {'publishedMessages': 0}

async def publish_message(
    agent_name: str,
    channel: str,
    payload: dict,
    namespace: str = "default"
):
    """Publish message as CloudEvent to Kubernetes."""

    # Create CloudEvent
    event = CloudEvent({
        "type": f"org.openstandardagents.{channel}",
        "source": f"/ossa/agents/{namespace}/{agent_name}",
        "datacontenttype": "application/json",
    })
    event.data = payload

    # Option 1: Publish to Kafka via Knative
    from kafka import KafkaProducer
    producer = KafkaProducer(bootstrap_servers=['kafka:9092'])

    headers, body = to_binary(event)
    producer.send(
        topic=channel.replace('.', '-'),
        value=body,
        headers=[(k, v.encode()) for k, v in headers.items()]
    )

    # Option 2: Create Kubernetes Event
    v1 = client.CoreV1Api()
    event_body = client.CoreV1Event(
        metadata=client.V1ObjectMeta(
            name=f"{agent_name}-{channel}-{int(time.time())}",
            namespace=namespace
        ),
        involved_object=client.V1ObjectReference(
            kind="OSSAAgent",
            name=agent_name,
            namespace=namespace,
            api_version="ossa.openstandardagents.org/v1alpha1"
        ),
        reason="MessagePublished",
        message=json.dumps(payload),
        type="Normal",
        first_timestamp=datetime.utcnow().isoformat() + "Z",
        last_timestamp=datetime.utcnow().isoformat() + "Z"
    )
    v1.create_namespaced_event(namespace, event_body)

    # Update agent status
    custom_api = client.CustomObjectsApi()
    custom_api.patch_namespaced_custom_object_status(
        group="ossa.openstandardagents.org",
        version="v1alpha1",
        namespace=namespace,
        plural="ossaagents",
        name=agent_name,
        body={
            "status": {
                "publishedMessages": {"$inc": 1},
                "lastPublished": datetime.utcnow().isoformat() + "Z"
            }
        }
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

**KAgent Implementation**:

Knative Trigger (`ossa-trigger.yaml`):
```yaml
apiVersion: eventing.knative.dev/v1
kind: Trigger
metadata:
  name: security-scanner-dependency-trigger
  namespace: ossa-agents
spec:
  broker: default
  filter:
    attributes:
      type: org.openstandardagents.dependency.updates
  subscriber:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: security-scanner
---
apiVersion: eventing.knative.dev/v1
kind: Trigger
metadata:
  name: security-scanner-severity-filter
  namespace: ossa-agents
  annotations:
    # CEL filter for severity
    filter.knative.dev/expression: |
      data.severity in ["high", "critical"]
spec:
  broker: default
  filter:
    attributes:
      type: org.openstandardagents.dependency.updates
  subscriber:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: security-scanner
```

Agent Subscription Handler:
```python
import kopf
from cloudevents.http import from_http
from flask import Flask, request

app = Flask(__name__)

@app.route('/ossa/events', methods=['POST'])
def handle_cloudevent():
    """Handle incoming CloudEvents."""
    event = from_http(request.headers, request.get_data())

    channel = event['type'].replace('org.openstandardagents.', '')
    payload = event.data

    # Apply filter
    if channel == "dependency.updates":
        severity = payload.get('severity')
        if severity not in ['high', 'critical']:
            return '', 204  # Filtered out

    # Process message
    result = process_dependency_update(payload)

    return '', 200

def process_dependency_update(payload: dict) -> dict:
    """Handler for dependency.updates messages."""
    package = payload.get('package')
    version = payload.get('to_version')

    # Run security scan
    vulnerabilities = scan_package(package, version)

    return {
        'package': package,
        'vulnerabilities': vulnerabilities
    }
```

Kopf Event Watcher:
```python
import kopf

@kopf.on.event('', 'v1', 'events')
async def watch_ossa_events(event, logger, **kwargs):
    """Watch for OSSA-related Kubernetes events."""
    obj = event.get('object', {})

    # Filter for OSSA events
    if not obj.get('reason', '').startswith('OSSA'):
        return

    involved = obj.get('involvedObject', {})
    if involved.get('kind') != 'OSSAAgent':
        return

    message = obj.get('message', '')
    try:
        payload = json.loads(message)
        await process_ossa_event(involved['name'], payload)
    except json.JSONDecodeError:
        logger.warning(f"Invalid OSSA event message: {message}")
```

### Commands as Custom Resources

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
        timeoutSeconds: 60
```

**KAgent Implementation**:

Command CRD (`ossa-command-crd.yaml`):
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: ossacommands.ossa.openstandardagents.org
spec:
  group: ossa.openstandardagents.org
  versions:
    - name: v1alpha1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required:
                - targetAgent
                - command
                - input
              properties:
                targetAgent:
                  type: string
                command:
                  type: string
                input:
                  type: object
                  x-kubernetes-preserve-unknown-fields: true
                timeoutSeconds:
                  type: integer
                  default: 60
            status:
              type: object
              properties:
                phase:
                  type: string
                  enum: [Pending, Running, Succeeded, Failed]
                output:
                  type: object
                  x-kubernetes-preserve-unknown-fields: true
                startTime:
                  type: string
                  format: date-time
                completionTime:
                  type: string
                  format: date-time
                error:
                  type: string
      additionalPrinterColumns:
        - name: Target
          type: string
          jsonPath: .spec.targetAgent
        - name: Command
          type: string
          jsonPath: .spec.command
        - name: Status
          type: string
          jsonPath: .status.phase
        - name: Age
          type: date
          jsonPath: .metadata.creationTimestamp
  scope: Namespaced
  names:
    plural: ossacommands
    singular: ossacommand
    kind: OSSACommand
    shortNames:
      - ossacmd
```

Command Controller:
```python
import kopf
import asyncio
from kubernetes import client

@kopf.on.create('ossa.openstandardagents.org', 'v1alpha1', 'ossacommands')
async def execute_command(spec, name, namespace, patch, logger, **kwargs):
    """Execute OSSA command on target agent."""

    target_agent = spec['targetAgent']
    command = spec['command']
    input_data = spec['input']
    timeout = spec.get('timeoutSeconds', 60)

    # Update status to Running
    patch.status['phase'] = 'Running'
    patch.status['startTime'] = datetime.utcnow().isoformat() + 'Z'

    try:
        # Find target agent
        custom_api = client.CustomObjectsApi()
        agent = custom_api.get_namespaced_custom_object(
            group="ossa.openstandardagents.org",
            version="v1alpha1",
            namespace=namespace,
            plural="ossaagents",
            name=target_agent
        )

        # Validate command exists on agent
        commands = agent['spec'].get('messaging', {}).get('commands', [])
        cmd_spec = next((c for c in commands if c['name'] == command), None)

        if not cmd_spec:
            raise ValueError(f"Command {command} not found on agent {target_agent}")

        # Execute command with timeout
        result = await asyncio.wait_for(
            execute_agent_command(target_agent, command, input_data, namespace),
            timeout=timeout
        )

        patch.status['phase'] = 'Succeeded'
        patch.status['output'] = result
        patch.status['completionTime'] = datetime.utcnow().isoformat() + 'Z'

    except asyncio.TimeoutError:
        patch.status['phase'] = 'Failed'
        patch.status['error'] = f'Command timed out after {timeout}s'
    except Exception as e:
        patch.status['phase'] = 'Failed'
        patch.status['error'] = str(e)

async def execute_agent_command(
    agent: str,
    command: str,
    input_data: dict,
    namespace: str
) -> dict:
    """Execute command on agent pod."""

    # Find agent pod
    v1 = client.CoreV1Api()
    pods = v1.list_namespaced_pod(
        namespace=namespace,
        label_selector=f"ossa.openstandardagents.org/agent={agent}"
    )

    if not pods.items:
        raise ValueError(f"No running pods for agent {agent}")

    pod = pods.items[0]

    # Execute command via exec
    exec_command = ['ossa-cli', 'execute', command, '--input', json.dumps(input_data)]

    resp = stream.stream(
        v1.connect_get_namespaced_pod_exec,
        pod.metadata.name,
        namespace,
        command=exec_command,
        stderr=True,
        stdin=False,
        stdout=True,
        tty=False
    )

    return json.loads(resp)
```

Usage:
```yaml
apiVersion: ossa.openstandardagents.org/v1alpha1
kind: OSSACommand
metadata:
  name: scan-lodash
  namespace: ossa-agents
spec:
  targetAgent: security-scanner
  command: scan_package
  input:
    package_name: lodash
    version: 4.17.20
  timeoutSeconds: 120
```

### Routing via Service Mesh

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

**KAgent Implementation**:

Knative Eventing Broker (`ossa-broker.yaml`):
```yaml
apiVersion: eventing.knative.dev/v1
kind: Broker
metadata:
  name: ossa-broker
  namespace: ossa-agents
  annotations:
    eventing.knative.dev/broker.class: MTChannelBasedBroker
spec:
  config:
    apiVersion: v1
    kind: ConfigMap
    name: ossa-broker-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ossa-broker-config
  namespace: ossa-agents
data:
  channelTemplateSpec: |
    apiVersion: messaging.knative.dev/v1
    kind: InMemoryChannel
```

Routing Triggers:
```yaml
# Route security.vulnerabilities from dependency-healer to multiple targets
apiVersion: eventing.knative.dev/v1
kind: Trigger
metadata:
  name: route-vuln-to-scanner
  namespace: ossa-agents
spec:
  broker: ossa-broker
  filter:
    attributes:
      type: org.openstandardagents.security.vulnerabilities
      source: /ossa/agents/ossa-agents/dependency-healer
    extensions:
      severity:
        - high
        - critical
  subscriber:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: security-scanner
---
apiVersion: eventing.knative.dev/v1
kind: Trigger
metadata:
  name: route-vuln-to-monitor
  namespace: ossa-agents
spec:
  broker: ossa-broker
  filter:
    attributes:
      type: org.openstandardagents.security.vulnerabilities
      source: /ossa/agents/ossa-agents/dependency-healer
    extensions:
      severity:
        - high
        - critical
  subscriber:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: monitoring-agent
```

Istio VirtualService for HTTP routing:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ossa-message-routing
  namespace: ossa-agents
spec:
  hosts:
    - ossa-router
  http:
    - match:
        - headers:
            ce-type:
              exact: org.openstandardagents.security.vulnerabilities
            ce-source:
              prefix: /ossa/agents/ossa-agents/dependency-healer
      route:
        - destination:
            host: security-scanner
            port:
              number: 80
          weight: 50
        - destination:
            host: monitoring-agent
            port:
              number: 80
          weight: 50
```

### Reliability with Kubernetes Jobs

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

**KAgent Implementation**:

Job Template with Retry:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ossa-message-processor
  namespace: ossa-agents
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 300
  template:
    spec:
      containers:
        - name: processor
          image: ossa/message-processor:v0.3.1
          env:
            - name: OSSA_RETRY_MAX_ATTEMPTS
              value: "3"
            - name: OSSA_RETRY_INITIAL_DELAY_MS
              value: "1000"
            - name: OSSA_RETRY_BACKOFF_STRATEGY
              value: "exponential"
          resources:
            limits:
              memory: "256Mi"
              cpu: "500m"
      restartPolicy: OnFailure
```

Reliable Message Handler:
```python
import backoff
from cloudevents.http import CloudEvent

class ReliableMessageHandler:
    """Handle messages with OSSA reliability guarantees."""

    def __init__(self, config: dict):
        self.max_attempts = config.get('maxAttempts', 3)
        self.initial_delay = config.get('initialDelayMs', 1000) / 1000
        self.strategy = config.get('backoffStrategy', 'exponential')

    @backoff.on_exception(
        backoff.expo,
        Exception,
        max_tries=3,
        base=2,
        factor=1
    )
    async def process_with_retry(self, event: CloudEvent) -> dict:
        """Process CloudEvent with retry logic."""
        return await self._process(event)

    async def _process(self, event: CloudEvent) -> dict:
        # Actual processing logic
        channel = event['type'].replace('org.openstandardagents.', '')
        payload = event.data

        # Process and return result
        result = await self.handler(channel, payload)

        # Acknowledge message
        await self._acknowledge(event['id'])

        return result

    async def _acknowledge(self, message_id: str):
        """Acknowledge message to broker."""
        # Implementation depends on broker (Kafka, NATS, etc.)
        pass
```

## Complete Example

OSSA Agent Manifest (`security-scanner.yaml`):
```yaml
apiVersion: ossa.openstandardagents.org/v1alpha1
kind: OSSAAgent
metadata:
  name: security-scanner
  namespace: ossa-agents
  labels:
    app: security-scanner
    ossa.openstandardagents.org/version: v0.3.1
spec:
  role: |
    You are a security scanner that analyzes dependencies for vulnerabilities.
  llm:
    provider: openai
    model: gpt-4
  messaging:
    publishes:
      - channel: security.vulnerabilities
        schema:
          type: object
          properties:
            vulnerability_id: { type: string }
            severity: { enum: [low, medium, high, critical] }
            cve_id: { type: string }
            affected_package: { type: string }
            remediation: { type: string }
    subscribes:
      - channel: dependency.updates
        handler: process_dependency_update
        filter:
          fields:
            severity: [high, critical]
        maxConcurrency: 5
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
            scan_status: { enum: [success, failed] }
        timeoutSeconds: 60
    reliability:
      deliveryGuarantee: at-least-once
      retry:
        maxAttempts: 3
        backoff:
          strategy: exponential
          initialDelayMs: 1000
          maxDelayMs: 30000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: security-scanner
  namespace: ossa-agents
spec:
  replicas: 2
  selector:
    matchLabels:
      app: security-scanner
  template:
    metadata:
      labels:
        app: security-scanner
        ossa.openstandardagents.org/agent: security-scanner
    spec:
      containers:
        - name: agent
          image: ossa/security-scanner:v0.3.1
          ports:
            - containerPort: 8080
          env:
            - name: OSSA_AGENT_NAME
              value: security-scanner
            - name: OSSA_BROKER_URL
              value: http://ossa-broker.ossa-agents.svc.cluster.local
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: openai-credentials
                  key: api-key
          resources:
            limits:
              memory: "512Mi"
              cpu: "1"
---
apiVersion: v1
kind: Service
metadata:
  name: security-scanner
  namespace: ossa-agents
spec:
  selector:
    app: security-scanner
  ports:
    - port: 80
      targetPort: 8080
```

## Tracing Integration

OpenTelemetry with Kubernetes:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: ossa-agents
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
          http:
    processors:
      batch:
      k8sattributes:
        extract:
          metadata:
            - k8s.pod.name
            - k8s.namespace.name
            - k8s.deployment.name
        pod_association:
          - sources:
              - from: resource_attribute
                name: k8s.pod.ip
    exporters:
      jaeger:
        endpoint: jaeger-collector:14250
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch, k8sattributes]
          exporters: [jaeger]
```

Agent tracing code:
```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Initialize tracing
tracer_provider = TracerProvider()
tracer_provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter())
)
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(__name__)

async def process_message_with_tracing(event: CloudEvent):
    # Extract trace context from CloudEvent
    trace_id = event.get('traceparent', '').split('-')[1] if 'traceparent' in event else None

    with tracer.start_as_current_span(
        "ossa.message.process",
        attributes={
            "ossa.channel": event['type'],
            "ossa.source": event['source'],
            "ossa.message_id": event['id'],
            "k8s.pod.name": os.environ.get('HOSTNAME'),
            "k8s.namespace": os.environ.get('POD_NAMESPACE')
        }
    ) as span:
        result = await process_message(event)
        span.set_attribute("ossa.result.status", "success")
        return result
```

## References

- [KAgent Documentation](https://kagent.dev/docs/)
- [Kubernetes Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
- [Knative Eventing](https://knative.dev/docs/eventing/)
- [CloudEvents](https://cloudevents.io/)
- [Istio Service Mesh](https://istio.io/)
