import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';

interface RemoveLiquidityModalProps {
  marketId: string;
  marketName: string;
  userPosition: number;
  userPositionObjectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onRemoveLiquidity: (amount: number) => Promise<void>;
}

const RemoveLiquidityModal: React.FC<RemoveLiquidityModalProps> = ({
  marketId,
  marketName,
  userPosition = 0,
  userPositionObjectId,
  isOpen,
  onClose,
  onRemoveLiquidity,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Handle withdraw button click
  const handleWithdraw = async () => {
    if (!userPosition || userPosition <= 0 || !userPositionObjectId) {
      toast.error('No liquidity to withdraw');
      return;
    }

    setIsLoading(true);

    try {
      await onRemoveLiquidity(userPosition);
      // The parent component will handle the success message and closing
    } catch (error) {
      console.error('Error withdrawing liquidity:', error);
      toast.error('Failed to withdraw liquidity. Please try again.');
      setIsLoading(false);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // Format the user position safely
  const formattedPosition = userPosition ? userPosition.toLocaleString() : '0';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="w-full max-w-md p-6 rounded-xl bg-gray-800 border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Remove Liquidity</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-white/70 text-sm mb-1">Market</p>
          <p className="text-white font-medium">{marketName}</p>
        </div>

        {/* Show the current liquidity that will be removed */}
        <div className="bg-gray-700/30 rounded-lg border border-gray-600 p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-white/70">Your Current Liquidity:</span>
            <span className="text-white font-medium">${formattedPosition}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">You will receive:</span>
            <span className="text-white font-medium text-lg">
              ~${formattedPosition} USDC
            </span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={isLoading || !userPositionObjectId || !userPosition || userPosition <= 0}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg text-white font-medium transition-colors flex items-center justify-center",
              isLoading || !userPositionObjectId || !userPosition || userPosition <= 0
                ? "bg-blue-700/50 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500"
            )}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
            ) : null}
            {isLoading ? "Processing..." : "Remove All Liquidity"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveLiquidityModal;