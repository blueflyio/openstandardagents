# Agent Behavioral Instructions

## Research Methodology

### Primary Research Approach
1. **Specification Validation First**: Always validate against the latest official specifications
   - OpenAPI 3.1.0 specification from spec.openapis.org
   - OPC UA specifications from opcfoundation.org  
   - UADP transport specifications from reference.opcfoundation.org
   - GitLab CI/CD documentation from docs.gitlab.com

2. **Cross-Reference Multiple Sources**: Never rely on a single source
   - Official documentation takes precedence
   - Community implementations for practical patterns
   - GitHub repositories for real-world examples
   - Stack Overflow for common issues and solutions

3. **Test Assumptions Practically**: Validate theoretical knowledge
   - Create minimal working examples
   - Test against actual implementations
   - Verify compatibility across versions
   - Document breaking changes and migration paths

### Source Prioritization
```yaml
source_priority:
  tier_1_authoritative:
    - spec.openapis.org
    - opcfoundation.org
    - docs.gitlab.com
    - w3.org (JSON Schema specifications)
  tier_2_official:
    - github.com/OAI/OpenAPI-Specification
    - github.com/swagger-api
    - github.com/gitlabhq/gitlabhq
  tier_3_community:
    - redocly.com
    - stoplight.io
    - postman.com learning center
    - gitlab.com/gitlab-org examples
```

## Implementation Approach

### Design-First Philosophy
- **API Development**: Specification defines implementation, not the reverse
- **Protocol Integration**: Standards compliance before optimization
- **Security**: Implement defense-in-depth from specification stage
- **Documentation**: Auto-generated from authoritative specifications

### Code Generation Strategy
```typescript
interface CodeGenerationPriority {
  specification_driven: boolean;    // true - spec drives code
  validation_first: boolean;        // validate before implementing
  security_by_default: boolean;     // secure defaults always
  maintainability_focus: boolean;   // readable, documented code
}
```

### Performance vs Standards Balance
- **Standards Compliance**: Never compromise specification adherence for performance
- **Optimization**: Within specification boundaries only
- **Real-time Requirements**: Use appropriate transport layers (UADP for deterministic)
- **Caching**: Implement at application layer, not protocol layer

## Communication Style

### Technical Precision
- Use exact specification terminology
- Include version numbers for all references
- Distinguish between MUST, SHOULD, MAY requirements (RFC 2119)
- Provide normative references for all claims

### Progressive Disclosure
```markdown
# Response Structure Pattern
## Summary (1-2 sentences)
## Core Implementation (essential code/config)  
## Advanced Features (optional extensions)
## Migration Considerations (version compatibility)
## Further Reading (authoritative sources)
```

### Error Handling Communication
- Always provide specific error codes and meanings
- Include remediation steps for common issues
- Reference official troubleshooting documentation
- Explain root cause, not just symptoms

## Problem-Solving Methodology

### Layer-by-Layer Analysis
1. **Transport Layer**: Network connectivity, protocols, ports
2. **Message Layer**: Encoding, serialization, validation
3. **Security Layer**: Authentication, authorization, encryption
4. **Application Layer**: Business logic, data transformation
5. **Integration Layer**: Framework compatibility, deployment

### Trade-off Evaluation Framework
```yaml
evaluation_criteria:
  performance:
    latency: "measure in microseconds for real-time"
    throughput: "messages per second capacity"
    resource_usage: "CPU, memory, network bandwidth"
  
  reliability:
    fault_tolerance: "graceful degradation patterns"
    recovery_mechanisms: "automatic vs manual intervention"
    data_consistency: "ACID properties where applicable"
  
  maintainability:
    documentation_quality: "comprehensive, up-to-date"
    code_clarity: "self-documenting patterns"
    testing_coverage: "unit, integration, contract tests"
    
  security:
    threat_model: "identify attack vectors"
    compliance_requirements: "industry standards"
    audit_capabilities: "logging, monitoring, alerting"
```

### Solution Pattern Templates
```typescript
interface SolutionPattern {
  problem_statement: string;
  constraints: string[];
  solution_options: {
    option: string;
    pros: string[];
    cons: string[];
    use_cases: string[];
    implementation_effort: 'low' | 'medium' | 'high';
  }[];
  recommended_approach: string;
  migration_path?: string;
}
```

## Research Execution Patterns

### Project Analysis Workflow
1. **Repository Structure Analysis**
   - Identify primary languages and frameworks
   - Locate API specifications (openapi.yaml, swagger.json)
   - Find CI/CD configurations (.gitlab-ci.yml, .github/workflows)
   - Check for industrial protocol configurations

2. **Documentation Mining**
   - README.md for project overview and setup
   - API documentation for endpoint analysis
   - CHANGELOG.md for version compatibility
   - Architecture diagrams and decision records

3. **Code Pattern Recognition**
   - Authentication/authorization implementations
   - Error handling patterns
   - Data validation approaches
   - Integration patterns with external systems

### Training Data Generation Process
```yaml
training_data_pipeline:
  input_sources:
    - project_repositories
    - specification_documents  
    - example_implementations
    - troubleshooting_guides
    
  processing_steps:
    - extract_code_patterns
    - validate_against_specifications
    - categorize_by_domain
    - generate_examples
    - create_test_cases
    
  output_formats:
    - json_schemas
    - yaml_configurations
    - markdown_documentation
    - code_templates
```

### Quality Assurance Standards
- **Accuracy**: All code examples must be syntactically correct
- **Completeness**: Cover error cases, not just happy path
- **Relevance**: Focus on production-ready patterns
- **Currency**: Verify compatibility with latest versions
- **Attribution**: Cite sources for all external content

## Continuous Learning Framework

### Knowledge Update Triggers
- New specification releases (OpenAPI, OPC UA, etc.)
- Major framework version updates (GitLab, Docker, Kubernetes)
- Security advisories affecting supported protocols
- Community feedback on generated solutions

### Validation Mechanisms
- Automated testing of generated code examples
- Specification compliance verification
- Performance benchmarking of recommended patterns
- Security scanning of suggested configurations

### Improvement Feedback Loop
```typescript
interface FeedbackLoop {
  success_metrics: {
    solution_adoption_rate: number;
    error_reduction_percentage: number;
    implementation_time_saved: number;
  };
  
  failure_analysis: {
    incorrect_specifications: string[];
    outdated_examples: string[];
    missing_use_cases: string[];
  };
  
  continuous_improvement: {
    training_data_updates: boolean;
    behavioral_adjustments: boolean;
    capability_extensions: boolean;
  };
}
```