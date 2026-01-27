import React, { useState } from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PlusIcon } from './icons/PlusIcon';
import { getVideoInsights } from '../services/geminiService';

interface LearningZoneProps {
  onSchedule: (goal: string) => void;
}

type Tab = 'notes' | 'insights' | 'plan';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2 py-2">
        <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

export const LearningZone: React.FC<LearningZoneProps> = ({ onSchedule }) => {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [notes, setNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState('');
  
  const [insightTopic, setInsightTopic] = useState('');
  const [generatedInsights, setGeneratedInsights] = useState<string[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  
  const [planGoal, setPlanGoal] = useState('');

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteInput.trim()) {
      setNotes(prev => [noteInput.trim(), ...prev]);
      setNoteInput('');
    }
  };

  const handleGenerateInsights = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!insightTopic.trim() || isGeneratingInsights) return;

      setIsGeneratingInsights(true);
      setGeneratedInsights([]);
      try {
          const results = await getVideoInsights(insightTopic.trim());
          setGeneratedInsights(results);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingInsights(false);
      }
  };

  const saveInsightAsNote = (insight: string) => {
      setNotes(prev => [`[Insight: ${insightTopic}] ${insight}`, ...prev]);
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (planGoal.trim()) {
      onSchedule(planGoal.trim());
      setPlanGoal('');
    }
  };

  return (
    <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center mb-4 space-x-2">
        <BookOpenIcon className="w-6 h-6 text-violet-500" />
        <div>
            <h2 className="text-xl font-semibold text-gray-200">Growth Hub</h2>
            <p className="text-sm text-gray-400">Capture thoughts, get wisdom, and plan your growth.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-900 border border-gray-800 rounded-lg p-1 mb-5">
          <button onClick={() => setActiveTab('notes')} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'notes' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>📝 Notes</button>
          <button onClick={() => setActiveTab('insights')} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'insights' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>💡 Insights</button>
          <button onClick={() => setActiveTab('plan')} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'plan' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>📅 Plan</button>
      </div>

      {/* Content */}
      <div className="min-h-[12rem]">
        {activeTab === 'notes' && (
            <div className="space-y-4">
                <form onSubmit={handleSaveNote} className="space-y-2">
                    <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="What did you learn today?"
                        rows={2}
                        className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                    />
                    <button 
                        type="submit"
                        disabled={!noteInput.trim()}
                        className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Note
                    </button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {notes.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No notes yet. Capture your first spark!</p>}
                    {notes.map((note, idx) => (
                        <div key={idx} className="bg-gray-900/50 p-3 rounded-md border border-gray-800/50 text-sm text-gray-300 whitespace-pre-wrap">
                            {note}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'insights' && (
            <div className="space-y-4">
                 <form onSubmit={handleGenerateInsights} className="space-y-2">
                    <label className="block text-xs text-gray-400 uppercase font-bold">Video / Topic Wisdom</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={insightTopic}
                            onChange={(e) => setInsightTopic(e.target.value)}
                            placeholder="e.g., 'Video on Stoicism' or 'React Hooks'"
                            className="flex-grow bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                        />
                         <button 
                            type="submit"
                            disabled={!insightTopic.trim() || isGeneratingInsights}
                            className="px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isGeneratingInsights ? '...' : 'Go'}
                        </button>
                    </div>
                </form>
                
                {isGeneratingInsights && <LoadingSpinner />}
                
                {!isGeneratingInsights && generatedInsights.length > 0 && (
                    <div className="space-y-2 animate-fade-in">
                         <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">Key Takeaways</h4>
                        {generatedInsights.map((insight, idx) => (
                            <div key={idx} className="group relative bg-gray-900 p-3 rounded-lg border border-gray-800 hover:border-violet-500/30 transition-all">
                                <p className="text-sm text-gray-200 pr-6">{insight}</p>
                                <button 
                                    onClick={() => saveInsightAsNote(insight)}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-violet-400 transition-colors"
                                    title="Save to Notes"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                 {!isGeneratingInsights && generatedInsights.length === 0 && (
                     <p className="text-center text-gray-500 text-sm py-4">Enter a topic to get actionable growth points.</p>
                 )}
            </div>
        )}

        {activeTab === 'plan' && (
            <div className="space-y-4">
                <p className="text-sm text-gray-400">Dedicate time to learn something new. Schedule it on your calendar.</p>
                <form onSubmit={handleSchedule} className="flex space-x-2">
                    <input
                    type="text"
                    value={planGoal}
                    onChange={(e) => setPlanGoal(e.target.value)}
                    placeholder="e.g., Learn advanced SQL"
                    className="flex-grow bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                    />
                    <button
                    type="submit"
                    disabled={!planGoal.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed text-sm"
                    >
                    Schedule
                    </button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};
