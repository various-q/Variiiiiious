import React, { useState } from 'react';
import { Bot, Loader2, X } from 'lucide-react';

interface AIScreenerProps {
    onScreen: (query: string) => void;
    isScreening: boolean;
    activeCriteria: boolean;
    onClear: () => void;
}

const AIScreener: React.FC<AIScreenerProps> = ({ onScreen, isScreening, activeCriteria, onClear }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onScreen(query.trim());
        }
    };

    return (
        <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                     <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="جرب: 'أسهم تكنولوجيا ذات عائد توزيعات مرتفع'"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 ps-10 pe-4 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        disabled={isScreening}
                    />
                    <Bot className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" size={20} />
                </div>
                <button 
                    type="submit" 
                    disabled={isScreening || !query.trim()}
                    className="flex items-center justify-center gap-2 bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isScreening ? <Loader2 size={20} className="animate-spin" /> : <Bot size={20}/>}
                    <span>{isScreening ? 'جارِ التحليل...' : 'فحص بالذكاء الاصطناعي'}</span>
                </button>
                {activeCriteria && (
                     <button 
                        type="button" 
                        onClick={() => {
                            onClear();
                            setQuery('');
                        }}
                        className="flex items-center justify-center gap-2 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        <X size={16} />
                        <span>مسح الفلتر</span>
                    </button>
                )}
            </form>
        </div>
    );
};

export default AIScreener;
