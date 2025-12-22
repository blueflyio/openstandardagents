# OSSA Python Client

Python reference implementation for the OSSA (Open Standards for Scalable Agents) API.

## Features

- **Simple Pythonic API**: Clean, idiomatic Python interface
- **Agent Operations**: Search, publish, and manage agents
- **Discovery**: Find agents by taxonomy, capabilities, and compliance
- **A2A Messaging**: Agent-to-agent communication with webhooks and event streaming
- **Error Handling**: Robust error handling with automatic retries
- **Session Management**: Connection pooling and resource cleanup

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or install the package
pip install -e .
```

## Quick Start

```python
from ossa_client import OSSA

# Initialize the client
client = OSSA(bearer_token='ossa_tok_xxx')

# Search for agents
results = client.agents.search(
    domain='security',
    limit=10,
)

# Get agent details
agent = client.agents.get('blueflyio', 'security-scanner')

# Send A2A message
client.messaging.send_message({
    'from': {'publisher': 'myorg', 'name': 'my-agent'},
    'to': {'publisher': 'blueflyio', 'name': 'security-scanner'},
    'type': 'request',
    'capability': 'vulnerability-scan',
    'payload': {'target': 'https://example.com'},
})
```

## Examples

Run the included examples:

```bash
# Basic usage - search and get agent details
python examples/basic_usage.py

# Publish an agent (requires OSSA_TOKEN)
export OSSA_TOKEN=ossa_tok_xxx
python examples/publish_agent.py
```

## API Reference

### Client Initialization

```python
from ossa_client import OSSA

client = OSSA(
    base_url='https://registry.openstandardagents.org/api/v1',  # Optional
    bearer_token='ossa_tok_xxx',  # Optional
    api_key='api_key_xxx',        # Alternative to bearer_token
    timeout=30,                    # Request timeout in seconds
    retries=3,                     # Number of retries
)
```

### Agent Operations

```python
# Search agents
results = client.agents.search(
    q='security scanner',          # Full-text search
    domain='security',             # Filter by domain
    capability='vulnerability',    # Filter by capability
    publisher='blueflyio',         # Filter by publisher
    verified=True,                 # Only verified publishers
    min_rating=4.0,               # Minimum rating (1-5)
    sort='downloads',             # Sort order
    limit=20,                      # Results per page
    offset=0,                      # Pagination offset
)

# Get agent details
agent = client.agents.get('blueflyio', 'security-scanner')

# Get specific version
version = client.agents.get_version('blueflyio', 'security-scanner', '2.0.0')

# List versions
versions = client.agents.list_versions('blueflyio', 'security-scanner')

# Publish agent
result = client.agents.publish(
    manifest={...},
    package={
        'tarball_url': 'https://example.com/agent.tgz',
        'shasum': 'a' * 64,
        'size_bytes': 102400,
    },
    license='Apache-2.0',
    keywords=['security', 'scanning'],
)

# Get dependencies
deps = client.agents.get_dependencies('blueflyio', 'security-scanner', version='2.0.0')

# Get statistics
stats = client.agents.get_stats('blueflyio', 'security-scanner', period='month')
```

### Discovery Operations

```python
# List taxonomies
taxonomies = client.discovery.list_taxonomies()

# List capabilities
capabilities = client.discovery.list_capabilities(domain='security')

# Get capability details
capability = client.discovery.get_capability('vulnerability-detection')

# Discover by taxonomy
agents = client.discovery.discover_by_taxonomy(
    domain='security',
    subdomain='vulnerability',
    capability='vulnerability-detection',
)

# Discover by compliance
agents = client.discovery.discover_by_compliance(
    profiles=['fedramp-moderate', 'hipaa']
)

# Get recommendations
recommendations = client.discovery.get_recommendations(
    use_case='Scan web applications for vulnerabilities',
    requirements={
        'compliance': ['fedramp-moderate'],
        'budget': '$100/month',
        'performance': 'high',
    },
    preferences={
        'verified_only': True,
        'min_rating': 4.0,
    },
)

# Advanced discovery
results = client.discovery.discover({
    'domain': 'security',
    'compliance': ['fedramp-moderate'],
    'verified_only': True,
    'min_rating': 4.0,
})
```

### Messaging Operations

```python
# Send A2A message
result = client.messaging.send_message({
    'from': {'publisher': 'myorg', 'name': 'my-agent'},
    'to': {'publisher': 'blueflyio', 'name': 'security-scanner'},
    'type': 'request',
    'capability': 'vulnerability-scan',
    'payload': {'target': 'https://example.com'},
    'metadata': {
        'correlation_id': 'scan-12345',
        'priority': 'high',
        'ttl': 300,
    },
})

# Send synchronous request
response = client.messaging.send_request(
    message={...},
    timeout=30000,  # milliseconds
)

# Get message status
status = client.messaging.get_message_status(message_id)

# Broadcast message
result = client.messaging.broadcast(
    message={...},
    filters={
        'domain': 'security',
        'capability': 'incident-response',
    },
)

# Register webhook
webhook = client.messaging.register_webhook({
    'url': 'https://example.com/webhooks/ossa',
    'events': ['agent.deployed', 'message.received'],
    'filters': {'publisher': 'blueflyio'},
    'headers': {'X-Webhook-Secret': 'secret'},
})

# List webhooks
webhooks = client.messaging.list_webhooks()

# Subscribe to events
subscription = client.messaging.subscribe({
    'agent': {'publisher': 'blueflyio', 'name': 'security-scanner'},
    'events': ['scan.completed', 'scan.failed'],
    'delivery_mode': 'polling',
})

# Poll for events
events = client.messaging.poll_events(
    subscription_id='sub_12345',
    limit=10,
)

# Stream events (generator)
for event in client.messaging.stream_events({
    'agent': {'publisher': 'blueflyio', 'name': 'security-scanner'},
    'event_types': ['scan.completed'],
}):
    print(f"Event: {event['event_type']}")
```

## Error Handling

```python
from ossa_client import OSSAAPIError

try:
    agent = client.agents.get('publisher', 'agent')
except OSSAAPIError as error:
    print(f"API Error: {error}")
    print(f"Status Code: {error.status_code}")
    print(f"Details: {error.api_error}")
```

## Context Manager

Use the client as a context manager for automatic cleanup:

```python
with OSSA(bearer_token='ossa_tok_xxx') as client:
    results = client.agents.search(domain='security')
    # Session automatically closed when exiting context
```

## Configuration

Environment variables:

- `OSSA_TOKEN`: Bearer token for authentication
- `OSSA_BASE_URL`: Override base API URL

## Requirements

- Python >= 3.8
- requests >= 2.31.0
- urllib3 >= 2.0.0

## License

Apache-2.0

## Resources

- [OSSA Documentation](https://docs.openstandardagents.org)
- [API Reference](https://registry.openstandardagents.org/docs)
- [GitHub Repository](https://github.com/openstandardagents/ossa)
