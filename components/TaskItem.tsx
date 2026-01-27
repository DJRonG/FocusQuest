import React, { useState } from 'react';
import type { Task, TaskPriority, TaskStatus, Quest } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { LinkIcon } from './icons/LinkIcon';
import { ChainIcon } from './icons/ChainIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { DependencyModal } from './DependencyModal';

interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  allQuests: Quest[];
  isDragging: boolean;
  onUpdateStatus: (id: number, status: TaskStatus) => string;
  onDelete: (id: number) => void;
  onSetDependencies: (taskId: number, dependencyIds: number[]) => string;
  onSchedule: (task: Task) => void;
  onSuggestPriority: (taskId: number) => void;
  onViewInsight: (task: Task) => void;
  onDragStart: (e: React.DragEvent) => void;
}

const priorityColorMap: Record<TaskPriority, string> = {
  'High': 'bg-red-500',
  'Medium': 'bg-yellow-500',
  'Low': 'bg-sky-500',
};

const InsightLoader: React.FC = () => (
    <div className="flex items-center space-x-1.5">
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <span className="text-xs text-gray-500">Generating insight...</span>
    </div>
);

export const TaskItem: React.FC<TaskItemProps> = ({ task, allTasks, allQuests, isDragging, onUpdateStatus, onDelete, onSetDependencies, onSchedule, onSuggestPriority, onViewInsight, onDragStart }) => {
  const [isLinksVisible, setIsLinksVisible] = useState(false);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);

  const hasLinks = task.researchLinks && task.researchLinks.length > 0;
  const isDone = task.status === 'Done';

  const unmetDependencies = (task.dependsOn || [])
    .map(depId => allTasks.find(t => t.id === depId))
    .filter((depTask): depTask is Task => !!depTask && depTask.status !== 'Done');

  const isLocked = unmetDependencies.length > 0 && task.status !== 'Done';

  const quest = task.questId ? allQuests.find(q => q.id === task.questId) : null;

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatusUpdateMessage(null);
    const result = onUpdateStatus(task.id, newStatus);
    if (result && !result.toLowerCase().startsWith('success')) {
      setStatusUpdateMessage(result);
      setTimeout(() => setStatusUpdateMessage(null), 3000);
    }
  };
  
  const handleCheckboxChange = () => {
    if (isLocked) return;
    handleStatusChange(task.status === 'Done' ? 'To Do' : 'Done');
  };

  const blockerTooltip = isLocked ? `Blocked by: ${unmetDependencies.map(t => t.text).join(', ')}` : '';

  return (
    <>
      <div 
        draggable={!isDone}
        onDragStart={onDragStart}
        className={`bg-gray-800/50 rounded-md p-3 transition-all duration-200 ${isDone ? 'opacity-60' : 'cursor-grab'} ${isLocked ? 'border-l-2 border-orange-500' : ''} ${isDragging ? 'opacity-20' : ''}`}>
        {statusUpdateMessage && (
          <div className="text-xs text-red-400 mb-2 p-2 bg-red-500/10 rounded-md">
            {statusUpdateMessage}
          </div>
        )}
        <div className="flex items-start justify-between">
            <div className="flex-grow min-w-0">
               <div className="flex items-start">
                  <input 
                    type="checkbox"
                    checked={isDone}
                    onChange={handleCheckboxChange}
                    disabled={isLocked}
                    className="mt-1 h-4 w-4 rounded bg-gray-700 border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:cursor-not-allowed"
                    title={isLocked ? blockerTooltip : (isDone ? "Mark as 'To Do'" : "Mark as 'Done'")}
                  />
                  <div className="ml-3 flex-shrink-0 mt-1.5 flex items-center space-x-2">
                    {isLocked && <span title={blockerTooltip} className="text-orange-400">🔒</span>}
                    <span title={`Category: ${task.category}`}>{task.category === 'work' ? '💼' : '🏡'}</span>
                    <div className={`w-2 h-2 rounded-full ${priorityColorMap[task.priority]}`} title={`Priority: ${task.priority}`}></div>
                  </div>
                  <p className={`ml-3 ${isDone ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{task.text}</p>
              </div>
              <div className="mt-2 ml-8 pl-1 flex flex-wrap gap-2 items-center">
                  {quest && (
                      <span className="text-xs font-semibold bg-gray-700 text-violet-300 px-2 py-0.5 rounded-full">
                          🎯 {quest.title}
                      </span>
                  )}
                  {task.deadline && (
                      <span className="text-xs font-semibold bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                          📅 {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                  )}
              </div>
            </div>
            <div className="flex items-center ml-2 flex-shrink-0 space-x-1">
              <button onClick={() => onDelete(task.id)} className="text-gray-600 hover:text-red-500 transition-all p-1 rounded-md" title="Delete task">
                  <TrashIcon className="w-4 h-4" />
              </button>
            </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
          <div className="flex items-center space-x-1">
              {hasLinks && (
                  <button
                  onClick={() => setIsLinksVisible(!isLinksVisible)}
                  className="text-gray-500 hover:text-violet-400 transition-colors p-1 rounded-md"
                  title="Show research links"
                  >
                  <LinkIcon className="w-4 h-4" />
                  </button>
              )}
               <button
                  onClick={() => setIsDependencyModalOpen(true)}
                  className="text-gray-500 hover:text-violet-400 transition-colors p-1 rounded-md"
                  title="Set dependencies"
                >
                  <ChainIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSchedule(task)}
                  className="text-gray-500 hover:text-violet-400 transition-colors p-1 rounded-md"
                  title="Add to calendar"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSuggestPriority(task.id)}
                  className="text-gray-500 hover:text-violet-400 transition-colors p-1 rounded-md"
                  title="Suggest Priority (AI)"
                >
                  ✨
                </button>
          </div>
          <div className="flex items-center">
            {task.isGeneratingInsight && <InsightLoader />}
            {task.status === 'Done' && task.aiInsight && !task.isGeneratingInsight && (
              <button
                  onClick={() => onViewInsight(task)}
                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center space-x-1 transition-colors"
                  title="View AI-generated insight"
              >
                  <LightbulbIcon className="w-4 h-4" />
                  <span>View Insight</span>
              </button>
            )}
          </div>
        </div>
        
        {isLinksVisible && hasLinks && (
          <div className="mt-2">
            <ul className="space-y-1.5 border-l-2 border-gray-700 pl-3">
              <li className="text-xs font-semibold text-gray-500">Linked Research:</li>
              {task.researchLinks?.map((link, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-violet-400 mr-2 mt-0.5">↳</span>
                  <a
                    href={link.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-gray-200 hover:underline truncate"
                    title={link.uri}
                  >
                    {link.title || link.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <DependencyModal
        isOpen={isDependencyModalOpen}
        onClose={() => setIsDependencyModalOpen(false)}
        task={task}
        allTasks={allTasks}
        onSetDependencies={onSetDependencies}
      />
    </>
  );
};