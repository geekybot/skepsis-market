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
    DISTRIBUTION_MARKET_FACTORY: '0xabc23de3ea61d9d436cd663bdd3169a809c1382a0ac5065f4791ec9f051cdb52',
    SKEPSIS_MARKET: '0xabc23de3ea61d9d436cd663bdd3169a809c1382a0ac5065f4791ec9f051cdb52',
    USDC: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de',
  },

  // Object IDs
  OBJECTS: {
    ADMIN_CAP: '0x4739a65fbd4b174cef360a5c7a7cbdfd28015b86d540de93c80f1c5574d5425f',
    FAUCET: '0x0f146f04e64d6e610e44a351c3fecf5666e6e49ab2fadfc9e2a93b6b5ea00466',
    CLOCK: '0x6',
    POSITION_REGISTRY: '0x937b969d8b16844f4917def2b6ce96be18f6f13c301c6a5873449431404ca3d7',
    FACTORY: "0xdbe4a824d0f5192874deeb63faa43e6e99cff7fcda7f8187535cc688509b5798"
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