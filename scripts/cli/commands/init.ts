/**
 * OSSA CLI: Init command
 * Initialize a new OSSA project following TDD and OpenAPI-first principles
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface InitOptions {
  name?: string;
  template?: 'minimal' | 'full' | 'enterprise';
  typescript?: boolean;
  git?: boolean;
}

const TEMPLATES = {
  minimal: {
    'agent.ossa.yaml': `apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: my-agent
  namespace: default
  version: 1.0.0
  description: My OSSA agent
spec:
  capabilities: []
  llm:
    model:
      primary: claude-sonnet-4-20250514
  tools: []
  commands: {}
`,
    'package.json': `{
  "name": "@my-org/my-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test",
    "validate": "ossa validate agent.ossa.yaml"
  }
}
`,
    '.gitlab-ci.yml': `include:
  - component: gitlab.com/blueflyio/gitlab_components/golden@release/v0.1.5
    inputs:
      node_version: "20"
`
  },
  full: {
    'agent.ossa.yaml': `apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: my-agent
  namespace: default
  version: 1.0.0
  description: My OSSA agent
  labels:
    domain: automation
    tier: worker
spec:
  capabilities:
    - api-access
    - file-operations
  llm:
    model:
      primary: claude-sonnet-4-20250514
      fallback:
        - claude-3-5-sonnet-20241022
    execution_profile: balanced
  tools:
    - name: gitlab-api
      type: mcp
      config:
        server: gitlab-mcp
  commands:
    execute:
      description: Execute agent task
      handler: |
        Perform the agent's primary function
  triggers:
    - type: webhook
      source: gitlab
      events:
        - merge_request.opened
`,
    'package.json': `{
  "name": "@my-org/my-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test",
    "validate": "ossa validate agent.ossa.yaml",
    "build": "tsc",
    "lint": "eslint src"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.7.0",
    "eslint": "^8.0.0"
  }
}
`,
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
`,
    '.gitlab-ci.yml': `include:
  - component: gitlab.com/blueflyio/gitlab_components/golden@release/v0.1.5
    inputs:
      node_version: "20"
      enable_pages: true
`,
    'src/index.ts': `export function main() {
  console.log('OSSA Agent initialized');
}
`
  },
  enterprise: {
    'agent.ossa.yaml': `apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: my-agent
  namespace: enterprise
  version: 1.0.0
  description: Enterprise OSSA agent
  labels:
    domain: automation
    tier: worker
    compliance: soc2
spec:
  capabilities:
    - api-access
    - file-operations
    - security-scanning
  llm:
    model:
      primary: claude-sonnet-4-20250514
      fallback:
        - claude-3-5-sonnet-20241022
    execution_profile: balanced
    cost_tracking:
      enabled: true
      budget_alert_threshold: 100.00
  safety:
    content_filtering:
      enabled: true
      categories:
        - secrets
        - credentials
    guardrails:
      - id: no-secret-exposure
        description: Never expose secrets
        action: block
  observability:
    tracing:
      enabled: true
      exporter: otlp
    metrics:
      enabled: true
    logging:
      level: info
      format: json
  tools:
    - name: gitlab-api
      type: mcp
      config:
        server: gitlab-mcp
  commands:
    execute:
      description: Execute agent task
      handler: |
        Perform the agent's primary function
  triggers:
    - type: webhook
      source: gitlab
      events:
        - merge_request.opened
`,
    'package.json': `{
  "name": "@my-org/my-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test",
    "test:coverage": "node --test --coverage",
    "validate": "ossa validate agent.ossa.yaml --strict",
    "build": "tsc",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.7.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
`,
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
`,
    '.eslintrc.json': `{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
`,
    '.gitlab-ci.yml': `include:
  - component: gitlab.com/blueflyio/gitlab_components/golden@release/v0.1.5
    inputs:
      node_version: "20"
      enable_pages: true
      require_milestone: true
      require_issue_link: true
`,
    'src/index.ts': `export function main() {
  console.log('Enterprise OSSA Agent initialized');
}
`,
    'tests/unit/index.test.ts': `import { describe, it } from 'node:test';
import { main } from '../src/index.js';

describe('Agent', () => {
  it('should initialize', () => {
    main();
  });
});
`
  }
};

async function initProject(options: InitOptions): Promise<void> {
  const projectName = options.name || 'my-ossa-agent';
  const template = options.template || 'minimal';
  const useTypeScript = options.typescript !== false;
  const initGit = options.git === true;

  if (existsSync(projectName)) {
    throw new Error(`Directory ${projectName} already exists`);
  }

  console.log(`Creating OSSA project: ${projectName}`);
  console.log(`Template: ${template}`);
  console.log(`TypeScript: ${useTypeScript}`);

  mkdirSync(projectName, { recursive: true });
  const projectPath = join(process.cwd(), projectName);

  const files = TEMPLATES[template];

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = join(projectPath, filePath);
    const dir = require('path').dirname(fullPath);
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(fullPath, content);
    console.log(`✅ Created ${filePath}`);
  }

  if (initGit) {
    const { execSync } = require('child_process');
    execSync('git init', { cwd: projectPath, stdio: 'inherit' });
    execSync('git add .', { cwd: projectPath, stdio: 'inherit' });
    execSync('git commit -m "feat: initial OSSA agent setup"', { cwd: projectPath, stdio: 'inherit' });
    console.log('✅ Initialized git repository');
  }

  console.log(`\n✅ Project created: ${projectName}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm install`);
  console.log(`  ossa validate agent.ossa.yaml`);
}

export { initProject };
