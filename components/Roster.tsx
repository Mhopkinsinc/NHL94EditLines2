import React, { useState } from 'react';
import type { Player } from '../types';
import { PlayerCard } from './PlayerCard';

interface RosterProps {
  players: Player[];
  onDragStart: (player: Player, playerIndex: number) => void;
  onDrop: () => void;
  onViewAttributes: (player: Player) => void;
  isDragSource: boolean;
  draggedPlayer?: Player;
  openMenuId: string | null;
  onToggleMenu: (menuId: string) => void;
  onCloseMenu: () => void;
  selectedTeamName: string;
}

export const Roster: React.FC<RosterProps> = ({ players, onDragStart, onDrop, onViewAttributes, isDragSource, draggedPlayer, openMenuId, onToggleMenu, onCloseMenu, selectedTeamName }) => {
  const [isHovered, setIsHovered] = useState(false);

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

  const forwards = players.filter(p => p.role === 'Forward');
  const defensemen = players.filter(p => p.role === 'Defenseman');
  const goalies = players.filter(p => p.role === 'Goalie');

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
          isDragging={draggedPlayer?.id === player.id}
          menuOpen={openMenuId === menuId}
          onToggleMenu={() => onToggleMenu(menuId)}
          onCloseMenu={onCloseMenu}
          selectedTeamName={selectedTeamName}
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
      className={`mt-8 bg-[#2B3544] p-4 rounded-lg min-h-[104px] transition-all duration-300 border-2 ${isDragSource ? 'border-yellow-500' : showHighlight ? 'border-sky-500 bg-sky-900/50' : 'border-transparent'} ${!hasPlayers && !showHighlight ? 'flex flex-col justify-center items-center' : 'space-y-4'}`}
      aria-label="Roster, drop target"
    >
      <h2 className="text-2xl font-bold text-center">Roster</h2>
      
      {hasPlayers && (
        <>
          {forwards.length > 0 && (
            <div>
              <h3 
                className="text-lg font-semibold text-gray-400 mb-2 px-1"
              >
                Forwards
              </h3>
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
      )}
      
      {showHighlight && draggedPlayer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <PlayerCard player={draggedPlayer} isGhost selectedTeamName={selectedTeamName} />
          </div>
      )}
      {!hasPlayers && !showHighlight && (
          <div className="text-gray-500 text-center">Drag players here to remove them from a line.</div>
      )}
    </div>
  );
};