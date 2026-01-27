import React, { useState } from 'react';
import { getUrlSummary } from '../services/geminiService';
import { ClipboardPlusIcon } from './icons/ClipboardPlusIcon';
import { CheckIcon } from './icons/CheckIcon';

interface WebScraperAgentProps {
    addTask: (text: string) => string;
}

interface ScrapedItem {
    id: string;
    url: string;
    summary: string;
    isTaskCreated: boolean;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

export const WebScraperAgent: React.FC<WebScraperAgentProps> = ({ addTask }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scrapedItems, setScrapedItems] = useState<ScrapedItem[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await getUrlSummary(url.trim());
            const summary = response.text;
            if (!summary) {
                throw new Error("Received an empty summary.");
            }
            const newItem: ScrapedItem = {
                id: Date.now().toString(),
                url: url.trim(),
                summary,
                isTaskCreated: false,
            };
            setScrapedItems(prev => [newItem, ...prev]);
            setUrl('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTask = (itemId: string) => {
        const item = scrapedItems.find(i => i.id === itemId);
        if (item && !item.isTaskCreated) {
            const taskText = `Review summary for: ${item.url}`;
            addTask(taskText);
            setScrapedItems(prev => prev.map(i => i.id === itemId ? { ...i, isTaskCreated: true } : i));
        }
    };

    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-gray-200 mb-1">🕸️ Web Scraper Agent</h2>
            <p className="text-sm text-gray-400 mb-4">Paste a URL to get a summary and create tasks.</p>
            
            <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="flex-grow bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 w-32 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={isLoading || !url.trim()}
                >
                    {isLoading ? <LoadingSpinner /> : 'Summarize'}
                </button>
            </form>

            {error && (
                <div className="text-sm text-red-400 p-3 bg-red-500/10 rounded-md mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}
            
            {scrapedItems.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {scrapedItems.map(item => (
                        <div key={item.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800/70">
                            <div className="flex justify-between items-start">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline font-medium truncate pr-4">{item.url}</a>
                                <button
                                    onClick={() => handleCreateTask(item.id)}
                                    disabled={item.isTaskCreated}
                                    className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-md transition-colors disabled:cursor-not-allowed disabled:bg-green-500/20 disabled:text-green-300 bg-gray-700 hover:bg-gray-600 text-gray-200 flex-shrink-0"
                                >
                                    {item.isTaskCreated ? <CheckIcon className="w-4 h-4" /> : <ClipboardPlusIcon className="w-4 h-4" />}
                                    <span>{item.isTaskCreated ? 'Task Created' : 'Create Task'}</span>
                                </button>
                            </div>
                            <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{item.summary}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
