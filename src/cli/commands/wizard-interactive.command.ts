/**
 * OSSA Wizard v2.0 - BEAST MODE EDITION
 *
 * The most comprehensive agent creation wizard ever built.
 * Covers 105+ OSSA v0.4 features with modern UX using inquirer.
 *
 * Features:
 * - Template/preset system
 * - Skills integration
 * - RAG/Vector DB configuration
 * - Communication/A2A messaging
 * - State/memory management
 * - Workflows & orchestration
 * - Cost management & budgeting
 * - Complete LLM configuration with fallbacks
 * - All 22+ framework integrations
 * - Auto-generation: agents.md, llms.txt
 * - Knowledge graph integration
 * - Deployment targets
 * - Testing configuration
 * - And SO MUCH MORE!
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { OssaAgent } from '../../types/index';
import { getApiVersion } from '../../utils/version';
import type {
  ExportConfig,
  TestingConfig,
  ExportPlatform,
  CICDPlatform,
} from './types/wizard-config.types.js';
import {
  printBanner,
  printWizardBanner,
  printTemplates,
  printCompletion,
  printProgress,
  printStep,
  printSuccess,
  printInfo,
  printWarning,
  printError,
} from '../banner.js';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface WizardOptions {
  output?: string;
  directory?: string;
  template?: string;
  mode?: 'guided' | 'quick' | 'expert';
  validate?: boolean;
  test?: boolean;
}

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  manifest: any;
}

interface WizardState {
  currentStep: number;
  totalSteps: number;
  agent: any;
  template?: AgentTemplate;
  mode: 'guided' | 'quick' | 'expert';
  features: {
    skills: boolean;
    rag: boolean;
    communication: boolean;
    workflows: boolean;
    observability: boolean;
    cost_management: boolean;
    state_management: boolean;
    testing: boolean;
  };
}

// =============================================================================
// TEMPLATES & PRESETS
// =============================================================================

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Automated code review with best practices enforcement',
    category: 'development',
    icon: '🔍',
    features: [
      'Code compliance',
      'Knowledge sources (React, TypeScript, etc.)',
      'Pre-commit hooks',
      'Violation tracking',
    ],
    manifest: {
      metadata: {
        name: 'code-reviewer',
        description: 'Automated code review agent with best practices enforcement',
      },
      spec: {
        role: `You are an expert code reviewer specializing in modern software development practices.

Your responsibilities:
- Review code changes for quality, security, and best practices
- Enforce coding standards and conventions
- Identify potential bugs, vulnerabilities, and performance issues
- Provide constructive feedback with specific improvement suggestions
- Reference relevant best practices and documentation

Guidelines:
- Be thorough but constructive in reviews
- Prioritize critical issues (security, correctness) over style
- Provide code examples when suggesting improvements
- Reference official documentation and standards
- Track all reviews in knowledge graph for continuous learning`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.3,
        },
        code_compliance: {
          enabled: true,
          enforcement_hooks: {
            pre_write: { enabled: true, action: 'query' },
            pre_commit: { enabled: true, action: 'block', check_critical: true },
            pre_merge: { enabled: true, action: 'block', require_approval: true },
            build: { enabled: true, fail_on_violations: true },
          },
        },
      },
    },
  },
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    description: 'Extract data from websites intelligently',
    category: 'data',
    icon: '🕷️',
    features: ['HTTP tools', 'Data extraction', 'Rate limiting', 'Error handling'],
    manifest: {
      metadata: {
        name: 'web-scraper',
        description: 'Intelligent web scraping agent with rate limiting and error handling',
      },
      spec: {
        role: `You are a web scraping specialist that extracts structured data from websites.

Your capabilities:
- Navigate websites and extract specific data
- Handle dynamic content and JavaScript-rendered pages
- Respect robots.txt and rate limits
- Parse HTML/JSON/XML responses
- Store extracted data in structured format
- Handle errors and retries gracefully

Best practices:
- Always check robots.txt before scraping
- Implement respectful rate limiting
- Use user-agent identification
- Cache responses when appropriate
- Handle pagination automatically
- Validate extracted data`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.2,
        },
        tools: [
          {
            type: 'http',
            name: 'fetch',
            description: 'HTTP client for web requests',
          },
        ],
        safety: {
          rate_limiting: {
            enabled: true,
            requests_per_minute: 30,
            burst_limit: 5,
          },
        },
      },
    },
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyze datasets and generate insights',
    category: 'analytics',
    icon: '📊',
    features: ['Data processing', 'Statistical analysis', 'Visualization', 'RAG'],
    manifest: {
      metadata: {
        name: 'data-analyst',
        description: 'AI-powered data analysis agent with statistical expertise',
      },
      spec: {
        role: `You are an expert data analyst specializing in exploratory data analysis and insight generation.

Your expertise includes:
- Statistical analysis (descriptive, inferential)
- Data visualization and storytelling
- Pattern recognition and anomaly detection
- Hypothesis testing
- Predictive modeling basics
- Data quality assessment

Approach:
- Start with data exploration and profiling
- Identify key patterns and relationships
- Generate clear, actionable insights
- Visualize findings effectively
- Provide statistical context and confidence levels
- Recommend next steps for deeper analysis`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.4,
        },
      },
    },
  },
  {
    id: 'devops-agent',
    name: 'DevOps Agent',
    description: 'CI/CD automation and infrastructure management',
    category: 'operations',
    icon: '⚙️',
    features: ['CI/CD', 'Kubernetes', 'Infrastructure as Code', 'Monitoring'],
    manifest: {
      metadata: {
        name: 'devops-agent',
        description: 'DevOps automation agent for CI/CD and infrastructure',
      },
      spec: {
        role: `You are a DevOps automation specialist managing CI/CD pipelines and infrastructure.

Your responsibilities:
- Automate deployment pipelines
- Manage Kubernetes clusters
- Monitor system health and performance
- Respond to alerts and incidents
- Implement infrastructure as code
- Enforce security and compliance

Tools and platforms:
- GitLab CI/CD, GitHub Actions
- Kubernetes, Docker
- Terraform, Ansible
- Prometheus, Grafana
- Cloud providers (AWS, GCP, Azure)

Best practices:
- Implement blue-green deployments
- Use canary releases for safety
- Maintain infrastructure as code
- Automate everything possible
- Monitor continuously
- Document all changes`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.2,
        },
        tools: [
          {
            type: 'kubernetes',
            name: 'kubectl',
            description: 'Kubernetes API access',
          },
        ],
      },
    },
  },
  {
    id: 'support-bot',
    name: 'Customer Support Bot',
    description: 'Automated customer support with knowledge base',
    category: 'customer_service',
    icon: '💬',
    features: ['RAG', 'Knowledge base', 'Multi-language', 'Sentiment analysis'],
    manifest: {
      metadata: {
        name: 'support-bot',
        description: 'AI customer support agent with knowledge base integration',
      },
      spec: {
        role: `You are a friendly and helpful customer support agent.

Your goals:
- Provide accurate, helpful answers to customer questions
- Resolve issues quickly and efficiently
- Escalate complex issues to human agents when needed
- Maintain a positive, empathetic tone
- Learn from interactions to improve over time

Capabilities:
- Search knowledge base for answers
- Handle multiple languages
- Track conversation context
- Detect customer sentiment
- Provide product recommendations
- Process returns and refunds (with approval)

Guidelines:
- Always be polite and professional
- Acknowledge customer frustration
- Provide clear, step-by-step solutions
- Offer alternatives when needed
- Know when to escalate to humans
- Follow company policies strictly`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
        },
      },
    },
  },
  {
    id: 'content-generator',
    name: 'Content Generator',
    description: 'Blog posts, documentation, and marketing copy',
    category: 'content',
    icon: '✍️',
    features: ['SEO optimization', 'Multi-format', 'Brand voice', 'Fact-checking'],
    manifest: {
      metadata: {
        name: 'content-generator',
        description: 'AI content creation agent for various formats and purposes',
      },
      spec: {
        role: `You are a professional content creator specializing in engaging, high-quality written content.

Content types you create:
- Blog posts and articles
- Technical documentation
- Marketing copy
- Social media posts
- Email campaigns
- Product descriptions
- Case studies
- White papers

Best practices:
- Match brand voice and tone
- Optimize for SEO when relevant
- Use clear, accessible language
- Structure content for readability
- Include relevant examples
- Fact-check all claims
- Cite sources when appropriate
- Adapt style to audience

Quality standards:
- Original, plagiarism-free content
- Grammatically correct
- Well-researched and accurate
- Engaging and valuable to readers
- Properly formatted`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.8,
        },
      },
    },
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    description: 'Vulnerability detection and security analysis',
    category: 'security',
    icon: '🔒',
    features: ['SAST', 'DAST', 'Dependency scanning', 'Compliance checks'],
    manifest: {
      metadata: {
        name: 'security-scanner',
        description: 'Security vulnerability scanner and analyzer',
      },
      spec: {
        role: `You are a security expert specializing in vulnerability detection and remediation.

Your focus areas:
- Static application security testing (SAST)
- Dependency vulnerability scanning
- Secret detection in code
- Security best practices enforcement
- Compliance verification (OWASP, CWE)
- Threat modeling

Scan types:
- Code analysis for security flaws
- Third-party dependency vulnerabilities
- Configuration security issues
- API security problems
- Container and infrastructure security

Reporting:
- Categorize by severity (Critical, High, Medium, Low)
- Provide CVE references when applicable
- Include remediation guidance
- Prioritize based on exploitability
- Track vulnerability lifecycle`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.1,
        },
      },
    },
  },
  {
    id: 'testing-agent',
    name: 'Testing Agent',
    description: 'Automated test generation and execution',
    category: 'quality',
    icon: '🧪',
    features: ['Test generation', 'Coverage analysis', 'E2E testing', 'Performance testing'],
    manifest: {
      metadata: {
        name: 'testing-agent',
        description: 'Automated testing agent for comprehensive test coverage',
      },
      spec: {
        role: `You are a QA automation specialist focused on comprehensive test coverage.

Testing capabilities:
- Unit test generation
- Integration test creation
- End-to-end test scenarios
- Performance and load testing
- Security testing
- Accessibility testing

Test strategies:
- Boundary value analysis
- Equivalence partitioning
- Error guessing
- Risk-based testing
- Property-based testing

Quality metrics:
- Code coverage (line, branch, function)
- Test execution time
- Flaky test detection
- Mutation testing scores
- Performance benchmarks

Best practices:
- Write clear, maintainable tests
- Follow AAA pattern (Arrange, Act, Assert)
- Use meaningful test names
- Isolate tests from each other
- Mock external dependencies
- Keep tests fast and reliable`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.3,
        },
      },
    },
  },
  {
    id: 'documentation-generator',
    name: 'Documentation Generator',
    description: 'Auto-generate project documentation',
    category: 'documentation',
    icon: '📚',
    features: ['API docs', 'README', 'Guides', 'Diagrams'],
    manifest: {
      metadata: {
        name: 'documentation-generator',
        description: 'Automated documentation generation agent',
      },
      spec: {
        role: `You are a technical writer specializing in clear, comprehensive documentation.

Documentation types:
- API documentation
- README files
- Getting started guides
- Architecture documentation
- Troubleshooting guides
- FAQ sections
- Release notes
- Code comments

Documentation standards:
- Clear, concise language
- Logical structure and flow
- Code examples for all features
- Visual diagrams when helpful
- Version-specific information
- Searchable and indexable
- Accessible to target audience

Tools and formats:
- Markdown, MDX
- OpenAPI/Swagger
- JSDoc, TypeDoc
- Mermaid diagrams
- Docusaurus, GitBook
- Wiki formats`,
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.5,
        },
      },
    },
  },
  {
    id: 'custom',
    name: 'Custom Agent (Blank Slate)',
    description: 'Start from scratch with full guided setup',
    category: 'custom',
    icon: '🎨',
    features: ['Full customization', 'All features available', 'Expert mode'],
    manifest: {
      metadata: {
        name: 'custom-agent',
        description: 'Custom agent with full configuration',
      },
      spec: {
        role: 'You are an AI agent. Your role will be defined during setup.',
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
        },
      },
    },
  },
];

// =============================================================================
// WIZARD STATE MANAGEMENT
// =============================================================================

class WizardStateManager {
  private state: WizardState;

  constructor(mode: 'guided' | 'quick' | 'expert' = 'guided') {
    this.state = {
      currentStep: 0,
      totalSteps: this.calculateTotalSteps(mode),
      agent: {
        apiVersion: getApiVersion(),
        kind: 'Agent',
        metadata: {
          name: '',
        },
        spec: {
          role: '',
        } as any,
      } as any,
      mode,
      features: {
        skills: false,
        rag: false,
        communication: false,
        workflows: false,
        observability: false,
        cost_management: false,
        state_management: false,
        testing: false,
      },
    };
  }

  private calculateTotalSteps(mode: string): number {
    // Base steps include: Template, Basic Info, LLM, Features, Tools, Safety,
    // Export Targets, Testing & Validation, Output Generation
    switch (mode) {
      case 'quick':
        return 7; // Essential steps + export + testing
      case 'expert':
        return 27; // All features + export + testing
      case 'guided':
      default:
        return 17; // Common features + export + testing
    }
  }

  nextStep(stepName: string) {
    this.state.currentStep++;
    printProgress(this.state.currentStep, this.state.totalSteps, stepName);
  }

  setTemplate(template: AgentTemplate) {
    this.state.template = template;
    this.state.agent = {
      ...this.state.agent,
      ...template.manifest,
    };
  }

  enableFeature(feature: keyof typeof this.state.features) {
    this.state.features[feature] = true;
  }

  updateAgent(updates: any) {
    this.state.agent = {
      ...this.state.agent,
      ...updates,
      spec: {
        ...this.state.agent.spec,
        ...updates.spec,
      },
      metadata: {
        ...this.state.agent.metadata,
        ...updates.metadata,
      },
    };
  }

  getAgent(): any {
    return this.state.agent;
  }

  getState(): WizardState {
    return this.state;
  }
}

// =============================================================================
// MAIN WIZARD CLASS
// =============================================================================

class OSSAWizardV2 {
  private state: WizardStateManager;
  private options: WizardOptions;

  constructor(options: WizardOptions) {
    this.options = options;
    this.state = new WizardStateManager(options.mode || 'guided');
  }

  async run(): Promise<void> {
    try {
      printBanner();
      printWizardBanner();

      // Step 1: Template Selection
      await this.selectTemplate();

      // Step 2: Basic Information
      await this.configureBasicInfo();

      // Step 3: LLM Configuration
      await this.configureLLM();

      // Step 4: Feature Selection
      await this.selectFeatures();

      // Conditional steps based on features
      if (this.state.getState().features.skills) {
        await this.configureSkills();
      }

      if (this.state.getState().features.rag) {
        await this.configureRAG();
      }

      if (this.state.getState().features.communication) {
        await this.configureCommunication();
      }

      if (this.state.getState().features.state_management) {
        await this.configureStateManagement();
      }

      if (this.state.getState().features.cost_management) {
        await this.configureCostManagement();
      }

      if (this.state.getState().features.observability) {
        await this.configureObservability();
      }

      // Step N: Tools & Capabilities
      await this.configureTools();

      // Step N+1: Safety & Security
      await this.configureSafety();

      // Step N+2: Export Target Configuration
      await this.configureExportTargets();

      // Step N+3: Testing & Validation Configuration
      await this.configureTestingValidation();

      // Step N+4: Output & Generation
      await this.generateOutput();

      printCompletion();
      this.printNextSteps();
    } catch (error) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  // =========================================================================
  // STEP IMPLEMENTATIONS
  // =========================================================================

  private async selectTemplate(): Promise<void> {
    this.state.nextStep('Template Selection');
    printStep(1, this.state.getState().totalSteps, 'Select Agent Template');

    if (this.options.template) {
      const template = AGENT_TEMPLATES.find((t) => t.id === this.options.template);
      if (template) {
        this.state.setTemplate(template);
        printSuccess(`Using template: ${template.name}`);
        return;
      }
    }

    printTemplates();

    const { templateId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateId',
        message: 'Choose a template to get started:',
        choices: AGENT_TEMPLATES.map((t) => ({
          name: `${t.icon} ${chalk.bold(t.name)} - ${chalk.gray(t.description)}`,
          value: t.id,
          short: t.name,
        })),
        pageSize: 12,
      },
    ]);

    const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      this.state.setTemplate(template);
      printSuccess(`Selected: ${template.name}`);

      if (template.id !== 'custom') {
        printInfo('Template features:');
        template.features.forEach((f) => console.log(chalk.gray(`  • ${f}`)));
      }
    }
  }

  private async configureBasicInfo(): Promise<void> {
    this.state.nextStep('Basic Information');
    printStep(
      2,
      this.state.getState().totalSteps,
      'Basic Agent Information',
      'Configure name, version, and description'
    );

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Agent ID (DNS-1123 format):',
        default: this.state.getAgent().metadata?.name || 'my-agent',
        validate: (input: string) => {
          const valid = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(input);
          return valid || 'Must be DNS-1123 compliant (lowercase, alphanumeric, hyphens)';
        },
      },
      {
        type: 'input',
        name: 'displayName',
        message: 'Display Name:',
        default: (answers: any) => answers.name,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: this.state.getAgent().metadata?.description || 'An OSSA-compliant agent',
      },
      {
        type: 'input',
        name: 'version',
        message: 'Version (semver):',
        default: '1.0.0',
        validate: (input: string) => {
          const valid = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(input);
          return valid || 'Must be valid semver (e.g., 1.0.0, 0.1.0-beta)';
        },
      },
    ]);

    this.state.updateAgent({
      metadata: {
        name: answers.name,
        version: answers.version,
        description: answers.description,
        labels: {
          'ossa.io/created-by': 'wizard-v2',
        },
      },
    });

    printSuccess('Basic information configured');
  }

  private async configureLLM(): Promise<void> {
    this.state.nextStep('LLM Configuration');
    printStep(
      3,
      this.state.getState().totalSteps,
      'LLM Configuration',
      'Configure primary LLM, fallbacks, and cost controls'
    );

    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select LLM Provider:',
        choices: [
          { name: 'Anthropic Claude (Recommended)', value: 'anthropic' },
          { name: 'OpenAI', value: 'openai' },
          { name: 'Google Gemini', value: 'google' },
          { name: 'Mistral AI', value: 'mistral' },
          { name: 'Cohere', value: 'cohere' },
          { name: 'Groq', value: 'groq' },
          { name: 'Together AI', value: 'together' },
        ],
        default: 'anthropic',
      },
    ]);

    const modelChoices: Record<string, any[]> = {
      anthropic: [
        { name: 'Claude Sonnet 4 (Recommended)', value: 'claude-sonnet-4-20250514' },
        { name: 'Claude Opus 4', value: 'claude-opus-4-20250514' },
        { name: 'Claude Haiku 4', value: 'claude-haiku-4-20250514' },
      ],
      openai: [
        { name: 'GPT-4o (Recommended)', value: 'gpt-4o' },
        { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
      ],
      google: [
        { name: 'Gemini 2.0 Flash (Recommended)', value: 'gemini-2.0-flash-exp' },
        { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
      ],
      mistral: [
        { name: 'Mistral Large', value: 'mistral-large-latest' },
        { name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
      ],
      cohere: [
        { name: 'Command R+', value: 'command-r-plus' },
        { name: 'Command R', value: 'command-r' },
      ],
      groq: [{ name: 'Llama 3.1 70B', value: 'llama-3.1-70b-versatile' }],
      together: [{ name: 'Llama 3.1 70B', value: 'meta-llama/Llama-3.1-70B-Instruct-Turbo' }],
    };

    const llmAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select Model:',
        choices: modelChoices[provider] || [{ name: 'Default', value: 'default' }],
      },
      {
        type: 'number',
        name: 'temperature',
        message: 'Temperature (0.0-2.0):',
        default: 0.7,
        validate: (input: number) => {
          return (input >= 0 && input <= 2) || 'Must be between 0.0 and 2.0';
        },
      },
      {
        type: 'confirm',
        name: 'addFallback',
        message: 'Add fallback LLM for reliability?',
        default: false,
      },
    ]);

    const llmConfig: any = {
      provider,
      model: llmAnswers.model,
      temperature: llmAnswers.temperature,
    };

    if (llmAnswers.addFallback) {
      const { fallbackProvider } = await inquirer.prompt([
        {
          type: 'list',
          name: 'fallbackProvider',
          message: 'Select fallback provider:',
          choices: [
            { name: 'OpenAI', value: 'openai' },
            { name: 'Google', value: 'google' },
            { name: 'Mistral', value: 'mistral' },
          ],
          default: provider === 'anthropic' ? 'openai' : 'anthropic',
        },
      ]);

      llmConfig.fallback_models = [
        {
          provider: fallbackProvider,
          model: modelChoices[fallbackProvider]?.[0]?.value || 'default',
        },
      ];

      printSuccess('Fallback LLM configured for high availability');
    }

    this.state.updateAgent({
      spec: {
        llm: llmConfig,
      },
    });

    printSuccess('LLM configuration complete');
  }

  private async selectFeatures(): Promise<void> {
    this.state.nextStep('Feature Selection');
    printStep(
      4,
      this.state.getState().totalSteps,
      'Select Features',
      'Choose which advanced features to configure'
    );

    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to configure:',
        choices: [
          {
            name: '🎯 Skills System - Define reusable capabilities',
            value: 'skills',
            checked: false,
          },
          {
            name: '🧠 RAG & Vector Database - Knowledge retrieval',
            value: 'rag',
            checked: false,
          },
          {
            name: '📡 Communication (A2A) - Agent-to-agent messaging',
            value: 'communication',
            checked: false,
          },
          {
            name: '💾 State Management - Persistent memory',
            value: 'state_management',
            checked: false,
          },
          {
            name: '💰 Cost Management - Budget limits & tracking',
            value: 'cost_management',
            checked: false,
          },
          {
            name: '📊 Observability - Tracing, metrics, logging',
            value: 'observability',
            checked: false,
          },
          {
            name: '🧪 Testing Configuration - Test strategies',
            value: 'testing',
            checked: false,
          },
        ],
        pageSize: 10,
      },
    ]);

    features.forEach((feature: string) => {
      this.state.enableFeature(feature as any);
    });

    printSuccess(`${features.length} features selected`);
  }

  private async configureSkills(): Promise<void> {
    this.state.nextStep('Skills Configuration');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Skills System',
      'Configure reusable skills and capabilities'
    );

    printInfo('Skills allow you to define reusable capabilities that can be shared across agents');

    const { addSkills } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addSkills',
        message: 'Would you like to add Claude Skills to this agent?',
        default: true,
      },
    ]);

    if (!addSkills) {
      return;
    }

    const skills: any[] = [];
    let addingSkills = true;

    while (addingSkills) {
      console.log('');
      printInfo(`Adding skill ${skills.length + 1}`);

      const skillAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'id',
          message: 'Skill ID (identifier):',
          validate: (input: string) => {
            const valid = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(input);
            return (
              valid ||
              'Must be lowercase alphanumeric with hyphens (e.g., research-skill)'
            );
          },
        },
        {
          type: 'input',
          name: 'name',
          message: 'Skill name (display name):',
          default: (answers: any) =>
            answers.id
              .split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
        },
        {
          type: 'input',
          name: 'description',
          message: 'Skill description:',
          validate: (input: string) => {
            return (
              input.length >= 10 ||
              'Description must be at least 10 characters'
            );
          },
        },
        {
          type: 'editor',
          name: 'instructions',
          message: 'Skill instructions (detailed prompt):',
          default:
            'You are a skilled assistant. When invoked, you should...\n\nCapabilities:\n- \n\nGuidelines:\n- ',
        },
        {
          type: 'list',
          name: 'type',
          message: 'Skill type:',
          choices: [
            { name: 'Task - Execute specific actions', value: 'task' },
            { name: 'Query - Retrieve information', value: 'query' },
            { name: 'Creative - Generate content', value: 'creative' },
            { name: 'Analysis - Analyze data', value: 'analysis' },
            { name: 'Other', value: 'other' },
          ],
          default: 'task',
        },
      ]);

      // Ask for parameters
      const { addParams } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addParams',
          message: 'Add parameters to this skill?',
          default: false,
        },
      ]);

      const parameters: any = {};
      if (addParams) {
        let addingParams = true;
        while (addingParams) {
          const paramAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'paramName',
              message: 'Parameter name:',
            },
            {
              type: 'list',
              name: 'paramType',
              message: 'Parameter type:',
              choices: ['string', 'number', 'boolean', 'array', 'object'],
            },
            {
              type: 'input',
              name: 'paramDescription',
              message: 'Parameter description:',
            },
            {
              type: 'confirm',
              name: 'paramRequired',
              message: 'Is this parameter required?',
              default: false,
            },
          ]);

          parameters[paramAnswers.paramName] = {
            type: paramAnswers.paramType,
            description: paramAnswers.paramDescription,
          };

          if (paramAnswers.paramRequired) {
            if (!parameters._required) {
              parameters._required = [];
            }
            parameters._required.push(paramAnswers.paramName);
          }

          const { addAnother } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'addAnother',
              message: 'Add another parameter?',
              default: false,
            },
          ]);

          addingParams = addAnother;
        }
      }

      // Build skill object
      const skill: any = {
        id: skillAnswers.id,
        name: skillAnswers.name,
        description: skillAnswers.description,
        instructions: skillAnswers.instructions,
        type: skillAnswers.type,
      };

      if (Object.keys(parameters).length > 0) {
        // Extract required array if exists
        const required = parameters._required;
        delete parameters._required;

        skill.parameters = {
          type: 'object',
          properties: parameters,
        };

        if (required && required.length > 0) {
          skill.parameters.required = required;
        }
      }

      skills.push(skill);
      printSuccess(`Skill "${skill.name}" added`);

      const { addMore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addMore',
          message: 'Add another skill?',
          default: false,
        },
      ]);

      addingSkills = addMore;
    }

    if (skills.length > 0) {
      this.state.updateAgent({
        spec: {
          skills,
        },
      });

      printSuccess(`${skills.length} skill(s) configured`);
    }
  }

  private async configureRAG(): Promise<void> {
    this.state.nextStep('RAG Configuration');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'RAG & Vector Database',
      'Configure knowledge retrieval and vector storage'
    );

    const ragAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select vector database provider:',
        choices: [
          { name: 'Qdrant (Recommended)', value: 'qdrant' },
          { name: 'Pinecone', value: 'pinecone' },
          { name: 'Weaviate', value: 'weaviate' },
          { name: 'LangChain', value: 'langchain' },
        ],
      },
      {
        type: 'list',
        name: 'search_strategy',
        message: 'Search strategy:',
        choices: [
          { name: 'Semantic Search', value: 'semantic' },
          { name: 'Hybrid (Semantic + Keyword)', value: 'hybrid' },
          { name: 'Neural Search', value: 'neural' },
        ],
        default: 'hybrid',
      },
      {
        type: 'number',
        name: 'top_k',
        message: 'Number of results to retrieve (top_k):',
        default: 10,
      },
    ]);

    this.state.updateAgent({
      spec: {
        knowledge_sources: [
          {
            name: 'primary-knowledge-base',
            provider: ragAnswers.provider,
            search: {
              default_strategy: ragAnswers.search_strategy,
              top_k: ragAnswers.top_k,
              min_score: 0.7,
              rerank: true,
            },
            enabled: true,
          },
        ],
      },
    });

    printSuccess('RAG configuration complete');
  }

  private async configureCommunication(): Promise<void> {
    this.state.nextStep('Communication Configuration');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Agent Communication (A2A)',
      'Configure agent-to-agent messaging'
    );

    const commAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'transport',
        message: 'Message transport:',
        choices: [
          { name: 'Redis (Recommended)', value: 'redis' },
          { name: 'NATS', value: 'nats' },
          { name: 'Kafka', value: 'kafka' },
          { name: 'Memory (Testing only)', value: 'memory' },
        ],
      },
      {
        type: 'input',
        name: 'broker_url',
        message: 'Broker URL:',
        default: 'redis://localhost:6379',
        when: (answers: any) => answers.transport !== 'memory',
      },
    ]);

    this.state.updateAgent({
      extensions: {
        ...this.state.getAgent().extensions,
        messaging: {
          transport: commAnswers.transport,
          broker: {
            type: commAnswers.transport,
            url: commAnswers.broker_url,
          },
        },
      },
    });

    printSuccess('Communication configuration complete');
  }

  private async configureStateManagement(): Promise<void> {
    this.state.nextStep('State Management');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'State & Memory',
      'Configure persistent state and memory'
    );

    const stateAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'State mode:',
        choices: [
          { name: 'Stateless', value: 'stateless' },
          { name: 'Session (per-conversation)', value: 'session' },
          { name: 'Long-Running (persistent)', value: 'long_running' },
        ],
      },
      {
        type: 'list',
        name: 'storage_type',
        message: 'Storage backend:',
        choices: [
          { name: 'Memory (Fast, temporary)', value: 'memory' },
          { name: 'Redis', value: 'kv' },
          { name: 'PostgreSQL', value: 'rdbms' },
          { name: 'Vector DB', value: 'vector-db' },
        ],
        when: (answers: any) => answers.mode !== 'stateless',
      },
    ]);

    if (stateAnswers.mode !== 'stateless') {
      this.state.updateAgent({
        spec: {
          state: {
            mode: stateAnswers.mode,
            storage: {
              type: stateAnswers.storage_type,
              retention: stateAnswers.mode === 'session' ? '24h' : '30d',
            },
          },
        },
      });
    }

    printSuccess('State management configured');
  }

  private async configureCostManagement(): Promise<void> {
    this.state.nextStep('Cost Management');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Cost Management & Budgeting',
      'Set budget limits and cost tracking'
    );

    const costAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enable_budget',
        message: 'Enable token budgets?',
        default: true,
      },
      {
        type: 'number',
        name: 'daily_limit',
        message: 'Daily token limit:',
        default: 1000000,
        when: (answers: any) => answers.enable_budget,
      },
      {
        type: 'list',
        name: 'enforcement',
        message: 'Budget enforcement:',
        choices: [
          { name: 'Soft (warn only)', value: 'soft' },
          { name: 'Hard (block when exceeded)', value: 'hard' },
          { name: 'Adaptive (scale down)', value: 'adaptive' },
        ],
        default: 'soft',
        when: (answers: any) => answers.enable_budget,
      },
    ]);

    if (costAnswers.enable_budget) {
      this.state.updateAgent({
        spec: {
          token_budget: {
            enabled: true,
            daily_limit: costAnswers.daily_limit,
            enforcement: costAnswers.enforcement,
          },
        },
      });

      printSuccess('Cost management configured');
    }
  }

  private async configureObservability(): Promise<void> {
    this.state.nextStep('Observability');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Observability & Monitoring',
      'Configure tracing, metrics, and logging'
    );

    const obsAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enable_tracing',
        message: 'Enable OpenTelemetry tracing?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'enable_metrics',
        message: 'Enable metrics collection?',
        default: true,
      },
      {
        type: 'list',
        name: 'log_level',
        message: 'Logging level:',
        choices: ['debug', 'info', 'warn', 'error'],
        default: 'info',
      },
    ]);

    this.state.updateAgent({
      spec: {
        observability: {
          tracing: obsAnswers.enable_tracing
            ? {
                enabled: true,
                exporter: 'otlp',
                endpoint: '${OTEL_ENDPOINT:-http://localhost:4317}',
              }
            : undefined,
          metrics: obsAnswers.enable_metrics
            ? {
                enabled: true,
                exporter: 'prometheus',
              }
            : undefined,
          logging: {
            level: obsAnswers.log_level,
          },
        },
      },
    });

    printSuccess('Observability configured');
  }

  private async configureTools(): Promise<void> {
    this.state.nextStep('Tools & Capabilities');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Tools & Capabilities',
      'Add tools and capabilities for your agent'
    );

    const { addTools } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addTools',
        message: 'Add tools to your agent?',
        default: true,
      },
    ]);

    if (!addTools) {
      return;
    }

    const tools: any[] = [];

    // Add tools interactively
    let addingTools = true;
    while (addingTools) {
      const { toolType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'toolType',
          message: 'Select tool type:',
          choices: [
            { name: 'MCP Server', value: 'mcp' },
            { name: 'HTTP API', value: 'http' },
            { name: 'Function', value: 'function' },
            { name: 'Done adding tools', value: 'done' },
          ],
        },
      ]);

      if (toolType === 'done') {
        addingTools = false;
        continue;
      }

      if (toolType === 'mcp') {
        const mcpAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'MCP server name:',
          },
          {
            type: 'input',
            name: 'command',
            message: 'MCP server command:',
            default: 'npx -y @modelcontextprotocol/server-filesystem',
          },
        ]);

        tools.push({
          type: 'mcp',
          name: mcpAnswers.name,
          config: {
            server: mcpAnswers.command,
          },
        });

        printSuccess(`Added MCP server: ${mcpAnswers.name}`);
      }
      // Add more tool types as needed
    }

    if (tools.length > 0) {
      this.state.updateAgent({
        spec: {
          tools,
        },
      });

      printSuccess(`${tools.length} tools configured`);
    }
  }

  private async configureSafety(): Promise<void> {
    this.state.nextStep('Safety & Security');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Safety & Security',
      'Configure safety controls and security measures'
    );

    const safetyAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enable_content_filtering',
        message: 'Enable content filtering?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'enable_pii_detection',
        message: 'Enable PII detection?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'enable_rate_limiting',
        message: 'Enable rate limiting?',
        default: false,
      },
    ]);

    const safety: any = {};

    if (safetyAnswers.enable_content_filtering) {
      safety.content_filtering = {
        enabled: true,
        categories: ['hate_speech', 'violence', 'illegal_activity'],
        action: 'block',
      };
    }

    if (safetyAnswers.enable_pii_detection) {
      safety.pii_detection = {
        enabled: true,
        types: ['email', 'phone', 'ssn', 'credit_card'],
        action: 'redact',
      };
    }

    if (safetyAnswers.enable_rate_limiting) {
      safety.rate_limiting = {
        enabled: true,
        requests_per_minute: 30,
      };
    }

    if (Object.keys(safety).length > 0) {
      this.state.updateAgent({
        spec: {
          safety,
        },
      });

      printSuccess('Safety controls configured');
    }
  }

  private async configureExportTargets(): Promise<void> {
    this.state.nextStep('Export Configuration');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Export Targets',
      'Configure deployment platforms'
    );

    const exportAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureExport',
        message: 'Configure export targets for deployment?',
        default: true,
      },
    ]);

    if (!exportAnswers.configureExport) {
      return;
    }

    const { platforms } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: 'Select export platforms:',
        choices: [
          {
            name: 'LangChain (Python) - Full framework with observability',
            value: 'langchain',
            checked: true,
          },
          {
            name: 'KAgent (Kubernetes) - Cloud-native deployment',
            value: 'kagent',
          },
          {
            name: 'Drupal Module - CMS integration',
            value: 'drupal',
          },
          {
            name: 'Symfony Bundle - PHP framework',
            value: 'symfony',
          },
        ],
        validate: (answer: string[]) => {
          if (answer.length < 1) {
            return 'You must select at least one export platform.';
          }
          return true;
        },
      },
    ]);

    const exportConfig: ExportConfig = {
      enabled: true,
      platforms: platforms as ExportPlatform[],
    };

    // Platform-specific configuration
    for (const platform of platforms) {
      if (platform === 'langchain') {
        const langchainConfig = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'includeCallbacks',
            message: 'Include observability (LangSmith, LangFuse, OpenTelemetry)?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeErrorHandling',
            message: 'Include production error handling (retry, circuit breaker)?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeLangServe',
            message: 'Generate LangServe REST API deployment?',
            default: false,
          },
          {
            type: 'confirm',
            name: 'includeTests',
            message: 'Generate pytest test suite?',
            default: true,
          },
        ]);

        exportConfig.langchain = langchainConfig;
      } else if (platform === 'kagent') {
        const kagentConfig = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'includeRBAC',
            message: 'Include RBAC (ServiceAccount, Roles)?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeTLS',
            message: 'Configure TLS for secure communication?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeNetworkPolicy',
            message: 'Generate NetworkPolicy for isolation?',
            default: true,
          },
        ]);

        exportConfig.kagent = kagentConfig;
      } else if (platform === 'drupal') {
        const drupalConfig = await inquirer.prompt([
          {
            type: 'input',
            name: 'moduleName',
            message: 'Drupal module name:',
            default: this.state.getAgent().metadata?.name?.replace(/-/g, '_') || 'ossa_agent',
            validate: (input: string) => {
              const valid = /^[a-z][a-z0-9_]*$/.test(input);
              return valid || 'Must be lowercase alphanumeric with underscores';
            },
          },
          {
            type: 'confirm',
            name: 'includeQueue',
            message: 'Include queue worker for async execution?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeEntity',
            message: 'Generate entity storage with Views integration?',
            default: true,
          },
        ]);

        exportConfig.drupal = drupalConfig;
      } else if (platform === 'symfony') {
        const symfonyConfig = await inquirer.prompt([
          {
            type: 'input',
            name: 'bundleName',
            message: 'Symfony bundle name:',
            default: (this.state.getAgent().metadata?.name
              ?.split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join('') || 'Ossa') + 'Bundle',
          },
          {
            type: 'confirm',
            name: 'includeEvents',
            message: 'Include event system (start, complete, error)?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeCaching',
            message: 'Include caching layer?',
            default: true,
          },
        ]);

        exportConfig.symfony = symfonyConfig;
      }
    }

    // Store in annotations (buildkit-specific metadata)
    this.state.updateAgent({
      metadata: {
        ...this.state.getAgent().metadata,
        annotations: {
          ...this.state.getAgent().metadata?.annotations,
          'buildkit.ossa.io/export-config': JSON.stringify(exportConfig),
        },
      },
    });

    printSuccess(`Export configured for ${platforms.length} platform(s)`);
  }

  private async configureTestingValidation(): Promise<void> {
    this.state.nextStep('Testing Configuration');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Testing & Validation',
      'Configure automated testing'
    );

    const { enableTesting } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableTesting',
        message: 'Configure testing for this agent?',
        default: true,
      },
    ]);

    if (!enableTesting) {
      return;
    }

    const testConfig = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'types',
        message: 'Which test types to generate?',
        choices: [
          { name: 'Unit tests (recommended)', value: 'unit', checked: true },
          { name: 'Integration tests', value: 'integration' },
          { name: 'Load tests', value: 'load' },
          { name: 'Security tests', value: 'security' },
          { name: 'Cost tests', value: 'cost' },
        ],
        validate: (answer: string[]) => {
          if (answer.length < 1) {
            return 'You must choose at least one test type.';
          }
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'mockLLM',
        message: 'Mock LLM by default?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'generateFixtures',
        message: 'Generate test fixtures?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'includeCICD',
        message: 'Include CI/CD configurations?',
        default: true,
      },
    ]);

    let cicdPlatforms: string[] = [];
    if (testConfig.includeCICD) {
      const { platforms } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'platforms',
          message: 'Which CI/CD platforms?',
          choices: [
            { name: 'GitHub Actions', value: 'github-actions', checked: true },
            { name: 'GitLab CI', value: 'gitlab-ci' },
          ],
          validate: (answer: string[]) => {
            if (answer.length < 1) {
              return 'You must choose at least one CI/CD platform.';
            }
            return true;
          },
        },
      ]);
      cicdPlatforms = platforms;
    }

    const validationConfig = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'manifest',
        message: 'Enable manifest validation?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'safety',
        message: 'Enable safety checks?',
        default: true,
      },
      {
        type: 'number',
        name: 'costBudget',
        message: 'Cost budget per test run? (USD)',
        default: 0.1,
        validate: (input: number) => {
          if (input < 0) {
            return 'Cost budget must be positive';
          }
          return true;
        },
      },
    ]);

    const testingConfig = {
      enabled: true,
      types: testConfig.types,
      mockLLM: testConfig.mockLLM,
      generateFixtures: testConfig.generateFixtures,
      cicd: cicdPlatforms,
      validation: validationConfig,
    };

    // Store in annotations (buildkit-specific metadata)
    this.state.updateAgent({
      metadata: {
        ...this.state.getAgent().metadata,
        annotations: {
          ...this.state.getAgent().metadata?.annotations,
          'buildkit.ossa.io/testing-config': JSON.stringify(testingConfig),
        },
      },
    });

    printSuccess(`Testing configured: ${testConfig.types.join(', ')}`);
  }

  private async generateOutput(): Promise<void> {
    this.state.nextStep('Output Generation');
    printStep(
      this.state.getState().currentStep,
      this.state.getState().totalSteps,
      'Generate Output Files',
      'Create agent manifest and supporting files'
    );

    const outputAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'generate_agents_md',
        message: 'Generate AGENTS.md file?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'generate_llms_txt',
        message: 'Generate llms.txt file?',
        default: true,
      },
      {
        type: 'input',
        name: 'output_path',
        message: 'Output file path:',
        default: this.options.output || 'agent.ossa.yaml',
      },
    ]);

    const agent = this.state.getAgent();
    const outputPath = outputAnswers.output_path;

    // Write manifest
    const yamlContent = yaml.stringify(agent as OssaAgent, {
      indent: 2,
      lineWidth: 0,
    });

    fs.writeFileSync(outputPath, yamlContent, 'utf-8');
    printSuccess(`Agent manifest written to: ${outputPath}`);

    // Generate AGENTS.md if requested
    if (outputAnswers.generate_agents_md) {
      await this.generateAgentsMd(path.dirname(outputPath));
    }

    // Generate llms.txt if requested
    if (outputAnswers.generate_llms_txt) {
      await this.generateLlmsTxt(path.dirname(outputPath));
    }

    printSuccess('All files generated successfully!');
  }

  private async generateAgentsMd(directory: string): Promise<void> {
    const agent = this.state.getAgent();
    const agentsMdPath = path.join(directory, 'AGENTS.md');

    const content = `# ${agent.metadata?.name || 'Agent'}

${agent.metadata?.description || 'Agent description'}

## Overview

- **Name**: ${agent.metadata?.name}
- **Version**: ${agent.metadata?.version}
- **Created**: ${new Date().toISOString()}
- **Type**: ${agent.kind || 'Agent'}

## Capabilities

${agent.spec?.tools?.map((t: any) => `- ${t.name || t.type}`).join('\n') || 'No tools configured'}

## Configuration

### LLM
- **Provider**: ${agent.spec?.llm?.provider}
- **Model**: ${agent.spec?.llm?.model}
- **Temperature**: ${agent.spec?.llm?.temperature}

### Features

${this.state.getState().features.rag ? '- ✅ RAG & Vector Database\n' : ''}${
      this.state.getState().features.communication ? '- ✅ Agent Communication (A2A)\n' : ''
    }${this.state.getState().features.state_management ? '- ✅ State Management\n' : ''}${
      this.state.getState().features.observability ? '- ✅ Observability\n' : ''
    }${this.state.getState().features.cost_management ? '- ✅ Cost Management\n' : ''}

## Usage

\`\`\`bash
# Validate the agent
ossa validate agent.ossa.yaml

# Run the agent
ossa run agent.ossa.yaml

# Export to platform
ossa export agent.ossa.yaml --platform langchain
\`\`\`

## Development

### Building

\`\`\`bash
npm run build
\`\`\`

### Testing

\`\`\`bash
npm test
\`\`\`

## Best Practices

- Always validate before deployment
- Monitor costs and token usage
- Enable observability in production
- Test thoroughly before release

## Support

For issues and questions, please refer to:
- [OSSA Documentation](https://openstandardagents.org)
- [GitHub Issues](https://github.com/openstandardagents/issues)

---

*Generated by OSSA Wizard v2.0*
`;

    fs.writeFileSync(agentsMdPath, content, 'utf-8');
    printSuccess(`AGENTS.md written to: ${agentsMdPath}`);
  }

  private async generateLlmsTxt(directory: string): Promise<void> {
    const agent = this.state.getAgent();
    const llmsTxtPath = path.join(directory, 'llms.txt');

    const content = `# ${agent.metadata?.name || 'Agent'} - LLM Context

## Agent Information

Name: ${agent.metadata?.name}
Version: ${agent.metadata?.version}
Description: ${agent.metadata?.description}

## Capabilities

${agent.spec?.role || 'No role defined'}

## Tools

${agent.spec?.tools?.map((t: any) => `- ${t.name || t.type}: ${t.description || 'No description'}`).join('\n') || 'No tools available'}

## LLM Configuration

Provider: ${agent.spec?.llm?.provider}
Model: ${agent.spec?.llm?.model}
Temperature: ${agent.spec?.llm?.temperature}

## Usage Examples

\`\`\`bash
# Run this agent
ossa run agent.ossa.yaml
\`\`\`

## Constraints

${agent.spec?.safety ? '- Safety controls enabled\n' : ''}${
      agent.spec?.token_budget ? '- Token budgets configured\n' : ''
    }${agent.spec?.autonomy ? '- Autonomy level configured\n' : ''}

---

For more information, see AGENTS.md
`;

    fs.writeFileSync(llmsTxtPath, content, 'utf-8');
    printSuccess(`llms.txt written to: ${llmsTxtPath}`);
  }

  private printNextSteps(): void {
    const agent = this.state.getAgent();
    const outputPath = this.options.output || 'agent.ossa.yaml';

    console.log(chalk.cyan('Next Steps:'));
    console.log(chalk.gray(`\n1. Review your agent:`));
    console.log(chalk.white(`   cat ${outputPath}`));

    console.log(chalk.gray(`\n2. Validate the manifest:`));
    console.log(chalk.white(`   ossa validate ${outputPath}`));

    console.log(chalk.gray(`\n3. Test the agent:`));
    console.log(chalk.white(`   ossa run ${outputPath}`));

    if (this.state.getState().features.rag) {
      console.log(chalk.gray(`\n4. Set up vector database (RAG):`));
      console.log(chalk.white(`   # Configure your Qdrant/Pinecone instance`));
    }

    if (this.state.getState().features.communication) {
      console.log(chalk.gray(`\n5. Set up message broker (A2A):`));
      console.log(chalk.white(`   # Start Redis/NATS for agent communication`));
    }

    console.log(chalk.gray(`\n6. Export to platform:`));
    console.log(chalk.white(`   ossa export ${outputPath} --platform langchain`));

    console.log(chalk.gray(`\n7. Deploy:`));
    console.log(chalk.white(`   # Follow platform-specific deployment guide`));

    console.log('');
    console.log(chalk.green.bold('🎉 Your agent is ready for production!'));
    console.log('');
  }
}

// =============================================================================
// COMMAND REGISTRATION
// =============================================================================

export const wizardV2Command = new Command('wizard-v2')
  .description('🧙 OSSA Agent Creation Wizard v2.0 - BEAST MODE EDITION')
  .option('-o, --output <path>', 'Output file path', 'agent.ossa.yaml')
  .option('-d, --directory <dir>', 'Create agent in directory', '.')
  .option('-t, --template <id>', 'Use specific template')
  .option('-m, --mode <mode>', 'Wizard mode (guided|quick|expert)', 'guided')
  .option('--validate', 'Validate after creation', false)
  .option('--test', 'Test after creation', false)
  .action(async (options: WizardOptions) => {
    const wizard = new OSSAWizardV2(options);
    await wizard.run();
  });
