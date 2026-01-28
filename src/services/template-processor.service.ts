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

@injectable()
export class TemplateProcessorService {
  private readonly defaultTemplatePath = '/Users/thomas.scola/Sites/blueflyio/AGENTS.md.template';

  /**
   * Process template with variables
   */
  async process(templateContent: string, variables: TemplateVariables): Promise<string> {
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
    let packageJson: any = {};
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
    repoUrl = repoUrl.replace(/^git+/, '').replace(/\.git$/, '');

    const projectType = this.inferProjectType(repoPath, packageJson);
    const wikiUrl = repoUrl ? `${repoUrl}.wiki` : '';
    
    // Relative path in bare repos structure
    const repoPathRel = path.relative('/Volumes/AgentPlatform/repos/bare/blueflyio', repoPath);

    return {
      PROJECT_NAME: projectName,
      PROJECT_DESCRIPTION: description,
      REPO_URL: repoUrl,
      REPO_PATH: repoPathRel,
      PROJECT_TYPE: projectType,
      PROJECT_STATUS: 'Active',
      WIKI_URL: wikiUrl,
    };
  }

  /**
   * Get available placeholders in a template
   */
  getPlaceholders(templateContent: string): string[] {
    const matches = templateContent.match(/\{[A-Z0-9_]+\}/g) || [];
    return [...new Set(matches)].map(m => m.slice(1, -1));
  }

  /**
   * Infer project type from repo structure
   */
  private inferProjectType(repoPath: string, packageJson: any): string {
    if (packageJson.name) {
      if (repoPath.includes('drupal')) return 'drupal';
      return 'npm';
    }
    
    if (repoPath.includes('docs') || repoPath.includes('wiki')) {
      return 'documentation';
    }

    return 'general';
  }

  /**
   * Load the default template
   */
  async loadDefaultTemplate(): Promise<string> {
    try {
      return await fs.readFile(this.defaultTemplatePath, 'utf-8');
    } catch (error) {
      // Fallback minimal template if file doesn't exist
      return `# {PROJECT_NAME}\n\n{PROJECT_DESCRIPTION}\n\n- **Type**: {PROJECT_TYPE}\n- **Status**: {PROJECT_STATUS}\n- **Repo**: {REPO_URL}\n- **Wiki**: {WIKI_URL}\n`;
    }
  }
}
