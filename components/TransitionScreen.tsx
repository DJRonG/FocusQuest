
import React, { useState, useEffect } from 'react';
import type { Task, Scene } from '../types';
import { getMindfulnessPrompt } from '../services/geminiService';

interface TransitionScreenProps {
  isOpen: boolean;
  onClose: () => void;
  completedTask: Task | null;
  nextTask: Task | null;
  scenes: Scene[];
  activateScene: (sceneId: string) => void;
}

const PromptLoader: React.FC = () => (
    <div className="h-6 bg-gray-700 rounded w-5/6 animate-pulse"></div>
);

export const TransitionScreen: React.FC<TransitionScreenProps> = ({
  isOpen,
  onClose,
  completedTask,
  nextTask,
  scenes,
  activateScene
}) => {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  useEffect(() => {
    if (isOpen && completedTask) {
      const fetchPrompt = async () => {
        setIsLoadingPrompt(true);
        setPrompt(null);
        const newPrompt = await getMindfulnessPrompt(completedTask, nextTask);
        setPrompt(newPrompt);
        setIsLoadingPrompt(false);
      };
      fetchPrompt();
    }
  }, [isOpen, completedTask, nextTask]);

  if (!isOpen || !completedTask) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-950/50 border border-gray-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl p-8 text-center items-center relative">
        <div className="absolute inset-0 bg-grid-gray-800/20 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        
        <h2 className="text-3xl font-bold text-green-400 z-10">Task Completed!</h2>
        <p className="text-lg text-gray-300 mt-1 z-10">You finished: <strong className="text-violet-400">"{completedTask.text}"</strong></p>

        <div className="my-8 h-px w-1/2 bg-gray-800 z-10"></div>

        <div className="min-h-[6rem] flex flex-col items-center justify-center z-10 w-full">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Your Mindful Moment</h3>
            {isLoadingPrompt && <PromptLoader />}
            {prompt && (
                 <blockquote className="border-l-4 border-violet-500 pl-4 py-2">
                    <p className="text-xl italic text-gray-200">"{prompt}"</p>
                </blockquote>
            )}
        </div>
        
        {scenes.length > 0 && (
            <div className="my-6 z-10">
                <h4 className="text-sm text-gray-400 mb-3">Set the mood for your transition:</h4>
                <div className="flex gap-4">
                    {scenes.map(scene => (
                         <button
                            key={scene.id}
                            onClick={() => activateScene(scene.id)}
                            className="flex flex-col items-center p-4 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800/80 hover:border-gray-700 transition-all duration-200"
                        >
                            <span className="text-3xl">{scene.icon}</span>
                            <span className="font-semibold text-gray-300 mt-2 text-sm">{scene.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <button
            onClick={onClose}
            className="mt-8 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md transition-colors z-10 shadow-lg shadow-violet-900/20"
        >
             {nextTask 
                ? (completedTask.category === 'work' && nextTask.category === 'external' 
                    ? `🏡 Switch to Personal: "${nextTask.text.substring(0, 20)}${nextTask.text.length > 20 ? '...' : ''}"` 
                    : (completedTask.category === 'external' && nextTask.category === 'work'
                        ? `💼 Switch to Work: "${nextTask.text.substring(0, 20)}${nextTask.text.length > 20 ? '...' : ''}"`
                        : `Continue to: "${nextTask.text.substring(0, 20)}${nextTask.text.length > 20 ? '...' : ''}"`))
                : "Return to Planner"}
        </button>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .bg-grid-gray-800\\/20 {
            background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 2rem 2rem;
        }
      `}</style>
    </div>
  );
};
