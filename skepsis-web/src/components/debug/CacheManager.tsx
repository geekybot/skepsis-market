/**
 * Cache Manager Component
 * 
 * A debug component for monitoring and managing the market data cache
 */

import React, { useState } from 'react';
import { useMarketCacheManager } from '@/hooks/useOptimizedMarketInfo';
import { performCacheHealthCheck, CacheHealthReport } from '@/lib/cacheHealthCheck';
import { cacheMonitor } from '@/lib/cachePerformanceMonitor';

interface CacheStatsDisplayProps {
  stats: any;
  onClearCache: () => void;
  onRefreshStats: () => void;
}

const CacheStatsDisplay: React.FC<CacheStatsDisplayProps> = ({ 
  stats, 
  onClearCache, 
  onRefreshStats 
}) => {
  if (!stats) {
    return <div className="text-white/60">Loading cache stats...</div>;
  }

  const totalCacheEntries = Object.values(stats).reduce(
    (sum: number, cache: any) => sum + cache.total, 
    0
  );

  const totalValidEntries = Object.values(stats).reduce(
    (sum: number, cache: any) => sum + cache.valid, 
    0
  );

  const cacheHitRate = totalCacheEntries > 0 
    ? ((totalValidEntries / totalCacheEntries) * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Market Data Cache Status</h3>
        <div className="flex gap-2">
          <button
            onClick={onRefreshStats}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={onClearCache}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-700/30 rounded p-3">
          <div className="text-2xl font-bold text-green-400">{totalValidEntries}</div>
          <div className="text-sm text-white/60">Valid Entries</div>
        </div>
        <div className="bg-gray-700/30 rounded p-3">
          <div className="text-2xl font-bold text-blue-400">{totalCacheEntries}</div>
          <div className="text-sm text-white/60">Total Entries</div>
        </div>
        <div className="bg-gray-700/30 rounded p-3">
          <div className="text-2xl font-bold text-yellow-400">{cacheHitRate}%</div>
          <div className="text-sm text-white/60">Hit Rate</div>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(stats).map(([cacheType, cacheStats]: [string, any]) => (
          <div key={cacheType} className="bg-gray-700/20 rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-white capitalize">{cacheType} Cache</span>
              <span className="text-sm text-white/60">
                {cacheStats.valid}/{cacheStats.total} valid
              </span>
            </div>
            
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  cacheType === 'static' ? 'bg-green-500' :
                  cacheType === 'dynamic' ? 'bg-blue-500' :
                  cacheType === 'timing' ? 'bg-yellow-500' :
                  cacheType === 'user' ? 'bg-purple-500' :
                  'bg-red-500'
                }`}
                style={{
                  width: cacheStats.total > 0 
                    ? `${(cacheStats.valid / cacheStats.total) * 100}%` 
                    : '0%'
                }}
              />
            </div>
            
            {cacheStats.expired > 0 && (
              <div className="text-xs text-red-400 mt-1">
                {cacheStats.expired} expired entries
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-white/50">
        Cache Types: Static (never expires), Semi-Static (5min), Dynamic (30s), User (10s), Error (5s)
      </div>
    </div>
  );
};

export const CacheManager: React.FC = () => {
  const { stats, refreshStats, clearCache } = useMarketCacheManager();
  const [healthReport, setHealthReport] = useState<CacheHealthReport | null>(null);

  const runHealthCheck = () => {
    const report = performCacheHealthCheck();
    setHealthReport(report);
  };

  const resetPerformanceMetrics = () => {
    cacheMonitor.reset();
    refreshStats();
  };

  return (
    <div className="space-y-6">
      <CacheStatsDisplay
        stats={stats}
        onClearCache={clearCache}
        onRefreshStats={refreshStats}
      />
      
      {/* Health Check Section */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Cache Health Check</h3>
          <div className="flex gap-2">
            <button
              onClick={runHealthCheck}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Run Health Check
            </button>
            <button
              onClick={resetPerformanceMetrics}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              Reset Metrics
            </button>
          </div>
        </div>

        {healthReport && (
          <div className="space-y-4">
            {/* Health Status */}
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded text-sm font-medium ${
                healthReport.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                healthReport.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {healthReport.status.toUpperCase()}
              </div>
              <div className="text-white">
                Score: {healthReport.score}/100
              </div>
            </div>

            {/* Performance Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-700/30 rounded p-2">
                <div className="text-sm text-white/60">Hit Rate</div>
                <div className="text-lg font-bold text-white">{healthReport.statistics.hitRate.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-700/30 rounded p-2">
                <div className="text-sm text-white/60">Avg Response</div>
                <div className="text-lg font-bold text-white">{healthReport.statistics.averageResponseTime.toFixed(0)}ms</div>
              </div>
              <div className="bg-gray-700/30 rounded p-2">
                <div className="text-sm text-white/60">Error Rate</div>
                <div className="text-lg font-bold text-white">{healthReport.statistics.errorRate.toFixed(1)}%</div>
              </div>
            </div>

            {/* Issues */}
            {healthReport.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-400 mb-2">Issues:</h4>
                <ul className="space-y-1">
                  {healthReport.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-300">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {healthReport.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {healthReport.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-300">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!healthReport && (
          <div className="text-sm text-white/60">
            Click "Run Health Check" to analyze cache performance and get recommendations.
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheManager;
