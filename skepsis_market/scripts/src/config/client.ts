import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX } from '@mysten/sui/utils';
import { fromB64 } from '@mysten/bcs';
import { CONSTANTS } from './constants';
import * as dotenv from 'dotenv';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

dotenv.config();

/**
 * Creates and returns a Sui client connected to the specified network
 * @param network The network to connect to (default: LOCAL)
 * @returns A configured SuiClient instance
 */
export function getSuiClient(network: keyof typeof CONSTANTS.NETWORKS = 'TESTNET'): SuiClient {
  return new SuiClient({ url: CONSTANTS.NETWORKS[network] });
}

/**
 * Determines if a string is a Bech32 encoded Sui private key
 * @param key The key to check
 * @returns True if the key is Bech32 encoded
 */
function isSuiBech32PrivateKey(key: string): boolean {
  return key.startsWith('suiprivkey');
}

/**
 * Creates a keypair from a mnemonic using the Sui default derivation path.
 * @returns Ed25519Keypair instance or undefined if no mnemonic is available
 */
function getKeypairFromMnemonic(): Ed25519Keypair | undefined {
  const mnemonic = process.env.SUI_MNEMONIC;
  if (!mnemonic) {
    console.error('Error: SUI_MNEMONIC is not defined in the environment variables.');
    process.exit(1); // Exit the script with an error code
  }
  if (!mnemonic) return undefined;
  try {
    const path = "m/44'/784'/0'/0'/0'";
    return Ed25519Keypair.deriveKeypair( mnemonic, path );
  } catch (e) {
    console.error('Failed to derive keypair from mnemonic:', e);
    return undefined;
  }
}

/**
 * Creates a keypair from a private key in the environment
 * @returns Ed25519Keypair instance or undefined if no private key is available
 */
export function getKeypairFromEnv(): Ed25519Keypair | undefined {
  // Try mnemonic first (preferred, matches check-derivation.ts)
  const mnemonicKeypair = getKeypairFromMnemonic();
  if (mnemonicKeypair) return mnemonicKeypair;
  
  const privateKey = process.env.SUI_PRIVATE_KEY;
  const targetAddress = process.env.SUI_TARGET_ADDRESS || '0x57400cf44ad97dac479671bb58b96d444e87972f09a6e17fa9650a2c60fbc054';
  
  if (!privateKey) {
    console.warn('No private key found in environment. Set SUI_PRIVATE_KEY in .env file for transaction signing.');
    return undefined;
  }
  
  try {
    // First, try to create keypair from different formats
    let keypair: Ed25519Keypair | undefined;
    
    // Attempt each key format parsing approach
    const attemptKeyFormats = [
      // Attempt 1: Try Bech32 format
      () => {
        if (privateKey.startsWith('suiprivkey')) {
          console.log('Attempting Bech32 format parsing...');
          const base64Part = privateKey.slice(11);
          const keyBytes = fromB64(base64Part);
          return Ed25519Keypair.fromSecretKey(keyBytes.slice(0, 32));
        }
        return undefined;
      },
      // Attempt 2: Try hex format with or without 0x prefix
      () => {
        const hexKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
        if (/^[0-9a-fA-F]{64}$/.test(hexKey)) {
          console.log('Attempting hex format parsing...');
          const privateKeyBytes = fromHEX(hexKey);
          return Ed25519Keypair.fromSecretKey(privateKeyBytes);
        }
        return undefined;
      },
      // Attempt 3: Try base64 format
      () => {
        try {
          console.log('Attempting base64 format parsing...');
          const keyBytes = fromB64(privateKey);
          if (keyBytes.length >= 32) {
            return Ed25519Keypair.fromSecretKey(keyBytes.slice(0, 32));
          }
        } catch (e) {}
        return undefined;
      },
    ];
    
    // Try each format in sequence
    for (const attempt of attemptKeyFormats) {
      try {
        keypair = attempt();
        if (keypair) {
          const derivedAddress = keypair.getPublicKey().toSuiAddress();
          const normalizedTargetAddress = targetAddress.startsWith('0x') ? targetAddress : `0x${targetAddress}`;
          const normalizedDerivedAddress = derivedAddress.startsWith('0x') ? derivedAddress : `0x${derivedAddress}`;
          
          console.log(`Derived address: ${normalizedDerivedAddress}`);
          
          // If we have a target address and this attempt matches, we're done
          if (normalizedDerivedAddress === normalizedTargetAddress) {
            console.log('✅ Found matching key format - keypair successfully derived!');
            return keypair;
          }
        }
      } catch (e) {
        // Continue to next attempt
      }
    }
    
    // If we reach here and have a keypair but it doesn't match the target address
    if (keypair) {
      const derivedAddress = keypair.getPublicKey().toSuiAddress();
      console.warn(`⚠️ Warning: Derived address ${derivedAddress} doesn't match target address ${targetAddress}`);
      
      // Ask if user wants to override in interactive mode
      if (process.stdout.isTTY) {
        console.log(`\nContinuing with address ${derivedAddress}. If this is incorrect, update your SUI_PRIVATE_KEY in .env`);
      }
      
      return keypair;
    }
    
    throw new Error('Could not parse private key in any supported format. Please check the key format.');
  } catch (error) {
    console.error('Failed to create keypair from private key:', error);
    return undefined;
  }
}

export default { getSuiClient, getKeypairFromEnv };