// Username setup component for first-time users
import React, { useState } from 'react';
import { User, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UsernameSetupProps {
  walletAddress: string;
  onUsernameSet: (username: string) => Promise<{ success: boolean; error?: string }>;
  onSkip: () => void;
  onDecline?: () => void;
  className?: string;
}

export function UsernameSetup({
  walletAddress,
  onUsernameSet,
  onSkip,
  onDecline,
  className
}: UsernameSetupProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onUsernameSet(username.trim());
      if (!result.success) {
        setError(result.error || 'Failed to set username');
      }
    } catch (err) {
      setError('Failed to set username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      onSkip();
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 bg-gray-900 border border-gray-700 rounded-lg",
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <User size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Welcome to the chat!
          </h3>
          <p className="text-sm text-gray-400">
            Choose a username to get started
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={20}
            />
            {error && (
              <p className="text-sm text-red-400 mt-1">{error}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              3-20 characters, letters, numbers, - and _ only
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isLoading || !username.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check size={16} />
                  Set Username
                </div>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSkip}
              disabled={isLoading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              title="Skip for now"
            >
              <X size={16} />
            </Button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Current wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
          <p className="text-xs text-gray-500">
            You can always chat without setting a username
          </p>
          {onDecline && (
            <button
              onClick={handleDecline}
              className="text-xs text-gray-400 hover:text-gray-300 underline"
            >
              Don't ask again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
