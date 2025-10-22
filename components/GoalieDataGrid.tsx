import React, { useMemo, useState, useEffect } from 'react';
import type { TeamInfo } from '../rom-parser';
import type { Player } from '../types';
import { calculateGoalieOverall } from '../utils';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon, ArrowDownTrayIcon } from './icons';

interface GoalieDataGridProps {
    teams: TeamInfo[];
}

interface GoalieData extends Player {
    overall: number;
    teamAbv: string;
    totalStickGlove: number;
}

type SortableKeys = keyof Omit<GoalieData, 'attributes' | 'id' | 'statusIcon' | 'role'> | keyof GoalieData['attributes'];

const getLastName = (name: string): string => {
    const parts = name.split(' ');
    return parts[parts.length - 1];
};

const getCellColor = (index: number): string => {
    if (index <= 2) return 'bg-slate-700/50'; // General: Name, Team, Hand
    if (index === 3) return 'bg-sky-900/50'; // Overall
    if (index === 4) return 'bg-slate-800/50'; // Physical: Weight
    if (index <= 6) return 'bg-green-900/30'; // Skating: Speed, Agility
    if (index === 7 || index === 8) return 'bg-sky-900/30'; // Awareness: Puck Control, Def Aware
    if (index <= 12) return 'bg-purple-900/30'; // Goalie Stick/Glove skills
    if (index === 13) return 'bg-slate-700/50'; // General/Total
    return ''; // Default
};

export const GoalieDataGrid: React.FC<GoalieDataGridProps> = ({ teams }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({
        key: 'overall',
        direction: 'desc',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const headerGroups = [
        { label: 'Name', key: 'name' as SortableKeys, color: 'bg-slate-700', fullName: 'Player Name' },
        { label: 'Team', key: 'teamAbv' as SortableKeys, color: 'bg-slate-700', fullName: 'Team' },
        { label: 'Hand', key: 'handed' as SortableKeys, color: 'bg-slate-700', fullName: 'Glove Hand' },
        { label: 'OVR', key: 'overall' as SortableKeys, color: 'bg-sky-700 text-sky-100', fullName: 'Overall' },
        { label: 'WT', key: 'weight' as SortableKeys, color: 'bg-slate-800', fullName: 'Weight' },
        { label: 'SPD', key: 'speed' as SortableKeys, color: 'bg-green-800/50', fullName: 'Speed' },
        { label: 'AGL', key: 'agility' as SortableKeys, color: 'bg-green-800/50', fullName: 'Agility' },
        { label: 'PCK', key: 'shtpower' as SortableKeys, color: 'bg-sky-800/50', fullName: 'Puck Control' },
        { label: 'DAW', key: 'dawareness' as SortableKeys, color: 'bg-sky-800/50', fullName: 'Defensive Awareness' },
        { label: 'STL', key: 'roughness' as SortableKeys, color: 'bg-purple-800/50', fullName: 'Stick Left' },
        { label: 'GLR', key: 'passacc' as SortableKeys, color: 'bg-purple-800/50', fullName: 'Glove Right' },
        { label: 'STR', key: 'endurance' as SortableKeys, color: 'bg-purple-800/50', fullName: 'Stick Right' },
        { label: 'GLL', key: 'aggressiveness' as SortableKeys, color: 'bg-purple-800/50', fullName: 'Glove Left' },
        { label: 'TOT S/G', key: 'totalStickGlove' as SortableKeys, color: 'bg-slate-700', fullName: 'Total Stick/Glove' },
    ];

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
            
            if (key === 'name') {
                aValue = getLastName(a.name);
                bValue = getLastName(b.name);
            } else if (topLevelKeys.includes(key as keyof GoalieData)) {
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

            if (result === 0) {
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
    
    const handleExportCSV = () => {
        if (sortedGoalies.length === 0) return;

        const escapeCSV = (field: string | number): string => {
            const strField = String(field);
            let escaped = strField.replace(/"/g, '""'); // Escape double quotes
            if (strField.includes(',') || strField.includes('"') || strField.includes('\n') || strField.includes('\r')) {
                escaped = `"${escaped}"`;
            }
            return escaped;
        };

        const headers = headerGroups.map(h => escapeCSV(h.fullName || h.label));

        const rows = sortedGoalies.map(player => {
            return headerGroups.map(header => {
                // FIX: Use a type-safe approach to retrieve player values for CSV export.
                // This ensures that the `value` variable is always a string or number, resolving the type error.
                let value: string | number;
                const { key } = header;

                switch (key) {
                    case 'name':
                    case 'teamAbv':
                    case 'overall':
                    case 'totalStickGlove':
                        value = player[key];
                        break;
                    default:
                        value = player.attributes[key as keyof Player['attributes']];
                        break;
                }

                if (header.key === 'handed') {
                    value = value === 0 ? 'Lefty' : 'Righty';
                }
                return escapeCSV(value);
            }).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "nhl94-goalies.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                <h2 className="text-2xl font-bold">Goalie Data</h2>
                <div className="flex items-center gap-2">
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
                     <button
                        onClick={handleExportCSV}
                        disabled={sortedGoalies.length === 0}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-1.5 px-3 rounded-md transition-colors flex items-center gap-2"
                        aria-label="Export data to CSV"
                        title={sortedGoalies.length > 0 ? "Export data to CSV" : "No data to export"}
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Export
                    </button>
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
                                        className={`px-3 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider ${header.color}`}
                                    >
                                        <button onClick={() => handleSort(header.key)} className="flex items-center gap-1 w-full" title={`Sort by ${header.fullName}`}>
                                            <span>{header.label}</span>
                                            <SortIcon columnKey={header.key} />
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-[#212934] divide-y divide-gray-700">
                            {paginatedGoalies.map((player) => (
                                <tr key={`${player.name}-${player.teamAbv}`} className="hover:bg-gray-800/50">
                                    <td className={`px-3 py-2 font-medium text-white whitespace-nowrap ${getCellColor(0)}`} title={player.name}>{player.name}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-gray-400 text-center ${getCellColor(1)}`}>{player.teamAbv}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-gray-300 text-center ${getCellColor(2)}`}>{player.attributes.handed === 0 ? 'Lefty' : 'Righty'}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center font-bold text-white ${getCellColor(3)}`}>{player.overall}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(4)}`}>{player.attributes.weight}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(5)}`}>{player.attributes.speed}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(6)}`}>{player.attributes.agility}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(7)}`}>{player.attributes.shtpower}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(8)}`}>{player.attributes.dawareness}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(9)}`}>{player.attributes.roughness}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(10)}`}>{player.attributes.passacc}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(11)}`}>{player.attributes.endurance}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(12)}`}>{player.attributes.aggressiveness}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-center font-bold text-white ${getCellColor(13)}`}>{player.totalStickGlove}</td>
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