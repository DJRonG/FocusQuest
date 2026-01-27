import React, { useState } from 'react';
import { FocusTimer } from './FocusTimer';
import type { Task, TaskPriority, TaskCategory, Quest } from '../types';
import { breakdownTask } from '../services/geminiService';
import { PlusIcon } from './icons/PlusIcon';

interface WorkZoneProps {
    tasks: Task[];
    addTask: (text: string, priority?: TaskPriority, category?: TaskCategory, questId?: number) => string;
}

type ViewMode = 'default' | 'timer' | 'breakdown';

const ActionButton: React.FC<{ icon: string; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-start w-full p-4 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800/80 hover:border-gray-700 transition-all duration-200"
    >
        <span className="text-2xl mr-4">{icon}</span>
        <span className="font-semibold text-gray-200">{label}</span>
    </button>
);

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2 h-10">
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const TaskBreakdown: React.FC<{
    tasks: Task[];
    onAddTask: (text: string, priority?: TaskPriority, category?: TaskCategory, questId?: number) => void;
    onBack: () => void;
}> = ({ tasks, onAddTask, onBack }) => {
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subTasks, setSubTasks] = useState<string[]>([]);
    const [addedSubTasks, setAddedSubTasks] = useState<Set<string>>(new Set());

    const handleGenerate = async () => {
        if (!selectedTaskId) return;
        const task = tasks.find(t => t.id === parseInt(selectedTaskId, 10));
        if (!task) return;

        setIsLoading(true);
        setError(null);
        setSubTasks([]);
        try {
            const result = await breakdownTask(task.text);
            setSubTasks(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddTask = (subTaskText: string) => {
        const parentTask = tasks.find(t => t.id === parseInt(selectedTaskId, 10));
        if (!parentTask) return;
        // Prefix sub-task for clarity and pass original priority, category, and questId
        onAddTask(`[Sub-task for #${parentTask.id}] ${subTaskText}`, parentTask.priority, parentTask.category, parentTask.questId);
        setAddedSubTasks(prev => new Set(prev).add(subTaskText));
    };

    const todoTasks = tasks.filter(t => t.status === 'To Do');

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/70">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200 text-lg">Break Down a Task</h3>
                <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-100">&larr; Back</button>
            </div>
            {todoTasks.length > 0 ? (
                <div className="flex space-x-2">
                    <select
                        value={selectedTaskId}
                        onChange={(e) => {
                            setSelectedTaskId(e.target.value);
                            setSubTasks([]); // Clear results on new selection
                            setAddedSubTasks(new Set());
                        }}
                        className="flex-grow bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="" disabled>Select a task to break down...</option>
                        {todoTasks.map(task => (
                            <option key={task.id} value={task.id}>{task.text}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleGenerate}
                        disabled={!selectedTaskId || isLoading}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 w-48 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Sub-tasks'}
                    </button>
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">You have no tasks in your "To Do" list to break down.</p>
            )}

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            
            {subTasks.length > 0 && (
                <div className="mt-4 space-y-2 pt-4 border-t border-gray-700/50">
                    <h4 className="text-md font-semibold text-gray-300 mb-2">Suggested Sub-tasks:</h4>
                    {subTasks.map((subTask, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded-md group">
                            <p className="text-gray-300 text-sm">{subTask}</p>
                            <button
                                onClick={() => handleAddTask(subTask)}
                                disabled={addedSubTasks.has(subTask)}
                                className="text-violet-400 hover:text-white disabled:text-green-500 disabled:cursor-not-allowed transition-colors p-1 rounded-md flex items-center space-x-1 text-sm font-semibold"
                            >
                                <PlusIcon className={`w-4 h-4 ${addedSubTasks.has(subTask) ? 'hidden' : 'inline'}`} />
                                <span>{addedSubTasks.has(subTask) ? 'Added' : 'Add'}</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export const WorkZone: React.FC<WorkZoneProps> = ({ tasks, addTask }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('default');

    if (viewMode === 'timer') {
        return <FocusTimer onEndSession={() => setViewMode('default')} />;
    }

    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <div>
                <h2 className="text-xl font-semibold text-gray-200">Work Zone</h2>
                <p className="text-sm text-gray-400 mt-1">Your AI-powered workspace.</p>
            </div>
            <div className="mt-6 space-y-4">
                {viewMode === 'default' && (
                     <>
                        <ActionButton icon="⏰" label="Start Focus Session" onClick={() => setViewMode('timer')} />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-300 mt-6 mb-3">🚀 Agent Actions</h3>
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/70">
                                <h4 className="font-semibold text-gray-200">Break Down a Task</h4>
                                <p className="text-sm text-gray-400 mt-1 mb-3">Let the agent help you decompose a large task into smaller, manageable steps.</p>
                                <button
                                    onClick={() => setViewMode('breakdown')}
                                    className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center transition-colors text-sm"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </>
                )}
                {viewMode === 'breakdown' && (
                   <TaskBreakdown tasks={tasks} onAddTask={addTask} onBack={() => setViewMode('default')} />
                )}
            </div>
        </div>
    );
};