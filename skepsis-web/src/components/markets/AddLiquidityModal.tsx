import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { toast } from 'react-toastify';

interface AddLiquidityModalProps {
  marketId: string;
  marketName: string;
  isOpen: boolean;
  onClose: () => void;
  onAddLiquidity: (amount: number) => void;
}

const AddLiquidityModal: React.FC<AddLiquidityModalProps> = ({
  marketId,
  marketName,
  isOpen,
  onClose,
  onAddLiquidity,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Handle amount change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers with up to 6 decimal places
    if (/^\d*\.?\d{0,6}$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  // Handle confirm button click
  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);

    try {
      // Call the parent component's onAddLiquidity function
      onAddLiquidity(parseFloat(amount));
      
      // Clear form and close modal
      setAmount('');
      onClose();
      toast.success(`Added ${amount} USDC liquidity to &quot;${marketName}&quot; market`);
    } catch (error) {
      console.error('Error adding liquidity:', error);
      toast.error('Failed to add liquidity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="w-full max-w-md p-6 rounded-xl bg-gray-800 border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Add Liquidity</h2>
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
        
        <div className="mb-6">
          <label htmlFor="amount" className="block text-white/70 text-sm mb-2">
            Amount (USDC)
          </label>
          <div className="relative">
            <input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              disabled={isLoading}
              placeholder="0.000000"
              className="w-full p-3 bg-gray-700/50 text-white rounded-lg border border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button 
              onClick={() => setAmount('100')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            This amount will be added to the market's liquidity pool
          </p>
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
            onClick={handleConfirm}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg text-white font-medium transition-colors flex items-center justify-center",
              isLoading || !amount || parseFloat(amount) <= 0
                ? "bg-blue-700/50 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500"
            )}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
            ) : null}
            {isLoading ? "Processing..." : "Add Liquidity"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLiquidityModal;