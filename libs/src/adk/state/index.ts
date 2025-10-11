/**
 * ADK State Management for OSSA
 * Implements session.state pattern for inter-agent communication
 */

export interface ADKSessionState {
  [key: string]: any;
}

export interface ADKSession {
  id: string;
  state: ADKSessionState;
  temp: ADKSessionState; // Turn-specific temporary state
  metadata: {
    created_at: Date;
    updated_at: Date;
    agent_trace: string[];
  };
}

/**
 * ADK Session Manager for OSSA
 */
export class OSSASessionManager {
  private sessions: Map<string, ADKSession> = new Map();

  /**
   * Create a new session
   */
  createSession(id?: string): ADKSession {
    const sessionId = id || this.generateSessionId();

    const session: ADKSession = {
      id: sessionId,
      state: {},
      temp: {},
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
        agent_trace: []
      }
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get existing session
   */
  getSession(id: string): ADKSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Update session state
   */
  updateState(sessionId: string, key: string, value: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.state[key] = value;
    session.metadata.updated_at = new Date();
  }

  /**
   * Update temporary state (cleared after each turn)
   */
  updateTempState(sessionId: string, key: string, value: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.temp[key] = value;
  }

  /**
   * Clear temporary state
   */
  clearTempState(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.temp = {};
    }
  }

  /**
   * Add agent to trace
   */
  addAgentTrace(sessionId: string, agentName: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.metadata.agent_trace.push(agentName);
      session.metadata.updated_at = new Date();
    }
  }

  /**
   * Interpolate state variables in text
   */
  interpolateState(text: string, sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return text;

    // Replace {variable} with state value
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      // Check temp state first, then persistent state
      if (session.temp[key] !== undefined) {
        return session.temp[key];
      }
      if (session.state[key] !== undefined) {
        return session.state[key];
      }
      return match;
    });
  }

  /**
   * Clone session for parallel execution
   */
  cloneSession(sessionId: string): ADKSession {
    const original = this.sessions.get(sessionId);
    if (!original) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const clonedId = this.generateSessionId();
    const cloned: ADKSession = {
      id: clonedId,
      state: { ...original.state },
      temp: { ...original.temp },
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
        agent_trace: [...original.metadata.agent_trace]
      }
    };

    this.sessions.set(clonedId, cloned);
    return cloned;
  }

  /**
   * Merge sessions (for parallel execution results)
   */
  mergeSessions(targetId: string, sourceIds: string[]): void {
    const target = this.sessions.get(targetId);
    if (!target) {
      throw new Error(`Target session not found: ${targetId}`);
    }

    for (const sourceId of sourceIds) {
      const source = this.sessions.get(sourceId);
      if (source) {
        // Merge state (source overwrites target for conflicts)
        Object.assign(target.state, source.state);

        // Merge agent traces
        target.metadata.agent_trace.push(...source.metadata.agent_trace);

        // Clean up source session
        this.sessions.delete(sourceId);
      }
    }

    target.metadata.updated_at = new Date();
  }

  /**
   * Clean up old sessions
   */
  cleanupSessions(olderThan: Date): number {
    let cleaned = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.metadata.updated_at < olderThan) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export session for debugging
   */
  exportSession(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      state: session.state,
      temp: session.temp,
      metadata: {
        created_at: session.metadata.created_at.toISOString(),
        updated_at: session.metadata.updated_at.toISOString(),
        agent_trace: session.metadata.agent_trace,
        state_keys: Object.keys(session.state),
        temp_keys: Object.keys(session.temp)
      }
    };
  }
}

export const sessionManager = new OSSASessionManager();
