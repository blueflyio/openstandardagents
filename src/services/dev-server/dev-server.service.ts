/**
 * Development Server Service
 *
 * Orchestrates file watching, validation, and WebSocket updates
 *
 * Features:
 * - Hot reload on manifest changes
 * - Real-time validation
 * - WebSocket updates to clients
 * - HTTP server with test UI
 *
 * SOLID: Single Responsibility - Dev server orchestration
 */

import { createServer, Server } from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { FileWatcher, type FileChangeEvent } from './file-watcher.js';
import { LiveValidator, type ValidationResult } from './live-validator.js';
import { DevWebSocketServer } from './websocket-server.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DevServerOptions {
  /**
   * File or directory to watch
   */
  watch: string;

  /**
   * HTTP server port
   * @default 3000
   */
  port?: number;

  /**
   * Auto-open browser
   * @default false
   */
  open?: boolean;

  /**
   * Debounce delay for file changes (ms)
   * @default 300
   */
  debounceMs?: number;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;
}

export interface DevServerStats {
  /**
   * Server start time
   */
  startTime: Date;

  /**
   * Number of watched files
   */
  watchedFiles: number;

  /**
   * Number of connected clients
   */
  connectedClients: number;

  /**
   * Total file changes detected
   */
  fileChanges: number;

  /**
   * Total validations performed
   */
  validations: number;

  /**
   * Latest validation result
   */
  latestValidation?: ValidationResult;
}

/**
 * Development Server
 *
 * Provides hot reload and live validation for OSSA manifests
 */
export class DevServer {
  private fileWatcher?: FileWatcher;
  private validator: LiveValidator;
  private wsServer: DevWebSocketServer;
  private httpServer?: Server;
  private options: Required<DevServerOptions>;
  private stats: DevServerStats;

  constructor(options: DevServerOptions) {
    this.options = {
      port: 3000,
      open: false,
      debounceMs: 300,
      verbose: false,
      ...options,
    };

    this.validator = new LiveValidator({
      semanticValidation: true,
      bestPractices: true,
      caching: true,
    });

    this.wsServer = new DevWebSocketServer({
      path: '/ws',
    });

    this.stats = {
      startTime: new Date(),
      watchedFiles: 0,
      connectedClients: 0,
      fileChanges: 0,
      validations: 0,
    };
  }

  /**
   * Start development server
   */
  async start(): Promise<void> {
    console.log('🚀 Starting OSSA Development Server...\n');

    // Create HTTP server
    this.httpServer = createServer(this.handleRequest.bind(this));

    // Start WebSocket server (attached to HTTP server)
    this.wsServer = new DevWebSocketServer({
      server: this.httpServer,
      path: '/ws',
    });
    await this.wsServer.start();

    // Start file watcher
    this.fileWatcher = new FileWatcher({
      paths: [this.options.watch],
      debounceMs: this.options.debounceMs,
    });

    this.fileWatcher.onChange(this.handleFileChange.bind(this));
    await this.fileWatcher.start();

    // Update stats
    this.stats.watchedFiles = this.fileWatcher.getWatchedFiles().length;

    // Start HTTP server
    await new Promise<void>((resolve) => {
      this.httpServer!.listen(this.options.port, () => {
        resolve();
      });
    });

    // Print status
    this.printStatus();

    // Open browser if requested
    if (this.options.open) {
      await this.openBrowser();
    }
  }

  /**
   * Stop development server
   */
  async stop(): Promise<void> {
    console.log('\n🛑 Stopping OSSA Development Server...');

    if (this.fileWatcher) {
      await this.fileWatcher.stop();
    }

    if (this.wsServer) {
      await this.wsServer.stop();
    }

    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    console.log('✅ Server stopped');
  }

  /**
   * Get current server statistics
   */
  getStats(): DevServerStats {
    return {
      ...this.stats,
      connectedClients: this.wsServer.getClientCount(),
    };
  }

  /**
   * Handle file change event
   */
  private async handleFileChange(event: FileChangeEvent): Promise<void> {
    this.stats.fileChanges++;

    if (this.options.verbose) {
      console.log(`\n📝 File ${event.type}: ${path.basename(event.path)}`);
    }

    // Broadcast file change
    this.wsServer.broadcastFileChange(event);

    // Validate file
    if (event.type !== 'unlink') {
      await this.validateFile(event.path);
    }

    // Trigger reload
    this.wsServer.broadcastReload(event.path, `File ${event.type}`);
  }

  /**
   * Validate a file
   */
  private async validateFile(filePath: string): Promise<void> {
    this.stats.validations++;

    try {
      const result = await this.validator.validate(filePath);
      this.stats.latestValidation = result;

      // Log validation result
      if (result.valid) {
        if (this.options.verbose) {
          console.log(`✅ Validation passed (${result.duration}ms)`);
        }
      } else {
        console.log(`\n❌ Validation failed for ${path.basename(filePath)}:`);
        for (const error of result.errors) {
          const location = error.line ? ` (line ${error.line})` : '';
          console.log(`   • ${error.message}${location}`);
        }
      }

      if (result.warnings.length > 0 && this.options.verbose) {
        console.log(`\n⚠️  Warnings:`);
        for (const warning of result.warnings) {
          console.log(`   • ${warning.message}`);
        }
      }

      // Broadcast validation result
      this.wsServer.broadcastValidation(result);
    } catch (error: any) {
      console.error(`Error validating ${filePath}:`, error.message);
      this.wsServer.broadcastError(`Validation error: ${error.message}`);
    }
  }

  /**
   * Handle HTTP requests
   */
  private async handleRequest(req: any, res: any): Promise<void> {
    const url = req.url || '/';

    if (url === '/' || url === '/index.html') {
      // Serve test UI
      await this.serveTestUI(res);
    } else if (url === '/stats') {
      // Serve stats as JSON
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getStats(), null, 2));
    } else {
      // 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }

  /**
   * Serve test UI HTML
   */
  private async serveTestUI(res: any): Promise<void> {
    try {
      const htmlPath = path.join(__dirname, 'test-ui.html');
      const html = await readFile(htmlPath, 'utf-8');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      // Generate inline HTML if file not found
      const inlineHtml = this.generateInlineTestUI();
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(inlineHtml);
    }
  }

  /**
   * Generate inline test UI (fallback)
   */
  private generateInlineTestUI(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>OSSA Dev Server</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
    h1 { color: #4ec9b0; }
    pre { background: #2d2d2d; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
    .success { background: #1e3a1e; border-left: 4px solid #4ec9b0; }
    .error { background: #3a1e1e; border-left: 4px solid #f48771; }
    .warning { background: #3a351e; border-left: 4px solid #dcdcaa; }
  </style>
</head>
<body>
  <h1>🚀 OSSA Development Server</h1>
  <p>WebSocket connected. Watching for changes...</p>
  <div id="output"></div>
  <script>
    const ws = new WebSocket('ws://' + window.location.host + '/ws');
    const output = document.getElementById('output');

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const div = document.createElement('div');
      div.className = 'status';

      if (msg.type === 'validation') {
        div.className += msg.data.result.valid ? ' success' : ' error';
        div.innerHTML = '<pre>' + JSON.stringify(msg.data.result, null, 2) + '</pre>';
      } else {
        div.innerHTML = '<pre>' + JSON.stringify(msg, null, 2) + '</pre>';
      }

      output.insertBefore(div, output.firstChild);
    };
  </script>
</body>
</html>`;
  }

  /**
   * Print server status
   */
  private printStatus(): void {
    const watchedFiles = this.fileWatcher?.getWatchedFiles() || [];

    console.log('✅ Server started successfully!\n');
    console.log(`📡 HTTP Server:  http://localhost:${this.options.port}`);
    console.log(`🔌 WebSocket:    ws://localhost:${this.options.port}/ws`);
    console.log(`📂 Watching:     ${this.options.watch}`);
    console.log(`📄 Files:        ${watchedFiles.length} manifest(s)`);

    if (this.options.verbose && watchedFiles.length > 0) {
      console.log('\nWatched files:');
      for (const file of watchedFiles.slice(0, 5)) {
        console.log(`   • ${path.basename(file)}`);
      }
      if (watchedFiles.length > 5) {
        console.log(`   ... and ${watchedFiles.length - 5} more`);
      }
    }

    console.log('\n👀 Watching for changes (Ctrl+C to stop)...\n');
  }

  /**
   * Open browser
   */
  private async openBrowser(): Promise<void> {
    const url = `http://localhost:${this.options.port}`;
    const { default: open } = await import('open');
    await open(url);
  }
}
