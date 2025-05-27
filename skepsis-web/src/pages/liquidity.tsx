import React, { useState, useEffect, useMemo } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/header';
import { AppContext } from '@/context/AppContext';
import { useContext } from 'react';
import { cn } from '@/lib/utils';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import AddLiquidityModal from '@/components/markets/AddLiquidityModal';
import RemoveLiquidityModal from '@/components/markets/RemoveLiquidityModal';
import { toast } from 'react-toastify';
import { useLiquidityShares } from '@/hooks/useLiquidityShares';
import { useMarketLiquidityInfo } from '@/hooks/useMarketLiquidityInfo';
import { useLiveMarketsInfo } from '@/hooks/useLiveMarketsInfo';
import { MarketService } from '@/services/marketService';
import Link from 'next/link';
import { MARKETS } from '@/constants/appConstants';

interface MarketWithPosition {
  id: number;
  marketId: string;
  name: string;
  currentLiquidity: number;
  openInterest: number;
  maxPayout: number;
  resolutionTime: string;
  userPosition: number;
  userPositionObjectId?: string;
  state: number;
  stateDisplay: string;
  question?: string;
  resolutionCriteria?: string;
  creationTime?: number;
  biddingDeadline?: string; // Add biddingDeadline field
}

const LiquidityPage: NextPage = () => {
  const { walletAddress } = useContext(AppContext);
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [marketService, setMarketService] = useState<MarketService | null>(null);
  
  // Add modal state variables
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  
  // Track expanded market rows
  const [expandedMarketIds, setExpandedMarketIds] = useState<string[]>([]);
  
  // Get user's liquidity shares
  const { 
    sharesByMarket: userLiquidityByMarket, 
    allShares: userLiquidityShares, 
    loading: sharesLoading, 
    error: sharesError,
    refresh: refreshShares
  } = useLiquidityShares(client, refreshTrigger);

  // Get market information
  const { 
    markets: marketData, 
    summary: summaryData, 
    loading: marketsLoading, 
    error: marketsError,
    refresh: refreshMarkets
  } = useMarketLiquidityInfo(client, refreshTrigger);
  
  // Get market IDs to fetch with useLiveMarketsInfo
  const marketIds = useMemo(() => {
    return marketData.map(market => market.marketId);
  }, [marketData]);
  
  // Use our new useLiveMarketsInfo hook to fetch all markets data in parallel
  const {
    marketsMap: liveMarketsInfo,
    loading: liveMarketsLoading,
    error: liveMarketsError,
    refresh: refreshLiveMarkets
  } = useLiveMarketsInfo(marketIds);
  
  // Update the selected market ID when a market row is expanded
  useEffect(() => {
    if (expandedMarketIds.length > 0) {
      // Find the market object for the first expanded market ID
      const expandedMarket = marketsWithPositions.find(m => m.marketId === expandedMarketIds[0]);
      if (expandedMarket) {
        setSelectedMarket(expandedMarket);
      }
    }
  }, [expandedMarketIds]);
  
  // Create a combined view of markets with user positions
  const marketsWithPositions = useMemo(() => {
    console.log("Building marketsWithPositions with current data:", { 
      markets: marketData.length, 
      today: new Date().toISOString(),
      userLiquidityShare: Object.keys(userLiquidityByMarket).length,
      liveMarkets: liveMarketsInfo ? Object.keys(liveMarketsInfo).length : 0
    });
    console.log(marketData);
    
    return marketData.map(market => {
      // Find the user's liquidity position for this market
      const userPosition = userLiquidityByMarket[market.marketId] || 0;
      
      // Find the liquidity share object ID if user has a position
      const liquidityShare = userLiquidityShares.find(share => share.marketId === market.marketId);
      
      // Find market details from appConstants
      const marketDetails = MARKETS.find(m => m.marketId === market.marketId);
      
      // Get live market data from our parallel fetched markets
      const liveData = liveMarketsInfo && liveMarketsInfo[market.marketId] ? liveMarketsInfo[market.marketId] : null;
      
      // Get bidding deadline from live data if available, otherwise calculate it
      let biddingDeadline = '';
      console.log(`Processing market ${market.marketId} with live data:`, liveData);
      
      if (liveData && liveData.timing && liveData.timing.biddingDeadlineDisplay) {
        biddingDeadline = liveData.timing.biddingDeadlineDisplay;
      } else {
        // Fallback to calculated bidding deadline (24 hours after creation)
        const biddingDeadlineDate = new Date(market.creationTime + (24 * 60 * 60 * 1000));
        biddingDeadline = biddingDeadlineDate.toISOString();
      }
      
      // Get question and criteria from live data if available
      const question = liveData?.basic?.question || marketDetails?.description || market.name;
      const resolutionCriteria = liveData?.basic?.resolutionCriteria ||
        marketDetails?.description || 
        (market.name.includes("Bitcoin") ? "Based on Coinbase BTC/USD closing price" : 
        market.name.includes("temperature") ? "Based on official weather data" :
        "Based on official results");
      
      // Get state from live data if available
      const state = liveData?.basic?.state !== undefined ? liveData.basic.state : market.state;
      const stateDisplay = liveData?.basic?.stateDisplay || market.stateDisplay;
      
      // Get resolution time from live data if available
      const resolutionTime = liveData?.timing?.resolutionTimeDisplay || market.resolutionTime;
      
      // Calculate current liquidity from live data if available
      const currentLiquidity = liveData?.liquidity?.totalLiquidity !== undefined
        ? Number(liveData.liquidity.totalLiquidity) / 1_000_000
        : market.currentLiquidity;
      
      return {
        ...market,
        userPosition,
        userPositionObjectId: liquidityShare?.id,
        biddingDeadline,
        question,
        resolutionCriteria,
        state,
        stateDisplay,
        resolutionTime,
        currentLiquidity
      };
    });
  }, [marketData, userLiquidityByMarket, userLiquidityShares, liveMarketsInfo]);

  // Function to check if bidding is still open (bidding deadline > current time)
  const isBiddingOpen = (market: MarketWithPosition): boolean => {
    // If no bidding deadline is provided, default to false as a safety measure
    if (!market.biddingDeadline) {
      console.log(`Market ${market.id}: No bidding deadline, defaulting to closed`);
      return false;
    }
    
    const now = new Date();
    const deadline = new Date(market.biddingDeadline);
    const isOpen = now < deadline;
    
    console.log(`Market ${market.id}: Bidding status check - Current date: ${now.toISOString()}, Deadline: ${deadline.toISOString()}, Is Open: ${isOpen}`);
    return isOpen;
  };

  // Check if market is eligible for adding liquidity
  const canAddLiquidity = (market: MarketWithPosition): boolean => {
    const isStateValid = market.state === 0;
    const isBiddingStillOpen = isBiddingOpen(market);
    const isEligible = isStateValid && isBiddingStillOpen;
    
    console.log(`Market ${market.id}: Eligibility for adding liquidity - State: ${market.state} (Valid: ${isStateValid}), Bidding Open: ${isBiddingStillOpen}, Final Result: ${isEligible}`);
    
    return isEligible;
  };
  
  // Initialize market service when client is available
  useEffect(() => {
    if (client) {
      setMarketService(new MarketService(client));
    }
  }, [client]);

  // Function to refresh all data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    refreshLiveMarkets(); // Also refresh live markets data
  };

  // Toggle expanded/collapsed state of a market row
  const toggleMarketExpanded = (marketId: string, event: React.MouseEvent) => {
    // Prevent expanding when clicking on buttons
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    setExpandedMarketIds(prevIds => {
      if (prevIds.includes(marketId)) {
        return prevIds.filter(id => id !== marketId);
      } else {
        return [...prevIds, marketId];
      }
    });
  };

  // Check if a market is expanded
  const isMarketExpanded = (marketId: string) => {
    return expandedMarketIds.includes(marketId);
  };

  // Handle adding liquidity
  const handleAddLiquidityClick = (market: MarketWithPosition, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row expansion
    
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (market.state !== 0) {
      toast.warning("Cannot add liquidity to a market that is not open");
      return;
    }

    if (!isBiddingOpen(market)) {
      toast.warning("Bidding period has ended for this market");
      return;
    }
    
    // Only proceed if all checks passed
    setSelectedMarket(market);
    setAddModalOpen(true);
  };

  // Handle removing liquidity
  const handleRemoveLiquidityClick = (market: MarketWithPosition, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row expansion
    
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!market.userPositionObjectId) {
      toast.error("You don't have any liquidity position to remove");
      return;
    }

    if (market.state === 0) {
      toast.warning("Cannot remove liquidity until market is resolved");
      return;
    }
    
    setSelectedMarket(market);
    setRemoveModalOpen(true);
  };

  // Handle add liquidity submission
  const handleAddLiquidity = async (amount: number) => {
    if (!selectedMarket || !marketService || !account) return;
    
    try {
      // Convert amount to number for clarity and add a reasonable slippage protection
      const usdcAmount = amount;
      const minLpTokens = amount * 0.98; // 2% slippage protection
      
      console.log(`Adding ${usdcAmount} USDC to market ${selectedMarket.marketId} with min LP tokens ${minLpTokens}`);
      
      // Use the intelligent handler that decides which contract function to call
      const tx = await marketService.addLiquidityIntelligent(
        selectedMarket.marketId,
        usdcAmount,
        minLpTokens,
        account.address
      );
      
      // Sign and execute transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            toast.success(`Successfully added ${amount} USDC liquidity to "${selectedMarket.name}" market`);
            
            // Immediately update UI to reflect changes
            refreshShares();
            refreshMarkets();
            
            // Close the modal
            setAddModalOpen(false);
            setSelectedMarket(null);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            toast.error(`Failed to add liquidity: ${error.message}`);
          }
        }
      );
    } catch (error: any) {
      console.error('Error adding liquidity:', error);
      toast.error(error.message || 'Failed to add liquidity');
    }
  };

  // Handle remove liquidity submission
  const handleRemoveLiquidity = async (amount: number) => {
    if (!selectedMarket || !marketService || !account || !selectedMarket.userPositionObjectId) return;
    
    try {
      // Create transaction for removing liquidity
      const tx = await marketService.removeLiquidity(
        selectedMarket.marketId,
        selectedMarket.userPositionObjectId,
        account.address
      );
      
      // Sign and execute transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            toast.success(`Successfully removed ${amount} USDC liquidity from "${selectedMarket.name}" market`);
            
            // Immediately update UI to reflect changes
            refreshShares();
            refreshMarkets();
            
            // Close the modal
            setRemoveModalOpen(false);
            setSelectedMarket(null);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            toast.error(`Failed to remove liquidity: ${error.message}`);
          }
        }
      );
    } catch (error: any) {
      console.error('Error removing liquidity:', error);
      toast.error(error.message || 'Failed to remove liquidity');
    }
  };

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return `${text.substring(0, maxLength)}...`;
  };

  const isLoading = sharesLoading || marketsLoading || liveMarketsLoading;

  return (
    <>
      <Head>
        <title>Skepsis - Liquidity Provision</title>
        <meta name="description" content="Provide liquidity to Skepsis prediction markets and earn fees" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header with wallet connection */}
      <Header />

      <main className="min-h-screen flex flex-col px-6 py-8 max-w-7xl mx-auto pt-24">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Liquidity Management</h1>
            <p className="text-gray-400 text-sm mt-1">Provide liquidity to markets and earn fees from trading</p>
          </div>
          
          {/* Refresh button */}
          <button 
            onClick={refreshData}
            disabled={isLoading}
            className={cn(
              "text-xs px-4 py-2 rounded text-white font-medium transition-all flex items-center gap-2",
              isLoading 
                ? "bg-blue-700/50 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isLoading && (
              <span className="inline-block w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            )}
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gray-800/70 backdrop-blur-md">
            <div className="text-gray-400 text-xs">No of Markets:</div>
            <div className="text-xl font-semibold text-white">{summaryData.marketCount}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-gray-800/70 backdrop-blur-md">
            <div className="text-gray-400 text-xs">7D Volume:</div>
            <div className="text-xl font-semibold text-white">${summaryData.volume7d.toLocaleString()}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-gray-800/70 backdrop-blur-md">
            <div className="text-gray-400 text-xs">7D Fee:</div>
            <div className="text-xl font-semibold text-white">${summaryData.fees7d.toLocaleString()}</div>
          </div>
        </div>

        {/* Error states */}
        {sharesError && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
            Error loading your positions: {sharesError}
          </div>
        )}

        {marketsError && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
            Error loading markets: {marketsError}
          </div>
        )}

        {liveMarketsError && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
            Error loading live market data: {liveMarketsError}
          </div>
        )}

        {/* Loading state */}
        {isLoading && !marketsWithPositions.length && (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center">
              <span className="inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></span>
              <span className="text-gray-400">Loading market data...</span>
            </div>
          </div>
        )}

        {/* Markets Table */}
        {!isLoading && marketsWithPositions.length === 0 ? (
          <div className="p-8 rounded-xl bg-gray-800/70 backdrop-blur-md text-center text-gray-400">
            No markets available for liquidity provision
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="p-4 rounded-xl bg-gray-800/70 backdrop-blur-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3 pl-4 font-medium w-[5%]">#</th>
                    <th className="pb-3 pl-2 font-medium w-[50%]">Market</th>
                    <th className="pb-3 font-medium text-right w-[15%]">Your Position</th>
                    <th className="pb-3 font-medium text-center w-[15%]">Status</th>
                    <th className="pb-3 font-medium text-center w-[15%]">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {marketsWithPositions.map((market) => (
                    <React.Fragment key={market.id}>
                      {/* Main row - clickable and collapsible */}
                      <tr 
                        className={cn(
                          "border-b border-gray-700/50 text-white cursor-pointer transition-colors",
                          isMarketExpanded(market.marketId) ? "bg-gray-700/30" : "hover:bg-gray-700/20"
                        )}
                        onClick={(e) => toggleMarketExpanded(market.marketId, e)}
                      >
                        <td className="py-3 pl-4">{market.id}</td>
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "inline-block transform transition-transform",
                              isMarketExpanded(market.marketId) ? "rotate-90" : ""
                            )}>▶</span>
                            <span>{truncateText(market.name, 45)}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right pr-4">
                          {market.userPosition > 0 ? (
                            <span className="text-green-400">${market.userPosition.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            market.state === 0 ? "bg-green-900/30 text-green-400" : 
                            market.state === 1 ? "bg-amber-900/30 text-amber-400" : 
                            "bg-red-900/30 text-red-400"
                          )}>
                            {market.stateDisplay}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <button 
                              onClick={(e) => {
                                console.log(`+ button clicked for Market ${market.id}`);
                                handleAddLiquidityClick(market, e);
                              }}
                              disabled={!canAddLiquidity(market)}
                              className={cn(
                                "p-1 rounded font-bold",
                                canAddLiquidity(market)
                                  ? "bg-green-700/70 hover:bg-green-600 text-white"
                                  : "bg-green-700/20 text-green-700/40 cursor-not-allowed"
                              )}
                              title={
                                market.state !== 0 
                                  ? "Cannot add liquidity to resolved or canceled markets" 
                                  : !isBiddingOpen(market)
                                  ? "Bidding period has ended for this market"
                                  : "Add liquidity to this market"
                              }
                            >
                              <span className="px-2">+</span>
                            </button>
                            <button 
                              onClick={(e) => handleRemoveLiquidityClick(market, e)}
                              disabled={market.userPosition <= 0 || market.state === 0}
                              className={cn(
                                "p-1 rounded font-bold",
                                market.userPosition > 0 && market.state !== 0
                                  ? "bg-red-700/70 hover:bg-red-600 text-white" 
                                  : "bg-red-700/20 text-red-700/40 cursor-not-allowed"
                              )}
                              title={
                                market.userPosition <= 0 
                                  ? "You don't have any liquidity position in this market" 
                                  : market.state === 0 
                                  ? "Market must be resolved before removing liquidity" 
                                  : "Remove your liquidity from this market"
                              }
                            >
                              <span className="px-2">−</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded details */}
                      {isMarketExpanded(market.marketId) && (
                        <tr className="bg-gray-700/10 border-b border-gray-700/50">
                          <td colSpan={5} className="py-4 px-8">
                            <div className="flex flex-col gap-4">
                              {/* Market details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800/50 p-4 rounded-lg">
                                <div>
                                  <h4 className="text-gray-300 text-xs font-medium mb-2">Question</h4>
                                  <p className="text-white text-sm bg-gray-700/50 p-3 rounded-md">{market.question}</p>
                                </div>
                                <div>
                                  <h4 className="text-gray-300 text-xs font-medium mb-2">Resolution Criteria</h4>
                                  <p className="text-white text-sm bg-gray-700/50 p-3 rounded-md">{market.resolutionCriteria}</p>
                                </div>
                              </div>
                              
                              {/* Market statistics with cards */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                <div className="bg-gray-800/50 p-3 rounded-md">
                                  <h4 className="text-gray-400 text-xs mb-1">Current Liquidity</h4>
                                  <p className="text-white text-lg font-medium">${market.currentLiquidity.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-md">
                                  <h4 className="text-gray-400 text-xs mb-1">Open Interest</h4>
                                  <p className="text-white text-lg font-medium">${market.openInterest.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-md">
                                  <h4 className="text-gray-400 text-xs mb-1">Max Payout</h4>
                                  <p className="text-white text-lg font-medium">${market.maxPayout.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-md">
                                  <h4 className="text-gray-400 text-xs mb-1">Resolution Time</h4>
                                  <p className="text-white text-lg font-medium">{market.resolutionTime}</p>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex justify-end mt-2">
                                <Link 
                                  href={`/prediction?market=${market.marketId}`}
                                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                  </svg>
                                  Trade in this market
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add a Connect Wallet Prompt if not connected */}
        {!account && (
          <div className="mt-6 p-4 rounded-xl bg-blue-900/20 backdrop-blur-sm border border-blue-800/30 flex flex-col items-center">
            <p className="text-white text-sm mb-3">Connect your wallet to provide liquidity to markets</p>
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </main>

      {/* Add Liquidity Modal */}
      {selectedMarket && (
        <AddLiquidityModal
          marketId={selectedMarket.marketId}
          marketName={selectedMarket.name}
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onAddLiquidity={handleAddLiquidity}
        />
      )}

      {/* Remove Liquidity Modal */}
      {selectedMarket && (
        <RemoveLiquidityModal
          marketId={selectedMarket.marketId}
          marketName={selectedMarket.name}
          userPosition={selectedMarket.userPosition}
          userPositionObjectId={selectedMarket.userPositionObjectId}
          isOpen={removeModalOpen}
          onClose={() => setRemoveModalOpen(false)}
          onRemoveLiquidity={handleRemoveLiquidity}
        />
      )}
    </>
  );
};

export default LiquidityPage;