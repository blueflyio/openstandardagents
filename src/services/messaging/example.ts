/**
 * OSSA Messaging Runtime - Usage Example
 * Demonstrates agent-to-agent messaging with pub/sub and commands
 */

import {
  MessagingService,
  DeliveryGuarantee,
  MessagePriority,
} from './index.js';

/**
 * Example: Security Scanner and Remediation Agent
 *
 * This example shows:
 * 1. Agent publishes vulnerability findings to a channel
 * 2. Another agent subscribes to vulnerabilities and processes them
 * 3. Command (RPC) pattern for requesting remediation actions
 */
async function main() {
  console.log('[RUN] OSSA Messaging Runtime Example\n');

  // ============================================================
  // Agent 1: Security Scanner
  // ============================================================

  const securityScanner = new MessagingService({
    agentId: 'security-scanner',
    agentName: 'Security Scanner',
    messaging: {
      publishes: [
        {
          channel: 'security.vulnerabilities',
          description: 'Security vulnerability findings',
          schema: {
            type: 'object',
            properties: {
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
              cve: { type: 'string' },
              affectedPackage: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['severity', 'cve', 'affectedPackage'],
          },
        },
        {
          channel: 'code.commits',
          description: 'Code commit events for testing',
          schema: {
            type: 'object',
            properties: {
              repo: { type: 'string' },
              commit: { type: 'string' },
              author: { type: 'string' },
              files: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      ],
      subscribes: [
        {
          channel: 'code.commits',
          description: 'Listen for code commits to scan',
          handler: 'scanCommit',
          priority: 'high',
        },
      ],
    },
    enableMetrics: true,
    enableValidation: true,
    defaultDeliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
  });

  await securityScanner.start();

  // Subscribe to code commits
  await securityScanner.subscribe('code.commits', async (message) => {
    console.log('[CHECK] [Security Scanner] Scanning commit:', message.payload);

    // Simulate vulnerability scanning
    const commit = message.payload as any;
    const vulnerabilities = await simulateScan(commit.files);

    // Publish findings
    for (const vuln of vulnerabilities) {
      await securityScanner.publish('security.vulnerabilities', vuln, {
        priority:
          vuln.severity === 'critical'
            ? MessagePriority.CRITICAL
            : MessagePriority.NORMAL,
        correlationId: message.id,
      });
      console.log(
        `  [WARN]  Found ${vuln.severity} vulnerability: ${vuln.cve}`
      );
    }
  });

  console.log('[PASS] Security Scanner agent started\n');

  // ============================================================
  // Agent 2: Remediation Agent
  // ============================================================

  const remediationAgent = new MessagingService({
    agentId: 'remediation-agent',
    agentName: 'Remediation Agent',
    messaging: {
      subscribes: [
        {
          channel: 'security.vulnerabilities',
          description: 'Process security vulnerabilities',
          handler: 'remediateVulnerability',
          priority: 'high',
          maxConcurrency: 5,
        },
      ],
      commands: [
        {
          name: 'apply_patch',
          description: 'Apply a security patch',
          inputSchema: {
            type: 'object',
            properties: {
              cve: { type: 'string' },
              package: { type: 'string' },
            },
            required: ['cve', 'package'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              patchedVersion: { type: 'string' },
            },
            required: ['success'],
          },
        },
      ],
    },
  });

  await remediationAgent.start();

  // Subscribe to vulnerabilities
  await remediationAgent.subscribe(
    'security.vulnerabilities',
    async (message) => {
      const vuln = message.payload as any;
      console.log(
        `[FIX] [Remediation Agent] Processing ${vuln.severity} vulnerability: ${vuln.cve}`
      );

      if (vuln.severity === 'critical' || vuln.severity === 'high') {
        // Auto-remediate critical/high vulnerabilities
        console.log(`  [ALERT] Auto-remediating critical vulnerability...`);
        const result = await simulateRemediation(vuln);
        console.log(
          `  [PASS] Remediation ${result.success ? 'successful' : 'failed'}`
        );
      } else {
        console.log(`  [LIST] Created ticket for manual review`);
      }
    }
  );

  // Register command handler
  await remediationAgent.registerCommandHandler(
    'apply_patch',
    async (input: any) => {
      console.log(
        `\n[FIX] [Remediation Agent] Received command: apply_patch for ${input.cve}`
      );
      const result = await simulatePatch(input.package);
      console.log(
        `  [PASS] Patch applied: ${input.package} → ${result.patchedVersion}`
      );
      return result;
    }
  );

  console.log('[PASS] Remediation Agent started\n');

  // ============================================================
  // Simulate Events
  // ============================================================

  console.log('📡 Simulating events...\n');

  // Simulate a code commit event
  await securityScanner.publish('code.commits', {
    repo: 'myapp',
    commit: 'abc123',
    author: 'developer',
    files: ['package.json', 'src/auth.ts'],
  });

  // Wait for async processing
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Send a command to remediation agent
  console.log('\n📤 Sending command to Remediation Agent...');
  const commandResult = await securityScanner.sendCommand(
    'remediation-agent',
    'apply_patch',
    {
      cve: 'CVE-2024-9999',
      package: 'lodash',
    },
    { timeoutSeconds: 5 }
  );
  console.log('📥 Command response:', commandResult);

  // ============================================================
  // Metrics and Health
  // ============================================================

  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log('\n[STATS] Metrics:\n');

  const scannerMetrics = securityScanner.getMetrics();
  console.log('Security Scanner:');
  console.log('  Published:', scannerMetrics.published);
  console.log('  Delivered:', scannerMetrics.delivered);
  console.log('  Failed:', scannerMetrics.failed);
  console.log('  Avg Latency:', scannerMetrics.avgLatencyMs.toFixed(2), 'ms');

  const remediationMetrics = remediationAgent.getMetrics();
  console.log('\nRemediation Agent:');
  console.log('  Published:', remediationMetrics.published);
  console.log('  Delivered:', remediationMetrics.delivered);
  console.log('  Failed:', remediationMetrics.failed);
  console.log(
    '  Avg Latency:',
    remediationMetrics.avgLatencyMs.toFixed(2),
    'ms'
  );

  const health = await securityScanner.getHealth();
  console.log('\n🏥 Broker Health:');
  console.log('  Status:', health.status);
  console.log('  Channels:', health.channels);
  console.log('  Subscriptions:', health.subscriptions);
  console.log('  Uptime:', (health.uptimeMs / 1000).toFixed(1), 's');

  const channelStats = await securityScanner.getChannelStats(
    'security.vulnerabilities'
  );
  console.log('\n📈 Channel Stats (security.vulnerabilities):');
  console.log('  Published:', channelStats.messagesPublished);
  console.log('  Consumed:', channelStats.messagesConsumed);
  console.log('  Pending:', channelStats.messagesPending);
  console.log('  Subscriptions:', channelStats.subscriptions);

  // ============================================================
  // Graceful Shutdown
  // ============================================================

  console.log('\n[STOP] Shutting down...');
  await securityScanner.stop();
  await remediationAgent.stop();
  console.log('[PASS] Shutdown complete\n');
}

/**
 * Simulate vulnerability scanning
 */
async function simulateScan(files: string[]): Promise<any[]> {
  // Simulate async scanning
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (files.includes('package.json')) {
    return [
      {
        severity: 'high',
        cve: 'CVE-2024-1234',
        affectedPackage: 'lodash@4.17.20',
        description: 'Prototype pollution vulnerability',
      },
      {
        severity: 'low',
        cve: 'CVE-2024-5678',
        affectedPackage: 'express@4.17.1',
        description: 'Outdated dependency',
      },
    ];
  }

  return [];
}

/**
 * Simulate remediation
 */
async function simulateRemediation(vuln: any): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    success: true,
    action: 'updated_dependency',
    newVersion: '4.18.0',
  };
}

/**
 * Simulate applying a patch
 */
async function simulatePatch(packageName: string): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    success: true,
    patchedVersion: '4.18.0',
  };
}

// Run the example
main().catch((error) => {
  console.error('[FAIL] Error:', error);
  process.exit(1);
});
