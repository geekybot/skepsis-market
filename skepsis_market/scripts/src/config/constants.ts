/**
 * Configuration constants for interacting with Skepsis Market protocol
 */
export const CONSTANTS = {
  // Network RPC URLs
  NETWORKS: {
    MAINNET: 'https://fullnode.mainnet.sui.io:443',
    TESTNET: 'https://fullnode.testnet.sui.io:443',
    DEVNET: 'https://fullnode.devnet.sui.io:443',
    LOCAL: 'http://127.0.0.1:9000',
  },
  
  // Package IDs
  PACKAGES: {
    DISTRIBUTION_MARKET_FACTORY: '0x8d298cf6896904555d359565f0e7fb35236d6dfbfdf5a0fabf2f43c936f7951b',
    SKEPSIS_MARKET: '0x8d298cf6896904555d359565f0e7fb35236d6dfbfdf5a0fabf2f43c936f7951b',
    USDC: '0x8f000ab6d7d69f7dd429231a23e2aa472d61697c65b9f92cba770ab04ff7e983',
  },

  // Object IDs
  OBJECTS: {
    ADMIN_CAP: '0x84e9ccfe928db894edce2f81591aab9711c6225ebf95c66fc3102455a8ee4c16',
    FAUCET: '0x0f146f04e64d6e610e44a351c3fecf5666e6e49ab2fadfc9e2a93b6b5ea00466',
    CLOCK: '0x6',
  },
  
  // Module Names
  MODULES: {
    DISTRIBUTION_MARKET_FACTORY: 'distribution_market_factory',
    DISTRIBUTION_MARKET: 'distribution_market',
    DISTRIBUTION_AMM: 'distribution_amm',
    FAUCET: 'faucet',
    USDC: 'usdc',
  }
};

export default CONSTANTS;