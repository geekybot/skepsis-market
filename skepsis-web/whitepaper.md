<div align="center">
  <img src="./public/images/skepsis-transparent.png" alt="Skepsis Logo" width="200" />

  <h1>Skepsis: Decentralized Continuous Outcome Prediction Markets</h1>
  <h3>Whitepaper v1.0</h3>
  <h4>May 2025</h4>

  <p><em>A next-generation prediction market protocol for continuous numerical outcomes</em></p>
  
  <hr style="width: 50%; margin: 40px auto;">
</div>

## Abstract

<div style="background-color: #f8f9fa; border-left: 4px solid #6366f1; padding: 15px; margin-bottom: 20px;">
Skepsis is a decentralized prediction market protocol built on the Sui blockchain that enables trading on continuous numerical outcome spaces rather than just binary outcomes. By implementing an optimized Logarithmic Market Scoring Rule (LMSR) mechanism with discretized spreads, Skepsis allows participants to express nuanced beliefs about future events while providing robust liquidity and efficient price discovery through an automated market maker approach. With just two blockchain calls for complete market data and comprehensive position tracking, Skepsis delivers a powerful yet gas-efficient solution for forecasting continuous variables.
</div>

## Table of Contents

- [Abstract](#abstract)
- [Table of Contents](#table-of-contents)
- [Problem Statement](#problem-statement)
- [The Skepsis Solution](#the-skepsis-solution)
- [Continuous Outcome Markets](#continuous-outcome-markets)
  - [What They Are](#what-they-are)
  - [Why They Matter](#why-they-matter)
- [Mechanism Design](#mechanism-design)
  - [The LMSR Mechanism](#the-lmsr-mechanism)
  - [Why It's Better Than Binary/Betting Platforms](#why-its-better-than-binarybetting-platforms)
  - [Adapting LMSR for Distribution-Based Markets](#adapting-lmsr-for-distribution-based-markets)
- [Market Lifecycle](#market-lifecycle)
  - [Market Creation](#market-creation)
  - [Trading](#trading)
  - [Resolution](#resolution)
- [Architecture on Sui](#architecture-on-sui)
  - [Object-Based Market Instantiation](#object-based-market-instantiation)
  - [Coin Handling](#coin-handling)
  - [Clock Usage](#clock-usage)
- [Incentive Design](#incentive-design)
  - [Benefits for Different Participants](#benefits-for-different-participants)
  - [Ensuring Honest Behavior](#ensuring-honest-behavior)
- [Use Cases](#use-cases)
- [Future Work](#future-work)
  - [Decentralized Oracle Integration](#decentralized-oracle-integration)
  - [Advanced Staking Models](#advanced-staking-models)
  - [Enhanced Distribution Implementation](#enhanced-distribution-implementation)
  - [User Experience and Client Enhancements](#user-experience-and-client-enhancements)
  - [Integration and Composability](#integration-and-composability)
- [Technical Implementation](#technical-implementation)
  - [Core Move Modules](#core-move-modules)
  - [Optimized Market Data Access](#optimized-market-data-access)
  - [Client Utilities](#client-utilities)
- [Conclusion](#conclusion)
- [Contact \& References](#contact--references)

## Problem Statement

<div style="border: 1px solid #d1d5db; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
Traditional prediction markets suffer from significant limitations:

1. **Binary Constraint**: Most platforms only support yes/no outcomes, forcing complex questions into oversimplified formats
2. **Limited Expressivity**: Traders cannot express uncertainty distributions or confidence levels across a range of outcomes
3. **Centralized Oracles**: Resolution mechanisms often rely on centralized arbiters, introducing trust assumptions
4. **Poor UX for Numerical Outcomes**: Predicting numerical values (dates, prices, measurements) is cumbersome in binary formats
</div>

<div style="background-color: #f0f4f8; padding: 15px; margin: 20px 0; border-left: 4px solid #6366f1; font-style: italic;">
The world needs prediction markets that can handle continuous outcomes to effectively aggregate beliefs about quantities like "When will GPT-5 be released?", "What will the average global temperature be in 2030?", or "What price will Bitcoin reach in 2026?" These questions have answers that fall across a continuous spectrum, not just yes/no outcomes.
</div>

## The Skepsis Solution

<div style="background-color: #f3f4ff; border: 1px solid #c7d2fe; padding: 20px; margin: 20px 0; border-radius: 5px;">
<p style="font-weight: bold; font-size: 1.1em; margin-bottom: 15px;">Skepsis is a truth-seeking, decentralized, and permissionless prediction market protocol that:</p>

1. Allows markets to be created for any question with a numerical outcome
2. Enables traders to express beliefs across distribution ranges 
3. Provides automated market making through a proven LMSR model
4. Leverages Sui's object model to create efficient, scalable markets
5. Permits permissionless creation, trading, and resolution
</div>

By focusing on numerical outcomes and distributional beliefs, Skepsis creates a platform where participants can collaborate to discover the most accurate probabilities for future events, going beyond simple binary markets.

## Continuous Outcome Markets

### What They Are

Continuous outcome markets allow participants to trade on a range of possible outcomes rather than just binary yes/no options. For example:

<div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0; border: 1px solid #e2e8f0; border-radius: 5px;">
<div style="font-weight: bold; margin-bottom: 10px;">Example Question Comparison:</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
  <div style="width: 48%; padding: 10px; background-color: #fee2e2; border-radius: 4px;">
    <strong>Binary Approach:</strong> "Will GPT-5 be released before January 2026?" (Yes/No)
  </div>
  <div style="width: 48%; padding: 10px; background-color: #dbeafe; border-radius: 4px;">
    <strong>Continuous Approach:</strong> "When will GPT-5 be released?" (Date range)
  </div>
</div>
</div>

With continuous outcomes, the market represents a probability distribution across the entire range of possible answers. This provides much richer information than a simple binary probability.

<div align="center" style="margin: 25px 0; padding: 15px; background-color: #f0f4f8; border-radius: 5px;">
  <p style="font-style: italic; margin-bottom: 10px;">Probability Distribution Visualization Example</p>
  <div style="height: 150px; width: 100%; max-width: 500px; margin: 0 auto; border: 1px dashed #6366f1; display: flex; align-items: center; justify-content: center; background-color: #fff;">
    [Probability Distribution Graph]
  </div>
  <p style="font-size: 0.8em; margin-top: 10px; color: #4b5563;">Figure 1: Example of a continuous outcome market showing probability distribution</p>
</div>

### Why They Matter

Continuous outcome markets offer several advantages:

<div style="overflow-x: auto;">
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #6366f1; color: white;">
      <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Advantage</th>
      <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f9fafb;">
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Rich Information</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">The resulting price curve shows not just the expected median outcome but also the market's uncertainty (variance) about that outcome</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Better Calibration</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Traders can express nuanced beliefs and confidence levels</td>
    </tr>
    <tr style="background-color: #f9fafb;">
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>More Realistic</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Most real-world predictions concern continuous variables</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Capital Efficiency</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">A single continuous market can replace dozens of binary markets</td>
    </tr>
    <tr style="background-color: #f9fafb;">
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Fairer Rewards</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Participants are rewarded based on how close their prediction was to the actual outcome</td>
    </tr>
  </tbody>
</table>
</div>

## Mechanism Design

### The LMSR Mechanism

<div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px;">
<p style="margin-top: 0;">Skepsis implements the Logarithmic Market Scoring Rule (LMSR) as its automated market maker mechanism. LMSR was pioneered by Robin Hanson and has become the gold standard for prediction markets due to its desirable properties:</p>

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0;">
  <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px;">
    <strong>Bounded Loss</strong>
    <p style="margin-top: 5px; font-size: 0.9em;">The market maker's maximum loss is fixed and known in advance</p>
  </div>
  <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px;">
    <strong>Infinite Liquidity</strong>
    <p style="margin-top: 5px; font-size: 0.9em;">The market can always accept trades of any size</p>
  </div>
  <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px;">
    <strong>Path Independence</strong>
    <p style="margin-top: 5px; font-size: 0.9em;">The cost of reaching a particular state doesn't depend on the sequence of trades</p>
  </div>
  <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px;">
    <strong>Information Incorporation</strong>
    <p style="margin-top: 5px; font-size: 0.9em;">Prices efficiently incorporate new information</p>
  </div>
</div>
</div>

<div style="background-color: #f0f4f8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 5px solid #6366f1;">
  <h4 style="margin-top: 0; color: #4f46e5;">LMSR Formula</h4>
  
  <div style="background-color: white; padding: 15px; border-radius: 5px; font-family: 'Courier New', monospace; text-align: center; margin: 15px 0;">
    <strong>Cost Function:</strong><br>
    C(q) = b * ln(∑<sub>i</sub> e<sup>q<sub>i</sub>/b</sup>)
  </div>
  
  <p><strong>Where:</strong></p>
  <ul style="margin-bottom: 0;">
    <li><code>q</code> is the vector of quantities of shares for each outcome spread</li>
    <li><code>b</code> is the liquidity parameter (calculated as total_shares / number_of_spreads)</li>
    <li>The price of outcome i is: p<sub>i</sub> = e<sup>q<sub>i</sub>/b</sup> / ∑<sub>j</sub> e<sup>q<sub>j</sub>/b</sup></li>
  </ul>
</div>

Our implementation in the `distribution_math` module includes carefully optimized fixed-point calculations with comprehensive overflow protection and edge case handling to ensure the mechanism operates securely on-chain.

### Why It's Better Than Binary/Betting Platforms

Binary prediction markets and traditional betting platforms have significant limitations:

1. **Limited Expressivity**: Binary markets can only express a single probability point 
2. **Question Framing Issues**: Results depend heavily on how the question is framed
3. **Multiple Market Fragmentation**: Expressing a distribution requires creating many binary markets
4. **Inefficient Price Discovery**: Information is scattered across multiple markets

Skepsis overcomes these limitations by enabling direct trading on distributions.

### Adapting LMSR for Distribution-Based Markets

Skepsis adapts the LMSR mechanism to handle continuous distributions by:

1. **Discretization**: Dividing the continuous outcome space into multiple "spreads" (bins) of equal size
2. **Spread-Based Trading**: Allowing participants to buy and sell shares in specific spreads
3. **Interconnected Pricing**: Our implementation ensures trading in one spread affects prices in related spreads through the LMSR cost function
4. **Efficient Market Info**: Our protocol provides optimized access to market information through just two blockchain calls, enabling efficient client-side visualization of the entire probability distribution

This approach allows Skepsis to maintain the mathematical guarantees of LMSR while extending it to handle continuous outcome spaces in a computationally efficient manner suitable for on-chain execution. Our design prioritizes gas efficiency while still enabling expressive market behavior.

## Market Lifecycle

<div align="center" style="margin: 25px 0; padding: 15px; background-color: #f0f4f8; border-radius: 5px;">
  <div style="height: 180px; width: 100%; max-width: 700px; margin: 0 auto; border: 1px dashed #6366f1; display: flex; align-items: center; justify-content: center; background-color: #fff;">
    <div style="text-align: center;">
      <div style="display: flex; justify-content: space-between; width: 100%; padding: 0 20px;">
        <div style="width: 120px; padding: 10px; background-color: #c7d2fe; border-radius: 10px; margin: 0 5px;">Creation</div>
        <div style="width: 120px; padding: 10px; background-color: #dbeafe; border-radius: 10px; margin: 0 5px;">Trading</div>
        <div style="width: 120px; padding: 10px; background-color: #e0e7ff; border-radius: 10px; margin: 0 5px;">Resolution</div>
        <div style="width: 120px; padding: 10px; background-color: #c7d2fe; border-radius: 10px; margin: 0 5px;">Claim Rewards</div>
      </div>
      <div style="margin-top: 20px; width: 100%; height: 2px; background-color: #6366f1; position: relative;">
        <div style="position: absolute; top: -7px; left: 0; width: 16px; height: 16px; border-radius: 50%; background-color: #4f46e5;"></div>
        <div style="position: absolute; top: -7px; left: 33%; width: 16px; height: 16px; border-radius: 50%; background-color: #4f46e5;"></div>
        <div style="position: absolute; top: -7px; left: 66%; width: 16px; height: 16px; border-radius: 50%; background-color: #4f46e5;"></div>
        <div style="position: absolute; top: -7px; right: 0; width: 16px; height: 16px; border-radius: 50%; background-color: #4f46e5;"></div>
      </div>
    </div>
  </div>
  <p style="font-size: 0.8em; margin-top: 10px; color: #4b5563;">Figure 2: Market Lifecycle Phases</p>
</div>

### Market Creation

<div style="padding: 20px; background-color: #f3f4ff; border-radius: 8px; margin-bottom: 20px;">
<p style="font-weight: bold; color: #4f46e5; margin-top: 0;">Market Creation Process</p>

Any participant can create a new prediction market through our `distribution_market_factory` module by:

<ol style="margin-bottom: 0;">
  <li><strong>Question Definition</strong>: Defining the question and resolution criteria as human-readable text</li>
  <li><strong>Outcome Range</strong>: Setting the lower and upper bounds of possible numerical outcomes</li>
  <li><strong>Spread Configuration</strong>: Determining the number of spreads (bins) to divide the range into</li>
  <li><strong>Timing Parameters</strong>: Specifying bidding deadline and resolution time</li>
  <li><strong>Initial Liquidity</strong>: Providing initial liquidity in any Sui-compatible token to bootstrap the market</li>
</ol>
</div>

Our implementation creates markets as shared objects on the Sui blockchain with appropriate access controls and lifecycle management. The factory pattern provides a clean way to track and discover markets.

### Trading

<div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
  <div style="flex: 1; min-width: 200px; background-color: #dbeafe; padding: 15px; border-radius: 8px;">
    <h4 style="margin-top: 0; color: #1e40af; font-size: 1.1em;">Buy Shares</h4>
    <p style="margin-bottom: 0; font-size: 0.9em;">Purchase shares in specific spreads representing your belief about outcome ranges</p>
  </div>
  
  <div style="flex: 1; min-width: 200px; background-color: #dbeafe; padding: 15px; border-radius: 8px;">
    <h4 style="margin-top: 0; color: #1e40af; font-size: 1.1em;">Sell Shares</h4>
    <p style="margin-bottom: 0; font-size: 0.9em;">Sell previously purchased shares back to the market with slippage protection</p>
  </div>
  
  <div style="flex: 1; min-width: 200px; background-color: #dbeafe; padding: 15px; border-radius: 8px;">
    <h4 style="margin-top: 0; color: #1e40af; font-size: 1.1em;">Provide Liquidity</h4>
    <p style="margin-bottom: 0; font-size: 0.9em;">Add liquidity to earn fees from trading activity</p>
  </div>
  
  <div style="flex: 1; min-width: 200px; background-color: #dbeafe; padding: 15px; border-radius: 8px;">
    <h4 style="margin-top: 0; color: #1e40af; font-size: 1.1em;">Multi-spread Trading</h4>
    <p style="margin-bottom: 0; font-size: 0.9em;">Trade across multiple spreads in a single transaction</p>
  </div>
</div>

Pricing is determined automatically by our LMSR implementation, which adjusts prices based on the current distribution of shares across all spreads. Our code includes comprehensive error handling for edge cases and security considerations to protect trader funds.

### Resolution

<div style="border-left: 4px solid #6366f1; padding-left: 20px; margin: 20px 0;">
<h4 style="margin-top: 0;">Resolution Process Flow</h4>

<ol style="list-style-type: none; counter-reset: resolution-counter; padding-left: 0;">
  <li style="counter-increment: resolution-counter; margin-bottom: 15px;">
    <div style="display: flex; align-items: center;">
      <div style="background-color: #6366f1; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
        1
      </div>
      <div>
        A resolving participant submits the actual outcome value using our <code>resolve-market</code> script
      </div>
    </div>
  </li>
  <li style="counter-increment: resolution-counter; margin-bottom: 15px;">
    <div style="display: flex; align-items: center;">
      <div style="background-color: #6366f1; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
        2
      </div>
      <div>
        The system determines which spread contains the true outcome
      </div>
    </div>
  </li>
  <li style="counter-increment: resolution-counter; margin-bottom: 15px;">
    <div style="display: flex; align-items: center;">
      <div style="background-color: #6366f1; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
        3
      </div>
      <div>
        Shares in the winning spread become redeemable for exactly 1 USDC each
      </div>
    </div>
  </li>
  <li style="counter-increment: resolution-counter; margin-bottom: 15px;">
    <div style="display: flex; align-items: center;">
      <div style="background-color: #6366f1; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
        4
      </div>
      <div>
        Shares in all other spreads become worthless (0 USDC value)
      </div>
    </div>
  </li>
  <li style="counter-increment: resolution-counter;">
    <div style="display: flex; align-items: center;">
      <div style="background-color: #6366f1; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
        5
      </div>
      <div>
        Market participants can claim their winnings through our secure claiming functions
      </div>
    </div>
  </li>
</ol>
</div>

Our resolution mechanism includes checks to ensure the resolution time has passed and that the market hasn't been previously resolved. Users can easily verify the resolution status through our market-info script, which provides comprehensive market data with just two blockchain calls.

## Architecture on Sui

Skepsis fully leverages Sui's unique capabilities to create an efficient and secure prediction market protocol.

### Object-Based Market Instantiation

Markets in Skepsis are represented as shared objects on Sui, allowing:

1. **Parallel Execution**: Multiple traders can interact with different markets concurrently
2. **Permissionless Access**: Any user can access any market without permission
3. **Composability**: Markets can be integrated with other Sui applications
4. **Unique Identifiers**: Each market has a unique ID for reference and discovery

Our `distribution_market_factory` implementation tracks all created markets and emits events for off-chain indexing, enabling easy market discovery and analytics.

### Coin<T> Handling

Skepsis implements fully generic coin handling via Sui's `Coin<T>` pattern:

1. **Token Flexibility**: Markets can use any fungible token as their base currency
2. **Isolated Risk**: Each market maintains its own liquidity pool and fees collected
3. **Balance Management**: Our implementation provides careful tracking of balances for liquidity, fees, and user positions
4. **Secure Transfers**: We leverage Sui's safe transfer mechanisms for all token operations

Our fee handling system was moved from the factory to the individual markets, allowing for per-market fee configurations while maintaining the security of funds.

### Clock Usage

The protocol utilizes Sui's on-chain `Clock` for security and accuracy:

1. **Timing Enforcement**: Our code ensures markets follow their defined lifecycle
2. **Deadline Management**: We enforce bidding deadlines and resolution times through explicit checks
3. **Timestamp Consistency**: Every time-sensitive function uses the same clock reference for consistency
4. **Time-Based Security**: Our validation checks prevent premature resolution or trading after deadlines

## Incentive Design

### Benefits for Different Participants

**Market Creators:**
- Receive a portion of trading fees through our fee management system
- Can bootstrap liquidity for questions they want answered
- Establish reputation for creating meaningful markets
- Access to optimized market data through our efficient market-info API

**Traders:**
- Profit from superior information or forecasting ability through our secure position tracking
- Express nuanced beliefs across multiple spreads in a single transaction
- Access comprehensive position data through our UserPositionRegistry
- Benefit from slippage protection in our buy/sell implementation

**Liquidity Providers:**
- Earn trading fees proportional to their liquidity contribution
- Support markets for questions they want answered
- Receive tokenized liquidity shares to track their contribution
- Withdraw liquidity with proper accounting of accumulated fees

### Ensuring Honest Behavior

Our protocol incentivizes honest behavior through carefully designed mechanisms:

1. **Economic Stakes**: Our position tracking system ensures participants have financial incentives to act honestly
2. **Market Forces**: Mispriced markets create profit opportunities for informed traders through our LMSR implementation
3. **Fee Structure**: Our configurable per-market fee system balances revenue with participation incentives
4. **Time Constraints**: Resolution only occurs after specified deadlines, enforced by Sui's Clock object
5. **Transparent Distribution**: Our optimized market-info API provides clear visibility into the current probability distribution

## Use Cases

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 25px 0;">
  <!-- Time Predictions -->
  <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
      <div style="background-color: #6366f1; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <h3 style="margin: 0; color: #4338ca;">Time Predictions</h3>
    </div>
    <ul style="padding-left: 20px; margin-bottom: 0;">
      <li>Release dates for technological innovations (e.g., "When will GPT-5 be released?")</li>
      <li>Project completion timelines</li>
      <li>Time-to-market predictions for products</li>
    </ul>
  </div>
  
  <!-- Price Forecasts -->
  <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
      <div style="background-color: #6366f1; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <h3 style="margin: 0; color: #4338ca;">Price Forecasts</h3>
    </div>
    <ul style="padding-left: 20px; margin-bottom: 0;">
      <li>Future cryptocurrency prices</li>
      <li>Stock price ranges</li>
      <li>Commodity price forecasting</li>
    </ul>
  </div>
  
  <!-- Scientific and Climate Predictions -->
  <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
      <div style="background-color: #6366f1; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.33 14.67C21.33 14.67 20 16 18 16C16 16 14.67 14.67 14.67 14.67C14.67 14.67 13.33 16 11.33 16C9.33 16 8 14.67 8 14.67C8 14.67 6.67 16 4.67 16C2.67 16 1.33 14.67 1.33 14.67"/><path d="M21.33 19.33C21.33 19.33 20 20.67 18 20.67C16 20.67 14.67 19.33 14.67 19.33C14.67 19.33 13.33 20.67 11.33 20.67C9.33 20.67 8 19.33 8 19.33C8 19.33 6.67 20.67 4.67 20.67C2.67 20.67 1.33 19.33 1.33 19.33"/><path d="M21.33 10C21.33 10 20 11.33 18 11.33C16 11.33 14.67 10 14.67 10C14.67 10 13.33 11.33 11.33 11.33C9.33 11.33 8 10 8 10C8 10 6.67 11.33 4.67 11.33C2.67 11.33 1.33 10 1.33 10"/><path d="M21.33 10C21.33 10 20 8.67 18 8.67C16 8.67 14.67 10 14.67 10C14.67 10 13.33 8.67 11.33 8.67C9.33 8.67 8 10 8 10C8 10 6.67 8.67 4.67 8.67C2.67 8.67 1.33 10 1.33 10"/></svg>
      </div>
      <h3 style="margin: 0; color: #4338ca;">Scientific Predictions</h3>
    </div>
    <ul style="padding-left: 20px; margin-bottom: 0;">
      <li>Temperature forecasts for specific regions</li>
      <li>Sea level rise estimates</li>
      <li>Medical breakthrough timelines</li>
    </ul>
  </div>
  
  <!-- Economic Indicators -->
  <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
      <div style="background-color: #6366f1; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <h3 style="margin: 0; color: #4338ca;">Economic Indicators</h3>
    </div>
    <ul style="padding-left: 20px; margin-bottom: 0;">
      <li>Inflation rate predictions</li>
      <li>Unemployment rate forecasts</li>
      <li>GDP growth ranges</li>
    </ul>
  </div>
</div>

<div align="center" style="margin: 25px 0; padding: 15px; background-color: #f0f4f8; border-radius: 5px;">
  <div style="height: 200px; width: 100%; max-width: 700px; margin: 0 auto; border: 1px dashed #6366f1; display: flex; align-items: center; justify-content: center; background-color: #fff;">
    [Use Case Visualization: Skepsis Market Examples]
  </div>
  <p style="font-size: 0.8em; margin-top: 10px; color: #4b5563;">Figure 3: Examples of Skepsis markets for different use cases</p>
</div>

## Future Work

### Decentralized Oracle Integration

- Integration with multiple oracle solutions for resolving markets
- Development of specialized resolution mechanisms for different data types
- Community-based dispute resolution mechanisms to handle contentious outcomes
- Oracle reputation tracking to incentivize accuracy over time

### Advanced Staking Models

- Staking requirements for market creation to ensure quality
- Implementation of challenge periods for market resolutions
- Economic security models for high-value markets
- Stake-weighted governance for protocol parameters

### Enhanced Distribution Implementation

- Implementation of true continuous distributions beyond discretized spreads
- Support for non-uniform spread sizes to allow finer granularity in more likely regions
- Integration of the L2 norm approach described in the Paradigm paper on Distribution Markets
- Cross-market correlations to enable prediction of related outcomes

### User Experience and Client Enhancements

- Further optimization of market data retrieval for even faster UIs
- Development of a complete React component library for market visualization
- Mobile interfaces for trading on the go
- Social features for sharing market insights and predictions

### Integration and Composability

- Integration with DeFi protocols for capital efficiency
- Cross-chain market creation and resolution
- Composability with other prediction markets for meta-predictions
- SDK development for third-party integration

## Technical Implementation

### Core Move Modules

Skepsis is built with three core Move modules that work together to provide a complete prediction market solution:

1. **distribution_market**: Our main module that manages market creation, trading logic, position tracking, and market resolution. This module implements all the core functionality including spread management, fee collection, and secure position tracking.

2. **distribution_math**: A specialized module that implements the LMSR calculations and mathematical primitives with robust overflow protection and edge case handling. This module provides optimized fixed-point math operations essential for on-chain prediction markets.

3. **distribution_market_factory**: Our factory module that handles market creation, tracking, and discovery through a clean factory pattern with event emission.

### Optimized Market Data Access

A standout feature of our implementation is the highly optimized market-info script that retrieves comprehensive market data with just two blockchain calls:

```typescript
// First call: Retrieve the complete market object
const marketObject = await client.getObject({
  id: marketId,
  options: { 
    showContent: true,
    showDisplay: true,
    showType: true,
    showOwner: true
  }
});

// Second call: Get all spread prices with a single call
const spreadPrices = await client.devInspectTransactionBlock({
  transactionBlock: tx,
  sender: senderAddress
});
```

This approach provides significant advantages:

1. **Reduced Network Overhead**: Traditional implementations would require 20+ RPC calls to retrieve the same data
2. **Faster UI Rendering**: The complete dataset is available in milliseconds rather than seconds
3. **Lower Gas Costs**: Minimized on-chain computation for data retrieval
4. **Better User Experience**: Real-time visualization of probability distributions becomes possible

Our JavaScript client library and React components leverage this optimized data access to provide smooth, responsive UIs for market interaction.

### Client Utilities

Additionally, our TypeScript client library provides essential utilities:

1. **market-info.ts**: The optimized script detailed above
2. **resolve-market.ts**: A secure resolution script following CLI command patterns
3. **buy-shares.ts** and **sell-shares.ts**: Utilities for market trading

The protocol ensures safety through comprehensive error handling, secure mathematical operations with overflow protection, and careful balance management that has been extensively tested.

## Conclusion

<div style="background-color: #eef2ff; padding: 25px; border-radius: 8px; margin: 25px 0;">
<h3 style="color: #4338ca; margin-top: 0;">Summary of Skepsis Innovation</h3>

<p>Skepsis represents a significant advancement in decentralized prediction markets by extending their capabilities to continuous outcome spaces. By leveraging the mathematical foundations of LMSR and the technical capabilities of the Sui blockchain, we've created a protocol that enables more expressive, efficient, and informative prediction markets than previously possible.</p>

<div style="padding: 15px; background-color: white; border-radius: 8px; margin: 20px 0;">
<p style="font-weight: bold; margin-top: 0;">Our implementation prioritizes:</p>
<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <div style="flex: 1; min-width: 200px; padding: 10px; background-color: #f3f4ff; border-left: 3px solid #6366f1; border-radius: 4px;">
    <strong>Efficiency</strong>
    <p style="margin-bottom: 0; font-size: 0.9em;">Optimized market data access with just two blockchain calls</p>
  </div>
  <div style="flex: 1; min-width: 200px; padding: 10px; background-color: #f3f4ff; border-left: 3px solid #6366f1; border-radius: 4px;">
    <strong>Security</strong>
    <p style="margin-bottom: 0; font-size: 0.9em;">Comprehensive error handling and overflow protection in mathematical operations</p>
  </div>
  <div style="flex: 1; min-width: 200px; padding: 10px; background-color: #f3f4ff; border-left: 3px solid #6366f1; border-radius: 4px;">
    <strong>Flexibility</strong>
    <p style="margin-bottom: 0; font-size: 0.9em;">Generic coin handling and configurable market parameters</p>
  </div>
  <div style="flex: 1; min-width: 200px; padding: 10px; background-color: #f3f4ff; border-left: 3px solid #6366f1; border-radius: 4px;">
    <strong>Usability</strong>
    <p style="margin-bottom: 0; font-size: 0.9em;">Clean APIs and React components for seamless integration</p>
  </div>
</div>
</div>

<p>We believe Skepsis fills a critical gap in the prediction market landscape, allowing for nuanced expression of beliefs about continuous outcomes like dates, prices, and measurements. By providing better tools for collective forecasting, Skepsis can help improve decision-making across finance, science, technology, and governance.</p>

<p style="font-style: italic; margin-bottom: 0;">This innovation opens new possibilities for forecasting, risk management, and information aggregation across numerous domains, providing a valuable tool for collaborative prediction in a decentralized world.</p>
</div>

<div style="text-align: center; margin: 40px 0;">
  <img src="./public/images/skepsis-transparent.png" alt="Skepsis Logo" width="100" style="margin-bottom: 15px;" />
  <h2 style="margin-top: 0;">Join the Skepsis Ecosystem</h2>
  <p style="max-width: 600px; margin: 0 auto;">Ready to explore continuous outcome prediction markets? Learn more about Skepsis, participate in markets, or contribute to the protocol.</p>
  
  <div style="display: inline-block; margin-top: 20px; padding: 15px 30px; background-color: #6366f1; color: white; border-radius: 8px; font-weight: bold;">
    Visit skepsis.live
  </div>
</div>

---

## Contact & References

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0;">
  <div>
    <h3>Contact Information</h3>
    <p><strong>Website:</strong> <a href="https://skepsis.live">https://skepsis.live</a></p>
    <p><strong>Email:</strong> team@skepsis.live</p>
    <p><strong>GitHub:</strong> <a href="https://github.com/skepsis-protocol">github.com/skepsis-protocol</a></p>
    <p><strong>Twitter:</strong> <a href="https://twitter.com/skepsis_market">@skepsis_market</a></p>
  </div>
  
  <div>
    <h3>Key References</h3>
    <ol style="padding-left: 20px;">
      <li>Hanson, R. (2003). "Combinatorial Information Market Design"</li>
      <li>Paradigm Research (2023). <a href="https://www.paradigm.xyz/2024/12/distribution-markets">"Distribution Markets: AMMs for Continuous Outcome Spaces"</a></li>
      <li>Sui Move Documentation: <a href="https://docs.sui.io/move">https://docs.sui.io/move</a></li>
      <li>LMSR Market Maker: <a href="https://www.econ2.jhu.edu/faculty/hanson/mktscore.pdf">Original Paper</a></li>
    </ol>
  </div>
</div>

<div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.9em; color: #6b7280;">
  <p>© 2025 Skepsis Protocol. All rights reserved.</p>
  <p>This whitepaper is for informational purposes only and does not constitute financial or investment advice.</p>
</div>
