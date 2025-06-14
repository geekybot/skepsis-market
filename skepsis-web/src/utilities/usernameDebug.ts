/**
 * Utility functions for debugging username display issues
 */

import { ChatService } from '@/components/chat/ChatService';

export async function debugUserData(walletAddress: string) {
  console.log('=== USERNAME DEBUG ===');
  console.log('Wallet Address:', walletAddress);
  
  try {
    // Get user data directly from database
    const userData = await ChatService.getUser(walletAddress);
    console.log('User data from database:', userData);
    
    // Check if user has a username
    if (userData?.username) {
      console.log('✅ User has username:', userData.username);
    } else {
      console.log('❌ User does not have username');
    }
    
    return userData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

export async function forceRefreshUserData(walletAddress: string) {
  console.log('=== FORCE REFRESH USER DATA ===');
  
  try {
    // Get fresh user data
    const userData = await ChatService.getUser(walletAddress);
    console.log('Fresh user data:', userData);
    
    if (userData) {
      // Update user document to trigger subscription
      await ChatService.createOrUpdateUser({
        walletAddress,
        isOnline: true
      });
      console.log('✅ User data refreshed successfully');
    }
    
    return userData;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return null;
  }
}

// Add to window for easy debugging in browser console
declare global {
  interface Window {
    debugUsername: typeof debugUserData;
    refreshUsername: typeof forceRefreshUserData;
  }
}

if (typeof window !== 'undefined') {
  window.debugUsername = debugUserData;
  window.refreshUsername = forceRefreshUserData;
}
