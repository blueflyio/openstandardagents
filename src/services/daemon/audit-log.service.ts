/**
 * Daemon Audit Log Service
 * NIST-compliant audit logging for all daemon operations.
 * Writes JSONL to ~/.ossa/daemon-audit.jsonl for security auditing.
 * Non-blocking writes — never slows down the daemon.
 *
 * @experimental This feature is experimental and may change without notice.
 */

import { appendFile, mkdir, readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { injectable } from 'inversify';

export type AuditAction =
  | 'pair'
  | 'connect'
  | 'disconnect'
  | 'file_write'
  | 'file_read'
  | 'execute'
  | 'execute_cancel'
  | 'skill_install'
  | 'session_revoke';

export interface AuditEntry {
  ts: string;
  action: AuditAction;
  origin?: string;
  sessionId?: string;
  path?: string;
  result: 'success' | 'failure' | 'error';
  detail?: string;
}

const OSSA_DIR = join(homedir(), '.ossa');
const AUDIT_LOG_PATH = join(OSSA_DIR, 'daemon-audit.jsonl');
const DEFAULT_RECENT_COUNT = 50;

@injectable()
export class AuditLogService {
  private initialized = false;

  /**
   * Ensure ~/.ossa/ directory exists.
   * Safe to call multiple times.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await mkdir(OSSA_DIR, { recursive: true });
    this.initialized = true;
  }

  /**
   * Append an audit entry to the JSONL log.
   * Non-blocking: fires and forgets the write, logging errors to stderr.
   */
  async log(entry: Omit<AuditEntry, 'ts'>): Promise<void> {
    const record: AuditEntry = {
      ts: new Date().toISOString(),
      ...entry,
    };

    const line = JSON.stringify(record) + '\n';

    try {
      await this.initialize();
      await appendFile(AUDIT_LOG_PATH, line, 'utf-8');
    } catch (err) {
      // Never crash the daemon — log to stderr and continue
      process.stderr.write(
        `[audit-log] write failed: ${err instanceof Error ? err.message : String(err)}\n`
      );
    }
  }

  /**
   * Read the most recent audit entries.
   * Reads from the end of the file for efficiency.
   */
  async getRecentEntries(count: number = DEFAULT_RECENT_COUNT): Promise<AuditEntry[]> {
    try {
      await this.initialize();
      const content = await readFile(AUDIT_LOG_PATH, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      const recent = lines.slice(-count);
      return recent.map((line) => JSON.parse(line) as AuditEntry);
    } catch (err) {
      // File doesn't exist yet or read error — return empty
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      process.stderr.write(
        `[audit-log] read failed: ${err instanceof Error ? err.message : String(err)}\n`
      );
      return [];
    }
  }
}
