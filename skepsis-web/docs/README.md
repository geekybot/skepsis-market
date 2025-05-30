# Skepsis Documentation

## Introduction

Skepsis is a decentralized prediction market platform built on the Sui blockchain that enables users to express nuanced beliefs about future events through continuous numerical outcomes. Unlike traditional binary prediction markets that only offer yes/no outcomes, Skepsis allows participants to predict across a range of possible outcomes with various confidence levels.

This documentation provides a comprehensive guide to understanding and using the Skepsis platform.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Getting Started](#getting-started)
3. [Trading Interface](#trading-interface)
4. [Market Types](#market-types)
5. [Technical Architecture](#technical-architecture)
6. [API Reference](#api-reference)
7. [Components Reference](#components-reference)

## Core Concepts

### Continuous Outcome Markets

Traditional prediction markets only support binary (yes/no) outcomes, which forces complex questions into oversimplified formats. Skepsis extends this model by implementing continuous outcome markets that allow participants to trade on a range of possible outcomes.

For example, instead of asking "Will Bitcoin price exceed $100,000 by end of 2025?" (binary), Skepsis enables trading on "What will the Bitcoin price be at the end of 2025?" (continuous), allowing users to express beliefs across the entire distribution of possible prices.

### Logarithmic Market Scoring Rule (LMSR)

Skepsis uses the Logarithmic Market Scoring Rule (LMSR) as its automated market maker mechanism. This provides:

- **Infinite Liquidity**: The market can always accept trades of any size
- **Bounded Loss**: The maximum loss for the market maker is fixed and known in advance
- **Path Independence**: The cost of reaching a particular state doesn't depend on the sequence of trades
- **Information Incorporation**: Prices efficiently incorporate new information

### Spreads and Metadata

In Skepsis, the continuous outcome space is divided into multiple "spreads" (bins) that represent different ranges of the possible outcome. For example, in a Bitcoin price prediction market, spreads might be:

- Bear Market (0-10k USD)
- Conservative (10k-25k USD)
- Current Range (25k-50k USD)
- Bullish (50k-75k USD)
- Super Bullish (75k-100k USD)
- Moon Shot (100k+ USD)

Each spread has metadata that provides context and meaning to the numerical range, making it easier for users to understand the market.

## Getting Started

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the top-right corner of the application
2. Select your wallet provider (currently supporting Sui wallets)
3. Authorize the connection when prompted by your wallet
4. Once connected, your wallet address and balance will be displayed

### Test Tokens

For trying out the platform:

1. Visit the "Get Test Tokens" page
2. Click "Request Test Tokens" to receive test USDC
3. Use these tokens to participate in the markets

## Trading Interface

The Skepsis trading interface provides an intuitive way to interact with prediction markets.

### Market Selection

1. Browse available markets on the "Explore Markets" page
2. Select a market to view its details and trading interface
3. Each market displays:
   - The question being predicted
   - The current probability distribution
   - Trading deadline
   - Resolution criteria

### Making Predictions

1. Select a spread that represents your prediction
2. Choose whether you want to buy or sell shares in that spread
3. Enter the amount you wish to trade
4. Review the estimated price and impact
5. Click "Buy" or "Sell" to execute the transaction
6. Once confirmed, your position will appear in the "Your Positions" section

### Viewing Your Positions

1. All your active positions are displayed in the "Your Positions" section
2. For each position, you can see:
   - The spread you've invested in
   - Number of shares owned
   - Current value based on market prices
   - Profit/loss estimate

### Market Resolution

When the resolution time arrives:

1. The actual outcome is determined based on the resolution criteria
2. Shares in the winning spread become redeemable for their full value
3. Shares in other spreads become worthless
4. Users with winning positions can claim their rewards by clicking the "Claim" button

## Market Types

Skepsis supports various types of prediction markets:

### Price Prediction Markets

These markets allow users to predict the future price of assets like cryptocurrencies. Examples include:

- Bitcoin price prediction for specific dates
- Ethereum price ranges
- Stock price forecasts

### Temperature/Weather Markets

Predict weather-related outcomes, such as:

- Temperature in a specific location on a future date
- Rainfall amounts
- Extreme weather event probabilities

### Sports/Competition Markets

Predict outcomes of sporting events or competitions:

- Who will win a championship
- Score ranges
- Performance metrics

### Custom Markets

The platform can support any question with a numerical outcome, allowing for a wide range of prediction markets.

## Technical Architecture

### Frontend Components

The Skepsis web application is built using:

- **React & Next.js**: For the user interface
- **TypeScript**: For type-safe code
- **Tailwind CSS**: For styling
- **@mysten/dapp-kit**: For Sui blockchain interactions

Key components include:

- **PredictionMarket**: The main component for trading
- **MarketSpreadsBar**: Visualizes the probability distribution
- **ConnectMenu**: Manages wallet connections
- **LandingPage**: Introduces new users to the platform

### Blockchain Integration

Skepsis interacts with the Sui blockchain through:

- **Market Contracts**: Implemented in Sui Move
- **RPC Calls**: For retrieving market data and executing trades
- **Transaction Building**: For creating and sending transactions
- **Event Listening**: For real-time updates

### Data Flow

1. Market data is fetched using optimized RPC calls
2. The UI displays the current state of markets
3. User actions are translated into blockchain transactions
4. Transaction results update the UI state

## API Reference

### Market Data

```typescript
// Fetch market information
const marketData = useLiveMarketInfo(marketId);

// Structure
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
```

### Trading Functions

```typescript
// Buy shares in a spread
const buyShares = async (
  marketId: string,
  spreadIndex: number,
  amount: string
) => {
  // Implementation details
};

// Sell shares in a spread
const sellShares = async (
  positionId: string,
  amount: string
) => {
  // Implementation details
};
```

### Position Management

```typescript
// Get user positions
const positions = useMarketPositions(marketId);

// Claim winnings
const claimWinnings = async (
  positionIds: string[]
) => {
  // Implementation details
};
```

## Components Reference

### PredictionMarket

The main component for trading in markets.

```tsx
<PredictionMarket
  marketId={marketId}
  question={question}
  options={spreadOptions}
  resolutionCriteria={resolutionCriteria}
  resolver="Skepsis Protocol"
  onTransactionComplete={refreshData}
  marketStatus={marketStatus}
  marketStatusState={marketStatusState}
/>
```

### MarketSpreadsBar

Visualizes the probability distribution of a market.

```tsx
<MarketSpreadsBar
  marketId={marketId}
  className="mb-6"
/>
```

### Enhanced Features

#### Spread Metadata

The platform uses enhanced metadata to provide context for each spread:

```typescript
// Example spread metadata
{
  name: "Bear Market",
  description: "Below expected price range",
  rangeDescription: "0-10k"
}
```

This metadata is used to create a more intuitive user interface, replacing generic range labels with meaningful descriptions that help users understand the market context.

---

## Contributing

Skepsis is an open platform that welcomes contributions. If you're interested in contributing:

1. Fork the repository
2. Make your changes
3. Submit a pull request

## Support

For questions or support:
- Join our community Discord
- Email support@skepsis.io
- Check out our GitHub repository

---

Skepsis - Collective Knowledge Synthesis
