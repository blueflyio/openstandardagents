/**
 * Daemon Pairing Service
 * NIST-grade local authentication for browser-to-daemon pairing.
 * Like Bluetooth pairing: daemon displays 6-digit code, browser submits it to get a session token.
 * All state is memory-only — daemon restart invalidates everything.
 *
 * @experimental This feature is experimental and may change without notice.
 */

import { createHmac, randomBytes, randomUUID } from 'crypto';
import { injectable } from 'inversify';

export interface Session {
  sessionId: string;
  token: string;
  origin: string;
  createdAt: Date;
  expiresAt: Date;
}

const CODE_ROTATION_INTERVAL_MS = 60_000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CONCURRENT_SESSIONS = 3;

const ALLOWED_ORIGINS: readonly string[] = [
  'localhost',
  '127.0.0.1',
  'openstandardagents.org',
];

@injectable()
export class PairingService {
  private readonly secretKey: Buffer = randomBytes(32);
  private sessions: Map<string, Session> = new Map();

  private currentCode: string = '';
  private codeGeneratedAt: number = 0;

  /**
   * Get the current 6-digit pairing code for terminal display.
   * Rotates automatically every 60 seconds.
   */
  getCurrentCode(): string {
    const now = Date.now();
    if (!this.currentCode || now - this.codeGeneratedAt >= CODE_ROTATION_INTERVAL_MS) {
      this.currentCode = this.generateCode();
      this.codeGeneratedAt = now;
    }
    return this.currentCode;
  }

  /**
   * Validate a pairing code and create a session.
   * Returns null if code is invalid, expired, or max sessions reached.
   */
  pair(code: string, origin: string): Session | null {
    if (!this.isOriginAllowed(origin)) {
      return null;
    }

    // Ensure current code is fresh
    const validCode = this.getCurrentCode();
    if (code !== validCode) {
      return null;
    }

    // Prune expired sessions before checking count
    this.pruneExpired();

    if (this.sessions.size >= MAX_CONCURRENT_SESSIONS) {
      return null;
    }

    const sessionId = randomUUID();
    const now = new Date();
    const token = this.generateToken(sessionId);

    const session: Session = {
      sessionId,
      token,
      origin,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    };

    this.sessions.set(sessionId, session);

    // Force new code after successful pairing (one-time use)
    this.currentCode = '';
    this.codeGeneratedAt = 0;

    return session;
  }

  /**
   * Verify a token. Returns the session if valid, null otherwise.
   */
  verifyToken(token: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        if (new Date() > session.expiresAt) {
          this.sessions.delete(session.sessionId);
          return null;
        }
        return session;
      }
    }
    return null;
  }

  /**
   * Revoke a session by its ID.
   */
  revokeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * List all active (non-expired) sessions.
   */
  getActiveSessions(): Session[] {
    this.pruneExpired();
    return Array.from(this.sessions.values());
  }

  /**
   * Check if an origin is in the allowlist.
   * Matches exact hostnames and *.openstandardagents.org subdomains.
   */
  isOriginAllowed(origin: string): boolean {
    let hostname: string;
    try {
      // Handle full URLs (e.g. "https://openstandardagents.org")
      const url = new URL(origin);
      hostname = url.hostname;
    } catch {
      // Handle bare hostnames (e.g. "localhost")
      hostname = origin;
    }

    if (ALLOWED_ORIGINS.includes(hostname)) {
      return true;
    }

    // Check *.openstandardagents.org wildcard
    if (hostname.endsWith('.openstandardagents.org')) {
      return true;
    }

    return false;
  }

  /**
   * Generate a cryptographically random 6-digit numeric code.
   */
  private generateCode(): string {
    const bytes = randomBytes(4);
    const num = bytes.readUInt32BE(0) % 1_000_000;
    return num.toString().padStart(6, '0');
  }

  /**
   * Generate an HMAC-SHA256 session token.
   */
  private generateToken(sessionId: string): string {
    const hmac = createHmac('sha256', this.secretKey);
    hmac.update(sessionId);
    hmac.update(Date.now().toString());
    hmac.update(randomBytes(16));
    return hmac.digest('hex');
  }

  /**
   * Remove expired sessions.
   */
  private pruneExpired(): void {
    const now = new Date();
    for (const [id, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(id);
      }
    }
  }
}
