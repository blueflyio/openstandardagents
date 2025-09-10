# OSSA-CrewAI Integration

The OSSA-CrewAI integration enables seamless conversion of OSSA agent specifications into CrewAI multi-agent teams with role-based coordination patterns and comprehensive observability.

## Features

### 🔄 Agent Conversion
- **Automatic Conversion**: Convert OSSA agent specifications to CrewAI agent definitions
- **Metadata Preservation**: Maintain OSSA metadata for traceability and compliance
- **Tool Mapping**: Map OSSA capabilities to CrewAI tools and functions
- **Role Assignment**: Intelligent role mapping based on agent expertise

### 🎭 Coordination Patterns
- **Sequential**: Agents execute tasks one after another with context sharing
- **Parallel**: Simultaneous execution for maximum performance
- **Hierarchical**: Leader-based coordination with clear decision-making
- **Consensus**: Democratic decision-making with team voting
- **Expert Network**: Expertise-based task routing and optimization
- **Adaptive**: Dynamic pattern adaptation based on conditions

### 📊 Observability
- **Traceloop Integration**: Comprehensive tracing with Traceloop platform
- **Langfuse Support**: Full observability with Langfuse analytics
- **OpenTelemetry**: Standard observability with spans, metrics, and logs
- **Custom Metrics**: Record custom metrics for team performance
- **Error Tracking**: Detailed error tracking and analysis

### 🛠️ CLI Tools
- **Convert**: Convert OSSA specifications to CrewAI configurations
- **Execute**: Run CrewAI workflows with observability
- **Validate**: Validate OSSA specifications for CrewAI compatibility
- **Patterns**: List and explore coordination patterns
- **Examples**: Run demonstration workflows

## Installation

The OSSA-CrewAI integration is included with the main OSSA package:

```bash
npm install @bluefly/open-standards-scalable-agents
```

Additional CrewAI packages are automatically installed:
- `crewai-ts`: TypeScript CrewAI framework
- `jcrewai`: Multi-agent automation framework
- `@ag-ui/crewai`: AG-UI protocol implementation

## Quick Start

### 1. Convert OSSA Agents to CrewAI Team

```javascript
import { CrewAIIntegration } from '@bluefly/open-standards-scalable-agents/lib/integrations/crewai';

const integration = new CrewAIIntegration();

// Load OSSA agent specifications
const ossaAgents = [
  // Your OSSA agent specifications here
];

// Create CrewAI team
const crew = await integration.createTeam(ossaAgents, {
  process: 'sequential',
  verbose: true,
  memory: true
});
```

### 2. Execute Multi-Agent Workflow

```javascript
// Define task
const task = {
  description: 'Analyze system performance and create optimization recommendations',
  inputs: {
    system_metrics: { cpu: 85, memory: 76, disk: 45 },
    target_performance: { response_time: '< 200ms', throughput: '> 1000 rps' }
  }
};

// Execute with observability
const result = await integration.executeWorkflow(crew, task);

console.log('Execution completed:', result.success);
console.log('Duration:', result.observability.executionTime, 'ms');
console.log('Trace ID:', result.observability.tracingData.traceId);
```

### 3. Apply Coordination Patterns

```javascript
// Get hierarchical coordination pattern
const pattern = integration.getCoordinationPattern('hierarchical');

// Apply to team
integration.coordination.applyPattern(crew, 'hierarchical', {
  leaderRole: 'manager',
  delegationEnabled: true,
  conflictResolution: 'leader_decides'
});
```

## CLI Usage

### Convert OSSA Specifications

```bash
# Convert single agent
ossa-crewai convert -i agent.yml -o team.json

# Convert multiple agents with specific pattern
ossa-crewai convert -i agent1.yml agent2.yml agent3.yml -o team.json --pattern hierarchical

# Output as YAML
ossa-crewai convert -i *.yml -o team.yml --format yaml
```

### Execute Workflows

```bash
# Execute with basic task
ossa-crewai execute -c team.json -t "Optimize database performance"

# Execute with complex inputs and observability
ossa-crewai execute -c team.json -t "Security audit" \
  --inputs '{"services":["auth","payment"],"compliance":["PCI-DSS"]}' \
  --observability --session audit-2024-001
```

### Validation and Patterns

```bash
# Validate OSSA specifications
ossa-crewai validate -i agent1.yml agent2.yml

# List coordination patterns
ossa-crewai patterns

# Run examples
ossa-crewai examples --type basic
ossa-crewai examples --type patterns
ossa-crewai examples --type observability
```

## Configuration

### Environment Variables

```bash
# Langfuse configuration
export LANGFUSE_SECRET_KEY="your-langfuse-secret-key"
export LANGFUSE_PUBLIC_KEY="your-langfuse-public-key"
export LANGFUSE_HOST="https://cloud.langfuse.com"

# Traceloop configuration
export TRACELOOP_API_KEY="your-traceloop-api-key"
```

### Integration Options

```javascript
const integration = new CrewAIIntegration({
  observabilityEnabled: true,
  tracingProvider: 'both', // 'traceloop' | 'langfuse' | 'both'
  enableMetrics: true,
  enableLogs: true,
  samplingRate: 1.0
});
```

## Coordination Patterns

### Sequential Pattern
- **Best for**: Step-by-step workflows, dependent tasks
- **Features**: Full context sharing, predictable execution order
- **Use case**: Document analysis → Summary → Review → Publication

### Parallel Pattern  
- **Best for**: Independent tasks, maximum speed
- **Features**: Simultaneous execution, isolated failures
- **Use case**: Multiple security scans, parallel data processing

### Hierarchical Pattern
- **Best for**: Complex decision-making, clear leadership
- **Features**: Leader coordination, conflict resolution
- **Use case**: Project management, strategic planning

### Consensus Pattern
- **Best for**: Democratic decisions, team collaboration
- **Features**: Voting mechanisms, collective agreement
- **Use case**: Architecture decisions, policy development

### Expert Network Pattern
- **Best for**: Specialized tasks, optimal resource utilization
- **Features**: Expertise matching, dynamic routing
- **Use case**: Technical consulting, specialized analysis

### Adaptive Pattern
- **Best for**: Dynamic environments, varying complexity
- **Features**: Pattern switching, intelligent adaptation
- **Use case**: Real-time systems, variable workloads

## Observability Features

### Tracing
- **Distributed Tracing**: Full workflow tracing across agents
- **Custom Spans**: Create custom spans for specific operations
- **Context Propagation**: Maintain trace context across agent boundaries
- **Performance Metrics**: Detailed timing and performance data

### Metrics
- **Execution Metrics**: Duration, success rates, error rates
- **Agent Metrics**: Individual agent performance and utilization
- **Pattern Metrics**: Coordination pattern effectiveness
- **Custom Metrics**: Record domain-specific metrics

### Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Agent Activity**: Detailed logs of agent interactions
- **Error Tracking**: Comprehensive error logging and stack traces
- **Audit Trail**: Complete audit trail for compliance

## Examples

### Basic Team Example
Run a simple three-agent team with sequential coordination:

```bash
npm run crewai:basic
```

### Coordination Patterns Demo
Explore all coordination patterns with diverse agent teams:

```bash
npm run crewai:patterns
```

### Observability Demo
Comprehensive observability integration demonstration:

```bash
npm run crewai:observability
```

## Integration Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│ OSSA Specification  │───▶│  CrewAI Integration │
└─────────────────────┘    └─────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐        ┌─────────────────────┐        ┌─────────────────┐
│    Converter    │        │   Orchestrator      │        │  Observability  │
│   - Role Map    │        │   - Team Creation   │        │   - Tracing     │
│   - Tool Map    │        │   - Task Assignment │        │   - Metrics     │
│   - Metadata    │        │   - Execution       │        │   - Logging     │
└─────────────────┘        └─────────────────────┘        └─────────────────┘
         │                             │                             │
         └─────────────────┐           │           ┌─────────────────┘
                           │           │           │
                           ▼           ▼           ▼
                    ┌─────────────────────────────────┐
                    │      CrewAI Framework           │
                    │   - Agents    - Tasks           │
                    │   - Tools     - Process         │
                    │   - Memory    - Coordination    │
                    └─────────────────────────────────┘
```

## Best Practices

### 1. Agent Design
- Define clear roles and expertise areas
- Provide comprehensive capability descriptions
- Enable CrewAI framework support in OSSA specifications
- Use meaningful agent names and descriptions

### 2. Coordination Selection
- Choose sequential for dependent tasks
- Use parallel for independent work
- Apply hierarchical for complex decisions
- Consider consensus for collaborative decisions
- Leverage expert network for specialized tasks

### 3. Observability
- Always enable observability in production
- Use meaningful session IDs for tracking
- Record custom metrics for domain-specific insights
- Monitor agent performance and utilization

### 4. Error Handling
- Implement proper error boundaries
- Use retry policies for transient failures
- Log errors with sufficient context
- Plan fallback strategies for critical workflows

## Troubleshooting

### Common Issues

1. **Conversion Failures**
   - Ensure OSSA specifications are valid
   - Verify CrewAI framework is enabled
   - Check agent capabilities are defined

2. **Execution Errors**
   - Validate team configuration
   - Ensure all agents have assigned tasks
   - Check observability configuration

3. **Observability Issues**
   - Verify environment variables are set
   - Check API keys and endpoints
   - Ensure OpenTelemetry SDK is initialized

4. **Performance Problems**
   - Monitor agent resource usage
   - Optimize coordination patterns
   - Review task distribution

### Support

For support and questions:
- Review the examples in `/examples/crewai/`
- Check the main OSSA documentation
- Run validation tools: `ossa-crewai validate`
- Use the CLI help: `ossa-crewai --help`

## Contributing

The OSSA-CrewAI integration is part of the broader OSSA ecosystem. Contributions are welcome:

1. Follow OSSA contribution guidelines
2. Add tests for new coordination patterns
3. Update documentation for new features
4. Ensure backward compatibility

## License

This integration is part of OSSA and is licensed under the Apache License 2.0.