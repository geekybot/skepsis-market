// filepath: /Users/split/Desktop/projects/skepsis/packages/skepsis_market/scripts/src/verify-address.ts
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { fromHEX, toHEX } from '@mysten/sui/utils';
import { fromB64, toB64 } from '@mysten/bcs';
import { getSuiClient, getKeypairFromEnv } from './config/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// "m/44'/784'/0'/0'/0'"
dotenv.config();

/**
 * Get error message safely from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Try multiple approaches to derive keypair from private key string
 */
function tryAllDerivationMethods(privateKeyString: string): {keypair: Ed25519Keypair | Secp256k1Keypair | null, method: string}[] {
  const results: {keypair: Ed25519Keypair | Secp256k1Keypair | null, method: string}[] = [];
  
  try {
    // 1. Try Ed25519 from direct hex (no 0x prefix)
    const rawHex = privateKeyString.startsWith('0x') ? privateKeyString.slice(2) : privateKeyString;
    if (/^[0-9a-fA-F]{64}$/.test(rawHex)) {
      try {
        const keypair = Ed25519Keypair.fromSecretKey(fromHEX(rawHex));
        results.push({keypair, method: 'Ed25519 from direct hex'});
      } catch (e: unknown) {
        console.log(`Error with Ed25519 from direct hex: ${getErrorMessage(e)}`);
      }
    }
    
    // 2. Try Ed25519 from slush format (usually base64)
    try {
      if (privateKeyString.length >= 32) {
        try {
          // Try decoding as base64
          const keyBytes = fromB64(privateKeyString);
          if (keyBytes.length >= 32) {
            const keypair = Ed25519Keypair.fromSecretKey(keyBytes.slice(0, 32));
            results.push({keypair, method: 'Ed25519 from Base64'});
          }
        } catch (e) {
          // Not base64, continue to other methods
        }
      }
    } catch (e: unknown) {
      console.log(`Error with Ed25519 from Base64: ${getErrorMessage(e)}`);
    }
    
    // 3. Try Bech32 format with Ed25519
    if (privateKeyString.startsWith('suiprivkey')) {
      try {
        const base64Part = privateKeyString.slice(11);
        const keyBytes = fromB64(base64Part);
        
        // Ed25519 variant
        const ed25519Keypair = Ed25519Keypair.fromSecretKey(keyBytes.slice(0, 32));
        results.push({keypair: ed25519Keypair, method: 'Ed25519 from Bech32'});
        
        // Check if there's a flag byte indicating the key type
        if (keyBytes.length > 32) {
          const keyTypeByte = keyBytes[32];
          if (keyTypeByte === 1) { // 1 might indicate Secp256k1
            try {
              const secp256k1Keypair = Secp256k1Keypair.fromSecretKey(keyBytes.slice(0, 32));
              results.push({keypair: secp256k1Keypair, method: 'Secp256k1 from Bech32'});
            } catch (e: unknown) {
              console.log(`Error with Secp256k1 from Bech32: ${getErrorMessage(e)}`);
            }
          }
        }
      } catch (e: unknown) {
        console.log(`Error with Bech32 format: ${getErrorMessage(e)}`);
      }
    }
    
    // 4. Try Secp256k1 derivation (Ethereum-compatible)
    if (rawHex.length === 64) {
      try {
        const secp256k1Keypair = Secp256k1Keypair.fromSecretKey(fromHEX(rawHex));
        results.push({keypair: secp256k1Keypair, method: 'Secp256k1 from hex'});
      } catch (e: unknown) {
        console.log(`Error with Secp256k1 from hex: ${getErrorMessage(e)}`);
      }
    }
    
    // 5. Try bytes directly from string with different encodings
    if (privateKeyString.length <= 128) {
      try {
        // Try ASCII encoding
        const asciiBytes = new Uint8Array(privateKeyString.length);
        for (let i = 0; i < privateKeyString.length; i++) {
          asciiBytes[i] = privateKeyString.charCodeAt(i);
        }
        
        if (asciiBytes.length >= 32) {
          try {
            const keypair = Ed25519Keypair.fromSecretKey(asciiBytes.slice(0, 32));
            results.push({keypair, method: 'Ed25519 from ASCII bytes'});
          } catch (e) {
            // Continue to next method
          }
        }
        
        // Try SHA-256 hash of the string as key material
        const hashBytes = new Uint8Array(crypto.createHash('sha256').update(privateKeyString).digest());
        try {
          const keypair = Ed25519Keypair.fromSecretKey(hashBytes.slice(0, 32));
          results.push({keypair, method: 'Ed25519 from SHA-256 hash'});
        } catch (e) {
          // Continue to next method
        }
      } catch (e: unknown) {
        console.log(`Error with bytes encoding: ${getErrorMessage(e)}`);
      }
    }
    
    // 6. Try inputs with potential formatting characters removed
    const cleanString = privateKeyString.replace(/[\s-]/g, ''); // Remove spaces, hyphens
    if (cleanString !== privateKeyString) {
      if (/^[0-9a-fA-F]{64}$/.test(cleanString)) {
        try {
          const keypair = Ed25519Keypair.fromSecretKey(fromHEX(cleanString));
          results.push({keypair, method: 'Ed25519 from clean hex'});
        } catch (e) {
          // Continue to next method
        }
      }
    }
    
  } catch (e: unknown) {
    console.log(`General error in derivation attempts: ${getErrorMessage(e)}`);
  }
  
  return results;
}

/**
 * Utility to verify keypairs from different input formats
 * This helps troubleshoot when addresses don't match expected values
 */
async function main() {
  console.log('🔑 Enhanced Sui Address Verification Tool');
  console.log('-------------------------------');

  const targetAddress = process.env.SUI_TARGET_ADDRESS || '0x57400cf44ad97dac479671bb58b96d444e87972f09a6e17fa9650a2c60fbc054';
  const normalizedTargetAddress = targetAddress.startsWith('0x') ? targetAddress : `0x${targetAddress}`;
  console.log(`🎯 Target address: ${normalizedTargetAddress}`);
  
  // First, try the automatic approach from the env file
  console.log('\n🔄 Using getKeypairFromEnv():');
  const keypair = getKeypairFromEnv();

  if (keypair) {
    const address = keypair.getPublicKey().toSuiAddress();
    const normalizedAddress = address.startsWith('0x') ? address : `0x${address}`;
    
    console.log(`✅ Derived public address: ${normalizedAddress}`);
    
    if (normalizedAddress === normalizedTargetAddress) {
      console.log('✅ Address matches target! Your private key is correctly configured.');
    } else {
      console.log('❌ Address does not match target.');
    }
  } else {
    console.log('❌ Failed to derive keypair from environment.');
  }

  // Now try all possible derivation methods
  console.log('\n🧪 Trying all possible derivation methods:');
  const privateKey = process.env.SUI_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log('❌ No private key found in environment. Set SUI_PRIVATE_KEY in .env file.');
  } else {
    console.log(`📝 Using private key from environment (showing first/last 4 chars): ${privateKey.slice(0, 4)}...${privateKey.slice(-4)}`);
    
    const allResults = tryAllDerivationMethods(privateKey);
    
    console.log(`\nFound ${allResults.length} possible derivation methods:`);
    
    let foundMatch = false;
    for (const [index, result] of allResults.entries()) {
      if (!result.keypair) continue;
      
      const derivedAddress = result.keypair.getPublicKey().toSuiAddress();
      const normalizedDerivedAddress = derivedAddress.startsWith('0x') ? derivedAddress : `0x${derivedAddress}`;
      
      console.log(`\n${index + 1}. Method: ${result.method}`);
      console.log(`   Address: ${normalizedDerivedAddress}`);
      
      if (normalizedDerivedAddress === normalizedTargetAddress) {
        console.log('   ✅ MATCH FOUND! This method correctly derives your target address.');
        console.log(`   ℹ️ Use this method in your client.ts file.`);
        foundMatch = true;
      } else {
        console.log('   ❌ Does not match target address');
      }
    }
    
    if (!foundMatch) {
      console.log('\n❌ No derivation method matched the target address.');
      console.log('This likely means the private key you provided does not correspond to the target address.');
      console.log('Please check that you have the correct private key for the address you\'re targeting.');
    }
  }

  // Check if the wallet is connected to the network
  console.log('\n📡 Checking network connection...');
  try {
    const client = getSuiClient();
    const { epoch } = await client.getLatestSuiSystemState();
    console.log(`✅ Connected to network - current epoch: ${epoch}`);
    
    // Check if the target address has any SUI coins
    console.log(`\n💰 Checking balance for target address ${normalizedTargetAddress}...`);
    try {
      const { data: targetCoins } = await client.getCoins({ owner: normalizedTargetAddress });
      
      if (targetCoins.length > 0) {
        console.log(`✅ Found ${targetCoins.length} coins in target wallet`);
        const suiCoins = targetCoins.filter(coin => coin.coinType === '0x2::sui::SUI');
        if (suiCoins.length > 0) {
          const totalSui = suiCoins.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
          console.log(`💰 Target wallet SUI balance: ${Number(totalSui) / 1_000_000_000} SUI`);
        }
      } else {
        console.log('⚠️ No coins found in target wallet');
      }
    } catch (e: unknown) {
      console.log(`❌ Error checking target wallet: ${getErrorMessage(e)}`);
    }
    
    // Check if the derived address has any coins
    if (keypair) {
      const derivedAddress = keypair.getPublicKey().toSuiAddress();
      const normalizedDerivedAddress = derivedAddress.startsWith('0x') ? derivedAddress : `0x${derivedAddress}`;
      
      if (normalizedDerivedAddress !== normalizedTargetAddress) {
        console.log(`\n💰 Checking balance for derived address ${normalizedDerivedAddress}...`);
        try {
          const { data: derivedCoins } = await client.getCoins({ owner: normalizedDerivedAddress });
          
          if (derivedCoins.length > 0) {
            console.log(`✅ Found ${derivedCoins.length} coins in derived wallet`);
            const suiCoins = derivedCoins.filter(coin => coin.coinType === '0x2::sui::SUI');
            if (suiCoins.length > 0) {
              const totalSui = suiCoins.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
              console.log(`💰 Derived wallet SUI balance: ${Number(totalSui) / 1_000_000_000} SUI`);
            }
          } else {
            console.log('⚠️ No coins found in derived wallet');
          }
        } catch (e: unknown) {
          console.log(`❌ Error checking derived wallet: ${getErrorMessage(e)}`);
        }
      }
    }
  } catch (error: unknown) {
    console.error('❌ Error connecting to network:', getErrorMessage(error));
  }

  console.log('\n📋 Instructions:');
  console.log('1. If a matching method was found above, update your client.ts to use that method for key derivation');
  console.log('2. If no match was found, you may need to obtain the correct private key for your target address');
  console.log('3. Or update your SUI_TARGET_ADDRESS in .env to use a different address');
}

main()
  .then(() => console.log('\n✨ Verification completed'))
  .catch((error: unknown) => console.error('❌ Verification failed:', getErrorMessage(error)));