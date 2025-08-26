import { Recommendation } from './types';

export const STOCK_SYMBOLS = [
  // Tech Giants
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'QCOM',
  // Finance & Payments
  'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'C', 'PYPL', 'SQ',
  // Healthcare
  'JNJ', 'UNH', 'PFE', 'LLY', 'MRK', 'ABBV', 'TMO', 'MDT', 'GILD', 'ISRG',
  // Consumer Discretionary & Staples
  'WMT', 'PG', 'HD', 'COST', 'NKE', 'KO', 'PEP', 'MCD', 'SBUX', 'TGT', 'DIS',
  // Energy
  'XOM', 'CVX', 'SHEL', 'TTE', 'COP',
  // Industrials
  'BA', 'CAT', 'HON', 'GE', 'UPS', 'RTX', 'LMT',
  // Communications & Media
  'NFLX', 'CMCSA', 'TMUS', 'VZ',
  // Materials
  'LIN', 'APD', 'SHW',
  // Real Estate
  'AMT', 'PLD', 'EQIX',
  // Utilities
  'NEE', 'DUK', 'SO',
  // Mid & Small Cap / Growth
  'ETSY', 'PTON', 'ROKU', 'ZM', 'SPCE', 'PLTR', 'SNOW', 'U', 'RBLX', 'AFRM', 'SHOP',
  // Speculative & Penny Stocks
  'AMC', 'GME', 'BB', 'SNDL', 'PLUG', 'FCEL', 'NOK', 'F', 'AAL', 'CCL', 'MRO', 'ZNGA',
  'WKHS', 'RIDE', 'WISH', 'CLOV', 'SOFI', 'OPEN', 'TLRY', 'ACB', 'HEXO', 'OCGN',
  'NIO', 'XPEV', 'LI', 'RIVN', 'LCID'
];


export const RECOMMENDATION_CLASSES: { [key in Recommendation]: { text: string; bg: string; } } = {
  [Recommendation.StrongBuy]: { text: 'text-green-300', bg: 'bg-green-500/20' },
  [Recommendation.Buy]: { text: 'text-teal-300', bg: 'bg-teal-500/20' },
  [Recommendation.Hold]: { text: 'text-yellow-300', bg: 'bg-yellow-500/20' },
  [Recommendation.Sell]: { text: 'text-red-400', bg: 'bg-red-500/20' },
  [Recommendation.StrongSell]: { text: 'text-red-300', bg: 'bg-red-700/30' },
};