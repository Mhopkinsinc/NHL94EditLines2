import React from 'react';
import {
    Bars3Icon,
    PencilIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
    PowerIcon,
    Squares2x2Icon,
} from './icons';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    activeView: string;
    onNavigate: (view: string) => void;
    onExit: () => void;
}

// FIX: Implement Sidebar component with navigation items to resolve module error in App.tsx.
// This component provides navigation for different views of the application.
const navItems = [
    { id: 'roster-editor', label: 'Line Editor', icon: PencilIcon },
    { id: 'player-stats', label: 'Player Stats', icon: ChartBarIcon },    
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
    { id: 'help', label: 'Help', icon: QuestionMarkCircleIcon },
];

const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    onToggle,
    activeView,
    onNavigate,
    onExit,
}) => {
    return (
        <aside className={`flex flex-col bg-[#1A222C] text-gray-300 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
            <div className="flex items-center justify-between p-4 border-b border-black/30 h-16">
                {!isCollapsed && <h1 className="text-lg font-bold tracking-wider whitespace-nowrap">NHL '94 Editor</h1>}
                <button onClick={onToggle} className="p-1 rounded-md hover:bg-gray-700" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                    <Bars3Icon className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 mt-4">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => onNavigate(item.id)}
                                className={`flex items-center w-full px-4 py-3 transition-colors ${
                                    activeView === item.id
                                        ? 'bg-sky-800/50 text-white border-l-4 border-sky-400 pl-3'
                                        : 'hover:bg-gray-700/50'
                                }`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className="w-6 h-6 shrink-0" />
                                {!isCollapsed && <span className="ml-4 font-semibold">{item.label}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 mt-auto border-t border-black/30">
                <button
                    onClick={onExit}
                    className="flex items-center w-full px-4 py-3 transition-colors hover:bg-red-800/50 rounded-md"
                    title="Exit / Reset App"
                >
                    <PowerIcon className="w-6 h-6 text-red-500 shrink-0" />
                    {!isCollapsed && <span className="ml-4 font-semibold text-red-400">Exit</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
