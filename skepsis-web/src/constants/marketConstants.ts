
/**
 * Testnet contract addresses for Skepsis Protocol
 */
export const CONTRACT_ADDRESSES = {
  USDC: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de',
  FAUCET: '0xa101d25417a108a94b49f68f39adfbcd2e7d882dc039728ff1c0f7d85fca1cca',
  DISTRIBUTION_MARKET_FACTORY: '0xabc23de3ea61d9d436cd663bdd3169a809c1382a0ac5065f4791ec9f051cdb52',
  DIST_UPGRADE_CAP: '0xec4f9b57a1017956eb199b4e754e3f8f2e7d4d2dbf963fa2e9e474cf9e15e8ca',
  USER_POSITION_REGISTRY: '0x937b969d8b16844f4917def2b6ce96be18f6f13c301c6a5873449431404ca3d7',
  FACTORY: '0xdbe4a824d0f5192874deeb63faa43e6e99cff7fcda7f8187535cc688509b5798',
  DIST_ADMIN_CAP: '0x4739a65fbd4b174cef360a5c7a7cbdfd28015b86d540de93c80f1c5574d5425f',
  LIQUIDITY_SHARE: '0x03331428ec395b21a19d03370863a9f57fbebe71943b2383e6620e5fe8d0d921',
};

/**
 * Constants for interacting with Skepsis Market protocol
 */
export const MARKET_CONSTANTS = {
  // Module Names
  MODULES: {
    DISTRIBUTION_MARKET_FACTORY: 'distribution_market_factory',
    DISTRIBUTION_MARKET: 'distribution_market',
    DISTRIBUTION_AMM: 'distribution_amm',
  },
  
  // Function Names
  FUNCTIONS: {
    // Market factory functions
    // CREATE_MARKET: 'create_market',
    // GET_MARKET_LIST: 'get_market_list',

    // // Market query functions
    // GET_MARKET_INFO: 'get_market_info',
    // GET_MARKET_TIMINGS: 'get_market_timings',
    // GET_SPREAD_CONFIG: 'get_spread_config',
    // GET_LIQUIDITY_PARAMETERS: 'get_liquidity_parameters',

    // Trading functions
    BUY_EXACT_SHARES_WITH_MAX_INPUT: 'buy_exact_shares_with_max_input',
    SELL_EXACT_SHARES_FOR_MIN_OUTPUT: 'sell_exact_shares_for_min_output',

    // Position functions
    GET_USER_POSITIONS: 'get_user_positions',
    GET_POSITION_INFO: 'get_position_info',
    WITHDRAW_LIQUIDITY: 'withdraw_liquidity',

  },
};

// Basic market info - most data will be loaded dynamically via useLiveMarketInfo hook
export const BITCOIN_MARKET = {
  marketId: '0x10904622d7c95899091e6b19787e7a256dd7719298889d3cdf85f36bd589f498',
  name: 'Bitcoin Price on May 30th, 2025', // Fallback name if dynamic data isn't loaded yet
};

// Additional market IDs can be added here - full data will be loaded dynamically
export const ETHEREUM_MARKET = {
  marketId: '0xab0a331a405c41c2682b4cd318b22915056fdcf5f8a5f852515ed18d94e3bac9',
  name: 'Ethereum Price Prediction', // Fallback name
};

// Array of all available market IDs - full data will be loaded dynamically
export const MARKETS = [BITCOIN_MARKET, ETHEREUM_MARKET];

// Default market ID to use in prediction page
export const DEFAULT_MARKET_ID = BITCOIN_MARKET.marketId;