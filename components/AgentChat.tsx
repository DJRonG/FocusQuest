import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Task, AgentTools, CalendarState } from '../types';
import { getAgentResponse } from '../services/geminiService';
import type { Content, FunctionCall } from '@google/genai';

interface AgentChatProps {
  tasks: Task[];
  agentTools: AgentTools;
  calendarState: CalendarState;
}

const ToolMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div className="text-center my-2">
        <p className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full inline-block">
            {message.text}
        </p>
    </div>
);


const AgentMessage: React.FC<{ message: ChatMessage; onSendMessage: (message: string) => void; }> = ({ message, onSendMessage }) => {
    const [proposalResponded, setProposalResponded] = useState(false);

    const handleAccept = () => {
        if (!message.scheduleProposal) return;
        setProposalResponded(true);
        const { taskText, startTime, durationMinutes } = message.scheduleProposal;
        // Construct a detailed request for clarity and robustness
        onSendMessage(`Yes, please schedule the task "${taskText}" starting at ${new Date(startTime).toISOString()} for ${durationMinutes} minutes.`);
    };

    const handleReject = () => {
        setProposalResponded(true);
        onSendMessage("No, thank you.");
    };

    return (
        <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
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
                        {message.scheduleProposal && !proposalResponded && (
                             <div className="mt-3 pt-3 border-t border-gray-700 flex space-x-2">
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-1.5 rounded-md transition-colors"
                                >
                                    Schedule
                                </button>
                                <button
                                     onClick={handleReject}
                                     className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold py-1.5 rounded-md transition-colors"
                                >
                                    No Thanks
                                </button>
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

const convertMessagesToApiHistory = (messages: ChatMessage[]): Content[] => {
    const history: Content[] = [];
    // Skip the first message which is the initial greeting
    for (const msg of messages.slice(1)) { 
        if (msg.sender === 'user' && msg.text) {
            history.push({ role: 'user', parts: [{ text: msg.text }] });
        } else if (msg.sender === 'agent') {
            if (msg.functionCall) {
                history.push({ role: 'model', parts: [{ functionCall: msg.functionCall }] });
            } else if (msg.text) {
                // Don't add proposal text to history, as the model generated a function call, not text.
                if (!msg.scheduleProposal) {
                    history.push({ role: 'model', parts: [{ text: msg.text }] });
                }
            }
        } else if (msg.sender === 'tool' && msg.functionResponse) {
             history.push({
                role: 'tool',
                parts: [{
                    functionResponse: {
                        name: msg.functionResponse.name,
                        response: { content: msg.functionResponse.response },
                    },
                }],
            });
        }
    }
    return history;
};

export const AgentChat: React.FC<AgentChatProps> = ({ tasks, agentTools, calendarState }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'agent', text: "Hello! I can now help you manage your tasks and calendar. Try asking me what's on your schedule today." },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text: userInput };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setIsLoading(true);

    let history = convertMessagesToApiHistory(currentMessages);

    while (true) {
        const response = await getAgentResponse(history, tasks, calendarState);
        const part = response.candidates?.[0]?.content?.parts[0];

        if (!part) {
            console.error("No valid part in response", response);
            setMessages(prev => [...prev, {id: Date.now(), sender: 'agent', text: "Sorry, I received an empty response."}]);
            break;
        }

        if (part.text) {
            const agentMessage: ChatMessage = { id: Date.now(), sender: 'agent', text: part.text };
            setMessages(prev => [...prev, agentMessage]);
            break; // End of turn
        }

        if (part.functionCall) {
            const fc = part.functionCall;

            if (fc.name === 'proposeSchedule') {
                const { taskId, taskText, startTime, durationMinutes } = fc.args;
                const proposalMessage: ChatMessage = {
                    id: Date.now(),
                    sender: 'agent',
                    text: `I see you have a free slot. How about scheduling "${taskText}" for ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}?`,
                    scheduleProposal: { taskId, taskText, startTime, durationMinutes },
                };
                setMessages(prev => [...prev, proposalMessage]);
                break; // Stop processing, wait for user interaction with the proposal.
            }

            history.push({ role: 'model', parts: [{ functionCall: fc }]});

            const toolMessage: ChatMessage = { id: Date.now() + 1, sender: 'tool', text: `Running: ${fc.name}...` };
            setMessages(prev => [...prev, toolMessage]);

            let result: any;
            const tool = (agentTools as any)[fc.name];
            if (tool) {
                result = tool(...Object.values(fc.args || {}));
            } else {
                result = `Function ${fc.name} not found.`;
            }

             history.push({
                role: 'tool',
                parts: [{
                    functionResponse: {
                        name: fc.name,
                        response: { content: result },
                    },
                }],
            });
        }
    }

    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="bg-gray-950 rounded-lg border border-gray-800 flex flex-col h-[34rem]">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-gray-200">FocusQuest Agent</h2>
        <p className="text-sm text-gray-400">Your AI productivity partner</p>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) =>
          msg.sender === 'agent' ? <AgentMessage key={msg.id} message={msg} onSendMessage={sendMessage} /> :
          msg.sender === 'user' ? <UserMessage key={msg.id} message={msg} /> :
          <ToolMessage key={msg.id} message={msg} />
        )}
        {isLoading && <AgentMessage message={{id: -1, sender: 'agent', isLoading: true}} onSendMessage={() => {}} />}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your tasks or calendar..."
            className="flex-grow bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            disabled={isLoading}
          />
          <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed" disabled={isLoading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};