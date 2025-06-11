import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { DEFAULT_MARKET_ID, SPREAD_COLORS, CONSTANTS } from '@/constants/appConstants';
import { SpreadLabel, MARKET_SPREAD_LABELS } from '@/constants/marketDetails';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { findMatchingSpreadLabel, createSyntheticOption } from '@/utilities/spreadLabelUtils';

// Import custom hooks
import { useMarketPositions, Position } from '@/hooks/useMarketPositions';
import { useMarketQuotes } from '@/hooks/useMarketQuotes';
import { useMarketTransactions } from '@/hooks/useMarketTransactions';

// Countdown component to display time remaining
const Countdown = ({ targetDate, label, onComplete }: { 
  targetDate: Date, 
  label: string,
  onComplete?: () => void 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  
  useEffect(() => {
    // Validate the date first to prevent Invalid time value errors
    if (!targetDate || isNaN(targetDate.getTime())) {
      // console.error("Invalid target date provided to Countdown:", targetDate);
      setIsCompleted(true);
      return;
    }
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!isCompleted) {
          setIsCompleted(true);
          if (onComplete) {
            onComplete();
          }
        }
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    };
    
    // Initial calculation
    calculateTimeRemaining();
    
    // Update the countdown every second
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    // Clean up the timer
    return () => clearInterval(timer);
  }, [targetDate, isCompleted, onComplete]);
  
  // Return placeholder text if date is invalid
  if (!targetDate || isNaN(targetDate.getTime())) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-xs text-white/70 mb-1">{label}</div>
        <div className="text-sm text-amber-400">Invalid Date</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-white/70 mb-1">{label}</div>
      <div className="w-full flex justify-center gap-2 text-center">
        {isCompleted ? (
          <div className="text-sm text-amber-400 font-medium">Time Expired</div>
        ) : (
          <>
            {timeRemaining.days > 0 && (
              <div className="flex-col text-center">
                <span className="text-sm font-medium text-white">{timeRemaining.days}</span>
                <span className="text-xs text-white/70 ml-1">d</span>
              </div>
            )}
            <div className="flex-col text-center">
              <span className="text-sm font-medium text-white">{timeRemaining.hours.toString().padStart(2, '0')}</span>
              <span className="text-xs text-white/70 ml-1">h</span>
            </div>
            <span className="text-sm text-white/70">:</span>
            <div className="flex-col text-center">
              <span className="text-sm font-medium text-white">{timeRemaining.minutes.toString().padStart(2, '0')}</span>
              <span className="text-xs text-white/70 ml-1">m</span>
            </div>
            <span className="text-sm text-white/70">:</span>
            <div className="flex-col text-center">
              <span className="text-sm font-medium text-white">{timeRemaining.seconds.toString().padStart(2, '0')}</span>
              <span className="text-xs text-white/70 ml-1">s</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Updated interface to include color for spread visualization and metadata
interface SpreadOption {
  id: string;
  value: string; // spreadIndex as string
  label: string; // display name or range
  originalRange?: string; // original display range
  buyPrice: string;
  sellPrice: string | null;
  percentage: number; // Dynamically calculated percentage
  color?: string; // Optional color for visualization
  priceRefreshed?: boolean; // Flag indicating if price was refreshed
  // Use the imported SpreadLabel type for consistency
  metadata?: SpreadLabel;
}

interface PredictionMarketProps {
  marketId?: string;
  question: string;
  options: SpreadOption[];
  resolutionCriteria: string;
  resolver: string;
  currentPrice?: number;
  onTransactionComplete?: () => void; // Callback to refresh data after transactions
  onMarketChange?: (marketId: string) => void; // Callback to notify parent when market changes
  marketStatus?: string; // Added market status
  marketStatusState?: number; // Added market status state (0 = active, 1 = pending, etc)
  resolutionTime?: string; // Added resolution time
  biddingDeadline?: string; // Added bidding deadline
  resolvedValue?: number; // Added resolved value
  spreadPrices?: {[spreadIndex: number]: number}; // Added spread prices for position value calculation
  marketTiming?: {
    createdAt?: string;
    updatedAt?: string;
    biddingStart?: string;
    biddingEnd?: string;
    resolutionDate?: string;
  };
}

export const PredictionMarket: React.FC<PredictionMarketProps> = ({
  marketId = DEFAULT_MARKET_ID,
  question,
  options,
  resolutionCriteria,
  resolver,
  currentPrice,
  onTransactionComplete,
  onMarketChange,
  marketStatus,
  marketStatusState,
  resolutionTime,
  biddingDeadline,
  resolvedValue,
  spreadPrices,
  marketTiming
}) => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // Log marketTiming props to debug timing information
  // console.log("🕰️ [PredictionMarket] Market Timing Debug:", {
  //   marketId,
  //   marketTiming,
  //   biddingDeadline,
  //   resolutionTime,
  //   marketStatus,
  //   marketStatusState
  // });
  
  // Set default values for critical date fields if they're undefined
  // First try to get from marketTiming, then use a fallback date in the future
  const defaultBiddingDeadline = biddingDeadline || 
    (marketTiming?.biddingEnd ? marketTiming.biddingEnd : null);
    
  const defaultResolutionTime = resolutionTime || 
    (marketTiming?.resolutionDate ? marketTiming.resolutionDate : null);
    // console.log("🕰️ [PredictionMarket] Default Dates Debug:", defaultResolutionTime);
    
  
  // Add more debugging to identify the source of null values
  // console.log("🔍 [PredictionMarket] Props Debug:");
  // console.log("🔍 marketId:", marketId);
  // console.log("🔍 biddingDeadline (raw):", biddingDeadline);
  // console.log("🔍 marketTiming?.biddingEnd:", marketTiming?.biddingEnd);
  // console.log("🔍 defaultBiddingDeadline (calculated):", defaultBiddingDeadline);
  // console.log("🔍 resolutionTime (raw):", resolutionTime);
  // console.log("🔍 marketTiming?.resolutionDate:", marketTiming?.resolutionDate);
  // console.log("🔍 defaultResolutionTime (calculated):", defaultResolutionTime);
  
  // Add fallbacks for testing - if both are null, use future dates
  // This ensures the component functions even with missing data
  const finalBiddingDeadline = defaultBiddingDeadline || 
    (new Date(Date.now() + 86400000).toISOString()); // 1 day from now as fallback
    
  const finalResolutionTime = defaultResolutionTime || 
    (new Date(Date.now() + 172800000).toISOString()); // 2 days from now as fallback
    
  // console.log("🔍 [PredictionMarket] Final values with fallbacks:");
  // console.log("🔍 finalBiddingDeadline:", finalBiddingDeadline);
  // console.log("🔍 finalResolutionTime:", finalResolutionTime);
  
  // State to track the current market
  const [currentMarketId, setCurrentMarketId] = useState<string>(marketId);
  
  // Effect to detect and handle marketId changes
  useEffect(() => {
    if (currentMarketId !== marketId) {
      setCurrentMarketId(marketId);
    }
  }, [marketId, currentMarketId]);
  
  // State to track market timing information
  const [marketTimingInfo, setMarketTimingInfo] = useState<{
    createdAt: string | null;
    updatedAt: string | null;
    biddingStart: string | null;
    biddingEnd: string | null;
    resolutionDate: string | null;
  }>({
    createdAt: null,
    updatedAt: null,
    biddingStart: null,
    biddingEnd: null,
    resolutionDate: null
  });
  
  // Process market timing information when it changes
  useEffect(() => {
    //console.log('⏱️ [PredictionMarket] Processing market timing information');
    const startTime = performance.now();
    
    // Initialize with current props - using parseRawTimestamp to handle various timestamp formats
    const timing = {
      createdAt: parseRawTimestamp(marketTiming?.createdAt),
      updatedAt: parseRawTimestamp(marketTiming?.updatedAt),
      biddingStart: parseRawTimestamp(marketTiming?.biddingStart),
      biddingEnd: parseRawTimestamp(biddingDeadline || marketTiming?.biddingEnd),
      resolutionDate: parseRawTimestamp(resolutionTime || marketTiming?.resolutionDate)
    };
    
    // Log all the market timing information
    //console.log('⏱️ [PredictionMarket] Market ID:', currentMarketId);
    //console.log('⏱️ [PredictionMarket] Created at (raw):', marketTiming?.createdAt);
    //console.log('⏱️ [PredictionMarket] Created at (parsed):', timing.createdAt);
    //console.log('⏱️ [PredictionMarket] Updated at (raw):', marketTiming?.updatedAt);
    //console.log('⏱️ [PredictionMarket] Updated at (parsed):', timing.updatedAt);
    //console.log('⏱️ [PredictionMarket] Bidding starts (raw):', marketTiming?.biddingStart);
    //console.log('⏱️ [PredictionMarket] Bidding starts (parsed):', timing.biddingStart);
    //console.log('⏱️ [PredictionMarket] Bidding ends (raw):', biddingDeadline || marketTiming?.biddingEnd);
    //console.log('⏱️ [PredictionMarket] Bidding ends (parsed):', timing.biddingEnd);
    //console.log('⏱️ [PredictionMarket] Resolution date (raw):', resolutionTime || marketTiming?.resolutionDate);
    //console.log('⏱️ [PredictionMarket] Resolution date (parsed):', timing.resolutionDate);
    
    // Set state with the processed timing information
    setMarketTimingInfo(timing);
    
    const endTime = performance.now();
    //console.log(`⏱️ [PredictionMarket] Timing information processed in ${(endTime - startTime).toFixed(2)}ms`);
    
  }, [marketTiming, resolutionTime, biddingDeadline, currentMarketId]);
  
  // Use the market positions hook to fetch user positions
  const { 
    positions, 
    isLoading: positionsLoading, 
    error: positionsError,
    totalPositionsValue,
    positionData,
    refreshPositions
  } = useMarketPositions(
    suiClient, 
    currentMarketId, 
    account?.address || null,
    spreadPrices
  );
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedSpreadIndex, setSelectedSpreadIndex] = useState<number>(-1);
  const [amount, setAmount] = useState<string>('100');
  const [isBuying, setIsBuying] = useState<boolean>(true);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if the bidding deadline has passed
  const isBiddingClosed = finalBiddingDeadline ? new Date() > new Date(finalBiddingDeadline) : false;
  
  // Check if resolution time has passed (for claim functionality)
  const isResolutionPassed = finalResolutionTime ? new Date() > new Date(finalResolutionTime) : false;

  // Determine the real-time market status
  const [realTimeMarketStatus, setRealTimeMarketStatus] = useState<{
    status: string;
    state: number;
  }>({
    status: marketStatus || 'Unknown',
    state: marketStatusState || 0
  });

  // Function to update market status based on current time and raw state value
  const updateMarketStatus = () => {
    const startTime = performance.now();
    //console.log('⏱️ [PredictionMarket] Starting market status update');
    
    // First check for explicit marketStatusState prop - this takes priority over all
    if (marketStatusState !== undefined) {
      // Use the getMarketStateFromRawState function to get the correct status
      const state = getMarketStateFromRawState(marketStatusState);
      //console.log(`⏱️ [PredictionMarket] Using explicit marketStatusState: ${marketStatusState} -> ${state.status}`);
      setRealTimeMarketStatus(state);
      
      const endTime = performance.now();
      //console.log(`⏱️ [PredictionMarket] Market status update completed in ${(endTime - startTime).toFixed(2)}ms`);
      return;
    }
    
    // When no explicit state is provided, use the getMarketStateFromRawState function with undefined
    // to calculate the state based on the dates
    const state = getMarketStateFromRawState();
    //console.log(`⏱️ [PredictionMarket] Calculated market state from dates: ${state.status}`);
    setRealTimeMarketStatus(state);
    
    const endTime = performance.now();
    //console.log(`⏱️ [PredictionMarket] Market status update completed in ${(endTime - startTime).toFixed(2)}ms`);
  };
  
  // Update market status when component mounts and when dates or timing information changes
  useEffect(() => {
    //console.log(`⏱️ [PredictionMarket] Updating market status for marketId: ${currentMarketId}`);
    const startTime = performance.now();
    
    // Use marketTimingInfo for status calculation
    if (marketTimingInfo) {
      // Market timing info is available, proceed with status update
    }
    
    updateMarketStatus();
    
    const endTime = performance.now();
    //console.log(`⏱️ [PredictionMarket] Total time to update market status: ${(endTime - startTime).toFixed(2)}ms`);
  }, [marketTimingInfo, biddingDeadline, resolutionTime]);
  
  // Update the status when countdown timers complete
  const handleBiddingDeadlineComplete = () => {
    updateMarketStatus();
  };
  
  const handleResolutionTimeComplete = () => {
    updateMarketStatus();
  };

  // Handler for market change
  const handleMarketChange = (newMarketId: string) => {
    setCurrentMarketId(newMarketId);
    
    // Reset selected states when market changes
    setSelectedOption(null);
    setSelectedSpreadIndex(-1);
    setSelectedPosition(null);
    
    // Notify parent component if callback provided
    if (onMarketChange) {
      onMarketChange(newMarketId);
    }
  };

  // Use the market quotes hook for getting quotes - properly handling position data for selling
  const {
    quoteAmount: receiveAmount,
    rawQuote,
    isLoading: quoteLoading,
    error: quoteError
  } = useMarketQuotes(
    suiClient,
    currentMarketId,
    // Only pass spreadIndex when buying, otherwise it causes an error for sell quotes
    isBuying ? selectedSpreadIndex : (selectedPosition ? selectedPosition.spreadIndex : -1),
    amount,
    isBuying
  );

  const handleOptionSelect = (option: SpreadOption) => {
    if (isBiddingClosed) return;
    setSelectedOption(option.label);
    setSelectedSpreadIndex(parseInt(option.value));
    setIsBuying(true); // Switch to buy mode when selecting an option
    setSelectedPosition(null); // Clear any selected position
  };

  // Use market transactions hook for buy/sell/claim operations
  const {
    buySharesFromMarket,
    sellSharesFromPosition,
    claimRewardsFromMarket,
    validateTransaction,
    processTransactionResult,
    isLoading: txLoading,
    setIsLoading: setTxLoading
  } = useMarketTransactions();

  const handleSubmitTrade = async () => {
    if (isBiddingClosed) {
      toast.error('Bidding period has ended for this market');
      return;
    }
    
    if (!account) {
      toast.error('Please connect your wallet to place a prediction');
      return;
    }
    
    if (selectedSpreadIndex < 0 && !selectedPosition) {
      toast.error('Please select a price range or position');
      return;
    }

    const parsedAmount = parseFloat(amount || '0');
    if (parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      setTxLoading(true);
      
      if (isBuying) {
        // We can use rawQuote directly from the useMarketQuotes hook
        if (!rawQuote) {
          toast.error('Failed to get quote. Please try again.');
          setIsLoading(false);
          setTxLoading(false);
          return;
        }
        
        //console.log('Buy quote:', rawQuote);
        
        // Proceed with the transaction using our transaction hook
        const tx = await buySharesFromMarket(
          suiClient, 
          currentMarketId, 
          selectedSpreadIndex, 
          parsedAmount, 
          rawQuote, 
          account.address
        );
        
        // Validate the transaction
        const validationResult = await validateTransaction(
          suiClient,
          tx,
          account.address
        );
        
        if (!validationResult.isValid) {
          toast.error(`Transaction would fail: ${validationResult.error}`);
          setIsLoading(false);
          setTxLoading(false);
          return;
        }
        
        // Sign and execute the transaction
        signAndExecuteTransaction(
          {
            transaction: tx,
          },
          {
            onSuccess: async (txResult) => {
              const digest = txResult.digest;
              
              try {
                // Process the transaction result
                const result = await processTransactionResult(suiClient, digest);
                
                if (result.success) {
                  //console.log('\n✅ Successfully bought shares!');
                  
                  // Display created objects (positions)
                  if (result.createdObjects) {
                    result.createdObjects.forEach((obj: any) => {
                      if (obj.owner.AddressOwner === account.address) {
                        toast.success(`Created new position: ${obj.reference.objectId.substring(0, 8)}...`);
                      }
                    });
                  }
                  
                  // Display events
                  if (result.events) {
                    result.events.forEach((event: any) => {
                      if (event.type.includes('SharesPurchased')) {
                        const parsedEvent = event.parsedJson as any;
                        
                        toast.success(`Purchased ${(Number(parsedEvent?.shares_amount) / 1_000_000).toFixed(2)} shares for ${(Number(parsedEvent?.payment_amount) / 1_000_000).toFixed(2)} USDC`);
                        
                        if (parsedEvent?.refund_amount) {
                          toast.info(`Refunded ${(Number(parsedEvent?.refund_amount) / 1_000_000).toFixed(2)} USDC`);
                        }
                      }
                    });
                  }
                } else {
                  console.error('\n❌ Failed to buy shares');
                  toast.error(`Transaction failed: ${result.error || 'Unknown error'}`);
                }
              } catch (error) {
                console.error('Error processing transaction result:', error);
                toast.error('Error confirming transaction. Please check your wallet for status.');
              }
              
              // Call the refresh callback after transaction completes
              if (onTransactionComplete) {
                onTransactionComplete();
              }
              
              // Refresh positions
              refreshPositions();
              
              setIsLoading(false);
              setTxLoading(false);
            },
            onError: (error) => {
              console.error("Transaction failed:", error);
              toast.error(error.message || 'Transaction failed. Please try again.');
              setIsLoading(false);
              setTxLoading(false);
            }
          }
        );
      } else if (selectedPosition) {
        // Selling shares from a position
        try {
          // We can use rawQuote directly from useMarketQuotes hook
          if (!rawQuote) {
            toast.error('Failed to get quote. Please try again.');
            setIsLoading(false);
            setTxLoading(false);
            return;
          }
          
          //console.log('Sell quote:', rawQuote);
          //console.log("Spread index selected======>>>>>", selectedPosition);
          
          // Proceed with the sell transaction
          const tx = await sellSharesFromPosition(
            suiClient, 
            currentMarketId,
            selectedPosition.spreadIndex, 
            parsedAmount, 
            rawQuote
          );
          
          // Validate the transaction
          const validationResult = await validateTransaction(
            suiClient,
            tx,
            account.address
          );
          
          if (!validationResult.isValid) {
            toast.error(`Transaction would fail: ${validationResult.error}`);
            setIsLoading(false);
            setTxLoading(false);
            return;
          }
          
          // Sign and execute the transaction
          signAndExecuteTransaction(
            {
              transaction: tx,
            },
            {
              onSuccess: async (txResult) => {
                const digest = txResult.digest;
                
                try {
                  // Process the transaction result
                  const result = await processTransactionResult(suiClient, digest);
                  
                  if (result.success) {
                    //console.log('\n✅ Successfully sold shares!');
                    
                    // Display events
                    if (result.events) {
                      result.events.forEach((event: any) => {
                        if (event.type.includes('SharesSold')) {
                          const parsedEvent = event.parsedJson as any;
                          
                          toast.success(`Sold ${(Number(parsedEvent?.shares_amount) / 1_000_000).toFixed(2)} shares for ${(Number(parsedEvent?.payment_amount) / 1_000_000).toFixed(2)} USDC`);
                        }
                      });
                    }
                  } else {
                    console.error('\n❌ Failed to sell shares');
                    toast.error(`Transaction failed: ${result.error || 'Unknown error'}`);
                  }
                } catch (error) {
                  console.error('Error processing transaction result:', error);
                  toast.error('Error confirming transaction. Please check your wallet for status.');
                }
                
                // Call the refresh callback after transaction completes
                if (onTransactionComplete) {
                  onTransactionComplete();
                }
                
                // Refresh positions
                refreshPositions();
                
                setIsLoading(false);
                setTxLoading(false);
              },
              onError: (error) => {
                console.error("Transaction failed:", error);
                toast.error(error.message || 'Transaction failed. Please try again.');
                setIsLoading(false);
                setTxLoading(false);
              }
            }
          );
        } catch (error) {
          toast.error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error('Transaction error:', error);
          setIsLoading(false);
          setTxLoading(false);
        }
      }
    } catch (error: any) {
      toast.error(`Transaction failed: ${error.message}`);
      console.error('Transaction error:', error);
      setIsLoading(false);
      setTxLoading(false);
    }
  };

  const handleSelectPosition = (position: Position) => {
    if (isBiddingClosed) return;
    setSelectedPosition(position);
    setSelectedSpreadIndex(-1);  // Clear the spread selection
    
    // Find the corresponding option label for this position
    const option = options.find(opt => parseInt(opt.value) === position.spreadIndex);
    setSelectedOption(option?.label || null);
    
    setIsBuying(false); // Switch to sell mode
    setAmount(position.sharesAmount.toString()); // Pre-fill with available shares
  };

  const handleClaimReward = async () => {
    if (!isResolutionPassed) {
      toast.error('Resolution time has not yet passed');
      return;
    }
    
    if (!account) {
      toast.error('Please connect your wallet to claim rewards');
      return;
    }
    
    try {
      setIsLoading(true);
      setTxLoading(true);
      
      // Create claim transaction using our hook
      const tx = await claimRewardsFromMarket(
        suiClient,
        currentMarketId,
        account.address
      );
      
      // Validate the transaction
      const validationResult = await validateTransaction(
        suiClient,
        tx,
        account.address
      );
      
      if (!validationResult.isValid) {
        toast.error(`Claim transaction would fail: ${validationResult.error}`);
        setIsLoading(false);
        setTxLoading(false);
        return;
      }
      
      // Execute the claim transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: async (txResult) => {
            const digest = txResult.digest;
            
            try {
              // Process the transaction result
              const result = await processTransactionResult(suiClient, digest);
              
              if (result.success) {
                //console.log('\n✅ Successfully claimed rewards!');
                toast.success('Successfully claimed rewards!');
                
                // Display events
                if (result.events) {
                  result.events.forEach((event: any) => {
                    if (event.type.includes('RewardsClaimed')) {
                      const parsedEvent = event.parsedJson as any;
                      
                      toast.success(`Claimed rewards: ${(Number(parsedEvent?.amount) / 1_000_000).toFixed(2)} USDC`);
                    }
                  });
                }
              } else {
                console.error('\n❌ Failed to claim rewards');
                toast.error(`Transaction failed: ${result.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error processing transaction result:', error);
              toast.error('Error confirming transaction. Please check your wallet for status.');
            }
            
            // Call the refresh callback after transaction completes
            if (onTransactionComplete) {
              onTransactionComplete();
            }
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            toast.error(error.message || 'Transaction failed. Please try again.');
            setIsLoading(false);
            setTxLoading(false);
          }
        }
      );
    } catch (error: any) {
      toast.error(`Transaction failed: ${error.message}`);
      console.error('Transaction error:', error);
      setIsLoading(false);
      setTxLoading(false);
    }
  };

  // Function to check if a position is in the winning spread and handle claimed status
  const isWinningPosition = (position: Position): boolean => {
    // Only applicable if market is resolved and has a resolved value
    if (realTimeMarketStatus.status !== 'Resolved' && marketStatusState !== 1 || resolvedValue === undefined) {
      return false;
    }
    
    // Find the spread option for this position
    const option = options.find(opt => parseInt(opt.value) === position.spreadIndex);
    if (!option) return false;
    
    // Check if the resolved value falls within this spread's range
    const range = option.label.split(" - ");
    if (range.length !== 2) return false;
    
    const lowerBound = parseFloat(range[0]);
    const upperBound = parseFloat(range[1]);
    
    // Special handling for 0-1 spread when resolvedValue is exactly 1
    if (position.spreadIndex === 0 && resolvedValue === 1) {
      // For 0-1 spread, include exactly 1 in the range
      return true;
    }
    
    // For other spreads, use half-open interval [lowerBound, upperBound)
    // This ensures that the upper bound is exclusive except for the highest spread
    if (resolvedValue === upperBound) {
      // For boundary values, only consider it part of the current spread if there's no next spread
      // Check if this is the last/highest spread
      const isHighestSpread = !options.some(opt => {
        const otherRange = opt.label.split(" - ");
        if (otherRange.length !== 2) return false;
        return parseFloat(otherRange[0]) > upperBound;
      });
      
      return isHighestSpread && resolvedValue >= lowerBound;
    }
    
    // Normal case - value is within bounds but not exactly at upper boundary
    return resolvedValue >= lowerBound && resolvedValue < upperBound;
  };
  
  // Function to calculate position value based on whether it's winning or not
  const getPositionValue = (position: Position): number => {
    if (isWinningPosition(position)) {
      // Winning positions are worth 1:1 (sharesAmount in USD)
      // For winning positions, each share is worth exactly $1
      return position.sharesAmount;
    } else {
      // Non-winning positions are worth 0
      return 0;
    }
  };
  
  // Function to check if user has already claimed their winnings
  const hasUserClaimedWinnings = (): boolean => {
    return positionData?.data?.claimed || false;
  };
  
  // Function to get the amount of winnings claimed
  const getWinningsClaimedAmount = (): number => {
    const rawAmount = positionData?.data?.winningsClaimed || 0;
    return rawAmount / 1_000_000; // Convert from raw units (6 decimals)
  };
  
  // Helper function to parse and format raw timestamp data
  const parseRawTimestamp = (timestamp: string | number | undefined): string | null => {
    if (!timestamp) return null;
    
    try {
      // Check if it's a numeric timestamp in milliseconds
      if (typeof timestamp === 'number' || !isNaN(Number(timestamp))) {
        const date = new Date(Number(timestamp));
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      // Try parsing as ISO string or other date format
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      return String(timestamp); // Return as-is if we can't parse it
    } catch (error) {
      console.error('⏱️ [PredictionMarket] Error parsing timestamp:', error, timestamp);
      return String(timestamp); // Return as string if parsing fails
    }
  };

  // Helper function to determine market state from numerical state value
  const getMarketStateFromRawState = (state?: number): { status: string; state: number } => {
    const now = new Date();
    let resolutionDate = null;
    let biddingEndDate = null;
    
    // Log structured market timing information for debugging
    console.log("🌟 [Market State Calculation]", {
      now: now.toISOString(),
      rawState: state,
      marketId,
      biddingDeadline: defaultBiddingDeadline,
      resolutionTime: defaultResolutionTime,
      marketStatusState
    });
    
    // 1. First check if the market has been explicitly resolved (state = 1)
    if (state === 1 || marketStatusState === 1) {
      console.log("🌟 Market is Resolved: explicit state = 1");
      return { status: 'Resolved', state: 1 };
    }
    
    // 2. Check for special states like Canceled
    if (state === 2 || marketStatusState === 2) {
      console.log("🌟 Market is Canceled: explicit state = 2");
      return { status: 'Canceled', state: 2 };
    }
    
    // Parse bidding deadline and resolution dates for state calculation
    try {
      if (defaultBiddingDeadline) {
        biddingEndDate = new Date(defaultBiddingDeadline);
        if (isNaN(biddingEndDate.getTime())) biddingEndDate = null;
      }
      
      if (defaultResolutionTime) {
        resolutionDate = new Date(defaultResolutionTime);
        if (isNaN(resolutionDate.getTime())) resolutionDate = null;
      }
    } catch (e) {
      console.error('🌟 Error parsing market timing dates:', e);
    }
    
    console.log("🌟 Parsed dates for calculation:", {
      biddingEndDate: biddingEndDate?.toISOString() || "Not available",
      resolutionDate: resolutionDate?.toISOString() || "Not available"
    });
    
    // 3. Check if resolution time has passed
    if (resolutionDate && now >= resolutionDate) {
      console.log("🌟 Market is Waiting for Resolution: current time >= resolution time");
      return { status: 'Waiting for Resolution', state: 0 };
    } 
    // 4. Check if bidding deadline has passed but resolution time hasn't
    else if (biddingEndDate && now >= biddingEndDate) {
      console.log("🌟 Market is Waiting for Resolution: current time >= bidding deadline");
      return { status: 'Waiting for Resolution', state: 0 };
    } 
    // 5. Default case: Market is still active (bidding period)
    else {
      console.log("🌟 Market is Active: current time < bidding deadline");
      return { status: 'Active', state: 0 };
    }
  };
  
  // Debug utility function to help diagnose spread label matching issues
  const debugSpreadLabelMatching = (position: Position, spreadLabels: SpreadLabel[] | undefined) => {
    if (!spreadLabels || spreadLabels.length === 0) return;
    
    // Calculate position's expected range
    const posMin = position.spreadIndex * 10;
    const posMax = position.spreadIndex * 10 + 10;
    
    console.log('🔍 Spread Label Matching:', {
      positionId: position.id.substring(0, 8),
      spreadIndex: position.spreadIndex,
      calculatedRange: `${posMin}-${posMax}`,
      formattedRange: `${(posMin/100).toFixed(2)}-${(posMax/100).toFixed(2)} $`,
      labels: spreadLabels.map(l => ({
        index: l.index,
        bounds: l.lowerBound !== undefined && l.upperBound !== undefined ? 
          `${l.lowerBound}-${l.upperBound} (${(l.lowerBound/100).toFixed(2)}-${(l.upperBound/100).toFixed(2)} $)` : 
          'undefined'
      }))
    });
    
    // Find the best match
    const bestMatch = spreadLabels.find(label => {
      if (label.index === position.spreadIndex) return true;
      if (label.lowerBound === posMin && label.upperBound === posMax) return true;
      return false;
    });
    
    if (bestMatch) {
      console.log('✅ Best match found:', {
        name: bestMatch.name,
        index: bestMatch.index,
        range: bestMatch.lowerBound !== undefined ? 
          `${(bestMatch.lowerBound/100).toFixed(2)}-${(bestMatch.upperBound!/100).toFixed(2)} $` : 
          'undefined'
      });
    } else {
      console.log('❌ No matching label found!');
    }
  };
  
  // Helper function to find the correct label for a position's spread index
  const findMatchingSpreadLabel = (position: Position, spreadLabels: SpreadLabel[] | undefined): SpreadLabel | undefined => {
    if (!spreadLabels || spreadLabels.length === 0) return undefined;
    
    // Calculate expected range for this position
    const posMin = position.spreadIndex * 10;
    const posMax = position.spreadIndex * 10 + 10;
    
    // First try to find an exact index match (most reliable)
    const exactIndexMatch = spreadLabels.find(label => label.index === position.spreadIndex);
    if (exactIndexMatch) {
      console.log(`Found exact index match for position ${position.id.substring(0, 8)}: label.index=${exactIndexMatch.index} matches position.spreadIndex=${position.spreadIndex}`);
      return exactIndexMatch;
    }
    
    // If no exact index match, try to match by lowerBound/upperBound
    const exactBoundsMatch = spreadLabels.find(label => 
      label.lowerBound !== undefined && 
      label.upperBound !== undefined && 
      label.lowerBound === posMin && 
      label.upperBound === posMax
    );
    
    if (exactBoundsMatch) {
      console.log(`Found exact bounds match for position ${position.id.substring(0, 8)}: ${exactBoundsMatch.lowerBound}-${exactBoundsMatch.upperBound} matches position range ${posMin}-${posMax}`);
      return exactBoundsMatch;
    }
    
    // If still no match, log a warning and return undefined
    console.warn(`No matching spread label found for position ${position.id.substring(0, 8)} with spreadIndex ${position.spreadIndex}`);
    return undefined;
  };
  
  // Render component
  return (
    <div className="flex flex-col gap-6 w-full">
      
    
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left panel - Market Overview */}
        <div className="flex flex-col flex-grow gap-4 p-6 rounded-xl bg-gray-800/70 backdrop-blur-md w-full lg:w-3/5">
          <h2 className="text-xl font-medium text-white">{question}</h2>
          
          {/* Spreads visualization - Enhanced two-column view with colors and pricing info */}
          <div className="flex flex-wrap gap-2 my-4">
            {options.map((option, idx) => (
              <div 
                key={option.id} 
                className="flex-grow basis-[48%] h-14 relative"
              >
                <div 
                  className="absolute inset-0 bg-gray-700/50 rounded-lg"
                  style={{ 
                    width: '100%',
                    height: '100%'
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-lg transition-all"
                  style={{ 
                    width: `${Math.max(5, option.percentage)}%`,
                    height: '100%',
                    backgroundColor: option.color || SPREAD_COLORS[idx % SPREAD_COLORS.length], 
                    opacity: 0.8
                  }}
                />
                <button
                  onClick={() => handleOptionSelect(option)}
                  disabled={isBiddingClosed}
                  className={cn(
                    "absolute inset-0 flex flex-col justify-between px-3 py-2 rounded-lg transition-all group",
                    selectedOption === option.label
                      ? "bg-blue-700/40 text-white ring-2 ring-blue-500"
                      : "bg-transparent text-white hover:bg-gray-600/20",
                    isBiddingClosed && "cursor-not-allowed opacity-75"
                  )}
                >
                  <div className="flex justify-between items-center w-full z-10">
                    <span className="text-xs font-medium">{option.label}</span>
                    <span className="text-xs">{option.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center w-full z-10">
                    <span className="text-xs text-white/70">{option.originalRange || option.metadata?.rangeDescription || ''}</span>
                    <span className="text-xs text-white/70">Buy: {option.buyPrice}</span>
                  </div>
                  
                  {/* Description tooltip on hover */}
                  {option.metadata?.description && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-gray-900/90 rounded-lg transition-opacity">
                      <div className="text-xs text-white/90 p-2 text-center">
                        {option.metadata.description}
                      </div>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
                    
          {/* Color legends with enhanced metadata */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 mb-4">
            {SPREAD_COLORS.slice(0, Math.min(options.length, SPREAD_COLORS.length)).map((color, idx) => {
              const option = options[idx];
              if (!option) return null;
              return (
                <div 
                  key={idx} 
                  className="flex items-center bg-gray-800/70 p-2.5 rounded-md border border-gray-700/30 hover:border-gray-600/50 transition-colors"
                  onClick={() => handleOptionSelect(option)}
                >
                  <div 
                    className="w-5 h-5 rounded-md mr-3 flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="flex flex-col">
                    <span className="text-sm text-white font-medium leading-tight">{option.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">{option.originalRange || option.metadata?.rangeDescription || ''}</span>
                      <span className="text-xs bg-gray-700/70 text-white/80 px-1.5 rounded-sm">{option.percentage.toFixed(1)}%</span>
                    </div>
                    {option.metadata?.description && (
                      <span className="text-xs text-white/60 mt-1 italic">{option.metadata.description}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resolution criteria and resolver */}
          <div className="mt-6 text-amber-500">
            <div className="mb-1">
              <span className="font-medium">Resolution Criteria:</span> {resolutionCriteria}
            </div>
            <div>
              <span className="font-medium">Resolver:</span> {resolver}
            </div>
          </div>
        </div>
        
        {/* Right panel - Trading Interface + Holdings */}
        <div className="flex flex-col w-full lg:w-2/5 gap-4">
          {/* Market Status and Resolution Time - Added to top right */}
          {(resolutionTime || biddingDeadline) && (
            <div className="p-4 rounded-xl bg-gray-800/70 backdrop-blur-md">
              <div className="grid grid-cols-2 gap-4">
                {/* Real-time Market Status - Improved layout */}
                <div className="flex flex-col">
                  <div className="text-xs text-white/60 mb-2">Status</div>
                  <div className="flex items-center">
                    <span 
                      className={cn(
                        "w-2 h-2 rounded-full mr-2",
                        realTimeMarketStatus.state === 0 ? "bg-green-500" : 
                        realTimeMarketStatus.state === 1 ? "bg-amber-500" : 
                        "bg-red-500"
                      )}
                    />
                    <span className="text-sm font-medium text-white">{realTimeMarketStatus.status}</span>
                  </div>
                  {/* Show resolved value if market is resolved - Better formatting */}
                  {(realTimeMarketStatus.status === 'Resolved' || marketStatusState === 1) && resolvedValue !== undefined && (
                    <div className="mt-2 p-2 bg-amber-900/30 rounded-md border border-amber-800/30">
                      <div className="flex flex-col">
                        <span className="text-xs text-amber-400/80">Resolved Value</span>
                        <span className="text-sm font-medium text-amber-300">{resolvedValue}</span>
                        {(() => {
                          // Find which spread contains the resolved value
                          // Use the same logic as isWinningPosition to ensure consistency
                          const findContainingSpread = () => {
                            for (const opt of options) {
                              const range = opt.label.split(" - ");
                              if (range.length !== 2) continue;
                              
                              const lowerBound = parseFloat(range[0]);
                              const upperBound = parseFloat(range[1]);
                              
                              // Special handling for 0-1 spread when resolvedValue is exactly 1
                              if (parseInt(opt.value) === 0 && resolvedValue === 1) {
                                return opt;
                              }
                              
                              // For boundary values, check if it's the highest spread
                              if (resolvedValue === upperBound) {
                                const isHighestSpread = !options.some(otherOpt => {
                                  const otherRange = otherOpt.label.split(" - ");
                                  if (otherRange.length !== 2) return false;
                                  return parseFloat(otherRange[0]) > upperBound;
                                });
                                
                                if (isHighestSpread && resolvedValue >= lowerBound) {
                                  return opt;
                                }
                              }
                              
                              // Normal case - value is within bounds but not exactly at upper boundary
                              if (resolvedValue >= lowerBound && resolvedValue < upperBound) {
                                return opt;
                              }
                            }
                            return null;
                          };
                          
                          const containingSpread = findContainingSpread();
                          
                          if (containingSpread) {
                            return (
                              <span className="text-xs text-white/70 mt-1">
                                Winning spread: <span className="text-amber-400">{containingSpread.label}</span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Countdown to bidding deadline */}
                {defaultBiddingDeadline && (
                  <div className="flex flex-col">
                    {new Date() < new Date(defaultBiddingDeadline) ? (
                      <Countdown 
                        targetDate={new Date(defaultBiddingDeadline)}
                        label="Bidding Closes In"
                        onComplete={handleBiddingDeadlineComplete}
                      />
                    ) : (
                      <div>
                        <div className="text-xs text-white/60 mb-1">Bidding Deadline</div>
                        <div className="text-sm text-amber-400 font-medium">Bidding Closed</div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Countdown to resolution time - Improved separation */}
                {resolutionTime && (
                  <div className="col-span-2 mt-3 pt-3 border-t border-gray-700/50">
                    {new Date() < new Date(resolutionTime) ? (
                      <Countdown
                        targetDate={new Date(resolutionTime)}
                        label="Resolves In"
                        onComplete={handleResolutionTimeComplete}
                      />
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-sm font-medium text-amber-400">Resolution Time Passed</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Show claim component ONLY when resolution time is passed AND user has NOT claimed rewards yet */}
          {(() => {
            // Add debug logging for claim button conditions
            console.log('Claim Button Debug:', {
              marketId,
              isResolutionPassed,
              hasAccount: !!account,
              hasClaimedWinnings: hasUserClaimedWinnings(),
              positionsCount: positions.length
            });
            
            return isResolutionPassed && account && !hasUserClaimedWinnings() && positions.length > 0 && (
              <div className="p-6 rounded-xl bg-gray-800/70 backdrop-blur-md">
                <div className="text-center p-3 rounded-xl bg-amber-700/30 text-white font-medium mb-4">
                  Resolution time has passed
                </div>
                <button
                  onClick={handleClaimReward}
                  disabled={isLoading || txLoading}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium text-white transition-all",
                    isLoading || txLoading
                      ? "bg-gray-500 cursor-not-allowed" 
                      : "bg-amber-600 hover:bg-amber-500"
                  )}
                >
                  {isLoading || txLoading ? "Processing..." : "Claim Rewards"}
                </button>
              </div>
            );
          })()}
          
          {/* Trading Interface - Only shown when resolution time hasn't passed AND market is active AND bidding is open */}
          {!isResolutionPassed && realTimeMarketStatus.status === 'Active' && !isBiddingClosed && (
            <div className="p-6 rounded-xl bg-gray-800/70 backdrop-blur-md">
              {/* Selected option display */}
              <div className="text-center p-3 rounded-xl bg-gray-700/70 text-white font-medium mb-4">
                {selectedOption || "Select a price range"}
              </div>
              
              {/* Buy/Sell Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                <button 
                  className={cn(
                    "py-3 rounded-lg font-medium transition-all",
                    isBuying 
                      ? "bg-green-600 text-white" 
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  )}
                  onClick={() => setIsBuying(true)}
                >
                  Buy
                </button>
                <button 
                  className={cn(
                    "py-3 rounded-lg font-medium transition-all", 
                    !isBuying 
                      ? "bg-red-600 text-white" 
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  )}
                  onClick={() => setIsBuying(false)}
                >
                  Sell
                </button>
              </div>
              
              {/* Amount input */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-white">You are {isBuying ? "buying" : "selling"}</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-32 p-2 rounded-xl bg-gray-700 text-white text-right border border-gray-600"
                />
              </div>
              
              {/* Receive amount */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-white">You {isBuying ? "pay" : "receive"}</span>
                <div className="flex items-center gap-1 w-32 p-2 rounded-xl bg-gray-700 text-white text-right border border-gray-600">
                  {quoteLoading ? (
                    <span className="ml-auto">Loading...</span>
                  ) : (
                    <span className="ml-auto">{receiveAmount}</span>
                  )}
                </div>
              </div>
              
              {/* Buy/Sell Button */}
              <button
                onClick={handleSubmitTrade}
                disabled={isLoading || txLoading || !account}
                className={cn(
                  "w-full py-3 rounded-xl font-medium text-white transition-all",
                  isLoading || txLoading || !account
                    ? "bg-gray-500 cursor-not-allowed" 
                    : isBuying 
                      ? "bg-green-600 hover:bg-green-500" 
                      : "bg-red-600 hover:bg-red-500"
                )}
              >
                {(isLoading || txLoading)
                  ? "Processing..." 
                  : isBuying 
                    ? "Buy" 
                    : "Sell"
                }
              </button>
            </div>
          )}
          
          {/* Current price display */}
          {currentPrice !== undefined && (
            <div className="p-6 rounded-xl bg-gray-800/70 backdrop-blur-md text-center">
              <h3 className="text-white text-lg">Current Price: <span className="font-semibold">{currentPrice.toLocaleString()} $</span></h3>
            </div>
          )}
          
          {/* Holdings Section - Only shown if positions are available */}
          {account && positions.length > 0 && (
            <div className="p-6 rounded-xl bg-gray-800/70 backdrop-blur-md">
              {/* Holdings Header */}
              <h2 className="text-xl font-medium text-white mb-1 text-center">Your Positions</h2>
              
              {/* Investment Info */}
              {positionData?.data && positionData.data.totalInvested && positionData.data.totalInvested > 0 && (
                <div className="text-xs text-center text-white/70 mb-4">
                  You invested {(positionData.data.totalInvested / 1_000_000).toFixed(2)} USDC in this market
                </div>
              )}
              
              {/* Holdings Header Row */}
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="text-white/70">Spread</div>
                <div className="text-white/70 text-center">Shares</div>
              </div>
              
              {/* Positions List */}
              <div className="space-y-3">
                {positions.map((position) => {
                  // Find the corresponding spread range from rawPosition (320-330)
                  const positionRange = `${position.spreadIndex * 10}-${position.spreadIndex * 10 + 10}`;
                  
                  // Find the option by matching with the position spreadIndex
                  let option = options.find(opt => parseInt(opt.value) === position.spreadIndex);
                  
                  // If we couldn't find an exact match, try to find by lowerBound/upperBound from metadata
                  // This handles cases where the spread index doesn't match the display range
                  if (!option) {
                    // Check if we have MARKET_SPREAD_LABELS for this market
                    const marketSpreadLabels = MARKET_SPREAD_LABELS[marketId];
                    
                    // Use our utility function to find the matching spread label
                    const matchingLabel = findMatchingSpreadLabel(position, marketSpreadLabels);
                    
                    if (matchingLabel) {
                      // Create a synthetic option using the found matching label
                      option = createSyntheticOption(position, matchingLabel);
                    }
                  }
                  
                  // Check if this is a winning position in a resolved market
                  const winning = isWinningPosition(position);
                  
                  // Calculate position value based on winning status
                  const positionValue = getPositionValue(position);
                  
                  // Show claim UI instead of position selection when market is resolved
                  if ((realTimeMarketStatus.status === 'Resolved' || marketStatusState === 1) && resolvedValue !== undefined) {
                    // Check if user has claimed already
                    const userHasClaimed = hasUserClaimedWinnings();
                    const claimedAmount = getWinningsClaimedAmount();
                    
                    return (
                      <div 
                        key={position.id} 
                        className={cn(
                          "p-3 rounded-xl transition-all",
                          winning ? "bg-amber-900/40 border border-amber-700/50" : "bg-gray-700/50"
                        )}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex-col">
                            <div className="flex items-center">
                              <div className="text-white">{option?.label || `Spread #${position.spreadIndex}`}</div>
                              {winning && (
                                <span className="ml-2 text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full">
                                  Winner
                                </span>
                              )}
                            </div>
                            {option?.metadata?.rangeDescription && (
                              <div className="text-white/60 text-xs">{option.metadata.rangeDescription}</div>
                            )}
                          </div>
                          <div className="flex-col items-end text-right">
                            <div className="text-white">{position.sharesAmount.toFixed(2)} shares</div>
                            <div className={winning ? "text-green-400" : "text-white/50"}>
                              {winning ? `≈ $${positionValue.toFixed(2)}` : "$0.00"}
                            </div>
                          </div>
                        </div>
                        
                        {/* Show claim button only for winners and only if not claimed already */}
                        {winning && !userHasClaimed && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={handleClaimReward}
                              disabled={isLoading || txLoading}
                              className={cn(
                                "px-4 py-1 rounded-lg font-medium text-sm text-white transition-all",
                                isLoading || txLoading
                                  ? "bg-gray-600 cursor-not-allowed" 
                                  : "bg-amber-600 hover:bg-amber-500"
                              )}
                            >
                              {isLoading || txLoading ? "Processing..." : "Claim Reward"}
                            </button>
                          </div>
                        )}
                        
                        {/* Show claimed status for winners if already claimed */}
                        {winning && userHasClaimed && (
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-amber-400">
                              Winnings claimed
                            </span>
                            <span className="text-sm text-green-400 font-medium">
                              ${claimedAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Regular position display for active markets
                  return (
                    <button
                      key={position.id}
                      onClick={() => handleSelectPosition(position)}
                      disabled={isBiddingClosed || isLoading || txLoading}
                      className="w-full text-left"
                    >
                      <div className={cn(
                        "p-3 rounded-xl transition-all",
                        selectedPosition?.id === position.id 
                          ? "bg-gray-700" 
                          : "bg-gray-700/50 hover:bg-gray-700/70",
                        (isBiddingClosed || isLoading || txLoading) && "opacity-75 cursor-not-allowed"
                      )}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex-col">
                            <div className="text-white">{option?.label || `Spread #${position.spreadIndex}`}</div>
                            {option?.metadata?.rangeDescription && (
                              <div className="text-white/60 text-xs">{option.metadata.rangeDescription}</div>
                            )}
                          </div>
                          <div className="flex justify-end items-center gap-2">
                            <div className="text-white text-center">{position.sharesAmount.toFixed(2)}</div>
                            <div className="text-white">≈ ${position.value.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Total Value with Profit/Loss */}
              <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-700">
                <span className="text-white font-medium">Total</span>
                <div className="flex flex-col items-end">
                  {(realTimeMarketStatus.status === 'Resolved' || marketStatusState === 1) && resolvedValue !== undefined ? (
                    <>
                      <span className="text-white font-medium">
                        ≈ ${positions.reduce((sum, pos) => sum + getPositionValue(pos), 0).toFixed(2)}
                      </span>
                      {/* Show profit/loss when market is resolved */}
                      {positionData?.data?.totalInvested && (
                        <span className={cn(
                          "text-xs",
                          positionData.data.totalInvested / 1_000_000 < positions.reduce((sum, pos) => sum + getPositionValue(pos), 0)
                            ? "text-green-400" 
                            : "text-red-400"
                        )}>
                          {positionData.data.totalInvested / 1_000_000 < positions.reduce((sum, pos) => sum + getPositionValue(pos), 0)
                            ? `+$${(positions.reduce((sum, pos) => sum + getPositionValue(pos), 0) - positionData.data.totalInvested / 1_000_000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 3})}`
                            : `-$${(positionData.data.totalInvested / 1_000_000 - positions.reduce((sum, pos) => sum + getPositionValue(pos), 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 3})}`
                        }
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-white font-medium">≈ ${totalPositionsValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 3})}</span>
                      {/* Show estimated profit/loss for active markets */}
                      {positionData?.data?.totalInvested && (
                        <span className={cn(
                          "text-xs",
                          positionData.data.totalInvested / 1_000_000 < totalPositionsValue
                            ? "text-green-400" 
                            : "text-red-400"
                        )}>
                          {positionData.data.totalInvested / 1_000_000 < totalPositionsValue
                            ? `+$${(totalPositionsValue - positionData.data.totalInvested / 1_000_000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 3})}`
                            : `-$${(positionData.data.totalInvested / 1_000_000 - totalPositionsValue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 3})}`
                          }
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionMarket;