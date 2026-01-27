import React, { useState } from 'react';
import type { TaskPriority, TaskCategory, Quest } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface AddTaskFormProps {
  onAddTask: (text: string, priority: TaskPriority, category: TaskCategory, questId?: number, deadline?: string) => void;
  quests: Quest[];
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask, quests }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [selectedQuestId, setSelectedQuestId] = useState<string>('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      const questId = selectedQuestId ? parseInt(selectedQuestId, 10) : undefined;
      onAddTask(text.trim(), priority, category, questId, deadline || undefined);
      setText('');
      setPriority('Medium');
      setCategory('work');
      setSelectedQuestId('');
      setDeadline('');
    }
  };

  return (
    <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Add a New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Link to Quest (Optional)</label>
                <select
                    value={selectedQuestId}
                    onChange={(e) => setSelectedQuestId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-200"
                >
                    <option value="">None</option>
                    {quests.map(quest => (
                        <option key={quest.id} value={quest.id}>{quest.title}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-400 mb-1">Deadline (Optional)</label>
                <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
            <div className="flex bg-gray-900 border border-gray-800 rounded-md p-1">
              <button type="button" onClick={() => setCategory('work')} className={`flex-1 py-1 rounded-md text-sm transition-colors ${category === 'work' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                💼 Work
              </button>
              <button type="button" onClick={() => setCategory('external')} className={`flex-1 py-1 rounded-md text-sm transition-colors ${category === 'external' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                🏡 External
              </button>
            </div>
          </div>
          <div className="self-end">
            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
              disabled={!text.trim()}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Task
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};