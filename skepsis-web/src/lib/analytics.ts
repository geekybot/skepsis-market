/**
 * Google Analytics utilities for tracking events and page views
 */

import { ANALYTICS_CONFIG } from '@/constants/appConstants';

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Track a custom event in Google Analytics
 * @param eventName - Name of the event
 * @param parameters - Event parameters
 */
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!ANALYTICS_CONFIG.enabled || typeof window === 'undefined') {
    return;
  }

  try {
    if (ANALYTICS_CONFIG.gaMeasurementId && window.gtag) {
      window.gtag('event', eventName, {
        ...parameters,
        send_to: ANALYTICS_CONFIG.gaMeasurementId,
      });
    }

    // Also send to dataLayer for GTM if configured
    if (ANALYTICS_CONFIG.gtmId && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...parameters,
      });
    }

    if (ANALYTICS_CONFIG.options.debug) {
      console.log('Analytics Event Tracked:', eventName, parameters);
    }
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
};

/**
 * Track a page view
 * @param path - Page path
 * @param title - Page title
 */
export const trackPageView = (path: string, title?: string) => {
  if (!ANALYTICS_CONFIG.enabled || typeof window === 'undefined') {
    return;
  }

  try {
    if (ANALYTICS_CONFIG.gaMeasurementId && window.gtag) {
      window.gtag('config', ANALYTICS_CONFIG.gaMeasurementId, {
        page_path: path,
        page_title: title,
      });
    }

    if (ANALYTICS_CONFIG.options.debug) {
      console.log('Analytics Page View Tracked:', path, title);
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * Track market interactions
 */
export const trackMarketInteraction = (action: string, marketId: string, details?: Record<string, any>) => {
  trackEvent('market_interaction', {
    action,
    market_id: marketId,
    ...details,
  });
};

/**
 * Track trading actions
 */
export const trackTradingAction = (action: 'buy' | 'sell' | 'claim', details: Record<string, any>) => {
  trackEvent('trading_action', {
    action,
    ...details,
  });
};

/**
 * Track wallet connections
 */
export const trackWalletConnection = (walletType: string, connected: boolean) => {
  trackEvent('wallet_interaction', {
    action: connected ? 'connect' : 'disconnect',
    wallet_type: walletType,
  });
};

/**
 * Check if analytics is properly configured and running
 */
export const isAnalyticsConfigured = (): boolean => {
  return ANALYTICS_CONFIG.enabled && (
    !!(ANALYTICS_CONFIG.gaMeasurementId || ANALYTICS_CONFIG.gtmId)
  );
};

/**
 * Get analytics configuration info for debugging
 */
export const getAnalyticsInfo = () => {
  return {
    enabled: ANALYTICS_CONFIG.enabled,
    hasGA4: !!ANALYTICS_CONFIG.gaMeasurementId,
    hasGTM: !!ANALYTICS_CONFIG.gtmId,
    measurementId: ANALYTICS_CONFIG.gaMeasurementId ? 
      ANALYTICS_CONFIG.gaMeasurementId.substring(0, 5) + '...' : null,
    gtmId: ANALYTICS_CONFIG.gtmId ? 
      ANALYTICS_CONFIG.gtmId.substring(0, 5) + '...' : null,
    debug: ANALYTICS_CONFIG.options.debug,
  };
};
