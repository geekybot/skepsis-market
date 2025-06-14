#!/usr/bin/env node

/**
 * Firebase Admin Script to Free Up Username
 * 
 * This script connects to Firebase Firestore and removes a specific username
 * from the usernameClaims collection, allowing it to be reclaimed.
 * 
 * Usage: node scripts/free-username.js <username>
 * Example: node scripts/free-username.js 0xNeel
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You can use one of these methods:
// 1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable to point to service account key
// 2. Use Firebase CLI login (firebase login)
// 3. Provide service account key directly (not recommended for production)

if (!admin.apps.length) {
  try {
    // Try to initialize with default credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // Replace with your Firebase project ID
      projectId: process.env.FIREBASE_PROJECT_ID || 'skepsis-ai-ai'
    });
    console.log('✅ Firebase Admin initialized with default credentials');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.log('\n📋 To fix this, you can:');
    console.log('1. Run: firebase login');
    console.log('2. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.log('3. Or run: gcloud auth application-default login');
    process.exit(1);
  }
}

const db = admin.firestore();

async function freeUsername(username) {
  if (!username) {
    console.error('❌ Username is required');
    console.log('Usage: node scripts/free-username.js <username>');
    process.exit(1);
  }

  const normalizedUsername = username.toLowerCase();
  
  try {
    console.log(`🔍 Checking username claim for: ${username}`);
    
    // Check if username claim exists
    const claimRef = db.collection('usernameClaims').doc(normalizedUsername);
    const claimDoc = await claimRef.get();
    
    if (!claimDoc.exists) {
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
    await claimRef.delete();
    
    // Also check if any user document has this username and clear it
    console.log(`🔍 Checking for users with username: ${username}`);
    const usersQuery = await db.collection('users')
      .where('username', '==', claimData.displayUsername || username)
      .get();
    
    if (!usersQuery.empty) {
      const batch = db.batch();
      usersQuery.docs.forEach(doc => {
        console.log(`🔄 Clearing username from user: ${doc.id}`);
        batch.update(doc.ref, {
          username: admin.firestore.FieldValue.delete(),
          displayName: doc.id // Reset display name to wallet address
        });
      });
      
      await batch.commit();
      console.log(`✅ Cleared username from ${usersQuery.docs.length} user document(s)`);
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
    console.log('Usage: node scripts/free-username.js <username>');
    console.log('Example: node scripts/free-username.js 0xNeel');
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
