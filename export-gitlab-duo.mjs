import { GitLabDuoPackageGenerator } from './dist/adapters/gitlab/package-generator.js';
import { ManifestRepository } from './dist/repositories/manifest.repository.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const manifestRepo = new ManifestRepository();
  const manifest = await manifestRepo.load('examples/mr-reviewer-with-governance.ossa.yaml');

  const generator = new GitLabDuoPackageGenerator();
  const result = await generator.generate(manifest, {
    includeFlow: true,
    includeExternalAgent: true,
    includeRouters: true,
    includeTriggers: true,
    includeDocumentation: true,
    outputDir: '/Users/thomas.scola/Library/Mobile Documents/com~apple~CloudDocs/AgentPlatform/TESTS/gitlab-duo-package',
  });

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.success) {
    const outputDir = '/Users/thomas.scola/Library/Mobile Documents/com~apple~CloudDocs/AgentPlatform/TESTS/gitlab-duo-package';
    fs.mkdirSync(outputDir, { recursive: true });

    if (result.files && Array.isArray(result.files)) {
      for (const file of result.files) {
        const filePath = path.join(outputDir, file.path);
        const fileDir = path.dirname(filePath);
        fs.mkdirSync(fileDir, { recursive: true });
        fs.writeFileSync(filePath, file.content);
      }

      console.log('✓ Generated GitLab Duo package');
      console.log('  Files:', result.files.length);
      console.log('  Output:', outputDir);
    } else {
      console.error('No files generated');
    }
  } else {
    console.error('Failed:', result.error);
  }
}

main().catch(console.error);
