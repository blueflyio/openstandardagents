/**
 * Export Command Integration Tests
 * Tests export to all 11 supported platforms and documents folder structures
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('ossa export command', () => {
  let tempDir: string;
  let testManifestPath: string;
  const cwd = path.resolve(__dirname, '../../..');

  // Test manifest for all exports
  const testManifest = `
apiVersion: ossa/v0.4.4
kind: Agent
metadata:
  name: test-export-agent
  version: 1.0.0
  description: Test agent for export validation
  annotations:
    ossa.org/gaid: did:ossa:blueflyio:test123
spec:
  role: You are a test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
    temperature: 0.7
  autonomy:
    level: supervised
    approvalRequired:
      - critical-actions
    maxTurns: 10
  tools:
    - name: test-tool
      description: A test tool
      input_schema:
        type: object
        properties:
          query:
            type: string
`;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-export-test-'));
    testManifestPath = path.join(tempDir, 'test-agent.ossa.yaml');
    fs.writeFileSync(testManifestPath, testManifest);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Platform Export Tests', () => {
    describe('KAgent Export (Kubernetes CRD)', () => {
      it('should export to kagent format', () => {
        const outputPath = path.join(tempDir, 'kagent-output.yaml');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform kagent --output ${outputPath} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe' }
          );

          expect(fs.existsSync(outputPath)).toBe(true);
          const content = fs.readFileSync(outputPath, 'utf-8');
          const parsed = JSON.parse(content);

          // Verify KAgent CRD structure
          expect(parsed.apiVersion).toBe('ossa.bluefly.io/v1');
          expect(parsed.kind).toBe('Agent');
          expect(parsed.metadata.name).toBe('test-export-agent');
          expect(parsed.spec).toBeDefined();
        } catch (error: any) {
          console.error('KAgent export error:', error.message);
          throw error;
        }
      });

      it('should document kagent output structure', () => {
        /**
         * KAGENT EXPORT OUTPUT STRUCTURE:
         *
         * Single file: test-export-agent.yaml
         *
         * Content: Kubernetes CRD (Custom Resource Definition)
         * - apiVersion: ossa.bluefly.io/v1
         * - kind: Agent
         * - metadata: (name, namespace, labels, annotations)
         * - spec: (complete OSSA v0.4 spec)
         *
         * Used for: Kubernetes agent deployments
         */
        expect(true).toBe(true); // Documentation marker
      });
    });

    describe('LangChain Export (Python Package)', () => {
      it('should export to langchain python format', () => {
        const outputDir = path.join(tempDir, 'langchain-test-export-agent');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform langchain --format python --output ${outputDir} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 }
          );

          // Verify directory structure
          expect(fs.existsSync(outputDir)).toBe(true);
          expect(fs.existsSync(path.join(outputDir, 'pyproject.toml'))).toBe(
            true
          );
          expect(fs.existsSync(path.join(outputDir, 'src'))).toBe(true);
        } catch (error: any) {
          console.error('LangChain export error:', error.message);
          throw error;
        }
      });

      it('should document langchain output structure', () => {
        /**
         * LANGCHAIN EXPORT OUTPUT STRUCTURE:
         *
         * Directory: langchain-{agent-name}/
         *
         * Files:
         * ├── pyproject.toml                  # Python project config
         * ├── README.md                       # Usage documentation
         * ├── .env.example                    # Environment variables
         * ├── Dockerfile                      # Docker deployment
         * ├── docker-compose.yml              # Local development
         * ├── requirements.txt                # Python dependencies
         * ├── src/
         * │   ├── __init__.py
         * │   ├── agent.py                    # Main agent class
         * │   ├── tools.py                    # LangChain @tool functions
         * │   ├── memory.py                   # Memory/state management
         * │   ├── callbacks.py                # Callback handlers
         * │   ├── streaming.py                # Streaming support
         * │   └── error_handling.py           # Error handling
         * ├── api/
         * │   ├── __init__.py
         * │   ├── server.py                   # FastAPI server
         * │   └── openapi.yaml                # OpenAPI spec
         * └── tests/
         *     ├── __init__.py
         *     └── test_agent.py               # Unit tests
         *
         * Used for: LangChain Python applications
         */
        expect(true).toBe(true);
      });
    });

    describe('CrewAI Export', () => {
      it('should export to crewai python format', () => {
        const outputPath = path.join(tempDir, 'crewai-agent.py');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform crewai --format python --output ${outputPath} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe' }
          );

          expect(fs.existsSync(outputPath)).toBe(true);
          const content = fs.readFileSync(outputPath, 'utf-8');
          expect(content).toContain('from crewai');
        } catch (error: any) {
          console.error('CrewAI export error:', error.message);
          throw error;
        }
      });

      it('should document crewai output structure', () => {
        /**
         * CREWAI EXPORT OUTPUT STRUCTURE:
         *
         * Single file: {agent-name}.py
         *
         * Content: CrewAI Agent class
         * - Agent definition with role, goal, backstory
         * - Tools configuration
         * - LLM configuration
         * - Task definitions
         *
         * Used for: CrewAI multi-agent systems
         */
        expect(true).toBe(true);
      });
    });

    describe('Temporal Export', () => {
      it('should export to temporal typescript format', () => {
        const outputPath = path.join(tempDir, 'temporal-workflow.ts');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform temporal --format typescript --output ${outputPath} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe' }
          );

          expect(fs.existsSync(outputPath)).toBe(true);
          const content = fs.readFileSync(outputPath, 'utf-8');
          expect(content).toContain('@temporalio/workflow');
        } catch (error: any) {
          console.error('Temporal export error:', error.message);
          throw error;
        }
      });

      it('should document temporal output structure', () => {
        /**
         * TEMPORAL EXPORT OUTPUT STRUCTURE:
         *
         * Single file: {agent-name}-workflow.ts
         *
         * Content: Temporal Workflow definition
         * - Workflow function
         * - Activity definitions
         * - Signal handlers
         * - Query handlers
         *
         * Used for: Temporal workflow orchestration
         */
        expect(true).toBe(true);
      });
    });

    describe('N8N Export', () => {
      it('should export to n8n json format', () => {
        const outputPath = path.join(tempDir, 'n8n-workflow.json');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform n8n --output ${outputPath} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe' }
          );

          expect(fs.existsSync(outputPath)).toBe(true);
          const content = fs.readFileSync(outputPath, 'utf-8');
          const parsed = JSON.parse(content);
          expect(parsed.nodes).toBeDefined();
        } catch (error: any) {
          console.error('N8N export error:', error.message);
          throw error;
        }
      });

      it('should document n8n output structure', () => {
        /**
         * N8N EXPORT OUTPUT STRUCTURE:
         *
         * Single file: {agent-name}-workflow.json
         *
         * Content: N8N Workflow JSON
         * - nodes: Array of workflow nodes
         * - connections: Node connections
         * - settings: Workflow settings
         * - staticData: Persistent data
         *
         * Used for: N8N workflow automation
         */
        expect(true).toBe(true);
      });
    });

    describe('GitLab CI Export', () => {
      it('should export to gitlab ci yaml format', () => {
        const outputPath = path.join(tempDir, '.gitlab-ci.yml');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform gitlab --output ${outputPath} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe' }
          );

          expect(fs.existsSync(outputPath)).toBe(true);
          const content = fs.readFileSync(outputPath, 'utf-8');
          expect(content).toContain('stages:');
        } catch (error: any) {
          console.error('GitLab CI export error:', error.message);
          throw error;
        }
      });

      it('should document gitlab output structure', () => {
        /**
         * GITLAB EXPORT OUTPUT STRUCTURE:
         *
         * Single file: .gitlab-ci.yml
         *
         * Content: GitLab CI/CD pipeline
         * - stages: Pipeline stages
         * - jobs: Job definitions
         * - rules: When to run
         * - artifacts: Build outputs
         *
         * Used for: GitLab CI/CD automation
         */
        expect(true).toBe(true);
      });
    });

    describe('GitLab Agent Export (Full Package)', () => {
      it('should export to gitlab-agent package', () => {
        const outputDir = path.join(tempDir, 'gitlab-agent-test-export-agent');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform gitlab-agent --output ${outputDir} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 }
          );

          // Verify directory structure
          expect(fs.existsSync(outputDir)).toBe(true);
          expect(fs.existsSync(path.join(outputDir, 'package.json'))).toBe(
            true
          );
          expect(fs.existsSync(path.join(outputDir, 'src'))).toBe(true);
        } catch (error: any) {
          console.error('GitLab Agent export error:', error.message);
          throw error;
        }
      });

      it('should document gitlab-agent output structure', () => {
        /**
         * GITLAB-AGENT EXPORT OUTPUT STRUCTURE:
         *
         * Directory: {agent-name}/
         *
         * Files:
         * ├── package.json                    # NPM package config
         * ├── tsconfig.json                   # TypeScript config
         * ├── README.md                       # Documentation
         * ├── .env.example                    # Environment variables
         * ├── Dockerfile                      # Docker deployment
         * ├── .gitlab-ci.yml                  # CI/CD pipeline
         * ├── src/
         * │   ├── index.ts                    # Entry point
         * │   ├── agent.ts                    # Agent class
         * │   ├── webhook-handler.ts          # GitLab webhook handler
         * │   ├── llm-client.ts               # LLM integration
         * │   └── tools/
         * │       └── *.ts                    # Tool implementations
         * └── webhook-config.json             # Webhook configuration
         *
         * Used for: GitLab CI/CD agent automation with webhooks
         */
        expect(true).toBe(true);
      });
    });

    describe('Docker Export', () => {
      it('should export to docker format', () => {
        const outputPath = path.join(tempDir, 'Dockerfile');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform docker --output ${outputPath} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe' }
          );

          expect(fs.existsSync(outputPath)).toBe(true);
          const content = fs.readFileSync(outputPath, 'utf-8');
          expect(content).toContain('FROM');
        } catch (error: any) {
          console.error('Docker export error:', error.message);
          throw error;
        }
      });

      it('should document docker output structure', () => {
        /**
         * DOCKER EXPORT OUTPUT STRUCTURE:
         *
         * Single file: Dockerfile
         *
         * Content: Multi-stage Docker build
         * - Base image selection
         * - Dependency installation
         * - Application copy
         * - Runtime configuration
         * - Health checks
         * - Entry point
         *
         * Used for: Docker containerization
         */
        expect(true).toBe(true);
      });
    });

    describe('Kubernetes Export', () => {
      it('should export to kubernetes format', () => {
        const outputPath = path.join(tempDir, 'k8s-manifests.json');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform kubernetes --output ${outputPath} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe' }
          );

          expect(fs.existsSync(outputPath)).toBe(true);
          const content = fs.readFileSync(outputPath, 'utf-8');
          const parsed = JSON.parse(content);
          expect(parsed.deployment).toBeDefined();
        } catch (error: any) {
          console.error('Kubernetes export error:', error.message);
          throw error;
        }
      });

      it('should document kubernetes output structure', () => {
        /**
         * KUBERNETES EXPORT OUTPUT STRUCTURE:
         *
         * Single file: k8s-manifests.json
         *
         * Content: Kubernetes resources (can be split to YAML)
         * - deployment: Deployment resource
         * - service: Service resource
         * - configmap: Configuration
         * - secret: Secrets (templates only)
         * - serviceaccount: Service account
         * - hpa: Horizontal Pod Autoscaler (if configured)
         *
         * Used for: Kubernetes deployments
         */
        expect(true).toBe(true);
      });
    });

    describe('NPM Export (Package)', () => {
      it('should export to npm package format', () => {
        const outputDir = path.join(tempDir, 'npm-test-export-agent');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform npm --output ${outputDir} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 }
          );

          // Verify directory structure
          expect(fs.existsSync(outputDir)).toBe(true);
          expect(fs.existsSync(path.join(outputDir, 'package.json'))).toBe(
            true
          );
          expect(fs.existsSync(path.join(outputDir, 'src'))).toBe(true);
        } catch (error: any) {
          console.error('NPM export error:', error.message);
          throw error;
        }
      });

      it('should export npm package with claude skill', () => {
        const outputDir = path.join(tempDir, 'npm-with-skill');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform npm --output ${outputDir} --skill --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 }
          );

          expect(fs.existsSync(outputDir)).toBe(true);
          expect(fs.existsSync(path.join(outputDir, 'SKILL.md'))).toBe(true);
        } catch (error: any) {
          console.error('NPM with skill export error:', error.message);
          throw error;
        }
      });

      it('should document npm output structure', () => {
        /**
         * NPM EXPORT OUTPUT STRUCTURE:
         *
         * Directory: npm-{agent-name}/
         *
         * Files:
         * ├── package.json                    # NPM package config
         * ├── tsconfig.json                   # TypeScript config
         * ├── README.md                       # Documentation
         * ├── .npmignore                      # NPM publish exclusions
         * ├── src/
         * │   ├── index.ts                    # Package entry point
         * │   ├── agent.ts                    # Agent implementation
         * │   ├── server.ts                   # Express.js server
         * │   ├── types.ts                    # TypeScript types
         * │   └── tools/
         * │       └── *.ts                    # Tool implementations
         * ├── openapi/
         * │   └── openapi.yaml                # API specification
         * └── SKILL.md                        # Claude Skill (optional --skill flag)
         *
         * Used for: NPM package distribution
         */
        expect(true).toBe(true);
      });
    });

    describe('Drupal Module Export', () => {
      it('should export to drupal module format', () => {
        const outputDir = path.join(tempDir, 'drupal-test_export_agent');

        try {
          execSync(
            `node bin/ossa export ${testManifestPath} --platform drupal --output ${outputDir} --no-validate`,
            { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 }
          );

          // Verify directory structure
          expect(fs.existsSync(outputDir)).toBe(true);
          expect(
            fs.existsSync(path.join(outputDir, 'test_export_agent.info.yml'))
          ).toBe(true);
          expect(fs.existsSync(path.join(outputDir, 'src'))).toBe(true);
        } catch (error: any) {
          console.error('Drupal export error:', error.message);
          throw error;
        }
      });

      it('should document drupal output structure', () => {
        /**
         * DRUPAL EXPORT OUTPUT STRUCTURE:
         *
         * Directory: {module_name}/
         *
         * Files:
         * ├── {module_name}.info.yml          # Module metadata
         * ├── {module_name}.module            # Module hooks
         * ├── {module_name}.services.yml      # Service definitions
         * ├── {module_name}.routing.yml       # Route definitions
         * ├── README.md                       # Documentation
         * ├── INSTALL.md                      # Installation guide
         * ├── composer.json                   # Composer config (requires ossa/symfony-bundle)
         * ├── config/
         * │   └── install/
         * │       └── {module_name}.settings.yml  # Default config
         * └── src/
         *     ├── Controller/
         *     │   └── AgentController.php     # HTTP endpoints
         *     ├── Form/
         *     │   └── AgentConfigForm.php     # Admin UI form
         *     ├── Plugin/
         *     │   └── QueueWorker/
         *     │       └── AgentQueueWorker.php # Queue processing
         *     └── Entity/
         *         └── AgentEntity.php          # Agent entity (optional)
         *
         * Used for: Drupal CMS integration (requires ossa/symfony-bundle)
         */
        expect(true).toBe(true);
      });
    });
  });

  describe('Export Options', () => {
    it('should support dry-run mode', () => {
      const outputPath = path.join(tempDir, 'dry-run-test.yaml');

      const output = execSync(
        `node bin/ossa export ${testManifestPath} --platform kagent --output ${outputPath} --dry-run --no-validate`,
        { cwd, encoding: 'utf-8' }
      );

      // File should NOT be created in dry-run
      expect(fs.existsSync(outputPath)).toBe(false);
      expect(output).toContain('DRY RUN MODE');
    });

    it('should support verbose output', () => {
      const outputPath = path.join(tempDir, 'verbose-test.yaml');

      const output = execSync(
        `node bin/ossa export ${testManifestPath} --platform kagent --output ${outputPath} --verbose --no-validate`,
        { cwd, encoding: 'utf-8' }
      );

      expect(output).toContain('Verbose mode enabled');
    });

    it('should support quiet mode', () => {
      const outputPath = path.join(tempDir, 'quiet-test.yaml');

      const output = execSync(
        `node bin/ossa export ${testManifestPath} --platform kagent --output ${outputPath} --quiet --no-validate`,
        { cwd, encoding: 'utf-8' }
      );

      // Should have minimal output
      expect(output.length).toBeLessThan(100);
    });

    it('should support json output format', () => {
      const outputPath = path.join(tempDir, 'json-test.yaml');

      const output = execSync(
        `node bin/ossa export ${testManifestPath} --platform kagent --output ${outputPath} --json --no-validate`,
        { cwd, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(result.success).toBe(true);
      expect(result.platform).toBe('kagent');
    });

    it('should create backup when file exists', () => {
      const outputPath = path.join(tempDir, 'backup-test.yaml');

      // Create original file
      fs.writeFileSync(outputPath, 'original content');

      execSync(
        `node bin/ossa export ${testManifestPath} --platform kagent --output ${outputPath} --backup --no-validate`,
        { cwd, encoding: 'utf-8', stdio: 'pipe' }
      );

      // Check backup was created
      const backupDir = path.join(tempDir, 'backups');
      expect(fs.existsSync(backupDir)).toBe(true);
      const backups = fs.readdirSync(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should reject unsupported platform', () => {
      try {
        execSync(
          `node bin/ossa export ${testManifestPath} --platform unsupported --no-validate`,
          { cwd, encoding: 'utf-8', stdio: 'pipe' }
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(1);
        const output = error.stderr?.toString() || '';
        expect(output).toContain('Unsupported platform');
      }
    });

    it('should handle missing manifest file', () => {
      try {
        execSync(
          `node bin/ossa export /nonexistent/file.yaml --platform kagent --no-validate`,
          { cwd, encoding: 'utf-8', stdio: 'pipe' }
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });

    it('should handle invalid manifest', () => {
      const invalidManifest = path.join(tempDir, 'invalid.yaml');
      fs.writeFileSync(invalidManifest, 'invalid: yaml: content: [[[');

      try {
        execSync(
          `node bin/ossa export ${invalidManifest} --platform kagent --no-validate`,
          { cwd, encoding: 'utf-8', stdio: 'pipe' }
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });
  });

  describe('Platform Summary', () => {
    it('should document all 11 platforms', () => {
      /**
       * COMPLETE PLATFORM EXPORT SUMMARY
       * ================================
       *
       * 1. KAGENT (Kubernetes CRD)
       *    Output: Single YAML file
       *    Use: Kubernetes agent deployments
       *
       * 2. LANGCHAIN (Python Package)
       *    Output: Full Python project (13+ files)
       *    Use: LangChain applications with FastAPI
       *
       * 3. CREWAI (Python Script)
       *    Output: Single Python file
       *    Use: CrewAI multi-agent systems
       *
       * 4. TEMPORAL (TypeScript Workflow)
       *    Output: Single TypeScript file
       *    Use: Temporal workflow orchestration
       *
       * 5. N8N (Workflow JSON)
       *    Output: Single JSON file
       *    Use: N8N automation workflows
       *
       * 6. GITLAB (CI/CD Pipeline)
       *    Output: Single .gitlab-ci.yml file
       *    Use: GitLab CI/CD automation
       *
       * 7. GITLAB-AGENT (Full Package)
       *    Output: Complete TypeScript project (10+ files)
       *    Use: GitLab webhook agents with LLM
       *
       * 8. DOCKER (Container Image)
       *    Output: Single Dockerfile
       *    Use: Docker containerization
       *
       * 9. KUBERNETES (Deployment Manifests)
       *    Output: Single JSON with multiple resources
       *    Use: Kubernetes deployments
       *
       * 10. NPM (Package)
       *     Output: Complete TypeScript NPM package (8+ files)
       *     Use: NPM distribution with optional Claude Skill
       *
       * 11. DRUPAL (Module)
       *     Output: Complete Drupal module (10+ files)
       *     Use: Drupal CMS integration (requires ossa/symfony-bundle)
       *
       * EXPORT OPTIONS:
       * - --dry-run: Preview without writing files
       * - --verbose: Detailed output
       * - --quiet: Minimal output
       * - --json: JSON output for automation
       * - --backup: Create backup before overwrite
       * - --skill: Include Claude Skill (NPM only)
       * - --no-validate: Skip manifest validation
       */
      expect(true).toBe(true);
    });
  });
});
