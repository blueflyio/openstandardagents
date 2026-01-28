import { injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TemplateVariables {
  PROJECT_NAME: string;
  PROJECT_DESCRIPTION: string;
  REPO_URL: string;
  REPO_PATH: string;
  PROJECT_TYPE: string;
  PROJECT_STATUS: string;
  WIKI_URL: string;
  [key: string]: string;
}

interface PackageJson {
  name?: string;
  description?: string;
  repository?: string | { url: string };
  status?: string;
  [key: string]: unknown;
}

@injectable()
export class TemplateProcessorService {
  private readonly legacyTemplatePath =
    '/Users/thomas.scola/Sites/blueflyio/AGENTS.md.template';

  /**
   * Process template with variables
   */
  async process(
    templateContent: string,
    variables: TemplateVariables
  ): Promise<string> {
    let result = templateContent;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(placeholder, value || '');
    }

    return result;
  }

  /**
   * Extract variables from a repository path
   */
  async extractVariablesFromRepo(repoPath: string): Promise<TemplateVariables> {
    let packageJson: PackageJson = {};
    const packageJsonPath = path.join(repoPath, 'package.json');

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(content);
    } catch (error) {
      // Not an npm project or package.json missing
    }

    const projectName = packageJson.name || path.basename(repoPath);
    const description = packageJson.description || '';

    let repoUrl = '';
    if (typeof packageJson.repository === 'string') {
      repoUrl = packageJson.repository;
    } else if (packageJson.repository?.url) {
      repoUrl = packageJson.repository.url;
    }

    // Clean up repo URL (remove git+, .git etc)
    repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');

    const projectType = this.inferProjectType(repoPath, packageJson);
    const wikiUrl = repoUrl ? `${repoUrl}.wiki` : '';

    // Relative path in bare repos structure (with fallback if not in expected structure)
    const baseBarePath = '/Volumes/AgentPlatform/repos/bare/blueflyio';
    let repoPathRel = repoPath;
    if (repoPath.startsWith(baseBarePath)) {
      repoPathRel = path.relative(baseBarePath, repoPath);
    }

    return {
      PROJECT_NAME: projectName,
      PROJECT_DESCRIPTION: description,
      REPO_URL: repoUrl,
      REPO_PATH: repoPathRel,
      PROJECT_TYPE: projectType,
      PROJECT_STATUS: packageJson.status || 'Active',
      WIKI_URL: wikiUrl,
    };
  }

  /**
   * Get available placeholders in a template
   */
  getPlaceholders(templateContent: string): string[] {
    const matches = templateContent.match(/\{[A-Z0-9_]+\}/g) || [];
    return [...new Set(matches)].map((m) => m.slice(1, -1));
  }

  /**
   * Infer project type from repo structure
   */
  private inferProjectType(repoPath: string, packageJson: PackageJson): string {
    if (packageJson.name) {
      if (repoPath.toLowerCase().includes('drupal')) return 'drupal';
      return 'npm';
    }

    const lowerPath = repoPath.toLowerCase();
    if (lowerPath.includes('docs') || lowerPath.includes('wiki')) {
      return 'documentation';
    }

    return 'general';
  }

  /**
   * Load the default template with prioritized lookup
   */
  async loadDefaultTemplate(): Promise<string> {
    const lookupPaths = [
      path.join(process.cwd(), 'AGENTS.md.template'),
      path.join(process.env.HOME || '', '.ossa', 'AGENTS.md.template'),
      this.legacyTemplatePath,
    ];

    for (const templatePath of lookupPaths) {
      try {
        return await fs.readFile(templatePath, 'utf-8');
      } catch (err) {
        // Continue to next path
      }
    }

    // Fallback minimal template if no file found
    return `# {PROJECT_NAME}\n\n{PROJECT_DESCRIPTION}\n\n- **Type**: {PROJECT_TYPE}\n- **Status**: {PROJECT_STATUS}\n- **Repo**: {REPO_URL}\n- **Wiki**: {WIKI_URL}\n`;
  }
}
