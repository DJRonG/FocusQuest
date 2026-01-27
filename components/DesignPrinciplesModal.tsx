import React from 'react';

interface DesignPrinciplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const principles = [
  {
    title: '1. Onboarding',
    points: [
      'Make sure the first interaction clearly explains what your AI can do — set user expectations.',
      'Consider a “hello / get started” message that guides users into use cases.',
      'Add help hints or tooltips for more advanced features.',
    ],
  },
  {
    title: '2. Dialogue Flow / User Flows',
    points: [
      'Map out the conversational paths: What happens if the user asks something unexpected or off-topic?',
      'Think about “error recovery”: how the AI handles misunderstandings, or when it fails to answer.',
      'Consider memory: does your app need to remember past user interactions? If so, design how and when that memory is stored / used.',
    ],
  },
  {
    title: '3. User Experience (UX)',
    points: [
      'If you have an interface (not just chat): ensure the UI is clean and intuitive: buttons, choices, and input areas should make sense.',
      'Use loading states / feedback when the AI is thinking / generating so users know something is happening.',
      'Provide a way for users to correct or refine their requests (e.g., “No, I meant …”, or “Can you try again?”).',
    ],
  },
  {
    title: '4. Personalization',
    points: [
      'Can you customize responses based on user context (who they are, what they’ve done previously)?',
      'Think about settings or preferences: let users tune how “formal” or “creative” the AI should be.',
    ],
  },
  {
    title: '5. Error Handling & Safety',
    points: [
      'Implement fallback messages for when the AI doesn’t understand.',
      'If relevant, put guardrails / content filters so the AI doesn’t produce inappropriate or irrelevant content.',
      'Offer “undo” or “clear chat” functionality so users can reset when the conversation goes off track.',
    ],
  },
  {
    title: '6. Performance & Latency',
    points: [
      'If generation feels slow, consider ways to speed up or give interim feedback (e.g., “Thinking …”).',
      'Cache / precompute common responses or use techniques to make frequent operations more efficient.',
    ],
  },
  {
    title: '7. Testing & Validation',
    points: [
      'Run testing sessions with real users (or teammates) to catch confusing flows or awkward language.',
      'Track metrics: what prompts are used most, where do users drop off, what common mistakes / misunderstandings occur?',
      'Use feedback loops: let users report when the AI’s answer was wrong or not helpful, then use that feedback to improve.',
    ],
  },
  {
    title: '8. Scalability / Future Features',
    points: [
      'Think about how you might expand the app: more use cases, integrations (e.g., with other tools), and multi-turn capabilities.',
      'Design with modularity: make your prompt / flow logic easy to extend.',
    ],
  },
  {
    title: '9. Privacy / Data Handling',
    points: [
      'If you’re collecting any user data, clearly explain how it’s stored and used.',
      'Provide transparency: “This conversation may be logged / used to improve the AI,” if that’s the case.',
    ],
  },
  {
    title: '10. Visual / Branding',
    points: [
      'Make sure the style (colors, fonts, layout) is consistent and matches the tone of your AI.',
      'Use icons or visuals where needed to guide the user’s eye and clarify function.',
    ],
  },
];


export const DesignPrinciplesModal: React.FC<DesignPrinciplesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-100">💡 AI App Design Principles</h2>
            <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-200 transition-colors p-1 rounded-full"
                aria-label="Close modal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </header>
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {principles.map((principle) => (
                <div key={principle.title}>
                    <h3 className="text-md font-semibold text-violet-400 mb-2">{principle.title}</h3>
                    <ul className="space-y-1.5 list-disc list-inside text-gray-300">
                        {principle.points.map((point, index) => (
                            <li key={index} className="text-sm">{point}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};