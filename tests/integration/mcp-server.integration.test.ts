/**
 * Integration test for OSSA MCP server: list tools and call ossa_validate.
 * Spawns the server process and sends JSON-RPC over stdin.
 */

import { describe, it, expect } from '@jest/globals';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

const SERVER_PATH = path.join(__dirname, '../../dist/mcp-server/index.js');

function sendRpc(
  proc: ReturnType<typeof spawn>,
  method: string,
  params: unknown,
  id: number
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    let buf = '';
    const onData = (chunk: Buffer | string) => {
      buf += chunk.toString();
      if (buf.includes('\n')) {
        proc.stdout?.removeListener('data', onData);
        try {
          resolve(JSON.parse(buf.trim().split('\n')[0]));
        } catch (e) {
          reject(e);
        }
      }
    };
    proc.stdout?.on('data', onData);
    proc.stdin?.write(msg, (err) => (err ? reject(err) : null));
  });
}

describe('OSSA MCP server integration', () => {
  it('lists 4 tools (ossa_validate, ossa_scaffold, ossa_generate, ossa_publish)', async () => {
    if (!fs.existsSync(SERVER_PATH)) {
      console.warn('MCP server not built, skipping');
      return;
    }
    const proc = spawn(process.execPath, [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '../..'),
    });
    try {
      const init = (await sendRpc(
        proc,
        'initialize',
        {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '0.1' },
        },
        1
      )) as { result?: { serverInfo?: { name: string } } };
      expect(init.result?.serverInfo?.name).toBe('ossa-mcp');

      const list = (await sendRpc(proc, 'tools/list', {}, 2)) as {
        result?: { tools?: { name: string }[] };
      };
      const names = (list.result?.tools ?? []).map((t) => t.name);
      expect(names).toContain('ossa_validate');
      expect(names).toContain('ossa_scaffold');
      expect(names).toContain('ossa_generate');
      expect(names).toContain('ossa_publish');
      expect(names).toContain('ossa_list');
      expect(names).toContain('ossa_inspect');
      expect(names).toContain('ossa_convert');
      expect(names).toContain('ossa_workspace');
      expect(names).toContain('ossa_diff');
      expect(names).toContain('ossa_migrate');
      expect(names.length).toBe(10);
    } finally {
      proc.kill('SIGTERM');
    }
  }, 10000);
});
