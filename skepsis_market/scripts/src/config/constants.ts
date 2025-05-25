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
    DISTRIBUTION_MARKET_FACTORY: '0xf950d9f3f459d492b6d8fbc1359b4f4a9a05fe01a30b9261be6464551512327b',
    USDC: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de',
    
  },

  // Object IDs
  OBJECTS: {
    ADMIN_CAP: '0x4739a65fbd4b174cef360a5c7a7cbdfd28015b86d540de93c80f1c5574d5425f',
    FAUCET: '0x0f146f04e64d6e610e44a351c3fecf5666e6e49ab2fadfc9e2a93b6b5ea00466',
    CLOCK: '0x6',
    POSITION_REGISTRY: '0xc83af0fb9df0d764104552f00343650af13505b3ad882b70d67db786679d86ac',
    FACTORY: "0xa688fad8e8d3d971e8745c2927c1ddb98d32e14c1efcb486354c9dc8dac8edec",
    LIQUIDITY_SHARE: "0xfee924a24c993345a4d678f61339bf7087d8cb2f8a76d0c7e9e521a2ccf617d5",
    MARKET: '0x05ad103911b8cf3ae3a52c94ede806ba121efcb1ab8361bb24e0b1a3330aa9bf'
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