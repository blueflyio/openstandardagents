# GitLab Agent Messaging Adapter

**Version**: 0.3.1
**Framework**: GitLab Agents (GitLab Duo, CI/CD Agents)
**Status**: Draft

## Overview

This document specifies how OSSA v0.3.1 messaging concepts map to GitLab primitives. GitLab Agents leverage CI/CD pipelines, webhooks, and the GitLab API for automation and orchestration.

## Mapping Table

| OSSA Concept | GitLab Equivalent |
|--------------|-------------------|
| `publishes` | Webhook events / Pipeline artifacts |
| `subscribes` | Webhook handlers / Pipeline triggers |
| `commands` | GitLab API calls / CI job triggers |
| `routing` | Pipeline rules / Multi-project triggers |
| `reliability` | Job retry / Pipeline retry |

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

**GitLab Implementation**:

`.gitlab-ci.yml`:
```yaml
stages:
  - scan
  - publish

variables:
  OSSA_BROKER_URL: ${OSSA_BROKER_URL}
  OSSA_CHANNEL: "security.vulnerabilities"

security_scan:
  stage: scan
  image: node:20
  script:
    - npm audit --json > audit-results.json
    - |
      # Transform audit results to OSSA schema
      node -e "
        const audit = require('./audit-results.json');
        const vulnerabilities = Object.entries(audit.vulnerabilities || {})
          .map(([name, v]) => ({
            vulnerability_id: v.via[0]?.source || name,
            severity: v.severity,
            cve_id: v.via[0]?.url?.match(/CVE-\d+-\d+/)?.[0] || null,
            affected_package: name,
            remediation: v.fixAvailable ? 'Update available' : 'Manual review required'
          }));
        console.log(JSON.stringify(vulnerabilities, null, 2));
      " > ossa-findings.json
  artifacts:
    paths:
      - ossa-findings.json
    expire_in: 1 day

publish_to_ossa:
  stage: publish
  image: curlimages/curl:latest
  needs:
    - security_scan
  script:
    - |
      # Read findings and publish each to OSSA channel
      for finding in $(cat ossa-findings.json | jq -c '.[]'); do
        curl -X POST "${OSSA_BROKER_URL}/publish" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${OSSA_TOKEN}" \
          -d "{
            \"channel\": \"${OSSA_CHANNEL}\",
            \"payload\": ${finding},
            \"source\": \"${CI_PROJECT_PATH}\",
            \"metadata\": {
              \"traceId\": \"${CI_PIPELINE_ID}\",
              \"correlationId\": \"${CI_JOB_ID}\"
            }
          }"
      done
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

**Webhook Publisher Component** (`.gitlab/ci/components/ossa-publish.yml`):
```yaml
spec:
  inputs:
    channel:
      description: "OSSA channel to publish to"
      type: string
    payload_file:
      description: "JSON file containing payload"
      type: string
      default: "ossa-payload.json"
    broker_url:
      description: "OSSA broker URL"
      type: string
      default: "${OSSA_BROKER_URL}"

---
ossa-publish:
  image: curlimages/curl:latest
  script:
    - |
      PAYLOAD=$(cat $[[ inputs.payload_file ]])
      curl -X POST "$[[ inputs.broker_url ]]/publish" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${OSSA_TOKEN}" \
        -d "{
          \"channel\": \"$[[ inputs.channel ]]\",
          \"payload\": ${PAYLOAD},
          \"source\": \"${CI_PROJECT_PATH}\",
          \"metadata\": {
            \"traceId\": \"${CI_PIPELINE_ID}\",
            \"spanId\": \"${CI_JOB_ID}\",
            \"correlationId\": \"${CI_COMMIT_SHA}\"
          }
        }"
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

**GitLab Implementation**:

Webhook Handler (Pipeline Trigger):
```yaml
# .gitlab-ci.yml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "trigger"
    - if: $CI_PIPELINE_SOURCE == "api"
    - if: $CI_COMMIT_BRANCH

variables:
  OSSA_CHANNEL: ""
  OSSA_PAYLOAD: ""

ossa_message_handler:
  stage: process
  rules:
    - if: $OSSA_CHANNEL == "dependency.updates"
    - if: $CI_PIPELINE_SOURCE == "trigger" && $OSSA_CHANNEL
  script:
    - |
      # Parse OSSA message
      echo "Processing message from channel: ${OSSA_CHANNEL}"
      PAYLOAD=$(echo "${OSSA_PAYLOAD}" | base64 -d)
      SEVERITY=$(echo "${PAYLOAD}" | jq -r '.severity')

      # Filter check
      if [[ ! "${SEVERITY}" =~ ^(high|critical)$ ]]; then
        echo "Skipping low/medium severity: ${SEVERITY}"
        exit 0
      fi

      # Process the dependency update
      PACKAGE=$(echo "${PAYLOAD}" | jq -r '.package')
      VERSION=$(echo "${PAYLOAD}" | jq -r '.to_version')

      echo "Updating ${PACKAGE} to ${VERSION}"
      # ... update logic
```

**Webhook Receiver Service** (`ossa-webhook-handler.py`):
```python
from flask import Flask, request, jsonify
import gitlab
import base64
import json

app = Flask(__name__)
gl = gitlab.Gitlab(url=os.environ['GITLAB_URL'], private_token=os.environ['GITLAB_TOKEN'])

# OSSA subscription configuration
SUBSCRIPTIONS = {
    "dependency.updates": {
        "project_id": 123,
        "ref": "main",
        "filter": {"severity": ["high", "critical"]}
    },
    "security.vulnerabilities": {
        "project_id": 456,
        "ref": "main"
    }
}

@app.route('/ossa/webhook', methods=['POST'])
def handle_ossa_message():
    message = request.json
    channel = message.get('channel')

    if channel not in SUBSCRIPTIONS:
        return jsonify({"status": "ignored", "reason": "no subscription"}), 200

    config = SUBSCRIPTIONS[channel]

    # Apply filter
    if 'filter' in config:
        for field, allowed_values in config['filter'].items():
            if message['payload'].get(field) not in allowed_values:
                return jsonify({"status": "filtered"}), 200

    # Trigger GitLab pipeline
    project = gl.projects.get(config['project_id'])
    pipeline = project.pipelines.create({
        'ref': config['ref'],
        'variables': [
            {'key': 'OSSA_CHANNEL', 'value': channel},
            {'key': 'OSSA_PAYLOAD', 'value': base64.b64encode(json.dumps(message['payload']).encode()).decode()},
            {'key': 'OSSA_TRACE_ID', 'value': message.get('metadata', {}).get('traceId', '')},
            {'key': 'OSSA_MESSAGE_ID', 'value': message.get('id', '')}
        ]
    })

    return jsonify({
        "status": "triggered",
        "pipeline_id": pipeline.id,
        "web_url": pipeline.web_url
    }), 201
```

### Commands as API Calls

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

**GitLab Implementation**:

Command Handler Job:
```yaml
# .gitlab-ci.yml
scan_package:
  stage: scan
  rules:
    - if: $OSSA_COMMAND == "scan_package"
  variables:
    PACKAGE_NAME: ""
    PACKAGE_VERSION: ""
  script:
    - |
      echo "Scanning package: ${PACKAGE_NAME}@${PACKAGE_VERSION}"

      # Run security scan
      npm audit --package ${PACKAGE_NAME} --json > scan-result.json

      # Return result to OSSA
      curl -X POST "${OSSA_BROKER_URL}/command/response" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${OSSA_TOKEN}" \
        -d "{
          \"command_id\": \"${OSSA_COMMAND_ID}\",
          \"status\": \"success\",
          \"output\": $(cat scan-result.json)
        }"
  timeout: 60 minutes
```

**Command Invoker** (Python client):
```python
import gitlab
import time
import json

class GitLabOSSACommand:
    """Invoke OSSA commands via GitLab pipelines."""

    def __init__(self, gitlab_url: str, token: str, project_id: int):
        self.gl = gitlab.Gitlab(url=gitlab_url, private_token=token)
        self.project = self.gl.projects.get(project_id)

    async def execute(
        self,
        command: str,
        input_data: dict,
        timeout_seconds: int = 60
    ) -> dict:
        """Execute OSSA command and wait for result."""
        import uuid
        command_id = str(uuid.uuid4())

        # Trigger pipeline with command
        pipeline = self.project.pipelines.create({
            'ref': 'main',
            'variables': [
                {'key': 'OSSA_COMMAND', 'value': command},
                {'key': 'OSSA_COMMAND_ID', 'value': command_id},
                {'key': 'PACKAGE_NAME', 'value': input_data.get('package_name', '')},
                {'key': 'PACKAGE_VERSION', 'value': input_data.get('version', '')}
            ]
        })

        # Poll for completion
        start_time = time.time()
        while time.time() - start_time < timeout_seconds:
            pipeline.refresh()

            if pipeline.status == 'success':
                # Get result from artifact or API
                return await self._get_command_result(command_id)
            elif pipeline.status in ['failed', 'canceled']:
                raise Exception(f"Command failed: {pipeline.status}")

            time.sleep(5)

        raise TimeoutError(f"Command timed out after {timeout_seconds}s")

    async def _get_command_result(self, command_id: str) -> dict:
        # Fetch result from OSSA broker or pipeline artifact
        pass
```

### Routing via Multi-Project Pipelines

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

**GitLab Implementation**:

Router Pipeline (`.gitlab-ci.yml`):
```yaml
stages:
  - receive
  - route
  - fan-out

variables:
  SECURITY_SCANNER_PROJECT: "group/security-scanner"
  MONITORING_AGENT_PROJECT: "group/monitoring-agent"

receive_message:
  stage: receive
  script:
    - |
      # Validate message
      echo "${OSSA_PAYLOAD}" | base64 -d | jq .

route_message:
  stage: route
  script:
    - |
      PAYLOAD=$(echo "${OSSA_PAYLOAD}" | base64 -d)
      SEVERITY=$(echo "${PAYLOAD}" | jq -r '.severity')
      SOURCE=$(echo "${PAYLOAD}" | jq -r '.source // "unknown"')
      CHANNEL="${OSSA_CHANNEL}"

      # Apply routing rules
      if [[ "${SOURCE}" == "dependency-healer" ]] && \
         [[ "${CHANNEL}" == "security.vulnerabilities" ]] && \
         [[ "${SEVERITY}" =~ ^(high|critical)$ ]]; then
        echo "ROUTE_TO_SCANNER=true" >> route.env
        echo "ROUTE_TO_MONITOR=true" >> route.env
        echo "PRIORITY=high" >> route.env
      else
        echo "ROUTE_TO_SCANNER=false" >> route.env
        echo "ROUTE_TO_MONITOR=false" >> route.env
      fi
  artifacts:
    reports:
      dotenv: route.env

trigger_security_scanner:
  stage: fan-out
  needs:
    - route_message
  rules:
    - if: $ROUTE_TO_SCANNER == "true"
  trigger:
    project: ${SECURITY_SCANNER_PROJECT}
    strategy: depend
  variables:
    OSSA_CHANNEL: ${OSSA_CHANNEL}
    OSSA_PAYLOAD: ${OSSA_PAYLOAD}
    OSSA_PRIORITY: ${PRIORITY}

trigger_monitoring_agent:
  stage: fan-out
  needs:
    - route_message
  rules:
    - if: $ROUTE_TO_MONITOR == "true"
  trigger:
    project: ${MONITORING_AGENT_PROJECT}
    strategy: depend
  variables:
    OSSA_CHANNEL: ${OSSA_CHANNEL}
    OSSA_PAYLOAD: ${OSSA_PAYLOAD}
    OSSA_PRIORITY: ${PRIORITY}
```

### Reliability with Job Retry

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

**GitLab Implementation**:

```yaml
# .gitlab-ci.yml
.ossa_reliable_job:
  retry:
    max: 3
    when:
      - api_failure
      - runner_system_failure
      - stuck_or_timeout_failure
      - script_failure

publish_with_retry:
  extends: .ossa_reliable_job
  stage: publish
  variables:
    RETRY_DELAY: 1
    MAX_DELAY: 30
  script:
    - |
      ATTEMPT=0
      MAX_ATTEMPTS=3

      while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        ATTEMPT=$((ATTEMPT + 1))
        echo "Attempt ${ATTEMPT}/${MAX_ATTEMPTS}"

        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${OSSA_BROKER_URL}/publish" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${OSSA_TOKEN}" \
          -d "{
            \"channel\": \"${OSSA_CHANNEL}\",
            \"payload\": ${OSSA_PAYLOAD},
            \"metadata\": {\"retryCount\": ${ATTEMPT}}
          }")

        HTTP_CODE=$(echo "${RESPONSE}" | tail -n1)
        BODY=$(echo "${RESPONSE}" | head -n-1)

        if [ "${HTTP_CODE}" -ge 200 ] && [ "${HTTP_CODE}" -lt 300 ]; then
          echo "Success: ${BODY}"
          exit 0
        fi

        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
          # Exponential backoff
          DELAY=$((RETRY_DELAY * (2 ** (ATTEMPT - 1))))
          [ $DELAY -gt $MAX_DELAY ] && DELAY=$MAX_DELAY
          echo "Retrying in ${DELAY}s..."
          sleep $DELAY
        fi
      done

      echo "All attempts failed"
      exit 1
```

## Complete Example

`.gitlab-ci.yml`:
```yaml
# OSSA Agent: security-scanner
# Implements OSSA v0.3.1 messaging specification

include:
  - component: $CI_SERVER_FQDN/ossa/components/publish@v0.3.1
  - component: $CI_SERVER_FQDN/ossa/components/subscribe@v0.3.1

stages:
  - receive
  - scan
  - analyze
  - publish

variables:
  OSSA_AGENT_NAME: "security-scanner"
  OSSA_BROKER_URL: ${OSSA_BROKER_URL}

# Subscribe to dependency.updates channel
receive_dependency_update:
  stage: receive
  rules:
    - if: $OSSA_CHANNEL == "dependency.updates"
    - if: $CI_PIPELINE_SOURCE == "trigger"
  script:
    - |
      PAYLOAD=$(echo "${OSSA_PAYLOAD}" | base64 -d)
      SEVERITY=$(echo "${PAYLOAD}" | jq -r '.severity')

      # Filter: only process high/critical
      if [[ ! "${SEVERITY}" =~ ^(high|critical)$ ]]; then
        echo "Filtered: severity=${SEVERITY}"
        exit 0
      fi

      # Store for next stage
      echo "${PAYLOAD}" > message.json
  artifacts:
    paths:
      - message.json
    expire_in: 1 hour

# Command: scan_package
scan_package_command:
  stage: scan
  rules:
    - if: $OSSA_COMMAND == "scan_package"
  variables:
    PACKAGE_NAME: ""
  script:
    - |
      echo "Scanning ${PACKAGE_NAME}"
      npm audit --package ${PACKAGE_NAME} --json > scan-result.json

      # Return command response
      curl -X POST "${OSSA_BROKER_URL}/command/${OSSA_COMMAND_ID}/response" \
        -H "Authorization: Bearer ${OSSA_TOKEN}" \
        -d @scan-result.json
  timeout: 60 minutes

# Run security analysis
analyze_vulnerabilities:
  stage: analyze
  needs:
    - job: receive_dependency_update
      optional: true
  script:
    - |
      if [ -f message.json ]; then
        PACKAGE=$(jq -r '.package' message.json)
        VERSION=$(jq -r '.to_version' message.json)
      else
        PACKAGE="${SCAN_PACKAGE:-all}"
        VERSION="${SCAN_VERSION:-latest}"
      fi

      # Run comprehensive scan
      npm audit --json > vulnerabilities.json

      # Transform to OSSA schema
      node -e "
        const audit = require('./vulnerabilities.json');
        const findings = Object.entries(audit.vulnerabilities || {})
          .filter(([_, v]) => ['high', 'critical'].includes(v.severity))
          .map(([name, v]) => ({
            vulnerability_id: 'vuln-' + Date.now(),
            severity: v.severity,
            cve_id: v.via[0]?.url?.match(/CVE-\d+-\d+/)?.[0] || null,
            affected_package: name + '@' + v.range,
            remediation: v.fixAvailable ? 'Update available' : 'Manual review'
          }));
        require('fs').writeFileSync('ossa-findings.json', JSON.stringify(findings, null, 2));
      "
  artifacts:
    paths:
      - ossa-findings.json
    expire_in: 1 day

# Publish to security.vulnerabilities channel
publish_findings:
  stage: publish
  needs:
    - analyze_vulnerabilities
  extends: .ossa_reliable_job
  retry:
    max: 3
  script:
    - |
      for finding in $(cat ossa-findings.json | jq -c '.[]'); do
        curl -X POST "${OSSA_BROKER_URL}/publish" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${OSSA_TOKEN}" \
          -d "{
            \"channel\": \"security.vulnerabilities\",
            \"payload\": ${finding},
            \"source\": \"${OSSA_AGENT_NAME}\",
            \"metadata\": {
              \"traceId\": \"${CI_PIPELINE_ID}\",
              \"spanId\": \"${CI_JOB_ID}\",
              \"priority\": \"high\"
            }
          }"
      done

.ossa_reliable_job:
  retry:
    max: 3
    when:
      - api_failure
      - script_failure
```

## Tracing Integration

GitLab CI variables provide trace context:

```yaml
publish_with_tracing:
  script:
    - |
      curl -X POST "${OSSA_BROKER_URL}/publish" \
        -H "traceparent: 00-${CI_PIPELINE_ID}-${CI_JOB_ID}-01" \
        -H "tracestate: gitlab=pipeline:${CI_PIPELINE_ID}" \
        -d "{
          \"metadata\": {
            \"traceId\": \"${CI_PIPELINE_ID}\",
            \"spanId\": \"${CI_JOB_ID}\",
            \"baggage\": {
              \"gitlab.project\": \"${CI_PROJECT_PATH}\",
              \"gitlab.ref\": \"${CI_COMMIT_REF_NAME}\",
              \"gitlab.sha\": \"${CI_COMMIT_SHA}\"
            }
          }
        }"
```

## References

- [GitLab CI/CD Pipelines](https://docs.gitlab.com/ee/ci/)
- [GitLab Multi-Project Pipelines](https://docs.gitlab.com/ee/ci/pipelines/downstream_pipelines.html)
- [GitLab Webhooks](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html)
- [GitLab API](https://docs.gitlab.com/ee/api/)
