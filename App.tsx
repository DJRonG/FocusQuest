import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { AgentChat } from './components/AgentChat';
import { ResearchAgent } from './components/ResearchAgent';
import { DesignPrinciplesModal } from './components/DesignPrinciplesModal';
import { WorkZone } from './components/WorkZone';
import { NewsFeed } from './components/NewsFeed';
import { WebScraperAgent } from './components/WebScraperAgent';
import { HomeAssistant } from './components/HomeAssistant';
import { AdvancedIntegrations } from './components/AdvancedIntegrations';
import { CalendarIntegration } from './components/CalendarIntegration';
import { ScheduleTaskModal } from './components/ScheduleTaskModal';
import { DailyInspiration } from './components/DailyInspiration';
import { Feedback } from './components/Feedback';
import { LearningZone } from './components/LearningZone';
import { AddTaskForm } from './components/AddTaskForm';
import { DailyPlanner } from './components/DailyPlanner';
import { Quests } from './components/Quests';
import { PrioritySuggestionModal } from './components/PrioritySuggestionModal';
import { InsightModal } from './components/InsightModal';
import { TransitionScreen } from './components/TransitionScreen';
import { getPrioritySuggestion, getTaskCompletionInsight } from './services/geminiService';
import type { Task, TaskPriority, TaskStatus, AgentTools, HomeAssistantState, CalendarState, CalendarProvider, CalendarEvent, TaskCategory, TimeBlock, Quest, Floor, Scene } from './types';

// Mock Data for Calendar Events
const MOCK_EVENTS: Record<CalendarProvider, CalendarEvent[]> = {
  google: [
    { id: 'g1', title: 'Team Standup', startTime: new Date(new Date().setHours(9, 0, 0)).toISOString(), endTime: new Date(new Date().setHours(9, 30, 0)).toISOString(), source: 'google' },
    { id: 'g2', title: 'Design Review', startTime: new Date(new Date().setHours(11, 0, 0)).toISOString(), endTime: new Date(new Date().setHours(12, 0, 0)).toISOString(), source: 'google' },
    { id: 'g3', title: 'Project Sync', startTime: new Date(new Date().setHours(14, 0, 0)).toISOString(), endTime: new Date(new Date().setHours(15, 0, 0)).toISOString(), source: 'google' },
  ],
  outlook: [
    { id: 'o1', title: 'Weekly Business Review', startTime: new Date(new Date().setHours(10, 0, 0)).toISOString(), endTime: new Date(new Date().setHours(11, 0, 0)).toISOString(), source: 'outlook' },
    { id: 'o2', title: 'Lunch with Marketing Team', startTime: new Date(new Date().setHours(12, 30, 0)).toISOString(), endTime: new Date(new Date().setHours(13, 30, 0)).toISOString(), source: 'outlook' },
  ]
};

const MOCK_QUESTS: Quest[] = [
    { id: 101, title: 'Master Gemini API', description: 'Become proficient in using the Gemini API for various AI tasks including function calling and grounding.' },
    { id: 102, title: 'Launch FocusQuest v2', description: 'Complete all features and deploy the next version of the application.' },
];

const MOCK_FLOORS: Floor[] = [
  {
    id: 1,
    level: 0,
    name: "Ground Floor",
    rooms: [
      { id: 101, name: "Living Room", temperature: 21, humidity: 45, lightsOn: true },
      { id: 102, name: "Kitchen", temperature: 22, humidity: 55, lightsOn: true },
      { id: 103, name: "Office", temperature: 20, humidity: 40, lightsOn: false },
    ],
    plants: [
      { id: 201, name: "Ferdinand", species: "Ficus lyrata", location: "Living Room", lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 202, name: "Zoe", species: "Zamioculcas zamiifolia", location: "Office", lastWatered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    ]
  },
  {
    id: 2,
    level: 1,
    name: "First Floor",
    rooms: [
      { id: 104, name: "Bedroom", temperature: 19, humidity: 50, lightsOn: false },
      { id: 105, name: "Bathroom", temperature: 23, humidity: 65, lightsOn: false },
    ],
    plants: [
      { id: 203, name: "Snakey", species: "Dracaena trifasciata", location: "Bedroom", lastWatered: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    ]
  }
];

const MOCK_SCENES: Scene[] = [
  {
    id: 'scene-work-1',
    name: "Deep Focus",
    description: "Engage focus lighting and deep focus sounds to minimize distractions.",
    icon: "🎯",
    mode: 'work',
    actions: [
      { tool: 'setLighting', args: ['on'] },
      { tool: 'playAmbientSound', args: ['deep_focus'] },
    ]
  },
  {
    id: 'scene-work-2',
    name: "Winding Down",
    description: "Turn off all workspace ambient effects for the end of the day.",
    icon: "🌙",
    mode: 'work',
    actions: [
      { tool: 'setLighting', args: ['off'] },
      { tool: 'playAmbientSound', args: ['none'] },
    ]
  },
   {
    id: 'scene-personal-1',
    name: "Morning Routine",
    description: "Start your day by automatically beginning your first morning task.",
    icon: "☀️",
    mode: 'personal',
    actions: [
      { tool: 'updateTaskStatusByText', args: ['Morning: Read & Write session', 'In Progress'] }
    ]
  },
  {
    id: 'scene-personal-2',
    name: "Relax & Unwind",
    description: "Create a calming atmosphere with rain sounds and dim lighting.",
    icon: "🧘",
    mode: 'personal',
    actions: [
      { tool: 'setLighting', args: ['off'] },
      { tool: 'playAmbientSound', args: ['rain'] },
    ]
  },
  {
    id: 'scene-transition-1',
    name: "Mindful Moment",
    description: "A short break with calm sounds to reset your focus.",
    icon: "🧘‍♀️",
    mode: 'work', // Also applicable to personal
    actions: [
      { tool: 'playAmbientSound', args: ['forest'] },
    ]
  },
  {
    id: 'scene-transition-2',
    name: "Shift Gears",
    description: "Transition from work to personal time with uplifting energy.",
    icon: "🎉",
    mode: 'personal',
    actions: [
      { tool: 'setLighting', args: ['on'] },
      { tool: 'playAmbientSound', args: ['none'] },
    ]
  }
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Set up project structure', status: 'Done', priority: 'Medium', category: 'work', questId: 102 },
    { id: 2, text: 'Design main UI components', status: 'In Progress', priority: 'High', category: 'work', dependsOn: [3], questId: 102, startTime: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, text: 'Integrate Gemini API for agent', status: 'To Do', priority: 'High', category: 'work', timeBlock: 'morning', questId: 101, deadline: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0] },
    { id: 4, text: 'Run Final Tests', status: 'To Do', priority: 'Medium', category: 'work', timeBlock: 'afternoon' },
    { id: 5, text: 'Deploy App', status: 'To Do', priority: 'High', category: 'work', dependsOn: [4], questId: 102 },
    { id: 6, text: 'Morning: Read & Write session', status: 'To Do', priority: 'Medium', category: 'external', timeBlock: 'morning' },
    { id: 7, text: 'Take a break - Play video games', status: 'To Do', priority: 'Low', category: 'external' },
  ]);
  const [quests, setQuests] = useState<Quest[]>(MOCK_QUESTS);
  const [appMode, setAppMode] = useState<'work' | 'personal'>('work');
  const [scenes, setScenes] = useState<Scene[]>(MOCK_SCENES);

  const [isPrinciplesModalOpen, setIsPrinciplesModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [taskToSchedule, setTaskToSchedule] = useState<Task | null>(null);
  const [suggestionModalState, setSuggestionModalState] = useState<{
    isOpen: boolean;
    task: Task | null;
    suggestion: TaskPriority | null;
    isLoading: boolean;
    error: string | null;
  }>({ isOpen: false, task: null, suggestion: null, isLoading: false, error: null });
  const [insightModalState, setInsightModalState] = useState<{
    isOpen: boolean;
    task: Task | null;
  }>({ isOpen: false, task: null });
  const [transitionState, setTransitionState] = useState<{
    isOpen: boolean;
    completedTask: Task | null;
    nextTask: Task | null;
  }>({ isOpen: false, completedTask: null, nextTask: null });
  const [homeState, setHomeState] = useState<HomeAssistantState>({
    lighting: false,
    ambientSound: 'none',
    floors: MOCK_FLOORS,
  });
  const [calendarState, setCalendarState] = useState<CalendarState>({
    connected: null,
    events: [],
  });
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    const newlyCompletedTasks = tasks.filter(t => 
      t.status === 'Done' && 
      !t.aiInsight && 
      !t.isGeneratingInsight
    );

    if (newlyCompletedTasks.length > 0) {
      newlyCompletedTasks.forEach(async (task) => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isGeneratingInsight: true } : t));
        
        let insight: string;
        try {
          insight = await getTaskCompletionInsight(task);
        } catch (e) {
          insight = "Could not generate an insight for this task.";
        }
        
        const taskWithInsight = { ...task, aiInsight: insight, isGeneratingInsight: false };
        
        setTasks(prev => prev.map(t => t.id === task.id ? taskWithInsight : t));
      });
    }
  }, [tasks]);

  const handleCloseTransition = () => {
    const { completedTask, nextTask } = transitionState;
    setTransitionState({ isOpen: false, completedTask: null, nextTask: null });

    // Auto-switch mode if transitioning from work to personal (or vice versa) to ensure the user sees their next task.
    if (nextTask) {
        if (appMode === 'work' && nextTask.category === 'external') {
            setAppMode('personal');
        } else if (appMode === 'personal' && nextTask.category === 'work') {
            setAppMode('work');
        }
    }

    if (completedTask) {
        // Find the latest version of the task, which might now have an insight
        const updatedTask = tasks.find(t => t.id === completedTask.id);
        if (updatedTask && updatedTask.aiInsight) {
            setInsightModalState({ isOpen: true, task: updatedTask });
        }
    }
  };

  const addFeedback = (text: string): void => {
    setFeedback(prev => [text, ...prev]);
  };

  const addQuest = (title: string, description: string) => {
    const newQuest: Quest = { id: Date.now(), title, description };
    setQuests(prev => [...prev, newQuest]);
  };
  
  const addTask = (text: string, priority: TaskPriority = 'Medium', category: TaskCategory = 'work', questId?: number, deadline?: string): string => {
    const newTask: Task = {
      id: Date.now(),
      text,
      status: 'To Do',
      priority,
      category,
      questId,
      deadline,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    return `Successfully added task: "${text}" with ${priority} priority.`;
  };

  const updateTaskTimeBlock = (id: number, timeBlock?: TimeBlock): void => {
    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === id ? { ...task, timeBlock } : task))
    );
  };

  const updateTaskStatus = (id: number, status: TaskStatus): string => {
    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate) return `Task with id ${id} not found.`;

    if (status === 'Done') {
      const unmetDependencies = taskToUpdate.dependsOn?.filter(depId => {
        const dependentTask = tasks.find(t => t.id === depId);
        return dependentTask && dependentTask.status !== 'Done';
      }) || [];
      if (unmetDependencies.length > 0) {
        const blocker = tasks.find(t => t.id === unmetDependencies[0]);
        return `Cannot mark as done. Task is blocked by: "${blocker?.text}".`;
      }
    }

    let updatedTask: Task = { ...taskToUpdate, status: status };

    if (status === 'In Progress' && !taskToUpdate.startTime) {
      updatedTask.startTime = new Date().toISOString();
    }
    
    if (status === 'Done' && taskToUpdate.status !== 'Done') {
        updatedTask.completionTime = new Date().toISOString();
        
        // Find next task with intelligent context switching
        // 1. Look for tasks in the current mode.
        // 2. If none, look for tasks in the other mode (to facilitate Work -> Personal transition).
        
        const getSortedTasks = (cat: TaskCategory) => tasks
            .filter(t => t.id !== id && t.status !== 'Done' && t.category === cat)
            .sort((a, b) => {
                const priorityOrder: Record<TaskPriority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });

        const currentModeCategory: TaskCategory = appMode === 'work' ? 'work' : 'external';
        const otherModeCategory: TaskCategory = appMode === 'work' ? 'external' : 'work';

        let nextTask = getSortedTasks(currentModeCategory)[0] || null;

        if (!nextTask) {
             // Current queue is empty, check the other queue
             nextTask = getSortedTasks(otherModeCategory)[0] || null;
        }

        setTransitionState({ isOpen: true, completedTask: updatedTask, nextTask: nextTask });
    }
    
    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === id ? updatedTask : task))
    );

    return `Successfully updated task "${taskToUpdate.text}" to status "${status}".`;
  };

  const updateTaskStatusByText = (text: string, status: TaskStatus): string => {
    const task = findTaskByText(text);
    if ('error' in task) {
        return task.error;
    }
    return updateTaskStatus(task.id, status);
  };


  const updateTaskPriority = (id: number, priority: TaskPriority): string => {
    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate) return `Task with id ${id} not found.`;

    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === id ? { ...task, priority } : task))
    );
    return `Successfully updated priority for task "${taskToUpdate.text}" to "${priority}".`;
  };
  
  const setTaskDependencies = (taskId: number, dependencyIds: number[]): string => {
    // Basic cycle detection
    const checkCycle = (currentId: number, path: number[]): boolean => {
      if (path.includes(currentId)) return true;
      const task = tasks.find(t => t.id === currentId);
      if (!task?.dependsOn) return false;
      return task.dependsOn.some(depId => checkCycle(depId, [...path, currentId]));
    };

    if (dependencyIds.some(depId => checkCycle(depId, [taskId]))) {
      return "Error: Adding this dependency would create a circular reference.";
    }

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, dependsOn: dependencyIds } : task
      )
    );
    const task = tasks.find(t => t.id === taskId);
    return `Dependencies for task "${task?.text}" updated.`;
  };

  const deleteTask = (id: number): string => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return `Task with id ${id} not found.`;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    return `Successfully deleted task: "${taskToDelete.text}"`;
  };

  const findTaskByText = (searchText: string): Task | { error: string } => {
    const foundTask = tasks.find(task => task.text.toLowerCase().includes(searchText.toLowerCase()));
    return foundTask || { error: `No task found containing "${searchText}"` };
  };

  const linkResearchToTask = (taskId: number, links: { uri: string; title: string }[]): string => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return `Task with id ${taskId} not found.`;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, researchLinks: [...(task.researchLinks || []), ...links] } : task
      )
    );
    return `Successfully linked research to task: "${taskToUpdate.text}".`;
  };

  const setLighting = (status: 'on' | 'off'): string => {
    const newStatus = status === 'on';
    setHomeState(prevState => ({ ...prevState, lighting: newStatus }));
    return `Focus lighting turned ${status}.`;
  };

  const playAmbientSound = (sound: 'rain' | 'cafe' | 'deep_focus' | 'forest' | 'none'): string => {
    setHomeState(prevState => ({ ...prevState, ambientSound: sound }));
    if (sound === 'none') return 'Ambient sound stopped.';
    return `Now playing ${sound.replace('_', ' ')} ambient sound.`;
  };

  const waterPlant = (plantId: number): void => {
    setHomeState(prevState => {
      const newFloors = prevState.floors.map(floor => ({
        ...floor,
        plants: floor.plants.map(plant => 
          plant.id === plantId 
            ? { ...plant, lastWatered: new Date().toISOString() } 
            : plant
        )
      }));
      return { ...prevState, floors: newFloors };
    });
  };

  const toggleRoomLight = (roomId: number): void => {
    setHomeState(prevState => {
      const newFloors = prevState.floors.map(floor => ({
        ...floor,
        rooms: floor.rooms.map(room =>
          room.id === roomId
            ? { ...room, lightsOn: !room.lightsOn }
            : room
        )
      }));
      return { ...prevState, floors: newFloors };
    });
  };

  const activateScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) {
      console.error(`Scene with id ${sceneId} not found.`);
      return;
    }

    const actionMap: { [key: string]: (...args: any[]) => any } = {
      setLighting,
      playAmbientSound,
      updateTaskStatusByText,
    };

    scene.actions.forEach(action => {
      const func = actionMap[action.tool];
      if (func) {
        func(...action.args);
      } else {
        console.warn(`Action tool "${action.tool}" is not defined.`);
      }
    });
  };

  // Calendar Functions
  const connectCalendar = (provider: CalendarProvider) => {
    // In a real app, this would trigger an OAuth flow.
    setCalendarState({ connected: provider, events: MOCK_EVENTS[provider] });
  };
  
  const disconnectCalendar = () => {
    setCalendarState({ connected: null, events: [] });
  };

  const viewTodaysEvents = (): CalendarEvent[] => {
    return calendarState.events;
  };

  const scheduleTaskOnCalendar = (taskId: number, startTime: string, durationMinutes: number): string => {
    if (!calendarState.connected) return "Error: No calendar is connected.";
    const task = tasks.find(t => t.id === taskId);
    if (!task) return `Error: Task with ID ${taskId} not found.`;
    
    // This is a simulation. In a real app, you would make an API call here.
    console.log(`Scheduling task "${task.text}" on ${calendarState.connected} calendar.`);
    console.log(`Start: ${startTime}, Duration: ${durationMinutes} minutes.`);
    
    // Add to our mock events for instant feedback in the UI
    const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();
    const newEvent: CalendarEvent = {
      id: `task-${taskId}-${Date.now()}`,
      title: task.text,
      startTime,
      endTime,
      source: calendarState.connected,
    };
    setCalendarState(prevState => ({ ...prevState, events: [...prevState.events, newEvent].sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) }));

    return `Successfully scheduled "${task.text}" on your ${calendarState.connected} calendar.`;
  };

  const handleScheduleTask = (task: Task) => {
    if (!calendarState.connected) {
      alert("Please connect a calendar first in the 'Calendar Integration' section.");
      return;
    }
    setTaskToSchedule(task);
    setIsScheduleModalOpen(true);
  };
  
  const addAndScheduleLearningTask = (text: string) => {
    const newTask: Task = {
      id: Date.now(),
      text: `[Learning] ${text}`,
      status: 'To Do',
      priority: 'Low',
      category: 'external',
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    handleScheduleTask(newTask);
  };

  const suggestTaskPriority = async (taskId: number): Promise<string> => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return `Error: Task with ID ${taskId} not found.`;

      try {
          const suggestion = await getPrioritySuggestion(task, tasks, quests);
          return `Based on my analysis, I suggest setting the priority for "${task.text}" to **${suggestion}**. Deadlines, dependencies, and project goals were considered.`;
      } catch (error) {
          console.error(error);
          return "Sorry, I couldn't generate a suggestion right now.";
      }
  };

  const handleSuggestPriority = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setSuggestionModalState({ isOpen: true, task, suggestion: null, isLoading: true, error: null });

    try {
        const suggestion = await getPrioritySuggestion(task, tasks, quests);
        setSuggestionModalState({ isOpen: true, task, suggestion, isLoading: false, error: null });
    } catch (error) {
        console.error(error);
        setSuggestionModalState({ isOpen: true, task, suggestion: null, isLoading: false, error: "Could not generate a suggestion." });
    }
  };
  
  const handleViewInsight = (task: Task) => {
    setInsightModalState({ isOpen: true, task });
  };

  const agentTools: AgentTools = { 
    addTask: (text, priority) => addTask(text, priority, 'work'), // Agent adds 'work' tasks by default
    updateTaskStatus, 
    deleteTask, 
    findTaskByText, 
    setTaskDependencies,
    suggestTaskPriority,
    setLighting, 
    playAmbientSound,
    viewTodaysEvents,
    scheduleTaskOnCalendar,
  };
  
  const filteredTasksForPlanner = tasks.filter(task => appMode === 'work' ? task.category === 'work' : task.category === 'external');

  const isWorkToPersonalTransition = transitionState.completedTask?.category === 'work' && transitionState.nextTask?.category === 'external';
  const transitionScenes = scenes.filter(scene => {
      if (isWorkToPersonalTransition) return scene.id === 'scene-transition-2';
      return scene.id === 'scene-transition-1';
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header 
          onOpenPrinciples={() => setIsPrinciplesModalOpen(true)} 
          appMode={appMode}
          setAppMode={setAppMode}
        />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <WorkZone tasks={filteredTasksForPlanner} addTask={addTask} />
            <Quests quests={quests} tasks={tasks} addQuest={addQuest} />
            <AddTaskForm onAddTask={addTask} quests={quests} />
            <DailyPlanner
              tasks={filteredTasksForPlanner}
              allTasks={tasks}
              allQuests={quests}
              updateTaskTimeBlock={updateTaskTimeBlock}
              updateTaskStatus={updateTaskStatus}
              deleteTask={deleteTask}
              setTaskDependencies={setTaskDependencies}
              onScheduleTask={handleScheduleTask}
              onSuggestPriority={handleSuggestPriority}
              onViewInsight={handleViewInsight}
            />
            <WebScraperAgent addTask={(text) => addTask(text, 'Medium', 'work')} />
            <HomeAssistant 
              homeState={homeState}
              setLighting={setLighting}
              playAmbientSound={playAmbientSound}
              waterPlant={waterPlant}
              toggleRoomLight={toggleRoomLight}
              scenes={scenes}
              activateScene={activateScene}
              appMode={appMode}
            />
            <AdvancedIntegrations />
          </div>
          <div className="space-y-8">
            <NewsFeed appMode={appMode} tasks={filteredTasksForPlanner} />
            <DailyInspiration />
            <LearningZone onSchedule={addAndScheduleLearningTask} />
            <CalendarIntegration 
              calendarState={calendarState}
              onConnect={connectCalendar}
              onDisconnect={disconnectCalendar}
            />
            <AgentChat tasks={tasks} agentTools={agentTools} calendarState={calendarState} />
            <ResearchAgent 
              tasks={tasks}
              linkResearchToTask={linkResearchToTask}
            />
            <Feedback submittedFeedback={feedback} onSubmitFeedback={addFeedback} />
          </div>
        </main>
      </div>
      <DesignPrinciplesModal 
        isOpen={isPrinciplesModalOpen} 
        onClose={() => setIsPrinciplesModalOpen(false)} 
      />
      <ScheduleTaskModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        task={taskToSchedule}
        onSchedule={scheduleTaskOnCalendar}
      />
      <PrioritySuggestionModal
        state={suggestionModalState}
        onClose={() => setSuggestionModalState({ isOpen: false, task: null, suggestion: null, isLoading: false, error: null })}
        onAccept={(taskId, priority) => {
            updateTaskPriority(taskId, priority);
            setSuggestionModalState({ isOpen: false, task: null, suggestion: null, isLoading: false, error: null });
        }}
      />
       <InsightModal
        isOpen={insightModalState.isOpen}
        onClose={() => setInsightModalState({ isOpen: false, task: null })}
        task={insightModalState.task}
      />
      <TransitionScreen
        isOpen={transitionState.isOpen}
        onClose={handleCloseTransition}
        completedTask={transitionState.completedTask}
        nextTask={transitionState.nextTask}
        scenes={transitionScenes}
        activateScene={activateScene}
      />
    </div>
  );
};

export default App;