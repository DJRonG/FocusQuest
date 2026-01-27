import React from 'react';
import type { Task } from '../types';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const formatDuration = (start?: string, end?: string): string => {
    if (!start || !end) return 'N/A';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    if (durationMs < 0) return 'N/A';
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    if (seconds < 1) return '<1s'
    return `${seconds}s`;
};


export const InsightModal: React.FC<InsightModalProps> = ({ isOpen, onClose, task }) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-800 text-center">
          <h2 className="text-lg font-semibold text-gray-100">Task Completion Insight</h2>
          <p className="text-sm text-gray-400 mt-1 truncate">For: "{task.text}"</p>
        </header>
        
        <div className="p-6 space-y-4">
            <div className="bg-gray-900 p-3 rounded-lg grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</p>
                    <p className="text-green-400 font-bold">Completed</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Time Taken</p>
                    <p className="font-bold text-gray-100">{formatDuration(task.startTime, task.completionTime)}</p>
                </div>
            </div>

            <div className="pt-4">
                <h3 className="text-md font-semibold text-violet-400 mb-2 flex items-center">
                    <LightbulbIcon className="w-5 h-5 mr-2" />
                    AI-Powered Suggestion
                </h3>
                <blockquote className="border-l-2 border-violet-700 pl-4">
                    <p className="text-gray-300 italic">{task.aiInsight || "No insight available for this task."}</p>
                </blockquote>
            </div>
        </div>
        
        <footer className="p-4 sm:p-6 border-t border-gray-800 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md transition-colors"
            >
                Close
            </button>
        </footer>
      </div>
    </div>
  );
};
