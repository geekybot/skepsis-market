import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ChatErrorProps {
  error: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ChatError({ error, onRetry, isRetrying }: ChatErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <AlertCircle className="w-12 h-12 text-red-500" />
      
      <div>
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Chat Connection Error
        </h3>
        <p className="text-red-600 dark:text-red-300 text-sm max-w-md">
          {error}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
        </button>
      )}
    </div>
  );
}