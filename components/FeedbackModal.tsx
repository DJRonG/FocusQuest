import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onSubmit: (feedback: { productivity: number; distractions: string }) => void;
}

const productivityLevels = [
  { emoji: '😩', label: 'Very Unproductive', value: 1 },
  { emoji: '😕', label: 'Unproductive', value: 2 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '🙂', label: 'Productive', value: 4 },
  { emoji: '😄', label: 'Very Productive', value: 5 },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onSubmit }) => {
  const [productivity, setProductivity] = useState<number>(0);
  const [distractions, setDistractions] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productivity > 0) {
      onSubmit({ productivity, distractions });
      setProductivity(0);
      setDistractions('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl"
      >
        <header className="p-4 sm:p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-100">Focus Session Complete!</h2>
            <p className="text-sm text-gray-400 mt-1">How did it go?</p>
        </header>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">How productive did you feel?</label>
                <div className="flex justify-between items-center bg-gray-900 p-2 rounded-lg">
                    {productivityLevels.map((level) => (
                        <button 
                            key={level.value}
                            type="button"
                            onClick={() => setProductivity(level.value)}
                            className={`text-3xl p-2 rounded-md transition-all duration-200 w-1/5 ${productivity === level.value ? 'bg-violet-600 scale-110' : 'hover:bg-gray-800'}`}
                            title={level.label}
                        >
                            {level.emoji}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="distractions" className="block text-sm font-medium text-gray-300 mb-2">
                    What were your biggest distractions? (Optional)
                </label>
                <textarea
                    id="distractions"
                    value={distractions}
                    onChange={(e) => setDistractions(e.target.value)}
                    rows={3}
                    placeholder="e.g., Social media, notifications, noise..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                />
            </div>
            <button
                type="submit"
                disabled={productivity === 0}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
                Submit & Start Break
            </button>
        </form>
      </div>
    </div>
  );
};