import React, { useState } from 'react';
import type { Task, TimeBlock, TaskStatus, Quest } from '../types';
import { TaskItem } from './TaskItem';

interface DailyPlannerProps {
  tasks: Task[];
  allTasks: Task[];
  allQuests: Quest[];
  updateTaskTimeBlock: (id: number, timeBlock?: TimeBlock) => void;
  updateTaskStatus: (id: number, status: TaskStatus) => string;
  deleteTask: (id: number) => void;
  setTaskDependencies: (taskId: number, dependencyIds: number[]) => string;
  onScheduleTask: (task: Task) => void;
  onSuggestPriority: (taskId: number) => void;
  onViewInsight: (task: Task) => void;
}

interface PlannerColumnProps {
  title: string;
  icon: string;
  timeBlock?: TimeBlock;
  tasks: Task[];
  allTasks: Task[];
  allQuests: Quest[];
  isDragOver: boolean;
  onDragEnter: (timeBlock?: TimeBlock) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  // TaskItem props
  updateTaskStatus: (id: number, status: TaskStatus) => string;
  deleteTask: (id: number) => void;
  setTaskDependencies: (taskId: number, dependencyIds: number[]) => string;
  onScheduleTask: (task: Task) => void;
  onSuggestPriority: (taskId: number) => void;
  onViewInsight: (task: Task) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
}

const PlannerColumn: React.FC<PlannerColumnProps> = ({
  title, icon, timeBlock, tasks, allTasks, allQuests, isDragOver,
  onDragEnter, onDragLeave, onDrop,
  onSuggestPriority,
  onViewInsight,
  ...taskItemProps
}) => (
  <div
    onDragOver={(e) => {
      e.preventDefault();
      onDragEnter(timeBlock);
    }}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    className={`bg-gray-900/50 rounded-lg p-3 transition-colors duration-200`}
  >
    <h3 className="flex items-center text-md font-semibold text-gray-300 mb-3 px-1">
      <span className="mr-2 text-lg">{icon}</span>
      <span>{title}</span>
      <span className="ml-auto bg-gray-800 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
    </h3>
    <div className={`space-y-2 min-h-[100px] border-2 border-dashed rounded-md p-2 transition-colors ${isDragOver ? 'border-violet-500 bg-violet-900/20' : 'border-gray-800/50'}`}>
      {tasks.length > 0 ? (
        tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            allTasks={allTasks}
            allQuests={allQuests}
            isDragging={false} // Dragging is handled by the parent
            onUpdateStatus={taskItemProps.updateTaskStatus}
            onDelete={taskItemProps.deleteTask}
            onSetDependencies={taskItemProps.setTaskDependencies}
            onSchedule={taskItemProps.onScheduleTask}
            onSuggestPriority={onSuggestPriority}
            onViewInsight={onViewInsight}
            onDragStart={(e) => taskItemProps.onDragStart(e, task.id)}
          />
        ))
      ) : (
         <div className="text-gray-600 text-sm text-center flex items-center justify-center h-full p-4">
            Drag tasks here
        </div>
      )}
    </div>
  </div>
);

export const DailyPlanner: React.FC<DailyPlannerProps> = (props) => {
  const [dragOverColumn, setDragOverColumn] = useState<TimeBlock | undefined | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };
  
  const handleDrop = (e: React.DragEvent, targetTimeBlock?: TimeBlock) => {
    const taskIdStr = e.dataTransfer.getData('taskId');
    if (taskIdStr) {
      const taskId = parseInt(taskIdStr, 10);
      props.updateTaskTimeBlock(taskId, targetTimeBlock);
    }
    setDragOverColumn(null);
  };

  const priorityOrder: Record<Task['priority'], number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
  const sortTasks = (tasks: Task[]) => tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const morningTasks = sortTasks(props.tasks.filter(t => t.timeBlock === 'morning'));
  const lunchTasks = sortTasks(props.tasks.filter(t => t.timeBlock === 'lunch'));
  const afternoonTasks = sortTasks(props.tasks.filter(t => t.timeBlock === 'afternoon'));
  const unassignedTasks = sortTasks(props.tasks.filter(t => !t.timeBlock));

  const columnCommonProps = {
    allTasks: props.allTasks,
    allQuests: props.allQuests,
    onDragEnter: (timeBlock?: TimeBlock) => setDragOverColumn(timeBlock === null ? undefined : timeBlock),
    onDragLeave: () => setDragOverColumn(null),
    updateTaskStatus: props.updateTaskStatus,
    deleteTask: props.deleteTask,
    setTaskDependencies: props.setTaskDependencies,
    onScheduleTask: props.onScheduleTask,
    onSuggestPriority: props.onSuggestPriority,
    onViewInsight: props.onViewInsight,
    onDragStart: handleDragStart,
  };

  return (
    <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Daily Planner</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <PlannerColumn title="Morning" icon="☀️" timeBlock="morning" tasks={morningTasks} isDragOver={dragOverColumn === 'morning'} onDrop={(e) => handleDrop(e, 'morning')} {...columnCommonProps} />
        <PlannerColumn title="Lunch" icon="🥗" timeBlock="lunch" tasks={lunchTasks} isDragOver={dragOverColumn === 'lunch'} onDrop={(e) => handleDrop(e, 'lunch')} {...columnCommonProps} />
        <PlannerColumn title="Afternoon" icon="🌙" timeBlock="afternoon" tasks={afternoonTasks} isDragOver={dragOverColumn === 'afternoon'} onDrop={(e) => handleDrop(e, 'afternoon')} {...columnCommonProps} />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">🗃️ Unassigned Tasks</h3>
        <div 
          className={`space-y-2 p-2 bg-gray-900/50 rounded-lg min-h-[100px] transition-colors ${dragOverColumn === undefined ? 'bg-violet-900/20' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColumn(undefined); // undefined signifies the unassigned pool
          }}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={(e) => handleDrop(e, undefined)}
        >
          {unassignedTasks.length > 0 ? (
            unassignedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                allTasks={props.allTasks}
                allQuests={props.allQuests}
                isDragging={false}
                onUpdateStatus={props.updateTaskStatus}
                onDelete={props.deleteTask}
                onSetDependencies={props.setTaskDependencies}
                onSchedule={props.onScheduleTask}
                onSuggestPriority={props.onSuggestPriority}
                onViewInsight={props.onViewInsight}
                onDragStart={(e) => handleDragStart(e, task.id)}
              />
            ))
          ) : (
            <div className="text-gray-600 text-sm text-center p-8">All tasks have been scheduled for the day! 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
};