import { Stock, MarketIndex, Recommendation, HistoricalDataPoint, NewsArticle } from '../types';
import { STOCK_SYMBOLS } from '../constants';

// Expanded list of Arabic names and sectors
const arabicNames: { [key: string]: { name: string; sector: string } } = {
  'AAPL': { name: 'آبل', sector: 'التكنولوجيا' },
  'MSFT': { name: 'مايكروسوفت', sector: 'التكنولوجيا' },
  'GOOGL': { name: 'ألفابت (جوجل)', sector: 'التكنولوجيا' },
  'AMZN': { name: 'أمازون', sector: 'التجارة الإلكترونية' },
  'NVDA': { name: 'إنفيديا', sector: 'التكنولوجيا' },
  'TSLA': { name: 'تيسلا', sector: 'السيارات' },
  'META': { name: 'ميتا بلاتفورمز', sector: 'التكنولوجيا' },
  'AMD': { name: 'أدفانسد مايكرو ديفايسز', sector: 'التكنولوجيا' },
  'INTC': { name: 'إنتل', sector: 'التكنولوجيا' },
  'CRM': { name: 'سيلز فورس', sector: 'التكنولوجيا' },
  'ORCL': { name: 'أوراكل', sector: 'التكنولوجيا' },
  'ADBE': { name: 'أدوبي', sector: 'التكنولوجيا' },
  'QCOM': { name: 'كوالكوم', sector: 'التكنولوجيا' },
  'JPM': { name: 'جي بي مورغان تشيس', sector: 'الخدمات المالية' },
  'V': { name: 'فيزا', sector: 'الخدمات المالية' },
  'MA': { name: 'ماستركارد', sector: 'الخدمات المالية' },
  'BAC': { name: 'بنك أوف أمريكا', sector: 'الخدمات المالية' },
  'WFC': { name: 'ويلز فارجو', sector: 'الخدمات المالية' },
  'GS': { name: 'غولدمان ساكس', sector: 'الخدمات المالية' },
  'MS': { name: 'مورغان ستانلي', sector: 'الخدمات المالية' },
  'C': { name: 'سيتي جروب', sector: 'الخدمات المالية' },
  'PYPL': { name: 'باي بال', sector: 'التكنولوجيا المالية' },
  'SQ': { name: 'بلوك (سكوير سابقًا)', sector: 'التكنولوجيا المالية' },
  'JNJ': { name: 'جونسون آند جونسون', sector: 'الرعاية الصحية' },
  'UNH': { name: 'يونايتد هيلث', sector: 'الرعاية الصحية' },
  'PFE': { name: 'فايزر', sector: 'الرعاية الصحية' },
  'LLY': { name: 'إيلي ليلي', sector: 'الرعاية الصحية' },
  'MRK': { name: 'ميرك', sector: 'الرعاية الصحية' },
  'ABBV': { name: 'آب في', sector: 'الرعاية الصحية' },
  'TMO': { name: 'ثيرمو فيشر ساينتفك', sector: 'الرعاية الصحية' },
  'MDT': { name: 'مدترونيك', sector: 'الرعاية الصحية' },
  'GILD': { name: 'جلعاد ساينسز', sector: 'الرعاية الصحية' },
  'ISRG': { name: 'إنتويتيف سيرجيكال', sector: 'الرعاية الصحية' },
  'WMT': { name: 'وول مارت', sector: 'التجزئة' },
  'PG': { name: 'بروكتر وغامبل', sector: 'السلع الاستهلاكية' },
  'HD': { name: 'هوم ديبوت', sector: 'التجزئة' },
  'COST': { name: 'كوستكو', sector: 'التجزئة' },
  'NKE': { name: 'نايكي', sector: 'الملابس' },
  'KO': { name: 'كوكا كولا', sector: 'المشروبات' },
  'PEP': { name: 'بيبسيكو', sector: 'المشروبات' },
  'MCD': { name: 'ماكدونالدز', sector: 'المطاعم' },
  'SBUX': { name: 'ستاربكس', sector: 'المطاعم' },
  'TGT': { name: 'تارجت', sector: 'التجزئة' },
  'DIS': { name: 'والت ديزني', sector: 'الإعلام والترفيه' },
  'XOM': { name: 'إكسون موبيل', sector: 'الطاقة' },
  'CVX': { name: 'شيفرون', sector: 'الطاقة' },
  'SHEL': { name: 'شل', sector: 'الطاقة' },
  'TTE': { name: 'توتال إنرجيز', sector: 'الطاقة' },
  'COP': { name: 'كونوكو فيليبس', sector: 'الطاقة' },
  'BA': { name: 'بوينج', sector: 'الطيران والدفاع' },
  'CAT': { name: 'كاتربيلر', sector: 'الصناعات الثقيلة' },
  'HON': { name: 'هانيويل', sector: 'الصناعات المتنوعة' },
  'GE': { name: 'جنرال إلكتريك', sector: 'الصناعات المتنوعة' },
  'UPS': { name: 'يو بي إس', sector: 'الخدمات اللوجستية' },
  'RTX': { name: 'آر تي إكس (ريثيون)', sector: 'الطيران والدفاع' },
  'LMT': { name: 'لوكهيد مارتن', sector: 'الطيران والدفاع' },
  'NFLX': { name: 'نتفليكس', sector: 'الإعلام والترفيه' },
  'CMCSA': { name: 'كومكاست', sector: 'الإعلام والترفيه' },
  'TMUS': { name: 'تي موبايل', sector: 'الاتصالات' },
  'VZ': { name: 'فيرايزون', sector: 'الاتصالات' },
  'LIN': { name: 'ليندي', sector: 'الكيماويات' },
  'APD': { name: 'إير برودكتس', sector: 'الكيماويات' },
  'SHW': { name: 'شيروين وليامز', sector: 'الكيماويات' },
  'AMT': { name: 'أمريكان تاور', sector: 'العقارات' },
  'PLD': { name: 'برولوجيس', sector: 'العقارات' },
  'EQIX': { name: 'إكوينيكس', sector: 'العقارات' },
  'NEE': { name: 'نيكست إيرا إنرجي', sector: 'المرافق' },
  'DUK': { name: 'دوك إنرجي', sector: 'المرافق' },
  'SO': { name: 'ساذرن كومباني', sector: 'المرافق' },
  'ETSY': { name: 'إيتسي', sector: 'التجارة الإلكترونية' },
  'PTON': { name: 'بيلوتون', sector: 'معدات رياضية' },
  'ROKU': { name: 'روكو', sector: 'الإعلام الرقمي' },
  'ZM': { name: 'زووم', sector: 'التكنولوجيا' },
  'SPCE': { name: 'فيرجن غالاكتيك', sector: 'الفضاء' },
  'PLTR': { name: 'بالانتير', sector: 'البرمجيات' },
  'SNOW': { name: 'سنوفليك', sector: 'البرمجيات' },
  'U': { name: 'يونيتي سوفتوير', sector: 'البرمجيات' },
  'RBLX': { name: 'روبلوكس', sector: 'الألعاب' },
  'AFRM': { name: 'أفيرم', sector: 'التكنولوجيا المالية' },
  'SHOP': { name: 'شوبيفاي', sector: 'التجارة الإلكترونية' },
  'AMC': { name: 'إيه إم سي للترفيه', sector: 'الترفيه' },
  'GME': { name: 'جيم ستوب', sector: 'التجزئة' },
  'BB': { name: 'بلاك بيري', sector: 'البرمجيات' },
  'SNDL': { name: 'سنديال جروورز', sector: 'القنب' },
  'PLUG': { name: 'بلج باور', sector: 'الطاقة النظيفة' },
  'FCEL': { name: 'فيول سيل إنرجي', sector: 'الطاقة النظيفة' },
  'NOK': { name: 'نوكيا', sector: 'الاتصالات' },
  'F': { name: 'فورد', sector: 'السيارات' },
  'AAL': { name: 'أمريكان إيرلاينز', sector: 'الطيران' },
  'CCL': { name: 'كارنيفال كورب', sector: 'السياحة' },
  'MRO': { name: 'ماراثون أويل', sector: 'الطاقة' },
  'ZNGA': { name: 'زينجا', sector: 'الألعاب' },
  'WKHS': { name: 'وورك هورس', sector: 'السيارات الكهربائية' },
  'RIDE': { name: 'لوردستاون موتورز', sector: 'السيارات الكهربائية' },
  'WISH': { name: 'كونتيكست لوجيك', sector: 'التجارة الإلكترونية' },
  'CLOV': { name: 'كلوفر هيلث', sector: 'الرعاية الصحية' },
  'SOFI': { name: 'سوفي تكنولوجيز', sector: 'التكنولوجيا المالية' },
  'OPEN': { name: 'أوبن دور', sector: 'العقارات' },
  'TLRY': { name: 'تيلراي', sector: 'القنب' },
  'ACB': { name: 'أورورا كانابيس', sector: 'القنب' },
  'HEXO': { name: 'هيكسو كورب', sector: 'القنب' },
  'OCGN': { name: 'أوكوجين', sector: 'التكنولوجيا الحيوية' },
  'NIO': { name: 'نيو', sector: 'السيارات الكهربائية' },
  'XPEV': { name: 'إكسبينج', sector: 'السيارات الكهربائية' },
  'LI': { name: 'لي أوتو', sector: 'السيارات الكهربائية' },
  'RIVN': { name: 'ريفيان', sector: 'السيارات الكهربائية' },
  'LCID': { name: 'لوسيد موتورز', sector: 'السيارات الكهربائية' },
};


const getRecommendation = (stock: Omit<Stock, 'recommendation'>): Recommendation => {
  let score = 0;

  // RSI based score
  if (stock.rsi < 30) score += 40; // Strong oversold signal
  else if (stock.rsi < 40) score += 20;
  else if (stock.rsi > 70) score -= 30; // Overbought
  else if (stock.rsi > 60) score -= 15;

  // Price vs 52-week range score
  const priceRangePosition = (stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow);
  if (priceRangePosition < 0.1) score += 25; // Very close to 52-week low, potential bounce
  else if (priceRangePosition < 0.25) score += 10;
  else if (priceRangePosition > 0.9) score -= 20; // Near 52-week high, potential pullback

  // P/B ratio score (simplified)
  if (stock.priceToBook < 1.5 && stock.priceToBook > 0) score += 15; // Potentially undervalued
  else if (stock.priceToBook > 5) score -= 10; // Potentially overvalued

  // P/E ratio score (simplified)
  if (stock.priceToEarningsRatio < 15 && stock.priceToEarningsRatio > 0) score += 10; // Low P/E can be a good sign
  else if (stock.priceToEarningsRatio > 35) score -= 15; // High P/E can be a bad sign

  // New factors
  if (stock.eps > 0) score += 10;
  if (stock.dividendYield > 2) score += 5;

  // Map score to recommendation
  if (score >= 60) return Recommendation.StrongBuy;
  if (score >= 30) return Recommendation.Buy;
  if (score <= -55) return Recommendation.StrongSell;
  if (score <= -30) return Recommendation.Sell;
  return Recommendation.Hold;
};


const generateRandomStockData = (symbol: string): Stock => {
  const lowPriceSymbols = ['SNDL', 'AMC', 'BB', 'PLUG', 'FCEL', 'NOK', 'F', 'AAL', 'CCL', 'MRO', 'ZNGA', 'WKHS', 'RIDE', 'WISH', 'CLOV', 'ACB', 'HEXO', 'OCGN'];
  const isLowPrice = lowPriceSymbols.includes(symbol);
  
  const price = isLowPrice 
    ? parseFloat((Math.random() * 15 + 0.5).toFixed(2))
    : parseFloat((Math.random() * 600 + 20).toFixed(2));
    
  const changePercent = (Math.random() - 0.5) * 8;
  const change = (price * changePercent) / 100;
  const rsi = Math.random() * 100;
  const volume = `${(Math.random() * 50 + 1).toFixed(2)}M`;
  
  const fiftyTwoWeekHigh = price * (Math.random() * 0.8 + 1.1);
  const fiftyTwoWeekLow = price * (1 - (Math.random() * 0.7 + 0.05));
  const priceToBook = Math.random() * 8 + 0.8;
  const priceToEarningsRatio = Math.random() * 45 + 5;

  const marketCapValue = (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'].includes(symbol)) 
    ? (Math.random() * 1.5 + 1.5) * 1000 // In billions for calculation
    : (Math.random() * 300 + 5);
  
  const formatMarketCap = (value: number) => {
      if (value >= 1000) {
          return `${(value / 1000).toFixed(2)}T`;
      }
      return `${value.toFixed(1)}B`;
  }

  const stockData = {
    symbol,
    name: arabicNames[symbol]?.name || symbol,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume,
    rsi: parseFloat(rsi.toFixed(2)),
    sector: arabicNames[symbol]?.sector || 'غير محدد',
    fiftyTwoWeekHigh: parseFloat(fiftyTwoWeekHigh.toFixed(2)),
    fiftyTwoWeekLow: parseFloat(fiftyTwoWeekLow.toFixed(2)),
    priceToBook: parseFloat(priceToBook.toFixed(2)),
    priceToEarningsRatio: parseFloat(priceToEarningsRatio.toFixed(2)),
    marketCap: formatMarketCap(marketCapValue),
    eps: parseFloat((Math.random() * 15 - 2).toFixed(2)),
    dividendYield: parseFloat((Math.random() * 4).toFixed(2)),
  };

  return {
      ...stockData,
      recommendation: getRecommendation(stockData)
  };
};

let _initialPrices = new Map<string, number>();

export const fetchTrendingStocks = async (): Promise<Stock[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stocks = STOCK_SYMBOLS.map(generateRandomStockData);
      // Store the "opening price" for consistent change calculation in the stream
      if (_initialPrices.size === 0) {
        stocks.forEach(stock => {
            _initialPrices.set(stock.symbol, stock.price - stock.change);
        });
      }
      resolve(stocks);
    }, 1000);
  });
};

// --- WebSocket implementation with Reconnection Logic ---
let ws: WebSocket | null = null;
let simulationInterval: number | null = null;
let reconnectTimeoutId: number | null = null;
let reconnectAttempts = 0;
let isIntentionallyClosed = false;

const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const WEBSOCKET_URL = 'wss://echo.websocket.events'; // Public Echo WebSocket

type ConnectionStatus = 'connecting' | 'live' | 'disconnected' | 'reconnecting';
type OnStatusChangeCallback = (status: ConnectionStatus) => void;

function scheduleReconnect(
    currentStocks: Stock[],
    onUpdate: (updatedStocks: Partial<Stock>[]) => void,
    onStatusChange: OnStatusChangeCallback
) {
    if (reconnectTimeoutId || isIntentionallyClosed) {
        return;
    }
    
    // Exponential backoff
    const delay = Math.min(
        INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
        MAX_RECONNECT_DELAY
    );

    reconnectAttempts++;
    console.log(`WebSocket connection lost. Reconnecting in ${delay / 1000} seconds... (Attempt ${reconnectAttempts})`);
    onStatusChange('reconnecting');
    
    reconnectTimeoutId = window.setTimeout(() => {
        reconnectTimeoutId = null;
        connectToStockStream(currentStocks, onUpdate, onStatusChange);
    }, delay);
}


export const connectToStockStream = (
    currentStocks: Stock[],
    onUpdate: (updatedStocks: Partial<Stock>[]) => void,
    onStatusChange: OnStatusChangeCallback
) => {
    if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
        return; // Connection already active or in progress
    }
    
    // If this is a fresh manual connection, reset flags.
    if (reconnectAttempts === 0) {
        isIntentionallyClosed = false;
    }

    onStatusChange('connecting');
    ws = new WebSocket(WEBSOCKET_URL);

    let stocksForStream = JSON.parse(JSON.stringify(currentStocks));

    ws.onopen = () => {
        onStatusChange('live');
        reconnectAttempts = 0; // Reset on successful connection
        if (reconnectTimeoutId) {
            clearTimeout(reconnectTimeoutId);
            reconnectTimeoutId = null;
        }

        // Start simulating and sending data updates via the echo server
        simulationInterval = window.setInterval(() => {
            if (ws?.readyState !== WebSocket.OPEN) return;

            const updates: Partial<Stock>[] = [];
            const numUpdates = Math.floor(Math.random() * 8) + 1;

            for (let i = 0; i < numUpdates; i++) {
                const stockIndex = Math.floor(Math.random() * stocksForStream.length);
                const stockToUpdate = stocksForStream[stockIndex];
                
                const volatility = 0.02; // Max 2% price change per tick
                const newPrice = stockToUpdate.price * (1 + (Math.random() - 0.5) * volatility);
                const openPrice = _initialPrices.get(stockToUpdate.symbol) || (stockToUpdate.price - stockToUpdate.change);
                
                const change = newPrice - openPrice;
                const changePercent = (change / openPrice) * 100;
                
                const updatedFields: Partial<Stock> = {
                    symbol: stockToUpdate.symbol,
                    price: parseFloat(newPrice.toFixed(2)),
                    change: parseFloat(change.toFixed(2)),
                    changePercent: parseFloat(changePercent.toFixed(2)),
                };

                stocksForStream[stockIndex] = { ...stockToUpdate, ...updatedFields };
                updates.push(updatedFields);
            }

            if (updates.length > 0) {
                try {
                   ws?.send(JSON.stringify(updates));
                } catch (error) {
                    console.error("Failed to send WebSocket message:", error);
                }
            }
        }, 1500);
    };

    ws.onmessage = (event) => {
        try {
            // The echo server sends back our data. In a real app, this data would originate from the server.
            const data = event.data;
            // Public echo servers can send welcome messages. Ensure we only parse our JSON array data.
            if (typeof data === 'string' && data.startsWith('[')) {
                const updates = JSON.parse(data);
                onUpdate(updates);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket connection failed. The "onclose" event will trigger shortly, initiating reconnection if applicable.');
    };

    ws.onclose = () => {
        onStatusChange('disconnected');
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
        ws = null;
        
        if (!isIntentionallyClosed) {
            scheduleReconnect(currentStocks, onUpdate, onStatusChange);
        }
    };
};

export const disconnectFromStockStream = () => {
    isIntentionallyClosed = true;
    reconnectAttempts = 0; // Reset state
    if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
    }
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
    if (ws) {
        ws.onclose = null; // Prevent the onclose handler from running on explicit disconnection
        ws.close();
        ws = null;
    }
};

export const fetchMarketSummary = async (): Promise<MarketIndex[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const indices: MarketIndex[] = [
                {
                    name: 'S&P 500',
                    value: parseFloat((Math.random() * 500 + 5000).toFixed(2)),
                    change: parseFloat(((Math.random() - 0.5) * 100).toFixed(2)),
                    changePercent: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
                },
                {
                    name: 'Dow Jones',
                    value: parseFloat((Math.random() * 1000 + 38000).toFixed(2)),
                    change: parseFloat(((Math.random() - 0.5) * 300).toFixed(2)),
                    changePercent: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
                },
                {
                    name: 'NASDAQ',
                    value: parseFloat((Math.random() * 800 + 17000).toFixed(2)),
                    change: parseFloat(((Math.random() - 0.5) * 200).toFixed(2)),
                    changePercent: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
                },
            ];
            resolve(indices);
        }, 500);
    });
};

export const fetchHistoricalData = async (
  symbol: string,
  range: '1D' | '1W' | '1M',
  currentPrice: number
): Promise<HistoricalDataPoint[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data: HistoricalDataPoint[] = [];
      const now = new Date();
      let numPoints = 0;
      let timeStep = 0; // in milliseconds

      switch (range) {
        case '1D':
          numPoints = 24; // Hourly for 24 hours
          timeStep = 60 * 60 * 1000;
          break;
        case '1W':
          numPoints = 7; // Daily for 1 week
          timeStep = 24 * 60 * 60 * 1000;
          break;
        case '1M':
          numPoints = 30; // Daily for 1 month
          timeStep = 24 * 60 * 60 * 1000;
          break;
      }

      let price = currentPrice;
      // Generate points backwards from now
      for (let i = numPoints - 1; i >= 0; i--) {
        if (i < numPoints - 1) {
          // Fluctuate price based on previous point
          const volatility = 0.05; // 5% volatility
          const changePercent = (Math.random() - 0.5) * volatility;
          price = price / (1 + changePercent);
        }
        data.unshift({
          date: new Date(now.getTime() - i * timeStep),
          price: parseFloat(price.toFixed(2)),
        });
      }
      
      // Ensure the last point is the current price
      if (data.length > 0) {
        data[data.length - 1].price = currentPrice;
      }

      resolve(data);
    }, 700);
  });
};

export const fetchNewsForStock = async (symbol: string): Promise<NewsArticle[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const companyName = arabicNames[symbol]?.name || symbol;
            const newsItems: NewsArticle[] = [
                { id: '1', source: 'رويترز', headline: `إيرادات ${companyName} تفوق التوقعات في الربع الأخير`, summary: 'أعلنت الشركة عن نتائج مالية قوية، مما دفع السهم للارتفاع في تداولات ما بعد الإغلاق.', url: '#', publishedAt: new Date(Date.now() - 86400000 * 1) },
                { id: '2', source: 'بلومبرغ', headline: `تحليل: ${companyName} تواجه تحديات في سلسلة التوريد`, summary: 'يشير المحللون إلى أن المشاكل اللوجستية قد تؤثر على أداء الشركة في النصف الثاني من العام.', url: '#', publishedAt: new Date(Date.now() - 86400000 * 2) },
                { id: '3', source: 'وول ستريت جورنال', headline: `إطلاق منتج جديد من ${companyName} يثير حماس المستثمرين`, summary: 'كشفت الشركة عن منتج مبتكر يتوقع أن يعزز مكانتها في السوق.', url: '#', publishedAt: new Date(Date.now() - 86400000 * 3) },
            ];
            resolve(newsItems);
        }, 800);
    });
};