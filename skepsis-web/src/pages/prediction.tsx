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
import { useRouter } from 'next/router';
import { useSuiClient } from '@mysten/dapp-kit';
import { MarketService } from '@/services/marketService';
import { cn } from '@/lib/utils';
import { useMarketPositions, Position } from '@/hooks/useMarketPositions';

const PredictionPage: NextPage = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const router = useRouter();
  const [selectedMarketId, setSelectedMarketId] = useState(DEFAULT_MARKET_ID);
  
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
  
  // State to track positions with updated values based on spread prices
  const [updatedPositions, setUpdatedPositions] = useState<Position[]>([]);
  const [totalPositionValue, setTotalPositionValue] = useState<number>(0);      // Update position values whenever spread prices or positions change
  useEffect(() => {
    if (positions.length > 0 && Object.keys(spreadPrices).length > 0) {
      // Update position values using current spread prices
      const updatedPositionsWithPrices = positions.map(position => {
        // If we have a price for this spread index, use it to calculate the value
        const spreadPrice = spreadPrices[position.spreadIndex];
        
        if (spreadPrice !== undefined) {
          // IMPORTANT FIX: Both sharesAmount and spreadPrice are in raw units (with 6 decimal places)
          // sharesAmount is already scaled down by 1,000,000 in the useMarketPositions hook
          // spreadPrice needs to be divided by 1,000,000 to convert to USDC units
          // We need one more division by 1,000,000 to get the correct final value
          const value = position.sharesAmount * (spreadPrice / 1_000_000);
          // Scale down by 1,000,000 to get the correct display value in dollars
          const scaledValue = value / 1_000_000;
          // Ensure value is properly rounded to 3 decimal places max
          return {
            ...position,
            value: Math.round(scaledValue * 1000) / 1000
          };
        }
        // Keep the original value if no price is available
        return position;
      });
      
      setUpdatedPositions(updatedPositionsWithPrices);
      
      // Calculate total value of all positions
      const total = updatedPositionsWithPrices.reduce((sum, pos) => sum + pos.value, 0);
      setTotalPositionValue(total);
    } else {
      setUpdatedPositions(positions);
      const total = positions.reduce((sum, pos) => sum + pos.value, 0);
      setTotalPositionValue(total);
    }
  }, [positions, spreadPrices]);
  
  // Check for market ID in URL query parameters
  useEffect(() => {
    const { market } = router.query;
    // console.log("🔍 Market from URL query:", market);
    if (market && typeof market === 'string') {
      // Verify that the market ID is valid
      const isValidMarket = MARKETS.some(m => m.marketId === market);
      // console.log("🔍 Is valid market:", isValidMarket, "marketId:", market);
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
  
  // Automatically refresh spread prices when market data is loaded or market ID changes
  useEffect(() => {
    if (marketData && !marketLoading) {
      // Only refresh prices if we have market data and aren't already refreshing
      refreshSpreadPrices();
    }
  }, [marketData, selectedMarketId, marketLoading]);

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
    if (!selectedMarketId || refreshingPrices) return;
    
    setRefreshingPrices(true);
    try {
      // console.log("🔄 [PredictionPage] Fetching spread prices for market:", selectedMarketId);
      
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
          setSpreadPrices(priceMap);
          // console.log(`✅ [PredictionPage] Updated ${validPricesCount} spread prices successfully`);
          
          // If there were some invalid prices, log a warning
          if (validPricesCount < result.indices.length) {
            // console.warn(`⚠️ [PredictionPage] Found ${result.indices.length - validPricesCount} invalid spread prices`);
          }
        } else {
          // console.error("❌ [PredictionPage] No valid prices found in the response");
        }
      } else {
        // console.error("❌ [PredictionPage] Failed to get spread prices:", result.error || "Missing indices or prices");
      }
    } catch (error) {
      // console.error("❌ [PredictionPage] Error refreshing spread prices:", error);
    } finally {
      // Always reset the refreshing flag to allow future refreshes
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
                spreadPrices={spreadPrices}
                options={marketData.spreads.details.map((spread, index) => {
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
                    : spread.buyPriceDisplay ? Number(spread.buyPriceDisplay).toFixed(3) : "0.000";
                  
                  return {
                    id: spread.id || `spread-${spread.spreadIndex}`,
                    // Use custom name if available, otherwise use displayRange
                    label: spreadMetadata?.name || spread.displayRange,
                    // Keep the original range description in metadata
                    originalRange: spread.displayRange,
                    value: spread.spreadIndex.toString(),
                    buyPrice: priceDisplay,
                    sellPrice: spread.sellPriceDisplay || null,
                    percentage: spread.percentage,
                    color: SPREAD_COLORS[index % SPREAD_COLORS.length], // Cycle through colors
                    // Include metadata for detailed descriptions with proper type handling
                    metadata: {
                      name: spreadMetadata?.name || '',
                      index: spreadMetadata?.index !== undefined ? spreadMetadata.index : spread.spreadIndex,
                      lowerBound: spreadMetadata?.lowerBound !== undefined ? spreadMetadata.lowerBound : spread.spreadIndex * 10,
                      upperBound: spreadMetadata?.upperBound !== undefined ? spreadMetadata.upperBound : spread.spreadIndex * 10 + 10,
                      description: spreadMetadata?.description || '',
                      rangeDescription: spreadMetadata?.rangeDescription || spread.displayRange
                    } as SpreadLabel,
                    // Flag to indicate this price was refreshed
                    priceRefreshed: hasRefreshedPrice
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