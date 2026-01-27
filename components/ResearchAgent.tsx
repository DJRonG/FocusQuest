import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Task } from '../types';
import { getResearchResponse } from '../services/geminiService';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ResearchAgentProps {
  tasks: Task[];
  linkResearchToTask: (taskId: number, links: { uri: string; title: string; }[]) => string;
}

// Fix: Define the ResearchTopic interface, which was missing.
interface ResearchTopic {
  id: number;
  title: string;
}

const AgentMessage: React.FC<{
  message: ChatMessage;
  tasks: Task[];
  linkResearchToTask: (taskId: number, links: { uri: string; title: string; }[]) => string;
}> = ({ message, tasks, linkResearchToTask }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isLinked, setIsLinked] = useState(false);

  const handleLinkToTask = () => {
    if (!selectedTaskId || !message.sources || message.sources.length === 0) return;
    const taskId = parseInt(selectedTaskId, 10);
    linkResearchToTask(taskId, message.sources);
    setIsLinked(true);
    setTimeout(() => { // Reset for potential future linking
        setIsLinked(false);
        setSelectedTaskId('');
    }, 3000);
  };

  const hasSources = message.sources && message.sources.length > 0;
  const incompleteTasks = tasks.filter(t => t.status !== 'Done');

  return (
    <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
             <span className="text-lg">🌐</span>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 max-w-xs sm:max-w-sm md:max-w-md">
            {message.isLoading ? (
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{message.text}</p>
                    {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 border-t border-gray-700 pt-2">
                            <h4 className="text-xs font-semibold text-gray-400 mb-1">Sources:</h4>
                            <ul className="space-y-1">
                                {message.sources.map((source, index) => (
                                    <li key={index}>
                                        <a 
                                          href={source.uri} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-xs text-violet-400 hover:underline truncate block"
                                        >
                                          {index + 1}. {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     {hasSources && incompleteTasks.length > 0 && (
                        <div className="mt-3 border-t border-gray-700 pt-2">
                             <h4 className="text-xs font-semibold text-gray-400 mb-1">Link to Task:</h4>
                             <div className="flex space-x-2">
                                <select
                                    value={selectedTaskId}
                                    onChange={(e) => setSelectedTaskId(e.target.value)}
                                    className="flex-grow bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors disabled:opacity-50"
                                    disabled={isLinked}
                                >
                                    <option value="" disabled>Select a task...</option>
                                    {incompleteTasks.map(task => (
                                        <option key={task.id} value={task.id}>{task.text}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleLinkToTask}
                                    disabled={!selectedTaskId || isLinked}
                                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-3 py-1 text-xs rounded-md transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isLinked ? 'Linked!' : 'Link'}
                                </button>
                             </div>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
);
}

const UserMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div className="flex justify-end">
        <div className="bg-violet-600 rounded-lg p-3 max-w-xs sm:max-w-sm md:max-w-md">
            <p className="text-sm text-white">{message.text}</p>
        </div>
    </div>
);


export const ResearchAgent: React.FC<ResearchAgentProps> = ({ tasks, linkResearchToTask }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'agent', text: "Add topics below to get started, or ask me a question directly. I can search the web for up-to-date information." },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const performSearch = async (prompt: string) => {
    setIsLoading(true);
    const response = await getResearchResponse(prompt);
    
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
        ?.map(chunk => chunk.web)
        .filter(web => web?.uri)
        .map(web => ({ uri: web.uri!, title: web.title! })) || [];

    const agentMessage: ChatMessage = { 
        id: Date.now() + 1, 
        sender: 'agent', 
        text: text,
        sources: sources,
    };
    setMessages(prev => [...prev, agentMessage]);
    setIsLoading(false);
  }

  const handleTopicSearch = async (topicTitle: string) => {
    if (isLoading) return;
    const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text: `Tell me about: "${topicTitle}"` };
    setMessages(prev => [...prev, userMessage]);
    await performSearch(topicTitle);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userInput = input.trim();
    const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    await performSearch(userInput);
  };

  const addTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopic = newTopic.trim();
    if (!trimmedTopic || topics.some(t => t.title.toLowerCase() === trimmedTopic.toLowerCase())) {
        setNewTopic('');
        return;
    };
    setTopics(prev => [...prev, { id: Date.now(), title: trimmedTopic }]);
    setNewTopic('');
  };

  const removeTopic = (id: number) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="bg-gray-950 rounded-lg border border-gray-800 flex flex-col h-[42rem]">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-gray-200">Research Agent</h2>
        <p className="text-sm text-gray-400">Powered by Google Search</p>
      </div>
      <div className="p-4 border-b border-gray-800">
        <form onSubmit={addTopic} className="flex space-x-2">
            <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Add a research topic..."
            className="flex-grow bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            />
            <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-3 py-2 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            disabled={!newTopic.trim()}
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </form>
        {topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
                {topics.map(topic => (
                    <div key={topic.id} className="group bg-gray-800/80 rounded-full flex items-center">
                        <button onClick={() => handleTopicSearch(topic.title)} className="px-3 py-1 text-sm text-gray-300 group-hover:text-white transition-colors capitalize">
                            {topic.title}
                        </button>
                        <button onClick={() => removeTopic(topic.id)} className="pr-2 pl-1 text-gray-500 hover:text-red-400 transition-colors">
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) =>
          msg.sender === 'agent' ? <AgentMessage key={msg.id} message={msg} tasks={tasks} linkResearchToTask={linkResearchToTask} /> :
          <UserMessage key={msg.id} message={msg} />
        )}
        {isLoading && <AgentMessage message={{id: -1, sender: 'agent', isLoading: true}} tasks={tasks} linkResearchToTask={linkResearchToTask} />}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Latest news on AI..."
            className="flex-grow bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            disabled={isLoading}
          />
          <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed" disabled={isLoading}>
            Ask
          </button>
        </form>
      </div>
    </div>
  );
};