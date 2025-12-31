#!/usr/bin/env node
/**
 * Sync WEBSITE_TRIGGER_TOKEN from openstandardagents to openstandardagents.org
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
const VAR_KEY = 'WEBSITE_TRIGGER_TOKEN';

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

// Fetch variable value from source project
function getVariable(projectPath, key) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedKey = encodeURIComponent(key);
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

// Create or update variable in target project
function setVariable(projectPath, variable) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedKey = encodeURIComponent(variable.key);
    const url = `${GITLAB_API}/projects/${encodedPath}/variables/${encodedKey}`;
    
    const postData = JSON.stringify({
      key: variable.key,
      value: variable.value,
      protected: variable.protected !== undefined ? variable.protected : false,
      masked: variable.masked !== undefined ? variable.masked : true,
      environment_scope: variable.environment_scope || '*'
    });

    const headers = {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };

    const options = {
      method: 'POST',
      headers
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 409) {
          // Variable exists, try PUT to update
          updateVariable(projectPath, variable).then(resolve).catch(reject);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Update existing variable
function updateVariable(projectPath, variable) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedKey = encodeURIComponent(variable.key);
    const url = `${GITLAB_API}/projects/${encodedPath}/variables/${encodedKey}`;
    
    const putData = JSON.stringify({
      value: variable.value,
      protected: variable.protected !== undefined ? variable.protected : false,
      masked: variable.masked !== undefined ? variable.masked : true,
      environment_scope: variable.environment_scope || '*'
    });

    const headers = {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(putData)
    };

    const options = {
      method: 'PUT',
      headers
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(putData);
    req.end();
  });
}

async function syncToken() {
  console.log('🔄 Syncing WEBSITE_TRIGGER_TOKEN...\n');
  console.log(`Source: ${SOURCE_PROJECT}`);
  console.log(`Target: ${TARGET_PROJECT}\n`);

  try {
    // Fetch from source
    console.log(`📥 Fetching ${VAR_KEY} from ${SOURCE_PROJECT}...`);
    const sourceVar = await getVariable(SOURCE_PROJECT, VAR_KEY);
    console.log(`   ✅ Found: ${VAR_KEY}`);
    console.log(`   - Protected: ${sourceVar.protected}`);
    console.log(`   - Masked: ${sourceVar.masked}`);
    console.log(`   - Environment: ${sourceVar.environment_scope || '*'}\n`);

    // Set in target
    console.log(`📤 Setting ${VAR_KEY} in ${TARGET_PROJECT}...`);
    const result = await setVariable(TARGET_PROJECT, {
      key: sourceVar.key,
      value: sourceVar.value,
      protected: sourceVar.protected,
      masked: sourceVar.masked,
      environment_scope: sourceVar.environment_scope
    });
    
    console.log(`   ✅ Successfully synced ${VAR_KEY}`);
    console.log(`   - Protected: ${result.protected}`);
    console.log(`   - Masked: ${result.masked}`);
    console.log(`   - Environment: ${result.environment_scope || '*'}\n`);

    console.log('✅ Sync complete!');
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncToken();
