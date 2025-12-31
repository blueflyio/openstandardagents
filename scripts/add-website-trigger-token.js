#!/usr/bin/env node
/**
 * Add WEBSITE_TRIGGER_TOKEN from openstandardagents to openstandardagents.org
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITLAB_API = 'https://gitlab.com/api/v4';
const SOURCE_PROJECT = 'blueflyio/openstandardagents';
const TARGET_PROJECT = 'blueflyio/openstandardagents.org';
const VARIABLE_KEY = 'WEBSITE_TRIGGER_TOKEN';

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
  
  return process.env.WEB_TOKEN || process.env.GITLAB_TOKEN || process.env.WEBSITE_TRIGGER_TOKEN;
}

const token = loadToken();

if (!token) {
  console.error('❌ No token found. Set GITLAB_TOKEN in .env.local');
  process.exit(1);
}

// Fetch variable from source project
function fetchVariable(projectPath, varKey) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedKey = encodeURIComponent(varKey);
    const url = `${GITLAB_API}/projects/${encodedPath}/variables/${encodedKey}`;
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
          } else if (res.statusCode === 404) {
            resolve(null);
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

// Check if variable exists in target
function checkVariable(projectPath, varKey) {
  return fetchVariable(projectPath, varKey);
}

// Create variable in target project
function createVariable(projectPath, variableData) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const url = `${GITLAB_API}/projects/${encodedPath}/variables`;
    const headers = {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json'
    };

    const postData = JSON.stringify({
      key: variableData.key,
      value: variableData.value,
      protected: variableData.protected || false,
      masked: variableData.masked || true,
      environment_scope: variableData.environment_scope || '*'
    });

    const options = {
      method: 'POST',
      headers: headers
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 201 || res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main
async function main() {
  console.log(`🔍 Checking ${VARIABLE_KEY} in both projects...\n`);

  // Check if already exists in target
  console.log(`📋 Checking if ${VARIABLE_KEY} exists in ${TARGET_PROJECT}...`);
  const existing = await checkVariable(TARGET_PROJECT, VARIABLE_KEY);
  
  if (existing) {
    console.log(`✅ ${VARIABLE_KEY} already exists in ${TARGET_PROJECT}`);
    console.log(`   Protected: ${existing.protected}, Masked: ${existing.masked}`);
    process.exit(0);
  }

  console.log(`❌ ${VARIABLE_KEY} not found in ${TARGET_PROJECT}\n`);

  // Fetch from source
  console.log(`📋 Fetching ${VARIABLE_KEY} from ${SOURCE_PROJECT}...`);
  const sourceVar = await fetchVariable(SOURCE_PROJECT, VARIABLE_KEY);

  if (!sourceVar) {
    console.error(`❌ ${VARIABLE_KEY} not found in ${SOURCE_PROJECT}`);
    process.exit(1);
  }

  if (sourceVar.masked) {
    console.error(`❌ Cannot copy ${VARIABLE_KEY} - it's masked in source project`);
    console.error(`   You need to manually add it via GitLab UI or use an unmasked token`);
    process.exit(1);
  }

  console.log(`✅ Found ${VARIABLE_KEY} in ${SOURCE_PROJECT}`);
  console.log(`   Protected: ${sourceVar.protected}, Masked: ${sourceVar.masked}\n`);

  // Create in target
  console.log(`📋 Creating ${VARIABLE_KEY} in ${TARGET_PROJECT}...`);
  try {
    const result = await createVariable(TARGET_PROJECT, {
      key: sourceVar.key,
      value: sourceVar.value,
      protected: sourceVar.protected,
      masked: sourceVar.masked,
      environment_scope: sourceVar.environment_scope || '*'
    });

    console.log(`✅ Successfully created ${VARIABLE_KEY} in ${TARGET_PROJECT}`);
    console.log(`   Protected: ${result.protected}, Masked: ${result.masked}`);
  } catch (error) {
    if (error.message.includes('409') || error.message.includes('already exists')) {
      console.log(`✅ ${VARIABLE_KEY} already exists in ${TARGET_PROJECT}`);
    } else {
      console.error(`❌ Failed to create variable: ${error.message}`);
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('❌ Operation failed:', error.message);
  process.exit(1);
});
