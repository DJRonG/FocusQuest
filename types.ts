import type { FunctionCall } from '@google/genai';

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskCategory = 'work' | 'external';
export type TimeBlock = 'morning' | 'lunch' | 'afternoon';

export interface Quest {
  id: number;
  title: string;
  description: string;
}

export interface Task {
  id: number;
  text: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  questId?: number;
  timeBlock?: TimeBlock;
  dependsOn?: number[];
  deadline?: string;
  researchLinks?: {
      uri: string;
      title: string;
  }[];
  startTime?: string; // ISO String
  completionTime?: string; // ISO String
  aiInsight?: string;
  isGeneratingInsight?: boolean;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'agent' | 'tool';
  text?: string;
  isLoading?: boolean;
  functionCall?: FunctionCall;
  functionResponse?: {
      name: string;
      response: any;
  };
  sources?: {
      uri: string;
      title: string;
  }[];
  scheduleProposal?: {
    taskId: number;
    taskText: string;
    startTime: string;
    durationMinutes: number;
  };
}

export type AmbientSound = 'none' | 'rain' | 'cafe' | 'deep_focus' | 'forest';

export interface Plant {
  id: number;
  name: string;
  species: string;
  location: string; // Room name
  lastWatered: string; // ISO String
}

export interface Room {
  id: number;
  name: string;
  temperature: number; // Celsius
  humidity: number; // Percentage
  lightsOn: boolean;
}

export interface Floor {
  id: number;
  level: number;
  name: string;
  rooms: Room[];
  plants: Plant[];
}

export interface HomeAssistantState {
  lighting: boolean;
  ambientSound: AmbientSound;
  floors: Floor[];
}

export type CalendarProvider = 'google' | 'outlook';

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: string; // ISO String
    endTime: string; // ISO String
    source: CalendarProvider;
}

export interface CalendarState {
    connected: CalendarProvider | null;
    events: CalendarEvent[];
}

export interface SceneAction {
  tool: string; // e.g., 'setLighting', 'playAmbientSound', 'updateTaskStatusByText'
  args: any[];
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  icon: string;
  mode: 'work' | 'personal';
  actions: SceneAction[];
}

export interface AgentTools {
  addTask: (text: string, priority?: TaskPriority) => string;
  updateTaskStatus: (id: number, status: TaskStatus) => string;
  deleteTask: (id: number) => string;
  findTaskByText: (searchText: string) => Task | { error: string };
  setTaskDependencies: (taskId: number, dependencyIds: number[]) => string;
  suggestTaskPriority: (taskId: number) => Promise<string>;
  setLighting: (status: 'on' | 'off') => string;
  playAmbientSound: (sound: AmbientSound) => string;
  viewTodaysEvents: () => CalendarEvent[];
  scheduleTaskOnCalendar: (taskId: number, startTime: string, durationMinutes: number) => string;
}

export type TransactionCategory = 'Food and Drink' | 'Shopping' | 'Travel' | 'Entertainment' | 'Groceries' | 'Rent' | 'Utilities' | 'Income' | 'Other';

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string; // ISO 8601 format
  category: TransactionCategory;
}

export interface FinancialMetrics {
  dailyScore: number;
  weeklyWantsSpent: number;
  weeklyWantsBudget: number;
  recentTransactions: Transaction[];
}

export interface Activity {
  title: string;
  description: string;
}

export interface NewsArticle {
  title: string;
  source: string;
}

export interface SuggestedLink {
  title: string;
  uri: string;
  reason: string;
}