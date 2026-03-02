/**
 * OSSA API Server — standalone entrypoint
 *
 * Usage: ossa serve [--port 3000] [--cors-origin '*']
 */

import { createApp } from './index.js';

export function startServer(opts?: {
  port?: number;
  corsOrigin?: string;
}): void {
  const port = opts?.port ?? parseInt(process.env.OSSA_API_PORT || '3000', 10);
  const app = createApp({ corsOrigin: opts?.corsOrigin });

  app.listen(port, () => {
    console.log(`OSSA API server listening on http://localhost:${port}`);
    console.log(`  Health:    GET  http://localhost:${port}/health`);
    console.log(`  Manifests: GET  http://localhost:${port}/api/v1/manifests`);
    console.log(
      `  Wizard:    POST http://localhost:${port}/api/v1/wizard/sessions`
    );
    console.log(`  Export:    POST http://localhost:${port}/api/v1/export`);
    console.log(`  Convert:   POST http://localhost:${port}/api/v1/convert`);
    console.log(`  Skills:    GET  http://localhost:${port}/api/v1/skills`);
    console.log(
      `  Workspace: GET  http://localhost:${port}/api/v1/workspace/status`
    );
  });
}
