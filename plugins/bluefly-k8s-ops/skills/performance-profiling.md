---
name: performance-profiling
description: "**Performance Profiler**: Profiles frontend and backend performance. Identifies bottlenecks, memory leaks, slow queries, and rendering issues. Supports Node.js, PHP, Python, and browser APIs. - MANDATORY TRIGGERS: performance, profiling, bottleneck, slow, latency, memory leak, lighthouse, core web vitals"
license: "Apache-2.0"
compatibility: "Works with Node.js, PHP, Python. Browser performance via Lighthouse."
allowed-tools: "Bash(node:*) Bash(lighthouse:*) Read Grep Glob Task"
metadata:
  domain: performance
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.5
  npm_package: "@bluefly/openstandardagents"
---

# Performance Profiler Skill

**OSSA Agent**: `performance-profiler` | **Version**: 1.0.0 | **Namespace**: blueflyio

Profiles application performance and generates optimization recommendations.

## Capabilities

| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `backend-profiling` | reasoning | fully_autonomous | Profile Node.js, PHP, Python |
| `frontend-profiling` | reasoning | fully_autonomous | Core Web Vitals and rendering |
| `query-optimization` | reasoning | fully_autonomous | Slow database query optimization |
| `memory-analysis` | reasoning | fully_autonomous | Memory leak detection |
| `optimization-roadmap` | action | fully_autonomous | Prioritized recommendations |

## Metrics Analyzed

- **LCP** (Largest Contentful Paint) — target < 2.5s
- **FID** (First Input Delay) — target < 100ms
- **CLS** (Cumulative Layout Shift) — target < 0.1
- **TTFB** (Time to First Byte) — target < 200ms
- **Query execution time** — target < 50ms p95
- **Memory heap growth** — stable over 1hr window

## Usage

```
User: Profile the API response times for /api/v1/agents
Agent: Profiling endpoint...
       p50: 45ms, p95: 230ms, p99: 890ms
       Bottleneck: N+1 query in agent capability loading
       [Optimization recommendations with impact estimates]
```
