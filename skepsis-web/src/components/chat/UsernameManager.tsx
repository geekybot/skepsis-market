// Username management component for setting and changing usernames
import React, { useState, useCallback } from 'react';
import { User, Check, X, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UsernameManagerProps {
  currentUsername?: string;
  walletAddress: string;
  onClaimUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
  onReleaseUsername: () => Promise<void>;
  className?: string;
}

export function UsernameManager({
  currentUsername,
  walletAddress,
  onClaimUsername,
  onReleaseUsername,
  className
}: UsernameManagerProps) {
  const [isEditing, setIsEditing] = useState(!currentUsername);
  const [newUsername, setNewUsername] = useState(currentUsername || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaimUsername = useCallback(async () => {
    const trimmedUsername = newUsername.trim();
    
    // Validate username
    if (!trimmedUsername) {
      setError('Username cannot be empty');
      return;
    }
    
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (trimmedUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await onClaimUsername(trimmedUsername);
      
      if (result.success) {
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to claim username');
      }
    } catch (err) {
      setError('Failed to claim username');
    } finally {
      setIsLoading(false);
    }
  }, [newUsername, onClaimUsername]);

  const handleReleaseUsername = useCallback(async () => {
    try {
      setIsLoading(true);
      await onReleaseUsername();
      setNewUsername('');
      setIsEditing(true);
    } catch (err) {
      setError('Failed to release username');
    } finally {
      setIsLoading(false);
    }
  }, [onReleaseUsername]);

  const handleCancel = () => {
    setNewUsername(currentUsername || '');
    setIsEditing(false);
    setError(null);
  };

  const displayAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div className={cn("p-4 border border-gray-600 rounded-lg bg-gray-800/60 backdrop-blur-md", className)}>
      <div className="flex items-center gap-2 mb-3">
        <User size={18} className="text-blue-400" />
        <span className="font-medium text-white">Username</span>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleClaimUsername()}
              placeholder="Enter username..."
              maxLength={20}
              disabled={isLoading}
              className={cn(
                "w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400",
                "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <div className="flex justify-between mt-1">
              <div className="text-xs text-gray-400">
                Letters, numbers, and underscores only
              </div>
              <div className="text-xs text-gray-400">
                {newUsername.length}/20
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleClaimUsername}
              disabled={isLoading || !newUsername.trim()}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-500"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {isLoading ? 'Claiming...' : 'Claim'}
            </Button>
            
            {currentUsername && (
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-white font-medium">
                @{currentUsername}
              </div>
              <div className="text-xs text-gray-400">
                {displayAddress}
              </div>
            </div>
            
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Edit size={14} />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleReleaseUsername}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/50 hover:bg-red-500/10"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              ) : (
                'Release Username'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
