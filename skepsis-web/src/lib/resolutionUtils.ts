import { SpreadLabel } from '@/constants/marketDetails';
import { MARKET_SPREAD_LABELS } from '@/constants/marketDetails';

/**
 * Determines the winning spread name based on the resolved value using the same logic as the smart contract
 * This matches the find_winning_spread function in distribution_market.move
 */
export function getWinningSpreadInfo(
  marketId: string, 
  resolvedValue: number,
  spreads?: Array<{ spreadIndex: number; lowerBound: number; upperBound: number }>
): { winningSpreadIndex: number; winningSpreadName: string; displayText: string } | null {
  
  // Get spread labels for this market
  const spreadLabels = MARKET_SPREAD_LABELS[marketId];
  if (!spreadLabels || spreadLabels.length === 0) {
    return null;
  }

  // If we have actual spread data from blockchain, use it for bounds checking
  // Otherwise, use the spread labels bounds as fallback
  let winningSpreadIndex = -1;
  
  if (spreads && spreads.length > 0) {
    // Use actual blockchain spread data - this matches the smart contract logic exactly
    const sortedSpreads = [...spreads].sort((a, b) => a.spreadIndex - b.spreadIndex);
    const firstSpread = sortedSpreads[0];
    const lastSpread = sortedSpreads[sortedSpreads.length - 1];
    
    // Smart contract logic: if resolved value is below first spread, use first spread
    if (resolvedValue < firstSpread.lowerBound) {
      winningSpreadIndex = 0;
    }
    // If resolved value is above last spread, use last spread
    else if (resolvedValue > lastSpread.upperBound) {
      winningSpreadIndex = sortedSpreads.length - 1;
    }
    // Find the spread that contains the resolved value
    else {
      for (const spread of sortedSpreads) {
        // Smart contract uses: resolved_value > lower_bound && resolved_value <= upper_bound
        if (resolvedValue > spread.lowerBound && resolvedValue <= spread.upperBound) {
          winningSpreadIndex = spread.spreadIndex;
          break;
        }
      }
    }
  } else {
    // Fallback to spread labels bounds if no blockchain data available
    for (const label of spreadLabels) {
      if (label.lowerBound !== undefined && label.upperBound !== undefined) {
        // Use same logic as smart contract
        if (resolvedValue > label.lowerBound && resolvedValue <= label.upperBound) {
          winningSpreadIndex = label.index;
          break;
        }
      }
    }
  }

  // Find the matching spread label by index
  const winningLabel = spreadLabels.find(label => label.index === winningSpreadIndex);
  
  if (!winningLabel) {
    return null;
  }

  // Create meaningful display text based on market type
  let displayText = '';
  
  // Handle different market types
  if (marketId === '0x25045de4fea843911dcd9a386509e39f994bba17e8fa2dd0a3574daac5a72fff') {
    // UCL 2025 market - show winner name
    displayText = `${winningLabel.name}`;
  } else if (marketId === '0xc07823e6ce8bbe82cc188ef33738387735cc20d56aae5d05d6b953f3b4ca2afd') {
    // Premier League 2025 market
    displayText = `${winningLabel.name}`;
  } else if (winningLabel.name.includes('Liverpool') || winningLabel.name.includes('Manchester') || winningLabel.name.includes('Arsenal')) {
    // Football-related markets
    displayText = `${winningLabel.name}`;
  } else if (winningLabel.name.includes('$')) {
    // Price-based markets (Bitcoin, etc.)
    displayText = `${winningLabel.name} range`;
  } else if (winningLabel.name.toLowerCase().includes('degree') || winningLabel.name.toLowerCase().includes('temperature')) {
    // Temperature markets
    displayText = `Temperature was in ${winningLabel.name}`;
  } else {
    // Generic fallback
    displayText = `${winningLabel.name} was the winning outcome`;
  }

  return {
    winningSpreadIndex,
    winningSpreadName: winningLabel.name,
    displayText
  };
}

/**
 * Gets a short resolution display for compact spaces
 */
export function getShortResolutionDisplay(
  marketId: string, 
  resolvedValue: number,
  spreads?: Array<{ spreadIndex: number; lowerBound: number; upperBound: number }>
): string {
  const winningInfo = getWinningSpreadInfo(marketId, resolvedValue, spreads);
  
  if (!winningInfo) {
    return `Value: ${resolvedValue}`;
  }

  // Return just the winning spread name for compact display
  return winningInfo.winningSpreadName;
}

/**
 * Gets a detailed resolution display for full contexts
 */
export function getDetailedResolutionDisplay(
  marketId: string, 
  resolvedValue: number,
  spreads?: Array<{ spreadIndex: number; lowerBound: number; upperBound: number }>
): { title: string; description: string; value: string } {
  const winningInfo = getWinningSpreadInfo(marketId, resolvedValue, spreads);
  
  if (!winningInfo) {
    return {
      title: 'Resolved Value',
      description: `Market resolved with value ${resolvedValue}`,
      value: resolvedValue.toString()
    };
  }

  return {
    title: 'Market Result',
    description: winningInfo.displayText,
    value: resolvedValue.toString()
  };
}
