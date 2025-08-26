# OpenAPI AI Agents + UADP - Example Implementations

Practical examples focused on our three core areas: **Application Development**, **AI Innovation**, and **Government Security** + **Universal Agent Discovery Protocol (UADP)**.

## 🚀 **Quick Start: Make Your Project AI-Ready in 5 Minutes**

👉 **[UADP Quick Start Templates](quick-start/)** - Copy, modify, done!

```bash
# Add UADP to any project:
mkdir -p .agents/my-expert/data
curl -o .agents/agent-registry.yml https://raw.githubusercontent.com/openapi-ai-agents/standard/main/examples/quick-start/agent-registry.yml
curl -o .agents/context.yml https://raw.githubusercontent.com/openapi-ai-agents/standard/main/examples/quick-start/context.yml
# Your project is now AI-discoverable!
```

## 📁 Directory Structure

```
examples/
├── application-development/    # Developer-focused examples
│   ├── basic-agent/           # Simple hello world agent
│   ├── multi-framework/       # Connect LangChain + CrewAI
│   ├── gitlab-integration/    # GitLab CI/CD pipeline
│   └── sdk-usage/            # TypeScript/Python SDK examples
│
├── ai-innovation/             # AI platform examples
│   ├── token-optimization/    # Token cost reduction
│   ├── agent-orchestration/   # Multi-agent patterns
│   ├── protocol-bridges/      # MCP, A2A bridges
│   └── dynamic-routing/       # Smart agent selection
│
└── government-security/       # Security-focused examples
    ├── federated-auth/       # OAuth2 PKCE + CAC/PIV
    ├── audit-logging/        # Immutable audit trails
    ├── compliance-checks/     # NIST AI RMF validation
    └── air-gap-deployment/   # Disconnected environment
```

## 🚀 Quick Start Examples

### 1. Basic Agent (Application Development)

```yaml
# examples/application-development/basic-agent/openapi.yaml
openapi: 3.1.0
info:
  title: Developer Assistant Agent
  version: 1.0.0
  x-agent-metadata:
    class: specialist
    certification_level: bronze
    protocols: [openapi]

paths:
  /agent/analyze-code:
    post:
      operationId: analyzeCode
      summary: Analyze code for improvements
      x-token-estimate: 500
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                code:
                  type: string
                language:
                  type: string
                  enum: [python, typescript, go]
```

### 2. Token Optimization (AI Innovation)

```python
# examples/ai-innovation/token-optimization/optimizer.py
from openapi_agents import TokenOptimizer
import tiktoken

class SmartTokenManager:
    def __init__(self):
        self.optimizer = TokenOptimizer(encoding="cl100k_base")
        self.budget = 10000  # Daily token budget
        
    def optimize_prompt(self, prompt: str) -> dict:
        """Optimize prompt for minimal token usage"""
        # Semantic compression
        compressed = self.optimizer.compress(prompt)
        
        # Token counting
        original_tokens = self.optimizer.count_tokens(prompt)
        optimized_tokens = self.optimizer.count_tokens(compressed)
        
        return {
            "original": prompt,
            "optimized": compressed,
            "savings": f"{(1 - optimized_tokens/original_tokens)*100:.1f}%",
            "cost_reduction": f"${(original_tokens - optimized_tokens) * 0.0001:.2f}"
        }
```

### 3. Government Security (FedRAMP Ready)

```yaml
# examples/government-security/compliance-checks/agent.yml
name: secure-gov-agent
version: 1.0.0
class: orchestrator

security:
  authentication:
    required: true
    methods:
      - type: oauth2_pkce
        provider: login.gov
      - type: piv_card
        validation: strict
      - type: mutual_tls
        ca_cert: /etc/pki/dod-ca.pem
  
  authorization:
    model: abac
    policy_engine: opa
    clearance_levels: [public, cui, secret]
  
  audit:
    enabled: true
    retention_years: 7
    immutable: true
    blockchain_anchor: true

compliance:
  frameworks:
    - framework: NIST_AI_RMF_1_0
      status: implemented
    - framework: FISMA
      status: compliant
    - framework: FedRAMP
      authorization_level: moderate
```

## 🎯 Focus Area Examples

### Application Development Focus

**What we cover:**
- Multi-framework integration (LangChain + CrewAI + AutoGen)
- GitLab CI/CD pipelines with automated testing
- SDK usage in TypeScript, Python, Go
- IDE plugin development

**What we DON'T cover:**
- Healthcare-specific agents
- Financial trading systems
- Manufacturing protocols

### AI Innovation Focus

**What we cover:**
- Token optimization strategies
- Multi-agent orchestration patterns
- Protocol bridge implementations
- Dynamic agent routing

**What we DON'T cover:**
- Medical diagnosis models
- Financial prediction algorithms
- Industrial IoT analytics

### Government Security Focus

**What we cover:**
- FedRAMP authorization patterns
- NIST AI RMF implementation
- CAC/PIV authentication
- Air-gap deployments

**What we DON'T cover:**
- HIPAA compliance
- PCI-DSS requirements
- Industry-specific regulations

## 🔧 Running the Examples

### Prerequisites

```bash
# Install the OpenAPI AI Agents CLI
npm install -g @openapi-ai-agents/cli

# Install Python SDK
pip install openapi-ai-agents

# Clone examples
git clone https://github.com/openapi-ai-agents/standard
cd standard/examples
```

### Running Examples

```bash
# Validate an agent specification
openapi-agent-validate application-development/basic-agent/openapi.yaml

# Run token optimization example
cd ai-innovation/token-optimization
python optimizer.py

# Test government security compliance
cd government-security/compliance-checks
openapi-agent-validate agent.yml --compliance NIST_AI_RMF
```

## 📚 Learn More

- **Documentation**: [docs.openapi-ai-agents.org](https://docs.openapi-ai-agents.org)
- **GitLab Integration**: [GitLab CI/CD Components](../.gitlab/ci-components)
- **SDK Reference**: [SDK Documentation](../sdk)
- **Security Guide**: [Security Best Practices](../docs/security.md)

## 🤝 Contributing

We welcome example contributions that focus on:
- Application development patterns
- AI cost optimization techniques
- Government security implementations

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

*Examples maintained by the OpenAPI AI Agents Consortium*