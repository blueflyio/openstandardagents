<!--
OSSA Tutorials
Purpose: Hands-on examples for common scenarios
Audience: Developers learning OSSA
Educational Focus: Step-by-step implementation guides
-->

# Tutorials

## Tutorial 1: Create Your First Agent

### Goal
Build a simple customer support agent.

### Step 1: Create Agent Definition

```json
{
  "ossa": "0.2.6",
  "agent": {
    "name": "support-agent",
    "version": "1.0.0",
    "description": "Answers customer questions",
    "role": "worker",
    "capabilities": [
      {
        "name": "answer-question",
        "type": "query",
        "description": "Answer customer questions",
        "input": {
          "$ref": "#/components/schemas/Question"
        },
        "output": {
          "$ref": "#/components/schemas/Answer"
        }
      }
    ]
  },
  "components": {
    "schemas": {
      "Question": {
        "type": "object",
        "required": ["text"],
        "properties": {
          "text": {
            "type": "string",
            "description": "Question text"
          }
        }
      },
      "Answer": {
        "type": "object",
        "required": ["text", "confidence"],
        "properties": {
          "text": {
            "type": "string",
            "description": "Answer text"
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          }
        }
      }
    }
  }
}
```

### Step 2: Validate

```bash
ossa validate support-agent.json
```

### Step 3: Generate Types

```bash
ossa generate types support-agent.json --output ./types
```

### Step 4: Implement

```typescript
import { Question, Answer } from './types/support-agent';

async function answerQuestion(question: Question): Promise<Answer> {
  // Your implementation
  return {
    text: "Here's the answer...",
    confidence: 0.95
  };
}
```

## Tutorial 2: Multi-Capability Agent

### Goal
Build an agent with multiple capabilities.

```json
{
  "ossa": "0.2.6",
  "agent": {
    "name": "ticket-manager",
    "version": "1.0.0",
    "description": "Manages support tickets",
    "role": "worker",
    "capabilities": [
      {
        "name": "create-ticket",
        "type": "action",
        "input": {
          "$ref": "#/components/schemas/TicketInput"
        },
        "output": {
          "$ref": "#/components/schemas/Ticket"
        }
      },
      {
        "name": "get-ticket",
        "type": "query",
        "input": {
          "type": "object",
          "required": ["ticketId"],
          "properties": {
            "ticketId": { "type": "string" }
          }
        },
        "output": {
          "$ref": "#/components/schemas/Ticket"
        }
      },
      {
        "name": "update-ticket",
        "type": "action",
        "input": {
          "$ref": "#/components/schemas/TicketUpdate"
        },
        "output": {
          "$ref": "#/components/schemas/Ticket"
        }
      },
      {
        "name": "list-tickets",
        "type": "query",
        "input": {
          "$ref": "#/components/schemas/ListParams"
        },
        "output": {
          "$ref": "#/components/schemas/TicketList"
        }
      }
    ]
  },
  "components": {
    "schemas": {
      "TicketInput": {
        "type": "object",
        "required": ["title", "description"],
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "priority": {
            "type": "string",
            "enum": ["low", "medium", "high"]
          }
        }
      },
      "Ticket": {
        "type": "object",
        "required": ["id", "title", "status"],
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "status": {
            "type": "string",
            "enum": ["open", "in-progress", "closed"]
          },
          "priority": { "type": "string" }
        }
      },
      "TicketUpdate": {
        "type": "object",
        "required": ["id"],
        "properties": {
          "id": { "type": "string" },
          "status": { "type": "string" },
          "priority": { "type": "string" }
        }
      },
      "ListParams": {
        "type": "object",
        "properties": {
          "page": { "type": "integer", "minimum": 1 },
          "limit": { "type": "integer", "minimum": 1, "maximum": 100 }
        }
      },
      "TicketList": {
        "type": "object",
        "required": ["tickets", "total"],
        "properties": {
          "tickets": {
            "type": "array",
            "items": { "$ref": "#/components/schemas/Ticket" }
          },
          "total": { "type": "integer" }
        }
      }
    }
  }
}
```

## Tutorial 3: Agent with Dependencies

### Goal
Build an agent that depends on external services.

```json
{
  "ossa": "0.2.6",
  "agent": {
    "name": "email-agent",
    "version": "1.0.0",
    "description": "Sends emails",
    "role": "worker",
    "capabilities": [
      {
        "name": "send-email",
        "type": "action",
        "input": {
          "$ref": "#/components/schemas/EmailInput"
        },
        "output": {
          "$ref": "#/components/schemas/EmailResult"
        }
      }
    ],
    "dependencies": {
      "services": ["smtp-server", "template-engine"],
      "tools": ["email-validator"]
    },
    "configuration": {
      "smtpHost": "smtp.example.com",
      "smtpPort": 587,
      "fromAddress": "noreply@example.com"
    }
  },
  "components": {
    "schemas": {
      "EmailInput": {
        "type": "object",
        "required": ["to", "subject", "body"],
        "properties": {
          "to": {
            "type": "string",
            "format": "email"
          },
          "subject": { "type": "string" },
          "body": { "type": "string" },
          "template": { "type": "string" }
        }
      },
      "EmailResult": {
        "type": "object",
        "required": ["sent", "messageId"],
        "properties": {
          "sent": { "type": "boolean" },
          "messageId": { "type": "string" }
        }
      }
    }
  }
}
```

## Tutorial 4: Orchestrator Agent

### Goal
Build an agent that coordinates other agents.

```json
{
  "ossa": "0.2.6",
  "agent": {
    "name": "workflow-orchestrator",
    "version": "1.0.0",
    "description": "Orchestrates multi-agent workflows",
    "role": "orchestrator",
    "capabilities": [
      {
        "name": "execute-workflow",
        "type": "action",
        "input": {
          "$ref": "#/components/schemas/WorkflowInput"
        },
        "output": {
          "$ref": "#/components/schemas/WorkflowResult"
        },
        "metadata": {
          "timeout": 60000,
          "retryable": false
        }
      }
    ],
    "dependencies": {
      "agents": [
        "data-processor",
        "email-sender",
        "notification-agent"
      ]
    }
  },
  "components": {
    "schemas": {
      "WorkflowInput": {
        "type": "object",
        "required": ["workflowId", "steps"],
        "properties": {
          "workflowId": { "type": "string" },
          "steps": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["agent", "capability"],
              "properties": {
                "agent": { "type": "string" },
                "capability": { "type": "string" },
                "input": { "type": "object" }
              }
            }
          }
        }
      },
      "WorkflowResult": {
        "type": "object",
        "required": ["success", "results"],
        "properties": {
          "success": { "type": "boolean" },
          "results": {
            "type": "array",
            "items": { "type": "object" }
          }
        }
      }
    }
  }
}
```

## Tutorial 5: CI/CD Integration

### Goal
Validate agents in CI/CD pipeline.

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - deploy

validate-agents:
  stage: validate
  image: node:18
  before_script:
    - npm install -g @bluefly/openstandardagents
  script:
    - ossa validate agents/*.json --strict
  rules:
    - changes:
      - agents/**/*.json

generate-types:
  stage: validate
  image: node:18
  before_script:
    - npm install -g @bluefly/openstandardagents
  script:
    - ossa generate types agents/*.json --output ./src/types
  artifacts:
    paths:
      - src/types/
```

## Next Steps

1. **Explore Examples** - Check `examples/` directory
2. **Read Best Practices** - [Best Practices Guide](best-practices.md)
3. **Join Community** - [Contributing](../contributing.md)
4. **Build Tools** - Create your own OSSA tools

---

**Questions?** Open an [issue](https://gitlab.com/blueflyio/openstandardagents/-/issues)
