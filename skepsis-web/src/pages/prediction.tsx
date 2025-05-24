import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import PredictionMarket from '@/components/markets/PredictionMarket';
import { AppContext } from '@/context/AppContext';
import { useContext } from 'react';
import Header from '@/components/header';
import { MARKETS, DEFAULT_MARKET_ID } from '@/constants/marketConstants';

const PredictionPage: NextPage = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const [selectedMarketId, setSelectedMarketId] = useState(DEFAULT_MARKET_ID);

  // Find the default market from marketConstants
  const defaultMarket = MARKETS.find(market => market.marketId === DEFAULT_MARKET_ID) || MARKETS[0];
  const selectedMarket = MARKETS.find(m => m.marketId === selectedMarketId) || MARKETS[0];

  return (
    <>
      <Head>
        <title>Skepsis - Bitcoin Price Prediction Market</title>
        <meta name="description" content="Skepsis decentralized prediction markets powered by Sui blockchain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header with wallet connection */}
      <Header />

      <main className="min-h-screen flex flex-col px-6 py-8 max-w-7xl mx-auto pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Skepsis</h1>
        </div>

        {/* Market selection dropdown */}
        <div className="market-selector mb-4">
          <select 
            value={selectedMarketId}
            onChange={(e) => setSelectedMarketId(e.target.value)}
            className="p-2 rounded bg-white/20 text-white border border-white/10"
          >
            {MARKETS.map(market => (
              <option key={market.marketId} value={market.marketId}>
                {market.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full">
          <PredictionMarket 
            marketId={selectedMarket.marketId}
            question={selectedMarket.name}
            options={selectedMarket.spreads}
            resolutionCriteria={selectedMarket.resolutionCriteria}
            resolver={selectedMarket.resolver}
            currentPrice={selectedMarket.currentPrice}
          />
        </div>
      </main>
    </>
  );
};

export default PredictionPage;