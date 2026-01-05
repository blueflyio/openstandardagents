import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const version = searchParams.get('version') || '0.3.3';

    const examplesPath = join(process.cwd(), 'public', 'examples.json');
    
    try {
      const examples = JSON.parse(readFileSync(examplesPath, 'utf-8'));
      
      let filtered = Array.isArray(examples) ? examples : [];
      
      if (category) {
        filtered = filtered.filter((ex: any) => 
          ex.category?.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Filter by version if specified
      if (version) {
        filtered = filtered.filter((ex: any) => {
          const content = ex.content || '';
          return content.includes(`apiVersion: ossa/v${version}`) || 
                 content.includes(`"apiVersion": "ossa/v${version}"`);
        });
      }

      return NextResponse.json({
        count: filtered.length,
        examples: filtered,
        version,
      });
    } catch (error) {
      // If examples.json doesn't exist, try to fetch dynamically
      return NextResponse.json({
        count: 0,
        examples: [],
        error: 'Examples not synced yet. Call /api/sync first.',
        version,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
