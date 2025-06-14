#!/usr/bin/env node

/**
 * Firebase Client Script to Free Up Username
 * 
 * This script uses the Firebase client SDK to connect to Firestore
 * and remove a specific username from the usernameClaims collection.
 * 
 * Usage: node scripts/free-username-client.js <username>
 * Example: node scripts/free-username-client.js 0xNeel
 */

// Import required modules
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  deleteField,
  writeBatch
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChyeTIWdzvDoLxjU6_NMbNNFLSppIPNik",
  authDomain: "skepsis-chat-markets.firebaseapp.com",
  projectId: "skepsis-chat-markets",
  storageBucket: "skepsis-chat-markets.firebasestorage.app",
  messagingSenderId: "276005028830",
  appId: "1:276005028830:web:0d08773ba1f1852259134f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function freeUsername(username) {
  if (!username) {
    console.error('❌ Username is required');
    console.log('Usage: node scripts/free-username-client.js <username>');
    process.exit(1);
  }

  const normalizedUsername = username.toLowerCase();
  
  try {
    console.log(`🔍 Checking username claim for: ${username}`);
    
    // Check if username claim exists
    const claimRef = doc(db, 'usernameClaims', normalizedUsername);
    const claimDoc = await getDoc(claimRef);
    
    if (!claimDoc.exists()) {
      console.log(`ℹ️  Username "${username}" is not currently claimed`);
      return;
    }
    
    const claimData = claimDoc.data();
    console.log(`📋 Found username claim:`);
    console.log(`   Username: ${claimData.displayUsername || claimData.username}`);
    console.log(`   Wallet Address: ${claimData.walletAddress}`);
    console.log(`   Claimed At: ${claimData.claimedAt?.toDate?.() || 'Unknown'}`);
    
    // Delete the username claim
    console.log(`🗑️  Deleting username claim for: ${username}`);
    await deleteDoc(claimRef);
    
    // Also check if any user document has this username and clear it
    console.log(`🔍 Checking for users with username: ${username}`);
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', claimData.displayUsername || username)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      const batch = writeBatch(db);
      usersSnapshot.docs.forEach(docSnap => {
        console.log(`🔄 Clearing username from user: ${docSnap.id}`);
        batch.update(docSnap.ref, {
          username: deleteField(),
          displayName: docSnap.id // Reset display name to wallet address
        });
      });
      
      await batch.commit();
      console.log(`✅ Cleared username from ${usersSnapshot.docs.length} user document(s)`);
    } else {
      console.log(`ℹ️  No user documents found with username: ${username}`);
    }
    
    console.log(`✅ Successfully freed username: ${username}`);
    console.log(`💡 The username "${username}" can now be claimed again`);
    
  } catch (error) {
    console.error('❌ Error freeing username:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const username = process.argv[2];
  
  if (!username) {
    console.error('❌ Username argument is required');
    console.log('Usage: node scripts/free-username-client.js <username>');
    console.log('Example: node scripts/free-username-client.js 0xNeel');
    process.exit(1);
  }
  
  try {
    await freeUsername(username);
    console.log('\n🎉 Operation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Operation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
