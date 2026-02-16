#!/usr/bin/env tsx
/**
 * Complete CI/CD Setup - Check and Add Missing Variables
 *
 * This script:
 * 1. Checks existing variables at group and project level
 * 2. Identifies missing required variables
 * 3. Prompts for and adds missing variables
 *
 * Usage:
 *   GITLAB_TOKEN=<valid-token> tsx src/tools/complete-ci-setup.ts
 */

import { createInterface } from 'readline';

const GITLAB_API = 'https://gitlab.com/api/v4';
const GROUP_PATH = 'blueflyio';
const PROJECT_PATH = 'blueflyio/ossa/openstandardagents';

interface Variable {
  key: string;
  value: string;
  protected: boolean;
  masked: boolean;
  description: string;
  getUrl: string;
}

const REQUIRED_VARIABLES: Variable[] = [
  {
    key: 'NPM_TOKEN',
    value: '',
    protected: false,
    masked: true,
    description: 'npmjs.org automation token for publishing packages',
    getUrl:
      'https://www.npmjs.com/settings/[username]/tokens (Generate "Automation" type)',
  },
  {
    key: 'GITLAB_PUSH_TOKEN',
    value: '',
    protected: false,
    masked: true,
    description: 'GitLab token with api and write_repository scopes',
    getUrl: 'https://gitlab.com/-/user_settings/personal_access_tokens',
  },
  {
    key: 'GITHUB_TOKEN',
    value: '',
    protected: false,
    masked: true,
    description: 'GitHub PAT with repo scope for creating releases',
    getUrl:
      'https://github.com/settings/tokens (Generate "classic" token with "repo" scope)',
  },
];

async function askQuestion(query: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function fetchVariables(
  token: string,
  type: 'group' | 'project'
): Promise<Array<{ key: string; location: string }>> {
  const path = type === 'group' ? GROUP_PATH : PROJECT_PATH;
  const encoded = encodeURIComponent(path);
  const url =
    type === 'group'
      ? `${GITLAB_API}/groups/${encoded}/variables`
      : `${GITLAB_API}/projects/${encoded}/variables`;

  try {
    const response = await fetch(url, {
      headers: { 'PRIVATE-TOKEN': token },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'Invalid or expired token. Please get a fresh token from GitLab.'
        );
      }
      const error = await response.text();
      throw new Error(
        `Failed to fetch ${type} variables: ${response.status} - ${error}`
      );
    }

    const vars = await response.json();
    return vars.map((v: { key: string }) => ({ key: v.key, location: type }));
  } catch (error) {
    throw new Error(
      `Error fetching ${type} variables: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function createVariable(
  token: string,
  variable: Variable
): Promise<void> {
  const encoded = encodeURIComponent(PROJECT_PATH);
  const url = `${GITLAB_API}/projects/${encoded}/variables`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: variable.key,
      value: variable.value,
      protected: variable.protected,
      masked: variable.masked,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to create ${variable.key}: ${response.status} - ${error}`
    );
  }
}

async function main() {
  console.log('🚀 OSSA CI/CD Complete Setup\n');

  let token = process.env.GITLAB_TOKEN || process.env.GITLAB_PUSH_TOKEN;

  if (!token) {
    console.log('⚠️  No GitLab token found in environment.\n');
    token = await askQuestion('Enter GitLab token (with api scope): ');
    if (!token) {
      console.error('❌ Token is required');
      process.exit(1);
    }
  }

  console.log('📋 Step 1: Checking existing variables...\n');

  let groupVars: Array<{ key: string; location: string }> = [];
  let projectVars: Array<{ key: string; location: string }> = [];

  try {
    groupVars = await fetchVariables(token, 'group');
    console.log(`✅ Found ${groupVars.length} group-level variables`);
  } catch (error) {
    console.error(
      `❌ ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  try {
    projectVars = await fetchVariables(token, 'project');
    console.log(`✅ Found ${projectVars.length} project-level variables\n`);
  } catch (error) {
    console.error(
      `❌ ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  const allVars = new Map<string, string>();
  groupVars.forEach((v) => allVars.set(v.key, 'group'));
  projectVars.forEach((v) => allVars.set(v.key, 'project'));

  console.log('📊 Step 2: Analyzing required variables...\n');

  const missing: Variable[] = [];
  const existing: Array<{ variable: Variable; location: string }> = [];

  for (const variable of REQUIRED_VARIABLES) {
    const location = allVars.get(variable.key);
    if (location) {
      existing.push({ variable, location });
      console.log(`✅ ${variable.key}: Found in ${location}`);
    } else {
      missing.push(variable);
      console.log(`❌ ${variable.key}: MISSING`);
    }
  }

  if (missing.length === 0) {
    console.log('\n🎉 All required variables are already configured!\n');
    return;
  }

  console.log(`\n⚠️  ${missing.length} variable(s) need to be added.\n`);
  console.log('📋 Step 3: Adding missing variables...\n');

  for (const variable of missing) {
    console.log(`\n${variable.key}: ${variable.description}`);
    console.log(`Get token at: ${variable.getUrl}`);

    let value = process.env[variable.key];
    if (!value) {
      value = await askQuestion(`Enter ${variable.key}: `);
    } else {
      console.log(`✅ Using ${variable.key} from environment`);
    }

    if (!value || !value.trim()) {
      console.log(`⏭️  Skipping ${variable.key} (no value provided)`);
      continue;
    }

    variable.value = value.trim();

    try {
      await createVariable(token, variable);
      console.log(`✅ Created ${variable.key} at project level`);
    } catch (error) {
      console.error(
        `❌ Failed to create ${variable.key}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log('\n✅ Setup complete!\n');
  console.log('📋 Summary:');
  existing.forEach(({ variable, location }) => {
    console.log(`  ✅ ${variable.key}: ${location}`);
  });
  console.log('\n🎉 You can now trigger releases!\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
