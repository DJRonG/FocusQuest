import React from 'react';
import { fetchNewsFeed, getSuggestedLinks } from '../services/geminiService';
import type { NewsArticle, SuggestedLink, Task } from '../types';

interface NewsFeedProps {
  appMode: 'work' | 'personal';
  tasks: Task[];
}

const NewsItem: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <div className="py-3 border-b border-gray-800/50 last:border-b-0">
        <h4 className="font-medium text-gray-200 hover:text-violet-400 transition-colors cursor-pointer">{article.title}</h4>
        <p className="text-xs text-gray-500 mt-1">{article.source}</p>
    </div>
);

const LinkItem: React.FC<{ link: SuggestedLink }> = ({ link }) => (
    <div className="py-3 border-b border-gray-800/50 last:border-b-0">
        <a href={link.uri} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-200 hover:text-violet-400 transition-colors cursor-pointer block">
            <span className="mr-2">🔗</span>{link.title}
        </a>
        <p className="text-xs text-gray-500 mt-1 pl-6">{link.reason}</p>
    </div>
);

const NewsSkeleton: React.FC = () => (
    <div className="py-3 border-b border-gray-800/50 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-5/6 mb-2"></div>
        <div className="h-3 bg-gray-800 rounded w-1/4"></div>
    </div>
);

const LinkSkeleton: React.FC = () => (
    <div className="py-3 border-b border-gray-800/50 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-4/5 mb-2"></div>
        <div className="h-3 bg-gray-800 rounded w-full"></div>
    </div>
);


export const NewsFeed: React.FC<NewsFeedProps> = ({ appMode, tasks }) => {
    const [articles, setArticles] = React.useState<NewsArticle[]>([]);
    const [isNewsLoading, setIsNewsLoading] = React.useState(true);
    const [newsError, setNewsError] = React.useState<string | null>(null);

    const [links, setLinks] = React.useState<SuggestedLink[]>([]);
    const [isLinksLoading, setIsLinksLoading] = React.useState(true);
    const [linksError, setLinksError] = React.useState<string | null>(null);

    const activeTasksKey = JSON.stringify(tasks.filter(t => t.status !== 'Done').map(t => t.text));

    React.useEffect(() => {
        const loadNews = async () => {
            setIsNewsLoading(true);
            setNewsError(null);
            try {
                const fetchedArticles = await fetchNewsFeed(appMode);
                setArticles(fetchedArticles);
            } catch (err) {
                setNewsError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsNewsLoading(false);
            }
        };

        const loadLinks = async () => {
            setIsLinksLoading(true);
            setLinksError(null);
            try {
                const activeTasks = tasks.filter(t => t.status !== 'Done');
                if (activeTasks.length > 0) {
                    const fetchedLinks = await getSuggestedLinks(activeTasks);
                    setLinks(fetchedLinks);
                } else {
                    setLinks([]); // Clear links if no active tasks
                }
            } catch (err) {
                setLinksError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLinksLoading(false);
            }
        };
        
        loadNews();
        loadLinks();
    }, [appMode, activeTasksKey]);

    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <div>
                <h2 className="text-xl font-semibold text-gray-200">Insights Feed</h2>
                <p className="text-sm text-gray-400 mt-1">Context-aware links and news.</p>
            </div>
            <div className="mt-4 space-y-6">
                 {/* Suggested Links Section */}
                <div>
                    <h3 className="text-md font-semibold text-gray-300 mb-2">Suggested For You</h3>
                     {isLinksLoading && (
                        <>
                            <LinkSkeleton />
                            <LinkSkeleton />
                        </>
                    )}
                    {linksError && (
                        <div className="text-center py-4 text-red-400 bg-red-500/10 rounded-lg text-sm">
                            <p><strong>Could not load suggestions:</strong> {linksError}</p>
                        </div>
                    )}
                    {!isLinksLoading && !linksError && links.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            <p>No active tasks to generate suggestions for.</p>
                        </div>
                    )}
                    {!isLinksLoading && links.length > 0 && links.map((link, index) => (
                        <LinkItem key={index} link={link} />
                    ))}
                </div>

                {/* News Section */}
                <div>
                    <h3 className="text-md font-semibold text-gray-300 mb-2">Latest News</h3>
                    {isNewsLoading && (
                        <>
                            <NewsSkeleton />
                            <NewsSkeleton />
                            <NewsSkeleton />
                        </>
                    )}
                    {newsError && (
                        <div className="text-center py-4 text-red-400 bg-red-500/10 rounded-lg text-sm">
                            <p><strong>Could not load news:</strong> {newsError}</p>
                        </div>
                    )}
                    {!isNewsLoading && !newsError && articles.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No news to display right now.</p>
                        </div>
                    )}
                    {!isNewsLoading && articles.length > 0 && articles.map((article, index) => (
                        <NewsItem key={index} article={article} />
                    ))}
                </div>
            </div>
        </div>
    );
};