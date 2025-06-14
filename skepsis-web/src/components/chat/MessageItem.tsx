// Individual message component with reactions and reply functionality
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MoreVertical, Reply, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from './types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageItemProps {
  message: ChatMessage;
  currentUserAddress?: string;
  readOnly?: boolean;
  onReply?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => Promise<void>;
  onReaction?: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>;
  className?: string;
}

export function MessageItem({
  message,
  currentUserAddress,
  readOnly = false,
  onReply,
  onDelete,
  onReaction,
  onRemoveReaction,
  className
}: MessageItemProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reactionPickerRef = useRef<HTMLDivElement>(null);

  // Fix hydration issues by only rendering time-dependent content on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setShowReactions(false);
      }
    };

    if (showReactions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReactions]);

  // Quick reaction emojis
  const quickReactions = ['👍', '❤️', '😂', '😢', '😡', '🔥'];

  // Check if current user is the message author
  const isOwnMessage = currentUserAddress === message.senderAddress;

  // Format timestamp - only calculate on client to avoid hydration mismatch
  const timeString = useMemo(() => {
    if (!mounted || !message.timestamp) return '';
    
    let date: Date;
    if (typeof message.timestamp === 'number') {
      date = new Date(message.timestamp);
    } else if (message.timestamp && typeof message.timestamp === 'object' && 'toDate' in message.timestamp) {
      // Firebase Timestamp object
      date = (message.timestamp as any).toDate();
    } else {
      date = new Date(message.timestamp);
    }
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    }
    
    // More than 24 hours - show date
    return date.toLocaleDateString();
  }, [message.timestamp, mounted]);

  // Get display name
  const displayName = message.username || `${message.senderAddress.slice(0, 6)}...${message.senderAddress.slice(-4)}`;

  // Get profile color
  const profileColor = useMemo(() => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Generate consistent color based on wallet address
    const hash = message.senderAddress.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }, [message.senderAddress]);

  // Handle delete message
  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    
    try {
      setIsDeleting(true);
      await onDelete(message.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle copy message
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  // Handle reaction
  const handleReaction = async (emoji: string) => {
    if (!onReaction) return;
    
    try {
      // Check if user already reacted with this emoji
      const userReacted = message.reactions?.[emoji]?.[currentUserAddress || ''];
      
      if (userReacted && onRemoveReaction) {
        await onRemoveReaction(message.id, emoji);
      } else {
        await onReaction(message.id, emoji);
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
    
    setShowReactions(false);
  };

  return (
    <div className={cn(
      "group flex gap-3 p-3 hover:bg-gray-800/30 transition-colors",
      isOwnMessage && "bg-blue-900/10",
      className
    )}>
      {/* Profile Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0",
        profileColor
      )}>
        {displayName.charAt(0).toUpperCase()}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white text-sm">
            {displayName}
          </span>
          <span className="text-xs text-gray-400">
            {timeString}
          </span>
          {isOwnMessage && (
            <span className="text-xs text-blue-400 bg-blue-500/20 px-1 rounded">
              you
            </span>
          )}
        </div>

        {/* Reply indicator */}
        {message.replyTo && (
          <div className="mb-2 pl-3 border-l-2 border-gray-600 bg-gray-800/30 rounded-r py-1">
            <div className="text-xs text-gray-400 mb-1">
              Replying to {message.replyToUsername || 'someone'}
            </div>
            {message.replyToContent && (
              <div className="text-xs text-gray-300 truncate">
                {message.replyToContent.length > 100 
                  ? `${message.replyToContent.substring(0, 100)}...` 
                  : message.replyToContent
                }
              </div>
            )}
          </div>
        )}

        {/* Message text */}
        <div className="text-gray-100 text-sm leading-relaxed break-words">
          {message.content}
        </div>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(message.reactions).map(([emoji, userReactions]) => {
              if (!userReactions || Object.keys(userReactions).length === 0) return null;
              
              const userReacted = !!(userReactions[currentUserAddress || '']);
              const count = Object.keys(userReactions).length;
              
              return (
                <button
                  key={emoji}
                  onClick={readOnly ? undefined : () => handleReaction(emoji)}
                  disabled={readOnly}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors flex-shrink-0",
                    readOnly 
                      ? "bg-gray-700/50 text-gray-300 cursor-default"
                      : userReacted 
                        ? "bg-blue-600/30 text-blue-300 border border-blue-500/50" 
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  )}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs font-medium">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Action buttons (visible on hover) - only show for authenticated users */}
        {!readOnly && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Quick reactions */}
            <div className="relative" ref={reactionPickerRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactions(!showReactions)}
                className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
              >
                😀
              </Button>
              
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-1 flex gap-1 p-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                  {quickReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-sm transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply button */}
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(message)}
                className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Reply size={12} />
              </Button>
            )}

              {/* More actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <MoreVertical size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                <DropdownMenuItem onClick={handleCopy} className="text-gray-300 hover:text-white">
                  <Copy size={14} className="mr-2" />
                  Copy
                </DropdownMenuItem>
                {isOwnMessage && onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} className="mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
