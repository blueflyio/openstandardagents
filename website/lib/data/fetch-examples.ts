/**
 * Examples Repository - CRUD Operations
 *
 * SOLID:
 * - Single Responsibility: Only handles examples data
 * - Open/Closed: Extensible via ExamplesRepository interface
 * - Dependency Inversion: Depends on abstractions (GitLabClient)
 *
 * DRY: Uses shared client and schemas
 */

import { z } from 'zod';
import { getGitLabClient, Result, ok, err, DataFetchError } from './client';
import { Example, ExampleSchema, ExamplesArraySchema, ExampleCategory } from './schemas';
import { getExampleCategory } from './sources';

// =============================================================================
// REPOSITORY INTERFACE (Open/Closed Principle)
// =============================================================================

export interface IExamplesRepository {
  findAll(): Promise<Result<Example[], DataFetchError>>;
  findByCategory(category: ExampleCategory): Promise<Result<Example[], DataFetchError>>;
  findByPath(path: string): Promise<Result<Example | null, DataFetchError>>;
}

// =============================================================================
// GITLAB EXAMPLES REPOSITORY
// =============================================================================

export class GitLabExamplesRepository implements IExamplesRepository {
  private readonly client = getGitLabClient();
  private readonly basePath = 'examples';

  /**
   * Recursively get all YAML files from examples/ folder
   */
  private async getExampleFiles(path: string = this.basePath): Promise<Result<string[], DataFetchError>> {
    const files: string[] = [];
    const treeResult = await this.client.fetchTree(path);

    if (!treeResult.ok) {
      return err(treeResult.error);
    }

    for (const item of treeResult.data) {
      if (item.type === 'tree') {
        // Recurse into subdirectories
        const subFilesResult = await this.getExampleFiles(item.path);
        if (subFilesResult.ok) {
          files.push(...subFilesResult.data);
        }
      } else if (item.name.endsWith('.yaml') || item.name.endsWith('.yml')) {
        files.push(item.path);
      }
    }

    return ok(files);
  }

  /**
   * READ: Fetch all examples
   */
  async findAll(): Promise<Result<Example[], DataFetchError>> {
    console.log('Fetching examples from openstandardagents repo...');

    const filesResult = await this.getExampleFiles();
    if (!filesResult.ok) {
      return err(filesResult.error);
    }

    console.log(`Found ${filesResult.data.length} example files`);

    const examples: Example[] = [];

    for (const filePath of filesResult.data) {
      const contentResult = await this.client.fetchFile(filePath);
      if (contentResult.ok) {
        const relativePath = filePath.replace(/^examples\//, '');
        const example: Example = {
          name: filePath.split('/').pop() || filePath,
          path: relativePath,
          content: contentResult.data,
          category: getExampleCategory(relativePath),
        };

        // Validate with Zod
        const parsed = ExampleSchema.safeParse(example);
        if (parsed.success) {
          examples.push(parsed.data);
        } else {
          console.warn(`Invalid example ${filePath}:`, parsed.error.message);
        }
      }
    }

    console.log(`Fetched ${examples.length} valid examples`);
    return ok(examples);
  }

  /**
   * READ: Find examples by category
   */
  async findByCategory(category: ExampleCategory): Promise<Result<Example[], DataFetchError>> {
    const allResult = await this.findAll();
    if (!allResult.ok) {
      return err(allResult.error);
    }

    return ok(allResult.data.filter((e) => e.category === category));
  }

  /**
   * READ: Find example by path
   */
  async findByPath(path: string): Promise<Result<Example | null, DataFetchError>> {
    const contentResult = await this.client.fetchFile(`${this.basePath}/${path}`);
    if (!contentResult.ok) {
      if (contentResult.error.statusCode === 404) {
        return ok(null);
      }
      return err(contentResult.error);
    }

    const example: Example = {
      name: path.split('/').pop() || path,
      path,
      content: contentResult.data,
      category: getExampleCategory(path),
    };

    const parsed = ExampleSchema.safeParse(example);
    if (!parsed.success) {
      return ok(null);
    }

    return ok(parsed.data);
  }
}

// =============================================================================
// SERVICE LAYER (Business Logic)
// =============================================================================

export class ExamplesService {
  constructor(private readonly repository: IExamplesRepository = new GitLabExamplesRepository()) {}

  /**
   * Fetch all examples (main entry point)
   */
  async fetchExamples(): Promise<Example[]> {
    const result = await this.repository.findAll();
    if (!result.ok) {
      console.error('Failed to fetch examples:', result.error.message);
      return [];
    }
    return result.data;
  }

  /**
   * Save examples to JSON file
   */
  async saveExamples(examples: Example[], outputPath: string): Promise<void> {
    // Validate before saving
    const parsed = ExamplesArraySchema.safeParse(examples);
    if (!parsed.success) {
      throw new Error(`Invalid examples data: ${parsed.error.message}`);
    }

    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(parsed.data, null, 2));
    console.log(`Saved ${examples.length} examples to ${outputPath}`);
  }
}

// =============================================================================
// EXPORTS (Backward Compatibility)
// =============================================================================

const defaultService = new ExamplesService();

export async function fetchExamples(): Promise<Example[]> {
  return defaultService.fetchExamples();
}

export async function saveExamples(examples: Example[], outputPath: string): Promise<void> {
  return defaultService.saveExamples(examples, outputPath);
}

export type { Example } from './schemas';

// =============================================================================
// CLI ENTRY POINT
// =============================================================================

if (require.main === module || process.argv[1]?.includes('fetch-examples')) {
  (async () => {
    const path = await import('path');
    const service = new ExamplesService();
    const examples = await service.fetchExamples();
    const outputPath = path.join(process.cwd(), 'public/examples.json');
    await service.saveExamples(examples, outputPath);
  })().catch(console.error);
}
