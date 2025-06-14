// Message list component with virtual scrolling and typing indicators
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage, TypingIndicator } from './types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserAddress?: string;
  typingUsers?: TypingIndicator[];
  isLoading?: boolean;
  readOnly?: boolean;
  onReply?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => Promise<void>;
  onReaction?: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>;
  forceScrollToBottom?: number; // timestamp to force scroll
  className?: string;
}

export function MessageList({
  messages,
  currentUserAddress,
  typingUsers = [],
  isLoading = false,
  readOnly = false,
  onReply,
  onDelete,
  onReaction,
  onRemoveReaction,
  forceScrollToBottom,
  className
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isScrolledToBottom && scrollRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isScrolledToBottom]);

  // Force scroll to bottom on first load
  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          setIsScrolledToBottom(true);
        }
      });
    }
  }, [messages.length === 1]); // Only on first message

  // Force scroll when requested
  useEffect(() => {
    if (forceScrollToBottom && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          setIsScrolledToBottom(true);
          setShowScrollToBottom(false);
        }
      });
    }
  }, [forceScrollToBottom]);

  // Handle scroll events
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setIsScrolledToBottom(atBottom);
    setShowScrollToBottom(!atBottom && messages.length > 0);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setIsScrolledToBottom(true);
      setShowScrollToBottom(false);
    }
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    let currentGroup: ChatMessage[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [messages]);

  // Typing indicator component
  const TypingIndicatorComponent = () => {
    if (typingUsers.length === 0) return null;

    const typingText = typingUsers.length === 1 
      ? `${typingUsers[0].username || 'Someone'} is typing...`
      : `${typingUsers.length} users are typing...`;

    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{typingText}</span>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full relative min-h-0", className)}>
      {/* Messages container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 min-h-0"
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-lg mb-2">💬</div>
              <div className="text-sm">No messages yet</div>
              <div className="text-xs">Be the first to start the conversation!</div>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-gray-700/50 rounded-full text-xs text-gray-400">
                    {group.date}
                  </div>
                </div>

                {/* Messages in this date group */}
                {group.messages.map((message, messageIndex) => {
                  // Check if this message should be grouped with the previous one
                  const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                  const isGrouped = prevMessage && 
                    prevMessage.senderAddress === message.senderAddress &&
                    (message.timestamp - prevMessage.timestamp) < 300000; // 5 minutes

                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      currentUserAddress={currentUserAddress}
                      readOnly={readOnly}
                      onReply={onReply}
                      onDelete={onDelete}
                      onReaction={onReaction}
                      onRemoveReaction={onRemoveReaction}
                      className={isGrouped ? "pt-1" : ""}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        <TypingIndicatorComponent />
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={scrollToBottom}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 13l3 3 7-7" />
              <path d="M8 21l4-7 4 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
