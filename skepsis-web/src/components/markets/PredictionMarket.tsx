import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMarketService, MarketPosition } from '@/hooks/useMarketService';
import { DEFAULT_MARKET_ID } from '@/constants/marketConstants';

interface PriceRangeOption {
  range: string;
  percentage: number;
}

interface PredictionMarketProps {
  marketId?: string; // Optional - defaults to DEFAULT_MARKET_ID
  question: string;
  options: PriceRangeOption[];
  resolutionCriteria: string;
  resolver: string;
  currentPrice?: number;
}

export const PredictionMarket: React.FC<PredictionMarketProps> = ({
  marketId = DEFAULT_MARKET_ID,
  question,
  options,
  resolutionCriteria,
  resolver,
  currentPrice
}) => {
  const account = useCurrentAccount();
  const { 
    buyShares, 
    sellShares, 
    fetchUserPositions, 
    getQuote, 
    isLoading, 
    positions,
    priceQuote 
  } = useMarketService();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedSpreadIndex, setSelectedSpreadIndex] = useState<number>(-1);
  const [amount, setAmount] = useState<string>('100');
  const [receiveAmount, setReceiveAmount] = useState<string>('0');
  const [isBuying, setIsBuying] = useState<boolean>(true);
  const [selectedPosition, setSelectedPosition] = useState<MarketPosition | null>(null);
  
  // Load user positions when account or marketId changes
  useEffect(() => {
    if (account && marketId) {
      fetchUserPositions(marketId);
    }
  }, [account, marketId]);

  // Update quote when trading parameters change
  useEffect(() => {
    const updateQuote = async () => {
      const parsedAmount = parseFloat(amount || '0');
      if (parsedAmount <= 0 || selectedSpreadIndex < 0) return;

      if (isBuying) {
        // Get buy quote
        const quote = await getQuote(marketId, selectedSpreadIndex, parsedAmount);
        if (quote) {
          setReceiveAmount(quote.total.toFixed(2));
        }
      } else if (selectedPosition) {
        // For selling, we'd need a price quote from the position
        // This is simplified for now since quote function is complex
        const estimatedValue = (parseFloat(amount) * 0.21).toFixed(2); // Just a simplified calculation
        setReceiveAmount(estimatedValue);
      }
    };

    updateQuote();
  }, [amount, selectedSpreadIndex, isBuying, selectedPosition, marketId]);

  const handleOptionSelect = (range: string, index: number) => {
    setSelectedOption(range);
    setSelectedSpreadIndex(index);
    setIsBuying(true); // Switch to buy mode when selecting an option
    setSelectedPosition(null); // Clear any selected position
  };

  const handleSubmitTrade = async () => {
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
      if (isBuying) {
        // Execute buy transaction
        await buyShares(
          marketId,
          selectedSpreadIndex,
          parsedAmount,
          parseFloat(receiveAmount) * 1.05 // Add 5% slippage buffer
        );
      } else if (selectedPosition) {
        // Execute sell transaction
        await sellShares(
          selectedPosition.id,
          parsedAmount,
          parseFloat(receiveAmount) * 0.95, // 5% slippage tolerance
          marketId
        );
      }
    } catch (error: any) {
      toast.error(`Transaction failed: ${error.message}`);
    }
  };

  const handleSelectPosition = (position: MarketPosition) => {
    setSelectedPosition(position);
    setSelectedSpreadIndex(-1);  // Clear the spread selection
    setSelectedOption(options[position.spreadIndex]?.range || null);
    setIsBuying(false); // Switch to sell mode
    setAmount(position.sharesAmount.toString()); // Pre-fill with available shares
  };

  // Calculate total value of all positions
  const totalPositionsValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Left panel - Market Overview */}
      <div className="flex flex-col flex-grow gap-4 p-6 rounded-xl bg-white/10 backdrop-blur-md w-full lg:w-3/5 shadow-lg shadow-black/20">
        <h2 className="text-xl font-medium text-white">{question}</h2>
        
        <div className="flex flex-col gap-3 my-4">
          {options.map((option, index) => (
            <button
              key={option.range}
              onClick={() => handleOptionSelect(option.range, index)}
              className={cn(
                "flex justify-between items-center p-3 rounded-xl transition-all shadow-md",
                selectedOption === option.range
                  ? "bg-main-700 text-white shadow-main-700/30"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              <span>{option.range}$</span>
              <span>{option.percentage}%</span>
            </button>
          ))}
        </div>
        
        <div className="mt-6 p-4 rounded-xl bg-white/10 text-white shadow-md">
          <h3 className="font-medium">Q: {question}</h3>
          <p className="mt-2 text-sm">Resolution Criteria: {resolutionCriteria}</p>
          <p className="text-sm mt-2">Resolver: {resolver}</p>
        </div>
      </div>
      
      {/* Right panel - Trading Interface + Holdings */}
      <div className="flex flex-col w-full lg:w-2/5 gap-4">
        {/* Trading Interface */}
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md shadow-lg shadow-black/20">
          {/* Selected option display */}
          <div className="text-center p-3 rounded-xl bg-white/20 text-white font-medium mb-4 shadow-inner shadow-black/10 border border-white/10">
            {selectedOption || "Select a price range"}
          </div>
          
          {/* Buy/Sell Tabs */}
          <div className="grid grid-cols-2 gap-1 mb-6 p-1 rounded-xl bg-white/10 shadow-inner shadow-black/10">
            <button 
              className={cn(
                "py-3 rounded-lg font-medium transition-all shadow-sm", 
                isBuying 
                  ? "bg-green-600 text-white shadow-green-500/30" 
                  : "bg-transparent text-white hover:bg-white/5"
              )}
              onClick={() => setIsBuying(true)}
              disabled={selectedPosition !== null}
            >
              Buy
            </button>
            <button 
              className={cn(
                "py-3 rounded-lg font-medium transition-all shadow-sm", 
                !isBuying 
                  ? "bg-red-600 text-white shadow-red-500/30" 
                  : "bg-transparent text-white hover:bg-white/5"
              )}
              onClick={() => setIsBuying(false)}
              disabled={!selectedPosition && positions.length === 0}
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
              className="w-32 p-2 rounded-xl bg-white/20 text-white text-right shadow-inner shadow-black/10 border border-white/10"
            />
          </div>
          
          {/* Receive amount */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-white">You {isBuying ? "pay" : "receive"}</span>
            <div className="flex items-center gap-1 w-32 p-2 rounded-xl bg-white/20 text-white text-right shadow-inner shadow-black/10 border border-white/10">
              <span className="flex-grow text-right">{receiveAmount}</span>
              <span className="ml-1">$</span>
            </div>
          </div>
          
          {/* Action button */}
          <button
            onClick={handleSubmitTrade}
            disabled={isLoading || !selectedOption}
            className={cn(
              "w-full py-3 rounded-xl font-medium text-white transition-all shadow-md",
              isLoading 
                ? "bg-gray-500 cursor-not-allowed" 
                : isBuying 
                  ? "bg-green-600 hover:bg-green-500 shadow-green-500/30" 
                  : "bg-red-600 hover:bg-red-500 shadow-red-500/30"
            )}
          >
            {isLoading ? "Processing..." : isBuying ? "Buy" : "Sell"}
          </button>
        </div>
        
        {/* Current price display */}
        {currentPrice && (
          <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md text-center shadow-lg shadow-black/20">
            <h3 className="text-white text-lg">Current BTC Price: <span className="font-semibold">{currentPrice.toLocaleString()} $</span></h3>
          </div>
        )}
        
        {/* Holdings Section - Directly integrated into the trading panel */}
        {account && positions.length > 0 && (
          <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md shadow-lg shadow-black/20">
            {/* Holdings Header */}
            <h2 className="text-xl font-medium text-white mb-4 text-center">Your Positions</h2>
            
            {/* Holdings Header Row */}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="text-white/70">Spread</div>
              <div className="text-white/70 text-center">Shares</div>
            </div>
            
            {/* Positions List */}
            <div className="space-y-3">
              {positions.map((position) => (
                <button
                  key={position.id}
                  onClick={() => handleSelectPosition(position)}
                  className="w-full text-left"
                >
                  <div className={cn(
                    "p-3 rounded-xl transition-all",
                    selectedPosition?.id === position.id 
                      ? "bg-white/20" 
                      : "bg-white/10 hover:bg-white/15"
                  )}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex-col">
                        <div className="text-white">{options[position.spreadIndex]?.range || `Spread #${position.spreadIndex}`}</div>
                        <div className="text-white/70 text-xs">Position ID: {position.id.substring(0, 8)}...</div>
                      </div>
                      <div className="flex justify-end items-center gap-2">
                        <div className="text-white text-center">{position.sharesAmount.toFixed(2)}</div>
                        <div className="text-white">≈ ${position.value.toFixed(3)}</div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Total Value */}
            <div className="mt-4 flex justify-between items-center pt-3 border-t border-white/10">
              <span className="text-white font-medium">Total</span>
              <span className="text-white font-medium">≈ ${totalPositionsValue.toFixed(3)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionMarket;