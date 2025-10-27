import React, { useState } from 'react';
import {
    Bars3Icon,
    PencilIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
    PowerIcon,
    ChevronDownIcon,
    Squares2x2Icon,
} from './icons';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    activeView: string;
    onNavigate: (view: string) => void;
    onExit: () => void;
}

const navItems = [
    { id: 'roster-editor', label: 'Line Editor', icon: PencilIcon },
    { 
        id: 'player-data', 
        label: 'Player Data', 
        icon: UserGroupIcon,
        children: [
            { id: 'player-data-players', label: 'Players' },
            { id: 'player-data-goalies', label: 'Goalies' },
            { id: 'player-data-analysis', label: 'Analysis' },
        ]
    },
    { 
        id: 'assets', 
        label: 'Assets', 
        icon: Squares2x2Icon,
        children: [
            { id: 'assets-menu-logos', label: 'Menu Logos' },
        ]
    },
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
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['player-data', 'assets']));

    const handleParentClick = (id: string) => {
        if (isCollapsed) {
            onToggle();
        }
        setExpandedMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    return (
        <aside className={`flex flex-col bg-[#1A222C] text-gray-300 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
            <div className={`flex items-center p-4 border-b border-black/30 h-16 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && <h1 className="text-lg font-bold tracking-wider whitespace-nowrap">NHL '94 Editor</h1>}
                <button 
                    onClick={onToggle} 
                    className="p-1 rounded-md hover:bg-gray-700/50"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 mt-4 overflow-y-auto">
                <ul>
                    {navItems.map((item) => {
                        const isExpanded = expandedMenus.has(item.id);
                        const isActive = item.children 
                            ? item.children.some(child => child.id === activeView) || item.id === activeView
                            : activeView === item.id;

                        if (item.children) {
                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => handleParentClick(item.id)}
                                        className={`flex items-center justify-between w-full px-4 py-3 transition-colors ${
                                            isActive ? 'text-white' : ''
                                        } hover:bg-gray-700/50`}
                                        title={isCollapsed ? item.label : undefined}
                                        aria-expanded={isExpanded}
                                    >
                                        <div className="flex items-center">
                                            <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-sky-400' : ''}`} />
                                            {!isCollapsed && <span className="ml-4 font-semibold">{item.label}</span>}
                                        </div>
                                        {!isCollapsed && (
                                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        )}
                                    </button>
                                    {isExpanded && !isCollapsed && (
                                        <ul className="pl-10 pr-2 pt-1 pb-2">
                                            {item.children.map(child => (
                                                <li key={child.id}>
                                                    <button
                                                        onClick={() => onNavigate(child.id)}
                                                        className={`flex items-center w-full px-4 py-2 text-sm transition-colors rounded-md my-0.5 ${
                                                            activeView === child.id
                                                                ? 'bg-sky-800/50 text-white'
                                                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                                                        }`}
                                                    >
                                                        {child.label}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        }

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onNavigate(item.id)}
                                    className={`flex items-center w-full px-4 py-3 transition-colors ${
                                        isActive ? 'bg-sky-800/50 text-white border-l-4 border-sky-400 pl-3' : 'hover:bg-gray-700/50'
                                    }`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <item.icon className="w-6 h-6 shrink-0" />
                                    {!isCollapsed && <span className="ml-4 font-semibold">{item.label}</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="py-4 mt-auto border-t border-black/30">
                <button
                    onClick={onExit}
                    className="flex items-center w-full px-4 py-3 transition-colors hover:bg-red-800/50"
                    title={isCollapsed ? "Exit / Reset App" : undefined}
                >
                    <PowerIcon className="w-6 h-6 text-red-500 shrink-0" />
                    {!isCollapsed && <span className="ml-4 font-semibold text-red-400">Exit</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;