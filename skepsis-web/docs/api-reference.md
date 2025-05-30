# Skepsis API Reference

This reference document provides detailed information about the Skepsis API, including hooks, components, and utilities for interacting with the Skepsis prediction market platform.

## Table of Contents

1. [React Hooks](#react-hooks)
2. [Components](#components)
3. [Market Service](#market-service)
4. [Types and Interfaces](#types-and-interfaces)
5. [Constants](#constants)
6. [Utilities](#utilities)

## React Hooks

### useLiveMarketInfo

Fetches and maintains real-time market information.

```typescript
const { data, loading, error, refresh } = useLiveMarketInfo(marketId: string);
```

**Parameters:**
- `marketId`: The ID of the market to fetch information for

**Returns:**
- `data`: The market information
- `loading`: Boolean indicating if the data is being fetched
- `error`: Any error that occurred during fetching
- `refresh`: Function to manually refresh the data

**Example:**
```typescript
import { useLiveMarketInfo } from '@/hooks/useLiveMarketInfo';

function MarketDisplay({ marketId }) {
  const { data, loading, error, refresh } = useLiveMarketInfo(marketId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>{data.basic.question}</h2>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### useMarketPositions

Retrieves user positions for a specific market.

```typescript
const { positions, loading, error, refresh } = useMarketPositions(marketId: string);
```

**Parameters:**
- `marketId`: The ID of the market

**Returns:**
- `positions`: Array of user positions in the market
- `loading`: Boolean indicating if the data is being fetched
- `error`: Any error that occurred during fetching
- `refresh`: Function to manually refresh the data

**Example:**
```typescript
import { useMarketPositions } from '@/hooks/useMarketPositions';

function UserPositions({ marketId }) {
  const { positions, loading, error } = useMarketPositions(marketId);
  
  if (loading) return <div>Loading positions...</div>;
  
  return (
    <div>
      <h3>Your Positions</h3>
      <ul>
        {positions.map(position => (
          <li key={position.id}>
            Spread {position.spreadIndex}: {position.sharesAmount.toFixed(2)} shares
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### useMarketQuotes

Provides price quotes for buying and selling shares in a market.

```typescript
const { 
  getQuote, 
  loading, 
  error 
} = useMarketQuotes(marketId: string);
```

**Parameters:**
- `marketId`: The ID of the market

**Returns:**
- `getQuote`: Function to get a price quote for buying or selling shares
- `loading`: Boolean indicating if a quote is being fetched
- `error`: Any error that occurred during quoting

**Example:**
```typescript
import { useMarketQuotes } from '@/hooks/useMarketQuotes';

function MarketTrading({ marketId }) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [amount, setAmount] = useState('1.0');
  const { getQuote, loading } = useMarketQuotes(marketId);
  const [quote, setQuote] = useState(null);
  
  const fetchQuote = async () => {
    const result = await getQuote(spreadIndex, amount, true); // true for buy
    setQuote(result);
  };
  
  return (
    <div>
      <button onClick={fetchQuote} disabled={loading}>
        {loading ? 'Loading quote...' : 'Get Quote'}
      </button>
      {quote && <div>Price: {quote.price}</div>}
    </div>
  );
}
```

### useMarketTransactions

Provides functions for executing market transactions.

```typescript
const { 
  buyShares, 
  sellShares, 
  claimWinnings,
  isLoading, 
  error 
} = useMarketTransactions(marketId: string);
```

**Parameters:**
- `marketId`: The ID of the market

**Returns:**
- `buyShares`: Function to buy shares in a spread
- `sellShares`: Function to sell shares from a position
- `claimWinnings`: Function to claim winnings from resolved markets
- `isLoading`: Boolean indicating if a transaction is in progress
- `error`: Any error that occurred during a transaction

**Example:**
```typescript
import { useMarketTransactions } from '@/hooks/useMarketTransactions';

function BuySharesForm({ marketId }) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [amount, setAmount] = useState('1.0');
  const { buyShares, isLoading, error } = useMarketTransactions(marketId);
  
  const handleBuy = async () => {
    try {
      await buyShares(spreadIndex, amount);
      alert('Purchase successful!');
    } catch (err) {
      console.error('Purchase failed:', err);
    }
  };
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleBuy(); }}>
      <select value={spreadIndex} onChange={(e) => setSpreadIndex(Number(e.target.value))}>
        {/* Spread options */}
      </select>
      <input 
        type="text" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Buy Shares'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## Components

### PredictionMarket

The main component for displaying and interacting with a prediction market.

```tsx
<PredictionMarket
  marketId={string}
  question={string}
  options={SpreadOption[]}
  resolutionCriteria={string}
  resolver={string}
  onTransactionComplete={() => void}
  marketStatus={string}
  marketStatusState={number}
  biddingDeadline={string}
  resolvedValue={number}
  marketTiming={{
    createdAt?: string;
    updatedAt?: string;
    biddingStart?: string;
    biddingEnd?: string;
    resolutionDate?: string;
  }}
/>
```

**Props:**
- `marketId`: The ID of the market
- `question`: The question being predicted
- `options`: Array of spread options with metadata
- `resolutionCriteria`: Description of how the market will be resolved
- `resolver`: Entity responsible for resolving the market
- `onTransactionComplete`: Callback for when a transaction is completed
- `marketStatus`: Current status display string
- `marketStatusState`: Numeric state of the market (0: active, 1: resolved)
- `biddingDeadline`: Time when bidding closes
- `resolvedValue`: The resolved outcome value (if resolved)
- `marketTiming`: Object containing various market timing information

**Example:**
```tsx
import PredictionMarket from '@/components/markets/PredictionMarket';
import { useLiveMarketInfo } from '@/hooks/useLiveMarketInfo';

function MarketPage({ marketId }) {
  const { data, loading, error, refresh } = useLiveMarketInfo(marketId);
  
  if (loading) return <div>Loading market...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <PredictionMarket
      marketId={marketId}
      question={data.basic.question}
      options={data.spreads.details.map((spread, index) => ({
        id: spread.id,
        label: spread.displayRange,
        value: spread.spreadIndex.toString(),
        buyPrice: spread.buyPriceDisplay,
        sellPrice: spread.sellPriceDisplay,
        percentage: spread.percentage,
        color: SPREAD_COLORS[index % SPREAD_COLORS.length],
        metadata: MARKET_SPREADS_METADATA[marketId]?.spreadLabels[index]
      }))}
      resolutionCriteria={data.basic.resolutionCriteria}
      resolver="Skepsis Protocol"
      onTransactionComplete={refresh}
      marketStatus={data.basic.stateDisplay}
      marketStatusState={data.basic.state}
      biddingDeadline={data.timing.biddingDeadlineDisplay}
      resolvedValue={data.timing.resolvedValue}
      marketTiming={{
        createdAt: data.basic.creationTimeDisplay,
        biddingEnd: data.timing.biddingDeadlineDisplay,
        resolutionDate: data.timing.resolutionTimeDisplay
      }}
    />
  );
}
```

### MarketSpreadsBar

Visualizes the probability distribution of a market.

```tsx
<MarketSpreadsBar
  marketId={string}
  className={string}
/>
```

**Props:**
- `marketId`: The ID of the market
- `className`: Optional CSS class name

**Example:**
```tsx
import { MarketSpreadsBar } from '@/components/markets/MarketSpreadsBar';

function MarketOverview({ marketId }) {
  return (
    <div>
      <h3>Market Distribution</h3>
      <MarketSpreadsBar
        marketId={marketId}
        className="mb-4 rounded-lg shadow-sm"
      />
    </div>
  );
}
```

## Market Service

The `marketService` provides low-level functions for interacting with the Skepsis protocol.

### getMarketInfo

Retrieves detailed information about a market.

```typescript
const marketInfo = await marketService.getMarketInfo(marketId: string, client: SuiClient);
```

**Parameters:**
- `marketId`: The ID of the market
- `client`: SuiClient instance

**Returns:**
- Comprehensive market information object

### executeMarketTransaction

Executes a transaction on a market.

```typescript
const result = await marketService.executeMarketTransaction(
  txb: TransactionBlock,
  client: SuiClient,
  signer: Signer
);
```

**Parameters:**
- `txb`: A TransactionBlock with the transaction to execute
- `client`: SuiClient instance
- `signer`: Signer to sign the transaction

**Returns:**
- Transaction result

### buildBuySharesTransaction

Creates a transaction to buy shares in a market.

```typescript
const txb = marketService.buildBuySharesTransaction(
  marketId: string,
  spreadIndex: number,
  amount: string,
  maxSlippage: number = 0.05
);
```

**Parameters:**
- `marketId`: The ID of the market
- `spreadIndex`: The index of the spread to buy shares in
- `amount`: The amount of shares to buy
- `maxSlippage`: Maximum acceptable slippage (default: 5%)

**Returns:**
- TransactionBlock object ready to be executed

## Types and Interfaces

### MarketInfo

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

### Position

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

### SpreadOption

```typescript
interface SpreadOption {
  id: string;
  value: string; // spreadIndex as string
  label: string; // display name or range
  originalRange?: string; // original display range
  buyPrice: string;
  sellPrice: string | null;
  percentage: number; // Dynamically calculated percentage
  color?: string; // Optional color for visualization
  metadata?: { 
    name: string; 
    description: string; 
    rangeDescription: string;
  }; // Optional metadata for enhanced display
}
```

### SpreadMetadata

```typescript
interface SpreadMetadata {
  name: string;         // Display name (e.g., "Bear Market")
  description: string;  // Context or explanation
  rangeDescription: string; // Numerical representation
}
```

## Constants

### MARKET_SPREADS_METADATA

Metadata for market spreads to enhance the user experience.

```typescript
const MARKET_SPREADS_METADATA = {
  [marketId: string]: {
    spreadLabels: SpreadMetadata[]
  }
};
```

**Example:**
```typescript
const MARKET_SPREADS_METADATA = {
  '0xab0a331a405c41c2682b4cd318b22915056fdcf5f8a5f852515ed18d94e3bac9': {
    spreadLabels: [
      { name: "Bear Market", description: "Below expected price range", rangeDescription: "0-10k" },
      { name: "Conservative", description: "Lower price range", rangeDescription: "10k-25k" },
      // More spreads...
    ]
  }
};
```

### SPREAD_COLORS

Colors used for visualizing different spreads.

```typescript
const SPREAD_COLORS = [
  "#4E79A7", // blue
  "#F28E2B", // orange
  "#E15759", // red
  // More colors...
];
```

## Utilities

### formatNumber

Formats numbers for display.

```typescript
const formatted = formatNumber(value: number, options?: FormatNumberOptions);
```

**Parameters:**
- `value`: The number to format
- `options`: Formatting options

**Returns:**
- Formatted string

### cn

Utility for conditionally joining class names.

```typescript
const className = cn("base-class", condition && "conditional-class", "always-included");
```

**Parameters:**
- Class names or conditional expressions that resolve to class names

**Returns:**
- Combined class name string

---

For more information about using the Skepsis API, refer to:
- [User Guide](./user-guide.md)
- [Technical Guide](./continuous-outcome-markets.md)
- [Full Documentation](./README.md)
