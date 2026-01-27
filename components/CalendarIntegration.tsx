import React from 'react';
import type { CalendarState, CalendarProvider } from '../types';
import { GoogleIcon } from './icons/GoogleIcon';
import { OutlookIcon } from './icons/OutlookIcon';

interface CalendarIntegrationProps {
    calendarState: CalendarState;
    onConnect: (provider: CalendarProvider) => void;
    onDisconnect: () => void;
}

const ConnectionButton: React.FC<{
    provider: CalendarProvider;
    icon: React.ReactNode;
    label: string;
    onConnect: (provider: CalendarProvider) => void;
}> = ({ provider, icon, label, onConnect }) => (
    <button
        onClick={() => onConnect(provider)}
        className="flex items-center justify-center w-full p-3 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800/80 hover:border-gray-700 transition-all duration-200"
    >
        {icon}
        <span className="font-semibold text-gray-200">{label}</span>
    </button>
);

const EventItem: React.FC<{ event: CalendarState['events'][0] }> = ({ event }) => {
    const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
        <div className="flex items-start space-x-3 py-2 border-b border-gray-800/50 last:border-b-0">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></div>
            <div>
                <p className="font-medium text-sm text-gray-200">{event.title}</p>
                <p className="text-xs text-gray-400">{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
            </div>
        </div>
    );
};

export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ calendarState, onConnect, onDisconnect }) => {
    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <div>
                <h2 className="text-xl font-semibold text-gray-200">Calendar Integration</h2>
                <p className="text-sm text-gray-400 mt-1">View your schedule and plan your tasks.</p>
            </div>
            <div className="mt-4">
                {!calendarState.connected ? (
                    <div className="space-y-3">
                         <ConnectionButton provider="google" icon={<GoogleIcon className="w-5 h-5 mr-3" />} label="Connect Google Calendar" onConnect={onConnect} />
                         <ConnectionButton provider="outlook" icon={<OutlookIcon className="w-5 h-5 mr-3" />} label="Connect Outlook Calendar" onConnect={onConnect} />
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg mb-4">
                            <div className="flex items-center">
                                {calendarState.connected === 'google' ? <GoogleIcon className="w-5 h-5 mr-3" /> : <OutlookIcon className="w-5 h-5 mr-3" />}
                                <span className="text-sm font-semibold text-gray-200">Connected to {calendarState.connected === 'google' ? 'Google' : 'Outlook'}</span>
                            </div>
                            <button onClick={onDisconnect} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Disconnect</button>
                        </div>
                        <h3 className="text-md font-semibold text-gray-300 mb-2">Today's Events:</h3>
                        {calendarState.events.length > 0 ? (
                            <div className="space-y-1">
                                {calendarState.events.map(event => <EventItem key={event.id} event={event} />)}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No events scheduled for today.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
