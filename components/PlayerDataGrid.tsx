import React, { useMemo, useState } from 'react';
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
}

type SortableKeys = keyof Omit<SkaterData, 'attributes' | 'id' | 'statusIcon' | 'role'> | keyof SkaterData['attributes'];

export const PlayerDataGrid: React.FC<PlayerDataGridProps> = ({ teams }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({
        key: 'overall',
        direction: 'desc',
    });

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
                    }))
            );

        const { key, direction } = sortConfig;

        // Use a stable sort by creating a new sorted array
        return [...skaters].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            const topLevelKeys: (keyof SkaterData)[] = ['name', 'overall', 'teamAbv'];

            if (topLevelKeys.includes(key as keyof SkaterData)) {
                aValue = a[key as keyof SkaterData];
                bValue = b[key as keyof SkaterData];
            } else {
                aValue = a.attributes[key as keyof SkaterData['attributes']];
                bValue = b.attributes[key as keyof SkaterData['attributes']];
            }

            // Handle special 'handed' case to sort by string 'Lefty'/'Righty'
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
            
            // Apply direction
            const result = direction === 'asc' ? comparison : -comparison;

            // Add stable sort: if primary sort is equal, sort by name
            if (result === 0 && key !== 'name') {
                return a.name.localeCompare(b.name);
            }

            return result;
        });
    }, [teams, sortConfig]);

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
        { label: 'Name', key: 'name' as SortableKeys, color: 'bg-slate-700' },
        { label: 'Team', key: 'teamAbv' as SortableKeys, color: 'bg-slate-700' },
        { label: 'Handed', key: 'handed' as SortableKeys, color: 'bg-slate-700' },
        { label: 'Overall', key: 'overall' as SortableKeys, color: 'bg-sky-700 text-sky-100' },
        { label: 'Weight', key: 'weight' as SortableKeys, color: 'bg-slate-800' },
        { label: 'Checking', key: 'checking' as SortableKeys, color: 'bg-slate-800' },
        { label: 'Shot Power', key: 'shtpower' as SortableKeys, color: 'bg-red-800/50' },
        { label: 'Shot Accuracy', key: 'shtacc' as SortableKeys, color: 'bg-red-800/50' },
        { label: 'Speed', key: 'speed' as SortableKeys, color: 'bg-green-800/50' },
        { label: 'Agility', key: 'agility' as SortableKeys, color: 'bg-green-800/50' },
        { label: 'Stick Handling', key: 'stickhand' as SortableKeys, color: 'bg-purple-800/50' },
        { label: 'Passing', key: 'passacc' as SortableKeys, color: 'bg-purple-800/50' },
        { label: 'Off Aware', key: 'oawareness' as SortableKeys, color: 'bg-sky-800/50' },
        { label: 'Def Aware', key: 'dawareness' as SortableKeys, color: 'bg-sky-800/50' },
    ];
    
    const getCellColor = (index: number): string => {
        if (index <= 2) return 'bg-slate-700/50';
        if (index === 3) return 'bg-sky-900/50';
        if (index <= 5) return 'bg-slate-800/50';
        if (index <= 7) return 'bg-red-900/30';
        if (index <= 9) return 'bg-green-900/30';
        if (index <= 11) return 'bg-purple-900/30';
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
        <div className="bg-[#2B3544] p-4 rounded-lg overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4">Player Data</h2>
            <div className="border border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700 text-sm">
                    <thead className="bg-gray-800">
                        <tr>
                            {headerGroups.map((header) => (
                                <th
                                    key={header.key}
                                    scope="col"
                                    className={`px-3 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider ${header.color}`}
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
                        {sortedSkaters.map((player) => (
                            <tr key={player.id} className="hover:bg-gray-800/50">
                                <td className={`px-3 py-2 whitespace-nowrap font-medium text-white ${getCellColor(0)}`}>{player.name}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-gray-400 text-center ${getCellColor(1)}`}>{player.teamAbv}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-gray-300 ${getCellColor(2)}`}>{player.attributes.handed === 0 ? 'Lefty' : 'Righty'}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center font-bold text-white ${getCellColor(3)}`}>{player.overall}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(4)}`}>{player.attributes.weight}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(5)}`}>{player.attributes.checking}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(6)}`}>{player.attributes.shtpower}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(7)}`}>{player.attributes.shtacc}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(8)}`}>{player.attributes.speed}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(9)}`}>{player.attributes.agility}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(10)}`}>{player.attributes.stickhand}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(11)}`}>{player.attributes.passacc}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(12)}`}>{player.attributes.oawareness}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-center text-gray-300 ${getCellColor(13)}`}>{player.attributes.dawareness}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedSkaters.length === 0 && (
                    <p className="text-center text-gray-500 py-10">No skater data found in ROM.</p>
                )}
            </div>
        </div>
    );
};