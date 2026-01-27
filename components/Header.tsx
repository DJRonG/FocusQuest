import React from 'react';

interface HeaderProps {
  onOpenPrinciples: () => void;
  appMode: 'work' | 'personal';
  setAppMode: (mode: 'work' | 'personal') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPrinciples, appMode, setAppMode }) => {
  return (
    <header className="flex items-center justify-between pb-4 border-b border-gray-800">
      <div className="flex items-center space-x-3">
        <span className="text-2xl" role="img" aria-label="Target emoji">🎯</span>
        <h1 className="text-2xl font-bold tracking-tight text-gray-50">
          FocusQuest
        </h1>
      </div>
       <div className="flex items-center space-x-4">
        <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1">
            <button
                onClick={() => setAppMode('work')}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${appMode === 'work' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                💼 Work
            </button>
            <button
                onClick={() => setAppMode('personal')}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${appMode === 'personal' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                🏡 Personal
            </button>
        </div>
        <p className="text-sm text-gray-400 hidden lg:block">Your adaptive learning & focus companion</p>
        <button 
          onClick={onOpenPrinciples}
          className="text-2xl hover:opacity-75 transition-opacity"
          aria-label="Show AI design principles"
        >
          💡
        </button>
       </div>
    </header>
  );
};