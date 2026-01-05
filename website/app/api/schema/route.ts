import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version') || '0.3.3';

    const schemaPath = join(process.cwd(), 'public', 'schemas', `ossa-${version}.schema.json`);
    
    try {
      const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
      return NextResponse.json(schema);
    } catch (error) {
      // Try to fetch from GitLab if local doesn't exist
      const gitlabUrl = `https://gitlab.com/api/v4/projects/76265294/repository/files/spec%2Fv${version}%2Fossa-${version}.schema.json/raw?ref=release/v0.3.x`;
      
      try {
        const response = await fetch(gitlabUrl, {
          headers: {
            'PRIVATE-TOKEN': process.env.GITLAB_TOKEN || '',
          },
        });
        
        if (response.ok) {
          const schema = await response.json();
          return NextResponse.json(schema);
        }
      } catch (fetchError) {
        // Fall through to error
      }

      return NextResponse.json(
        {
          error: `Schema v${version} not found locally or in GitLab`,
        },
        { status: 404 }
      );
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
