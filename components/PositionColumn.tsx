import React from 'react';
// FIX: The 'Position' type is not exported from '../types'. The import has been corrected to only include 'Player'.
import type { Player } from '../types';
import { PlayerCard } from './PlayerCard';

// FIX: Added local 'Position' interface to resolve type error, as it's not defined in the shared types file.
interface Position {
  id: string;
  title: string;
  line: string;
  players: Player[];
}

interface PositionColumnProps {
  position: Position;
  onDragStart: (player: Player, sourceColumnId: string) => void;
  onDrop: (destinationColumnId:string) => void;
  isDropTarget: boolean;
  // FIX: Add missing properties to support player comparison feature.
  onCompare: (player: Player) => void;
  isComparisonMode: boolean;
  firstComparisonPlayer: Player | null;
}

export const PositionColumn: React.FC<PositionColumnProps> = ({ position, onDragStart, onDrop, isDropTarget, onCompare, isComparisonMode, firstComparisonPlayer }) => {

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDrop(position.id);
  };

  return (
    <div
      className={`bg-[#2B3544] rounded-xl p-4 transition-colors duration-300 ${isDropTarget ? 'bg-blue-800/50' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h2 className="text-xl font-bold text-center mb-2">{position.title}</h2>
      <div className="bg-gray-700 rounded-lg p-2 text-center mb-4">
        <span className="font-semibold text-gray-300">{position.line}</span>
      </div>
      <div className="space-y-3">
        {position.players.map(player => (
          <PlayerCard 
            key={player.id} 
            player={player} 
            onDragStart={(p) => onDragStart(p, position.id)}
            // FIX: Pass down properties required by PlayerCard for comparison feature.
            onCompare={onCompare}
            isComparisonMode={isComparisonMode}
            firstComparisonPlayer={firstComparisonPlayer}
          />
        ))}
      </div>
    </div>
  );
};
