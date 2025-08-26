import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
    theme: string;
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<HeaderProps> = ({ theme, toggleTheme }) => (
    <button 
        onClick={toggleTheme} 
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
);

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-wider text-teal-500 dark:text-teal-400">
          Various
        </h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};

export default Header;