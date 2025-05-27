import { log } from "console";
import { useState, useEffect, useCallback } from "react";

export interface Spread {
  spreadIndex: number;
  id: string;
  precision: number;
  lowerBound: number;
  upperBound: number;
  outstandingShares: number;
  outstandingSharesDisplay: string;
  displayRange: string;
  buyPrice: number;
  buyPriceDisplay: string;
  sellPrice: number | null;
  sellPriceDisplay: string;
  percentage: number; // calculated
}

export interface MarketInfo {
  success: boolean;
  marketId: string;
  basic: any;
  timing: any;
  liquidity: any;
  spreads: {
    count: number;
    details: Spread[];
  };
  error: string | null;
  metadata?: any;
}

export function useMarketInfo(url: string) {
  const [data, setData] = useState<MarketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url + `?t=${Date.now()}`); // cache bust
      if (!res.ok) throw new Error("Failed to fetch market info");
      const json: MarketInfo = await res.json();
      console.log("Fetched market info:============>", json);
      console.log(json);
      // Calculate spread percentages
      let spreads = json.spreads.details.map(s => ({ ...s }));
      const totalOutstanding = spreads.reduce((sum, s) => sum + s.outstandingShares, 0);
      if (totalOutstanding === 0) {
        const pct = 100 / (spreads.length || 1);
        spreads = spreads.map(s => ({ ...s, percentage: pct }));
      } else {
        spreads = spreads.map(s => ({
          ...s,
          percentage: (s.outstandingShares / totalOutstanding) * 100
        }));
      }
      // Sort spreads by percentage descending
      spreads.sort((a, b) => b.percentage - a.percentage);
      setData({ ...json, spreads: { ...json.spreads, details: spreads } });
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
