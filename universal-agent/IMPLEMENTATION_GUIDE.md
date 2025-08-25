# Universal OpenAPI for AI Agents: Implementation Guide

## Overview

This guide demonstrates how to implement the Universal OpenAPI for AI Agents Standard across different AI frameworks and platforms. Each implementation follows the same core principles while leveraging framework-specific capabilities.

## Quick Start

### 1. Basic Agent Implementation

```typescript
// Example: LangChain Agent with Universal Standard
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { UniversalAgentToolkit } from "./universal-toolkit";

const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0,
});

const toolkit = new UniversalAgentToolkit({
  openapiSpec: "./openapi.yaml",
  agentConfig: "./agent.yml",
});

const agent = await createOpenAIFunctionsAgent({
  llm,
  tools: toolkit.getTools(),
  prompt: toolkit.getPrompt(),
});

const agentExecutor = new AgentExecutor({
  agent,
  tools: toolkit.getTools(),
  verbose: true,
});

// Execute with Universal Standard compliance
const result = await agentExecutor.invoke({
  input: "Analyze the codebase and identify security vulnerabilities",
  context: {
    project: "web-application",
    compliance: "SOC2",
    budget: 1000,
  },
});
```

### 2. CrewAI Multi-Agent System

```python
# Example: CrewAI with Universal Standard
from crewai import Agent, Task, Crew, Process
from universal_standard import UniversalAgentAdapter

class SecurityAnalyst(Agent):
    def __init__(self):
        super().__init__(
            role="Security Analyst",
            goal="Identify and document security vulnerabilities",
            backstory="Expert in application security with 10+ years experience",
            tools=[UniversalAgentAdapter.get_tools("security")],
            verbose=True
        )

class CodeReviewer(Agent):
    def __init__(self):
        super().__init__(
            role="Code Reviewer",
            goal="Review code for quality and compliance",
            backstory="Senior developer specializing in code quality",
            tools=[UniversalAgentAdapter.get_tools("code_review")],
            verbose=True
        )

# Create Universal Standard compliant crew
crew = Crew(
    agents=[SecurityAnalyst(), CodeReviewer()],
    tasks=[
        Task(
            description="Analyze codebase for security issues",
            agent=SecurityAnalyst(),
            expected_output="Security vulnerability report"
        ),
        Task(
            description="Review code quality and standards compliance",
            agent=CodeReviewer(),
            expected_output="Code quality assessment"
        )
    ],
    process=Process.sequential,
    verbose=True
)

# Execute with Universal Standard monitoring
result = crew.kickoff()
```

## Framework-Specific Implementations

### LangChain Integration

```typescript
// universal-langchain-adapter.ts
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseTool } from "@langchain/core/tools";
import { UniversalStandardValidator } from "./universal-validator";

export class UniversalLangChainAdapter {
  private validator: UniversalStandardValidator;
  private openapiSpec: any;
  private agentConfig: any;

  constructor(openapiSpecPath: string, agentConfigPath: string) {
    this.openapiSpec = require(openapiSpecPath);
    this.agentConfig = require(agentConfigPath);
    this.validator = new UniversalStandardValidator();
  }

  async createAgent(llm: BaseChatModel): Promise<any> {
    // Validate against Universal Standard
    await this.validator.validateAgent(this.agentConfig);
    await this.validator.validateOpenAPI(this.openapiSpec);

    // Create LangChain agent with Universal Standard compliance
    const tools = this.createUniversalTools();
    const prompt = this.createUniversalPrompt();

    return {
      llm,
      tools,
      prompt,
      callbacks: this.createUniversalCallbacks(),
    };
  }

  private createUniversalTools(): BaseTool[] {
    // Convert Universal Standard tools to LangChain tools
    return this.openapiSpec.paths
      .filter((path: any) => path.tags?.includes("Agent Operations"))
      .map((path: any) => this.convertPathToTool(path));
  }

  private createUniversalPrompt(): any {
    // Create prompt that follows Universal Standard guidelines
    return {
      system: this.agentConfig.system_prompt,
      human: this.agentConfig.human_prompt_template,
      inputVariables: this.agentConfig.input_variables,
    };
  }

  private createUniversalCallbacks(): any[] {
    // Implement Universal Standard monitoring and safety
    return [
      {
        handleAgentAction: (action: any) => {
          this.validator.validateAction(action);
          this.monitorAgentBehavior(action);
        },
        handleAgentEnd: (output: any) => {
          this.validator.validateOutput(output);
          this.logAgentCompletion(output);
        },
      },
    ];
  }
}
```

### AutoGen Integration

```python
# universal_autogen_adapter.py
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from universal_standard import UniversalStandardValidator
import yaml
import json

class UniversalAutoGenAdapter:
    def __init__(self, openapi_spec_path: str, agent_config_path: str):
        with open(openapi_spec_path, 'r') as f:
            self.openapi_spec = yaml.safe_load(f)
        
        with open(agent_config_path, 'r') as f:
            self.agent_config = yaml.safe_load(f)
        
        self.validator = UniversalStandardValidator()
        self.validator.validate_agent(self.agent_config)
        self.validator.validate_openapi(self.openapi_spec)

    def create_agent_system(self, agent_type: str = "general"):
        """Create AutoGen agents following Universal Standard"""
        
        # Create specialized agents based on Universal Standard
        agents = []
        
        if agent_type == "security":
            agents.extend(self._create_security_agents())
        elif agent_type == "development":
            agents.extend(self._create_development_agents())
        else:
            agents.extend(self._create_general_agents())
        
        # Create group chat with Universal Standard compliance
        group_chat = GroupChat(
            agents=agents,
            messages=[],
            max_round=50,
            speaker_selection_method="round_robin"
        )
        
        manager = GroupChatManager(
            groupchat=group_chat,
            llm_config=self._get_llm_config()
        )
        
        return manager, agents

    def _create_security_agents(self):
        """Create security-focused agents following Universal Standard"""
        return [
            AssistantAgent(
                name="security_analyst",
                system_message=self.agent_config["specialized_agents"]["security_expert"]["description"],
                llm_config=self._get_llm_config(),
                tools=self._get_universal_tools("security")
            ),
            AssistantAgent(
                name="compliance_checker",
                system_message=self.agent_config["specialized_agents"]["compliance_expert"]["description"],
                llm_config=self._get_llm_config(),
                tools=self._get_universal_tools("compliance")
            )
        ]

    def _create_development_agents(self):
        """Create development-focused agents following Universal Standard"""
        return [
            AssistantAgent(
                name="code_reviewer",
                system_message=self.agent_config["specialized_agents"]["code_review_expert"]["description"],
                llm_config=self._get_llm_config(),
                tools=self._get_universal_tools("code_review")
            ),
            AssistantAgent(
                name="architect",
                system_message=self.agent_config["specialized_agents"]["architecture_expert"]["description"],
                llm_config=self._get_llm_config(),
                tools=self._get_universal_tools("architecture")
            )
        ]

    def _get_universal_tools(self, category: str):
        """Get tools based on Universal Standard categories"""
        tools = []
        for path, spec in self.openapi_spec["paths"].items():
            if category in path or category in spec.get("tags", []):
                tools.append(self._convert_path_to_tool(path, spec))
        return tools

    def _get_llm_config(self):
        """Get LLM configuration following Universal Standard"""
        return {
            "config_list": [{"model": "gpt-4"}],
            "temperature": 0.1,
            "max_tokens": 4000,
            "timeout": 120,
        }
```

### OpenAI Assistants Integration

```typescript
// universal-openai-adapter.ts
import OpenAI from "openai";
import { UniversalStandardValidator } from "./universal-validator";

export class UniversalOpenAIAdapter {
  private openai: OpenAI;
  private validator: UniversalStandardValidator;
  private openapiSpec: any;
  private agentConfig: any;

  constructor(apiKey: string, openapiSpecPath: string, agentConfigPath: string) {
    this.openai = new OpenAI({ apiKey });
    this.openapiSpec = require(openapiSpecPath);
    this.agentConfig = require(agentConfigPath);
    this.validator = new UniversalStandardValidator();
  }

  async createUniversalAssistant(assistantType: string = "general"): Promise<any> {
    // Validate against Universal Standard
    await this.validator.validateAgent(this.agentConfig);
    await this.validator.validateOpenAPI(this.openapiSpec);

    // Create OpenAI Assistant with Universal Standard compliance
    const assistant = await this.openai.beta.assistants.create({
      name: `${assistantType}_universal_agent`,
      instructions: this.generateInstructions(assistantType),
      model: "gpt-4-turbo-preview",
      tools: this.createOpenAITools(),
      metadata: {
        standard: "Universal OpenAPI for AI Agents",
        version: "1.0.0",
        compliance: "enterprise_ready",
        capabilities: this.getCapabilities(assistantType),
      },
    });

    return assistant;
  }

  private generateInstructions(assistantType: string): string {
    const baseInstructions = this.agentConfig.system_prompt;
    const specializedInstructions = this.agentConfig.specialized_agents[assistantType]?.instructions || "";
    
    return `${baseInstructions}

${specializedInstructions}

IMPORTANT: Follow the Universal OpenAPI for AI Agents Standard:
- Always validate inputs against defined schemas
- Implement proper error handling and logging
- Maintain audit trails for all operations
- Follow security and compliance guidelines
- Use standardized response formats`;
  }

  private createOpenAITools(): any[] {
    // Convert Universal Standard tools to OpenAI function calling format
    const tools = [];
    
    for (const [path, spec] of Object.entries(this.openapiSpec.paths)) {
      if (spec.post || spec.get) {
        tools.push({
          type: "function",
          function: this.convertPathToFunction(path, spec),
        });
      }
    }
    
    return tools;
  }

  private convertPathToFunction(path: string, spec: any): any {
    const method = spec.post ? "POST" : "GET";
    const operationId = spec[method.toLowerCase()]?.operationId || path.replace(/\//g, "_");
    
    return {
      name: operationId,
      description: spec[method.toLowerCase()]?.summary || `Execute ${path}`,
      parameters: this.convertSchemaToJSONSchema(spec[method.toLowerCase()]?.requestBody?.content?.["application/json"]?.schema),
    };
  }

  private convertSchemaToJSONSchema(schema: any): any {
    // Convert OpenAPI schema to JSON Schema for OpenAI function calling
    if (!schema) return { type: "object", properties: {} };
    
    return {
      type: "object",
      properties: schema.properties || {},
      required: schema.required || [],
    };
  }

  private getCapabilities(assistantType: string): string[] {
    const baseCapabilities = this.agentConfig.required_capabilities;
    const specializedCapabilities = this.agentConfig.specialized_agents[assistantType]?.capabilities || [];
    
    return [...baseCapabilities, ...specializedCapabilities];
  }

  async executeUniversalTask(assistantId: string, task: string, context: any = {}): Promise<any> {
    // Create thread and execute task with Universal Standard compliance
    const thread = await this.openai.beta.threads.create();
    
    await this.openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: this.formatTask(task, context),
    });

    const run = await this.openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      instructions: "Execute this task following the Universal OpenAPI for AI Agents Standard",
    });

    // Monitor execution with Universal Standard compliance
    return this.monitorExecution(thread.id, run.id);
  }

  private formatTask(task: string, context: any): string {
    return `Task: ${task}

Context: ${JSON.stringify(context, null, 2)}

Please execute this task following the Universal OpenAPI for AI Agents Standard:
1. Validate all inputs
2. Follow security protocols
3. Maintain audit trails
4. Use standardized response formats
5. Implement proper error handling`;
  }

  private async monitorExecution(threadId: string, runId: string): Promise<any> {
    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    
    while (run.status === "in_progress" || run.status === "queued") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    }

    if (run.status === "completed") {
      const messages = await this.openai.beta.threads.messages.list(threadId);
      return messages.data[0];
    } else {
      throw new Error(`Execution failed: ${run.status}`);
    }
  }
}
```

## Implementation Examples

### Example 1: Security Analysis Agent

```typescript
// security-agent-example.ts
import { UniversalOpenAIAdapter } from "./universal-openai-adapter";

async function runSecurityAnalysis() {
  const adapter = new UniversalOpenAIAdapter(
    process.env.OPENAI_API_KEY!,
    "./openapi.yaml",
    "./agent.yml"
  );

  const securityAssistant = await adapter.createUniversalAssistant("security_expert");

  const result = await adapter.executeUniversalTask(
    securityAssistant.id,
    "Analyze the provided codebase for security vulnerabilities",
    {
      project: "web-application",
      compliance: "SOC2",
      risk_level: "high",
      budget: 5000,
    }
  );

  console.log("Security Analysis Complete:", result);
}

runSecurityAnalysis().catch(console.error);
```

### Example 2: Multi-Agent Code Review

```python
# code-review-example.py
from universal_autogen_adapter import UniversalAutoGenAdapter

def run_code_review():
    adapter = UniversalAutoGenAdapter(
        "./openapi.yaml",
        "./agent.yml"
    )
    
    manager, agents = adapter.create_agent_system("development")
    
    # Create user proxy for interaction
    user_proxy = UserProxyAgent(
        name="user_proxy",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=10,
        is_termination_msg=lambda x: x.get("content", "") and "TERMINATE" in x.get("content", ""),
        code_execution_config={"work_dir": "workspace"},
        llm_config={"config_list": [{"model": "gpt-4"}]}
    )
    
    # Execute code review
    result = user_proxy.initiate_chat(
        manager,
        message="Review the codebase for quality issues, security vulnerabilities, and compliance with coding standards. Provide detailed recommendations for improvement."
    )
    
    return result

if __name__ == "__main__":
    result = run_code_review()
    print("Code Review Complete:", result)
```

## Testing and Validation

### Universal Standard Compliance Testing

```typescript
// universal-compliance-test.ts
import { UniversalStandardValidator } from "./universal-validator";
import { UniversalOpenAIAdapter } from "./universal-openai-adapter";

describe("Universal Standard Compliance", () => {
  let validator: UniversalStandardValidator;
  let adapter: UniversalOpenAIAdapter;

  beforeEach(async () => {
    validator = new UniversalStandardValidator();
    adapter = new UniversalOpenAIAdapter(
      process.env.OPENAI_API_KEY!,
      "./openapi.yaml",
      "./agent.yml"
    );
  });

  test("should validate agent configuration", async () => {
    const isValid = await validator.validateAgent("./agent.yml");
    expect(isValid).toBe(true);
  });

  test("should validate OpenAPI specification", async () => {
    const isValid = await validator.validateOpenAPI("./openapi.yaml");
    expect(isValid).toBe(true);
  });

  test("should create compliant OpenAI assistant", async () => {
    const assistant = await adapter.createUniversalAssistant("security_expert");
    
    expect(assistant.metadata.standard).toBe("Universal OpenAPI for AI Agents");
    expect(assistant.metadata.compliance).toBe("enterprise_ready");
    expect(assistant.tools).toHaveLength(expect.any(Number));
  });

  test("should execute tasks with compliance monitoring", async () => {
    const assistant = await adapter.createUniversalAssistant("general");
    
    const result = await adapter.executeUniversalTask(
      assistant.id,
      "Perform a simple validation task",
      { test: true }
    );
    
    expect(result).toBeDefined();
    // Additional compliance checks would go here
  });
});
```

## Deployment and Monitoring

### Docker Deployment

```dockerfile
# Dockerfile for Universal AI Agent
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Universal Standard files
COPY openapi.yaml ./
COPY agent.yml ./
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: universal-ai-agent
  labels:
    app: universal-ai-agent
    standard: "universal-openapi-ai-agents"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: universal-ai-agent
  template:
    metadata:
      labels:
        app: universal-ai-agent
    spec:
      containers:
      - name: universal-ai-agent
        image: universal-ai-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: UNIVERSAL_STANDARD_VERSION
          value: "1.0.0"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: universal-ai-agent-service
spec:
  selector:
    app: universal-ai-agent
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Best Practices

### 1. Schema-First Development
- Define all data structures in OpenAPI schemas
- Use JSON Schema validation for all inputs/outputs
- Maintain backward compatibility during evolution

### 2. Security Implementation
- Implement OAuth2 PKCE for authentication
- Use mutual TLS for API communication
- Rotate API keys regularly
- Validate all inputs against schemas

### 3. Monitoring and Observability
- Implement comprehensive health checks
- Use structured logging with correlation IDs
- Monitor token usage and costs
- Track compliance metrics

### 4. Testing Strategy
- Unit tests for all agent functions
- Integration tests for API endpoints
- Contract testing for schema validation
- Chaos engineering for resilience

### 5. Performance Optimization
- Implement token preflight checks
- Use semantic deduplication
- Optimize memory usage with sliding windows
- Cache frequently used schemas

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**
   - Ensure all schemas follow JSON Schema 2020-12
   - Validate schemas with online validators
   - Check for circular references

2. **Authentication Issues**
   - Verify OAuth2 configuration
   - Check API key permissions
   - Validate token expiration

3. **Performance Problems**
   - Monitor token usage
   - Check memory consumption
   - Review caching strategies

4. **Compliance Violations**
   - Run compliance checks regularly
   - Review audit logs
   - Update security policies

## Next Steps

1. **Choose Your Framework**: Select the adapter that best fits your needs
2. **Implement Core Features**: Start with basic agent functionality
3. **Add Specialized Agents**: Implement domain-specific capabilities
4. **Test and Validate**: Ensure Universal Standard compliance
5. **Deploy and Monitor**: Use the provided deployment examples
6. **Contribute**: Share improvements and extensions with the community

## Support and Resources

- **Documentation**: [Universal Standard Documentation](./README.md)
- **Examples**: [Implementation Examples](./examples/)
- **Community**: [GitHub Discussions](https://github.com/universal-ai-agents/standard/discussions)
- **Issues**: [GitHub Issues](https://github.com/universal-ai-agents/standard/issues)

---

*This implementation guide demonstrates how to use the Universal OpenAPI for AI Agents Standard across different frameworks. For more details, refer to the main specification documents.*
