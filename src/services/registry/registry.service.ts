/**
 * OSSA Registry Service
 * Manages agent publishing, searching, and installation
 */

import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface RegistryConfig {
  type: 'gitlab' | 'github';
  token: string;
  projectId?: string;
  owner?: string;
  repo?: string;
  url?: string;
}

export interface AgentRelease {
  name: string;
  version: string;
  tag: string;
  description: string;
  publishedAt: string;
  assets: Array<{ name: string; url: string }>;
}

export class RegistryService {
  private config: RegistryConfig;

  constructor(config: RegistryConfig) {
    this.config = config;
  }

  async publish(manifestPath: string, agentName: string, version: string): Promise<void> {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');

    if (this.config.type === 'gitlab') {
      await this.publishToGitLab(agentName, version, manifestContent);
    } else {
      await this.publishToGitHub(agentName, version, manifestContent);
    }
  }

  async search(query: string, limit = 20): Promise<AgentRelease[]> {
    if (this.config.type === 'gitlab') {
      return this.searchGitLab(query, limit);
    } else {
      return this.searchGitHub(query, limit);
    }
  }

  async install(agentName: string, version: string, outputDir: string): Promise<string> {
    const release = await this.getRelease(agentName, version);
    const manifestUrl = release.assets.find(a => 
      a.name === 'agent.yaml' || a.name === 'agent.yml'
    )?.url;

    if (!manifestUrl) {
      throw new Error('Agent manifest not found in release');
    }

    const response = await axios.get(manifestUrl, {
      headers: this.config.type === 'gitlab' 
        ? { 'PRIVATE-TOKEN': this.config.token }
        : { 'Authorization': `token ${this.config.token}` }
    });

    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${agentName.replace('@ossa/', '')}.yaml`);
    await fs.writeFile(outputPath, response.data, 'utf-8');

    return outputPath;
  }

  async getInfo(agentName: string, version: string): Promise<AgentRelease> {
    return this.getRelease(agentName, version);
  }

  private async publishToGitLab(agentName: string, version: string, manifest: string): Promise<void> {
    const projectId = this.config.projectId || '76265294';
    const gitlabUrl = this.config.url || 'https://gitlab.com';
    const tagName = `${agentName}-v${version}`;

    await axios.post(
      `${gitlabUrl}/api/v4/projects/${projectId}/releases`,
      {
        name: `${agentName} v${version}`,
        tag_name: tagName,
        description: `OSSA Agent: ${agentName}@${version}\n\nPublished via OSSA CLI`,
      },
      {
        headers: { 'PRIVATE-TOKEN': this.config.token },
      }
    );
  }

  private async publishToGitHub(agentName: string, version: string, manifest: string): Promise<void> {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: this.config.token });
    const owner = this.config.owner || 'blueflyio';
    const repo = this.config.repo || 'openstandardagents';
    const tagName = `${agentName}-v${version}`;

    const release = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: tagName,
      name: `${agentName} v${version}`,
      body: `OSSA Agent: ${agentName}@${version}\n\nPublished via OSSA CLI`,
    });

    await octokit.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.data.id,
      name: 'agent.yaml',
      data: manifest,
    });
  }

  private async searchGitLab(query: string, limit: number): Promise<AgentRelease[]> {
    const projectId = this.config.projectId || '76265294';
    const gitlabUrl = this.config.url || 'https://gitlab.com';

    const response = await axios.get(
      `${gitlabUrl}/api/v4/projects/${projectId}/releases`,
      {
        headers: { 'PRIVATE-TOKEN': this.config.token },
        params: { per_page: limit },
      }
    );

    return response.data
      .filter((r: any) => 
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase())
      )
      .map((r: any) => ({
        name: r.tag_name.split('-v')[0],
        version: r.tag_name.split('-v')[1] || 'latest',
        tag: r.tag_name,
        description: r.description,
        publishedAt: r.created_at,
        assets: r.assets?.links || [],
      }));
  }

  private async searchGitHub(query: string, limit: number): Promise<AgentRelease[]> {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: this.config.token });
    const owner = this.config.owner || 'blueflyio';
    const repo = this.config.repo || 'openstandardagents';

    const { data: releases } = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: limit,
    });

    return releases
      .filter(r => 
        (r.name?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
        (r.body?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
      .map(r => ({
        name: r.tag_name.split('-v')[0],
        version: r.tag_name.split('-v')[1] || 'latest',
        tag: r.tag_name,
        description: r.body || '',
        publishedAt: r.published_at || r.created_at,
        assets: [],
      }));
  }

  private async getRelease(agentName: string, version: string): Promise<AgentRelease> {
    if (this.config.type === 'gitlab') {
      return this.getReleaseFromGitLab(agentName, version);
    } else {
      return this.getReleaseFromGitHub(agentName, version);
    }
  }

  private async getReleaseFromGitLab(agentName: string, version: string): Promise<AgentRelease> {
    const projectId = this.config.projectId || '76265294';
    const gitlabUrl = this.config.url || 'https://gitlab.com';
    const tagName = version === 'latest' ? agentName : `${agentName}-v${version}`;

    const response = await axios.get(
      `${gitlabUrl}/api/v4/projects/${projectId}/releases/${encodeURIComponent(tagName)}`,
      {
        headers: { 'PRIVATE-TOKEN': this.config.token },
      }
    );

    const release = response.data;
    return {
      name: agentName,
      version,
      tag: release.tag_name,
      description: release.description,
      publishedAt: release.created_at,
      assets: release.assets?.links || [],
    };
  }

  private async getReleaseFromGitHub(agentName: string, version: string): Promise<AgentRelease> {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: this.config.token });
    const owner = this.config.owner || 'blueflyio';
    const repo = this.config.repo || 'openstandardagents';
    const tagName = version === 'latest' ? agentName : `${agentName}-v${version}`;

    const { data: release } = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag: tagName,
    });

    return {
      name: agentName,
      version,
      tag: release.tag_name,
      description: release.body || '',
      publishedAt: release.published_at || release.created_at,
      assets: [],
    };
  }
}
