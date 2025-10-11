import React, { useMemo, useState } from 'react';
import type { Player } from '../types';
import { PlayerCard } from './PlayerCard';

interface RosterProps {
  players: Player[];
  onDragStart: (player: Player, playerIndex: number) => void;
  onDrop: () => void;
  onViewAttributes: (player: Player) => void;
  onCompare: (player: Player) => void;
  isDragSource: boolean;
  draggedPlayer?: Player | null;
  openMenuId: string | null;
  onToggleMenu: (menuId: string) => void;
  onCloseMenu: () => void;
  selectedTeamName: string;
  isComparisonMode: boolean;
  firstComparisonPlayer: Player | null;
}

const FilterButton: React.FC<{
  label: 'All' | 'Forwards' | 'Defensemen' | 'Goalies';
  value: 'All' | 'Forward' | 'Defenseman' | 'Goalie';
  currentFilter: string;
  onClick: (filter: 'All' | 'Forward' | 'Defenseman' | 'Goalie') => void;
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

const getLastName = (name: string): string => {
    const parts = name.split(' ');
    return parts[parts.length - 1];
};

export const Roster: React.FC<RosterProps> = ({ players, onDragStart, onDrop, onViewAttributes, onCompare, isDragSource, draggedPlayer, openMenuId, onToggleMenu, onCloseMenu, selectedTeamName, isComparisonMode, firstComparisonPlayer }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [positionFilter, setPositionFilter] = useState<'All' | 'Forward' | 'Defenseman' | 'Goalie'>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedPlayer && !isDragSource) {
      setIsHovered(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // This check is important to prevent flickering when dragging over child elements.
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
    }
    setIsHovered(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
    onDrop();
  };
  
  const canDrop = !!draggedPlayer;
  const showHighlight = isHovered && canDrop && !isDragSource;
  const hasPlayers = players.length > 0;

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players;
    if (positionFilter !== 'All') {
        filtered = players.filter(p => p.role === positionFilter);
    }

    return [...filtered].sort((a, b) => {
        const lastNameA = getLastName(a.name);
        const lastNameB = getLastName(b.name);
        if (sortOrder === 'asc') {
            return lastNameA.localeCompare(lastNameB);
        } else {
            return lastNameB.localeCompare(lastNameA);
        }
    });
  }, [players, positionFilter, sortOrder]);
  
  const forwards = positionFilter === 'All' ? filteredAndSortedPlayers.filter(p => p.role === 'Forward') : [];
  const defensemen = positionFilter === 'All' ? filteredAndSortedPlayers.filter(p => p.role === 'Defenseman') : [];
  const goalies = positionFilter === 'All' ? filteredAndSortedPlayers.filter(p => p.role === 'Goalie') : [];

  const renderPlayerList = (playerList: Player[]) => {
    return playerList.map((player) => {
      const originalIndex = players.findIndex(p => p.id === player.id);
      const menuId = `roster-${player.id}-${originalIndex}`;
      return (
        <PlayerCard 
          key={menuId}
          player={player} 
          onDragStart={(p) => onDragStart(p, originalIndex)}
          onViewAttributes={onViewAttributes}
          onCompare={onCompare}
          isDragging={draggedPlayer?.id === player.id}
          menuOpen={openMenuId === menuId}
          onToggleMenu={() => onToggleMenu(menuId)}
          onCloseMenu={onCloseMenu}
          selectedTeamName={selectedTeamName}
          isComparisonMode={isComparisonMode}
          firstComparisonPlayer={firstComparisonPlayer}
        />
      );
    });
  };

  return (
    <div
      id="tour-step-7"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`mt-8 bg-[#2B3544] p-4 rounded-lg min-h-[104px] transition-all duration-300 border-2 ${isDragSource ? 'border-yellow-500' : showHighlight ? 'border-sky-500 bg-sky-900/50' : 'border-transparent'} ${!hasPlayers && !showHighlight ? 'flex flex-col' : ''}`}
      aria-label="Roster, drop target"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-center md:text-left w-full md:w-auto shrink-0">Roster</h2>
        
        {hasPlayers && (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center bg-gray-800 rounded-md p-1 gap-1 flex-wrap justify-center">
                    <FilterButton label="All" value="All" currentFilter={positionFilter} onClick={setPositionFilter} />
                    <FilterButton label="Forwards" value="Forward" currentFilter={positionFilter} onClick={setPositionFilter} />
                    <FilterButton label="Defensemen" value="Defenseman" currentFilter={positionFilter} onClick={setPositionFilter} />
                    <FilterButton label="Goalies" value="Goalie" currentFilter={positionFilter} onClick={setPositionFilter} />
                </div>
                <div className="w-full sm:w-auto">
                    <label htmlFor="roster-sort" className="sr-only">Sort by</label>
                    <select 
                        id="roster-sort" 
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                        className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-1.5"
                    >
                        <option value="asc">Sort: Name (A-Z)</option>
                        <option value="desc">Sort: Name (Z-A)</option>
                    </select>
                </div>
            </div>
        )}
      </div>

      <div className="space-y-4">
        {hasPlayers && (
            <>
                {positionFilter === 'All' ? (
                    <>
                        {forwards.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-400 mb-2 px-1">Forwards</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {renderPlayerList(forwards)}
                                </div>
                            </div>
                        )}
                        {defensemen.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-400 mb-2 px-1">Defensemen</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {renderPlayerList(defensemen)}
                                </div>
                            </div>
                        )}
                        {goalies.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-400 mb-2 px-1">Goalies</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {renderPlayerList(goalies)}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    filteredAndSortedPlayers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {renderPlayerList(filteredAndSortedPlayers)}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No {positionFilter}s found in the roster.</p>
                    )
                )}
            </>
        )}
        
        {showHighlight && draggedPlayer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <PlayerCard player={draggedPlayer} isGhost selectedTeamName={selectedTeamName} onCompare={onCompare} isComparisonMode={isComparisonMode} firstComparisonPlayer={firstComparisonPlayer} />
            </div>
        )}
        {!hasPlayers && !showHighlight && (
            <div className="text-gray-500 text-center py-8">Drag players here to remove them from a line.</div>
        )}
      </div>
    </div>
  );
};