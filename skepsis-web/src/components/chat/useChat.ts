// Custom hook for managing chat functionality
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from './ChatService';
import { ChatMessage, ChatUser, TypingIndicator } from './types';
import { useCurrentAccount } from '@mysten/dapp-kit';

export interface UseChatOptions {
  marketId: string;
  messageLimit?: number;
  enableTypingIndicators?: boolean;
  enableUserList?: boolean;
}

export interface UseChatReturn {
  // Messages
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Users
  onlineUsers: ChatUser[];
  typingUsers: TypingIndicator[];
  
  // Actions
  sendMessage: (message: string, replyTo?: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  
  // Typing
  setTyping: (isTyping: boolean) => void;
  
  // User management
  claimUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
  releaseUsername: () => Promise<void>;
  currentUser: ChatUser | null;
  refreshCurrentUser: () => Promise<void>;
  
  // Connection status
  isConnected: boolean;
  isReadOnly: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useChat({
  marketId,
  messageLimit = 50,
  enableTypingIndicators = true,
  enableUserList = true
}: UseChatOptions): UseChatReturn {
  const account = useCurrentAccount();
  const walletAddress = account?.address;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [cleanupRun, setCleanupRun] = useState(false);

  // Refs for cleanup
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const initializingRef = useRef(false);
  const connectingRef = useRef(false);

  // Initialize chat connection (read-only or full)
  const connect = useCallback(async () => {
    if (!marketId) {
      console.log('Cannot connect: missing marketId');
      return;
    }
    
    // Prevent multiple concurrent initialization attempts
    if (initializingRef.current) {
      console.log('Chat initialization already in progress, skipping');
      return;
    }
    
    // For read-only mode, we don't need to prevent retries
    const isReadOnlyMode = !walletAddress;
    
    if (!isReadOnlyMode && retryCount >= maxRetries) {
      console.warn('Max retries reached, not attempting to connect');
      setError('Unable to connect to chat after multiple attempts');
      return;
    }

    console.log(`Attempting to connect to chat (${isReadOnlyMode ? 'read-only' : 'full'} mode, attempt ${retryCount + 1}/${maxRetries})`);

    try {
      initializingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Clean up corrupted users only once per session (only for authenticated users)
      if (!cleanupRun && !isReadOnlyMode) {
        console.log('Running one-time cleanup of corrupted user documents...');
        await ChatService.cleanupOfflineUsers();
        setCleanupRun(true);
      }

      // For authenticated users, initialize user profile
      if (!isReadOnlyMode) {
        // Get existing user data first (including username if it exists)
        const existingUser = await ChatService.getUser(walletAddress);
        console.log('Existing user data:', existingUser);
        
        // Initialize user properly, preserving existing username
        console.log('Initializing user:', walletAddress);
        await ChatService.createOrUpdateUser({
          walletAddress,
          displayName: existingUser?.username || existingUser?.displayName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          // Only pass username if it exists - don't pass undefined
          ...(existingUser?.username && { username: existingUser.username }),
          isOnline: true
        });
        
        // Set up current user with existing data or defaults
        const displayName = existingUser?.username || existingUser?.displayName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        const user: ChatUser = {
          id: walletAddress,
          walletAddress,
          displayName,
          username: existingUser?.username,
          isOnline: true,
          lastSeen: Date.now()
        };
        console.log('Setting current user:', user);
        setCurrentUser(user);

        // Subscribe to current user's document for username updates
        const unsubscribeCurrentUser = ChatService.subscribeToUser(
          walletAddress,
          (updatedUser) => {
            console.log('User subscription update:', updatedUser);
            if (updatedUser) {
              setCurrentUser(prev => {
                if (!prev) return null;
                const newUser = {
                  ...prev,
                  username: updatedUser.username,
                  displayName: updatedUser.username || updatedUser.displayName || prev.displayName
                };
                console.log('Updating current user from subscription:', newUser);
                return newUser;
              });
            }
          },
          (error) => {
            console.error('Current user subscription error:', error);
          }
        );
        unsubscribersRef.current.push(unsubscribeCurrentUser);
      } else {
        // For read-only mode, set current user to null
        setCurrentUser(null);
        console.log('Read-only mode: currentUser set to null');
      }

      // Subscribe to messages
      const unsubscribeMessages = ChatService.subscribeToMessages(
        marketId,
        (newMessages) => {
          setMessages(newMessages);
          setError(null);
        },
        (error) => {
          console.error('Messages subscription error:', error);
          setError(error.message);
        },
        messageLimit
      );
      unsubscribersRef.current.push(unsubscribeMessages);

      // Subscribe to typing indicators if enabled (only for authenticated users)
      if (enableTypingIndicators && !isReadOnlyMode) {
        const unsubscribeTyping = ChatService.subscribeToTypingIndicators(
          marketId,
          (typingUsers) => {
            // Filter out current user from typing indicators
            setTypingUsers(typingUsers.filter(user => user.walletAddress !== walletAddress));
          },
          (error) => {
            console.error('Typing indicators subscription error:', error);
          }
        );
        unsubscribersRef.current.push(unsubscribeTyping);
      }

      // Subscribe to online users if enabled (only for authenticated users)
      if (enableUserList && !isReadOnlyMode) {
        const unsubscribeUsers = ChatService.subscribeToOnlineUsers(
          marketId,
          setOnlineUsers,
          (error) => {
            console.error('Online users subscription error:', error);
          }
        );
        unsubscribersRef.current.push(unsubscribeUsers);
      }

      // Update user presence (only for authenticated users)
      if (!isReadOnlyMode) {
        console.log('Updating user presence...');
        await ChatService.updateUserPresence(walletAddress, true);
      }

      setIsConnected(true);
      setRetryCount(0); // Reset retry count on successful connection
      console.log(`Chat connected successfully in ${isReadOnlyMode ? 'read-only' : 'full'} mode!`);
    } catch (err) {
      console.error('Failed to connect to chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to chat');
      
      // Only retry for authenticated users
      if (!isReadOnlyMode) {
        // Increment retry count for next attempt
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        if (newRetryCount < maxRetries) {
          const retryDelay = Math.pow(2, newRetryCount) * 1000; // Exponential backoff
          console.log(`Will retry connection in ${retryDelay}ms (attempt ${newRetryCount}/${maxRetries})`);
          
          // Set a timeout to reset the connecting state, which will trigger useEffect to retry
          retryTimeoutRef.current = setTimeout(() => {
            connectingRef.current = false; // Allow useEffect to trigger again
          }, retryDelay);
        } else {
          console.error('Max retry attempts reached');
        }
      }
    } finally {
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, [marketId, walletAddress, messageLimit, enableTypingIndicators, enableUserList, retryCount, maxRetries, cleanupRun]);

  // Disconnect from chat
  const disconnect = useCallback(async () => {
    // Clear all subscriptions
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribersRef.current = [];

    // Clear timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Update user presence if connected
    if (walletAddress && isConnected) {
      try {
        await ChatService.updateUserPresence(walletAddress, false);
      } catch (error) {
        console.warn('Failed to update presence on disconnect:', error);
      }
    }

    // Reset state
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    setCurrentUser(null);
    setIsConnected(false);
    setError(null);
    setRetryCount(0);
    initializingRef.current = false;
    // Don't reset cleanupRun here - we want to keep it for the session
  }, [walletAddress, isConnected]);

  // Auto-connect when marketId is available (wallet connection optional for read-only)
  useEffect(() => {
    // Prevent multiple connection attempts
    if (connectingRef.current) return;
    
    // Don't auto-connect if we've reached max retries and we have a wallet (read-only mode doesn't retry)
    if (walletAddress && retryCount >= maxRetries) return;
    
    if (marketId && !isConnected && !isLoading) {
      connectingRef.current = true;
      connect().finally(() => {
        connectingRef.current = false;
      });
    }
  }, [walletAddress, marketId, isConnected, isLoading, retryCount, maxRetries, connect]);

  // Separate cleanup effect for component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Send message
  const sendMessage = useCallback(async (message: string, replyTo?: string) => {
    if (!walletAddress || !isConnected || !message.trim()) return;

    console.log('Sending message with username:', currentUser?.username);
    console.log('Current user state:', currentUser);

    try {
      await ChatService.sendMessage({
        content: message,
        senderAddress: walletAddress,
        roomId: marketId,
        messageType: 'text',
        replyTo,
        username: currentUser?.username // Pass the current user's username
      });
      // Don't clear error here - only clear it on successful connection
    } catch (err) {
      console.error('Failed to send message:', err);
      // Don't set connection error for message send failures
      // setError('Failed to send message');
      throw err;
    }
  }, [walletAddress, marketId, isConnected, currentUser?.username]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!walletAddress || !isConnected) return;

    try {
      await ChatService.deleteMessage(messageId);
      setError(null);
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message');
      throw err;
    }
  }, [walletAddress, isConnected]);

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!walletAddress || !isConnected) return;

    try {
      await ChatService.addReaction(messageId, emoji, walletAddress);
      setError(null);
    } catch (err) {
      console.error('Failed to add reaction:', err);
      setError('Failed to add reaction');
      throw err;
    }
  }, [walletAddress, isConnected]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!walletAddress || !isConnected) return;

    try {
      await ChatService.removeReaction(messageId, emoji, walletAddress);
      setError(null);
    } catch (err) {
      console.error('Failed to remove reaction:', err);
      setError('Failed to remove reaction');
      throw err;
    }
  }, [walletAddress, isConnected]);

  // Set typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!walletAddress || !isConnected || !enableTypingIndicators) return;

    try {
      await ChatService.setTypingIndicator(marketId, walletAddress, isTyping);
      
      // Auto-clear typing status after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          ChatService.setTypingIndicator(marketId, walletAddress, false);
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to update typing status:', err);
    }
  }, [walletAddress, marketId, isConnected, enableTypingIndicators]);

  // Username management
  const claimUsername = useCallback(async (username: string) => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const result = await ChatService.claimUsername(walletAddress, username);
      if (result && currentUser) {
        setCurrentUser({
          ...currentUser,
          username,
          displayName: username
        });
        return { success: true };
      }
      return { success: false, error: 'Username already taken' };
    } catch (err) {
      console.error('Failed to claim username:', err);
      return { success: false, error: 'Failed to claim username' };
    }
  }, [walletAddress, currentUser]);

  const releaseUsername = useCallback(async () => {
    if (!walletAddress || !currentUser || !currentUser.username) return;

    try {
      await ChatService.releaseUsername(walletAddress, currentUser.username);
      setCurrentUser({
        ...currentUser,
        username: undefined,
        displayName: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      });
    } catch (err) {
      console.error('Failed to release username:', err);
      throw err;
    }
  }, [walletAddress, currentUser]);

  // Refresh current user data
  const refreshCurrentUser = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      const updatedUser = await ChatService.getUser(walletAddress);
      console.log('Refreshed user data:', updatedUser);
      
      if (updatedUser) {
        setCurrentUser(prev => {
          if (!prev) return null;
          const newUser = {
            ...prev,
            username: updatedUser.username,
            displayName: updatedUser.username || updatedUser.displayName || prev.displayName
          };
          console.log('Updated current user after refresh:', newUser);
          return newUser;
        });
      }
    } catch (error) {
      console.error('Error refreshing current user:', error);
    }
  }, [walletAddress]);

  return {
    // Messages
    messages,
    isLoading,
    error,
    
    // Users
    onlineUsers,
    typingUsers,
    
    // Actions
    sendMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    
    // Typing
    setTyping,
    
    // User management
    claimUsername,
    releaseUsername,
    currentUser,
    
    // Connection status
    isConnected,
    isReadOnly: !walletAddress,
    connect,
    disconnect,
    
    // Refresh
    refreshCurrentUser
  };
}
