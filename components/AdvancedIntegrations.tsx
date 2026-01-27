import React from 'react';

const IntegrationBlock: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/70 flex flex-col items-center text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <h4 className="font-semibold text-gray-100 text-lg mb-1">{title}</h4>
        <p className="text-sm text-gray-400 max-w-xs">{children}</p>
    </div>
);

export const AdvancedIntegrations: React.FC = () => {
    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <div>
                <h2 className="text-xl font-semibold text-gray-200">🚀 The Ultimate Productivity Stack</h2>
                <p className="text-sm text-gray-400 mt-1">Combine an AI Core with an Action Layer to build a truly powerful agent.</p>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <IntegrationBlock icon="🧠" title="The AI Core (e.g., LibreChat)">
                    Manages AI models, conversation history, and user authentication. It understands user intent and decides what to do.
                </IntegrationBlock>
                <IntegrationBlock icon="💪" title="The Action Layer (e.g., n8n)">
                    Connects to thousands of external apps. It takes instructions from the AI Core and executes them in the real world.
                </IntegrationBlock>
            </div>
            <div className="mt-6 text-center text-gray-400 font-mono text-2xl flex justify-center items-center">
                <span>AI Core</span>
                <span className="text-violet-500 mx-4 animate-pulse">&lt;-- API --&gt;</span>
                <span>Action Layer</span>
            </div>
            <div className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-800/70">
                <h4 className="font-semibold text-gray-100 text-center mb-2">Example Workflow: "Start Focus Session"</h4>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                    <li><strong className="text-gray-300">User:</strong> "Get my workspace ready for deep work."</li>
                    <li><strong className="text-gray-300">AI Core (LibreChat):</strong> Understands the request and sends a webhook to n8n.</li>
                    <li><strong className="text-gray-300">Action Layer (n8n):</strong> Receives the signal and runs a workflow:
                        <ul className="list-disc list-inside pl-5 mt-1 text-gray-500">
                            <li>Calls Philips Hue API to turn on lights.</li>
                            <li>Calls Spotify API to play a focus playlist.</li>
                            <li>Updates your Slack status to "Focusing."</li>
                        </ul>
                    </li>
                    <li><strong className="text-gray-300">AI Core (LibreChat):</strong> Receives confirmation from n8n and replies: "All set! Your focus environment is ready."</li>
                </ol>
            </div>
        </div>
    );
};
