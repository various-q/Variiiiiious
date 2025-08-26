import React from 'react';
import { Stock } from '../types';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';

const TopMovers: React.FC<{ stocks: Stock[] }> = ({ stocks }) => {
    const gainers = stocks
        .filter(stock => stock.changePercent >= 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);

    const losers = stocks
        .filter(stock => stock.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-green-600 dark:text-green-400"><TrendingUp size={20} /> الأعلى ارتفاعاً</h4>
                <ul>
                    {gainers.map(stock => (
                        <li key={stock.symbol} className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700/50 last:border-b-0">
                            <span className="font-bold">{stock.symbol}</span>
                            <span className="font-mono">${stock.price.toFixed(2)}</span>
                            <span className="font-mono text-green-500 dark:text-green-400">+{stock.changePercent.toFixed(2)}%</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-red-600 dark:text-red-400"><TrendingDown size={20} /> الأكثر انخفاضاً</h4>
                <ul>
                    {losers.map(stock => (
                        <li key={stock.symbol} className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700/50 last:border-b-0">
                            <span className="font-bold">{stock.symbol}</span>
                            <span className="font-mono">${stock.price.toFixed(2)}</span>
                            <span className="font-mono text-red-500 dark:text-red-400">{stock.changePercent.toFixed(2)}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const SectorDistributionChart: React.FC<{ stocks: Stock[] }> = ({ stocks }) => {
    const sectorCounts = stocks.reduce((acc, stock) => {
        acc[stock.sector] = (acc[stock.sector] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
    
    const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const totalStocks = stocks.length;
    if (totalStocks === 0) return null;

    const colors = ['#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#EC4899'];
    let accumulatedPercentage = 0;

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><PieChart size={20} /> توزيع القطاعات</h4>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-40 h-40 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full block">
                        {sortedSectors.map(([, count], i) => {
                            const percentage = (count / totalStocks) * 100;
                            const strokeDasharray = `${percentage} ${100 - percentage}`;
                            const strokeDashoffset = 25 - accumulatedPercentage;
                            accumulatedPercentage += percentage;
                            return (
                                <circle
                                    key={i}
                                    cx="18" cy="18" r="15.9155"
                                    fill="transparent"
                                    stroke={colors[i % colors.length]}
                                    strokeWidth="3.8"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            );
                        })}
                    </svg>
                </div>
                <ul className="flex-1 w-full">
                    {sortedSectors.map(([sector, count], i) => (
                         <li key={sector} className="flex items-center justify-between py-1 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span>
                                <span>{sector}</span>
                            </div>
                            <span className="font-bold">{((count / totalStocks) * 100).toFixed(1)}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const DashboardMetrics: React.FC<{ stocks: Stock[] }> = ({ stocks }) => {
    if (stocks.length === 0) {
        // Render skeleton loaders if stocks are not yet loaded
        return (
            <section className="mb-12 animate-pulse">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-48"></div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-48"></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-48"></div>
                </div>
            </section>
        );
    }
    
    return (
        <section className="mb-12">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <TopMovers stocks={stocks} />
                </div>
                <div>
                    <SectorDistributionChart stocks={stocks} />
                </div>
            </div>
        </section>
    );
};

export default DashboardMetrics;