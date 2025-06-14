// Main chat window component that combines all chat functionality
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MessageSquare, Users, Settings, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from './useChat';
import { MessageList } from './MessageList';
import { MessageInput, MessageInputRef } from './MessageInput';
import { UserList } from './UserList';
import { UsernameSetup } from './UsernameSetup';
import { ChatMessage } from './types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatWindowProps {
  marketId: string;
  marketName?: string;
  className?: string;
  defaultMinimized?: boolean;
  showUserList?: boolean;
  position?: 'fixed' | 'relative';
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export function ChatWindow({
  marketId,
  marketName = 'Market',
  className,
  defaultMinimized = false,
  showUserList = true,
  position = 'relative',
  onClose,
  onMinimize,
  onMaximize
}: ChatWindowProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [forceScrollToBottom, setForceScrollToBottom] = useState<number>(0);
  const messageInputRef = useRef<MessageInputRef>(null);

  // Use the chat hook
  const {
    messages,
    onlineUsers,
    typingUsers,
    currentUser,
    isLoading,
    error,
    isConnected,
    isReadOnly,
    sendMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    setTyping,
    claimUsername,
    releaseUsername,
    connect,
    disconnect
  } = useChat({
    marketId,
    enableTypingIndicators: true,
    enableUserList: showUserList
  });

  // Check if user needs to set up username (only for authenticated users)
  useEffect(() => {
    if (currentUser && !currentUser.username && !showUsernameSetup && !isReadOnly) {
      // Show username setup for users without a username
      // Check if they've permanently declined (different from just skipping)
      const hasDeclinedUsername = localStorage.getItem(`username-declined-${currentUser.walletAddress}`);
      if (!hasDeclinedUsername) {
        setShowUsernameSetup(true);
      }
    }
  }, [currentUser, showUsernameSetup, isReadOnly]);

  // Handle send message
  const handleSendMessage = useCallback(async (message: string, replyToId?: string) => {
    try {
      await sendMessage(message, replyToId);
      setReplyingTo(null);
      // Force scroll to bottom after sending message
      setActiveTab('chat'); // Ensure we're on chat tab
      setForceScrollToBottom(Date.now()); // Trigger scroll
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [sendMessage]);

  // Handle reply
  const handleReply = useCallback((message: ChatMessage) => {
    setReplyingTo(message);
    setActiveTab('chat'); // Switch to chat tab when replying
    
    // Focus the message input after a short delay to ensure tab switch is complete
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 100);
  }, []);

  // Handle cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Handle username setup
  const handleUsernameSet = useCallback(async (username: string) => {
    const result = await claimUsername(username);
    if (result.success) {
      setShowUsernameSetup(false);
    }
    return result;
  }, [claimUsername]);

  const handleSkipUsername = useCallback(() => {
    setShowUsernameSetup(false);
    // Don't mark as permanently declined - just hide for this session
    // Users can still be prompted again in future sessions if they don't have a username
  }, []);

  const handleDeclineUsername = useCallback(() => {
    setShowUsernameSetup(false);
    if (currentUser) {
      // Mark as permanently declined
      localStorage.setItem(`username-declined-${currentUser.walletAddress}`, 'true');
    }
  }, [currentUser]);

  // Handle minimize/maximize
  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize?.();
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    onMaximize?.();
  };

  // Connection status indicator
  const ConnectionStatus = () => {
    if (isReadOnly) {
      return (
        <div className="flex items-center gap-1 text-blue-400">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-xs">Read-only</span>
        </div>
      );
    } else if (isConnected) {
      return (
        <div className="flex items-center gap-1 text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs">Connected</span>
        </div>
      );
    } else if (isLoading) {
      return (
        <div className="flex items-center gap-1 text-yellow-400">
          <div className="w-2 h-2 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Connecting...</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-xs">Disconnected</span>
        </div>
      );
    }
  };

  if (isMinimized) {
    return (
      <div className={cn(
        "border border-gray-600 rounded-lg bg-gray-800/90 backdrop-blur-md shadow-lg",
        position === 'fixed' && "fixed bottom-4 right-4 z-50",
        className
      )}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-white">
              {marketName} Chat
            </span>
            {messages.length > 0 && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaximize}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <Maximize2 size={12} />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <X size={12} />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col border border-gray-600 rounded-lg bg-gray-900/95 backdrop-blur-md shadow-xl",
      position === 'fixed' && "fixed bottom-4 right-4 z-50 w-96 h-96",
      position === 'relative' && "w-full h-full",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50 bg-gray-800/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-blue-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {marketName} Chat
              </span>
              {isReadOnly && (
                <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                  Read-only
                </span>
              )}
            </div>
            <ConnectionStatus />
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <Minimize2 size={12} />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <X size={12} />
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700/50 flex-shrink-0">
          <div className="text-sm text-red-600 dark:text-red-300 mb-1">
            {error}
          </div>
          <button 
            onClick={connect}
            disabled={isLoading}
            className="text-xs text-red-500 hover:text-red-400 underline disabled:opacity-50"
          >
            {isLoading ? 'Retrying...' : 'Try reconnecting'}
          </button>
        </div>
      )}

      {/* Username Setup */}
      {showUsernameSetup && currentUser && (
        <div className="border-b border-gray-700/50 flex-shrink-0">
          <UsernameSetup
            walletAddress={currentUser.walletAddress}
            onUsernameSet={handleUsernameSet}
            onSkip={handleSkipUsername}
            onDecline={handleDeclineUsername}
            className="border-none"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {showUserList ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'users')} className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b border-gray-700/50 bg-transparent flex-shrink-0">
              <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-gray-700/50">
                Chat
                {messages.length > 0 && (
                  <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                    {messages.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-gray-700/50">
                Users
                {isReadOnly ? (
                  <span className="ml-2 text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-full">
                    --
                  </span>
                ) : (
                  <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full">
                    {onlineUsers.filter(u => u.isOnline).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 m-0 flex flex-col min-h-0">
              <MessageList
                messages={messages}
                currentUserAddress={currentUser?.walletAddress}
                typingUsers={typingUsers}
                isLoading={isLoading}
                readOnly={isReadOnly}
                onReply={handleReply}
                onDelete={deleteMessage}
                onReaction={addReaction}
                onRemoveReaction={removeReaction}
                forceScrollToBottom={forceScrollToBottom}
                className="flex-1 min-h-0"
              />
              
              <div className="flex-shrink-0">
                <MessageInput
                  ref={messageInputRef}
                  onSendMessage={handleSendMessage}
                  onTyping={setTyping}
                  disabled={!isConnected}
                  readOnly={isReadOnly}
                  replyingTo={replyingTo ? {
                    id: replyingTo.id,
                    username: replyingTo.username,
                    message: replyingTo.content
                  } : null}
                  onCancelReply={handleCancelReply}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="flex-1 m-0 min-h-0">
              {isReadOnly ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <div className="text-lg mb-2">👥</div>
                    <div className="text-sm mb-1">User list unavailable</div>
                    <div className="text-xs">Connect your wallet to see who's online</div>
                  </div>
                </div>
              ) : (
                <UserList
                  users={onlineUsers}
                  currentUserAddress={currentUser?.walletAddress}
                  showOnlineOnly={false}
                  className="h-full"
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-full flex flex-col min-h-0">
            <MessageList
              messages={messages}
              currentUserAddress={currentUser?.walletAddress}
              typingUsers={typingUsers}
              isLoading={isLoading}
              readOnly={isReadOnly}
              onReply={handleReply}
              onDelete={deleteMessage}
              onReaction={addReaction}
              onRemoveReaction={removeReaction}
              forceScrollToBottom={forceScrollToBottom}
              className="flex-1 min-h-0"
            />
            
            <div className="flex-shrink-0">
              <MessageInput
                ref={messageInputRef}
                onSendMessage={handleSendMessage}
                onTyping={setTyping}
                disabled={!isConnected}
                readOnly={isReadOnly}
                replyingTo={replyingTo ? {
                  id: replyingTo.id,
                  username: replyingTo.username,
                  message: replyingTo.content
                } : null}
                onCancelReply={handleCancelReply}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
