# Skepsis User Guide

Welcome to Skepsis, a decentralized prediction market platform that allows you to express nuanced beliefs about future events through continuous numerical outcomes. This guide will walk you through the process of getting started and trading on the platform.

## Getting Started

### Connecting Your Wallet

1. **Access the Platform**: Visit the Skepsis web application at [skepsis.live](https://skepsis.live)
2. **Connect Your Wallet**: 
   - Click the "Connect Wallet" button in the top-right corner
   - Select your preferred Sui wallet
   - Approve the connection request in your wallet

![Wallet Connection](../examples/wallet-connection.png)

3. **Verify Connection**: Once connected, you'll see your wallet address and SUI balance in the header

### Getting Test Tokens

To participate in markets, you'll need USDC tokens:

1. Navigate to the "Faucet" page
2. Click the "Get Test Tokens" button
3. Approve the transaction in your wallet
4. You'll receive test USDC tokens for trading

## Exploring Markets

### Market Overview

The "Explore Markets" page displays all available prediction markets:

1. **Browse Markets**: Scroll through the list of available markets
2. **Market Details**: Each market card shows:
   - The question being predicted
   - Current status (Active, Pending Resolution, Resolved)
   - Time remaining until resolution
   - Visual representation of the current probability distribution

### Market Selection

To view a specific market:

1. Click on a market card to view its details
2. Alternatively, use the market selector dropdown to switch between markets
3. You can also access markets directly via URL parameters

## Understanding Market Types

Skepsis supports continuous outcome markets, which allow for predictions across a range of possible values:

### Price Prediction Markets

Example: "Will Bitcoin price exceed $100,000 by end of 2025?"

In this market:
- The outcome space is divided into spreads (e.g., $0-10k, $10k-25k, etc.)
- Each spread is marked with the label of a spread (e.g., $0-10k, $10k-25k, etc.)
- You can buy shares in the spread(s) that match your prediction

### Temperature Markets

Example: "What will be temperature in Celsius of Bengaluru on May 27, 2025 2 AM?"

In this market:
- Spreads might represent temperature ranges (e.g., 0-10°C, 10-20°C, etc.)
- Labels provide context (e.g., "Cold", "Mild", "Hot", etc.)

### Sports/Competition Markets

Example: "Who will win the Champions League in 2025?"

In this market:
- Each spread represents a different team or outcome
- Labels represent team names instead of numerical ranges

## Trading on Markets

### Reading Market Information

The market page provides comprehensive information:

1. **Question**: The specific question the market is predicting
2. **Status**: Whether the market is active, pending resolution, or resolved
3. **Timing**: Deadlines for bidding and resolution
4. **Distribution**: Visual representation of the current probability distribution
5. **Spreads**: The available prediction ranges with their current prices and probabilities

![Market Information](../examples/market-information.png)

### Making Predictions

To make a prediction:

1. **Select a Spread**: Click on the spread that represents your prediction
   - Spread selection highlights your chosen range
   - You can view detailed metadata by hovering over spreads

2. **Buy/Sell Selection**: Select whether you want to buy or sell shares
   - Buy: Purchase new shares in your selected spread
   - Sell: Sell shares from an existing position

3. **Enter Amount**: Specify how many shares you want to buy or sell
   - The system will calculate the cost or return
   - Larger purchases have more market impact

4. **Review Transaction**: Check the details of your transaction
   - Amount of shares
   - Cost in USDC
   - Estimated market impact

5. **Confirm Transaction**: Click the "Buy" or "Sell" button
   - Approve the transaction in your wallet
   - Wait for blockchain confirmation

![Trading Interface](../examples/trading-interface.png)

### Managing Your Positions

Your current positions are displayed in the "Your Positions" section:

1. **Position Details**: For each position, you can see:
   - The spread you've invested in (with metadata-enhanced labels)
   - Number of shares owned
   - Current value based on market prices
   - Profit/loss estimate

2. **Selling Positions**: To sell a position:
   - Click on the position you want to sell
   - Select the "Sell" tab
   - Enter the amount of shares to sell
   - Confirm the transaction

![Positions Management](../examples/positions-management.png)

## Market Resolution

### Understanding Resolution

When a market's resolution time arrives:

1. The actual outcome is determined based on the resolution criteria
2. The market state changes to "Resolved"
3. The winning spread is identified (the one containing the actual outcome)
4. Shares in the winning spread become worth exactly 1 USDC each
5. Shares in all other spreads become completely worthless (0 USDC value)

This "winner-takes-all" resolution mechanism ensures clear outcomes and incentivizes accurate predictions.

### Claiming Rewards

If you hold positions in the winning spread:

1. Navigate to the resolved market
2. Review your winning positions (marked with a "Winner" badge)
3. Click the "Claim Rewards" button for each winning position
4. Approve the transaction in your wallet
5. Your rewards will be transferred to your wallet at exactly 1 USDC per share

For example:
- If you bought 10 shares for 0.2 USDC each (total cost: 2 USDC) in what turned out to be the winning spread, you can redeem them for 10 USDC, making an 8 USDC profit.
- If you bought 10 shares for 0.8 USDC each (total cost: 8 USDC) in what turned out to be the winning spread, you can redeem them for 10 USDC, making a 2 USDC profit.
- If you bought shares in any other spread, these shares become worthless (0 USDC value).

![Claiming Rewards](../examples/claiming-rewards.png)

## Providing Liquidity

Advanced users can provide liquidity to markets:

1. Navigate to the "Provide Liquidity" page
2. Select the market you want to provide liquidity to
3. Enter the amount of USDC you want to contribute
4. Confirm the transaction
5. You'll receive liquidity shares that track your contribution
6. Liquidity providers earn a portion of trading fees

## Advanced Features

### Market Information

Every market provides detailed information:

- **Resolution Criteria**: How the outcome will be determined
- **Current Probability Distribution**: Visualization of the market's collective belief
- **Spread Legends**: Detailed information about each spread, including metadata
- **Market Timing**: Important dates and deadlines

### Spread Metadata

Skepsis enhances the user experience with detailed metadata for each spread:

1. **Custom Names**: Instead of just showing "0-10", spreads have meaningful names like "Bear Market" or "Bullish"
2. **Descriptions**: Additional context about what each spread represents
3. **Visual Differentiation**: Color-coding and visual design make spreads easily distinguishable

## Best Practices

### For New Users

1. **Start Small**: Begin with small trades to understand the platform
2. **Diversify**: Consider positions across multiple spreads to reflect your uncertainty
3. **Check Timing**: Be aware of bidding deadlines and resolution times
4. **Review Metadata**: Use spread metadata to understand market context

### For Advanced Users

1. **Market Impact**: Consider the price impact of larger trades
2. **Liquidity Provision**: Earn fees by providing liquidity to markets
3. **Position Management**: Actively manage your positions as new information becomes available
4. **Resolution Monitoring**: Keep track of resolution criteria and timing

## Troubleshooting

### Common Issues

1. **Transaction Failed**: 
   - Check your wallet balance
   - Ensure you're connected to the correct network
   - Try again with a smaller amount

2. **Unable to Claim Rewards**:
   - Verify the market has been resolved
   - Ensure you have winning positions
   - Check if you've already claimed your rewards

3. **Market Data Not Loading**:
   - Refresh the page
   - Check your internet connection
   - Verify the RPC connection status

### Getting Help

If you encounter issues:

1. Check the FAQ section
2. Join the community Discord for support
3. Contact team@skepsis.live for assistance

---

Skepsis - Collective Knowledge Synthesis
