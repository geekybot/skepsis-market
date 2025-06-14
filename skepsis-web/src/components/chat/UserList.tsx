// User list component showing online users
import React, { useMemo } from 'react';
import { Users, Crown, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatUser } from './types';

interface UserListProps {
  users: ChatUser[];
  currentUserAddress?: string;
  className?: string;
  showOnlineOnly?: boolean;
  maxUsers?: number;
}

export function UserList({
  users,
  currentUserAddress,
  className,
  showOnlineOnly = false,
  maxUsers = 50
}: UserListProps) {
  // Filter and sort users
  const sortedUsers = useMemo(() => {
    let filteredUsers = showOnlineOnly ? users.filter(user => user.isOnline) : users;
    
    // Sort by: current user first, then online status, then by display name
    filteredUsers.sort((a, b) => {
      // Current user first
      if (a.walletAddress === currentUserAddress) return -1;
      if (b.walletAddress === currentUserAddress) return 1;
      
      // Online users first
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      
      // Then by display name
      return a.displayName.localeCompare(b.displayName);
    });

    return filteredUsers.slice(0, maxUsers);
  }, [users, currentUserAddress, showOnlineOnly, maxUsers]);

  const onlineCount = users.filter(user => user.isOnline).length;
  const totalCount = users.length;

  // Get profile color for user
  const getProfileColor = (walletAddress: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    const hash = walletAddress.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Format last seen time
  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-800/60 backdrop-blur-md", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-400" />
          <span className="font-medium text-white">Users</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>{onlineCount}</span>
          </div>
          <span>/</span>
          <span>{totalCount}</span>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
        {sortedUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No users found
          </div>
        ) : (
          <div className="p-2">
            {sortedUsers.map((user) => {
              const isCurrentUser = user.walletAddress === currentUserAddress;
              const profileColor = getProfileColor(user.walletAddress);
              
              return (
                <div
                  key={user.walletAddress}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors",
                    isCurrentUser && "bg-blue-900/20 border border-blue-500/30"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                      profileColor
                    )}>
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Online status indicator */}
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800",
                      user.isOnline ? "bg-green-500" : "bg-gray-500"
                    )} />
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium truncate",
                        isCurrentUser ? "text-blue-300" : "text-white"
                      )}>
                        {user.displayName}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs text-blue-400 bg-blue-500/20 px-1 rounded">
                          you
                        </span>
                      )}
                    </div>
                    
                    {/* Username or wallet address */}
                    {user.username && user.username !== user.displayName && (
                      <div className="text-xs text-gray-400 truncate">
                        @{user.username}
                      </div>
                    )}
                    
                    {/* Last seen */}
                    {!user.isOnline && (
                      <div className="text-xs text-gray-500">
                        {formatLastSeen(user.lastSeen)}
                      </div>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {user.isOnline ? (
                      <Wifi size={14} className="text-green-500" />
                    ) : (
                      <WifiOff size={14} className="text-gray-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-gray-700/50">
        <div className="text-xs text-gray-500 text-center">
          {showOnlineOnly ? (
            `${onlineCount} online users`
          ) : (
            `${onlineCount} of ${totalCount} users online`
          )}
        </div>
      </div>
    </div>
  );
}
