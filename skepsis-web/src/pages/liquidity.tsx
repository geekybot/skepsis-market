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
import { MarketService } from '@/services/marketService';
import Link from 'next/link';
import { MARKETS } from '@/constants/appConstants';
import { useMarketService } from '@/hooks/useMarketService';

interface MarketWithPosition {
  id: number;
  marketId: string;
  name: string;
  currentLiquidity: number;
  openInterest: number;
  maxPayout: number;
  resolutionTime: string;
  userPosition: number;
  userPositionPercentage?: number;  // Added field to store percentage of total liquidity
  userPositionObjectId?: string;
  state: number;
  stateDisplay: string;
  question?: string;
  resolutionCriteria?: string;
  creationTime?: number;
  biddingDeadline?: string; // Add biddingDeadline field
}

// Helper function to get consistent market state display
const getMarketStateFromRawState = (state?: number, biddingDeadline?: string, resolutionTime?: string): { status: string; state: number } => {
  const now = new Date();
  let resolutionDate = null;
  let biddingEndDate = null;
  
  // 1. First check if the market has been explicitly resolved (state = 1)
  if (state === 1) {
    return { status: 'Resolved', state: 1 };
  }

  // 2. Check for special states like Canceled
  if (state === 2) {
    return { status: 'Canceled', state: 2 };
  }
  
  // Parse bidding deadline and resolution dates for state calculation
  try {
    if (biddingDeadline) {
      biddingEndDate = new Date(biddingDeadline);
      if (isNaN(biddingEndDate.getTime())) biddingEndDate = null;
    }
    
    if (resolutionTime) {
      resolutionDate = new Date(resolutionTime);
      if (isNaN(resolutionDate.getTime())) resolutionDate = null;
    }
  } catch (e) {
    console.error('Error parsing market timing dates:', e);
  }
  
  // 3. Check if resolution time has passed
  if (resolutionDate && now >= resolutionDate) {
    return { status: 'Waiting for Resolution', state: 0 };
  } 
  // 4. Check if bidding deadline has passed but resolution time hasn't
  else if (biddingEndDate && now >= biddingEndDate) {
    return { status: 'Waiting for Resolution', state: 0 };
  } 
  // 5. Default case: Market is still active (bidding period)
  else {
    return { status: 'Active', state: 0 };
  }
};

// Helper function to format ISO date strings to a more readable format
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format date: Month Day, Year at Hour:Minute AM/PM
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString; // Return original string if parsing fails
  }
};

const LiquidityPage: NextPage = () => {
  const { walletAddress } = useContext(AppContext);
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  
  // Use the marketService hook instead of initializing it manually
  const usemarketService = useMarketService();
  
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
  
  // State for storing live markets data
  const [liveMarketsInfo, setLiveMarketsInfo] = useState<any>({});
  const [liveMarketsLoading, setLiveMarketsLoading] = useState<boolean>(true);
  const [liveMarketsError, setLiveMarketsError] = useState<string | null>(null);
  
  // Update the selected market ID when a market row is expanded
  useEffect(() => {
    if (expandedMarketIds.length > 0) {
      // Find the market object for the first expanded market ID
      const expandedMarket = marketsWithPositions.find(m => m.marketId === expandedMarketIds[0]);
      if (expandedMarket) {
        // Use a functional update to avoid triggering refreshes if the market ID is the same
        setSelectedMarket((prevSelected: MarketWithPosition | null) => {
          if (prevSelected && prevSelected.marketId === expandedMarket.marketId) {
            return prevSelected; // No change if the market ID is the same
          }
          return expandedMarket;
        });
      }
    }
  }, [expandedMarketIds]);
  
  // Create a combined view of markets with user positions
  const marketsWithPositions = useMemo(() => {
    // Reduce logging frequency to improve performance
    if (process.env.NODE_ENV !== 'production') {
      console.log("Building marketsWithPositions with current data:", { 
        markets: marketData.length, 
        today: new Date().toISOString(),
        userLiquidityShare: Object.keys(userLiquidityByMarket).length,
        liveMarkets: liveMarketsInfo ? Object.keys(liveMarketsInfo).length : 0
      });
    }
    
    // Debug the user's liquidity positions
    console.log("DEBUG - User Liquidity by Market:", userLiquidityByMarket);
    console.log("DEBUG - All User Liquidity Shares:", userLiquidityShares);
    
    // Debug the correlation between marketData and userLiquidityShares
    console.log("DEBUG - Market IDs correlation:", {
      marketDataIds: marketData.map(m => m.marketId),
      userSharesIds: userLiquidityShares.map(s => s.marketId),
      matchingIds: marketData.filter(m => userLiquidityShares.some(s => s.marketId === m.marketId)).map(m => m.marketId)
    });
    
    return marketData.map(market => {
      // Find the user's liquidity position for this market
      // userLiquidityByMarket already contains the shareAmount (already divided by 1_000_000)
      const userPosition = userLiquidityByMarket[market.marketId] ?? 0;
      // Find the user's liquidity share object for this market
      const liquidityShare = userLiquidityShares.find(share => share.marketId === market.marketId);
      // Get live market data from our parallel fetched markets
      const liveMarketData = liveMarketsInfo && liveMarketsInfo[market.marketId] ? liveMarketsInfo[market.marketId] : null;
      // Calculate percentage of total shares
      let positionPercentage = 0;
      let userPositionDisplay = undefined;
      
      console.log(`DEBUG - Processing market ${market.marketId}:`, {
        marketName: market.name,
        userPosition,
        hasLiquidityShare: !!liquidityShare,
        liquidityShareData: liquidityShare,
        hasLiveMarketData: !!liveMarketData,
        totalShares: liveMarketData?.liquidity?.totalShares
      });
      
      if (userPosition > 0) {
        // Format user position as display string (no decimals for better readability)
        // userPosition is already divided by 1_000_000 in useLiquidityShares.ts
        userPositionDisplay = Math.floor(userPosition).toString();
        
        // Calculate percentage based on market's currentLiquidity if available
        if (market.currentLiquidity > 0) {
          // Calculate percentage with proper precision based on displayed currentLiquidity
          positionPercentage = parseFloat((userPosition / market.currentLiquidity * 100).toFixed(2));
          
          console.log(`DEBUG - User position for market ${market.marketId}:`, {
            rawUserPosition: userPosition,
            formattedDisplay: userPositionDisplay,
            currentLiquidity: market.currentLiquidity,
            rawPercentage: (userPosition / market.currentLiquidity * 100),
            formattedPercentage: positionPercentage.toFixed(2) + '%'
          });
        }
      }
      
      // Debug user positions for this market
      console.log(`User position summary for market ${market.marketId}:`, {
        position: userPosition,
        percentageOfTotal: positionPercentage > 0 ? `${positionPercentage.toFixed(1)}%` : 'N/A',
        hasPosition: userPosition > 0,
        liquidityShareId: liquidityShare?.id,
        marketTotalShares: liveMarketData?.liquidity?.totalShares,
        liquidityShareRawValue: liquidityShare?.shares,
        allShares: userLiquidityShares.length
      });
      
      // Find market details from appConstants - ensure type safety
      const marketDetails = MARKETS.find(m => 
        typeof m === 'object' && 'marketId' in m && m.marketId === market.marketId
      ) as { marketId: string; name: string; description: string } | undefined;
      
      // Get bidding deadline from live data if available, otherwise calculate it
      let biddingDeadline = '';
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Processing market ${market.marketId} with live data:`, liveMarketData);
      }
      
      if (liveMarketData?.timing?.biddingDeadlineDisplay) {
        biddingDeadline = liveMarketData.timing.biddingDeadlineDisplay;
      } else {
        // Fallback to calculated bidding deadline (24 hours after creation)
        const biddingDeadlineDate = new Date(market.creationTime + (24 * 60 * 60 * 1000));
        biddingDeadline = biddingDeadlineDate.toISOString();
      }
      
      // Get question and criteria from live data if available
      const question = liveMarketData?.basic?.question || marketDetails?.description || market.name;
      const resolutionCriteria = liveMarketData?.basic?.resolutionCriteria ||
        marketDetails?.description || 
        (market.name.includes("Bitcoin") ? "Based on Coinbase BTC/USD closing price" : 
        market.name.includes("temperature") ? "Based on official weather data" :
        "Based on official results");
      
      // Get resolution time from live data if available
      const resolutionTime = liveMarketData?.timing?.resolutionTimeDisplay || market.resolutionTime;
      
      // Get consistent market state using the same logic as PredictionMarket component
      const rawState = liveMarketData?.basic?.state !== undefined ? liveMarketData.basic.state : market.state;
      const { status: stateDisplay, state } = getMarketStateFromRawState(
        rawState, 
        biddingDeadline, 
        resolutionTime
      );
      
      console.log(`MARKET STATE for market ${market.marketId}:`, {
        rawState,
        newStateDisplay: stateDisplay,
        newState: state,
        oldStateDisplay: liveMarketData?.basic?.stateDisplay || market.stateDisplay,
        biddingDeadline,
        resolutionTime,
        now: new Date().toISOString()
      });
      
      // Calculate current liquidity from live data if available
      let currentLiquidity = market.currentLiquidity; 
      
      if (liveMarketData?.liquidity?.totalLiquidity !== undefined) {
        const newLiquidity = Number(liveMarketData.liquidity.totalLiquidity) / 1_000_000;
        
        // Force the value to a valid number or use 0 if NaN
        currentLiquidity = !isNaN(newLiquidity) ? newLiquidity : 0;
        
        // Debug log to check the current liquidity value
        console.log(`Current liquidity updated for market ${market.marketId}:`, {
          rawLiquidity: liveMarketData?.liquidity?.totalLiquidity,
          calculatedLiquidity: currentLiquidity,
          previousValue: market.currentLiquidity,
          hasLiveData: !!liveMarketData?.liquidity
        });
      } else {
        console.log(`Using existing liquidity for market ${market.marketId}: ${currentLiquidity}`);
      }

      // Add debug logging for this specific market's user position
      console.log(`Finalized market ${market.marketId} user position:`, {
        userPosition,
        userPositionDisplay,
        userPositionPercentage: positionPercentage,
        userPositionObjectId: liquidityShare?.id,
        rawShares: liquidityShare?.shares,
        shareAmount: liquidityShare?.shareAmount,
        // Add specific check for the market we're troubleshooting
        isTargetMarket: market.marketId === '0x1b98cae4835709b14e5f182e98552d381b514bb526cb11d1812dc431f4bdaaa7'
      });

      return {
        ...market,
        userPosition,
        userPositionDisplay,
        userPositionPercentage: positionPercentage,
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
    // Using a more efficient dependency array that only triggers re-calculation when
    // important data changes, not on every render cycle
  }, [
    // Only re-run when the list of market IDs changes, not the entire market objects
    marketData.map(m => m.marketId).join(','),
    // Only care about which markets have liquidity and how much
    Object.entries(userLiquidityByMarket).map(([id, val]) => `${id}:${val}`).join(','),
    // Only care about the share IDs, not the full objects
    (userLiquidityShares || []).map(s => s?.id || '').join(','),
    // For liveMarketsInfo, we only care if the collection of market IDs changed
    liveMarketsInfo ? Object.keys(liveMarketsInfo).sort().join(',') : ''
  ]);

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
    
    return isOpen;
  };

  // Check if market is eligible for adding liquidity
  const canAddLiquidity = (market: MarketWithPosition): boolean => {
    // Use stateDisplay instead of raw state number for more accurate state determination
    const isStateValid = market.stateDisplay === 'Active';
    const isEligible = isStateValid;
    
    // Limit logging to development environment
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Market ${market.id}: Eligibility for adding liquidity - State: ${market.state}, StateDisplay: ${market.stateDisplay} (Valid: ${isStateValid}), Final Result: ${isEligible}`);
    }
    
    return isEligible;
  };
  
  // Maintain a ref to track if a fetch is in progress
  const isFetchingRef = React.useRef(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Store a reference to the previous trigger value to avoid unnecessary fetches
  const prevTriggerRef = React.useRef<number>(refreshTrigger);
  
  // Initialize market service when client is available or when refresh is explicitly triggered
  useEffect(() => {
    // Only proceed if:
    // 1. We have market service and some market data
    // 2. This is the initial load OR an explicit refresh was triggered
    if (!usemarketService || marketData.length === 0) return;
    
    // Skip if this is just a re-render with the same data
    const isFirstLoad = prevTriggerRef.current === 0;
    const isExplicitRefresh = prevTriggerRef.current !== refreshTrigger;
    
    if (!isFirstLoad && !isExplicitRefresh) {
      return;
    }
    
    // Update our reference for next time
    prevTriggerRef.current = refreshTrigger;
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce the fetch operation to prevent rapid consecutive calls
    debounceTimerRef.current = setTimeout(() => {
      // Only fetch if a fetch is not already in progress
      if (!isFetchingRef.current) {
        isFetchingRef.current = true;
        fetchLiveMarketsData()
          .finally(() => {
            isFetchingRef.current = false;
          });
      }
    }, 1000); // 1 second debounce
    
    // Cleanup function to clear timer on unmount or dependency change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    
    // Only include refreshTrigger in dependencies, not marketData.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usemarketService, refreshTrigger]);
  
  // Function to refresh all data with safeguards against rapid clicks
  const lastRefreshTimeRef = React.useRef<number>(0);
  
  const refreshData = () => {
    const now = Date.now();
    // Don't allow refreshes more frequently than every 10 seconds
    if (now - lastRefreshTimeRef.current < 10000) {
      console.log('Refresh throttled - please wait before refreshing again');
      return;
    }
    
    lastRefreshTimeRef.current = now;
    console.log("Refreshing all data...");
    
    // Force a complete refresh by using the current timestamp
    setRefreshTrigger(now);
    
    // This will trigger the useEffect hook to fetch live markets data
    // and explicitly call refresh methods if available
    if (refreshShares) {
      refreshShares();
    }
    
    if (refreshMarkets) {
      refreshMarkets();
    }
  };

  // Ref to track last toggle time to prevent double-clicks
  const lastToggleTimeRef = React.useRef<number>(0);
  
  // Toggle expanded/collapsed state of a market row
  const toggleMarketExpanded = (marketId: string, event: React.MouseEvent) => {
    // Prevent expanding when clicking on buttons
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    // Prevent default behavior to avoid any form submission
    event.preventDefault();
    
    const now = Date.now();
    
    // Debounce toggle operations to 500ms to prevent multiple rapid toggles
    if (now - lastToggleTimeRef.current < 500) {
      return;
    }
    
    lastToggleTimeRef.current = now;
    
    // Update expanded IDs to only allow one expanded row at a time
    setExpandedMarketIds(prevIds => {
      if (prevIds.includes(marketId)) {
        // If this row is already expanded, collapse it
        return prevIds.filter(id => id !== marketId);
      } else {
        // Otherwise, expand only this row and collapse any others
        // When expanding a row, also fetch the latest data if needed
        const expandedMarket = marketsWithPositions.find(m => m.marketId === marketId);
        if (expandedMarket) {
          console.log(`Expanded market: ${marketId}`, {
            currentLiquidity: expandedMarket.currentLiquidity,
            liveMarketData: liveMarketsInfo?.[marketId]?.liquidity
          });
        }
        return [marketId];
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
    
    if (market.stateDisplay !== 'Active') {
      toast.warning(`Cannot add liquidity to a market in '${market.stateDisplay}' state`);
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
    if (!selectedMarket || !usemarketService || !account) return;
    
    try {
      // Convert amount to number for clarity and add a reasonable slippage protection
      const usdcAmount = amount;
      const minLpTokens = amount * 0.58; // 2% slippage protection
      
      console.log(`Adding ${usdcAmount} USDC to market ${selectedMarket.marketId} with min LP tokens ${minLpTokens}`);
      
      // Use the intelligent handler that decides which contract function to call
      const tx = await usemarketService.addLiquidityIntelligent(
        selectedMarket.marketId,
        usdcAmount,
        minLpTokens
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
            console.log("Refreshing user liquidity positions after adding liquidity");
            refreshData(); // Use the comprehensive refresh function
            
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
    if (!selectedMarket || !usemarketService || !account || !selectedMarket.userPositionObjectId) return;
    
    try {
      // Create transaction for removing liquidity
      const tx = await usemarketService.removeLiquidity(
        selectedMarket.marketId,
        selectedMarket.userPositionObjectId
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
            console.log("Refreshing user liquidity positions after removing liquidity");
            refreshData(); // Use the comprehensive refresh function
            
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

  // Keep track of the last fetch time to implement throttling
  const lastFetchTimeRef = React.useRef<number>(0);
  const fetchErrorCountRef = React.useRef<number>(0);
  
  // Function to fetch live markets data with throttling and error handling
  const fetchLiveMarketsData = async () => {
    if (!usemarketService) {
      console.error('Market service not available');
      return;
    }
    
    // Implement throttling - don't fetch more than once every 10 seconds normally
    // If errors are occurring, increase the delay exponentially
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    const errorBackoffTime = Math.min(30000, Math.pow(2, fetchErrorCountRef.current) * 1000);
    const waitTime = fetchErrorCountRef.current > 0 ? errorBackoffTime : 10000;
    
    if (timeSinceLastFetch < waitTime && lastFetchTimeRef.current !== 0) {
      // console.log(`Throttling API requests. Last fetch was ${timeSinceLastFetch}ms ago. Next allowed in ${waitTime - timeSinceLastFetch}ms.`);
      return; // Skip this fetch
    }
    
    lastFetchTimeRef.current = now;
    
    try {
      setLiveMarketsLoading(true);
      setLiveMarketsError(null);
      
      // Extract all market IDs from the marketData
      const marketIds = marketData.map(market => market.marketId);
      
      if (marketIds.length === 0) {
        console.log('No markets to fetch live data for');
        setLiveMarketsLoading(false);
        return;
      }
      
      console.log(`Fetching live data for ${marketIds.length} markets`);
      
      // Call the getAllMarketsInfo method from MarketService
      const marketsInfoResponse = await usemarketService.getAllMarketsInfo(marketIds);
      
      // Check if we got a proper response with markets array
      const marketsInfo = marketsInfoResponse.success && marketsInfoResponse.markets ? 
        marketsInfoResponse.markets : [];
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Markets info response:', { 
          success: marketsInfoResponse.success,
          count: marketsInfoResponse.count,
          marketsCount: marketsInfo.length
        });
      }
      
      // Convert the array of market info objects to a map for easier lookups
      const marketsInfoMap: Record<string, any> = {};
      marketsInfo.forEach(marketInfo => {
        if (marketInfo && marketInfo.marketId) {
          marketsInfoMap[marketInfo.marketId] = marketInfo;
        }
      });
      
      // Minimize logging in production - only log when needed
      if (process.env.NODE_ENV !== 'production') {
        console.log('Fetched live markets data');
      }
      
      // Deep compare the actual market data that matters, not just keys
      const hasChanged = !liveMarketsInfo || 
        marketsInfo.some((info, index) => {
          if (!info || !info.success) return false;
          const marketId = info.marketId;
          const oldInfo = liveMarketsInfo[marketId];
          if (!oldInfo || !oldInfo.success) return true;
          
          try {
            // Compare the important fields that would affect rendering
            return JSON.stringify(info.liquidity) !== JSON.stringify(oldInfo.liquidity) ||
                   JSON.stringify(info.basic) !== JSON.stringify(oldInfo.basic) ||
                   JSON.stringify(info.timing) !== JSON.stringify(oldInfo.timing);
          } catch (e) {
            console.error("Error comparing market info:", e);
            return true; // If there's an error, consider it changed
          }
        });
        
      if (hasChanged) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Live markets data has changed, updating state');
        }
        setLiveMarketsInfo(marketsInfoMap);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Live markets data has not changed, skipping state update');
        }
      }
    } catch (error: any) {
      console.error('Error fetching live markets data:', error);
      
      // Increment the error counter to trigger exponential backoff
      fetchErrorCountRef.current = Math.min(8, fetchErrorCountRef.current + 1); // Cap at 256 seconds (2^8 * 1000ms)
      
      // Create a user-friendly error message, but don't update state for spread price errors
      // which would cause unnecessary re-renders
      const errorMessage = error.message || 'Failed to fetch live market data';
      
      // Only update error state if it's not a spread price error
      // This prevents unnecessary re-renders and refresh cycles
      if (errorMessage.includes('spread prices') || errorMessage.includes('No results returned')) {
        console.log('Ignoring non-critical spread price error to prevent refresh cycles');
      } else {
        setLiveMarketsError(errorMessage);
        
        // If we got a rate limit error, wait longer before next attempt
        if (errorMessage.includes('429')) {
          lastFetchTimeRef.current = now + 60000; // Wait at least 60 more seconds
        }
      }
    } finally {
      setLiveMarketsLoading(false);
      
      // If successful (no error caught), reset error counter
      if (fetchErrorCountRef.current > 0) {
        setTimeout(() => {
          fetchErrorCountRef.current = Math.max(0, fetchErrorCountRef.current - 1);
        }, 30000); // Gradually reduce the error counter after 30 seconds
      }
    }
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
                            <span 
                              className="text-green-400" 
                              title={`${market.userPositionDisplay} (${market.userPositionPercentage?.toFixed(2) || 0}% of total market liquidity)`}
                            >
                              {market.userPositionDisplay} shares
                              {market.userPositionPercentage > 0 && (
                                <span className="ml-1 text-xs text-green-300">
                                  ({market.userPositionPercentage.toFixed(2)}%)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            market.stateDisplay === 'Active' ? "bg-green-900/30 text-green-400" : 
                            market.stateDisplay === 'Resolved' ? "bg-amber-900/30 text-amber-400" : 
                            market.stateDisplay === 'Waiting for Resolution' ? "bg-blue-900/30 text-blue-400" :
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
                                  <p className="text-white text-lg font-medium">
                                    ${market.currentLiquidity.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                  </p>
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
                                  <p className="text-white text-lg font-medium">{formatDateForDisplay(market.resolutionTime)}</p>
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