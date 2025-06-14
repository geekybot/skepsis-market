// Message input component with emoji picker and file upload
import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Send, Smile, Paperclip, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConnectModal } from '@mysten/dapp-kit';

interface MessageInputProps {
  onSendMessage: (message: string, replyTo?: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  replyingTo?: {
    id: string;
    username?: string;
    message: string;
  } | null;
  onCancelReply?: () => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export interface MessageInputRef {
  focus: () => void;
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({
  onSendMessage,
  onTyping,
  disabled = false,
  readOnly = false,
  replyingTo = null,
  onCancelReply,
  placeholder = "Type a message...",
  maxLength = 1000,
  className
}, ref) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Expose focus method to parent components
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
      }
    }
  }), []);

  // Focus the textarea when replyingTo changes (reply is triggered)
  React.useEffect(() => {
    if (replyingTo && textareaRef.current && !readOnly) {
      // Small delay to ensure the component is rendered
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
      }, 100);
    }
  }, [replyingTo, readOnly]);

  // Common emojis for quick access - organized by category
  const quickEmojis = [
    // Faces
    '😀', '😂', '😍', '😢', '😡', 
    // Gestures  
    '👍', '👎', '👏', '🙏', '💪',
    // Hearts & symbols
    '❤️', '💙', '💚', '🔥', '💯',
    // Misc popular
    '🚀', '🎉', '⭐', '💎', '🌙'
  ];

  // Handle click outside to close emoji picker
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Handle message change
  const handleMessageChange = useCallback((value: string) => {
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Handle typing indicator
      if (onTyping) {
        onTyping(true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 1000);
      }
    }
  }, [maxLength, onTyping]);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) return;

    try {
      setIsSending(true);
      
      // Clear typing indicator
      if (onTyping) {
        onTyping(false);
      }
      
      await onSendMessage(trimmedMessage, replyingTo?.id);
      setMessage('');
      
      // Cancel reply if active
      if (onCancelReply) {
        onCancelReply();
      }

      // Refocus the textarea after sending
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Ensure cursor is at the end
          textareaRef.current.setSelectionRange(0, 0);
        }
      }, 50);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, disabled, onSendMessage, replyingTo, onCancelReply, onTyping]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Add emoji to message
  const addEmoji = useCallback((emoji: string) => {
    const newMessage = message + emoji;
    handleMessageChange(newMessage);
    setShowEmojiPicker(false);
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [message, handleMessageChange]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // If read-only, show connect prompt
  if (readOnly) {
    return (
      <div className={cn("border-t border-gray-700/50 bg-gray-800/60 backdrop-blur-md", className)}>
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 py-4 px-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600/20 rounded-full border border-blue-500/30">
                <MessageSquare size={20} className="text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white mb-1">Join the conversation</div>
                <div className="text-xs text-gray-300">Connect your wallet to send messages and react</div>
              </div>
            </div>
            <ConnectModal
              trigger={
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 shadow-lg border border-blue-500/30"
                >
                  Connect Wallet
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-t border-gray-700/50 bg-gray-800/60 backdrop-blur-md", className)}>
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 border-b border-gray-700/30 bg-gray-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <span className="text-gray-400">Replying to</span>
              <span className="text-blue-400 font-medium">
                {replyingTo.username || 'Anonymous'}
              </span>
            </div>
            {onCancelReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <X size={14} />
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-300 truncate mt-1 ml-3">
            {replyingTo.message}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Emoji picker toggle */}
          <div className="relative" ref={emojiPickerRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <Smile size={18} />
            </Button>

            {/* Quick emoji picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 w-60">
                <div className="grid grid-cols-5 gap-2">
                  {quickEmojis.map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      onClick={() => addEmoji(emoji)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-700 rounded-md text-xl transition-all duration-200 hover:scale-110 active:scale-95"
                      title={`Add ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400 text-center">Click to add emoji</p>
                </div>
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isSending}
              rows={1}
              className={cn(
                "w-full resize-none rounded-lg border border-gray-600 bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-400",
                "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "scrollbar-thin scrollbar-track-gray-700 scrollbar-thumb-gray-500"
              )}
              style={{ maxHeight: '120px' }}
            />
            
            {/* Character count */}
            {message.length > maxLength * 0.8 && (
              <div className={cn(
                "absolute bottom-1 right-2 text-xs",
                message.length >= maxLength ? "text-red-400" : "text-gray-400"
              )}>
                {message.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || disabled}
            size="sm"
            className={cn(
              "h-8 w-8 p-0 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600",
              "transition-colors duration-200"
            )}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
