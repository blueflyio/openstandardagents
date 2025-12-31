#!/usr/bin/env node
/**
 * Check merge request status
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITLAB_API = 'https://gitlab.com/api/v4';
const PROJECT = 'blueflyio/openstandardagents.org';
const MR_IID = 217;

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
  console.error('❌ No token found');
  process.exit(1);
}

// Fetch MR details
function fetchMR(projectPath, mrIid) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const url = `${GITLAB_API}/projects/${encodedPath}/merge_requests/${mrIid}`;
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

// Fetch MR pipelines
function fetchMRPipelines(projectPath, mrIid) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(projectPath);
    const url = `${GITLAB_API}/projects/${encodedPath}/merge_requests/${mrIid}/pipelines`;
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

async function main() {
  console.log(`🔍 Checking MR !${MR_IID}...\n`);

  try {
    const mr = await fetchMR(PROJECT, MR_IID);
    
    console.log(`Title: ${mr.title}`);
    console.log(`State: ${mr.state}`);
    console.log(`Source: ${mr.source_branch} → Target: ${mr.target_branch}`);
    console.log(`Merge Status: ${mr.merge_status}`);
    console.log(`Has Conflicts: ${mr.has_conflicts}`);
    console.log(`Work in Progress: ${mr.work_in_progress}`);
    console.log(`Draft: ${mr.draft || false}`);
    console.log(`Web URL: ${mr.web_url}`);
    
    if (mr.pipeline) {
      console.log(`\nPipeline:`);
      console.log(`  Status: ${mr.pipeline.status}`);
      console.log(`  ID: ${mr.pipeline.id}`);
      console.log(`  Web URL: ${mr.pipeline.web_url}`);
    }

    // Get latest pipelines
    const pipelines = await fetchMRPipelines(PROJECT, MR_IID);
    if (pipelines && pipelines.length > 0) {
      const latest = pipelines[0];
      console.log(`\nLatest Pipeline:`);
      console.log(`  Status: ${latest.status}`);
      console.log(`  ID: ${latest.id}`);
      console.log(`  Ref: ${latest.ref}`);
      console.log(`  SHA: ${latest.sha.substring(0, 8)}`);
      console.log(`  Web URL: ${latest.web_url}`);
    }

    console.log(`\n✅ MR Status Check Complete`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
