/**
 * Analytics Debug Component
 * Shows analytics configuration status and allows testing events
 */

import React, { useState } from 'react';
import { getAnalyticsInfo, trackEvent, isAnalyticsConfigured } from '@/lib/analytics';

const AnalyticsDebug: React.FC = () => {
  const [testEventResult, setTestEventResult] = useState<string>('');
  const analyticsInfo = getAnalyticsInfo();

  const handleTestEvent = () => {
    try {
      trackEvent('test_event', {
        test_parameter: 'debug_test',
        timestamp: new Date().toISOString(),
      });
      setTestEventResult('✅ Test event sent successfully!');
      
      // Clear the result after 3 seconds
      setTimeout(() => setTestEventResult(''), 3000);
    } catch (error) {
      setTestEventResult(`❌ Error: ${error}`);
    }
  };

  const getStatusColor = (condition: boolean) => {
    return condition ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? '✅' : '❌';
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Analytics Configuration Status</h3>
      
      {/* Configuration Status */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span>{getStatusIcon(analyticsInfo.enabled)}</span>
          <span className={getStatusColor(analyticsInfo.enabled)}>
            Analytics Enabled: {analyticsInfo.enabled ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>{getStatusIcon(analyticsInfo.hasGA4)}</span>
          <span className={getStatusColor(analyticsInfo.hasGA4)}>
            Google Analytics 4: {analyticsInfo.hasGA4 ? `Configured (${analyticsInfo.measurementId})` : 'Not configured'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>{getStatusIcon(analyticsInfo.hasGTM)}</span>
          <span className={getStatusColor(analyticsInfo.hasGTM)}>
            Google Tag Manager: {analyticsInfo.hasGTM ? `Configured (${analyticsInfo.gtmId})` : 'Not configured'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>{getStatusIcon(analyticsInfo.debug)}</span>
          <span className={getStatusColor(analyticsInfo.debug)}>
            Debug Mode: {analyticsInfo.debug ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Overall Status */}
      <div className="mb-4 p-3 rounded bg-gray-700/30">
        <div className="text-sm text-white/60">Overall Status:</div>
        <div className={`font-medium ${getStatusColor(isAnalyticsConfigured())}`}>
          {isAnalyticsConfigured() ? 
            '🟢 Analytics is properly configured and ready to collect data' : 
            '🔴 Analytics is not properly configured - check environment variables'
          }
        </div>
      </div>

      {/* Test Event Button */}
      <div className="space-y-2">
        <button
          onClick={handleTestEvent}
          disabled={!isAnalyticsConfigured()}
          className={`px-4 py-2 rounded transition-colors ${
            isAnalyticsConfigured()
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Send Test Event
        </button>
        
        {testEventResult && (
          <div className="text-sm text-white/80 mt-2">
            {testEventResult}
          </div>
        )}
      </div>

      {/* Debug Info */}
      {analyticsInfo.debug && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded">
          <div className="text-yellow-400 text-sm font-medium">Debug Mode Active</div>
          <div className="text-yellow-300 text-xs mt-1">
            Check browser console for detailed analytics events
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDebug;
