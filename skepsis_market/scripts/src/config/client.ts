import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX } from '@mysten/sui/utils';
import { fromB64 } from '@mysten/bcs';
import { CONSTANTS } from './constants';
import * as dotenv from 'dotenv';

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
 * Creates a keypair from a private key in the environment
 * @returns Ed25519Keypair instance or undefined if no private key is available
 */
export function getKeypairFromEnv(): Ed25519Keypair | undefined {
  const privateKey = process.env.SUI_PRIVATE_KEY;
  
  if (!privateKey) {
    console.warn('No private key found in environment. Set SUI_PRIVATE_KEY in .env file for transaction signing.');
    return undefined;
  }
  
  try {
    // Check if the private key is in Bech32 format (starts with suiprivkey)
    if (isSuiBech32PrivateKey(privateKey)) {
      console.log('Detected Bech32 encoded Sui private key');
      
      // For Bech32 keys, we need to extract the base64 part and decode it
      // The format is: suiprivkey1qzdkpfg...
      const base64Part = privateKey.slice(11); // Remove the "suiprivkey" prefix
      
      // Convert from base64 to bytes
      // The key follows the format: 32 bytes for private key + 1 byte for key scheme (0x00 for Ed25519)
      const keyBytes = fromB64(base64Part);
      
      // Extract the actual private key bytes (first 32 bytes)
      const privateKeyBytes = keyBytes.slice(0, 32);
      
      return Ed25519Keypair.fromSecretKey(privateKeyBytes);
    } else {
      // Handle hex format (original implementation)
      const privateKeyBytes = fromHEX(privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey);
      return Ed25519Keypair.fromSecretKey(privateKeyBytes);
    }
  } catch (error) {
    console.error('Failed to create keypair from private key:', error);
    return undefined;
  }
}

export default { getSuiClient, getKeypairFromEnv };