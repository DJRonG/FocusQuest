import React from 'react';
import type { Task, TaskPriority } from '../types';

interface PrioritySuggestionModalProps {
  state: {
    isOpen: boolean;
    task: Task | null;
    suggestion: TaskPriority | null;
    isLoading: boolean;
    error: string | null;
  };
  onClose: () => void;
  onAccept: (taskId: number, priority: TaskPriority) => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2 my-4">
        <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const priorityStyles: Record<TaskPriority, { text: string; bg: string; icon: string }> = {
    High: { text: 'text-red-400', bg: 'bg-red-500/10', icon: '🔥' },
    Medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '⚖️' },
    Low: { text: 'text-sky-400', bg: 'bg-sky-500/10', icon: '❄️' },
};

export const PrioritySuggestionModal: React.FC<PrioritySuggestionModalProps> = ({ state, onClose, onAccept }) => {
  const { isOpen, task, suggestion, isLoading, error } = state;

  if (!isOpen || !task) return null;
  
  const handleAccept = () => {
    if (task && suggestion) {
        onAccept(task.id, suggestion);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-800 text-center">
          <h2 className="text-lg font-semibold text-gray-100">✨ AI Priority Suggestion</h2>
          <p className="text-sm text-gray-400 mt-1 truncate">For task: "{task.text}"</p>
        </header>
        
        <div className="p-6 text-center">
            {isLoading && <LoadingSpinner />}
            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md">{error}</p>}
            {suggestion && !isLoading && !error && (
                <>
                    <p className="text-gray-300 mb-3">Based on deadlines, dependencies, and project goals, I suggest setting the priority to:</p>
                    <div className={`inline-flex items-center justify-center px-6 py-3 rounded-lg ${priorityStyles[suggestion].bg}`}>
                        <span className="text-2xl mr-3">{priorityStyles[suggestion].icon}</span>
                        <span className={`text-2xl font-bold ${priorityStyles[suggestion].text}`}>{suggestion}</span>
                    </div>
                </>
            )}
        </div>
        
        <footer className="p-4 sm:p-6 border-t border-gray-800 flex justify-end items-center space-x-3">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-md transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleAccept}
                disabled={!suggestion || isLoading}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
                Accept & Set Priority
            </button>
        </footer>
      </div>
    </div>
  );
};