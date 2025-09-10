# OSSA Maintenance & Operations

## Overview

This document provides comprehensive maintenance procedures, operational guidelines, and troubleshooting information for OSSA (Open Standards Scalable Agents) v0.1.9-alpha.1 deployments.

## Operational Runbooks

### Daily Operations

#### Health Check Procedures
```bash
#!/bin/bash
# Daily health check script

echo "=== OSSA Daily Health Check $(date) ==="

# Check OSSA service status
if command -v ossa &> /dev/null; then
    echo "✓ OSSA CLI available"
    ossa --version
else
    echo "✗ OSSA CLI not found"
    exit 1
fi

# Workspace status
echo "--- Workspace Status ---"
ossa workspace status

# Agent registry
echo "--- Agent Registry ---"
ossa workspace registry | head -10

# Recent logs
echo "--- Recent Logs ---"
if [ -d "./logs" ]; then
    tail -20 ./logs/ossa.log
else
    echo "No logs directory found"
fi

echo "=== Health Check Complete ==="
```

#### Performance Monitoring
```bash
#!/bin/bash
# Performance monitoring script

# Check system resources
echo "--- System Resources ---"
df -h | grep -E "(Filesystem|/dev/)"
free -h
top -bn1 | head -5

# Check OSSA metrics (if Prometheus enabled)
if curl -s http://localhost:8080/metrics > /dev/null; then
    echo "--- OSSA Metrics ---"
    curl -s http://localhost:8080/metrics | grep -E "ossa_(agents|tasks|workflows)"
fi

# Check container resources (if running in Docker)
if command -v docker &> /dev/null; then
    echo "--- Container Stats ---"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
fi
```

### Weekly Operations

#### Agent Maintenance
```bash
#!/bin/bash
# Weekly agent maintenance

echo "=== Weekly Agent Maintenance $(date) ==="

# Update agent registrations
ossa agent list --status inactive | while read agent_id; do
    echo "Checking inactive agent: $agent_id"
    ossa agent validate "$agent_id" || ossa agent remove "$agent_id"
done

# Cleanup completed workflows
ossa workflow cleanup --older-than 7d --status completed

# Update capability index
ossa registry rebuild

# Backup agent definitions
mkdir -p "./backups/agents/$(date +%Y-%m-%d)"
cp -r .agents/* "./backups/agents/$(date +%Y-%m-%d)/"

echo "=== Weekly Maintenance Complete ==="
```

#### Log Rotation
```bash
#!/bin/bash
# Log rotation script

LOG_DIR="./logs"
BACKUP_DIR="./backups/logs"
DAYS_TO_KEEP=30

if [ -d "$LOG_DIR" ]; then
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Compress and archive logs older than 7 days
    find "$LOG_DIR" -name "*.log" -mtime +7 -exec gzip {} \;
    find "$LOG_DIR" -name "*.log.gz" -mtime +$DAYS_TO_KEEP -delete
    
    # Move archived logs to backup directory
    find "$LOG_DIR" -name "*.log.gz" -exec mv {} "$BACKUP_DIR/" \;
    
    echo "Log rotation completed"
fi
```

### Monthly Operations

#### Security Updates
```bash
#!/bin/bash
# Monthly security update script

echo "=== Monthly Security Updates $(date) ==="

# Update OSSA package
npm update @bluefly/open-standards-scalable-agents

# Security audit
npm audit --audit-level high

# Check for vulnerabilities in dependencies
if command -v docker &> /dev/null; then
    docker run --rm -v "$PWD":/app aquasec/trivy fs /app --severity HIGH,CRITICAL
fi

# Update system packages (Ubuntu/Debian)
if command -v apt &> /dev/null; then
    sudo apt update && sudo apt upgrade -y
fi

# Restart services to apply updates
if command -v systemctl &> /dev/null; then
    sudo systemctl restart ossa
fi

echo "=== Security Updates Complete ==="
```

## Disaster Recovery & Business Continuity

### Backup Procedures

#### Configuration Backup
```bash
#!/bin/bash
# Backup OSSA configuration

BACKUP_DIR="./backups/config/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup workspace configuration
if [ -d ".agent-workspace" ]; then
    cp -r .agent-workspace "$BACKUP_DIR/"
fi

# Backup agent definitions
if [ -d ".agents" ]; then
    cp -r .agents "$BACKUP_DIR/"
fi

# Backup project configuration
if [ -d ".agent" ]; then
    cp -r .agent "$BACKUP_DIR/"
fi

# Backup package configuration
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp *.yml "$BACKUP_DIR/" 2>/dev/null || true
cp *.yaml "$BACKUP_DIR/" 2>/dev/null || true

# Create archive
tar -czf "$BACKUP_DIR.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"

echo "Configuration backup created: $BACKUP_DIR.tar.gz"
```

#### Data Backup (if using persistent storage)
```bash
#!/bin/bash
# Data backup script for persistent deployments

BACKUP_DIR="./backups/data/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup database (PostgreSQL)
if [ "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"
    echo "Database backup completed"
fi

# Backup Redis data
if [ "$REDIS_URL" ]; then
    redis-cli --rdb "$BACKUP_DIR/redis.rdb"
    echo "Redis backup completed"
fi

# Backup file storage
if [ -d "./storage" ]; then
    cp -r ./storage "$BACKUP_DIR/"
    echo "File storage backup completed"
fi

# Create archive and upload to cloud storage
tar -czf "$BACKUP_DIR.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"

# Upload to AWS S3 (example)
if command -v aws &> /dev/null; then
    aws s3 cp "$BACKUP_DIR.tar.gz" s3://ossa-backups/data/
    echo "Backup uploaded to S3"
fi
```

### Recovery Procedures

#### Configuration Recovery
```bash
#!/bin/bash
# Recover OSSA configuration from backup

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=== OSSA Configuration Recovery ==="

# Stop OSSA services
ossa workspace stop 2>/dev/null || true

# Extract backup
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Restore configuration
if [ -d "$TEMP_DIR"/*/.agent-workspace ]; then
    cp -r "$TEMP_DIR"/*/.agent-workspace ./
    echo "✓ Workspace configuration restored"
fi

if [ -d "$TEMP_DIR"/*/.agents ]; then
    cp -r "$TEMP_DIR"/*/.agents ./
    echo "✓ Agent definitions restored"
fi

if [ -d "$TEMP_DIR"/*/.agent ]; then
    cp -r "$TEMP_DIR"/*/.agent ./
    echo "✓ Project configuration restored"
fi

# Restore package files
cp "$TEMP_DIR"/*/package.json ./ 2>/dev/null && echo "✓ Package.json restored"
cp "$TEMP_DIR"/*/*.yml ./ 2>/dev/null && echo "✓ YAML files restored"
cp "$TEMP_DIR"/*/*.yaml ./ 2>/dev/null && echo "✓ YAML files restored"

# Cleanup
rm -rf "$TEMP_DIR"

# Validate configuration
ossa workspace validate

# Restart services
ossa workspace start

echo "=== Recovery Complete ==="
```

### RTO/RPO Targets

| Component | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|-----------|-------------------------------|--------------------------------|
| Workspace Configuration | 15 minutes | 24 hours |
| Agent Registry | 5 minutes | 4 hours |
| Active Workflows | 10 minutes | 1 hour |
| Historical Data | 60 minutes | 24 hours |
| External Integrations | 30 minutes | 4 hours |

## Dependency Management

### Update Policy

#### Security Updates
- **Critical**: Apply within 24 hours
- **High**: Apply within 1 week
- **Medium**: Apply within 1 month
- **Low**: Apply during regular maintenance windows

#### Feature Updates
- **Major versions**: Quarterly review and planning
- **Minor versions**: Monthly evaluation
- **Patch versions**: Apply during maintenance windows

### Update Procedures

#### OSSA Package Updates
```bash
#!/bin/bash
# OSSA package update procedure

echo "=== OSSA Package Update ==="

# Check current version
CURRENT_VERSION=$(ossa --version)
echo "Current version: $CURRENT_VERSION"

# Check for updates
npm outdated @bluefly/open-standards-scalable-agents

# Backup configuration before update
./scripts/backup-config.sh

# Update package
npm update @bluefly/open-standards-scalable-agents

# Verify new version
NEW_VERSION=$(ossa --version)
echo "New version: $NEW_VERSION"

# Test functionality
ossa workspace validate
ossa agent list >/dev/null

# Run tests if available
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    npm test
fi

echo "=== Update Complete ==="
```

#### System Dependencies
```bash
#!/bin/bash
# System dependency updates

# Node.js version check
NODE_VERSION=$(node --version)
REQUIRED_VERSION="v20.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "Warning: Node.js version $NODE_VERSION is below required $REQUIRED_VERSION"
fi

# Update npm packages
npm audit fix --audit-level high

# Update system packages (Ubuntu/Debian)
if command -v apt &> /dev/null; then
    sudo apt update
    sudo apt list --upgradable
    
    # Apply security updates
    sudo apt upgrade -y
    
    # Remove unused packages
    sudo apt autoremove -y
fi

# Update container images (if using Docker)
if command -v docker &> /dev/null; then
    docker images --format "table {{.Repository}}:{{.Tag}}" | grep ossa | while read image; do
        docker pull "$image"
    done
fi
```

## Monitoring & Alerting

### Service Level Objectives (SLOs)

| Metric | Target | Measurement Window |
|--------|--------|--------------------|
| Availability | 99.5% | 30 days |
| Agent Registration | <100ms p95 | 5 minutes |
| Task Scheduling | <50ms p95 | 5 minutes |
| Workflow Execution | <10s p95 | 1 hour |
| API Response Time | <200ms p95 | 5 minutes |

### Alerting Rules

#### Prometheus Alerting Rules
```yaml
# alerting-rules.yml
groups:
  - name: ossa.rules
    rules:
      - alert: OSSAServiceDown
        expr: up{job="ossa"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "OSSA service is down"
          description: "OSSA service has been down for more than 1 minute"
      
      - alert: HighTaskFailureRate
        expr: rate(ossa_tasks_failed_total[5m]) / rate(ossa_tasks_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High task failure rate"
          description: "Task failure rate is {{ $value | humanizePercentage }}"
      
      - alert: AgentRegistrationHigh
        expr: histogram_quantile(0.95, rate(ossa_agent_registration_duration_seconds_bucket[5m])) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Slow agent registration"
          description: "95th percentile registration time is {{ $value }}s"
      
      - alert: WorkspaceMemoryHigh
        expr: ossa_workspace_memory_usage_bytes / ossa_workspace_memory_limit_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High workspace memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

#### Health Check Endpoints
```typescript
// Health check implementation
export class HealthChecker {
  async checkLiveness(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.OSSA_VERSION || '0.1.9-alpha.1'
    };
  }
  
  async checkReadiness(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkWorkspace(),
      this.checkRegistry(),
      this.checkDatabase(),
      this.checkExternalServices()
    ]);
    
    const healthy = checks.every(check => check.healthy);
    
    return {
      status: healthy ? 'ready' : 'not ready',
      timestamp: new Date(),
      checks
    };
  }
  
  private async checkWorkspace(): Promise<ComponentHealth> {
    try {
      // Check workspace accessibility
      const workspaceConfig = await this.loadWorkspaceConfig();
      return { component: 'workspace', healthy: true };
    } catch (error) {
      return { 
        component: 'workspace', 
        healthy: false, 
        error: error.message 
      };
    }
  }
}
```

### Dashboards

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "OSSA Operations Dashboard",
    "tags": ["ossa", "agents", "orchestration"],
    "panels": [
      {
        "title": "Service Availability",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"ossa\"}",
            "legendFormat": "Service Status"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            }
          }
        }
      },
      {
        "title": "Active Agents",
        "type": "stat",
        "targets": [
          {
            "expr": "ossa_agents_active_total",
            "legendFormat": "Active Agents"
          }
        ]
      },
      {
        "title": "Task Throughput",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ossa_tasks_completed_total[5m])",
            "legendFormat": "Completed/sec"
          },
          {
            "expr": "rate(ossa_tasks_failed_total[5m])",
            "legendFormat": "Failed/sec"
          }
        ]
      },
      {
        "title": "Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(ossa_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(ossa_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      }
    ]
  }
}
```

## Licensing & Compliance

### Third-Party License Review

#### License Inventory
```bash
#!/bin/bash
# Generate license inventory

echo "=== OSSA License Inventory $(date) ==="

# Check npm dependencies
if command -v npm &> /dev/null; then
    echo "--- NPM Dependencies ---"
    npm list --production --parseable | xargs -I {} sh -c 'cd {} && pwd && cat package.json 2>/dev/null | grep -E "(\"name\"|\"license\"|\"version\")"'
fi

# Check for license files
echo "--- License Files ---"
find . -name "*LICENSE*" -o -name "*COPYING*" -o -name "*COPYRIGHT*" | head -20

# Generate license report
if command -v license-checker &> /dev/null; then
    license-checker --production --json > license-report.json
    echo "License report generated: license-report.json"
fi
```

#### License Compliance Checks
```bash
#!/bin/bash
# License compliance validation

ALLOWED_LICENSES="MIT,Apache-2.0,BSD-3-Clause,BSD-2-Clause,ISC"
FORBIDDEN_LICENSES="GPL-2.0,GPL-3.0,AGPL-3.0,LGPL-2.1,LGPL-3.0"

if command -v license-checker &> /dev/null; then
    echo "=== License Compliance Check ==="
    
    # Check for forbidden licenses
    FORBIDDEN_FOUND=$(license-checker --production --onlyAllow "$ALLOWED_LICENSES" --summary 2>&1 | grep -c "FORBIDDEN")
    
    if [ "$FORBIDDEN_FOUND" -gt 0 ]; then
        echo "❌ Forbidden licenses found!"
        license-checker --production --onlyAllow "$ALLOWED_LICENSES"
        exit 1
    else
        echo "✅ All licenses are compliant"
    fi
fi
```

### License Notices

#### Third-Party Attribution
```markdown
# OSSA Third-Party Licenses

This software includes third-party libraries with the following licenses:

## MIT Licensed
- TypeScript (Microsoft Corporation)
- Express.js (TJ Holowaychuk)
- Winston Logger (Charlie Robbins)

## Apache 2.0 Licensed
- Node.js (Node.js Foundation)
- Kubernetes Client Libraries (Kubernetes Authors)

## BSD Licensed
- Redis Client Libraries (Redis Labs)

Complete license texts are available in the LICENSES directory.
```

## Capacity Planning

### Resource Monitoring
```bash
#!/bin/bash
# Resource utilization monitoring

echo "=== Resource Utilization Report $(date) ==="

# CPU utilization
echo "--- CPU Usage ---"
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | awk '{printf "CPU Usage: %.1f%%\n", $1}'

# Memory utilization
echo "--- Memory Usage ---"
free | grep Mem | awk '{printf "Memory Usage: %.1f%%\n", $3/$2 * 100.0}'

# Disk utilization
echo "--- Disk Usage ---"
df -h | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{print $5 " " $6}' | while read output; do
    usage=$(echo $output | awk '{print $1}' | sed 's/%//g')
    partition=$(echo $output | awk '{print $2}')
    if [ $usage -ge 80 ]; then
        echo "WARNING: $partition is ${usage}% full"
    else
        echo "OK: $partition is ${usage}% full"
    fi
done

# Network utilization
echo "--- Network Usage ---"
if command -v iftop &> /dev/null; then
    iftop -t -s 10 | tail -3
fi

# OSSA-specific metrics
if curl -s http://localhost:8080/metrics > /dev/null; then
    echo "--- OSSA Metrics ---"
    curl -s http://localhost:8080/metrics | grep -E "(ossa_agents_total|ossa_tasks_active|ossa_memory_usage)"
fi
```

### Scaling Recommendations
```bash
#!/bin/bash
# Automated scaling recommendations

AGENT_COUNT=$(ossa agent list | wc -l)
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | sed 's/%//g')
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

echo "=== Scaling Recommendations ==="
echo "Current Agents: $AGENT_COUNT"
echo "CPU Usage: ${CPU_USAGE}%"
echo "Memory Usage: ${MEMORY_USAGE}%"

# CPU-based recommendations
if (( $(echo "$CPU_USAGE > 70" | bc -l) )); then
    echo "🔴 RECOMMENDATION: Scale up - High CPU usage detected"
    echo "   - Add more worker nodes"
    echo "   - Increase CPU allocation"
elif (( $(echo "$CPU_USAGE < 20" | bc -l) )); then
    echo "🟡 RECOMMENDATION: Consider scaling down - Low CPU usage"
fi

# Memory-based recommendations
if [ "$MEMORY_USAGE" -gt 80 ]; then
    echo "🔴 RECOMMENDATION: Scale up - High memory usage detected"
    echo "   - Increase memory allocation"
    echo "   - Optimize agent memory usage"
elif [ "$MEMORY_USAGE" -lt 30 ]; then
    echo "🟡 RECOMMENDATION: Consider scaling down - Low memory usage"
fi

# Agent-based recommendations
if [ "$AGENT_COUNT" -gt 50 ]; then
    echo "🔴 RECOMMENDATION: Consider agent optimization"
    echo "   - Review agent efficiency"
    echo "   - Implement agent pooling"
fi
```

This maintenance guide provides comprehensive procedures for keeping OSSA deployments healthy, secure, and performant across their lifecycle.