import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'alive',
    service: 'ossa-website',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
