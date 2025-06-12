/**
 * Cache Performance Monitor
 * 
 * A utility for monitoring cache performance in production and development
 */

interface CachePerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageResponseTime: number;
  errorRate: number;
  lastReset: Date;
}

class CachePerformanceMonitor {
  private metrics: CachePerformanceMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    averageResponseTime: 0,
    errorRate: 0,
    lastReset: new Date()
  };

  private responseTimes: number[] = [];
  private errors: number = 0;

  recordCacheHit(responseTime: number) {
    this.metrics.totalRequests++;
    this.metrics.cacheHits++;
    this.recordResponseTime(responseTime);
    this.updateMetrics();
  }

  recordCacheMiss(responseTime: number) {
    this.metrics.totalRequests++;
    this.metrics.cacheMisses++;
    this.recordResponseTime(responseTime);
    this.updateMetrics();
  }

  recordError() {
    this.errors++;
    this.updateMetrics();
  }

  private recordResponseTime(time: number) {
    this.responseTimes.push(time);
    // Keep only last 100 response times for rolling average
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  private updateMetrics() {
    this.metrics.hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;
    
    this.metrics.averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    this.metrics.errorRate = this.metrics.totalRequests > 0
      ? (this.errors / this.metrics.totalRequests) * 100
      : 0;
  }

  getMetrics(): CachePerformanceMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastReset: new Date()
    };
    this.responseTimes = [];
    this.errors = 0;
  }

  // Get performance summary for logging
  getSummary(): string {
    const metrics = this.getMetrics();
    return `Cache Performance: ${metrics.hitRate.toFixed(1)}% hit rate, ` +
           `${metrics.averageResponseTime.toFixed(0)}ms avg response, ` +
           `${metrics.totalRequests} total requests`;
  }

  // Check if performance is below threshold
  isPerformanceDegraded(): boolean {
    const metrics = this.getMetrics();
    return metrics.hitRate < 50 || metrics.averageResponseTime > 1000 || metrics.errorRate > 10;
  }
}

// Export singleton instance
export const cacheMonitor = new CachePerformanceMonitor();

// Auto-log performance every 5 minutes in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const summary = cacheMonitor.getSummary();
    
    if (cacheMonitor.isPerformanceDegraded()) {
      // Performance monitoring could be logged to external service here
    }
  }, 5 * 60 * 1000);
}

export default cacheMonitor;
