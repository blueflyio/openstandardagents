/**
 * OSSA Daemon Command
 * Local development daemon for Neural Forge real-time builder integration
 *
 * @experimental This feature is experimental and may change without notice.
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { AuditLogService } from '../../services/daemon/audit-log.service.js';
import { ExecutionService } from '../../services/daemon/execution.service.js';
import { FileWatcherService } from '../../services/daemon/fs-watcher.service.js';
import { PairingService } from '../../services/daemon/pairing.service.js';
import { SkillAggregatorService } from '../../services/daemon/skill-aggregator.service.js';
import { SSEEndpoints } from '../../services/daemon/sse-endpoints.js';
import { DaemonWebSocketServer } from '../../services/daemon/ws-server.js';

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

export const daemonCommand = new Command('daemon')
  .argument('[workspace]', 'Path to workspace directory', '.')
  .option('-p, --port <port>', 'Port to bind daemon on', '4242')
  .option('--host <host>', 'Host to bind on (127.0.0.1 for security)', '127.0.0.1')
  .option('--no-pair', 'Disable pairing requirement (dev mode only)')
  .option('--no-watch', 'Disable file watching')
  .option('-v, --verbose', 'Verbose logging')
  .description('Start Neural Forge daemon for real-time builder integration')
  .action(
    async (
      workspace: string,
      options: {
        port?: string;
        host?: string;
        pair?: boolean;
        watch?: boolean;
        verbose?: boolean;
      }
    ) => {
      const port = parseInt(options.port || '4242', 10);
      const host = options.host || '127.0.0.1';
      const workspaceRoot = path.resolve(workspace);
      const pairingEnabled = options.pair !== false;

      // Security: never bind to 0.0.0.0
      if (host === '0.0.0.0') {
        console.error(
          chalk.red(
            'SECURITY: Binding to 0.0.0.0 is not allowed. Use 127.0.0.1 (default) for localhost-only access.'
          )
        );
        process.exit(1);
      }

      if (!pairingEnabled) {
        console.warn(
          chalk.yellow(
            'WARNING: Pairing disabled (--no-pair). Any local process can connect. For development only.'
          )
        );
      }

      try {
        // Initialize services
        const pairingService = container.get(PairingService);
        const auditLog = container.get(AuditLogService);
        const wsServer = container.get(DaemonWebSocketServer);
        const fileWatcher = container.get(FileWatcherService);
        const sseEndpoints = container.get(SSEEndpoints);
        const skillAggregator = container.get(SkillAggregatorService);
        const executionService = container.get(ExecutionService);
        const manifestRepo = container.get(ManifestRepository);

        // Initialize audit log
        await auditLog.initialize();

        const startTime = Date.now();

        // ── Middleware helpers ──

        /** Validate pairing token from Authorization header */
        function authenticateRequest(req: http.IncomingMessage): string | null {
          if (!pairingEnabled) return 'dev-session';
          const auth = req.headers['authorization'];
          if (!auth?.startsWith('Bearer ')) return null;
          const token = auth.slice(7);
          const session = pairingService.verifyToken(token);
          return session ? session.sessionId : null;
        }

        /** Check origin allowlist */
        function isAllowedOrigin(req: http.IncomingMessage): boolean {
          const origin = req.headers['origin'] || '';
          if (!origin) return true; // Same-origin requests have no Origin header
          return pairingService.isOriginAllowed(origin);
        }

        /** Read request body with size limit */
        function readBody(req: http.IncomingMessage): Promise<string> {
          return new Promise((resolve, reject) => {
            let body = '';
            let size = 0;
            req.on('data', (chunk: Buffer) => {
              size += chunk.length;
              if (size > MAX_BODY_SIZE) {
                req.destroy();
                reject(new Error('Request body too large'));
                return;
              }
              body += chunk.toString();
            });
            req.on('end', () => resolve(body));
            req.on('error', reject);
          });
        }

        /** Send JSON response */
        function json(res: http.ServerResponse, status: number, data: unknown): void {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        }

        /** Send error response */
        function error(res: http.ServerResponse, status: number, msg: string): void {
          json(res, status, { error: msg, message: msg });
        }

        // ── HTTP Server ──

        const server = http.createServer(async (req, res) => {
          const parsedUrl = url.parse(req.url || '/', true);
          const pathname = parsedUrl.pathname || '/';
          const method = req.method || 'GET';

          // CORS headers (restricted origins)
          const origin = req.headers['origin'] || '';
          if (pairingService.isOriginAllowed(origin) || !origin) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          }

          if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          // Origin check
          if (!isAllowedOrigin(req)) {
            error(res, 403, 'Origin not allowed');
            return;
          }

          try {
            // ── Unauthenticated routes ──

            if (pathname === '/health' && method === 'GET') {
              json(res, 200, {
                status: 'ok',
                version: '0.4.0',
                uptime: Math.floor((Date.now() - startTime) / 1000),
                workspace: {
                  path: workspaceRoot,
                  manifestCount: fileWatcher.getFileTree().length,
                },
                activeSessions: pairingService.getActiveSessions().length,
              });
              return;
            }

            if (pathname === '/pair' && method === 'POST') {
              const body = JSON.parse(await readBody(req));
              const code = body?.code;
              if (!code || !/^\d{6}$/.test(code)) {
                error(res, 400, 'Invalid pairing code format');
                return;
              }
              const session = pairingService.pair(code, origin);
              if (!session) {
                await auditLog.log({ action: 'pair', origin, result: 'failure' });
                error(res, 401, 'Invalid or expired pairing code');
                return;
              }
              await auditLog.log({
                action: 'pair',
                origin,
                sessionId: session.sessionId,
                result: 'success',
              });
              json(res, 200, {
                sessionId: session.sessionId,
                token: session.token,
                expiresAt: session.expiresAt.toISOString(),
              });
              return;
            }

            // ── Authenticated routes ──

            const sessionId = authenticateRequest(req);
            if (!sessionId) {
              error(res, 401, 'Authentication required');
              return;
            }

            // DELETE /pair/:sessionId
            const pairMatch = pathname.match(/^\/pair\/([^/]+)$/);
            if (pairMatch && method === 'DELETE') {
              const revoked = pairingService.revokeSession(pairMatch[1]);
              if (revoked) {
                await auditLog.log({
                  action: 'session_revoke',
                  sessionId: pairMatch[1],
                  result: 'success',
                });
              }
              json(res, revoked ? 200 : 404, { revoked });
              return;
            }

            // GET /workspace
            if (pathname === '/workspace' && method === 'GET') {
              const files = fileWatcher.getFileTree();
              const manifests = [];
              for (const file of files) {
                if (file.path.endsWith('.ossa.yaml') || file.path.endsWith('.ossa.yml')) {
                  try {
                    const abs = path.join(workspaceRoot, file.path);
                    const manifest = await manifestRepo.load(abs);
                    manifests.push({
                      path: file.path,
                      kind: manifest.kind || 'Agent',
                      name: manifest.metadata?.name || path.basename(file.path),
                      version: manifest.metadata?.version,
                    });
                  } catch {
                    // Skip invalid manifests
                  }
                }
              }
              json(res, 200, { root: workspaceRoot, files, manifests });
              return;
            }

            // GET /workspace/files
            if (pathname === '/workspace/files' && method === 'GET') {
              json(res, 200, { root: workspaceRoot, entries: fileWatcher.getFileTree() });
              return;
            }

            // PUT /workspace/files/:path
            const fileMatch = pathname.match(/^\/workspace\/files\/(.+)$/);
            if (fileMatch && method === 'PUT') {
              const filePath = decodeURIComponent(fileMatch[1]);
              if (!fileWatcher.isPathSafe(path.join(workspaceRoot, filePath))) {
                await auditLog.log({
                  action: 'file_write',
                  sessionId,
                  path: filePath,
                  result: 'failure',
                  detail: 'Path traversal attempt',
                });
                error(res, 400, 'Invalid file path');
                return;
              }
              const body = JSON.parse(await readBody(req));
              const content = body?.content;
              if (!content) {
                error(res, 400, 'Content required');
                return;
              }
              const fs = await import('fs');
              const absPath = path.join(workspaceRoot, filePath);
              if (body.createDirectories) {
                fs.mkdirSync(path.dirname(absPath), { recursive: true });
              }
              fs.writeFileSync(absPath, content, 'utf-8');
              await auditLog.log({
                action: 'file_write',
                sessionId,
                path: filePath,
                result: 'success',
              });
              json(res, 200, { path: filePath, written: true, validated: false });
              return;
            }

            // GET /skills
            if (pathname === '/skills' && method === 'GET') {
              const source = parsedUrl.query?.source as string | undefined;
              const search = parsedUrl.query?.search as string | undefined;
              let skills;
              if (search) {
                skills = await skillAggregator.search(search);
              } else if (source) {
                skills = await skillAggregator.getBySource(source);
              } else {
                skills = await skillAggregator.loadAll();
              }
              json(res, 200, { skills, sources: skillAggregator.getSourceStatus() });
              return;
            }

            // POST /skills/install
            if (pathname === '/skills/install' && method === 'POST') {
              const body = JSON.parse(await readBody(req));
              await auditLog.log({
                action: 'skill_install',
                sessionId,
                path: body?.name,
                result: 'success',
              });
              json(res, 200, { installed: true, path: body?.targetPath || '.', files: [] });
              return;
            }

            // POST /execute
            if (pathname === '/execute' && method === 'POST') {
              const body = JSON.parse(await readBody(req));
              const execution = await executionService.start(
                body.manifestPath,
                body.input,
                body.runtime
              );
              await auditLog.log({
                action: 'execute',
                sessionId,
                path: body.manifestPath,
                result: 'success',
              });
              json(res, 200, {
                executionId: execution.id,
                status: execution.status,
                sseUrl: `/sse/execution/${execution.id}`,
              });
              return;
            }

            // GET /execute/:id
            const execGetMatch = pathname.match(/^\/execute\/([^/]+)$/);
            if (execGetMatch && method === 'GET') {
              const execution = executionService.getExecution(execGetMatch[1]);
              if (!execution) {
                error(res, 404, 'Execution not found');
                return;
              }
              json(res, 200, execution);
              return;
            }

            // DELETE /execute/:id
            if (execGetMatch && method === 'DELETE') {
              const cancelled = await executionService.cancel(execGetMatch[1]);
              if (cancelled) {
                await auditLog.log({
                  action: 'execute_cancel',
                  sessionId,
                  path: execGetMatch[1],
                  result: 'success',
                });
              }
              json(res, cancelled ? 200 : 404, { cancelled, executionId: execGetMatch[1] });
              return;
            }

            // SSE endpoints — pass token from Authorization header
            const token = req.headers['authorization']?.slice(7) || parsedUrl.query?.token as string || '';
            if (pathname.startsWith('/sse/execution/') && method === 'GET') {
              const execId = pathname.split('/').pop() || '';
              sseEndpoints.streamExecution(execId, res, token);
              return;
            }
            if (pathname === '/sse/workspace' && method === 'GET') {
              sseEndpoints.streamWorkspace(res, token);
              return;
            }
            if (pathname === '/sse/status' && method === 'GET') {
              sseEndpoints.streamStatus(res, token);
              return;
            }

            // 404
            error(res, 404, `Not found: ${pathname}`);
          } catch (err: any) {
            if (options.verbose) {
              console.error(chalk.red('[ERROR]'), err);
            }
            error(res, 500, err.message || 'Internal server error');
          }
        });

        // Attach WebSocket server
        wsServer.attach(server);

        // Start file watcher
        if (options.watch !== false) {
          fileWatcher.start(workspaceRoot);
          fileWatcher.onFileChange((event) => {
            wsServer.broadcast({
              type: 'file_changed' as any,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              payload: event,
              metadata: { agentId: 'daemon' },
            });
          });
        }

        // Pre-load skills
        skillAggregator.loadAll().catch(() => {
          // Graceful — skills load in background
        });

        // Start server
        server.listen(port, host, () => {
          console.log('');
          console.log(
            chalk.blue.bold('  OSSA Neural Forge Daemon')
          );
          console.log(chalk.gray('  ───────────────────────────'));
          console.log(`  ${chalk.green('Server:')}    http://${host}:${port}`);
          console.log(`  ${chalk.green('WebSocket:')} ws://${host}:${port}/ws`);
          console.log(`  ${chalk.green('Workspace:')} ${workspaceRoot}`);
          console.log(`  ${chalk.green('Watching:')}  ${options.watch !== false ? 'Yes' : 'No'}`);
          console.log(`  ${chalk.green('Pairing:')}   ${pairingEnabled ? 'Required' : chalk.yellow('Disabled')}`);

          if (pairingEnabled) {
            console.log('');
            console.log(chalk.cyan('  Pairing code:'));
            // Display pairing code and refresh
            const displayCode = () => {
              const code = pairingService.getCurrentCode();
              process.stdout.write(
                `\r  ${chalk.bgCyan.black.bold(` ${code} `)}  ${chalk.gray('(refreshes every 60s)')}`
              );
            };
            displayCode();
            setInterval(displayCode, 1000);
          }

          console.log('');
          console.log(chalk.gray('  Press Ctrl+C to stop'));
          console.log('');
        });

        // Forward execution events to WebSocket clients
        executionService.on('execution_event', (event: any) => {
          wsServer.broadcast({
            type: 'execution_output' as any,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            payload: event,
            metadata: { agentId: 'daemon' },
          });
        });

        // Graceful shutdown
        const shutdown = () => {
          console.log(chalk.yellow('\n  Shutting down daemon...'));
          fileWatcher.stop();
          wsServer.close();
          server.close(() => {
            console.log(chalk.green('  Daemon stopped'));
            process.exit(0);
          });
          // Force exit after 5s
          setTimeout(() => process.exit(0), 5000);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (err: any) {
        console.error(chalk.red('[ERROR]'), err.message);
        if (options.verbose && err.stack) {
          console.error(chalk.gray(err.stack));
        }
        process.exit(1);
      }
    }
  );
