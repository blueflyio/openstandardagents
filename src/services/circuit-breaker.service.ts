/**
 * OSSA Circuit Breaker Service
 *
 * Implements the circuit breaker pattern to prevent cascade failures across 70+ projects.
 * Opens after N consecutive failures, preventing automatic healing until manual reset.
 *
 * States:
 * - CLOSED: Normal operation, healing attempts proceed
 * - OPEN: Circuit breaker triggered, healing suspended
 * - HALF_OPEN: Testing if issue is resolved (not implemented yet)
 *
 * Storage:
 * - Circuit state stored in GitLab CI/CD project variables
 * - Persists across pipeline runs
 * - Visible in project settings for manual override
 *
 * Features:
 * - Track consecutive failures
 * - Open circuit after threshold exceeded
 * - Reset on successful healing
 * - Manual reset via CI/CD variable
 * - Alert notifications when circuit opens
 *
 * Issue: Part of Self-Healing Pipeline Component (gitlab_components)
 */

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Circuit breaker triggered
  HALF_OPEN = 'half_open', // Testing recovery (future)
}

/**
 * Circuit breaker metrics
 */
export interface CircuitMetrics {
  state: CircuitState;
  consecutive_failures: number;
  total_failures: number;
  total_successes: number;
  last_failure_timestamp?: string;
  last_success_timestamp?: string;
  opened_at?: string;
  opened_reason?: string;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  gitlabUrl: string;
  gitlabToken: string;
  projectId: string;
  threshold: number; // Number of consecutive failures to trigger
  timeoutSeconds: number; // Time before attempting to close (future: half-open state)
}

/**
 * Circuit Breaker Service
 */
export class CircuitBreakerService {
  private config: CircuitBreakerConfig;
  private metrics: CircuitMetrics | null = null;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * Get current circuit breaker state
   */
  async getState(): Promise<CircuitState> {
    try {
      const endpoint = `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/variables/SELF_HEALING_CIRCUIT_STATE`;

      const response = await fetch(endpoint, {
        headers: {
          'PRIVATE-TOKEN': this.config.gitlabToken,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Variable doesn't exist, circuit is closed
          return CircuitState.CLOSED;
        }
        throw new Error(`Failed to get circuit state: ${response.statusText}`);
      }

      const variable = await response.json();
      const state = variable.value as CircuitState;

      return Object.values(CircuitState).includes(state) ? state : CircuitState.CLOSED;
    } catch (error) {
      console.error('Failed to get circuit state:', error);
      // Default to closed on error
      return CircuitState.CLOSED;
    }
  }

  /**
   * Get circuit breaker metrics
   */
  async getMetrics(): Promise<CircuitMetrics> {
    const state = await this.getState();
    const consecutiveFailures = await this.getConsecutiveFailures();

    // In production, these would be stored in separate variables or a database
    // For simplicity, using basic counters here
    this.metrics = {
      state,
      consecutive_failures: consecutiveFailures,
      total_failures: 0,
      total_successes: 0,
    };

    return this.metrics;
  }

  /**
   * Check if circuit allows healing attempts
   */
  async allowsHealing(): Promise<boolean> {
    const state = await this.getState();
    return state === CircuitState.CLOSED;
  }

  /**
   * Record healing success
   */
  async recordSuccess(): Promise<void> {
    // Reset consecutive failures
    await this.setConsecutiveFailures(0);

    // Ensure circuit is closed
    await this.setState(CircuitState.CLOSED);

    console.log('✅ Circuit breaker: Healing succeeded, consecutive failures reset');
  }

  /**
   * Record healing failure
   */
  async recordFailure(reason?: string): Promise<void> {
    const consecutiveFailures = await this.getConsecutiveFailures();
    const newCount = consecutiveFailures + 1;

    await this.setConsecutiveFailures(newCount);

    console.log(`❌ Circuit breaker: Healing failed, consecutive failures: ${newCount}`);

    // Check if threshold exceeded
    if (newCount >= this.config.threshold) {
      await this.open(reason || 'Threshold exceeded');
    }
  }

  /**
   * Open circuit breaker
   */
  async open(reason: string): Promise<void> {
    await this.setState(CircuitState.OPEN);

    const timestamp = new Date().toISOString();

    console.error(`🚨 CIRCUIT BREAKER OPENED at ${timestamp}`);
    console.error(`   Reason: ${reason}`);
    console.error(`   Consecutive failures: ${await this.getConsecutiveFailures()}`);
    console.error(`   Self-healing suspended until manual reset`);
    console.error(`   To reset: Set CI/CD variable SELF_HEALING_CIRCUIT_STATE=closed`);

    // Store opened timestamp and reason (future: use separate variables)
    this.metrics = {
      ...(this.metrics || {
        state: CircuitState.OPEN,
        consecutive_failures: 0,
        total_failures: 0,
        total_successes: 0,
      }),
      state: CircuitState.OPEN,
      opened_at: timestamp,
      opened_reason: reason,
    };
  }

  /**
   * Close circuit breaker (manual reset)
   */
  async close(): Promise<void> {
    await this.setState(CircuitState.CLOSED);
    await this.setConsecutiveFailures(0);

    console.log('✅ Circuit breaker manually closed and reset');

    this.metrics = {
      ...(this.metrics || {
        state: CircuitState.CLOSED,
        consecutive_failures: 0,
        total_failures: 0,
        total_successes: 0,
      }),
      state: CircuitState.CLOSED,
      consecutive_failures: 0,
    };
  }

  /**
   * Get consecutive failure count
   */
  private async getConsecutiveFailures(): Promise<number> {
    try {
      const endpoint = `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/variables/SELF_HEALING_CONSECUTIVE_FAILURES`;

      const response = await fetch(endpoint, {
        headers: {
          'PRIVATE-TOKEN': this.config.gitlabToken,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return 0;
        }
        throw new Error(`Failed to get consecutive failures: ${response.statusText}`);
      }

      const variable = await response.json();
      return parseInt(variable.value, 10) || 0;
    } catch (error) {
      console.error('Failed to get consecutive failures:', error);
      return 0;
    }
  }

  /**
   * Set consecutive failure count
   */
  private async setConsecutiveFailures(count: number): Promise<void> {
    try {
      const endpoint = `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/variables/SELF_HEALING_CONSECUTIVE_FAILURES`;

      // Try to update existing variable
      let response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': this.config.gitlabToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: count.toString() }),
      });

      // If variable doesn't exist, create it
      if (!response.ok && response.status === 404) {
        const createEndpoint = `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/variables`;
        response = await fetch(createEndpoint, {
          method: 'POST',
          headers: {
            'PRIVATE-TOKEN': this.config.gitlabToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'SELF_HEALING_CONSECUTIVE_FAILURES',
            value: count.toString(),
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to set consecutive failures: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to set consecutive failures:', error);
      throw error;
    }
  }

  /**
   * Set circuit state
   */
  private async setState(state: CircuitState): Promise<void> {
    try {
      const endpoint = `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/variables/SELF_HEALING_CIRCUIT_STATE`;

      // Try to update existing variable
      let response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': this.config.gitlabToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: state }),
      });

      // If variable doesn't exist, create it
      if (!response.ok && response.status === 404) {
        const createEndpoint = `${this.config.gitlabUrl}/api/v4/projects/${this.config.projectId}/variables`;
        response = await fetch(createEndpoint, {
          method: 'POST',
          headers: {
            'PRIVATE-TOKEN': this.config.gitlabToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'SELF_HEALING_CIRCUIT_STATE',
            value: state,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to set circuit state: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to set circuit state:', error);
      throw error;
    }
  }

  /**
   * Reset circuit breaker (manual operation)
   */
  async reset(): Promise<void> {
    await this.close();
  }

  /**
   * Generate circuit breaker status report
   */
  async generateReport(): Promise<string> {
    const metrics = await this.getMetrics();

    let report = `# Circuit Breaker Status\n\n`;
    report += `**State:** ${metrics.state.toUpperCase()}\n`;
    report += `**Consecutive Failures:** ${metrics.consecutive_failures}/${this.config.threshold}\n\n`;

    if (metrics.state === CircuitState.OPEN) {
      report += `## ⚠️ Circuit Breaker is OPEN\n\n`;
      report += `Self-healing is currently suspended.\n\n`;

      if (metrics.opened_at) {
        report += `**Opened At:** ${metrics.opened_at}\n`;
      }

      if (metrics.opened_reason) {
        report += `**Reason:** ${metrics.opened_reason}\n`;
      }

      report += `\n**To Reset:**\n`;
      report += `1. Go to Project Settings → CI/CD → Variables\n`;
      report += `2. Set \`SELF_HEALING_CIRCUIT_STATE\` to \`closed\`\n`;
      report += `3. Or delete the variable to reset to default (closed)\n\n`;
    } else {
      report += `## ✅ Circuit Breaker is CLOSED\n\n`;
      report += `Self-healing is operational.\n`;

      if (metrics.consecutive_failures > 0) {
        const remaining = this.config.threshold - metrics.consecutive_failures;
        report += `\n⚠️  ${remaining} more consecutive failure(s) until circuit opens.\n`;
      }
    }

    return report;
  }

  /**
   * Check if circuit should transition to half-open (future feature)
   */
  async shouldTransitionToHalfOpen(): Promise<boolean> {
    // Future: Implement half-open state transition logic
    // For now, always require manual reset
    return false;
  }
}
