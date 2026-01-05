import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const results: Record<string, any> = {};

    // Sync spec schemas
    try {
      await execAsync('npm run fetch-spec', { cwd: process.cwd() });
      results.spec = 'synced';
    } catch (e) {
      results.spec = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    // Sync examples
    try {
      await execAsync('npm run fetch-examples', { cwd: process.cwd() });
      results.examples = 'synced';
    } catch (e) {
      results.examples = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    // Sync highlights
    try {
      await execAsync('npm run fetch-highlights', { cwd: process.cwd() });
      results.highlights = 'synced';
    } catch (e) {
      results.highlights = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    // Sync versions
    try {
      await execAsync('npm run fetch-versions', { cwd: process.cwd() });
      results.versions = 'synced';
    } catch (e) {
      results.versions = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
