import React from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { debugUserData, forceRefreshUserData } from '@/utilities/usernameDebug';

interface UsernameDebugProps {
  currentUser: any;
  refreshCurrentUser: () => Promise<void>;
}

export function UsernameDebug({ currentUser, refreshCurrentUser }: UsernameDebugProps) {
  const account = useCurrentAccount();
  const walletAddress = account?.address;

  const handleDebugUser = async () => {
    if (!walletAddress) return;
    await debugUserData(walletAddress);
  };

  const handleRefreshUser = async () => {
    if (!walletAddress) return;
    await forceRefreshUserData(walletAddress);
    await refreshCurrentUser();
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">Username Debug (Dev Only)</h3>
      <div className="text-sm text-yellow-700 mb-2">
        <p><strong>Current User:</strong> {JSON.stringify(currentUser)}</p>
        <p><strong>Username:</strong> {currentUser?.username || 'None'}</p>
        <p><strong>Display Name:</strong> {currentUser?.displayName || 'None'}</p>
      </div>
      <div className="space-x-2">
        <button
          onClick={handleDebugUser}
          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
        >
          Debug User Data
        </button>
        <button
          onClick={handleRefreshUser}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Force Refresh
        </button>
      </div>
    </div>
  );
}
