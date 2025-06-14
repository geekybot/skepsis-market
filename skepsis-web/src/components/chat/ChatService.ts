// Firebase chat service - handles all chat-related database operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import {
  signInWithCustomToken,
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { ChatMessage, ChatUser, ChatRoom, UserPreferences, TypingIndicator } from './types';

export class ChatService {
  // Collection names
  private static readonly COLLECTIONS = {
    MESSAGES: 'messages',
    USERS: 'users',
    ROOMS: 'rooms',
    USER_PREFERENCES: 'userPreferences',
    TYPING: 'typing',
    USERNAME_CLAIMS: 'usernameClaims'
  };

  // Utility function to remove undefined values from objects
  private static cleanUndefinedFields(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // Authentication
  static async signInWithWallet(walletAddress: string, customToken?: string): Promise<User | null> {
    try {
      if (customToken) {
        const userCredential = await signInWithCustomToken(auth, customToken);
        return userCredential.user;
      }
      
      // For now, we'll use the wallet address as the user identifier
      // In production, you'd want proper authentication
      return null;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // User Management
  static async createOrUpdateUser(userData: Partial<ChatUser>): Promise<void> {
    if (!userData.walletAddress) {
      throw new Error('Wallet address is required');
    }

    try {
      const userRef = doc(db, this.COLLECTIONS.USERS, userData.walletAddress);
      
      // Get existing user data to preserve username if not provided
      const existingDoc = await getDoc(userRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : {};
      
      const updateData: any = {
        walletAddress: userData.walletAddress,
        displayName: userData.displayName || userData.walletAddress,
        avatar: userData.avatar || null,
        isOnline: userData.isOnline || false,
        lastSeen: userData.lastSeen || serverTimestamp(),
        createdAt: userData.createdAt || existingData.createdAt || serverTimestamp(),
        messageCount: userData.messageCount || existingData.messageCount || 0,
        reputation: userData.reputation || existingData.reputation || 0
      };

      // Only update username if explicitly provided
      if (userData.username !== undefined) {
        updateData.username = userData.username;
      } else if (existingData.username) {
        // Preserve existing username if no new username provided
        updateData.username = existingData.username;
      }

      const cleanedData = this.cleanUndefinedFields(updateData);
      await setDoc(userRef, cleanedData, { merge: true });
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  static async getUser(walletAddress: string): Promise<ChatUser | null> {
    try {
      const userRef = doc(db, this.COLLECTIONS.USERS, walletAddress);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return userDoc.data() as ChatUser;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  static async updateUserPresence(walletAddress: string, isOnline: boolean): Promise<void> {
    if (!walletAddress) {
      console.warn('Cannot update presence: walletAddress is required');
      return;
    }

    try {
      const userRef = doc(db, this.COLLECTIONS.USERS, walletAddress);
      const updateData = this.cleanUndefinedFields({
        walletAddress,
        isOnline,
        lastSeen: serverTimestamp()
      });

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating user presence:', error);
      throw error;
    }
  }

  // Message Management
  static async sendMessage(messageData: {
    content: string;
    senderAddress: string;
    roomId: string;
    messageType?: 'text' | 'image' | 'system';
    replyTo?: string;
    username?: string;
  }): Promise<string> {
    try {
      let replyToContent: string | undefined;
      let replyToUsername: string | undefined;

      // If this is a reply, fetch the original message content
      if (messageData.replyTo) {
        try {
          const replyToRef = doc(db, this.COLLECTIONS.MESSAGES, messageData.replyTo);
          const replyToSnap = await getDoc(replyToRef);
          
          if (replyToSnap.exists()) {
            const replyToMessage = replyToSnap.data() as ChatMessage;
            replyToContent = replyToMessage.content;
            replyToUsername = replyToMessage.username || `${replyToMessage.senderAddress.slice(0, 6)}...${replyToMessage.senderAddress.slice(-4)}`;
          }
        } catch (error) {
          console.warn('Failed to fetch reply-to message:', error);
        }
      }

      const cleanedMessageData = this.cleanUndefinedFields({
        content: messageData.content,
        senderAddress: messageData.senderAddress,
        roomId: messageData.roomId,
        messageType: messageData.messageType || 'text',
        timestamp: serverTimestamp(),
        reactions: {},
        replyCount: 0,
        isEdited: false,
        isDeleted: false,
        ...(messageData.replyTo && { replyTo: messageData.replyTo }),
        ...(replyToContent && { replyToContent }),
        ...(replyToUsername && { replyToUsername }),
        ...(messageData.username && { username: messageData.username })
      });

      console.log('ChatService.sendMessage - messageData.username:', messageData.username);
      console.log('ChatService.sendMessage - cleanedMessageData:', cleanedMessageData);

      const docRef = await addDoc(collection(db, this.COLLECTIONS.MESSAGES), cleanedMessageData);
      
      // Update user message count
      await this.incrementUserMessageCount(messageData.senderAddress);
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async updateMessage(messageId: string, updates: Partial<ChatMessage>): Promise<void> {
    try {
      const messageRef = doc(db, this.COLLECTIONS.MESSAGES, messageId);
      const cleanedUpdates = this.cleanUndefinedFields({
        ...updates,
        isEdited: true,
        editedAt: serverTimestamp()
      });

      await updateDoc(messageRef, cleanedUpdates);
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, this.COLLECTIONS.MESSAGES, messageId);
      await updateDoc(messageRef, {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  static async addReaction(messageId: string, emoji: string, userAddress: string): Promise<void> {
    try {
      const messageRef = doc(db, this.COLLECTIONS.MESSAGES, messageId);
      await updateDoc(messageRef, {
        [`reactions.${emoji}.${userAddress}`]: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  static async removeReaction(messageId: string, emoji: string, userAddress: string): Promise<void> {
    try {
      const messageRef = doc(db, this.COLLECTIONS.MESSAGES, messageId);
      await updateDoc(messageRef, {
        [`reactions.${emoji}.${userAddress}`]: null
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Room Management
  static async createRoom(roomData: Partial<ChatRoom>): Promise<string> {
    try {
      const cleanedRoomData = this.cleanUndefinedFields({
        name: roomData.name || 'Unnamed Room',
        description: roomData.description || '',
        type: roomData.type || 'public',
        marketId: roomData.marketId,
        campaignId: roomData.campaignId,
        trackId: roomData.trackId,
        createdBy: roomData.createdBy,
        createdAt: serverTimestamp(),
        memberCount: 0,
        messageCount: 0,
        isActive: true,
        settings: roomData.settings || {
          allowImages: true,
          allowReactions: true,
          maxMessageLength: 500,
          slowMode: 0
        }
      });

      const docRef = await addDoc(collection(db, this.COLLECTIONS.ROOMS), cleanedRoomData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  static async getRoom(roomId: string): Promise<ChatRoom | null> {
    try {
      const roomDoc = await getDocs(
        query(collection(db, this.COLLECTIONS.ROOMS), where('__name__', '==', roomId))
      );
      
      if (roomDoc.empty) {
        return null;
      }
      
      return { id: roomId, ...roomDoc.docs[0].data() } as ChatRoom;
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  }

  // Subscription methods for real-time updates
  static subscribeToMessages(
    roomId: string,
    callback: (messages: ChatMessage[]) => void,
    errorCallback?: (error: Error) => void,
    messageLimit: number = 50
  ): () => void {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.MESSAGES),
        where('roomId', '==', roomId),
        where('isDeleted', '==', false),
        orderBy('timestamp', 'desc'),
        limit(messageLimit)
      );

      return onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        
        // Reverse to show oldest first
        callback(messages.reverse());
      }, (error) => {
        console.error('Error in messages subscription:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      });
    } catch (error) {
      console.error('Error setting up messages subscription:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  static subscribeToOnlineUsers(
    roomId: string,
    callback: (users: ChatUser[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.USERS),
        where('isOnline', '==', true)
      );

      return onSnapshot(q, (snapshot) => {
        const users: ChatUser[] = [];
        snapshot.forEach((doc) => {
          const userData = doc.data();
          // Validate that required fields exist
          if (userData.walletAddress) {
            users.push({ id: doc.id, ...userData } as ChatUser);
          } else {
            console.warn('User document missing required walletAddress field:', doc.id);
          }
        });
        
        callback(users);
      }, (error) => {
        console.error('Error in online users subscription:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      });
    } catch (error) {
      console.error('Error setting up online users subscription:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  static subscribeToTypingIndicators(
    roomId: string,
    callback: (typingUsers: TypingIndicator[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.TYPING),
        where('roomId', '==', roomId),
        where('isTyping', '==', true)
      );

      return onSnapshot(q, (snapshot) => {
        const typingUsers: TypingIndicator[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userAddress && data.timestamp) {
            typingUsers.push({ 
              id: doc.id, 
              userId: data.userAddress,
              walletAddress: data.userAddress,
              username: data.username,
              timestamp: data.timestamp
            } as TypingIndicator);
          }
        });
        
        callback(typingUsers);
      }, (error) => {
        console.error('Error in typing indicators subscription:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      });
    } catch (error) {
      console.error('Error setting up typing indicators subscription:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  static subscribeToUser(
    walletAddress: string,
    callback: (user: ChatUser | null) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    const userRef = doc(db, this.COLLECTIONS.USERS, walletAddress);
    
    return onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as ChatUser);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('User subscription error:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
  }

  // Typing indicators
  static async setTypingIndicator(
    roomId: string,
    userAddress: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const typingRef = doc(db, this.COLLECTIONS.TYPING, `${roomId}_${userAddress}`);
      
      if (isTyping) {
        const cleanedData = this.cleanUndefinedFields({
          roomId,
          userAddress,
          isTyping,
          timestamp: serverTimestamp()
        });
        await setDoc(typingRef, cleanedData);
      } else {
        await deleteDoc(typingRef);
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      throw error;
    }
  }

  // Username Management
  static async claimUsername(walletAddress: string, username: string): Promise<boolean> {
    try {
      // Check if username is already taken
      const existingClaim = await getDocs(
        query(
          collection(db, this.COLLECTIONS.USERNAME_CLAIMS),
          where('username', '==', username.toLowerCase())
        )
      );

      if (!existingClaim.empty) {
        return false; // Username already taken
      }

      // Create username claim
      const claimRef = doc(db, this.COLLECTIONS.USERNAME_CLAIMS, username.toLowerCase());
      await setDoc(claimRef, {
        username: username.toLowerCase(),
        displayUsername: username,
        walletAddress,
        claimedAt: serverTimestamp()
      });

      // Update user document
      await this.createOrUpdateUser({
        walletAddress,
        username,
        displayName: username
      });

      return true;
    } catch (error) {
      console.error('Error claiming username:', error);
      throw error;
    }
  }

  static async releaseUsername(walletAddress: string, username: string): Promise<void> {
    try {
      const claimRef = doc(db, this.COLLECTIONS.USERNAME_CLAIMS, username.toLowerCase());
      await deleteDoc(claimRef);

      // Update user document to remove username
      await this.createOrUpdateUser({
        walletAddress,
        displayName: walletAddress
      });
    } catch (error) {
      console.error('Error releasing username:', error);
      throw error;
    }
  }

  // Utility methods
  private static async incrementUserMessageCount(walletAddress: string): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTIONS.USERS, walletAddress);
      await updateDoc(userRef, {
        messageCount: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing user message count:', error);
      // Don't throw error as this is not critical
    }
  }

  // Cleanup methods
  static async cleanupOldTypingIndicators(): Promise<void> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const q = query(
        collection(db, this.COLLECTIONS.TYPING),
        where('timestamp', '<', Timestamp.fromDate(oneMinuteAgo))
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up old typing indicators:', error);
    }
  }

  static async cleanupOfflineUsers(): Promise<void> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 300000);
      const q = query(
        collection(db, this.COLLECTIONS.USERS),
        where('lastSeen', '<', Timestamp.fromDate(fiveMinutesAgo)),
        where('isOnline', '==', true)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isOnline: false });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up offline users:', error);
    }
  }
}
