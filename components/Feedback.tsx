import React, { useState } from 'react';

interface FeedbackProps {
  submittedFeedback: string[];
  onSubmitFeedback: (text: string) => void;
}

export const Feedback: React.FC<FeedbackProps> = ({ submittedFeedback, onSubmitFeedback }) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    onSubmitFeedback(feedbackText.trim());
    setFeedbackText('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
      <div>
        <h2 className="text-xl font-semibold text-gray-200">📣 App Feedback</h2>
        <p className="text-sm text-gray-400 mt-1">Have a suggestion or found a bug? Let us know!</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={3}
          placeholder="Your feedback here..."
          className="w-full bg-gray-900 border border-gray-800 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
          aria-label="Feedback input"
        />
        <button
          type="submit"
          disabled={!feedbackText.trim() || isSubmitted}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isSubmitted ? '✅ Submitted!' : 'Submit Feedback'}
        </button>
      </form>
      {submittedFeedback.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-800">
          <h3 className="text-md font-semibold text-gray-300 mb-2">Submitted Feedback:</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2" role="log" aria-live="polite">
            {submittedFeedback.map((feedback, index) => (
              <p key={index} className="text-sm bg-gray-900 p-2 rounded-md border border-gray-800/70 text-gray-300">
                {feedback}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
