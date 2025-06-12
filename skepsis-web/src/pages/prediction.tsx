import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import PredictionMarket from '@/components/markets/PredictionMarket';
import { AppContext } from '@/context/AppContext';
import { useContext } from 'react';
import Header from '@/components/header';
import { MARKETS, DEFAULT_MARKET_ID, SPREAD_COLORS } from '@/constants/appConstants';
import { MARKET_SPREAD_LABELS, SpreadLabel } from '@/constants/marketDetails';
import { useLiveMarketInfo } from '@/hooks/useLiveMarketInfo';
import { useOptimizedMarketInfo } from '@/hooks/useOptimizedMarketInfo';
import { useRouter } from 'next/router';
import { useSuiClient } from '@mysten/dapp-kit';
import { MarketService } from '@/services/marketService';
import { cn } from '@/lib/utils';
import { useMarketPositions, Position } from '@/hooks/useMarketPositions';
import { MarketSelectorClean } from '@/components/ui/MarketSelectorClean';

const PredictionPage: NextPage = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const router = useRouter();
  
  // Initialize market ID more intelligently 
  const [selectedMarketId, setSelectedMarketId] = useState(() => {
    // On client-side, try to get the market from URL immediately if available
    if (typeof window !== 'undefined' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const marketParam = urlParams.get('market');
      if (marketParam) {
        const isValidMarket = MARKETS.some(m => m.marketId === marketParam);
        if (isValidMarket) {
          return marketParam;
        }
      }
    }
    return DEFAULT_MARKET_ID;
  });
  
  // Track if we've processed the router query to avoid unnecessary re-renders
  const [hasProcessedRouter, setHasProcessedRouter] = useState(false);
  
  // Process router query when ready
  useEffect(() => {
    if (!router.isReady || hasProcessedRouter) return;
    
    const { market } = router.query;
    
    if (market && typeof market === 'string') {
      const isValidMarket = MARKETS.some(m => m.marketId === market);
      if (isValidMarket && selectedMarketId !== market) {
        setSelectedMarketId(market);
      }
    }
    
    setHasProcessedRouter(true);
  }, [router.isReady, router.query.market, hasProcessedRouter, selectedMarketId]);
  
  // Local loading state to ensure immediate UI feedback on market change
  const [isChangingMarket, setIsChangingMarket] = useState(false);
  
  // Add debug logging for better troubleshooting and handle market changes
  useEffect(() => {
    // console.log("🔍 Current selectedMarketId:", selectedMarketId);
    // Set temporary loading state to provide immediate feedback
    setIsChangingMarket(true);
    
    // Clear the temporary loading state once market data is loaded or after timeout
    const timeout = setTimeout(() => {
      setIsChangingMarket(false);
    }, 2000); // 2 second safety timeout
    
    return () => clearTimeout(timeout);
  }, [selectedMarketId]);

  // Get SUI client 
  const suiClient = useSuiClient();
  
  // Track the latest spread prices separately from the full market data
  const [spreadPrices, setSpreadPrices] = useState<{[spreadIndex: number]: number}>({});

  // Fetch user positions for the current market
  const { 
    positions, 
    isLoading: positionsLoading, 
    positionData,
    refreshPositions,
    totalPositionsValue: hookPositionsValue
  } = useMarketPositions(suiClient, selectedMarketId, walletAddress || null, spreadPrices);
  
  // Use positions directly from the hook to avoid dual calculation
  // The hook already handles spread price integration consistently
  const [totalPositionValue, setTotalPositionValue] = useState<number>(0);
  
  // Debug logging for position value consistency
  useEffect(() => {
    if (positions.length > 0) {
      console.log("🔍 Position values update:", {
        positionCount: positions.length,
        spreadPricesCount: Object.keys(spreadPrices).length,
        positions: positions.map(p => ({
          spreadIndex: p.spreadIndex,
          shares: p.sharesAmount,
          value: p.value,
          spreadPrice: spreadPrices[p.spreadIndex]
        }))
      });
    }
  }, [positions, spreadPrices]);
  
  // Update total position value when hook provides new position data
  useEffect(() => {
    if (positions.length > 0) {
      const total = positions.reduce((sum, pos) => sum + pos.value, 0);
      setTotalPositionValue(total);
    } else {
      setTotalPositionValue(0);
    }
  }, [positions]);
  
  // Handle URL changes (navigation between markets) - only after router is processed
  useEffect(() => {
    // Wait for Next.js router to be ready and ensure we've processed the initial route
    if (!router.isReady || !hasProcessedRouter) return;
    
    const { market } = router.query;
    if (market && typeof market === 'string') {
      // Verify that the market ID is valid
      const isValidMarket = MARKETS.some(m => m.marketId === market);
      if (isValidMarket && selectedMarketId !== market) {
        setSelectedMarketId(market);
      }
    }
  }, [router.query.market, selectedMarketId, hasProcessedRouter]);
  
  // Dynamically load the selected market data using the optimized hook for better performance
  const { 
    data: marketData, 
    loading: marketLoading, 
    error: marketError,
    refresh: refreshMarketData,
    cacheStats
  } = useOptimizedMarketInfo(selectedMarketId);

  // Log cache efficiency for performance monitoring
  useEffect(() => {
    if (cacheStats) {
      console.log(`📊 Cache Performance for ${selectedMarketId}:`, {
        staticFromCache: cacheStats.staticFromCache,
        dynamicFromCache: cacheStats.dynamicFromCache,
        timingFromCache: cacheStats.timingFromCache,
        fetchTime: `${cacheStats.fetchTime}ms`
      });
    }
  }, [cacheStats, selectedMarketId]);
  
  // Automatically refresh spread prices when market data is loaded or market ID changes
  useEffect(() => {
    if (marketData && !marketLoading && !refreshingPrices) {
      // Only refresh prices if we have market data, aren't loading, and aren't already refreshing
      console.log("🔄 Auto-refreshing spread prices for market:", selectedMarketId);
      refreshSpreadPrices();
    }
  }, [marketData, selectedMarketId]); // Keep dependencies minimal to prevent loops

  // Add state to track if spread prices are being refreshed
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  // Find the basic market info from constants for fallback
  const selectedMarketBasicInfo = MARKETS.find(m => m.marketId === selectedMarketId) || MARKETS[0];

  // Handle market change from dropdown
  const handleMarketChange = (marketId: string) => {
    // console.log("🔄 Market selection changed to:", marketId);
    // Reset data to avoid showing stale data during transition
    if (selectedMarketId !== marketId) {
      // console.log("🔄 Updating selectedMarketId state");
      setSelectedMarketId(marketId);
      // Update the URL without refreshing the page
      // console.log("🔄 Updating URL to:", `/prediction?market=${marketId}`);
      router.push(`/prediction?market=${marketId}`, undefined, { shallow: true });
    }
  };


  // Function to directly fetch just the spread prices using get_all_spread_prices
  const refreshSpreadPrices = async () => {
    if (!selectedMarketId || refreshingPrices) {
      console.log("⏭️ Skipping spread price refresh:", { 
        hasMarketId: !!selectedMarketId, 
        isRefreshing: refreshingPrices 
      });
      return;
    }
    
    setRefreshingPrices(true);
    console.log("🔄 Starting spread price refresh for market:", selectedMarketId);
    
    try {
      // Use our marketService to get the prices
      const marketService = new MarketService(suiClient);
      const result = await marketService.getAllSpreadPrices(selectedMarketId);
      
      // Process the result of getAllSpreadPrices
      
      // Always use the returned indices and prices, even if success is false
      // This ensures we have fallback values in case of errors
      if (result.indices && result.indices.length > 0 && result.prices && result.prices.length > 0) {
        // console.log("📊 [PredictionPage] Spread prices received:", {
        //   success: result.success,
        //   indicesCount: result.indices.length,
        //   pricesCount: result.prices.length,
        //   sampleIndices: result.indices.slice(0, 3),
        //   samplePrices: result.prices.slice(0, 3).map(p => `${p} (${p/1_000_000} USDC)`),
        //   error: result.error || 'none'
        // });
        
        // Create a mapping from spread index to price
        const priceMap: {[spreadIndex: number]: number} = {};
        
        // Track how many valid prices we found
        let validPricesCount = 0;
        
        for (let i = 0; i < result.indices.length; i++) {
          // Make sure index is valid and price is a reasonable value
          const index = result.indices[i];
          const price = result.prices[i];
          
          if (index !== undefined && price !== undefined) {
            // More comprehensive sanity check for valid indices and prices
            if (index >= 0 && index < 100 && price >= 0) {
              priceMap[index] = price;
              validPricesCount++;
            } else {
              // console.warn(`⚠️ [PredictionPage] Skipping invalid spread price: index=${index}, price=${price}`);
            }
          }
        }
        
        if (validPricesCount > 0) {
          // Update the state with our valid prices
          console.log("📊 Updating spread prices:", {
            previousPriceCount: Object.keys(spreadPrices).length,
            newPriceCount: validPricesCount,
            samplePrices: Object.entries(priceMap).slice(0, 3).map(([idx, price]) => 
              `spread ${idx}: ${price} (${(price/1_000_000).toFixed(6)} USDC)`
            )
          });
          setSpreadPrices(priceMap);
          console.log("✅ Spread prices updated successfully");
          
          // If there were some invalid prices, log a warning
          if (validPricesCount < result.indices.length) {
            console.warn(`⚠️ Found ${result.indices.length - validPricesCount} invalid spread prices`);
          }
        } else {
          console.error("❌ No valid prices found in the response");
        }
      } else {
        console.error("❌ Failed to get spread prices:", result.error || "Missing indices or prices");
      }
    } catch (error) {
      console.error("❌ Error refreshing spread prices:", error);
    } finally {
      // Always reset the refreshing flag to allow future refreshes
      console.log("🔄 Spread price refresh completed");
      setRefreshingPrices(false);
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
          <div className="flex space-x-3">
            <button 
              onClick={refreshSpreadPrices}
              disabled={refreshingPrices}
              className={`text-sm px-4 py-2 rounded text-white font-medium flex items-center gap-2
                ${refreshingPrices 
                  ? 'bg-blue-700/50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {refreshingPrices && (
                <span className="inline-block w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              )}
              {refreshingPrices ? 'Refreshing Prices...' : 'Refresh Prices'}
            </button>
            <button 
              onClick={() => refreshMarketData()}
              className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium"
            >
              Refresh All Data
            </button>
          </div>
        </div>

        {/* Market selection with clean marquee */}
        <div className="market-selector mb-6">
          <MarketSelectorClean
            selectedMarketId={selectedMarketId}
            onMarketChange={handleMarketChange}
            isLoading={marketLoading || isChangingMarket}
            speed={40}
            direction="left"
            className="w-full"
          />
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
                question={marketData.question || selectedMarketBasicInfo.name}
                spreadPrices={spreadPrices}
                options={marketData.spreads?.map((spread, index) => {
                  // Get metadata for this market and spread if available
                  const spreadLabels = MARKET_SPREAD_LABELS[selectedMarketId] || [];
                  // Find the correct spread metadata by matching spreadIndex instead of using array index
                  const spreadMetadata: SpreadLabel | undefined = spreadLabels.find(label => 
                    // Match by spreadIndex to ensure correct label-to-spread mapping
                    label.index === spread.spreadIndex
                  );
                  
                  // Check if we have refreshed price data for this spread
                  const hasRefreshedPrice = spreadPrices && 
                    spreadPrices[spread.spreadIndex] !== undefined;
                  
                  // Use refreshed price if available, otherwise fall back to the original price
                  const price = hasRefreshedPrice 
                    ? spreadPrices[spread.spreadIndex] 
                    : spread.buyPrice || 0;
                  
                  const priceDisplay = hasRefreshedPrice 
                    ? (price / 1_000_000).toFixed(3)
                    : spread.buyPrice ? (spread.buyPrice / 1_000_000).toFixed(3) : "0.000";
                  
                  // Generate displayRange fallback
                  const displayRange = `${spread.lowerBound}-${spread.upperBound}`;
                  
                  return {
                    id: `spread-${spread.spreadIndex}`,
                    // Use custom name if available, otherwise use displayRange
                    label: spreadMetadata?.name || displayRange,
                    // Keep the original range description in metadata
                    originalRange: displayRange,
                    value: spread.spreadIndex.toString(),
                    buyPrice: priceDisplay,
                    sellPrice: spread.sellPrice ? (spread.sellPrice / 1_000_000).toFixed(3) : null,
                    percentage: spread.percentage,
                    color: SPREAD_COLORS[index % SPREAD_COLORS.length], // Cycle through colors
                    // Include metadata for detailed descriptions with proper type handling
                    metadata: {
                      name: spreadMetadata?.name || '',
                      index: spreadMetadata?.index !== undefined ? spreadMetadata.index : spread.spreadIndex,
                      lowerBound: spreadMetadata?.lowerBound !== undefined ? spreadMetadata.lowerBound : spread.spreadIndex * 10,
                      upperBound: spreadMetadata?.upperBound !== undefined ? spreadMetadata.upperBound : spread.spreadIndex * 10 + 10,
                      description: spreadMetadata?.description || '',
                      rangeDescription: spreadMetadata?.rangeDescription || displayRange
                    } as SpreadLabel,
                    // Flag to indicate this price was refreshed
                    priceRefreshed: hasRefreshedPrice
                  };
                }) || []}
                resolutionCriteria={marketData.resolutionCriteria || "Not specified"}
                resolver="Skepsis Protocol"
                onTransactionComplete={refreshMarketData}
                marketStatus={marketData.stateDisplay}
                marketStatusState={marketData.marketState}
                
                biddingDeadline={marketData.biddingDeadlineDisplay}
                resolutionTime={marketData.resolutionTimeDisplay}
                resolvedValue={marketData.resolvedValue}
                marketTiming={{
                  createdAt: new Date(Date.now()).toISOString(), // Use current time as fallback
                  biddingEnd: marketData.biddingDeadlineDisplay,
                  resolutionDate: marketData.resolutionTimeDisplay
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