import React, { useState, useEffect } from 'react';
import type { Task } from '../types';

interface ScheduleTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSchedule: (taskId: number, startTime: string, durationMinutes: number) => string;
}

export const ScheduleTaskModal: React.FC<ScheduleTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSchedule,
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      const now = new Date();
      // Set default date to today
      setDate(now.toISOString().split('T')[0]);
      // Set default time to the next full hour
      now.setHours(now.getHours() + 1, 0, 0, 0);
      setTime(now.toTimeString().substring(0, 5));
      setDuration(30);
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const handleSchedule = () => {
    if (!date || !time) {
        setFeedback("Please select a valid date and time.");
        return;
    }
    const startTimeISO = new Date(`${date}T${time}`).toISOString();
    const result = onSchedule(task.id, startTimeISO, duration);
    setFeedback(result);
    // Only close if successful
    if (result.toLowerCase().startsWith('success')) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Schedule Task on Calendar</h2>
          <p className="text-sm text-gray-400 mt-1">Schedule: <strong className="text-violet-400">"{task.text}"</strong></p>
        </header>
        
        <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                    <input
                        id="schedule-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                    />
                </div>
                 <div>
                    <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                    <input
                        id="schedule-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                    />
                </div>
            </div>
             <div>
                <label htmlFor="schedule-duration" className="block text-sm font-medium text-gray-300 mb-1">Duration (minutes)</label>
                <input
                    id="schedule-duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                    min="1"
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                />
            </div>
        </div>
        
        <footer className="p-4 sm:p-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm flex-grow">
                {feedback && <p className={`${feedback.toLowerCase().startsWith('success') ? 'text-green-400' : 'text-red-400'}`}>{feedback}</p>}
            </div>
            <div className="flex justify-end space-x-3 w-full sm:w-auto">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-md transition-colors w-1/2 sm:w-auto"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSchedule}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md transition-colors w-1/2 sm:w-auto"
                >
                    Schedule
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};