import React, { useState } from 'react';
import type { Task, TaskPriority, TaskStatus, Quest } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  updateTaskStatus: (id: number, status: TaskStatus) => string;
  deleteTask: (id: number) => void;
  setTaskDependencies: (taskId: number, dependencyIds: number[]) => string;
  onScheduleTask: (task: Task) => void;
  allQuests: Quest[];
}

interface TaskColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  allTasks: Task[];
  allQuests: Quest[];
  draggedTaskId: number | null;
  isDragOver: boolean;
  onUpdateStatus: (id: number, status: TaskStatus) => string;
  onDelete: (id: number) => void;
  onSetDependencies: (taskId: number, dependencyIds: number[]) => string;
  onScheduleTask: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDragEnter: (status: TaskStatus) => void;
  onDragLeave: () => void;
  onDrop: (status: TaskStatus) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ 
  title, 
  status,
  tasks, 
  allTasks,
  allQuests,
  draggedTaskId,
  isDragOver,
  onUpdateStatus, 
  onDelete, 
  onSetDependencies, 
  onScheduleTask,
  onDragStart,
  onDragEnter,
  onDragLeave,
  onDrop,
}) => (
  <div 
    onDragOver={(e) => e.preventDefault()}
    onDragEnter={() => onDragEnter(status)}
    onDragLeave={onDragLeave}
    onDrop={() => onDrop(status)}
    className={`flex-1 bg-gray-900/50 rounded-lg p-3 min-w-[280px] transition-colors duration-200 ${isDragOver ? 'bg-gray-800' : ''}`}
  >
    <h3 className="flex items-center justify-between text-md font-semibold text-gray-300 mb-3 px-1">
      <span>{title}</span>
      <span className="bg-gray-800 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
    </h3>
    <div className="space-y-2 min-h-[100px]">
      {tasks.length > 0 ? (
        tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            allTasks={allTasks}
            allQuests={allQuests}
            isDragging={draggedTaskId === task.id}
            onUpdateStatus={onUpdateStatus} 
            onDelete={onDelete}
            onSetDependencies={onSetDependencies}
            onSchedule={onScheduleTask}
            onDragStart={(e) => onDragStart(task.id)}
            onSuggestPriority={() => {}} // Placeholder as this component isn't primarily used with the modal
            onViewInsight={() => {}} // Placeholder
          />
        ))
      ) : (
        <div className={`text-gray-600 text-sm text-center flex items-center justify-center h-full p-4 border-2 border-dashed rounded-md transition-colors ${isDragOver ? 'border-violet-500 text-violet-400' : 'border-gray-800/50'}`}>
            {isDragOver ? 'Drop Task Here' : 'No tasks'}
        </div>
      )}
    </div>
  </div>
);

export const TaskList: React.FC<TaskListProps> = ({ tasks, updateTaskStatus, deleteTask, setTaskDependencies, onScheduleTask, allQuests }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const addTask = (text: string, priority: TaskPriority) => {
    // This is a local helper, the main logic is in App.tsx
    // For this component, we just need to call the prop.
    // However, the current props don't include addTask, so we will stub it for now
    // In a full refactor, addTask would be passed in.
    console.log(`Adding task: ${text} with priority ${priority}`);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = newTaskText.trim();
    if (trimmedText) {
      addTask(trimmedText, newPriority);
      setNewTaskText('');
      setNewPriority('Medium');
    }
  };

  const handleDragStart = (id: number) => {
    setDraggedTaskId(id);
  };
  
  const handleDrop = (targetStatus: TaskStatus) => {
    if (draggedTaskId !== null) {
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== targetStatus) {
        updateTaskStatus(draggedTaskId, targetStatus);
      }
    }
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const priorityOrder: Record<TaskPriority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
  
  const sortTasks = (tasks: Task[]) => tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const filteredTasks = tasks.filter(task => 
    task.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todoTasks = sortTasks(filteredTasks.filter(task => task.status === 'To Do'));
  const inProgressTasks = sortTasks(filteredTasks.filter(task => task.status === 'In Progress'));
  const doneTasks = sortTasks(filteredTasks.filter(task => task.status === 'Done'));

  const columnProps = {
    allTasks: tasks, // Pass original unfiltered tasks for dependency lookups
    allQuests: allQuests,
    draggedTaskId,
    onUpdateStatus: updateTaskStatus,
    onDelete: deleteTask,
    onSetDependencies: setTaskDependencies,
    onScheduleTask: onScheduleTask,
    onDragStart: handleDragStart,
    onDragEnter: (status: TaskStatus) => { if(draggedTaskId) setDragOverStatus(status) },
    onDragLeave: () => setDragOverStatus(null),
    onDrop: handleDrop,
  };

  return (
    <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">My Tasks Workflow</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
        />
      </div>

      <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task to 'To Do'..."
          className="flex-grow bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
        />
        <div className="flex space-x-2">
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            className="bg-gray-900 border border-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-gray-200 w-full sm:w-auto"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            disabled={!newTaskText.trim()}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
      
      <div className="flex flex-col lg:flex-row gap-4">
        <TaskColumn title="📝 To Do" status="To Do" tasks={todoTasks} isDragOver={dragOverStatus === 'To Do'} {...columnProps} />
        <TaskColumn title="⚙️ In Progress" status="In Progress" tasks={inProgressTasks} isDragOver={dragOverStatus === 'In Progress'} {...columnProps} />
        <TaskColumn title="✅ Done" status="Done" tasks={doneTasks} isDragOver={dragOverStatus === 'Done'} {...columnProps} />
      </div>
    </div>
  );
};