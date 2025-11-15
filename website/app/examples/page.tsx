import fs from 'fs';
import path from 'path';
import { ExamplesViewer } from '@/components/examples/ExamplesViewer';

interface ExampleFile {
  name: string;
  path: string;
  content: string;
  category: string;
}

function getAllExamples(): ExampleFile[] {
  const examplesDir = path.join(process.cwd(), '../../examples');
  const examples: ExampleFile[] = [];

  if (!fs.existsSync(examplesDir)) {
    return examples;
  }

  function traverseDir(dir: string, category = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(examplesDir, fullPath);

      if (entry.isDirectory()) {
        traverseDir(fullPath, entry.name);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.yml') ||
          entry.name.endsWith('.yaml') ||
          entry.name.endsWith('.json') ||
          entry.name.endsWith('.ts'))
      ) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          examples.push({
            name: entry.name,
            path: relativePath,
            content,
            category: category || 'root',
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  traverseDir(examplesDir);
  return examples;
}

export default function ExamplesPage(): JSX.Element {
  const examples = getAllExamples();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Open Standard Agents Examples</h1>
      <p className="text-lg text-gray-600 mb-8">
        Browse example Open Standard Agents manifests and learn from real-world
        implementations across Cursor, OpenAI, CrewAI, LangChain, Anthropic, and more.
      </p>
      <ExamplesViewer examples={examples} />
    </div>
  );
}

