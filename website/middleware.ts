import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auto-sync on homepage visit (once per hour)
  if (request.nextUrl.pathname === '/') {
    const syncHeader = request.headers.get('x-auto-sync');
    if (syncHeader !== 'done') {
      // Trigger background sync (non-blocking)
      fetch(`${request.nextUrl.origin}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {
        // Ignore errors - sync is best effort
      });
    }
  }

  return NextResponse.next({
    headers: {
      'x-auto-sync': 'done',
    },
  });
}

export const config = {
  matcher: '/',
};
