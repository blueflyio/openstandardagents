#!/usr/bin/env tsx
/**
 * Migration script to salvage valuable code from __DELETE_LATER
 * and reorganize into the clean OSSA structure
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';

interface MigrationItem {
  source: string;
  target: string;
  priority: 'high' | 'medium' | 'low';
  status?: 'completed' | 'pending' | 'skipped';
  notes?: string;
}

const migrations: MigrationItem[] = [
  // High Priority - Core Systems (ALREADY MIGRATED)
  {
    source: '__DELETE_LATER/dist/vortex',
    target: 'src/core/vortex',
    priority: 'high',
    status: 'completed',
    notes: 'VORTEX engine with 68-82% token reduction'
  },
  {
    source: '__DELETE_LATER/dist/coordination',
    target: 'src/orchestration/coordination',
    priority: 'high',
    status: 'completed',
    notes: 'Agent coordination system'
  },
  {
    source: '__DELETE_LATER/dist/memory',
    target: 'src/core/memory',
    priority: 'high',
    status: 'completed',
    notes: 'Memory coherence system'
  },
  {
    source: '__DELETE_LATER/dist/security',
    target: 'src/core/security',
    priority: 'high',
    status: 'completed',
    notes: 'Trust scoring system'
  },

  // Medium Priority - TypeScript Sources
  {
    source: '__DELETE_LATER/wt-wip-cleanup-1757308970/src/coordination/coordination-engine.ts',
    target: 'src/orchestration/coordination/coordination-engine.ts',
    priority: 'medium',
    notes: 'Original TypeScript source for coordination'
  },
  {
    source: '__DELETE_LATER/wt-wip-cleanup-1757308970/src/core/memory-session-manager.ts',
    target: 'src/core/memory/session-manager.ts',
    priority: 'medium',
    notes: 'Memory session management'
  },
  {
    source: '__DELETE_LATER/services/orchestration/src',
    target: 'src/services/orchestration',
    priority: 'medium',
    notes: 'Orchestration service implementation'
  },

  // Low Priority - Examples and Templates
  {
    source: '__DELETE_LATER/fastify-server-template.ts',
    target: 'docs/templates/fastify-server.ts',
    priority: 'low',
    notes: 'Server template for reference'
  },
  {
    source: '__DELETE_LATER/test',
    target: 'tests/salvaged',
    priority: 'low',
    notes: 'Test files to review and adapt'
  }
];

/**
 * Migration Report
 */
const generateReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: migrations.length,
      completed: migrations.filter(m => m.status === 'completed').length,
      pending: migrations.filter(m => !m.status || m.status === 'pending').length,
      skipped: migrations.filter(m => m.status === 'skipped').length
    },
    highPriority: migrations.filter(m => m.priority === 'high'),
    mediumPriority: migrations.filter(m => m.priority === 'medium'),
    lowPriority: migrations.filter(m => m.priority === 'low'),
    recommendations: [
      'High priority items (VORTEX, coordination, memory, security) already migrated',
      'Review TypeScript sources in medium priority for integration',
      'Test files need adaptation to new structure',
      'Docker infrastructure preserved and working - DO NOT MODIFY',
      'DITA roadmaps continue to work in .agents/roadmap/',
      'Consider archiving __DELETE_LATER after validation'
    ]
  };

  return report;
};

/**
 * Key findings from __DELETE_LATER analysis
 */
const keyFindings = {
  workingComponents: [
    'VORTEX engine (compiled JS + types)',
    'Coordination system (compiled JS + types)',
    'Memory coherence system (compiled JS + types)',
    'Trust scoring system (compiled JS + types)',
    'OpenAPI specifications for agents',
    'Roadmap metadata JSON files'
  ],
  
  duplicateCode: [
    'Multiple versions of coordination-engine.ts',
    'Repeated memory backend implementations',
    'Several test configurations'
  ],
  
  toArchive: [
    'Agent folders moved to __DELETE_LATER/agent-folders/',
    'Old build artifacts in various dist/ folders',
    'Temporary worktree experiments (wt-wip-*)'
  ],
  
  valuablePatterns: [
    '8-phase lifecycle implementation',
    'ACTA token optimization algorithms',
    '360° feedback loop patterns',
    'Multi-agent orchestration examples'
  ]
};

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  console.log('OSSA Migration Report');
  console.log('=====================\n');
  
  const report = generateReport();
  
  console.log('Summary:');
  console.log(`- Total items: ${report.summary.total}`);
  console.log(`- Completed: ${report.summary.completed}`);
  console.log(`- Pending: ${report.summary.pending}`);
  console.log(`- Skipped: ${report.summary.skipped}\n`);
  
  console.log('High Priority (Core Systems):');
  report.highPriority.forEach(item => {
    console.log(`  ✅ ${item.notes} [${item.status}]`);
  });
  
  console.log('\nMedium Priority (Sources to Review):');
  report.mediumPriority.forEach(item => {
    const status = item.status || 'pending';
    const icon = status === 'completed' ? '✅' : '⏳';
    console.log(`  ${icon} ${item.notes} [${status}]`);
  });
  
  console.log('\nRecommendations:');
  report.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
  
  console.log('\nNext Steps:');
  console.log('1. Run: npm run build in src/cli to compile CLI');
  console.log('2. Test: ./src/cli/bin/ossa --help');
  console.log('3. Verify: Docker containers still working');
  console.log('4. Archive: Move __DELETE_LATER after validation');
}

export { migrations, generateReport, keyFindings };