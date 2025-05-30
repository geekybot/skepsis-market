import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import PredictionMarket from '@/components/markets/PredictionMarket';
import { AppContext } from '@/context/AppContext';
import { useContext } from 'react';
import Header from '@/components/header';
import { MARKETS, DEFAULT_MARKET_ID, SPREAD_COLORS, MARKET_SPREADS_METADATA } from '@/constants/appConstants';
import { useLiveMarketInfo } from '@/hooks/useLiveMarketInfo';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';

const PredictionPage: NextPage = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const router = useRouter();
  const [selectedMarketId, setSelectedMarketId] = useState(DEFAULT_MARKET_ID);
  
  // Local loading state to ensure immediate UI feedback on market change
  const [isChangingMarket, setIsChangingMarket] = useState(false);
  
  // Add debug logging for better troubleshooting and handle market changes
  useEffect(() => {
    console.log("🔍 Current selectedMarketId:", selectedMarketId);
    
    // Set temporary loading state to provide immediate feedback
    setIsChangingMarket(true);
    
    // Clear the temporary loading state once market data is loaded or after timeout
    const timeout = setTimeout(() => {
      setIsChangingMarket(false);
    }, 2000); // 2 second safety timeout
    
    return () => clearTimeout(timeout);
  }, [selectedMarketId]);
  
  // Check for market ID in URL query parameters
  useEffect(() => {
    const { market } = router.query;
    console.log("🔍 Market from URL query:", market);
    if (market && typeof market === 'string') {
      // Verify that the market ID is valid
      const isValidMarket = MARKETS.some(m => m.marketId === market);
      console.log("🔍 Is valid market:", isValidMarket, "marketId:", market);
      if (isValidMarket) {
        setSelectedMarketId(market);
      }
    }
  }, [router.query]);

  // Dynamically load the selected market data using the hook
  const { 
    data: marketData, 
    loading: marketLoading, 
    error: marketError,
    refresh: refreshMarketData
  } = useLiveMarketInfo(selectedMarketId);

  // Find the basic market info from constants for fallback
  const selectedMarketBasicInfo = MARKETS.find(m => m.marketId === selectedMarketId) || MARKETS[0];

  // Handle market change from dropdown
  const handleMarketChange = (marketId: string) => {
    console.log("🔄 Market selection changed to:", marketId);
    // Reset data to avoid showing stale data during transition
    if (selectedMarketId !== marketId) {
      console.log("🔄 Updating selectedMarketId state");
      setSelectedMarketId(marketId);
      // Update the URL without refreshing the page
      console.log("🔄 Updating URL to:", `/prediction?market=${marketId}`);
      router.push(`/prediction?market=${marketId}`, undefined, { shallow: true });
    }
  };

  return (
    <>
      <Head>
        <title>Skepsis - Prediction Markets</title>
        <meta name="description" content="Skepsis decentralized prediction markets powered by Sui blockchain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header with wallet connection */}
      <Header />

      <main className="min-h-screen flex flex-col px-6 py-8 max-w-7xl mx-auto pt-24">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Skepsis Markets</h1>
          
          {/* Refresh button */}
          <button 
            onClick={() => refreshMarketData()}
            className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium"
          >
            Refresh Data
          </button>
        </div>

        {/* Market selection dropdown */}
        <div className="market-selector mb-4">
          <select 
            value={selectedMarketId}
            onChange={(e) => handleMarketChange(e.target.value)}
            className="p-2 rounded bg-gray-700/80 text-white border border-white/10"
          >
            {MARKETS.map(market => (
              <option key={market.marketId} value={market.marketId}>
                {marketData && marketData.marketId === market.marketId && marketData.basic.question 
                  ? marketData.basic.question 
                  : market.name}
              </option>
            ))}
          </select>
        </div>

        {/* Market loading state */}
        {marketLoading && (
          <div className="mb-8 p-6 bg-gray-800/60 backdrop-blur-lg rounded-lg flex justify-center">
            <div className="text-white">Loading market data...</div>
          </div>
        )}

        {/* Market error state */}
        {marketError && !marketLoading && (
          <div className="mb-8 p-6 bg-gray-800/60 backdrop-blur-lg rounded-lg">
            <div className="text-red-400">Error loading market data: {marketError}</div>
          </div>
        )}

        {/* Market data display */}
        {marketData && !marketLoading && (
          <>
            {/* Market Trading Interface */}
            <div className="w-full">
              <PredictionMarket 
                key={selectedMarketId} // Force component remount when marketId changes
                marketId={selectedMarketId}
                question={marketData.basic.question || selectedMarketBasicInfo.name}
                options={marketData.spreads.details.map((spread, index) => {
                  // Get metadata for this market and spread if available
                  const marketMetadata = MARKET_SPREADS_METADATA[selectedMarketId as keyof typeof MARKET_SPREADS_METADATA];
                  const spreadMetadata = marketMetadata?.spreadLabels?.[index];
                  
                  return {
                    id: spread.id || `spread-${spread.spreadIndex}`,
                    // Use custom name if available, otherwise use displayRange
                    label: spreadMetadata?.name || spread.displayRange,
                    // Keep the original range description in metadata
                    originalRange: spread.displayRange,
                    value: spread.spreadIndex.toString(),
                    buyPrice: spread.buyPriceDisplay || "0.000000",
                    sellPrice: spread.sellPriceDisplay || null,
                    percentage: spread.percentage,
                    color: SPREAD_COLORS[index % SPREAD_COLORS.length], // Cycle through colors
                    // Include metadata for detailed descriptions
                    metadata: spreadMetadata
                  };
                })}
                resolutionCriteria={marketData.basic.resolutionCriteria || "Not specified"}
                resolver="Skepsis Protocol"
                onTransactionComplete={refreshMarketData}
                marketStatus={marketData.basic.stateDisplay}
                marketStatusState={marketData.basic.state}
                
                biddingDeadline={marketData.timing.biddingDeadlineDisplay}
                resolvedValue={marketData.timing.resolvedValue}
                marketTiming={{
                  createdAt: marketData.basic.creationTimeDisplay,
                  updatedAt: marketData.basic.creationTimeDisplay, // No specific updated time available
                  biddingStart: marketData.basic.creationTimeDisplay, // Use creation time as bidding start
                  biddingEnd: marketData.timing.biddingDeadlineDisplay,
                  resolutionDate: marketData.timing.resolutionTimeDisplay
                }}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default PredictionPage;