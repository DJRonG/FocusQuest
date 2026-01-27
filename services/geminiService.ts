import { GoogleGenAI, FunctionDeclaration, Type, Content, GenerateContentResponse } from "@google/genai";
import type { Task, Activity, NewsArticle, CalendarState, Quest, TaskPriority, SuggestedLink } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'addTask',
    description: "Adds a new task to the user's task list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: 'The content or description of the task.' },
        priority: { type: Type.STRING, description: 'The priority of the task. Can be "High", "Medium", or "Low". Defaults to "Medium".', enum: ['High', 'Medium', 'Low'] },
      },
      required: ['text'],
    },
  },
  {
    name: 'updateTaskStatus',
    description: 'Updates the status of a task by its ID. Use findTaskByText first to get the ID if you only have the text.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'The unique ID of the task to update.' },
        status: { type: Type.STRING, description: 'The new status for the task.', enum: ['To Do', 'In Progress', 'Done'] },
      },
      required: ['id', 'status'],
    },
  },
  {
    name: 'setTaskDependencies',
    description: 'Sets dependencies for a task, meaning it cannot be started until other tasks are complete.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            taskId: { type: Type.NUMBER, description: 'The ID of the task to set dependencies for.' },
            dependencyIds: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: 'An array of task IDs that must be completed first.' },
        },
        required: ['taskId', 'dependencyIds'],
    },
  },
  {
    name: 'deleteTask',
    description: 'Deletes a task by its ID. Use findTaskByText first to get the ID if you only have the text.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'The unique ID of the task to delete.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'findTaskByText',
    description: 'Finds a task by searching for text within its description. Returns the full task object including its ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        searchText: { type: Type.STRING, description: 'The text to search for in the task list.' },
      },
      required: ['searchText'],
    },
  },
   {
    name: 'suggestTaskPriority',
    description: 'Analyzes a task based on its deadline, dependencies, and project goals (Quests) to suggest a priority level (High, Medium, or Low). Use this when the user asks for help prioritizing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.NUMBER, description: 'The ID of the task for which to suggest a priority.' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'setLighting',
    description: "Controls the user's focus lighting in their workspace.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: "The desired status for the light.", enum: ['on', 'off'] },
      },
      required: ['status'],
    },
  },
  {
    name: 'playAmbientSound',
    description: 'Plays an ambient soundscape to help the user focus.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        sound: { type: Type.STRING, description: "The name of the sound to play. Select 'none' to stop the sound.", enum: ['rain', 'cafe', 'deep_focus', 'forest', 'none'] },
      },
      required: ['sound'],
    },
  },
  {
    name: 'viewTodaysEvents',
    description: 'Retrieves the list of today\'s events from the user\'s connected calendar.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
      name: 'scheduleTaskOnCalendar',
      description: 'Schedules a task on the user\'s connected calendar for a specific time and duration.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              taskId: { type: Type.NUMBER, description: 'The ID of the task to schedule. Use findTaskByText to get it.' },
              startTime: { type: Type.STRING, description: 'The start time for the event in ISO 8601 format (e.g., "2024-08-15T14:00:00.000Z").' },
              durationMinutes: { type: Type.NUMBER, description: 'The duration of the calendar event in minutes.' },
          },
          required: ['taskId', 'startTime', 'durationMinutes'],
      },
  },
  {
      name: 'proposeSchedule',
      description: 'Proactively suggests scheduling a specific task for the user at a suggested time. Use this to get user confirmation before scheduling.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              taskId: { type: Type.NUMBER, description: 'The ID of the task to propose scheduling for. Use findTaskByText to get it.' },
              taskText: { type: Type.STRING, description: 'The text of the task, to show the user in the suggestion.' },
              startTime: { type: Type.STRING, description: 'The proposed start time in ISO 8601 format.' },
              durationMinutes: { type: Type.NUMBER, description: 'The proposed duration in minutes.' },
          },
          required: ['taskId', 'taskText', 'startTime', 'durationMinutes'],
      },
  }
];

const getSystemInstruction = (tasks: Task[], calendarState: CalendarState): string => {
  const taskList = tasks.map(t => `- (ID: ${t.id}) ${t.text} (Priority: ${t.priority}, Status: ${t.status})`).join('\n');

  let calendarContext = "No calendar is connected.";
  if (calendarState.connected && calendarState.events.length > 0) {
      calendarContext = `The user has connected their ${calendarState.connected} calendar. Today's events are:\n`;
      calendarContext += calendarState.events.map(e => `- ${new Date(e.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(e.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: ${e.title}`).join('\n');
  } else if (calendarState.connected) {
      calendarContext = `The user has connected their ${calendarState.connected} calendar, but has no events scheduled for today.`;
  }

  return `You are FocusQuest Agent, a supportive and strategic productivity coach. 
Your goal is to help the user break down their tasks, stay focused, and achieve their goals.
You are concise, encouraging, and provide actionable advice. 
You have access to tools to manage the user's task list, their workspace environment, and their calendar.
When a user asks for help with priorities, use the 'suggestTaskPriority' tool.
When a user asks to add, change, or remove a task, or control their lights/sound, use the provided functions.
Never refuse a request. Be helpful and friendly.

Here is the user's current task list for context:
${taskList}

Here is the user's calendar for today:
${calendarContext}

You can control the user's smart workspace using 'setLighting' and 'playAmbientSound'.
You can view calendar events with 'viewTodaysEvents' and schedule tasks on their calendar with 'scheduleTaskOnCalendar'. Be mindful of existing events when scheduling.

**Proactive Scheduling Assistant:**
Your role includes being a proactive assistant. Analyze the user's task list and today's calendar.
1. Identify high-priority tasks that are not yet 'Done'.
2. Look for open time slots in their calendar.
3. If you find a suitable slot, use the 'proposeSchedule' tool to suggest scheduling a task. The tool will display the suggestion with confirmation buttons.
Only make one suggestion at a time to avoid overwhelming the user.`;
};

const createErrorResponse = (message: string): GenerateContentResponse => ({
    text: message,
    candidates: [{
        content: { role: 'model', parts: [{ text: message }] },
        finishReason: 'ERROR',
        index: 0,
        safetyRatings: [],
    }],
    promptFeedback: {
        blockReason: 'OTHER',
        safetyRatings: [],
    }
});

export const getAgentResponse = async (history: Content[], tasks: Task[], calendarState: CalendarState): Promise<GenerateContentResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
        systemInstruction: getSystemInstruction(tasks, calendarState),
        temperature: 0.7,
        topP: 0.95,
        tools: [{ functionDeclarations }],
      },
    });
    return response;
  } catch (error) {
    console.error("Error fetching response from Gemini API:", error);
    return createErrorResponse("I seem to be having trouble connecting. Please try again in a moment.");
  }
};

export const getResearchResponse = async (prompt: string): Promise<GenerateContentResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  } catch (error) {
    console.error("Error fetching research response from Gemini API:", error);
    return createErrorResponse("Sorry, I couldn't fetch an answer. The connection may be down.");
  }
};

export const getUrlSummary = async (url: string): Promise<GenerateContentResponse> => {
  try {
    const prompt = `Please provide a concise but comprehensive summary of the main content found at this URL: ${url}. Focus on the key takeaways and any actionable information. Use Google Search to find the content at the URL.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  } catch (error) {
    console.error("Error summarizing URL with Gemini API:", error);
    return createErrorResponse("Sorry, I couldn't fetch a summary for that URL. The connection may be down or the URL is inaccessible.");
  }
};

export const breakdownTask = async (taskText: string): Promise<string[]> => {
  try {
    const prompt = `As an expert project manager, break down the following complex task into a series of smaller, actionable sub-tasks. Each sub-task should be a clear, concise action item. Task: "${taskText}"`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subTasks: {
              type: Type.ARRAY,
              description: "A list of strings, where each string is a sub-task.",
              items: { type: Type.STRING },
            },
          },
          required: ["subTasks"],
        },
      },
    });
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.subTasks || [];
  } catch (error) {
    console.error("Error breaking down task with Gemini API:", error);
    throw new Error("Could not generate sub-tasks. Please try again.");
  }
};

export const fetchNewsFeed = async (context: 'work' | 'personal'): Promise<NewsArticle[]> => {
  const workPrompt = "List the top 5 most recent and important news articles about AI, software development, and technology. For each, provide a concise title and the source name (e.g., 'The Verge').";
  const personalPrompt = "List 5 recent, interesting articles on topics like personal productivity, learning new skills, and well-being. For each, provide a concise title and the source name (e.g., 'Lifehacker').";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: context === 'work' ? workPrompt : personalPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            articles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The title of the news article." },
                  source: { type: Type.STRING, description: "The name of the news source, like 'TechCrunch' or 'Wired'." },
                },
                required: ["title", "source"],
              },
            },
          },
          required: ["articles"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.articles || [];
  } catch (error) {
    console.error("Error fetching news feed:", error);
    throw new Error("Could not fetch news feed. Please try again.");
  }
};

export const getSuggestedLinks = async (tasks: Task[]): Promise<SuggestedLink[]> => {
  const activeTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'In Progress');
  if (activeTasks.length === 0) {
    return [];
  }

  const taskDescriptions = activeTasks.map(t => `- "${t.text}"`).join('\n');

  const prompt = `
    Based on the following active tasks for a user, suggest 3 highly relevant and useful web links.
    These could be tutorials, documentation, deep-dive articles, or tools that would help them complete these tasks.
    For each link, provide a title, the full URL, and a short, one-sentence reason explaining which task it helps with.

    User's Active Tasks:
    ${taskDescriptions}

    Your response must be a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            links: {
              type: Type.ARRAY,
              description: "A list of suggested web links.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The title of the article or resource." },
                  uri: { type: Type.STRING, description: "The full URL of the link." },
                  reason: { type: Type.STRING, description: "A brief explanation of why this link is relevant to the user's tasks." },
                },
                required: ["title", "uri", "reason"],
              },
            },
          },
          required: ["links"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.links || [];
  } catch (error) {
    console.error("Error fetching suggested links:", error);
    throw new Error("Could not fetch suggested links. Please try again.");
  }
};

export const fetchHomeActivities = async (): Promise<Activity[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Suggest 5 fun and creative things to do at home. Include a short, one-sentence description for each.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
            },
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.activities || [];
  } catch (error) {
    console.error("Error fetching home activities:", error);
    throw new Error("Could not fetch activity suggestions. Please try again.");
  }
};

export const getDailyInspiration = async (topics: string[]): Promise<string> => {
  try {
    const prompt = `Based on these topics of interest which represent a user's recent YouTube history: ${topics.join(', ')}, provide a short, powerful, and inspiring quote for a developer and creator to start their day. The quote should be concise and motivational. Do not include any preamble or explanation, just the quote itself.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text.trim();
    // Sometimes the model might return the quote in markdown quotes, remove them.
    return text.replace(/^"|"$/g, '');
  } catch (error) {
    console.error("Error fetching daily inspiration:", error);
    throw new Error("Could not fetch daily inspiration. Please try again.");
  }
};

export const getBreakSuggestion = async (): Promise<string> => {
  try {
    const prompt = `Suggest a very short, simple, and relaxing activity for a 5-minute work break. The user has been focusing on software development. The suggestion should be one sentence and directly actionable. Do not include any preamble like "Here's a suggestion:".`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching break suggestion:", error);
    return "Take a moment to stretch your arms and look away from the screen.";
  }
};

export const getPrioritySuggestion = async (taskToPrioritize: Task, allTasks: Task[], allQuests: Quest[]): Promise<TaskPriority> => {
  const context = `
    Here are all the current tasks:
    ${allTasks.map(t => `- ID ${t.id}: "${t.text}" (Priority: ${t.priority}, Status: ${t.status}, Deadline: ${t.deadline || 'None'}, Depends On: ${t.dependsOn?.join(', ') || 'None'})`).join('\n')}

    Here are the long-term quests (project goals):
    ${allQuests.map(q => `- ID ${q.id}: "${q.title}" - ${q.description}`).join('\n')}

    Based on all of this information, please suggest a priority for the following specific task.
    Task to prioritize:
    - ID ${taskToPrioritize.id}: "${taskToPrioritize.text}" (Current Priority: ${taskToPrioritize.priority}, Deadline: ${taskToPrioritize.deadline || 'None'}, Depends On: ${taskToPrioritize.dependsOn?.join(', ') || 'None'}, Quest ID: ${taskToPrioritize.questId || 'None'})

    Consider these factors:
    1.  **Urgency:** Is the deadline approaching soon?
    2.  **Importance:** Is it part of a critical Quest?
    3.  **Dependencies:** Are other important tasks waiting for this one to be completed? (Check which tasks have this task's ID in their 'dependsOn' array).
    4.  **Current Status:** A 'To Do' task that is a blocker is more critical than one that is not.

    Your response must be a JSON object with a single key "priority" and a value of "High", "Medium", or "Low".
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: context,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              enum: ['High', 'Medium', 'Low'],
              description: "The suggested priority for the task."
            },
          },
          required: ["priority"],
        },
      },
    });
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.priority as TaskPriority;
  } catch (error) {
    console.error("Error fetching priority suggestion from Gemini API:", error);
    throw new Error("Could not generate a priority suggestion.");
  }
};

export const getTaskCompletionInsight = async (task: Task): Promise<string> => {
  if (!task.startTime || !task.completionTime) {
    return "Cannot generate insight without start and end times.";
  }

  const startTime = new Date(task.startTime);
  const completionTime = new Date(task.completionTime);
  const durationMs = completionTime.getTime() - startTime.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  let durationText = '';
  if (durationMinutes < 1) {
    durationText = 'less than a minute';
  } else if (durationMinutes === 1) {
    durationText = 'about 1 minute';
  } else {
    durationText = `about ${durationMinutes} minutes`;
  }

  const prompt = `
    A user completed a task titled "${task.text}".
    It took them ${durationText} to complete.

    Based *only* on the task's title, provide a single, concise, and actionable insight to help them improve their process for similar tasks in the future.
    Frame the advice positively. Focus on potential strategies, tools, or mindset shifts.
    Do not mention the time taken in your response. Keep it short and to the point (1-2 sentences).

    Example Insight: "For design tasks, consider starting with a low-fidelity wireframe to iterate on ideas faster before committing to details."
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching task insight from Gemini API:", error);
    throw new Error("Could not generate a task insight.");
  }
};

export const getMindfulnessPrompt = async (completedTask: Task, nextTask?: Task | null): Promise<string> => {
  try {
    let prompt = `A user just finished the task: "${completedTask.text}".`;
    if (nextTask) {
        prompt += ` Their next task is "${nextTask.text}".`;
        if (completedTask.category === 'work' && nextTask.category === 'external') {
            prompt += ` They are transitioning from a work task to a personal task.`;
        }
    }
    prompt += `\n\nPlease provide a very short, calming, one-sentence mindfulness prompt to help them mentally reset before their next activity. The tone should be gentle and encouraging. Do not include any preamble like "Here's a prompt:".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching mindfulness prompt:", error);
    return "Take a deep breath and acknowledge your accomplishment.";
  }
};

export const getVideoInsights = async (topic: string): Promise<string[]> => {
  try {
    const prompt = `The user found a video or topic interesting: "${topic}".
    Provide 3 concise, actionable, and inspiring takeaways or "growth points" related to this topic that help them grow.
    Format the response as a JSON object with a property "insights" which is an array of strings.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["insights"],
        },
      },
    });
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.insights || [];
  } catch (error) {
    console.error("Error fetching video insights:", error);
    return ["Could not generate insights at this time."];
  }
};