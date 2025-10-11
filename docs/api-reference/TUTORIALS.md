# OSSA API Tutorials

## Table of Contents

1. [Building a Multi-Agent Workflow](#tutorial-1-multi-agent-workflow)
2. [Implementing Agent Governance](#tutorial-2-agent-governance)
3. [Real-time Agent Monitoring](#tutorial-3-real-time-monitoring)
4. [API Specification Generation](#tutorial-4-api-specification-generation)
5. [Distributed Task Processing](#tutorial-5-distributed-processing)

---

## Tutorial 1: Building a Multi-Agent Workflow

### Objective
Create a complete API design workflow using multiple specialized agents.

### Architecture

```
Orchestrator Agent
├── Worker Agent (API Design)
├── Critic Agent (Validation)
└── Monitor Agent (Metrics)
```

### Step 1: Create the Worker Agent

```python
import requests

API_URL = "https://api.ossa.bluefly.io/v1"
API_KEY = "your-api-key-here"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

# Create API design worker
design_agent = requests.post(
    f"{API_URL}/agents",
    headers=headers,
    json={
        "name": "api-design-worker",
        "type": "worker",
        "domains": ["api-design", "openapi", "rest"],
        "capabilities": {
            "max_concurrent_tasks": 3,
            "supports_streaming": True,
            "timeout_seconds": 300
        },
        "configuration": {
            "openapi_version": "3.1.0",
            "default_format": "json",
            "include_examples": True
        },
        "metadata": {
            "version": "1.0.0",
            "owner": "api-team"
        }
    }
).json()

print(f"Created design agent: {design_agent['id']}")
```

### Step 2: Create the Critic Agent

```python
# Create validation critic
critic_agent = requests.post(
    f"{API_URL}/agents",
    headers=headers,
    json={
        "name": "api-validation-critic",
        "type": "critic",
        "domains": ["api-validation", "security", "performance"],
        "validation_rules": {
            "check_authentication": True,
            "check_rate_limiting": True,
            "check_error_handling": True,
            "check_versioning": True
        },
        "severity_threshold": "warning"
    }
).json()

print(f"Created critic agent: {critic_agent['id']}")
```

### Step 3: Create the Monitor Agent

```python
# Create monitoring agent
monitor_agent = requests.post(
    f"{API_URL}/agents",
    headers=headers,
    json={
        "name": "workflow-monitor",
        "type": "monitor",
        "domains": ["observability", "metrics"],
        "metrics": {
            "track_execution_time": True,
            "track_errors": True,
            "track_quality_score": True
        }
    }
).json()

print(f"Created monitor agent: {monitor_agent['id']}")
```

### Step 4: Create the Orchestrator

```python
# Create orchestrator to coordinate workflow
orchestrator = requests.post(
    f"{API_URL}/agents",
    headers=headers,
    json={
        "name": "api-design-orchestrator",
        "type": "orchestrator",
        "child_agents": [
            design_agent['id'],
            critic_agent['id'],
            monitor_agent['id']
        ],
        "workflow": {
            "type": "sequential",
            "steps": [
                {
                    "agent_id": design_agent['id'],
                    "action": "design_api",
                    "output_to": "design_result"
                },
                {
                    "agent_id": critic_agent['id'],
                    "action": "validate_design",
                    "input_from": "design_result",
                    "output_to": "validation_result"
                },
                {
                    "agent_id": monitor_agent['id'],
                    "action": "collect_metrics",
                    "input_from": ["design_result", "validation_result"]
                }
            ]
        },
        "error_handling": {
            "on_failure": "rollback",
            "retry_attempts": 3,
            "retry_delay_seconds": 5
        }
    }
).json()

print(f"Created orchestrator: {orchestrator['id']}")
```

### Step 5: Execute the Workflow

```python
# Execute the complete workflow
result = requests.post(
    f"{API_URL}/agents/{orchestrator['id']}/execute",
    headers=headers,
    json={
        "task": {
            "type": "api_design_workflow",
            "input": {
                "service_name": "Payment Processing API",
                "requirements": {
                    "authentication": "OAuth 2.0",
                    "rate_limiting": "100 req/min",
                    "endpoints": [
                        {
                            "path": "/payments",
                            "method": "POST",
                            "description": "Create a new payment"
                        },
                        {
                            "path": "/payments/{id}",
                            "method": "GET",
                            "description": "Retrieve payment details"
                        }
                    ]
                }
            }
        },
        "callback_url": "https://your-app.com/webhook/workflow-complete"
    }
).json()

print(f"Workflow execution ID: {result['execution_id']}")
```

### Step 6: Monitor Progress

```python
# Poll for execution status
import time

execution_id = result['execution_id']

while True:
    status = requests.get(
        f"{API_URL}/executions/{execution_id}",
        headers=headers
    ).json()

    print(f"Status: {status['state']} - {status['progress']}%")

    if status['state'] in ['completed', 'failed']:
        print(f"Final result: {status['result']}")
        break

    time.sleep(2)
```

---

## Tutorial 2: Implementing Agent Governance

### Objective
Set up governance and compliance for your agent ecosystem.

### Step 1: Create a Governor Agent

```javascript
const axios = require('axios');

const API_URL = 'https://api.ossa.bluefly.io/v1';
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': 'your-api-key-here'
};

// Create security governor
const securityGovernor = await axios.post(
  `${API_URL}/agents`,
  {
    name: 'security-governor',
    type: 'governor',
    domains: ['security', 'compliance', 'audit'],
    policies: {
      enforce_authentication: true,
      enforce_encryption: true,
      enforce_audit_logging: true,
      allowed_domains: ['api-design', 'testing', 'monitoring'],
      blocked_actions: ['delete_production_data', 'modify_security_settings']
    },
    compliance_frameworks: ['SOC2', 'GDPR', 'HIPAA'],
    audit_retention_days: 90
  },
  { headers }
);

console.log('Created governor:', securityGovernor.data.id);
```

### Step 2: Attach Governor to Agents

```javascript
// Update existing agents to include governance
const updateAgentWithGovernor = async (agentId, governorId) => {
  const response = await axios.patch(
    `${API_URL}/agents/${agentId}`,
    {
      governance: {
        governor_id: governorId,
        enforcement_level: 'strict',
        allow_override: false
      }
    },
    { headers }
  );
  return response.data;
};

// Apply to all worker agents
const workers = await axios.get(`${API_URL}/agents?type=worker`, { headers });
for (const worker of workers.data.agents) {
  await updateAgentWithGovernor(worker.id, securityGovernor.data.id);
  console.log(`Applied governance to ${worker.name}`);
}
```

### Step 3: Create Compliance Reports

```javascript
// Generate compliance report
const complianceReport = await axios.post(
  `${API_URL}/agents/${securityGovernor.data.id}/execute`,
  {
    task: {
      type: 'generate_compliance_report',
      input: {
        framework: 'SOC2',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        include_violations: true,
        include_remediation: true
      }
    }
  },
  { headers }
);

console.log('Compliance report:', complianceReport.data);
```

---

## Tutorial 3: Real-time Agent Monitoring

### Objective
Set up comprehensive monitoring and alerting for your agent ecosystem.

### Step 1: Create Monitoring Dashboard

```python
# Create monitor agent with custom metrics
monitor = requests.post(
    f"{API_URL}/agents",
    headers=headers,
    json={
        "name": "system-monitor",
        "type": "monitor",
        "domains": ["observability", "metrics", "alerting"],
        "metrics": {
            "agent_health": {
                "check_interval_seconds": 30,
                "thresholds": {
                    "cpu_percent": 80,
                    "memory_percent": 85,
                    "error_rate": 5
                }
            },
            "performance": {
                "track_response_time": True,
                "track_throughput": True,
                "track_success_rate": True
            },
            "custom_metrics": [
                {
                    "name": "api_design_quality",
                    "aggregation": "average",
                    "unit": "score"
                }
            ]
        },
        "alerting": {
            "channels": [
                {
                    "type": "webhook",
                    "url": "https://your-app.com/alerts",
                    "events": ["agent.unhealthy", "execution.failed"]
                },
                {
                    "type": "email",
                    "recipients": ["ops@example.com"],
                    "severity": ["critical", "high"]
                }
            ]
        }
    }
).json()
```

### Step 2: Subscribe to Metrics Stream

```python
import sseclient  # pip install sseclient-py

# Connect to metrics stream
response = requests.get(
    f"{API_URL}/agents/{monitor['id']}/metrics/stream",
    headers={
        "Accept": "text/event-stream",
        "X-API-Key": API_KEY
    },
    stream=True
)

client = sseclient.SSEClient(response)

for event in client.events():
    metric = json.loads(event.data)
    print(f"[{metric['timestamp']}] {metric['name']}: {metric['value']}")

    # Check thresholds
    if metric.get('alert'):
        print(f"⚠  ALERT: {metric['alert']['message']}")
```

### Step 3: Query Historical Metrics

```python
# Query metrics history
metrics = requests.get(
    f"{API_URL}/agents/{monitor['id']}/metrics",
    headers=headers,
    params={
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-01-31T23:59:59Z",
        "metric_names": ["agent_health", "performance.response_time"],
        "aggregation": "5m",  # 5-minute intervals
        "format": "json"
    }
).json()

# Analyze trends
import pandas as pd

df = pd.DataFrame(metrics['data'])
print(df.describe())
```

---

## Tutorial 4: API Specification Generation

### Objective
Automatically generate OpenAPI specifications from requirements.

### Implementation

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

const (
    APIURL = "https://api.ossa.bluefly.io/v1"
    APIKey = "your-api-key-here"
)

type SpecGenerationRequest struct {
    ServiceName string                 `json:"service_name"`
    Description string                 `json:"description"`
    Requirements map[string]interface{} `json:"requirements"`
    Format      string                 `json:"format"`
}

func generateAPISpec(agentID string, req SpecGenerationRequest) (map[string]interface{}, error) {
    payload := map[string]interface{}{
        "task": map[string]interface{}{
            "type":  "generate_openapi_spec",
            "input": req,
        },
    }

    body, _ := json.Marshal(payload)

    httpReq, _ := http.NewRequest(
        "POST",
        fmt.Sprintf("%s/agents/%s/execute", APIURL, agentID),
        bytes.NewBuffer(body),
    )

    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("X-API-Key", APIKey)

    client := &http.Client{}
    resp, err := client.Do(httpReq)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    return result, nil
}

func main() {
    // Create spec generator agent
    // (agent creation code here)

    // Generate specification
    spec, err := generateAPISpec("agent-id-here", SpecGenerationRequest{
        ServiceName: "E-commerce API",
        Description: "RESTful API for e-commerce platform",
        Requirements: map[string]interface{}{
            "resources": []string{"products", "orders", "customers"},
            "authentication": "JWT",
            "versioning": "URL-based",
        },
        Format: "openapi-3.1",
    })

    if err != nil {
        panic(err)
    }

    fmt.Printf("Generated spec: %+v\n", spec)
}
```

---

## Tutorial 5: Distributed Task Processing

### Objective
Build a scalable task processing system with load balancing.

### Architecture

```
Orchestrator (Round-Robin)
├── Worker Pool 1 (Region: US-East)
├── Worker Pool 2 (Region: US-West)
└── Worker Pool 3 (Region: EU)
```

### Implementation

```php
<?php

class OSSAClient {
    private $apiUrl = 'https://api.ossa.bluefly.io/v1';
    private $apiKey;

    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }

    private function request($method, $path, $data = null) {
        $ch = curl_init($this->apiUrl . $path);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-API-Key: ' . $this->apiKey
        ]);

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    public function createWorkerPool($region, $count = 3) {
        $workers = [];

        for ($i = 0; $i < $count; $i++) {
            $worker = $this->request('POST', '/agents', [
                'name' => "worker-{$region}-{$i}",
                'type' => 'worker',
                'domains' => ['data-processing', 'transformation'],
                'region' => $region,
                'capabilities' => [
                    'max_concurrent_tasks' => 10,
                    'timeout_seconds' => 600
                ]
            ]);

            $workers[] = $worker['id'];
        }

        return $workers;
    }

    public function createLoadBalancer(array $workerPools) {
        $allWorkers = array_merge(...array_values($workerPools));

        return $this->request('POST', '/agents', [
            'name' => 'global-orchestrator',
            'type' => 'orchestrator',
            'child_agents' => $allWorkers,
            'load_balancing' => [
                'strategy' => 'round-robin',
                'health_check' => true,
                'failover' => true,
                'regions' => array_keys($workerPools)
            ]
        ]);
    }

    public function processBulkTasks($orchestratorId, array $tasks) {
        return $this->request('POST', "/agents/{$orchestratorId}/bulk-execute", [
            'tasks' => $tasks,
            'options' => [
                'parallel' => true,
                'max_concurrency' => 50,
                'timeout_seconds' => 3600
            ]
        ]);
    }
}

// Usage
$client = new OSSAClient('your-api-key-here');

// Create worker pools in different regions
$pools = [
    'us-east' => $client->createWorkerPool('us-east', 5),
    'us-west' => $client->createWorkerPool('us-west', 5),
    'eu-central' => $client->createWorkerPool('eu-central', 3)
];

// Create load balancer
$orchestrator = $client->createLoadBalancer($pools);

// Process 10,000 tasks
$tasks = [];
for ($i = 0; $i < 10000; $i++) {
    $tasks[] = [
        'type' => 'transform_data',
        'input' => ['record_id' => $i]
    ];
}

$result = $client->processBulkTasks($orchestrator['id'], $tasks);

echo "Processed {$result['completed']} tasks\n";
echo "Failed: {$result['failed']}\n";
echo "Total time: {$result['duration_seconds']}s\n";
```

---

## Next Steps

- Explore [Advanced Patterns](/docs/patterns/) for more complex workflows
- Review [Best Practices](/docs/best-practices/) for production deployments
- Join the [Community](https://gitlab.bluefly.io/llm/ossa) for support

## Additional Resources

- [API Reference](/api-docs.html)
- [SDK Documentation](/docs/sdks/)
- [Examples Repository](https://gitlab.bluefly.io/llm/ossa-examples)
