#!/usr/bin/env node
/**
 * Audit CI/CD tokens across OSSA projects
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITLAB_API = 'https://gitlab.com/api/v4';
const PROJECTS = {
  'openstandardagents': 'blueflyio/openstandardagents',
  'openstandardagents.org': 'blueflyio/openstandardagents.org'
};

// Load token from .env.local
function loadToken() {
  const envPath = path.join(__dirname, '../../.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^(WEB_TOKEN|GITLAB_TOKEN|WEBSITE_TRIGGER_TOKEN)=(.+)$/);
        if (match) {
          return match[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
  
  // Fallback to environment variable
  return process.env.WEB_TOKEN || process.env.GITLAB_TOKEN || process.env.WEBSITE_TRIGGER_TOKEN;
}

const token = loadToken();

if (!token) {
  console.error('❌ No token found. Set WEB_TOKEN, GITLAB_TOKEN, or WEBSITE_TRIGGER_TOKEN in .env.local or environment');
  process.exit(1);
}

// Fetch project info
function fetchProject(projectPath) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const url = `${GITLAB_API}/projects/${encodedPath}`;
    const headers = {
      'PRIVATE-TOKEN': token
    };

    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Fetch CI/CD variables from a project
function fetchVariables(projectPath) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const url = `${GITLAB_API}/projects/${encodedPath}/variables`;
    const headers = {
      'PRIVATE-TOKEN': token
    };

    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Audit tokens
async function auditTokens() {
  console.log('🔍 Auditing CI/CD tokens across projects...\n');
  console.log(`Using token: ${token.substring(0, 8)}...${token.substring(token.length - 4)}\n`);

  const results = {};
  const projectInfo = {};

  for (const [name, projectPath] of Object.entries(PROJECTS)) {
    try {
      console.log(`📋 Fetching project info for ${name} (${projectPath})...`);
      const project = await fetchProject(projectPath);
      projectInfo[name] = project;
      console.log(`   ✅ Project ID: ${project.id}, Name: ${project.name}\n`);

      console.log(`📋 Fetching variables from ${name}...`);
      const variables = await fetchVariables(projectPath);
      results[name] = variables;
      console.log(`   ✅ Found ${variables.length} variables\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      results[name] = [];
      projectInfo[name] = null;
    }
  }

  // Analyze
  console.log('📊 Analysis:\n');

  const ossaVars = results['openstandardagents'] || [];
  const websiteVars = results['openstandardagents.org'] || [];

  // Find token-related variables
  const tokenVars = ['WEB_TOKEN', 'WEBSITE_TRIGGER_TOKEN', 'GITLAB_TOKEN', 'CI_JOB_TOKEN'];
  
  console.log('Token Variables:');
  console.log('================\n');

  for (const varName of tokenVars) {
    const ossaVar = ossaVars.find(v => v.key === varName);
    const websiteVar = websiteVars.find(v => v.key === varName);

    console.log(`${varName}:`);
    if (ossaVar) {
      const masked = ossaVar.masked ? '[MASKED]' : (ossaVar.value ? `${ossaVar.value.substring(0, 8)}...${ossaVar.value.substring(ossaVar.value.length - 4)}` : 'empty');
      console.log(`  ✅ openstandardagents: ${masked}`);
      console.log(`     - Protected: ${ossaVar.protected}, Masked: ${ossaVar.masked}, Environment: ${ossaVar.environment_scope || 'all'}`);
    } else {
      console.log(`  ❌ openstandardagents: NOT FOUND`);
    }

    if (websiteVar) {
      const masked = websiteVar.masked ? '[MASKED]' : (websiteVar.value ? `${websiteVar.value.substring(0, 8)}...${websiteVar.value.substring(websiteVar.value.length - 4)}` : 'empty');
      console.log(`  ✅ openstandardagents.org: ${masked}`);
      console.log(`     - Protected: ${websiteVar.protected}, Masked: ${websiteVar.masked}, Environment: ${websiteVar.environment_scope || 'all'}`);
    } else {
      console.log(`  ❌ openstandardagents.org: NOT FOUND`);
    }
    console.log('');
  }

  // Check for matching tokens
  console.log('Token Matching:');
  console.log('===============\n');

  const ossaWebToken = ossaVars.find(v => v.key === 'WEB_TOKEN');
  const websiteWebToken = websiteVars.find(v => v.key === 'WEB_TOKEN');

  if (ossaWebToken && websiteWebToken) {
    if (!ossaWebToken.masked && !websiteWebToken.masked) {
      if (ossaWebToken.value === websiteWebToken.value) {
        console.log('✅ WEB_TOKEN matches between projects');
      } else {
        console.log('⚠️  WEB_TOKEN differs between projects');
        console.log(`   openstandardagents: ${ossaWebToken.value.substring(0, 8)}...`);
        console.log(`   openstandardagents.org: ${websiteWebToken.value.substring(0, 8)}...`);
      }
    } else {
      console.log('⚠️  Cannot compare WEB_TOKEN - one or both are masked');
    }
  } else {
    console.log('⚠️  WEB_TOKEN missing in one or both projects');
  }

  // List all variables
  console.log('\n\nAll Variables:');
  console.log('==============\n');

  console.log('openstandardagents:');
  if (ossaVars.length === 0) {
    console.log('  (no variables found)');
  } else {
    ossaVars.forEach(v => {
      const value = v.masked ? '[MASKED]' : (v.value ? `${v.value.substring(0, 8)}...` : 'empty');
      console.log(`  ${v.key}: ${value} (protected: ${v.protected}, masked: ${v.masked}, env: ${v.environment_scope || 'all'})`);
    });
  }

  console.log('\nopenstandardagents.org:');
  if (websiteVars.length === 0) {
    console.log('  (no variables found)');
  } else {
    websiteVars.forEach(v => {
      const value = v.masked ? '[MASKED]' : (v.value ? `${v.value.substring(0, 8)}...` : 'empty');
      console.log(`  ${v.key}: ${value} (protected: ${v.protected}, masked: ${v.masked}, env: ${v.environment_scope || 'all'})`);
    });
  }
}

auditTokens().catch(error => {
  console.error('❌ Audit failed:', error.message);
  process.exit(1);
});
