import React, { useState, useEffect } from 'react';
import type { Task } from '../types';

interface DependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  allTasks: Task[];
  onSetDependencies: (taskId: number, dependencyIds: number[]) => string;
}

export const DependencyModal: React.FC<DependencyModalProps> = ({
  isOpen,
  onClose,
  task,
  allTasks,
  onSetDependencies,
}) => {
  const [selectedDeps, setSelectedDeps] = useState<Set<number>>(new Set(task.dependsOn || []));
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDeps(new Set(task.dependsOn || []));
    setFeedback(null);
  }, [isOpen, task.dependsOn]);

  if (!isOpen) return null;

  const handleToggleDependency = (depId: number) => {
    const newDeps = new Set(selectedDeps);
    if (newDeps.has(depId)) {
      newDeps.delete(depId);
    } else {
      newDeps.add(depId);
    }
    setSelectedDeps(newDeps);
  };

  const handleSave = () => {
    const result = onSetDependencies(task.id, Array.from(selectedDeps));
    if (result.toLowerCase().startsWith('error')) {
      setFeedback(result);
    } else {
      onClose();
    }
  };
  
  // Tasks that can be dependencies: any task that isn't this task or already dependent on this task.
  const potentialDependencies = allTasks.filter(t => t.id !== task.id);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Set Dependencies</h2>
          <p className="text-sm text-gray-400 mt-1">Select tasks that must be completed before starting: <strong className="text-violet-400">"{task.text}"</strong></p>
        </header>
        
        <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {potentialDependencies.length > 0 ? potentialDependencies.map(depTask => (
            <div key={depTask.id} className="flex items-center justify-between bg-gray-900 p-3 rounded-md">
              <label htmlFor={`dep-${depTask.id}`} className="flex items-center space-x-3 cursor-pointer">
                <input
                  id={`dep-${depTask.id}`}
                  type="checkbox"
                  checked={selectedDeps.has(depTask.id)}
                  onChange={() => handleToggleDependency(depTask.id)}
                  className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-gray-200">{depTask.text}</span>
              </label>
              <span className={`text-xs px-2 py-1 rounded-full ${
                depTask.status === 'Done' ? 'bg-green-500/20 text-green-400' :
                depTask.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-sky-500/20 text-sky-400'
              }`}>{depTask.status}</span>
            </div>
          )) : (
            <p className="text-gray-500 text-center py-4">No other tasks available to set as dependencies.</p>
          )}
        </div>
        
        <footer className="p-4 sm:p-6 border-t border-gray-800 flex justify-between items-center">
            {feedback && <p className="text-sm text-red-400">{feedback}</p>}
            <div className="flex-grow flex justify-end space-x-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md transition-colors"
                >
                    Save Dependencies
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};
