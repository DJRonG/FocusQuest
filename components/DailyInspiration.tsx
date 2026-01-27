import React, { useState, useEffect } from 'react';
import { getDailyInspiration } from '../services/geminiService';

const LoadingSkeleton: React.FC = () => (
    <div className="py-3 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
    </div>
);

export const DailyInspiration: React.FC = () => {
    const [inspiration, setInspiration] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mock YouTube history topics
    const MOCK_INTERESTS = ['AI advancements', 'Stoic philosophy for developers', 'game design principles', 'cybersecurity news'];

    useEffect(() => {
        const loadInspiration = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedInspiration = await getDailyInspiration(MOCK_INTERESTS);
                setInspiration(fetchedInspiration);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        loadInspiration();
    }, []);

    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <div>
                <h2 className="text-xl font-semibold text-gray-200">✨ Daily Inspiration</h2>
                <p className="text-sm text-gray-400 mt-1">Based on your interests.</p>
            </div>
            <div className="mt-4">
                {isLoading && <LoadingSkeleton />}
                {error && (
                    <div className="text-center py-4 text-red-400 bg-red-500/10 rounded-lg">
                        <p><strong>Error:</strong> {error}</p>
                    </div>
                )}
                {!isLoading && inspiration && (
                    <blockquote className="border-l-4 border-violet-500 pl-4 py-2">
                        <p className="text-lg italic text-gray-200">"{inspiration}"</p>
                    </blockquote>
                )}
                 {!isLoading && !error && !inspiration && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Could not load inspiration.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
