import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Stock, Recommendation, PriceAlert, ScreenerCriteria } from '../types';
import { fetchTrendingStocks, connectToStockStream, disconnectFromStockStream } from '../services/stockService';
import { getScreenerCriteriaFromQuery } from '../services/geminiService';
import { RECOMMENDATION_CLASSES } from '../constants';
import StockRow from './StockRow';
import StockDetailModal from './StockDetailModal';
import AIScreener from './AIScreener';
import { Search, SlidersHorizontal, ArrowUpDown, AlertCircle, Bell, X, Star, XCircle, Wifi } from 'lucide-react';

const recommendationOrder: { [key in Recommendation]: number } = {
  [Recommendation.StrongBuy]: 1,
  [Recommendation.Buy]: 2,
  [Recommendation.Hold]: 3,
  [Recommendation.Sell]: 4,
  [Recommendation.StrongSell]: 5,
};

type SortOption = 'recommendation' | 'price_asc';
type FilterOption = Recommendation | 'all' | 'watchlist';


interface Notification {
    id: number;
    message: string;
    symbol: string;
}

interface StockTableProps {
    onStocksChange: (stocks: Stock[]) => void;
}

const parseMarketCap = (marketCap: string): number => {
    const value = parseFloat(marketCap);
    if (marketCap.toUpperCase().endsWith('T')) {
        return value * 1000; // Return in billions
    }
    if (marketCap.toUpperCase().endsWith('B')) {
        return value; // Already in billions
    }
    return value / 1_000_000_000; // Assume it's a raw number
};

const StockTable: React.FC<StockTableProps> = ({ onStocksChange }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'live' | 'disconnected' | 'reconnecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommendation');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [alerts, setAlerts] = useState<{ [symbol: string]: PriceAlert }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const triggeredAlertsRef = useRef<Set<string>>(new Set());

  const [aiCriteria, setAiCriteria] = useState<ScreenerCriteria | null>(null);
  const [isScreening, setIsScreening] = useState(false);
  const [screenerError, setScreenerError] = useState<string | null>(null);
  
  const [watchlist, setWatchlist] = useState<Set<string>>(() => {
    try {
        const saved = localStorage.getItem('watchlist');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
        return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(Array.from(watchlist)));
  }, [watchlist]);

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
        const newSet = new Set(prev);
        if (newSet.has(symbol)) {
            newSet.delete(symbol);
        } else {
            newSet.add(symbol);
        }
        return newSet;
    });
  }, []);

  const addNotification = useCallback((stock: Stock, alert: PriceAlert) => {
    const message = `تنبيه: ${stock.name} (${stock.symbol}) ${alert.condition === 'above' ? 'تجاوز' : 'انخفض تحت'} السعر المستهدف ${alert.targetPrice.toFixed(2)}$. السعر الحالي: $${stock.price.toFixed(2)}`;
    setNotifications(prev => [...prev, { id: Date.now(), symbol: stock.symbol, message }]);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setDataLoaded(false);
    setError(null);
    setConnectionStatus('disconnected');
    try {
      const data = await fetchTrendingStocks();
      setStocks(data);
      onStocksChange(data);
      setDataLoaded(true); // Signal that initial data is ready for streaming
      
      Object.entries(alerts).forEach(([symbol, alert]) => {
          if (triggeredAlertsRef.current.has(symbol)) return;
          const stock = data.find(s => s.symbol === symbol);
          if (!stock) return;

          const conditionMet = 
            (alert.condition === 'above' && stock.price > alert.targetPrice) ||
            (alert.condition === 'below' && stock.price < alert.targetPrice);
          
          if (conditionMet) {
              addNotification(stock, alert);
              triggeredAlertsRef.current.add(symbol);
          }
      });
    } catch (err) {
      setError('حدث خطأ أثناء جلب بيانات الأسهم. يرجى المحاولة مرة أخرى.');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [alerts, addNotification, onStocksChange]);

  // Initial data fetch effect
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time data stream effect
  useEffect(() => {
    if (!dataLoaded || stocks.length === 0) {
      return;
    }
    
    const handleUpdate = (updates: Partial<Stock>[]) => {
      setIsRefreshing(true); // Show a brief activity indicator
      const updatesMap = new Map(updates.map(u => [u.symbol, u]));

      setStocks(prevStocks => {
        const newStocks = prevStocks.map(stock => {
          if (updatesMap.has(stock.symbol)) {
            return { ...stock, ...updatesMap.get(stock.symbol) };
          }
          return stock;
        });
        onStocksChange(newStocks);
        return newStocks;
      });

      setTimeout(() => setIsRefreshing(false), 500); // Hide indicator after update
    };
    
    // The service now handles connection and status updates via callbacks.
    connectToStockStream(stocks, handleUpdate, setConnectionStatus);

    return () => {
      disconnectFromStockStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, onStocksChange]); // `stocks` is intentionally omitted to prevent reconnecting on every update
  
  useEffect(() => {
    if (selectedStock) {
      const updatedStock = stocks.find(s => s.symbol === selectedStock.symbol);
      if (updatedStock && JSON.stringify(updatedStock) !== JSON.stringify(selectedStock)) {
        setSelectedStock(updatedStock);
      }
    }
  }, [stocks, selectedStock]);
  
  const handleScreenQuery = useCallback(async (query: string) => {
    setIsScreening(true);
    setScreenerError(null);
    try {
        const criteria = await getScreenerCriteriaFromQuery(query);
        if (Object.keys(criteria).length === 0) {
            setScreenerError("لم أتمكن من تحديد معايير فلترة من طلبك. حاول أن تكون أكثر تحديداً.");
            setAiCriteria(null);
        } else {
            setAiCriteria(criteria);
        }
    } catch (error) {
        setScreenerError(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
        setAiCriteria(null);
    } finally {
        setIsScreening(false);
    }
  }, []);

  const handleClearScreener = useCallback(() => {
    setAiCriteria(null);
    setScreenerError(null);
  }, []);


  const filteredStocks = useMemo(() => {
    return stocks
      .filter(stock => { // AI Screener Filter
        if (!aiCriteria) return true;
        const { sectors, rsi, priceToEarningsRatio, marketCapInBillions, dividendYield, recommendation } = aiCriteria;
        if (sectors?.length && !sectors.includes(stock.sector)) return false;
        if (rsi) {
            if (rsi.min !== undefined && stock.rsi < rsi.min) return false;
            if (rsi.max !== undefined && stock.rsi > rsi.max) return false;
        }
        if (priceToEarningsRatio) {
            if (priceToEarningsRatio.min !== undefined && stock.priceToEarningsRatio < priceToEarningsRatio.min) return false;
            if (priceToEarningsRatio.max !== undefined && stock.priceToEarningsRatio > priceToEarningsRatio.max) return false;
        }
        if (marketCapInBillions) {
            const stockMarketCap = parseMarketCap(stock.marketCap);
            if (marketCapInBillions.min !== undefined && stockMarketCap < marketCapInBillions.min) return false;
            if (marketCapInBillions.max !== undefined && stockMarketCap > marketCapInBillions.max) return false;
        }
        if (dividendYield) {
            if (dividendYield.min !== undefined && stock.dividendYield < dividendYield.min) return false;
            if (dividendYield.max !== undefined && stock.dividendYield > dividendYield.max) return false;
        }
        if (recommendation?.length && !recommendation.includes(stock.recommendation)) return false;
        return true;
      })
      .filter(stock => { // Manual Filters
        if (filter === 'all') return true;
        if (filter === 'watchlist') return watchlist.has(stock.symbol);
        return stock.recommendation === filter;
      })
      .filter(stock => 
        stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => { // Sorting
        if (sortBy === 'price_asc') {
            return a.price - b.price;
        }
        const orderA = recommendationOrder[a.recommendation];
        const orderB = recommendationOrder[b.recommendation];
        if (orderA !== orderB) return orderA - orderB;
        if (orderA <= 2) return a.rsi - b.rsi;
        return b.rsi - a.rsi;
      });
  }, [stocks, searchTerm, filter, sortBy, watchlist, aiCriteria]);
  
  const handleRowClick = (stock: Stock) => setSelectedStock(stock);
  const closeModal = () => setSelectedStock(null);

  const handleSetAlert = useCallback((symbol: string, alert: PriceAlert) => {
      setAlerts(prev => ({ ...prev, [symbol]: alert }));
      triggeredAlertsRef.current.delete(symbol);
  }, []);

  const handleRemoveAlert = useCallback((symbol:string) => {
      setAlerts(prev => {
          const newAlerts = { ...prev };
          delete newAlerts[symbol];
          return newAlerts;
      });
      triggeredAlertsRef.current.delete(symbol);
  }, []);

  const handleDismissNotification = useCallback((id: number) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const statusIndicators = {
      live: { text: 'متصل - بيانات حية', color: 'text-green-500 dark:text-green-400', pulse: true },
      connecting: { text: 'جاري الاتصال...', color: 'text-yellow-500 dark:text-yellow-400', pulse: true },
      reconnecting: { text: 'إعادة الاتصال...', color: 'text-orange-500 dark:text-orange-400', pulse: true },
      disconnected: { text: 'غير متصل', color: 'text-gray-500 dark:text-gray-400', pulse: false },
  };
  const currentStatus = statusIndicators[connectionStatus];

  return (
    <section>
        <AIScreener 
            onScreen={handleScreenQuery}
            isScreening={isScreening}
            activeCriteria={!!aiCriteria}
            onClear={handleClearScreener}
        />
        {screenerError && (
             <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
                <AlertCircle size={18} />
                <span>{screenerError}</span>
                <button onClick={() => setScreenerError(null)} className="ms-auto p-1 rounded-full hover:bg-red-500/20"><XCircle size={18} /></button>
            </div>
        )}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="ابحث بالرمز أو الاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 ps-10 pe-4 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          />
          <Search className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" size={20}/>
        </div>
        <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="w-full md:w-auto appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 ps-10 pe-4 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            >
              <option value="all">كل التوصيات</option>
              <option value="watchlist">المفضلة</option>
              {Object.values(Recommendation).map(rec => (
                <option key={rec} value={rec}>{rec}</option>
              ))}
            </select>
            <SlidersHorizontal className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 pointer-events-none" size={20}/>
        </div>
        <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full md:w-auto appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 ps-10 pe-4 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            >
              <option value="recommendation">ترتيب حسب التوصية</option>
              <option value="price_asc">السعر: من الأقل للأعلى</option>
            </select>
            <ArrowUpDown className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 pointer-events-none" size={20}/>
        </div>
      </div>

      <div className="flex justify-end items-center mb-2 h-5">
        {!loading && (
          <div className={`flex items-center gap-2 text-sm ${currentStatus.color}`}>
            <Wifi size={14} className={currentStatus.pulse ? 'animate-pulse' : ''} />
            <span>{currentStatus.text}</span>
          </div>
        )}
        {isRefreshing && connectionStatus === 'live' && (
          <div className="flex items-center gap-2 text-sm text-teal-400 ms-4">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-ping"></div>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-right">
          <thead className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="p-2 md:p-4 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-sm">الرمز / الشركة</th>
              <th className="p-2 md:p-4 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-sm">السعر</th>
              <th className="p-2 md:p-4 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-sm">التغيير</th>
              <th className="p-2 md:p-4 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-sm hidden md:table-cell">RSI</th>
              <th className="p-2 md:p-4 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-sm hidden md:table-cell">ربحية السهم</th>
              <th className="p-2 md:p-4 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-sm hidden md:table-cell">القيمة السوقية</th>
              <th className="p-2 md:p-4 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-sm hidden md:table-cell">القطاع</th>
              <th className="p-2 md:p-4 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-sm">التوصية</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                Array.from({ length: 15 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="p-2 md:p-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div></td>
                        <td className="p-2 md:p-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div></td>
                        <td className="p-2 md:p-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div></td>
                        <td className="p-2 md:p-4 hidden md:table-cell"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div></td>
                        <td className="p-2 md:p-4 hidden md:table-cell"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div></td>
                        <td className="p-2 md:p-4 hidden md:table-cell"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div></td>
                        <td className="p-2 md:p-4 hidden md:table-cell"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div></td>
                        <td className="p-2 md:p-4"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div></td>
                    </tr>
                ))
            ) : error ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                    <div className="flex flex-col items-center gap-4 text-red-500 dark:text-red-400">
                        <AlertCircle size={48} />
                        <p className="font-bold">{error}</p>
                        <button 
                            onClick={() => fetchData()}
                            className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors"
                        >
                          إعادة المحاولة
                        </button>
                    </div>
                </td>
              </tr>
            ) : filteredStocks.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-600 dark:text-gray-500">لا توجد أسهم تطابق بحثك.</td></tr>
            ) : (
              filteredStocks.map(stock => (
                <StockRow 
                    key={stock.symbol} 
                    stock={stock} 
                    onRowClick={handleRowClick}
                    isWatched={watchlist.has(stock.symbol)}
                    onToggleWatchlist={toggleWatchlist}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedStock && (
         <StockDetailModal 
            stock={selectedStock} 
            onClose={closeModal} 
            alert={alerts[selectedStock.symbol]}
            onSetAlert={(alert) => handleSetAlert(selectedStock.symbol, alert)}
            onRemoveAlert={() => handleRemoveAlert(selectedStock.symbol)}
        />
      )}

      <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {notifications.map((notification) => (
            <div key={notification.id} className="max-w-sm w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-teal-500 animate-slide-in">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Bell className="h-6 w-6 text-teal-400" aria-hidden="true" />
                  </div>
                  <div className="ms-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-white">تنبيه سعر {notification.symbol}</p>
                    <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
                  </div>
                  <div className="ms-4 flex-shrink-0 flex">
                    <button
                      type="button"
                      onClick={() => handleDismissNotification(notification.id)}
                      className="bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-800"
                    >
                      <span className="sr-only">Close</span>
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StockTable;