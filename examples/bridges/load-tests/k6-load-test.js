/**
 * k6 Load Testing Script for AIFlow Social Agent
 * 
 * Tests:
 * 1. Baseline performance (moderate load)
 * 2. Stress testing (high load)
 * 3. Spike testing (sudden traffic increase)
 * 4. Soak testing (sustained load)
 * 
 * Usage:
 *   k6 run k6-load-test.js
 *   k6 run --vus 100 --duration 60s k6-load-test.js
 *   k6 run --stage "1m:10,5m:50,1m:0" k6-load-test.js
 * 
 * Metrics exported to Prometheus via k6-operator
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const postGenerationDuration = new Trend('post_generation_duration');
const responseGenerationDuration = new Trend('response_generation_duration');
const healthCheckDuration = new Trend('health_check_duration');
const apiRequests = new Counter('api_requests_total');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://aiflow-social-agent.agents.svc.cluster.local:8000';
const API_KEY = __ENV.API_KEY || 'test-api-key-for-development';

// Load test scenarios
export const options = {
  scenarios: {
    // Scenario 1: Baseline Performance Test
    baseline: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // Ramp up to 10 VUs
        { duration: '3m', target: 10 },   // Stay at 10 VUs
        { duration: '1m', target: 0 },    // Ramp down to 0
      ],
      gracefulRampDown: '30s',
      exec: 'baselineTest',
    },
    
    // Scenario 2: Stress Test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 VUs
        { duration: '5m', target: 50 },   // Stay at 50 VUs
        { duration: '2m', target: 100 },  // Ramp up to 100 VUs
        { duration: '5m', target: 100 },  // Stay at 100 VUs
        { duration: '2m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
      exec: 'stressTest',
      startTime: '6m',  // Start after baseline
    },
    
    // Scenario 3: Spike Test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },  // Sudden spike
        { duration: '1m', target: 100 },   // Stay high
        { duration: '10s', target: 0 },    // Drop
      ],
      gracefulRampDown: '10s',
      exec: 'spikeTest',
      startTime: '22m',  // Start after stress
    },
  },
  
  thresholds: {
    // HTTP request duration
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
    
    // HTTP request failure rate
    'http_req_failed': ['rate<0.01'],  // <1% failure rate
    
    // Custom metrics
    'errors': ['rate<0.05'],  // <5% error rate
    'post_generation_duration': ['p(95)<600'],
    'response_generation_duration': ['p(95)<600'],
    'health_check_duration': ['p(95)<100'],
  },
};

// Helper function: Make authenticated request
function makeAuthenticatedRequest(method, url, body = null) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    timeout: '30s',
  };
  
  if (body) {
    return http[method](url, JSON.stringify(body), params);
  }
  return http[method](url, params);
}

// Scenario 1: Baseline Test
export function baselineTest() {
  group('Baseline Performance', function() {
    // Test 1: Health check
    group('Health Check', function() {
      const start = new Date();
      const res = http.get(`${BASE_URL}/health`);
      const duration = new Date() - start;
      
      healthCheckDuration.add(duration);
      apiRequests.add(1);
      
      const success = check(res, {
        'health check status is 200': (r) => r.status === 200,
        'health check returns healthy': (r) => JSON.parse(r.body).status === 'healthy',
        'health check < 100ms': (r) => r.timings.duration < 100,
      });
      
      errorRate.add(!success);
    });
    
    sleep(1);
    
    // Test 2: Generate post
    group('Generate Post', function() {
      const payload = {
        platform: 'twitter',
        time_of_day: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)],
      };
      
      const start = new Date();
      const res = makeAuthenticatedRequest('post', `${BASE_URL}/generate_post`, payload);
      const duration = new Date() - start;
      
      postGenerationDuration.add(duration);
      apiRequests.add(1);
      
      const success = check(res, {
        'generate_post status is 200': (r) => r.status === 200,
        'generate_post returns content': (r) => JSON.parse(r.body).content !== undefined,
        'generate_post < 500ms': (r) => r.timings.duration < 500,
      });
      
      errorRate.add(!success);
    });
    
    sleep(2);
  });
}

// Scenario 2: Stress Test
export function stressTest() {
  group('Stress Test', function() {
    // Mix of operations
    const operation = Math.random();
    
    if (operation < 0.4) {
      // 40% - Generate post
      const payload = {
        platform: Math.random() < 0.5 ? 'twitter' : 'telegram',
        time_of_day: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)],
      };
      
      const start = new Date();
      const res = makeAuthenticatedRequest('post', `${BASE_URL}/generate_post`, payload);
      const duration = new Date() - start;
      
      postGenerationDuration.add(duration);
      apiRequests.add(1);
      errorRate.add(res.status !== 200);
      
    } else if (operation < 0.8) {
      // 40% - Generate response
      const payload = {
        message: {
          id: `msg-${Date.now()}`,
          author: `user${Math.floor(Math.random() * 1000)}`,
          content: 'What do you think about OSSA and multi-agent systems?',
          platform: Math.random() < 0.5 ? 'twitter' : 'telegram',
        },
      };
      
      const start = new Date();
      const res = makeAuthenticatedRequest('post', `${BASE_URL}/generate_response`, payload);
      const duration = new Date() - start;
      
      responseGenerationDuration.add(duration);
      apiRequests.add(1);
      errorRate.add(res.status !== 200);
      
    } else {
      // 20% - Health check
      const start = new Date();
      const res = http.get(`${BASE_URL}/health`);
      const duration = new Date() - start;
      
      healthCheckDuration.add(duration);
      apiRequests.add(1);
      errorRate.add(res.status !== 200);
    }
    
    sleep(0.5);
  });
}

// Scenario 3: Spike Test
export function spikeTest() {
  group('Spike Test', function() {
    // Rapid-fire requests
    const payload = {
      platform: 'twitter',
      time_of_day: 'afternoon',
    };
    
    const res = makeAuthenticatedRequest('post', `${BASE_URL}/generate_post`, payload);
    apiRequests.add(1);
    errorRate.add(res.status !== 200);
    
    // No sleep - maximum load
  });
}

// Setup function (runs once)
export function setup() {
  console.log('🚀 Starting k6 load test for AIFlow Social Agent');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   API Key: ${API_KEY.substring(0, 8)}...`);
  
  // Verify service is accessible
  const res = http.get(`${BASE_URL}/health`);
  if (res.status !== 200) {
    throw new Error(`Service not healthy: ${res.status}`);
  }
  
  console.log('✅ Service is healthy. Starting load test...');
  return { startTime: Date.now() };
}

// Teardown function (runs once)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n✅ Load test complete. Duration: ${duration}s`);
  console.log('📊 Check k6 summary and Grafana dashboards for detailed metrics.');
}

// Handle summary (custom output)
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

// Text summary helper
function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors || false;
  
  let output = '\n' + indent + '📊 Load Test Summary\n';
  output += indent + '='.repeat(60) + '\n';
  
  // HTTP metrics
  if (data.metrics.http_reqs) {
    output += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
    output += indent + `Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  }
  
  if (data.metrics.http_req_duration) {
    output += indent + `Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    output += indent + `P95 Duration: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    output += indent + `P99 Duration: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  }
  
  if (data.metrics.http_req_failed) {
    const failRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    output += indent + `Failure Rate: ${failRate}%\n`;
  }
  
  // Custom metrics
  if (data.metrics.post_generation_duration) {
    output += indent + `\nPost Generation P95: ${data.metrics.post_generation_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  
  if (data.metrics.response_generation_duration) {
    output += indent + `Response Generation P95: ${data.metrics.response_generation_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  
  output += indent + '='.repeat(60) + '\n';
  
  return output;
}

