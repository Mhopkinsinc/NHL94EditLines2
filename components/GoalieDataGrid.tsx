import React, { useMemo, useState, useEffect } from 'react';
import type { TeamInfo } from '../rom-parser';
import type { Player } from '../types';
import { calculateGoalieOverall } from '../utils';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from './icons';

interface GoalieDataGridProps {
    teams: TeamInfo[];
}

interface GoalieData extends Player {
    overall: number;
    teamAbv: string;
    totalStickGlove: number;
}

type SortableKeys = keyof Omit<GoalieData, 'attributes' | 'id' | 'statusIcon' | 'role'> | keyof GoalieData['attributes'];

export const GoalieDataGrid: React.FC<GoalieDataGridProps> = ({ teams }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({
        key: 'overall',
        direction: 'desc',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const sortedGoalies = useMemo(() => {
        const goalies: GoalieData[] = teams
            .filter(team => !team.city.includes('All Stars'))
            .flatMap(team =>
                team.players
                    .filter(player => player.role === 'Goalie')
                    .map(player => ({
                        ...player,
                        overall: calculateGoalieOverall(player),
                        teamAbv: team.abv,
                        totalStickGlove: 
                            player.attributes.roughness + // Stick Left
                            player.attributes.endurance + // Stick Right
                            player.attributes.aggressiveness + // Glove Left
                            player.attributes.passacc, // Glove Right
                    }))
            );
        
        const filteredGoalies = goalies.filter(player => {
            return !searchTerm || player.name.toLowerCase().includes(searchTerm.toLowerCase());
        });


        const { key, direction } = sortConfig;

        return [...filteredGoalies].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            const topLevelKeys: (keyof GoalieData)[] = ['name', 'overall', 'teamAbv', 'totalStickGlove'];

            if (topLevelKeys.includes(key as keyof GoalieData)) {
                aValue = a[key as keyof GoalieData];
                bValue = b[key as keyof GoalieData];
            } else {
                aValue = a.attributes[key as keyof GoalieData['attributes']];
                bValue = b.attributes[key as keyof GoalieData['attributes']];
            }
            
            if (key === 'handed') {
                aValue = aValue === 0 ? 'Lefty' : 'Righty';
                bValue = bValue === 0 ? 'Lefty' : 'Righty';
            }

            let comparison = 0;
            if (aValue < bValue) {
                comparison = -1;
            } else if (aValue > bValue) {
                comparison = 1;
            }
            
            const result = direction === 'asc' ? comparison : -comparison;

            if (result === 0 && key !== 'name') {
                return a.name.localeCompare(b.name);
            }

            return result;
        });
    }, [teams, sortConfig, searchTerm]);
    
    const { paginatedGoalies, totalPages } = useMemo(() => {
        const totalPages = Math.ceil(sortedGoalies.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return { paginatedGoalies: sortedGoalies.slice(startIndex, endIndex), totalPages };
    }, [sortedGoalies, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig, itemsPerPage]);

    const handleSort = (key: SortableKeys) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            const ascDefaults: SortableKeys[] = ['name', 'teamAbv', 'handed'];
            return { key, direction: ascDefaults.includes(key) ? 'asc' : 'desc' };
        });
    };
    
    const headerGroups = [
        { label: 'Name', key: 'name' as SortableKeys },
        { label: 'Team', key: 'teamAbv' as SortableKeys },
        { label: 'Glove Hand', key: 'handed' as SortableKeys },
        { label: 'Overall', key: 'overall' as SortableKeys, color: 'bg-black text-white' },
        { label: 'Weight', key: 'weight' as SortableKeys, color: 'bg-red-800' },
        { label: 'Speed', key: 'speed' as SortableKeys, color: 'bg-yellow-700' },
        { label: 'Agility', key: 'agility' as SortableKeys, color: 'bg-yellow-700' },
        { label: 'Puck Control', key: 'shtpower' as SortableKeys, color: 'bg-green-800' },
        { label: 'Def Aware', key: 'dawareness' as SortableKeys, color: 'bg-green-800' },
        { label: 'Stick Left', key: 'roughness' as SortableKeys, color: 'bg-indigo-800' },
        { label: 'Glove Right', key: 'passacc' as SortableKeys, color: 'bg-indigo-800' },
        { label: 'Stick Right', key: 'endurance' as SortableKeys, color: 'bg-indigo-800' },
        { label: 'Glove Left', key: 'aggressiveness' as SortableKeys, color: 'bg-indigo-800' },
        { label: 'Total Stick/Glove', key: 'totalStickGlove' as SortableKeys },
    ];

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
                <h2 className="text-2xl font-bold">Goalie Data</h2>
                <div className="relative">
                     <input 
                        type="text"
                        placeholder="Search goalies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-64 p-1.5 pl-4"
                        aria-label="Search goalies by name"
                    />
                </div>
            </div>
            <div className="border border-gray-700 rounded-lg overflow-auto relative max-h-[60vh]">
                {sortedGoalies.length > 0 ? (
                    <table className="w-full divide-y divide-gray-700 text-sm table-auto">
                        <thead className="bg-gray-800 sticky top-0 z-10">
                            <tr>
                                {headerGroups.map((header) => (
                                    <th
                                        key={header.key}
                                        scope="col"
                                        className={`px-3 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider ${header.color || 'bg-slate-700'}`}
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
                            {paginatedGoalies.map((player) => (
                                <tr key={player.id} className="hover:bg-gray-800/50">
                                    <td className="px-3 py-2 font-medium text-white whitespace-nowrap" title={player.name}>{player.name}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-400 text-center">{player.teamAbv}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-gray-300 ${player.attributes.handed === 1 ? 'bg-orange-900/40' : 'bg-green-900/30'}`}>{player.attributes.handed === 0 ? 'Lefty' : 'Righty'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center font-bold text-white bg-gray-500/20">{player.overall}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300">{player.attributes.weight}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300">{player.attributes.speed}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300">{player.attributes.agility}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300 bg-red-900/20">{player.attributes.shtpower}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300 bg-red-900/20">{player.attributes.dawareness}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300 bg-purple-900/20">{player.attributes.roughness}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300 bg-purple-900/20">{player.attributes.passacc}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300 bg-purple-900/20">{player.attributes.endurance}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center text-gray-300 bg-purple-900/20">{player.attributes.aggressiveness}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center font-bold text-white bg-gray-500/20">{player.totalStickGlove}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 py-10">
                        {searchTerm ? `No goalies found for "${searchTerm}".` : 'No goalie data found in ROM.'}
                    </p>
                )}
            </div>
             {totalPages > 0 && (
                <div className="flex justify-between items-center mt-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <label htmlFor="items-per-page-goalie" className="font-medium">Rows per page:</label>
                        <select
                            id="items-per-page-goalie"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-gray-800 border border-gray-600 rounded-md p-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                         <span className="text-gray-400">| Total Goalies: {sortedGoalies.length}</span>
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