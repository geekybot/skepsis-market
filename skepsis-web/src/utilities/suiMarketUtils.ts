/**
 * Utility functions for SUI market detection and handling
 */

import { MARKET_DETAILS } from '@/constants/marketDetails';

/**
 * Check if a market is a SUI price prediction market
 */
export function isSUIMarket(marketId: string): boolean {
  const market = MARKET_DETAILS[marketId];
  if (!market) return false;

  // Check if the market question contains SUI price prediction keywords
  const question = market.question.toLowerCase();
  const shortTag = market.shortTag.toLowerCase();
  
  return (
    question.includes('sui') && 
    (question.includes('price') || question.includes('usd')) &&
    !question.includes('overflow') && // Exclude competition markets
    !question.includes('hackathon') &&
    !question.includes('track')
  ) || (
    shortTag.includes('sui market') ||
    shortTag.includes('sui price')
  );
}

/**
 * Get all SUI markets from the market details
 */
export function getSUIMarkets(): Array<{marketId: string; shortTag: string; question: string}> {
  return Object.entries(MARKET_DETAILS)
    .filter(([marketId]) => isSUIMarket(marketId))
    .map(([marketId, details]) => ({
      marketId,
      shortTag: details.shortTag,
      question: details.question,
    }));
}

/**
 * Get SUI market IDs only
 */
export function getSUIMarketIds(): string[] {
  return Object.keys(MARKET_DETAILS).filter(marketId => isSUIMarket(marketId));
}

/**
 * Check if currently selected market is a SUI market
 */
export function isCurrentMarketSUI(selectedMarketId: string): boolean {
  return isSUIMarket(selectedMarketId);
}
