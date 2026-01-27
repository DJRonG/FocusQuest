import React, { useState } from 'react';
import type { Quest, Task } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface QuestsProps {
    quests: Quest[];
    tasks: Task[];
    addQuest: (title: string, description: string) => void;
}

const QuestItem: React.FC<{ quest: Quest; tasks: Task[] }> = ({ quest, tasks }) => {
    const linkedTasks = tasks.filter(task => task.questId === quest.id);
    const completedTasks = linkedTasks.filter(task => task.status === 'Done');
    const progress = linkedTasks.length > 0 ? (completedTasks.length / linkedTasks.length) * 100 : 0;

    return (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800/70 flex flex-col">
            <h4 className="font-semibold text-gray-200 truncate">{quest.title}</h4>
            <p className="text-sm text-gray-400 mt-1 mb-3 flex-grow h-10 overflow-hidden">{quest.description}</p>
            <div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                        className="bg-violet-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="text-right text-xs text-gray-400 mt-1">{completedTasks.length} / {linkedTasks.length} tasks done</div>
            </div>
        </div>
    );
};


export const Quests: React.FC<QuestsProps> = ({ quests, tasks, addQuest }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && description.trim()) {
            addQuest(title.trim(), description.trim());
            setTitle('');
            setDescription('');
            setIsFormVisible(false);
        }
    };

    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-200">🎯 My Quests</h2>
                    <p className="text-sm text-gray-400 mt-1">Track progress on your long-term goals.</p>
                </div>
                <button 
                    onClick={() => setIsFormVisible(!isFormVisible)}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-3 py-2 rounded-md flex items-center justify-center transition-colors text-sm"
                >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    {isFormVisible ? 'Cancel' : 'New Quest'}
                </button>
            </div>

            {isFormVisible && (
                 <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800 space-y-3">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Quest Title (e.g., Learn React Native)"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                     <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="A short description of your goal."
                        rows={2}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                        type="submit"
                        disabled={!title.trim() || !description.trim()}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        Add Quest
                    </button>
                </form>
            )}

            {quests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quests.map(quest => (
                        <QuestItem key={quest.id} quest={quest} tasks={tasks} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p>No quests yet. Add one to start tracking a long-term goal!</p>
                </div>
            )}
        </div>
    );
};