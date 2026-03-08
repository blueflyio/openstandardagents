/**
 * Skills Install Service
 * Install a Claude Skill (SKILL.md format) from a GitHub repo into a target directory.
 * Compatible with AgentSkills.io layout and npx skills add style (repo + --skill name).
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import { injectable } from 'inversify';
import * as path from 'path';

export interface SkillsInstallOptions {
  repoUrl: string;
  skill?: string;
  path: string;
  ref?: string;
}

export interface SkillsInstallResult {
  success: boolean;
  installedPath?: string;
  message: string;
  errors?: string[];
}

/**
 * Parse GitHub URL into owner and repo.
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) {
    throw new Error(
      `Invalid GitHub URL: ${url}. Use https://github.com/owner/repo`
    );
  }
  return { owner: match[1], repo: match[2] };
}

@injectable()
export class SkillsInstallService {
  private octokit: Octokit;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    this.octokit = new Octokit(token ? { auth: token } : {});
  }

  /**
   * Resolve the path inside the repo where the skill lives.
   * Tries: skills/<name>, <name>, skill-<name>, root (if single SKILL.md).
   */
  private async findSkillPath(
    owner: string,
    repo: string,
    skillName: string,
    ref: string
  ): Promise<string> {
    const candidates = [
      `skills/${skillName}`,
      skillName,
      `skill-${skillName}`,
      `${skillName}/SKILL.md`,
    ];

    for (const candidate of candidates) {
      try {
        const { data } = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: candidate,
          ref: ref || undefined,
        });
        if (Array.isArray(data)) {
          const hasSkillMd = data.some(
            (e: { name?: string }) => e.name === 'SKILL.md'
          );
          if (hasSkillMd) return candidate;
        } else {
          const type = (data as { type?: string }).type;
          if (type === 'file' && candidate.endsWith('SKILL.md'))
            return path.dirname(candidate);
          if (type === 'dir') return candidate;
        }
      } catch {
        continue;
      }
    }

    throw new Error(
      `Skill "${skillName}" not found in ${owner}/${repo}. Tried: ${candidates.join(', ')}`
    );
  }

  /**
   * Get blob content as utf-8 string.
   */
  private async getBlob(
    owner: string,
    repo: string,
    sha: string
  ): Promise<string> {
    const { data } = await this.octokit.rest.git.getBlob({
      owner,
      repo,
      file_sha: sha,
    });
    const encoding = (data as { encoding?: string }).encoding;
    const content = (data as { content?: string }).content;
    if (!content) return '';
    if (encoding === 'base64') {
      return Buffer.from(content, 'base64').toString('utf-8');
    }
    return content;
  }

  /**
   * Install a skill from a GitHub repo into the target directory.
   */
  async install(options: SkillsInstallOptions): Promise<SkillsInstallResult> {
    const errors: string[] = [];
    const targetDir = path.resolve(options.path);
    const ref = options.ref || 'HEAD';

    try {
      const { owner, repo } = parseGitHubUrl(options.repoUrl);

      if (!options.skill) {
        return {
          success: false,
          message:
            'Missing skill name. Use: ossa skills add <repo-url> --skill <name>',
          errors: ['--skill <name> is required'],
        };
      }

      const skillPath = await this.findSkillPath(
        owner,
        repo,
        options.skill,
        ref
      );

      const commit = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref,
      });
      const treeSha = commit.data.commit.tree.sha;

      const fullTree = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: 'true',
      });

      const prefix = skillPath.endsWith('/') ? skillPath : `${skillPath}/`;
      const blobEntries = (fullTree.data.tree || []).filter(
        (e: any) =>
          e.type === 'blob' &&
          e.path &&
          (e.path === skillPath || e.path.startsWith(prefix))
      ) as { path: string; sha: string }[];

      if (blobEntries.length === 0) {
        const singleFile = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: skillPath,
          ref: ref || undefined,
        });
        if (
          !Array.isArray(singleFile.data) &&
          singleFile.data.type === 'file'
        ) {
          const content = Buffer.from(
            (singleFile.data as { content?: string }).content || '',
            'base64'
          ).toString('utf-8');
          const outDir = path.join(targetDir, options.skill);
          await fs.mkdir(outDir, { recursive: true });
          await fs.writeFile(path.join(outDir, 'SKILL.md'), content, 'utf-8');
          return {
            success: true,
            installedPath: outDir,
            message: `Installed skill "${options.skill}" to ${outDir}`,
          };
        }
        return {
          success: false,
          message: `No files found for skill "${options.skill}" in ${owner}/${repo}`,
          errors,
        };
      }

      const outSkillDir = path.join(
        targetDir,
        path.basename(skillPath) || options.skill
      );
      await fs.mkdir(outSkillDir, { recursive: true });

      for (const entry of blobEntries) {
        const relativePath = entry.path.startsWith(prefix)
          ? entry.path.slice(prefix.length)
          : path.basename(entry.path);
        const outPath = path.join(outSkillDir, relativePath);
        const content = await this.getBlob(owner, repo, entry.sha);
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, content, 'utf-8');
      }

      return {
        success: true,
        installedPath: outSkillDir,
        message: `Installed skill "${options.skill}" to ${outSkillDir}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
      return {
        success: false,
        message: `Install failed: ${message}`,
        errors,
      };
    }
  }

  /**
   * List available skill names in a repo (dirs that contain SKILL.md).
   */
  async listInRepo(
    repoUrl: string,
    ref?: string
  ): Promise<{ name: string; path: string }[]> {
    const { owner, repo } = parseGitHubUrl(repoUrl);
    const sha = ref || 'HEAD';

    try {
      const commit = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: commit.data.commit.tree.sha,
        recursive: 'true',
      });

      const skillMdPaths = (tree.tree || [])
        .filter(
          (e: any) =>
            e.type === 'blob' && e.path?.endsWith('SKILL.md')
        )
        .map((e: any) => e.path);

      const dirs = new Map<string, string>();
      for (const p of skillMdPaths) {
        const dir = path.dirname(p);
        const name = path.basename(dir);
        if (!dirs.has(name)) dirs.set(name, dir);
      }
      return Array.from(dirs.entries()).map(([name, pathDir]) => ({
        name,
        path: pathDir,
      }));
    } catch {
      return [];
    }
  }
}
