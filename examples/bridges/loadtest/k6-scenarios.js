/**
 * k6 Load Testing Scenarios for AIFlow Agent
 * 
 * Usage:
 *   k6 run loadtest/k6-scenarios.js
 *   k6 run --out json=results.json loadtest/k6-scenarios.js
 *   k6 run --vus 100 --duration 5m loadtest/k6-scenarios.js
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const postsGenerated = new Counter('posts_generated');
const responsesGenerated = new Counter('responses_generated');
const apiLatency = new Trend('api_latency');
const successRate = new Rate('success_rate');
const phoenixTraces = new Counter('phoenix_traces');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://aiflow-social-agent.agents.svc.cluster.local:8000';
const API_KEY = __ENV.API_KEY || 'test-api-key-for-development';

// Scenario: Smoke Test (Quick validation)
export const options = {
  scenarios: {
    // 1. Smoke Test: Verify basic functionality
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { scenario: 'smoke' },
      exec: 'smokeTest',
    },

    // 2. Load Test: Normal production load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },  // Ramp up to 10 users
        { duration: '5m', target: 10 },  // Stay at 10 users
        { duration: '2m', target: 0 },   // Ramp down to 0
      ],
      tags: { scenario: 'load' },
      exec: 'loadTest',
    },

    // 3. Stress Test: Find breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },   // Below normal load
        { duration: '5m', target: 20 },   // Normal load
        { duration: '2m', target: 50 },   // Around breaking point
        { duration: '5m', target: 50 },   // Beyond breaking point
        { duration: '2m', target: 100 },  // Far beyond
        { duration: '5m', target: 100 },  
        { duration: '5m', target: 0 },    // Recovery
      ],
      tags: { scenario: 'stress' },
      exec: 'stressTest',
    },

    // 4. Spike Test: Sudden traffic spikes
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 }, // Spike to 100 users
        { duration: '1m', target: 100 },  // Stay at spike
        { duration: '10s', target: 0 },   // Drop to 0
        { duration: '1m', target: 0 },    // Recovery
      ],
      tags: { scenario: 'spike' },
      exec: 'spikeTest',
    },

    // 5. Soak Test: Extended duration for memory leaks
    soak: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30m',
      tags: { scenario: 'soak' },
      exec: 'soakTest',
    },
  },

  thresholds: {
    // HTTP Metrics
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    'http_req_failed': ['rate<0.05'],                  // Error rate < 5%
    
    // Custom Metrics
    'success_rate': ['rate>0.95'],                     // Success rate > 95%
    'api_latency': ['p(95)<500'],                      // API latency p95 < 500ms
    
    // Scenario-specific thresholds
    'http_req_duration{scenario:smoke}': ['p(95)<300'],
    'http_req_duration{scenario:load}': ['p(95)<500'],
    'http_req_duration{scenario:stress}': ['p(95)<1000'],
  },
};

// Test Functions

export function smokeTest() {
  const responses = {
    health: http.get(`${BASE_URL}/health`),
    metrics: http.get(`${BASE_URL}/metrics`),
  };

  check(responses.health, {
    'health status is 200': (r) => r.status === 200,
    'health returns healthy': (r) => r.json('status') === 'healthy',
  });

  check(responses.metrics, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics contains prometheus data': (r) => r.body.includes('aiflow_'),
  });

  sleep(1);
}

export function loadTest() {
  const scenarios = [generatePost, generateResponse];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  sleep(Math.random() * 2 + 1); // 1-3 seconds between requests
}

export function stressTest() {
  const scenarios = [generatePost, generateResponse, checkHealth];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  sleep(Math.random() * 0.5); // 0-0.5 seconds (high load)
}

export function spikeTest() {
  generatePost();
  generateResponse();
  sleep(0.1); // Minimal sleep during spike
}

export function soakTest() {
  const scenarios = [generatePost, generateResponse];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  sleep(Math.random() * 3 + 2); // 2-5 seconds (sustained load)
}

// Helper Functions

function generatePost() {
  const platforms = ['twitter', 'telegram'];
  const timesOfDay = ['morning', 'afternoon', 'evening', 'night'];
  
  const payload = {
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    time_of_day: timesOfDay[Math.floor(Math.random() * timesOfDay.length)],
  };

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    tags: { endpoint: 'generate_post' },
  };

  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/generate_post`,
    JSON.stringify(payload),
    params
  );
  const duration = Date.now() - start;

  const success = check(response, {
    'post status is 200': (r) => r.status === 200,
    'post has content': (r) => r.json('content') !== undefined,
    'post has platform': (r) => r.json('platform') !== undefined,
  });

  // Record metrics
  apiLatency.add(duration);
  successRate.add(success);
  if (success) {
    postsGenerated.add(1);
    phoenixTraces.add(1);
  }

  return response;
}

function generateResponse() {
  const platforms = ['twitter', 'telegram'];
  const authors = ['user1', 'user2', 'user3', 'user4'];
  const contents = [
    'What do you think about AI agents?',
    'How does OSSA work?',
    'Tell me about BuildKit',
    'What is Phoenix tracing?',
  ];

  const payload = {
    message: {
      id: `msg-${Date.now()}`,
      author: authors[Math.floor(Math.random() * authors.length)],
      content: contents[Math.floor(Math.random() * contents.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
    },
  };

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    tags: { endpoint: 'generate_response' },
  };

  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/generate_response`,
    JSON.stringify(payload),
    params
  );
  const duration = Date.now() - start;

  const success = check(response, {
    'response status is 200': (r) => r.status === 200,
    'response has content': (r) => r.json('content') !== undefined,
    'response has should_respond': (r) => r.json('should_respond') !== undefined,
  });

  // Record metrics
  apiLatency.add(duration);
  successRate.add(success);
  if (success) {
    responsesGenerated.add(1);
    phoenixTraces.add(1);
  }

  return response;
}

function checkHealth() {
  const response = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: 'health' },
  });

  check(response, {
    'health is 200': (r) => r.status === 200,
  });

  return response;
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total posts generated: ${postsGenerated.count}`);
  console.log(`Total responses generated: ${responsesGenerated.count}`);
  console.log(`Total Phoenix traces: ${phoenixTraces.count}`);
}

