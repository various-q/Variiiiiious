export enum Recommendation {
  StrongBuy = 'شراء قوي',
  Buy = 'شراء',
  Hold = 'مراقبة',
  Sell = 'بيع',
  StrongSell = 'بيع قوي',
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  rsi: number;
  sector: string;
  recommendation: Recommendation;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  priceToBook: number;
  priceToEarningsRatio: number;
  marketCap: string;
  eps: number;
  dividendYield: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface HistoricalDataPoint {
  date: Date;
  price: number;
}

export interface PriceAlert {
  targetPrice: number;
  condition: 'above' | 'below';
}

export enum Sentiment {
    Positive = 'إيجابي',
    Negative = 'سلبي',
    Neutral = 'محايد',
}

export interface NewsArticle {
    id: string;
    source: string;
    headline: string;
    summary: string;
    url: string;
    publishedAt: Date;
    sentiment?: Sentiment;
}

export interface ScreenerCriteria {
  sectors?: string[];
  rsi?: { min?: number; max?: number };
  priceToEarningsRatio?: { min?: number; max?: number };
  marketCapInBillions?: { min?: number; max?: number };
  dividendYield?: { min?: number; max?: number };
  recommendation?: Recommendation[];
}