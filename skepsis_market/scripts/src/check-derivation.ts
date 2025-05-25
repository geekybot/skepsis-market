import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
// import { fromBIP39Mnemonic } from '@mysten/bip32';
import * as dotenv from 'dotenv';
dotenv.config();

const mnemonic = process.env.SUI_MNEMONIC;
if (!mnemonic) {
  console.error('Error: SUI_MNEMONIC is not defined in the environment variables.');
  process.exit(1); // Exit the script with an error code
}
const path = "m/44'/784'/0'/0'/0'"; // Sui default derivation path

const keypair = Ed25519Keypair.deriveKeypair(
  mnemonic,
  path,
);
console.log(`Path: ${path}, Address: ${keypair.getPublicKey().toSuiAddress()}`);