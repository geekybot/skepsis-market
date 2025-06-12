/**
 * Types for coin price data integration
 */

export interface CoinPrice {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdated: Date;
}

export interface CoinGeckoResponse {
  sui: {
    usd: number;
    usd_24h_change: number;
  };
}

export interface CoinMarketCapResponse {
  data: {
    SUI: {
      quote: {
        USD: {
          price: number;
          percent_change_24h: number;
          last_updated: string;
        };
      };
    };
  };
}

export interface PriceServiceError {
  message: string;
  type: 'network' | 'api' | 'parse' | 'rate_limit';
  timestamp: Date;
}
