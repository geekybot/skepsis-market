#!/usr/bin/env node

/**
 * Firebase Setup Script for Skepsis Chat System
 * This script helps configure Firebase for the chat functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 Setting up Firebase for Skepsis Chat System...\n');

// Firebase config template
const firebaseConfigTemplate = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Firestore security rules
const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users for chat display
    }
    
    // Username uniqueness collection
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.walletAddress;
      allow delete: if request.auth != null && request.auth.uid == resource.data.walletAddress;
    }
    
    // Market chat rooms
    match /markets/{marketId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Only for updating metadata
      
      // Chat messages in each market
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && 
                     request.auth.uid == request.resource.data.senderId &&
                     request.resource.data.timestamp == request.time;
        allow update: if request.auth != null && 
                     request.auth.uid == resource.data.senderId;
        allow delete: if request.auth != null && 
                     (request.auth.uid == resource.data.senderId || 
                      hasAdminRole(request.auth.uid));
      }
    }
    
    // Helper function for admin role (implement as needed)
    function hasAdminRole(userId) {
      return exists(/databases/$(database)/documents/admins/$(userId));
    }
  }
}`;

// Environment variables template
const envTemplate = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Optional: Firebase Admin SDK (for server-side operations)
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
`;

function createFirebaseConfig() {
  const configPath = path.join(__dirname, '..', 'src', 'lib', 'firebase.ts');
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const firebaseConfigContent = `import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    // Only connect to emulators if not already connected
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    // Firestore emulator connection would be here if needed
    // connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Emulator connection failed:', error);
  }
}

export default app;
`;

  fs.writeFileSync(configPath, firebaseConfigContent);
  console.log('✅ Created Firebase configuration file');
}

function createEnvExample() {
  const envPath = path.join(__dirname, '..', '.env.firebase.example');
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.firebase.example file');
}

function createFirestoreRules() {
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  fs.writeFileSync(rulesPath, firestoreRules);
  console.log('✅ Created Firestore security rules');
}

function updatePackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  let packageJson;
  
  try {
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    console.error('❌ Could not read package.json');
    return;
  }

  // Add Firebase dependencies
  const firebaseDeps = {
    'firebase': '^10.7.1',
    'react-firebase-hooks': '^5.1.1'
  };

  packageJson.dependencies = { ...packageJson.dependencies, ...firebaseDeps };

  // Add Firebase scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'firebase:emulator': 'firebase emulators:start',
    'firebase:deploy': 'firebase deploy',
    'firebase:deploy:rules': 'firebase deploy --only firestore:rules'
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with Firebase dependencies');
}

function createFirebaseJson() {
  const firebaseJson = {
    "firestore": {
      "rules": "firestore.rules",
      "indexes": "firestore.indexes.json"
    },
    "emulators": {
      "auth": {
        "port": 9099
      },
      "firestore": {
        "port": 8080
      },
      "ui": {
        "enabled": true,
        "port": 4000
      }
    }
  };

  const firebasePath = path.join(__dirname, '..', 'firebase.json');
  fs.writeFileSync(firebasePath, JSON.stringify(firebaseJson, null, 2));
  console.log('✅ Created firebase.json configuration');
}

function createFirestoreIndexes() {
  const indexes = {
    "indexes": [
      {
        "collectionGroup": "messages",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "marketId", "order": "ASCENDING" },
          { "fieldPath": "timestamp", "order": "DESCENDING" }
        ]
      }
    ],
    "fieldOverrides": []
  };

  const indexesPath = path.join(__dirname, '..', 'firestore.indexes.json');
  fs.writeFileSync(indexesPath, JSON.stringify(indexes, null, 2));
  console.log('✅ Created Firestore indexes configuration');
}

// Main setup function
function setupFirebase() {
  console.log('Setting up Firebase configuration files...\n');
  
  createFirebaseConfig();
  createEnvExample();
  createFirestoreRules();
  createFirebaseJson();
  createFirestoreIndexes();
  updatePackageJson();
  
  console.log('\n🎉 Firebase setup complete!\n');
  console.log('Next steps:');
  console.log('1. Install Firebase CLI: npm install -g firebase-tools');
  console.log('2. Login to Firebase: firebase login');
  console.log('3. Create a new Firebase project: firebase projects:create your-project-id');
  console.log('4. Initialize Firebase in this directory: firebase init');
  console.log('5. Copy .env.firebase.example to .env.local and fill in your Firebase config');
  console.log('6. Install dependencies: npm install');
  console.log('7. Start Firebase emulators: npm run firebase:emulator');
}

// Run the setup
setupFirebase();
