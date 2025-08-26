import React, { useState, useEffect, useRef } from 'react';
import { Stock, HistoricalDataPoint, PriceAlert, NewsArticle, Sentiment } from '../types';
import { getAIStockAnalysis, getAIStockForecast, getSentimentForNews } from '../services/geminiService';
import { fetchHistoricalData, fetchNewsForStock } from '../services/stockService';
import { X, LineChart, Bot, BellPlus, BellRing, BellOff, Newspaper, BrainCircuit } from 'lucide-react';

interface StockChartProps {
  data: HistoricalDataPoint[];
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
    if (!data || data.length < 2) {
        return <div className="h-64 flex items-center justify-center text-gray-500">لا توجد بيانات كافية لعرض الرسم البياني.</div>;
    }
    
    const width = 500;
    const height = 200;
    const padding = 20;

    const prices = data.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice === 0 ? 1 : maxPrice - minPrice;

    const getX = (index: number) => (index / (data.length - 1)) * (width - padding * 2) + padding;
    const getY = (price: number) => height - ((price - minPrice) / priceRange) * (height - padding * 2) - padding;

    const pathD = data.map((point, i) => `L ${getX(i)} ${getY(point.price)}`).join(' ').substring(2);
    const areaPathD = `M ${getX(0)} ${getY(data[0].price)} ${pathD} V ${height - padding} L ${padding} ${height - padding} Z`;
    
    const isPositive = data[data.length-1].price >= data[0].price;
    const strokeColor = isPositive ? '#34D399' : '#F87171';
    const gradientId = isPositive ? 'chart-gradient-green' : 'chart-gradient-red';
    const gradientColor = isPositive ? '#10B981' : '#EF4444';

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={gradientColor} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <path d={areaPathD} fill={`url(#${gradientId})`} />
                <path d={`M ${getX(0)} ${getY(data[0].price)} ${pathD}`} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute top-0 right-0 text-xs text-gray-500 dark:text-gray-400 p-1 bg-white/50 dark:bg-gray-900/50 rounded-bl-md">الأعلى: ${maxPrice.toFixed(2)}</div>
            <div className="absolute bottom-0 right-0 text-xs text-gray-500 dark:text-gray-400 p-1 bg-white/50 dark:bg-gray-900/50 rounded-tl-md">الأدنى: ${minPrice.toFixed(2)}</div>
        </div>
    );
};

const sentimentStyles: { [key in Sentiment]: { bg: string, text: string, border: string, label: string } } = {
    [Sentiment.Positive]: { bg: 'dark:bg-green-500/10 bg-green-100', text: 'text-green-500 dark:text-green-400', border: 'border-green-500/10 dark:border-green-500/30', label: 'إيجابي' },
    [Sentiment.Negative]: { bg: 'dark:bg-red-500/10 bg-red-100', text: 'text-red-500 dark:text-red-400', border: 'border-red-500/10 dark:border-red-500/30', label: 'سلبي' },
    [Sentiment.Neutral]: { bg: 'dark:bg-gray-500/10 bg-gray-200', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/10 dark:border-gray-500/30', label: 'محايد' },
};

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => {
    const styles = article.sentiment ? sentimentStyles[article.sentiment] : sentimentStyles[Sentiment.Neutral];
    return (
        <a href={article.url} target="_blank" rel="noopener noreferrer" className={`block p-3 rounded-lg border ${styles.border} ${styles.bg} hover:bg-gray-500/10 transition-colors`}>
            <div className="flex justify-between items-start mb-1">
                <p className="font-bold text-base text-gray-900 dark:text-gray-100 flex-1">{article.headline}</p>
                {article.sentiment && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ms-2 ${styles.text} ${styles.bg}`}>
                        {styles.label}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{article.summary}</p>
            <div className="text-xs text-gray-500 dark:text-gray-500 flex justify-between">
                <span>{article.source}</span>
                <span>{new Date(article.publishedAt).toLocaleDateString('ar-EG')}</span>
            </div>
        </a>
    );
};

interface StockDetailModalProps {
  stock: Stock;
  onClose: () => void;
  alert: PriceAlert | undefined;
  onSetAlert: (alert: PriceAlert) => void;
  onRemoveAlert: () => void;
}

const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, onClose, alert, onSetAlert, onRemoveAlert }) => {
  const [analysis, setAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [priceChangeClass, setPriceChangeClass] = useState('');
  const prevPriceRef = useRef<number | undefined>(undefined);
  type DateRange = '1D' | '1W' | '1M';
  const [dateRange, setDateRange] = useState<DateRange>('1W');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [forecast, setForecast] = useState<string>('');
  const [loadingForecast, setLoadingForecast] = useState(true);

  const handleSetAlertClick = () => {
    const price = parseFloat(alertPrice);
    if (!isNaN(price) && price > 0) {
        onSetAlert({ targetPrice: price, condition: alertCondition });
        setAlertPrice('');
    }
  };

  useEffect(() => {
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== stock.price) {
      const changeClass = stock.price > prevPriceRef.current ? 'animate-price-flash-green' : 'animate-price-flash-red';
      setPriceChangeClass(changeClass);
      const timer = setTimeout(() => setPriceChangeClass(''), 1000);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = stock.price;
  }, [stock.price]);
  
  useEffect(() => {
    setLoadingAnalysis(true); setLoadingNews(true); setLoadingForecast(true);
    const fetchAllData = async () => {
        const analysisPromise = getAIStockAnalysis(stock);
        const newsPromise = fetchNewsForStock(stock.symbol).then(getSentimentForNews);
        const forecastPromise = getAIStockForecast(stock);

        const [analysisResult, newsResult, forecastResult] = await Promise.all([analysisPromise, newsPromise, forecastPromise]);
        
        setAnalysis(analysisResult); setLoadingAnalysis(false);
        setNews(newsResult); setLoadingNews(false);
        setForecast(forecastResult); setLoadingForecast(false);
    };
    fetchAllData();
  }, [stock.symbol]);

  useEffect(() => {
    const getHistoricalData = async () => {
        setLoadingChart(true);
        const data = await fetchHistoricalData(stock.symbol, dateRange, stock.price);
        setHistoricalData(data);
        setLoadingChart(false);
    };
    getHistoricalData();
  }, [stock.symbol, stock.price, dateRange]);
  
  const rangeOptions: { key: DateRange; label: string }[] = [ { key: '1D', label: 'يوم' }, { key: '1W', label: 'أسبوع' }, { key: '1M', label: 'شهر' } ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative shadow-2xl shadow-teal-900/10 dark:shadow-teal-500/10 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors z-10" aria-label="Close modal"><X size={24} /></button>
        
        <div className="flex justify-between items-start mb-6">
            <div><h2 className="text-3xl font-bold">{stock.name}</h2><p className="text-xl text-gray-500 dark:text-gray-400">{stock.symbol}</p></div>
            <div className="text-left">
                 <p className={`text-3xl font-black p-2 rounded-lg ${priceChangeClass}`}>${stock.price.toFixed(2)}</p>
                 <p className={`text-lg font-bold ${stock.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)</p>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
            {[{label:'القيمة السوقية', value:stock.marketCap}, {label:'ربحية السهم', value:stock.eps.toFixed(2)}, {label:'عائد التوزيعات', value:`${stock.dividendYield.toFixed(2)}%`}, {label:'القطاع', value:stock.sector}].map(item => (
                <div key={item.label} className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p><p className="text-lg font-bold truncate">{item.value}</p></div>
            ))}
        </div>

        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg mb-8 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-bold mb-3 flex items-center gap-2 text-teal-600 dark:text-teal-400"><Bot size={20} /><span>تحليل الذكاء الاصطناعي</span></h4>
            {loadingAnalysis ? (<div className="space-y-2 animate-pulse"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></div>) : (<p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysis}</p>)}
        </div>

        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg mb-8 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-bold mb-3 flex items-center gap-2 text-purple-600 dark:text-purple-400"><BrainCircuit size={20} /><span>سيناريوهات مستقبلية (AI)</span></h4>
            {loadingForecast ? (<div className="space-y-2 animate-pulse"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></div>) : (<div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: forecast.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>') }}></div>)}
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg mb-8 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400"><Newspaper size={20} /><span>أبرز الأخبار</span></h4>
            {loadingNews ? (<div className="space-y-3 animate-pulse"><div className="h-16 bg-gray-300 dark:bg-gray-700 rounded-lg w-full"></div><div className="h-16 bg-gray-300 dark:bg-gray-700 rounded-lg w-full"></div></div>) : (<div className="space-y-3">{news.map(item => <NewsCard key={item.id} article={item} />)}</div>)}
        </div>

        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg mb-8">
          <h4 className="text-lg font-bold mb-3 text-center flex items-center justify-center gap-2"><BellPlus size={20} className="text-teal-600 dark:text-teal-400" /><span>إعداد تنبيه السعر</span></h4>
          {alert ? (
              <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-lg text-yellow-800 dark:text-yellow-300 mb-3 p-2 bg-yellow-400/20 dark:bg-yellow-500/10 rounded-lg"><BellRing size={20}/><span>تنبيه عند {alert.condition === 'above' ? 'الارتفاع فوق' : 'الانخفاض تحت'} ${alert.targetPrice.toFixed(2)}</span></div>
                  <button onClick={onRemoveAlert} className="bg-red-500/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-2 mx-auto mt-2"><BellOff size={16}/>إزالة التنبيه</button>
              </div>
          ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <span className="text-gray-700 dark:text-gray-300">تنبيهي عندما يصل السعر</span>
                  <select value={alertCondition} onChange={(e) => setAlertCondition(e.target.value as 'above' | 'below')} className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"><option value="above">فوق</option><option value="below">تحت</option></select>
                  <input type="number" placeholder="0.00" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} className="w-24 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500" aria-label="Target price"/>
                  <button onClick={handleSetAlertClick} disabled={!alertPrice || parseFloat(alertPrice) <= 0} className="bg-teal-500 text-white font-bold py-1 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">تعيين</button>
              </div>
          )}
        </div>

        <div>
            <h4 className="text-lg font-bold mb-3 text-center flex items-center justify-center gap-2"><LineChart size={20} className="text-teal-600 dark:text-teal-400" /><span>أداء السهم</span></h4>
            <div className="flex justify-center gap-2 mb-4">
                {rangeOptions.map(opt => (<button key={opt.key} onClick={() => setDateRange(opt.key)} className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${dateRange === opt.key ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{opt.label}</button>))}
            </div>
            {loadingChart ? (<div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 dark:border-teal-400"></div></div>) : (<StockChart data={historicalData} />)}
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;