import React, { useMemo, useState, useEffect } from 'react';
import type { TeamInfo } from '../rom-parser';
import type { Player } from '../types';
import { calculateSkaterOverall } from '../utils';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from './icons';

interface PlayerDataGridProps {
    teams: TeamInfo[];
}

interface SkaterData extends Player {
    overall: number;
    teamAbv: string;
    position: 'F' | 'D';
}

type SortableKeys = keyof Omit<SkaterData, 'attributes' | 'id' | 'statusIcon' | 'role'> | keyof SkaterData['attributes'];

const getLastName = (name: string): string => {
    const parts = name.split(' ');
    return parts[parts.length - 1];
};

const FilterButton: React.FC<{
    label: 'All' | 'Forwards' | 'Defensemen';
    value: 'All' | 'F' | 'D';
    currentFilter: 'All' | 'F' | 'D';
    onClick: (filter: 'All' | 'F' | 'D') => void;
}> = ({ label, value, currentFilter, onClick }) => {
    const isActive = value === currentFilter;
    return (
        <button
            onClick={() => onClick(value)}
            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
            {label}
        </button>
    );
};

export const PlayerDataGrid: React.FC<PlayerDataGridProps> = ({ teams }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({
        key: 'overall',
        direction: 'desc',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [positionFilter, setPositionFilter] = useState<'All' | 'F' | 'D'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const sortedSkaters = useMemo(() => {
        const skaters: SkaterData[] = teams
            .filter(team => !team.city.includes('All Stars'))
            .flatMap(team =>
                team.players
                    .filter(player => player.role !== 'Goalie')
                    .map(player => ({
                        ...player,
                        overall: calculateSkaterOverall(player),
                        teamAbv: team.abv,
                        position: player.role === 'Forward' ? 'F' : 'D',
                    }))
            );
        
        const filteredSkaters = skaters.filter(player => {
            const positionMatch = positionFilter === 'All' || player.position === positionFilter;
            const searchMatch = !searchTerm || player.name.toLowerCase().includes(searchTerm.toLowerCase());
            return positionMatch && searchMatch;
        });


        const { key, direction } = sortConfig;

        // Use a stable sort by creating a new sorted array
        return [...filteredSkaters].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            const topLevelKeys: (keyof SkaterData)[] = ['name', 'overall', 'teamAbv', 'position'];

            if (key === 'name') {
                aValue = getLastName(a.name);
                bValue = getLastName(b.name);
            } else if (topLevelKeys.includes(key as keyof SkaterData)) {
                aValue = a[key as keyof SkaterData];
                bValue = b[key as keyof SkaterData];
            } else {
                aValue = a.attributes[key as keyof SkaterData['attributes']];
                bValue = b.attributes[key as keyof SkaterData['attributes']];
            }

            // Handle special 'handed' case to sort by string 'L'/'R'
            if (key === 'handed') {
                aValue = aValue === 0 ? 'L' : 'R';
                bValue = bValue === 0 ? 'L' : 'R';
            }

            let comparison = 0;
            if (aValue < bValue) {
                comparison = -1;
            } else if (aValue > bValue) {
                comparison = 1;
            }
            
            // Apply direction
            const result = direction === 'asc' ? comparison : -comparison;

            // Add stable sort: if primary sort is equal, sort by full name
            if (result === 0) {
                return a.name.localeCompare(b.name);
            }

            return result;
        });
    }, [teams, sortConfig, searchTerm, positionFilter]);
    
    const { paginatedSkaters, totalPages } = useMemo(() => {
        const totalPages = Math.ceil(sortedSkaters.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return { paginatedSkaters: sortedSkaters.slice(startIndex, endIndex), totalPages };
    }, [sortedSkaters, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig, itemsPerPage, positionFilter]);

    const handleSort = (key: SortableKeys) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            const ascDefaults: SortableKeys[] = ['name', 'teamAbv', 'handed', 'position'];
            return { key, direction: ascDefaults.includes(key) ? 'asc' : 'desc' };
        });
    };
    
    const headerGroups = [
        { label: 'Name', key: 'name' as SortableKeys, color: 'bg-slate-700' },
        { label: 'Team', key: 'teamAbv' as SortableKeys, color: 'bg-slate-700' },
        { label: 'Pos', key: 'position' as SortableKeys, color: 'bg-slate-700' },
        { label: 'Hand', key: 'handed' as SortableKeys, color: 'bg-slate-700' },
        { label: 'OVR', key: 'overall' as SortableKeys, color: 'bg-sky-700 text-sky-100' },
        { label: 'WT', key: 'weight' as SortableKeys, color: 'bg-slate-800' },
        { label: 'CHK', key: 'checking' as SortableKeys, color: 'bg-slate-800' },
        { label: 'SHP', key: 'shtpower' as SortableKeys, color: 'bg-red-800/50' },
        { label: 'SHA', key: 'shtacc' as SortableKeys, color: 'bg-red-800/50' },
        { label: 'SPD', key: 'speed' as SortableKeys, color: 'bg-green-800/50' },
        { label: 'AGL', key: 'agility' as SortableKeys, color: 'bg-green-800/50' },
        { label: 'STK', key: 'stickhand' as SortableKeys, color: 'bg-purple-800/50' },
        { label: 'PAS', key: 'passacc' as SortableKeys, color: 'bg-purple-800/50' },
        { label: 'OAW', key: 'oawareness' as SortableKeys, color: 'bg-sky-800/50' },
        { label: 'DAW', key: 'dawareness' as SortableKeys, color: 'bg-sky-800/50' },
    ];
    
    const getCellColor = (index: number): string => {
        if (index <= 3) return 'bg-slate-700/50';
        if (index === 4) return 'bg-sky-900/50';
        if (index <= 6) return 'bg-slate-800/50';
        if (index <= 8) return 'bg-red-900/30';
        if (index <= 10) return 'bg-green-900/30';
        if (index <= 12) return 'bg-purple-900/30';
        return 'bg-sky-900/30';
    };

    const SortIcon = ({ columnKey }: { columnKey: SortableKeys }) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />;
        }
        if (sortConfig.direction === 'asc') {
            return <ChevronUpIcon className="w-4 h-4" />;
        }
        return <ChevronDownIcon className="w-4 h-4" />;
    };

    return (
        <div className="bg-[#2B3544] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Player Data</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-800 rounded-md p-1 gap-1">
                        <FilterButton label="All" value="All" currentFilter={positionFilter} onClick={setPositionFilter} />
                        <FilterButton label="Forwards" value="F" currentFilter={positionFilter} onClick={setPositionFilter} />
                        <FilterButton label="Defensemen" value="D" currentFilter={positionFilter} onClick={setPositionFilter} />
                    </div>
                    <div className="relative">
                         <input 
                            type="text"
                            placeholder="Search players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-64 p-1.5 pl-4"
                            aria-label="Search players by name"
                        />
                    </div>
                </div>
            </div>
            <div className="border border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-700 text-sm">
                        <thead className="bg-gray-800">
                            <tr>
                                {headerGroups.map((header) => (
                                    <th
                                        key={header.key}
                                        scope="col"
                                        className={`px-2 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider ${header.color}`}
                                    >
                                        <button onClick={() => handleSort(header.key)} className="flex items-center gap-1 w-full">
                                            <span>{header.label}</span>
                                            <SortIcon columnKey={header.key} />
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-[#212934] divide-y divide-gray-700">
                            {paginatedSkaters.map((player) => (
                                <tr key={player.id} className="hover:bg-gray-800/50">
                                    <td className={`px-2 py-2 font-medium text-white truncate ${getCellColor(0)}`} title={player.name}>{player.name}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-gray-400 text-center ${getCellColor(1)}`}>{player.teamAbv}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-gray-300 text-center ${getCellColor(2)}`}>{player.position}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-gray-300 text-center ${getCellColor(3)}`}>{player.attributes.handed === 0 ? 'L' : 'R'}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center font-bold text-white ${getCellColor(4)}`}>{player.overall}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(5)}`}>{player.attributes.weight}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(6)}`}>{player.attributes.checking}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(7)}`}>{player.attributes.shtpower}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(8)}`}>{player.attributes.shtacc}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(9)}`}>{player.attributes.speed}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(10)}`}>{player.attributes.agility}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(11)}`}>{player.attributes.stickhand}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(12)}`}>{player.attributes.passacc}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(13)}`}>{player.attributes.oawareness}</td>
                                    <td className={`px-2 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(14)}`}>{player.attributes.dawareness}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedSkaters.length === 0 && (
                    <p className="text-center text-gray-500 py-10">
                        {searchTerm ? `No players found for "${searchTerm}".` : 'No skater data found in ROM.'}
                    </p>
                )}
            </div>
             {totalPages > 0 && (
                <div className="flex justify-between items-center mt-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <label htmlFor="items-per-page" className="font-medium">Rows per page:</label>
                        <select
                            id="items-per-page"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-gray-800 border border-gray-600 rounded-md p-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                         <span className="text-gray-400">| Total Players: {sortedSkaters.length}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-semibold">
                            Page {totalPages > 0 ? currentPage : 0} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                aria-label="Go to previous page"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                aria-label="Go to next page"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};