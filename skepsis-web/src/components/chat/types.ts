// Chat component types and interfaces

export interface ChatMessage {
  id: string;
  roomId: string;
  senderAddress: string;
  content: string;
  username?: string;
  messageType?: 'text' | 'image' | 'system';
  timestamp: number;
  reactions?: { [emoji: string]: { [userAddress: string]: number } }; // emoji -> userAddress -> timestamp
  isSystem?: boolean;
  replyTo?: string; // message ID being replied to
  replyToContent?: string; // content of the message being replied to
  replyToUsername?: string; // username of the person being replied to
  isEdited?: boolean;
  isDeleted?: boolean;
  replyCount?: number;
}

export interface ChatUser {
  id: string;
  walletAddress: string;
  username?: string;
  displayName: string;
  isOnline: boolean;
  lastSeen: number;
  profileColor?: string;
  avatar?: string;
  createdAt?: number;
  messageCount?: number;
  reputation?: number;
}

export interface ChatRoom {
  id: string;
  marketId?: string;
  campaignId?: string;
  trackId?: string;
  type: 'market' | 'campaign' | 'track' | 'public';
  name: string;
  description?: string;
  participantCount: number;
  lastMessage?: ChatMessage;
  createdAt: number;
  createdBy?: string;
  memberCount?: number;
  messageCount?: number;
  isActive?: boolean;
  settings?: {
    allowImages: boolean;
    allowReactions: boolean;
    maxMessageLength: number;
    slowMode: number;
  };
}

export interface UserPreferences {
  walletAddress: string;
  username?: string;
  notifications: {
    mentions: boolean;
    newMessages: boolean;
    reactions: boolean;
  };
  theme: 'light' | 'dark';
  soundEnabled: boolean;
}

export interface TypingIndicator {
  userId: string;
  walletAddress: string;
  username?: string;
  timestamp: number;
}
