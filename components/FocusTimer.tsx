import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayIcon, PauseIcon, ResetIcon } from './icons/TimerIcons';
import { FeedbackModal } from './FeedbackModal';
import { getBreakSuggestion } from '../services/geminiService';

const FOCUS_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

type SessionType = 'focus' | 'break';

interface FocusTimerProps {
  onEndSession: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ onEndSession }) => {
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [breakSuggestion, setBreakSuggestion] = useState<string | null>(null);

  const startBreak = useCallback(async () => {
    setSessionType('break');
    setTimeRemaining(BREAK_DURATION);
    setIsActive(true);
    setBreakSuggestion("Finding a good break idea...");
    const suggestion = await getBreakSuggestion();
    setBreakSuggestion(suggestion);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      if (sessionType === 'focus') {
        setIsActive(false);
        setIsFeedbackModalOpen(true);
        new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3').play();
      } else {
        setSessionType('focus');
        setTimeRemaining(FOCUS_DURATION);
        setIsActive(false);
        setBreakSuggestion(null); // Clear suggestion when break ends
        new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3').play();
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeRemaining, sessionType, startBreak]);

  const toggleTimer = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setBreakSuggestion(null);
    onEndSession();
  }, [onEndSession]);

  const handleFeedbackSubmit = (feedback: { productivity: number; distractions: string }) => {
    console.log("Focus Session Feedback Logged:", feedback);
    setIsFeedbackModalOpen(false);
    startBreak();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const progress = useMemo(() => {
    const duration = sessionType === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
    return ((duration - timeRemaining) / duration) * 100;
  }, [timeRemaining, sessionType]);

  const progressStroke = sessionType === 'focus' ? 'stroke-violet-500' : 'stroke-green-500';

  return (
    <>
      <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-200">Focus Timer</h2>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${sessionType === 'focus' ? 'bg-violet-500/10 text-violet-400' : 'bg-green-500/10 text-green-400'}`}>
            {sessionType === 'focus' ? 'Focus' : 'Break'}
          </span>
        </div>
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle className="text-gray-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
              <circle className={progressStroke} strokeWidth="6" strokeDasharray={52 * 2 * Math.PI} strokeDashoffset={(52 * 2 * Math.PI) * (1 - progress/100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
          </svg>
          <span className="text-5xl font-mono font-bold text-gray-100">{formatTime(timeRemaining)}</span>
        </div>
        <div className="flex justify-center items-center space-x-4 mt-6">
          <button onClick={resetTimer} className="p-3 bg-gray-800 border border-gray-700 hover:bg-gray-700/80 rounded-full transition-colors text-gray-400 hover:text-gray-200">
            <ResetIcon className="w-6 h-6" />
          </button>
          <button onClick={toggleTimer} className="w-16 h-16 bg-violet-600 hover:bg-violet-700 shadow-[0_0_12px_rgba(139,92,246,0.3)] rounded-full flex items-center justify-center text-white transition-all">
            {isActive ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
          </button>
        </div>
         {sessionType === 'break' && breakSuggestion && (
          <div className="mt-6 text-center bg-gray-900 p-3 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400">💡 Break Idea:</p>
              <p className="font-medium text-gray-200">{breakSuggestion}</p>
          </div>
        )}
      </div>
      <FeedbackModal isOpen={isFeedbackModalOpen} onSubmit={handleFeedbackSubmit} />
    </>
  );
};