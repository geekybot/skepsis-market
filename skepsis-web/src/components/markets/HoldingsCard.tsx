import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface Position {
  id: string;
  spreadIndex: number;
  sharesAmount: number;
  value: number;
}

interface HoldingsCardProps {
  marketId: string;
  spreadRanges?: string[]; // Array of spread ranges to display (e.g. "95,000-100,000")
  onSelectPosition?: (position: Position) => void;
  selectedPositionId?: string;
}

export const HoldingsCard: React.FC<HoldingsCardProps> = ({
  marketId,
  spreadRanges = [],
  onSelectPosition,
  selectedPositionId,
}) => {
  const account = useCurrentAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch positions when component mounts or marketId changes
  useEffect(() => {
    const fetchUserPositions = async () => {
      if (!account) return;
      
      setIsLoading(true);
      try {
        // In a real implementation, you would fetch positions from the blockchain
        // For now, we'll use an empty array to simulate no positions
        setPositions([]);
        
        // Simulate fetching delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Error fetching positions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (account && marketId) {
      fetchUserPositions();
    }
  }, [account, marketId]);

  // Calculate total value of all positions
  const totalValue = positions.reduce((sum, position) => sum + position.value, 0);

  // Handle position selection
  const handleSelectPosition = (position: Position) => {
    if (onSelectPosition) {
      onSelectPosition(position);
    }
  };

  // If user has no positions, show empty state
  if (!account) {
    return (
      <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md shadow-lg shadow-black/20 text-center">
        <h2 className="text-xl font-medium text-white mb-4">Your Positions</h2>
        <p className="text-white/70">Connect your wallet to view your positions</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md shadow-lg shadow-black/20 text-center">
        <h2 className="text-xl font-medium text-white mb-4">Your Positions</h2>
        {isLoading ? (
          <p className="text-white/70">Loading positions...</p>
        ) : (
          <p className="text-white/70">You don&apos;t have any positions in this market yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md shadow-lg shadow-black/20">
      {/* Holdings Header */}
      <h2 className="text-xl font-medium text-white mb-4 text-center">Your Positions</h2>
      
      {/* Holdings Header Row */}
      <div className="grid grid-cols-12 gap-4 mb-2 px-3">
        <div className="col-span-5 text-white/70">Spread</div>
        <div className="col-span-3 text-white/70 text-center">Shares</div>
        <div className="col-span-4 text-white/70 text-right">Value</div>
      </div>
      
      {/* Positions List */}
      <div className="space-y-3">
        {positions.map((position) => {
          // Get spread range string based on the index
          const spreadRange = spreadRanges[position.spreadIndex] || `Spread #${position.spreadIndex}`;
          
          return (
            <button
              key={position.id}
              onClick={() => handleSelectPosition(position)}
              className="w-full text-left"
              disabled={!onSelectPosition}
            >
              <div className={cn(
                "p-3 rounded-xl transition-all",
                selectedPositionId === position.id 
                  ? "bg-white/20" 
                  : "bg-white/10 hover:bg-white/15"
              )}>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <div className="text-white">{spreadRange}</div>
                    <div className="text-white/70 text-xs">ID: {position.id.substring(0, 8)}...</div>
                  </div>
                  <div className="col-span-3 text-white text-center">
                    {position.sharesAmount.toFixed(2)}
                  </div>
                  <div className="col-span-4 text-white text-right">
                    ${position.value.toFixed(3)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Total Value */}
      <div className="mt-4 flex justify-between items-center pt-3 border-t border-white/10">
        <span className="text-white font-medium">Total</span>
        <span className="text-white font-medium">${totalValue.toFixed(3)}</span>
      </div>
    </div>
  );
};

export default HoldingsCard;