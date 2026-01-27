import React, { useState } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface Topic {
    id: number;
    text: string;
}

export const TopicScraper: React.FC = () => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [newTopic, setNewTopic] = useState('');

    const handleAddTopic = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedText = newTopic.trim();
        if (trimmedText && !topics.some(t => t.text.toLowerCase() === trimmedText.toLowerCase())) {
            setTopics([...topics, { id: Date.now(), text: trimmedText }]);
            setNewTopic('');
        }
    };

    const handleDeleteTopic = (id: number) => {
        setTopics(topics.filter(topic => topic.id !== id));
    };

    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-gray-200 mb-1">Web Scraper Topics</h2>
            <p className="text-sm text-gray-400 mb-4">Add topics for the Research Agent to investigate.</p>
            <form onSubmit={handleAddTopic} className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g., 'Next.js 14 features'"
                    className="flex-grow bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                />
                <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={!newTopic.trim()}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </form>
            {topics.length > 0 && (
                <div className="space-y-2">
                    {topics.map(topic => (
                        <div key={topic.id} className="group flex items-center justify-between bg-gray-900 p-2 rounded-md">
                            <span className="text-gray-300">{topic.text}</span>
                            <button onClick={() => handleDeleteTopic(topic.id)} className="text-gray-600 hover:text-red-500 transition-all p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100" title="Delete topic">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};