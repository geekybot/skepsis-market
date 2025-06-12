/**
 * Cache Health Check Utility
 * 
 * Provides health checks and diagnostics for the caching system
 */

import { marketDataCache } from '@/lib/marketDataCache';
import { cacheMonitor } from '@/lib/cachePerformanceMonitor';

export interface CacheHealthReport {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  statistics: {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    hitRate: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export function performCacheHealthCheck(): CacheHealthReport {
  const stats = marketDataCache.getStats();
  const perfMetrics = cacheMonitor.getMetrics();
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Calculate total entries across all cache types
  const totalEntries = Object.values(stats).reduce((sum, cache) => sum + cache.total, 0);
  const validEntries = Object.values(stats).reduce((sum, cache) => sum + cache.valid, 0);
  const expiredEntries = Object.values(stats).reduce((sum, cache) => sum + cache.expired, 0);

  // Check hit rate
  if (perfMetrics.hitRate < 50) {
    issues.push(`Low cache hit rate: ${perfMetrics.hitRate.toFixed(1)}%`);
    recommendations.push('Consider pre-warming cache with popular market data');
    score -= 20;
  } else if (perfMetrics.hitRate < 70) {
    issues.push(`Moderate cache hit rate: ${perfMetrics.hitRate.toFixed(1)}%`);
    recommendations.push('Optimize cache expiration times');
    score -= 10;
  }

  // Check response time
  if (perfMetrics.averageResponseTime > 1000) {
    issues.push(`High average response time: ${perfMetrics.averageResponseTime.toFixed(0)}ms`);
    recommendations.push('Investigate slow blockchain calls');
    score -= 15;
  } else if (perfMetrics.averageResponseTime > 500) {
    issues.push(`Moderate response time: ${perfMetrics.averageResponseTime.toFixed(0)}ms`);
    recommendations.push('Consider optimizing data fetching');
    score -= 5;
  }

  // Check error rate
  if (perfMetrics.errorRate > 10) {
    issues.push(`High error rate: ${perfMetrics.errorRate.toFixed(1)}%`);
    recommendations.push('Check blockchain connectivity and error handling');
    score -= 25;
  } else if (perfMetrics.errorRate > 5) {
    issues.push(`Moderate error rate: ${perfMetrics.errorRate.toFixed(1)}%`);
    recommendations.push('Monitor for intermittent connectivity issues');
    score -= 10;
  }

  // Check cache memory usage
  if (totalEntries > 1000) {
    issues.push(`High cache memory usage: ${totalEntries} entries`);
    recommendations.push('Consider reducing cache expiration times or implementing LRU eviction');
    score -= 10;
  }

  // Check expired entries ratio
  const expiredRatio = totalEntries > 0 ? (expiredEntries / totalEntries) * 100 : 0;
  if (expiredRatio > 30) {
    issues.push(`High expired entries ratio: ${expiredRatio.toFixed(1)}%`);
    recommendations.push('Run cache cleanup more frequently');
    score -= 5;
  }

  // Determine overall status
  let status: 'healthy' | 'warning' | 'critical';
  if (score >= 80) {
    status = 'healthy';
  } else if (score >= 60) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  // Add general recommendations if no specific issues
  if (issues.length === 0) {
    recommendations.push('Cache system is performing well');
    recommendations.push('Continue monitoring performance metrics');
  }

  return {
    status,
    score: Math.max(0, score),
    issues,
    recommendations,
    statistics: {
      totalEntries,
      validEntries,
      expiredEntries,
      hitRate: perfMetrics.hitRate,
      averageResponseTime: perfMetrics.averageResponseTime,
      errorRate: perfMetrics.errorRate
    }
  };
}

export function generateCacheHealthSummary(): string {
  const report = performCacheHealthCheck();
  
  let summary = `Cache Health Status: ${report.status.toUpperCase()} (Score: ${report.score}/100)\n\n`;
  
  summary += `Statistics:\n`;
  summary += `- Total Entries: ${report.statistics.totalEntries}\n`;
  summary += `- Valid Entries: ${report.statistics.validEntries}\n`;
  summary += `- Hit Rate: ${report.statistics.hitRate.toFixed(1)}%\n`;
  summary += `- Avg Response Time: ${report.statistics.averageResponseTime.toFixed(0)}ms\n`;
  summary += `- Error Rate: ${report.statistics.errorRate.toFixed(1)}%\n\n`;
  
  if (report.issues.length > 0) {
    summary += `Issues:\n`;
    report.issues.forEach(issue => summary += `- ${issue}\n`);
    summary += '\n';
  }
  
  if (report.recommendations.length > 0) {
    summary += `Recommendations:\n`;
    report.recommendations.forEach(rec => summary += `- ${rec}\n`);
  }
  
  return summary;
}

// Auto health check in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run health check every 10 minutes
  setInterval(() => {
    const report = performCacheHealthCheck();
    if (report.status !== 'healthy') {
      console.warn('🔍 Cache Health Check:', report.status.toUpperCase());
      console.warn('Issues:', report.issues.join(', '));
    }
  }, 10 * 60 * 1000);
}

export default {
  performCacheHealthCheck,
  generateCacheHealthSummary
};
