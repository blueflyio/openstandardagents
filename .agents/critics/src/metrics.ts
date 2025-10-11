/**
 * Metrics collection for Code Reviewer Agent
 */

import { AgentMetrics, RequestMetrics, ReviewResponse, SecurityScanResponse } from './types';
import { RateLimiter } from './utils';

export class MetricsCollector {
  private metrics: AgentMetrics;
  private rateLimiter: RateLimiter;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.rateLimiter = new RateLimiter();
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        average_duration: 0
      },
      reviews: {
        total: 0,
        passed: 0,
        failed: 0,
        average_score: 0
      },
      security: {
        scans_performed: 0,
        vulnerabilities_found: 0,
        critical_vulnerabilities: 0
      },
      performance: {
        uptime: 0,
        memory_usage: 0,
        cpu_usage: 0
      }
    };

    // Start periodic cleanup
    setInterval(() => {
      this.rateLimiter.cleanup();
      this.updatePerformanceMetrics();
    }, 60000); // Every minute
  }

  recordRequest(request: RequestMetrics): void {
    this.metrics.requests.total++;

    if (request.statusCode >= 200 && request.statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Update average duration
    const totalRequests = this.metrics.requests.total;
    const currentAvg = this.metrics.requests.average_duration;
    this.metrics.requests.average_duration =
      (currentAvg * (totalRequests - 1) + request.duration) / totalRequests;
  }

  recordReview(review: ReviewResponse): void {
    this.metrics.reviews.total++;

    if (review.summary.status === 'passed') {
      this.metrics.reviews.passed++;
    } else {
      this.metrics.reviews.failed++;
    }

    // Update average score
    const totalReviews = this.metrics.reviews.total;
    const currentAvg = this.metrics.reviews.average_score;
    this.metrics.reviews.average_score =
      (currentAvg * (totalReviews - 1) + review.summary.overallScore) / totalReviews;
  }

  recordSecurityScan(scan: SecurityScanResponse): void {
    this.metrics.security.scans_performed++;
    this.metrics.security.vulnerabilities_found += scan.vulnerabilities.length;
    this.metrics.security.critical_vulnerabilities +=
      scan.vulnerabilities.filter(v => v.severity === 'critical').length;
  }

  checkRateLimit(clientId: string, limit: number = 1000): boolean {
    return this.rateLimiter.isRateLimited(clientId, limit);
  }

  getMetrics(): AgentMetrics {
    this.updatePerformanceMetrics();
    return { ...this.metrics };
  }

  private updatePerformanceMetrics(): void {
    this.metrics.performance.uptime = (Date.now() - this.startTime) / 1000;

    const memUsage = process.memoryUsage();
    this.metrics.performance.memory_usage = memUsage.heapUsed / (1024 * 1024); // MB

    // CPU usage would require additional monitoring
    this.metrics.performance.cpu_usage = 0;
  }

  reset(): void {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, average_duration: 0 },
      reviews: { total: 0, passed: 0, failed: 0, average_score: 0 },
      security: { scans_performed: 0, vulnerabilities_found: 0, critical_vulnerabilities: 0 },
      performance: { uptime: 0, memory_usage: 0, cpu_usage: 0 }
    };
  }
}