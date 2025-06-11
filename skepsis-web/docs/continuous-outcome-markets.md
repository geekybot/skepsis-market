# Technical Guide: Continuous Outcome Markets in Skepsis

This technical guide explains how Skepsis implements continuous outcome prediction markets on the Sui blockchain, focusing on the mathematical model, implementation details, and integration points.

## Table of Contents

1. [LMSR Implementation](#lmsr-implementation)
2. [Spread Discretization](#spread-discretization)
3. [Market Data Structure](#market-data-structure)
4. [Spread Metadata System](#spread-metadata-system)
5. [Trading Mechanics](#trading-mechanics)
6. [Position Tracking](#position-tracking)
7. [Market Resolution](#market-resolution)
8. [UI Visualization](#ui-visualization)

## LMSR Implementation

The Logarithmic Market Scoring Rule (LMSR) forms the mathematical foundation of Skepsis' prediction markets. Its core function is the cost function:

```
C(q) = b * ln(sum(e^(q_i/b)))
```

Where:
- `q` is the vector of quantities of shares for each outcome spread
- `b` is the liquidity parameter (calculated as total_shares / number_of_spreads)
- The price of outcome i is: p_i = e^(q_i/b) / sum(e^(q_j/b))

### Key Implementation Challenges

1. **Fixed-Point Math**: The Sui blockchain doesn't support floating-point operations, so all calculations use fixed-point arithmetic.

2. **Overflow Protection**: Exponential functions can grow rapidly, requiring careful handling of potential overflows.

3. **Gas Efficiency**: The implementation minimizes computational complexity to reduce gas costs.

4. **Numerical Stability**: Edge cases (e.g., extreme probabilities) are handled with special case logic.

## Spread Discretization

Continuous outcomes are divided into discrete spreads or bins:

1. **Range Definition**: Each market defines a lower and upper bound for the outcome space.

2. **Spread Creation**: This range is divided into a fixed number of equal-sized spreads.

3. **Index Mapping**: Each spread is assigned an index (0 to n-1) for reference.

4. **Metadata Association**: For improved UX, each spread has associated metadata that gives context to its numerical range.

For example, a Bitcoin price market with range $0 to $100,000 might be divided into 5 spreads of $20,000 each, with custom names like "Bear Market" or "Bullish".

## Market Data Structure

The market data structure is designed for efficient retrieval and representation:

```typescript
interface MarketInfo {
  basic: {
    question: string;
    state: number;
    stateDisplay: string;
    creationTime: string;
    creationTimeDisplay: string;
    resolutionCriteria: string;
  };
  timing: {
    biddingDeadline: string;
    biddingDeadlineDisplay: string;
    resolutionTime: string;
    resolutionTimeDisplay: string;
    resolvedValue?: number;
  };
  spreads: {
    count: number;
    lowerBound: number;
    upperBound: number;
    details: SpreadDetail[];
  };
}

interface SpreadDetail {
  spreadIndex: number;
  displayRange: string;
  lowerBound: number;
  upperBound: number;
  buyPrice: number;
  buyPriceDisplay: string;
  sellPrice: number;
  sellPriceDisplay: string;
  percentage: number;
  id: string;
}
```

This structure is optimized for rendering the UI and providing all necessary information with minimal blockchain calls.

## Spread Metadata System

To enhance user experience, Skepsis implements a metadata system that provides rich context for each spread:

```typescript
interface SpreadLabel {
  name: string;         // Display name (e.g., "Bear Market")
  description?: string; // Context or explanation (e.g., "Below expected price range")
  rangeDescription?: string; // Numerical representation (e.g., "0-10k")
  range?: string;       // Alternative range representation
}
```

This metadata is defined in the application constants:

```typescript
const MARKET_SPREAD_LABELS = {
  [marketId]: [
    { 
      name: "Bear Market", 
      description: "Below expected price range", 
      rangeDescription: "0-10k",
      range: "0-10000" 
    },
    // More spreads...
  ],
  // More markets...
};
```

The metadata system provides several benefits:

1. **Intuitive Labels**: Users see meaningful names instead of just numeric ranges
2. **Contextual Information**: The description provides additional context for each spread
3. **Consistent Original Data**: The original numerical range is preserved for reference
4. **Enhanced Visualization**: UI components use this data for richer visualizations

## Trading Mechanics

Trading in Skepsis involves several key operations:

### Buying Shares

1. **Spread Selection**: The user selects a spread representing their prediction
2. **Amount Input**: The user specifies how many shares to buy
3. **Quote Calculation**: The system calculates the cost using the LMSR formula
4. **Transaction Execution**: A transaction is sent to the blockchain to execute the trade
5. **Position Creation**: A new position is created or an existing one is updated

### Selling Shares

1. **Position Selection**: The user selects an existing position to sell
2. **Amount Input**: The user specifies how many shares to sell
3. **Quote Calculation**: The system calculates the return using the LMSR formula
4. **Transaction Execution**: A transaction is sent to the blockchain to execute the trade
5. **Position Update**: The user's position is updated or removed

### Price Impact

The LMSR formula naturally handles price impact:

1. **Small Trades**: Have minimal impact on market prices
2. **Large Trades**: Move prices more significantly
3. **Dynamic Pricing**: All prices are recalculated after each trade

## Position Tracking

User positions are tracked using a position registry:

```typescript
interface Position {
  id: string;
  marketId: string;
  spreadIndex: number;
  sharesAmount: number;
  value: number;
  timestamp: number;
}
```

The system provides comprehensive position tracking:
- Current share count
- Current value based on market prices
- Profit/loss calculation
- Historical position data

## Market Resolution

When a market resolves:

1. **Resolution Value Submission**: The actual outcome value is submitted
2. **Winning Spread Determination**: The system identifies which spread contains this value
3. **State Update**: The market state changes to "Resolved"
4. **Share Value Determination**: 
   - Shares in the winning spread become worth exactly 1 USDC each, regardless of the purchase price
   - Shares in all other spreads become worthless (0 USDC value)
5. **Claiming Process**: Users can claim their winnings if they hold positions in the winning spread

For example, if a user bought 10 shares in the winning spread at 0.3 USDC each (total cost: 3 USDC), they can redeem those shares for 10 USDC after resolution, yielding a 7 USDC profit.

Resolution rules ensure that:
1. Only the spread containing the exact value is considered winning
2. Edge cases (values at boundaries) are handled consistently
3. The resolution can be verified by all participants
4. The binary payout structure (1 USDC per winning share, 0 for others) creates clear incentives

## UI Visualization

Skepsis provides rich visualizations for continuous outcome markets:

### Market Spreads Bar

The `MarketSpreadsBar` component visualizes the probability distribution:
- Horizontal bars represent each spread
- Width is proportional to the market's probability estimate
- Colors differentiate the spreads
- Tooltips show detailed information
- Metadata enhances the display with meaningful labels

```tsx
<MarketSpreadsBar
  marketId={marketId}
  className="mb-6"
/>
```

### Spread Selection Interface

The trading interface displays spreads as interactive elements:
- Color-coded to match the visualization
- Shows current probability and price
- Displays metadata-enhanced labels
- Provides tooltips with additional information

### Position Display

User positions are displayed with:
- Metadata-enhanced spread labels
- Current value calculation
- Winning status (for resolved markets)
- Claim interface for winners

## Integration Points

The continuous outcome market implementation integrates with several system components:

1. **Wallet Connection**: For executing transactions
2. **Blockchain RPC**: For fetching market data
3. **Transaction Builder**: For creating trade transactions
4. **Event System**: For real-time updates
5. **UI Components**: For visualization and interaction

## Conclusion

Skepsis' implementation of continuous outcome markets provides a powerful way to express nuanced beliefs about future events. The system combines sophisticated mathematics with user-friendly interfaces to create a prediction market platform that goes beyond simple binary outcomes.

By using the LMSR mechanism, discretized spreads, and rich metadata, Skepsis enables more expressive and informative prediction markets while maintaining the security and efficiency required for blockchain applications.

---

For more information:
- See the complete [Skepsis Documentation](./README.md)
- Review the [Whitepaper](../whitepaper.md) for theoretical details
- Explore the [API Reference](./api-reference.md) for implementation details
