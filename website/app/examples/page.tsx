import fs from 'fs';
import path from 'path';
import { Suspense } from 'react';
import { ExamplesViewer } from '@/components/examples/ExamplesViewer';

interface ExampleFile {
  name: string;
  path: string;
  content: string;
  category: string;
}

function getAllExamples(): ExampleFile[] {
  try {
    // Try multiple absolute paths
    const paths = [
      path.resolve(process.cwd(), 'public', 'examples.json'),
      path.join(process.cwd(), 'public', 'examples.json'),
      path.resolve(__dirname, '..', '..', 'public', 'examples.json'),
    ];
    
    for (const examplesJsonPath of paths) {
      if (fs.existsSync(examplesJsonPath)) {
        const content = fs.readFileSync(examplesJsonPath, 'utf8');
        const examples = JSON.parse(content);
        if (Array.isArray(examples) && examples.length > 0) {
          return examples;
        }
      }
    }
    
    // If still not found, try reading from public directory directly
    const publicDir = path.resolve(process.cwd(), 'public');
    const directPath = path.join(publicDir, 'examples.json');
    if (fs.existsSync(directPath)) {
      const content = fs.readFileSync(directPath, 'utf8');
      const examples = JSON.parse(content);
      if (Array.isArray(examples)) {
        return examples;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error loading examples:', error);
    return [];
  }
}

export default function ExamplesPage() {
  const examples = getAllExamples();

  // Group examples by category with counts
  const categoryStats = examples.reduce((acc, ex) => {
    acc[ex.category] = (acc[ex.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-accent to-secondary text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">OSSA Examples Gallery</h1>
          <p className="text-xl text-white/90 mb-2">
            {examples.length}+ real-world Open Standard Agents manifests
          </p>
          <p className="text-base text-white/80">
            Learn from production-ready implementations across multiple frameworks
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/20">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-wrap gap-6 justify-center items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{examples.length}</div>
              <div className="text-sm text-gray-600">Total Examples</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">{Object.keys(categoryStats).length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">15+</div>
              <div className="text-sm text-gray-600">Frameworks</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading examples...</p>
          </div>
        }>
          <ExamplesViewer examples={examples} />
        </Suspense>
      </div>
    </>
  );
}

