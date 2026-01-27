import React, { useState } from 'react';
import type { HomeAssistantState, AmbientSound, Plant, Room, Scene } from '../types';

interface HomeAssistantProps {
    homeState: HomeAssistantState;
    setLighting: (status: 'on' | 'off') => void;
    playAmbientSound: (sound: AmbientSound) => void;
    waterPlant: (plantId: number) => void;
    toggleRoomLight: (roomId: number) => void;
    scenes: Scene[];
    activateScene: (sceneId: string) => void;
    appMode: 'work' | 'personal';
}

const ToggleSwitch: React.FC<{
    isOn: boolean;
    onToggle: () => void;
}> = ({ isOn, onToggle }) => (
    <button
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
            isOn ? 'bg-violet-600' : 'bg-gray-700'
        }`}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                isOn ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

const PlantCard: React.FC<{ plant: Plant; onWater: (id: number) => void }> = ({ plant, onWater }) => {
    const daysSinceWatered = Math.floor((new Date().getTime() - new Date(plant.lastWatered).getTime()) / (1000 * 3600 * 24));
    
    return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-800/70">
            <div className="flex justify-between items-start">
                <div>
                    <h5 className="font-semibold text-gray-200">{plant.name}</h5>
                    <p className="text-xs text-gray-400 italic">{plant.species}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {plant.location}</p>
                </div>
                <button 
                    onClick={() => onWater(plant.id)} 
                    className="text-sm bg-sky-600/80 hover:bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-md transition-colors flex-shrink-0"
                >
                    💧 Water
                </button>
            </div>
            <p className="text-right text-xs text-gray-400 mt-2">
                Last watered: {daysSinceWatered} day{daysSinceWatered !== 1 && 's'} ago
            </p>
        </div>
    );
};

const RoomCard: React.FC<{ room: Room; onToggleLight: (id: number) => void }> = ({ room, onToggleLight }) => {
    return (
         <div className="bg-gray-900 p-3 rounded-lg border border-gray-800/70 flex justify-between items-center">
            <div>
                <h5 className="font-semibold text-gray-200">{room.name}</h5>
                <div className="flex space-x-3 mt-1">
                    <span className="text-xs text-gray-400">🌡️ {room.temperature}°C</span>
                    <span className="text-xs text-gray-400">💧 {room.humidity}%</span>
                </div>
            </div>
            <div className="flex flex-col items-center">
                <ToggleSwitch isOn={room.lightsOn} onToggle={() => onToggleLight(room.id)} />
                <span className="text-xs text-gray-500 mt-1">Light</span>
            </div>
        </div>
    );
};

export const HomeAssistant: React.FC<HomeAssistantProps> = ({ homeState, setLighting, playAmbientSound, waterPlant, toggleRoomLight, scenes, activateScene, appMode }) => {
    const [activeFloor, setActiveFloor] = useState(homeState.floors[0]?.id || 0);

    const handleLightToggle = () => {
        setLighting(homeState.lighting ? 'off' : 'on');
    };

    const handleSoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        playAmbientSound(e.target.value as AmbientSound);
    };

    const selectedFloor = homeState.floors.find(f => f.id === activeFloor);
    const filteredScenes = scenes.filter(scene => scene.mode === appMode);
    
    return (
        <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
            <div>
                <h2 className="text-xl font-semibold text-gray-200">Home Assistant</h2>
                <p className="text-sm text-gray-400 mt-1">Control your workspace and home environment.</p>
            </div>
            
            {/* Scenes */}
            <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-300 mb-3">✨ Suggested Scenes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredScenes.map(scene => (
                        <div key={scene.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800/70">
                            <div className="flex items-center mb-2">
                                <span className="text-2xl mr-3">{scene.icon}</span>
                                <h4 className="font-semibold text-gray-200">{scene.name}</h4>
                            </div>
                            <p className="text-xs text-gray-400 mb-3 h-10">{scene.description}</p>
                            <button
                                onClick={() => activateScene(scene.id)}
                                className="w-full bg-violet-600/80 hover:bg-violet-600 text-white font-semibold text-sm py-2 rounded-md transition-colors"
                            >
                                Activate
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Workspace Controls */}
            <div className="mt-8">
                <h3 className="text-md font-semibold text-gray-300 mb-3">Workspace Controls</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg">
                        <div className="flex items-center">
                            <span className="text-2xl mr-4">💡</span>
                            <span className="font-semibold text-gray-200">Focus Lighting</span>
                        </div>
                        <ToggleSwitch isOn={homeState.lighting} onToggle={handleLightToggle} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg">
                        <div className="flex items-center">
                            <span className="text-2xl mr-4">🎵</span>
                            <span className="font-semibold text-gray-200">Ambient Sound</span>
                        </div>
                        <select
                            value={homeState.ambientSound}
                            onChange={handleSoundChange}
                            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-gray-200"
                        >
                            <option value="none">None</option>
                            <option value="rain">Rainy Day</option>
                            <option value="cafe">Cafe Murmur</option>
                            <option value="deep_focus">Deep Focus</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Floor Plans */}
            <div className="mt-8">
                <h3 className="text-md font-semibold text-gray-300 mb-3">Floor Plans</h3>
                <div className="flex space-x-1 bg-gray-900 border border-gray-800 rounded-lg p-1 mb-4">
                    {homeState.floors.map(floor => (
                        <button
                            key={floor.id}
                            onClick={() => setActiveFloor(floor.id)}
                            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeFloor === floor.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                        >
                            {floor.name}
                        </button>
                    ))}
                </div>
                {selectedFloor && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Rooms</h4>
                            <div className="space-y-2">
                                {selectedFloor.rooms.map(room => <RoomCard key={room.id} room={room} onToggleLight={toggleRoomLight} />)}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Plants</h4>
                             <div className="space-y-2">
                                {selectedFloor.plants.map(plant => <PlantCard key={plant.id} plant={plant} onWater={waterPlant} />)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};