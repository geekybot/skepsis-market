// Test script to verify Firebase chat system functionality
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

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

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test 1: Add a test message
    const testMessage = {
      text: 'Hello from Firebase test!',
      walletAddress: 'test-wallet-123',
      username: 'TestUser',
      timestamp: new Date(),
      roomId: 'test-room',
      type: 'text' as const
    };
    
    const docRef = await addDoc(collection(db, 'messages'), testMessage);
    console.log('✓ Test message added with ID:', docRef.id);
    
    // Test 2: Query messages
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    const snapshot = await getDocs(messagesQuery);
    console.log('✓ Messages retrieved:', snapshot.size);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('  - Message:', data.text, 'from', data.username);
    });
    
    console.log('✅ Firebase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
  }
}

export { testFirebaseConnection };
