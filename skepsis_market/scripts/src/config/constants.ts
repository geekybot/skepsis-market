
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
    DISTRIBUTION_MARKET_FACTORY: '0x7b9871542550d47c1d3caaac29c4a1d2ad9527c53f666d813a28be2c8155758e',
    USDC: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de'
    
  },
  
  // Object IDs
  OBJECTS: {
    ADMIN_CAP: '0xacf7625aeea4083dad749cf76a81316869ca53165449b0d868f578da62898021',
    FAUCET: '0x0f146f04e64d6e610e44a351c3fecf5666e6e49ab2fadfc9e2a93b6b5ea00466',
    CLOCK: '0x6',
    POSITION_REGISTRY: '0x004881fb1b7202d503986585e209638ab0644a2220017be049d1a342803d3080',
    FACTORY: "0x0dbeece3734a8e11d072db998f40ec162db2559ca3e3c8153be5be8210d92e3f",
    LIQUIDITY_SHARE: "0x19cabb01a2433934dce9579e4355c14e731af30a355e9d3507a5eaccbc72555e",
    MARKET: '0x864435f0e788ae4187d43696ca1181dfaa4f97d6ceb9ca41f4d2b459a1934c8d'
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