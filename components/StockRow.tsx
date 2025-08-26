import React, { useState, useEffect, useRef } from 'react';
import { Stock } from '../types';
import { RECOMMENDATION_CLASSES } from '../constants';
import { Star } from 'lucide-react';

interface StockRowProps {
  stock: Stock;
  onRowClick: (stock: Stock) => void;
  isWatched: boolean;
  onToggleWatchlist: (symbol: string) => void;
}

const StockRow: React.FC<StockRowProps> = ({ stock, onRowClick, isWatched, onToggleWatchlist }) => {
  const isPositive = stock.change >= 0;
  const recommendationClasses = RECOMMENDATION_CLASSES[stock.recommendation];

  const [priceChangeClass, setPriceChangeClass] = useState('');
  const prevPriceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== stock.price) {
        const changeClass = stock.price > prevPriceRef.current ? 'animate-price-flash-green' : 'animate-price-flash-red';
        setPriceChangeClass(changeClass);
        const timer = setTimeout(() => setPriceChangeClass(''), 1000); // Animation duration matches keyframes
        return () => clearTimeout(timer);
    }
    prevPriceRef.current = stock.price;
  }, [stock.price]);

  const handleWatchlistClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // prevent opening modal
      onToggleWatchlist(stock.symbol);
  };

  return (
    <tr 
      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
      onClick={() => onRowClick(stock)}
    >
      <td className="p-2 md:p-4">
        <div className="flex items-center gap-3">
            <button 
                onClick={handleWatchlistClick} 
                aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"} 
                className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
                <Star size={18} className={isWatched ? 'fill-current text-yellow-400' : 'fill-transparent'} />
            </button>
            <div>
                <div className="font-bold">{stock.symbol}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stock.name}</div>
            </div>
        </div>
      </td>
      <td className={`p-2 md:p-4 font-mono font-bold text-base md:text-lg ${priceChangeClass}`}>${stock.price.toFixed(2)}</td>
      <td className={`p-2 md:p-4 font-mono font-bold ${isPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        <div>{stock.change.toFixed(2)}</div>
        <div>({stock.changePercent.toFixed(2)}%)</div>
      </td>
      <td className="p-2 md:p-4 font-mono hidden md:table-cell">{stock.rsi.toFixed(2)}</td>
      <td className="p-2 md:p-4 font-mono hidden md:table-cell">{stock.eps.toFixed(2)}</td>
      <td className="p-2 md:p-4 font-mono hidden md:table-cell">{stock.marketCap}</td>
      <td className="p-2 md:p-4 text-gray-600 dark:text-gray-300 hidden md:table-cell">{stock.sector}</td>
      <td className="p-2 md:p-4">
        <span className={`px-3 py-1 text-sm font-bold rounded-full ${recommendationClasses.bg} ${recommendationClasses.text}`}>
          {stock.recommendation}
        </span>
      </td>
    </tr>
  );
};

export default StockRow;