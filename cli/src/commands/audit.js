/**
 * OSSA Audit Command
 *
 * Audits OSSA agent manifests for completeness, best practices, and compliance.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

module.exports = async function audit(agentPath, options) {
  try {
    console.log(`\nAuditing OSSA agent: ${agentPath}\n`);

    // Load agent manifest
    const manifestPath = path.resolve(process.cwd(), agentPath);
    if (!fs.existsSync(manifestPath)) {
      console.error(`Error: Agent manifest not found at ${manifestPath}`);
      process.exit(1);
    }

    let agent;
    if (manifestPath.endsWith('.json')) {
      agent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } else if (
      manifestPath.endsWith('.yml') ||
      manifestPath.endsWith('.yaml')
    ) {
      agent = yaml.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } else {
      console.error('Error: Manifest must be .json, .yml, or .yaml');
      process.exit(1);
    }

    const results = {
      completeness: [],
      bestPractices: [],
      security: [],
      performance: [],
      score: 0,
    };

    // Check completeness
    checkCompleteness(agent, results);

    // Check best practices
    checkBestPractices(agent, results);

    // Check security
    checkSecurity(agent, results);

    // Check performance
    checkPerformance(agent, results);

    // Calculate score
    const totalChecks =
      results.completeness.length +
      results.bestPractices.length +
      results.security.length +
      results.performance.length;
    const passed =
      results.completeness.filter((c) => c.passed).length +
      results.bestPractices.filter((c) => c.passed).length +
      results.security.filter((c) => c.passed).length +
      results.performance.filter((c) => c.passed).length;

    results.score = Math.round((passed / totalChecks) * 100);

    // Display results
    displayResults(results, options);

    // Exit with appropriate code
    process.exit(results.score >= 80 ? 0 : 1);
  } catch (error) {
    console.error('Error during audit:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};

function checkCompleteness(agent, results) {
  // Required fields
  results.completeness.push({
    name: 'Required Fields',
    passed:
      agent.ossaVersion &&
      agent.agent?.id &&
      agent.agent?.name &&
      agent.agent?.version &&
      agent.agent?.role &&
      agent.agent?.runtime &&
      agent.agent?.capabilities,
    message: agent.ossaVersion
      ? 'All required fields present'
      : 'Missing required fields',
  });

  // Description
  results.completeness.push({
    name: 'Description',
    passed: agent.agent?.description && agent.agent.description.length > 20,
    message:
      agent.agent?.description?.length > 20
        ? 'Good description provided'
        : 'Description missing or too short (min 20 chars)',
  });

  // Tags
  results.completeness.push({
    name: 'Tags',
    passed: agent.agent?.tags && agent.agent.tags.length >= 3,
    message:
      agent.agent?.tags?.length >= 3
        ? `${agent.agent.tags.length} tags provided`
        : 'Add at least 3 tags for discoverability',
  });

  // Capabilities
  results.completeness.push({
    name: 'Capabilities',
    passed: agent.agent?.capabilities && agent.agent.capabilities.length >= 1,
    message:
      agent.agent?.capabilities?.length >= 1
        ? `${agent.agent.capabilities.length} capabilities defined`
        : 'No capabilities defined',
  });

  // Metadata
  results.completeness.push({
    name: 'Metadata',
    passed: agent.agent?.metadata?.author && agent.agent?.metadata?.license,
    message:
      agent.agent?.metadata?.author && agent.agent?.metadata?.license
        ? 'Author and license specified'
        : 'Add author and license metadata',
  });
}

function checkBestPractices(agent, results) {
  // Semantic versioning
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  results.bestPractices.push({
    name: 'Semantic Versioning',
    passed: semverRegex.test(agent.agent?.version),
    message: semverRegex.test(agent.agent?.version)
      ? 'Valid semver format'
      : 'Version should follow semantic versioning (x.y.z)',
  });

  // Capability schemas
  const hasSchemas = agent.agent?.capabilities?.every(
    (c) => c.input_schema && c.output_schema
  );
  results.bestPractices.push({
    name: 'Capability Schemas',
    passed: hasSchemas,
    message: hasSchemas
      ? 'All capabilities have input/output schemas'
      : 'Add schemas to all capabilities',
  });

  // Health check
  results.bestPractices.push({
    name: 'Health Check',
    passed: agent.agent?.runtime?.health_check,
    message: agent.agent?.runtime?.health_check
      ? 'Health check configured'
      : 'Add health check configuration',
  });

  // Integration config
  results.bestPractices.push({
    name: 'Integration',
    passed:
      agent.agent?.integration?.protocol && agent.agent?.integration?.endpoints,
    message:
      agent.agent?.integration?.protocol && agent.agent?.integration?.endpoints
        ? 'Integration properly configured'
        : 'Add integration protocol and endpoints',
  });
}

function checkSecurity(agent, results) {
  // Authentication
  results.security.push({
    name: 'Authentication',
    passed:
      agent.agent?.integration?.auth &&
      agent.agent.integration.auth.type !== 'none',
    message:
      agent.agent?.integration?.auth?.type !== 'none'
        ? `Authentication: ${agent.agent.integration.auth.type}`
        : 'No authentication configured (insecure)',
  });

  // Policies
  results.security.push({
    name: 'Security Policies',
    passed: agent.agent?.policies || agent.agent?.security,
    message:
      agent.agent?.policies || agent.agent?.security
        ? 'Security policies defined'
        : 'Add security/compliance policies',
  });

  // Resource limits
  results.security.push({
    name: 'Resource Limits',
    passed: agent.agent?.runtime?.resources,
    message: agent.agent?.runtime?.resources
      ? 'Resource limits set'
      : 'Define resource limits to prevent DoS',
  });
}

function checkPerformance(agent, results) {
  // Timeout configuration
  const hasTimeouts = agent.agent?.capabilities?.every(
    (c) => c.timeout_seconds
  );
  results.performance.push({
    name: 'Timeout Configuration',
    passed: hasTimeouts,
    message: hasTimeouts
      ? 'All capabilities have timeouts'
      : 'Add timeout_seconds to all capabilities',
  });

  // Monitoring
  results.performance.push({
    name: 'Monitoring',
    passed: agent.agent?.monitoring,
    message: agent.agent?.monitoring
      ? 'Monitoring configured'
      : 'Enable monitoring for observability',
  });

  // Retry policy
  const hasRetry = agent.agent?.capabilities?.some((c) => c.retry_policy);
  results.performance.push({
    name: 'Retry Policies',
    passed: hasRetry,
    message: hasRetry
      ? 'Retry policies defined'
      : 'Consider adding retry policies for resilience',
  });
}

function displayResults(results, options) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`                    AUDIT SCORE: ${results.score}/100`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const sections = [
    { title: 'COMPLETENESS', checks: results.completeness },
    { title: 'BEST PRACTICES', checks: results.bestPractices },
    { title: 'SECURITY', checks: results.security },
    { title: 'PERFORMANCE', checks: results.performance },
  ];

  sections.forEach((section) => {
    console.log(`${section.title}:`);
    section.checks.forEach((check) => {
      const icon = check.passed ? '✓' : '✗';
      const color = check.passed ? '' : '';
      console.log(`  ${icon} ${check.name}: ${check.message}`);
    });
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════');

  if (results.score >= 90) {
    console.log('🌟 EXCELLENT - Production ready!');
  } else if (results.score >= 80) {
    console.log('✓ GOOD - Minor improvements recommended');
  } else if (results.score >= 60) {
    console.log('⚠ FAIR - Address issues before production');
  } else {
    console.log('✗ POOR - Significant improvements required');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}
