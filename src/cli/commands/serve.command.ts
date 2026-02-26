/**
 * OSSA Serve Command
 * Local development server for OSSA agents
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import type { OssaAgent } from '../../types/index.js';

export const serveCommand = new Command('serve')
  .argument('<path>', 'Path to OSSA manifest or directory')
  .option('-p, --port <port>', 'Port to run server on', '3000')
  .option('--mock-llm', 'Use mock LLM provider (no API keys required)')
  .option('--watch', 'Watch for manifest changes and reload')
  .option('-v, --verbose', 'Verbose logging')
  .description('Start local development server for OSSA agents')
  .action(
    async (
      manifestPath: string,
      options: {
        port?: string;
        mockLlm?: boolean;
        watch?: boolean;
        verbose?: boolean;
      }
    ) => {
      try {
        const manifestRepo = container.get(ManifestRepository);
        const port = parseInt(options.port || '3000', 10);

        // Load manifest(s)
        const manifests: Array<{ path: string; manifest: OssaAgent }> = [];
        const stat = fs.statSync(manifestPath);

        if (stat.isDirectory()) {
          // Find all .ossa.yaml files in directory
          const findManifests = async (dir: string): Promise<void> => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (
                entry.isDirectory() &&
                entry.name !== 'node_modules' &&
                entry.name !== 'dist'
              ) {
                await findManifests(fullPath);
              } else if (
                entry.isFile() &&
                (entry.name.endsWith('.ossa.yaml') ||
                  entry.name.endsWith('.ossa.yml'))
              ) {
                try {
                  const manifest = await manifestRepo.load(fullPath);
                  manifests.push({ path: fullPath, manifest });
                } catch (error: any) {
                  if (options.verbose) {
                    console.warn(
                      chalk.yellow(
                        `Failed to load ${fullPath}: ${error.message}`
                      )
                    );
                  }
                }
              }
            }
          };
          await findManifests(manifestPath);
        } else {
          // Single file
          const manifest = await manifestRepo.load(manifestPath);
          manifests.push({ path: manifestPath, manifest });
        }

        if (manifests.length === 0) {
          console.error(chalk.red('No valid OSSA manifests found'));
          process.exit(1);
        }

        console.log(
          chalk.blue(`\nStarting OSSA development server on port ${port}...`)
        );
        console.log(
          chalk.gray(`Loaded ${manifests.length} agent manifest(s)\n`)
        );

        // Create simple HTTP server
        const http = await import('http');
        const url = await import('url');

        const server = http.createServer(async (req, res) => {
          const parsedUrl = url.parse(req.url || '/', true);
          const pathname = parsedUrl.pathname || '/';

          // CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          // Routes
          if (pathname === '/' || pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify(
                {
                  status: 'ok',
                  agents: manifests.length,
                  port,
                  mockLlm: options.mockLlm || false,
                },
                null,
                2
              )
            );
            return;
          }

          if (pathname === '/docs' || pathname === '/swagger') {
            // Generate simple OpenAPI spec
            const openapi: {
              openapi: string;
              info: {
                title: string;
                version: string;
                description: string;
              };
              servers: Array<{ url: string; description: string }>;
              paths: Record<string, any>;
            } = {
              openapi: '3.1.0',
              info: {
                title: 'OSSA Development Server',
                version: '0.3.0',
                description: 'Local development server for OSSA agents',
              },
              servers: [
                {
                  url: `http://localhost:${port}`,
                  description: 'Local development server',
                },
              ],
              paths: {},
            };

            // Add agent endpoints
            for (const { manifest } of manifests) {
              const agentName = manifest.metadata?.name || 'agent';
              if (manifest.agent?.capabilities) {
                for (const cap of manifest.agent.capabilities) {
                  const path = `/agents/${agentName}/capabilities/${cap.name}`;
                  openapi.paths[path] = {
                    post: {
                      summary: cap.description || cap.name,
                      requestBody: {
                        content: {
                          'application/json': {
                            schema: cap.input_schema || {},
                          },
                        },
                      },
                      responses: {
                        '200': {
                          description: 'Success',
                          content: {
                            'application/json': {
                              schema: cap.output_schema || {},
                            },
                          },
                        },
                      },
                    },
                  };
                }
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(openapi, null, 2));
            return;
          }

          if (pathname === '/openapi.json') {
            // Same as /docs but explicit
            const parsedUrl2 = url.parse(req.url || '/', true);
            if (parsedUrl2.pathname === '/openapi.json') {
              // Redirect to /docs
              res.writeHead(302, { Location: '/docs' });
              res.end();
              return;
            }
          }

          // Agent capability endpoints
          const agentMatch = pathname.match(
            /^\/agents\/([^/]+)\/capabilities\/([^/]+)$/
          );
          if (agentMatch && req.method === 'POST') {
            const [, agentName, capabilityName] = agentMatch;
            const agentData = manifests.find(
              (m) => (m.manifest.metadata?.name || 'agent') === agentName
            );

            if (!agentData) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Agent not found' }));
              return;
            }

            // Mock capability execution
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', () => {
              try {
                const input = body ? JSON.parse(body) : {};

                if (options.verbose) {
                  console.log(
                    chalk.gray(
                      `[${new Date().toISOString()}] ${agentName}/${capabilityName} - ${JSON.stringify(input)}`
                    )
                  );
                }

                // Mock response
                const mockOutput = {
                  success: true,
                  agent: agentName,
                  capability: capabilityName,
                  input,
                  output: options.mockLlm
                    ? {
                        message:
                          'Mock LLM response - use real API keys for actual execution',
                      }
                    : { message: 'Capability executed (mock mode)' },
                  timestamp: new Date().toISOString(),
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(mockOutput, null, 2));
              } catch (error: any) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
              }
            });
            return;
          }

          // 404
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found', path: pathname }));
        });

        server.listen(port, () => {
          console.log(
            chalk.green(`\n✓ Server running at http://localhost:${port}`)
          );
          console.log(chalk.blue(`\nAvailable endpoints:`));
          console.log(`  GET  /health          - Health check`);
          console.log(`  GET  /docs            - OpenAPI spec`);
          console.log(`  GET  /openapi.json    - OpenAPI spec (JSON)`);
          console.log(
            `  POST /agents/:name/capabilities/:cap - Execute capability`
          );
          console.log(chalk.gray(`\nPress Ctrl+C to stop\n`));

          if (options.watch) {
            console.log(
              chalk.yellow(
                'Watch mode enabled - reloading on manifest changes...'
              )
            );
            // Simple file watcher
            const watchPaths = manifests.map((m) => m.path);
            for (const watchPath of watchPaths) {
              fs.watchFile(watchPath, { interval: 1000 }, () => {
                console.log(chalk.blue(`\nManifest changed: ${watchPath}`));
                console.log(chalk.yellow('Restart server to reload changes'));
              });
            }
          }
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
          console.log(chalk.yellow('\n\nShutting down server...'));
          server.close(() => {
            console.log(chalk.green('Server stopped'));
            process.exit(0);
          });
        });
      } catch (error: any) {
        console.error(chalk.red('[ERROR]'), error.message);
        if (options.verbose && error.stack) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    }
  );
