import React from 'react';
import { toast } from 'react-toastify';
import { getExplorerUrl } from '@/constants/appConstants';
import { ExternalLink } from 'lucide-react';

/**
 * Utility functions for displaying transaction-related toast notifications
 * with clickable explorer links
 */

interface TransactionToastProps {
  message: string;
  txHash: string;
  type?: 'success' | 'info' | 'error';
}

/**
 * Custom toast component with clickable transaction hash link
 */
const TransactionToastContent: React.FC<TransactionToastProps> = ({ message, txHash, type = 'success' }) => {
  const shortenedHash = `${txHash.substring(0, 8)}...${txHash.substring(txHash.length - 8)}`;
  
  return (
    <div className="flex flex-col gap-2">
      <div>{message}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-white/70">Tx:</span>
        <a
          href={getExplorerUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors"
          onClick={(e) => e.stopPropagation()} // Prevent toast from closing when clicking link
        >
          <span>{shortenedHash}</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

/**
 * Display a success toast with transaction hash link
 */
export const showTransactionSuccess = (message: string, txHash: string) => {
  toast.success(
    <TransactionToastContent message={message} txHash={txHash} type="success" />,
    {
      autoClose: 8000, // Show longer for transaction toasts
      position: 'top-right'
    }
  );
};

/**
 * Display an info toast with transaction hash link
 */
export const showTransactionInfo = (message: string, txHash: string) => {
  toast.info(
    <TransactionToastContent message={message} txHash={txHash} type="info" />,
    {
      autoClose: 8000,
      position: 'top-right'
    }
  );
};

/**
 * Display a transaction error with optional hash link
 */
export const showTransactionError = (message: string, txHash?: string) => {
  if (txHash) {
    toast.error(
      <TransactionToastContent message={message} txHash={txHash} type="error" />,
      {
        autoClose: 10000,
        position: 'top-right'
      }
    );
  } else {
    toast.error(message);
  }
};

/**
 * Display a simple transaction success with just the hash link
 */
export const showSimpleTransactionSuccess = (txHash: string) => {
  showTransactionSuccess('Transaction completed successfully!', txHash);
};
