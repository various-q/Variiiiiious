import React, { useState, useEffect } from 'react';
import { MarketIndex } from '../types';
import { fetchMarketSummary } from '../services/stockService';

const IndexCard: React.FC<{ index: MarketIndex }> = ({ index }) => {
  const isPositive = index.change >= 0;
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 flex-1">
      <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">{index.name}</h3>
      <p className="text-3xl font-black my-2 text-gray-900 dark:text-white">{index.value.toLocaleString()}</p>
      <div className={`flex items-center gap-2 text-lg font-bold ${isPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        <span>{isPositive ? '▲' : '▼'}</span>
        <span>{index.change.toFixed(2)}</span>
        <span>({index.changePercent.toFixed(2)}%)</span>
      </div>
    </div>
  );
};

const MarketSummary: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndex[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSummary = async () => {
      setLoading(true);
      const data = await fetchMarketSummary();
      setIndices(data);
      setLoading(false);
    };
    getSummary();
  }, []);

  return (
    <section className="mb-12">
      <h3 className="text-2xl font-bold mb-6 text-center">ملخص السوق</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse flex-1">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 my-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/4"></div>
             </div>
          ))
        ) : (
          indices?.map(index => <IndexCard key={index.name} index={index} />)
        )}
      </div>
    </section>
  );
};

export default MarketSummary;