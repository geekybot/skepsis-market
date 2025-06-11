import { SpreadLabel } from '@/constants/marketDetails';
import { Position } from '@/hooks/useMarketPositions';

/**
 * Finds the matching spread label for a position based on its spread index
 * @param position The position to find a matching label for
 * @param spreadLabels Array of available spread labels for the market
 * @returns The matching SpreadLabel or undefined if no match found
 */
export const findMatchingSpreadLabel = (position: Position, spreadLabels: SpreadLabel[] | undefined): SpreadLabel | undefined => {
  if (!spreadLabels || spreadLabels.length === 0) return undefined;
  
  // Calculate expected range for this position
  const posMin = position.spreadIndex * 10;
  const posMax = position.spreadIndex * 10 + 10;
  
  // First try to find an exact index match (most reliable)
  const exactIndexMatch = spreadLabels.find(label => label.index === position.spreadIndex);
  if (exactIndexMatch) {
    console.log("Found exact index match for position " + position.id.substring(0, 8) + ": label.index=" + exactIndexMatch.index);
    return exactIndexMatch;
  }
  
  // If no exact index match, try to match by lowerBound/upperBound
  const exactBoundsMatch = spreadLabels.find(label => 
    label.lowerBound !== undefined && 
    label.upperBound !== undefined && 
    label.lowerBound === posMin && 
    label.upperBound === posMax
  );
  
  if (exactBoundsMatch) {
    console.log("Found exact bounds match for position " + position.id.substring(0, 8) + ": " + 
      exactBoundsMatch.lowerBound + "-" + exactBoundsMatch.upperBound);
    return exactBoundsMatch;
  }
  
  // If still no match, log a warning and return undefined
  console.warn("No matching spread label found for position " + position.id.substring(0, 8) + " with spreadIndex " + position.spreadIndex);
  return undefined;
};

/**
 * Formats a position range for display using its spread index
 * @param spreadIndex The position spread index
 * @param matchingLabel Optional matching spread label if available
 * @returns An object containing formatted range display strings
 */
export const formatPositionRange = (spreadIndex: number, matchingLabel?: SpreadLabel) => {
  // Calculate raw position range values
  const posMin = spreadIndex * 10;
  const posMax = spreadIndex * 10 + 10;

  // Format the range display for consistency
  const formattedLowerBound = matchingLabel?.lowerBound !== undefined ? 
    (matchingLabel.lowerBound / 100).toFixed(2) : (posMin / 100).toFixed(2);
  const formattedUpperBound = matchingLabel?.upperBound !== undefined ? 
    (matchingLabel.upperBound / 100).toFixed(2) : (posMax / 100).toFixed(2);

  return {
    rawRange: `${posMin}-${posMax}`,
    formattedRange: `${formattedLowerBound}-${formattedUpperBound} $`
  };
};

/**
 * Creates a synthetic SpreadOption from a position when no matching option exists in the UI
 * @param position The position to create a synthetic option for
 * @param matchingLabel The matching spread label if found
 * @returns A synthetic SpreadOption object
 */
export const createSyntheticOption = (position: Position, matchingLabel?: SpreadLabel) => {
  const { rawRange, formattedRange } = formatPositionRange(position.spreadIndex, matchingLabel);
  
  return {
    id: `synthetic-${position.spreadIndex}`,
    value: position.spreadIndex.toString(),
    label: matchingLabel?.name || `Spread #${position.spreadIndex}`,
    originalRange: formattedRange,
    buyPrice: "0.000",
    sellPrice: null,
    percentage: 0,
    metadata: matchingLabel || {
      index: position.spreadIndex,
      name: `Spread #${position.spreadIndex}`,
      lowerBound: position.spreadIndex * 10,
      upperBound: position.spreadIndex * 10 + 10,
      rangeDescription: rawRange,
    }
  };
};
