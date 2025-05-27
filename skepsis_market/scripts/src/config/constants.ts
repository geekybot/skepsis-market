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
    DISTRIBUTION_MARKET_FACTORY: '0xf8cac7e2af3e186a9821a6df801c2fadbf964403b1ba26757f2571a006d39284',
    USDC: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de',
    
  },

  // Object IDs
  OBJECTS: {
    ADMIN_CAP: '0xacf7625aeea4083dad749cf76a81316869ca53165449b0d868f578da62898021',
    FAUCET: '0x0f146f04e64d6e610e44a351c3fecf5666e6e49ab2fadfc9e2a93b6b5ea00466',
    CLOCK: '0x6',
    POSITION_REGISTRY: '0x607bb436a792e6302b413b5e9a6edcc4e5f664d576aa4071b6415f1c06d7b971',
    FACTORY: "0x6b8013e635b26842109a35ff573230bbe539c720478d1187336f4291a14358b1",
    LIQUIDITY_SHARE: "0xa769385a52146ab77a79a9af118a070476ec393c7e7201ceba840ddb49ffced5",
    MARKET: '0xab0a331a405c41c2682b4cd318b22915056fdcf5f8a5f852515ed18d94e3bac9'
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