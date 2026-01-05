import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read from versions.json (auto-updated by fetch-versions)
    const versionsPath = join(process.cwd(), 'lib', 'versions.json');
    const versions = JSON.parse(readFileSync(versionsPath, 'utf-8'));

    // Read from release-highlights.json (auto-updated by fetch-highlights)
    const highlightsPath = join(process.cwd(), 'lib', 'release-highlights.json');
    let highlights;
    try {
      highlights = JSON.parse(readFileSync(highlightsPath, 'utf-8'));
    } catch {
      highlights = null;
    }

    return NextResponse.json({
      stable: versions.stable,
      latest: versions.latest,
      dev: versions.dev,
      all: versions.all || [],
      highlights: highlights ? {
        version: highlights.version,
        overview: highlights.overview,
        features: highlights.features?.length || 0,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: {
          stable: '0.3.3',
          latest: '0.3.3',
        },
      },
      { status: 500 }
    );
  }
}
