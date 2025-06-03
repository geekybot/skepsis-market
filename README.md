# Skepsis: Decentralized Continuous Outcome Prediction Markets

Skepsis is a decentralized prediction market platform built on the Sui blockchain that enables trading on continuous numerical outcome spaces rather than just binary outcomes. This repository contains both the smart contract implementation (`skepsis_market`) and the web frontend (`skepsis-web`).

## Motivation

This project is inspired by the innovative concept of Distribution Markets presented in the [Paradigm paper](https://www.paradigm.xyz/2024/12/distribution-markets). While traditional prediction markets focus on binary outcomes, Skepsis implements continuous outcome spaces—allowing traders to bet on precise numerical ranges rather than simple yes/no scenarios.

Skepsis represents my first adventure into the Sui ecosystem as part Sui Overflow Hackathon. As such, I want to transparently acknowledge that it may contain several security flaws and should be considered experimental software rather than production-ready code. This implementation serves primarily as a proof of concept.

Developing Skepsis has been an incredibly thrilling journey for me. Learning the Move language and building on Sui has opened up fascinating possibilities that weren't achievable in other blockchain environments I've worked with previously. The composability of assets in Sui and the flexibility of Move's resource model made implementing complex market mechanics significantly more intuitive than I expected. Despite the challenges of building a sophisticated financial protocol in a new ecosystem, the development process has reinforced my belief in the potential of continuous outcome prediction markets to provide more nuanced forecasting tools than traditional binary markets.

## Project Structure

- `skepsis_market/`: Move smart contracts implementing the prediction market protocol
- `skepsis-web/`: Next.js web application for interacting with the markets
- `usdc/`: USDC mock implementation for testnet

## Getting Started

### Prerequisites

- [Sui CLI](https://docs.sui.io/build/install) (version 1.0.0+)
- [Node.js](https://nodejs.org/) (version 16+)
- [pnpm](https://pnpm.io/) (recommended) or npm

### Building and Publishing the Smart Contracts

1. Navigate to the `skepsis_market` directory:
   ```bash
   cd skepsis_market
   ```

2. Build the Move package:
   ```bash
   sui move build
   ```

3. Publish to testnet (make sure you have a wallet with SUI balance):
   ```bash
   sui client publish --gas-budget 100000000
   ```

4. Note the package object ID from the output for later use.

### Running the Web Application

1. Navigate to the `skepsis-web` directory:
   ```bash
   cd ../skepsis-web
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. Create a `.env.local` file with your configuration:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Using Skepsis

### Connect Your Wallet

Click the "Connect Wallet" button in the top-right corner of the app and select your Sui wallet.

### Get Test Tokens

Visit the Faucet page to get test USDC tokens for trading.

### Explore Markets

Browse existing prediction markets on the Explore page.

### Create a Market

Coming Soon

### Trade on a Market

Select a market to view its details and trade:
1. Choose a spread that represents your prediction
2. Enter the amount you want to trade
3. Click "Buy" or "Sell" to execute the transaction

### Claim Rewards

After a market is resolved, winning positions can be claimed.

## Documentation

For more detailed information:
- [User Guide](./skepsis-web/docs/user-guide.md)
- [Technical Guide](./skepsis-web/docs/continuous-outcome-markets.md)
- [API Reference](./skepsis-web/docs/api-reference.md)
- [Whitepaper](./skepsis-web/whitepaper.md)

## Development

### Test Suite

To run the Move smart contract tests:
```bash
cd skepsis_market
sui move test
```

### Contributing

We welcome contributions to Skepsis for non-commercial purposes only. Please feel free to submit issues and pull requests.

### Connect

- Twitter: [@skepsis_market](https://twitter.com/skepsis_market)
- Built by: [@up_utpal](https://twitter.com/up_utpal)

## License

This project is proprietary. All rights reserved. No commercial use, modification, distribution, or reproduction of this code or its ideas is permitted without explicit written permission from the owner.