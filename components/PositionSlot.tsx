import React, { useState, useMemo } from 'react';
import type { Player, PositionType } from '../types';
import { PlayerCard } from './PlayerCard';

interface PositionSlotProps {
  index: number;
  positionType: PositionType;
  player: Player | null;
  onDragStart: (player: Player, index: number, position: PositionType) => void;
  onDrop: (index: number, position: PositionType) => void;
  onRemove?: (index: number, position: PositionType) => void;
  onEmptyClick?: () => void;
  onViewAttributes: (player: Player) => void;
  isDragSource: boolean;
  draggedPlayer?: Player;
  menuId: string;
  isMenuOpen: boolean;
  onToggleMenu: (menuId: string) => void;
  onCloseMenu: () => void;
  selectedTeamName: string;
  isTourStep?: boolean;
}

export const PositionSlot: React.FC<PositionSlotProps> = ({ index, positionType, player, onDragStart, onDrop, onRemove, onEmptyClick, onViewAttributes, isDragSource, draggedPlayer, menuId, isMenuOpen, onToggleMenu, onCloseMenu, selectedTeamName, isTourStep }) => {
  const [isHovered, setIsHovered] = useState(false);

  const canDrop = useMemo(() => {
    if (!draggedPlayer) return false;

    const forwardPositions: ReadonlyArray<PositionType> = ['LW', 'C', 'RW', 'EX'];
    const defensePositions: ReadonlyArray<PositionType> = ['LD', 'RD'];
    const goaliePositions: ReadonlyArray<PositionType> = ['G'];

    const playerIsForward = draggedPlayer.role === 'Forward';
    const playerIsDefense = draggedPlayer.role === 'Defenseman';
    const playerIsGoalie = draggedPlayer.role === 'Goalie';

    const slotIsForward = forwardPositions.includes(positionType);
    const slotIsDefense = defensePositions.includes(positionType);
    const slotIsGoalie = goaliePositions.includes(positionType);

    if (playerIsForward && slotIsForward) return true;
    if (playerIsDefense && slotIsDefense) return true;
    if (playerIsGoalie && slotIsGoalie) return true;
    
    return false;
  }, [draggedPlayer, positionType]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (canDrop) {
      e.preventDefault(); // Necessary to allow dropping
    }
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
    onDrop(index, positionType);
  };

  const backgroundStyle = useMemo(() => {
    const style = {
      backgroundRepeat: 'no-repeat',
      opacity: 0.02,
    };
    if (selectedTeamName === 'Toronto Maple Leafs') {
      return {
        ...style,
        backgroundImage: 'url(https://puckgm.puckpedia.com/icons/8-dark.svg)',
        backgroundSize: '160%',
        backgroundPosition: '80% 50%',
      };
    } else if (selectedTeamName === 'Chicago Blackhawks') {
      return {
        ...style,
        backgroundImage: 'url(https://puckgm.puckpedia.com/icons/22.svg)',
        backgroundSize: '160%',
        backgroundPosition: '80% 50%',
      };
    }
    return {
      ...style,
      backgroundImage: 'url(https://www-league.nhlstatic.com/images/logos/league-dark/133.svg)',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
    };
  }, [selectedTeamName]);


  const showHighlight = isHovered && canDrop && !isDragSource;
  const showGhost = !player && showHighlight;


  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`rounded-lg p-1 min-h-[5rem] flex flex-col justify-center items-center transition-all duration-300 border-2 ${isDragSource ? 'border-yellow-500' : showHighlight ? 'border-sky-500 bg-sky-900/50' : 'border-transparent'}`}
      aria-label={`Position ${positionType}, drop target`}
    >
      {player ? (
        <PlayerCard 
          player={player} 
          onDragStart={(p) => onDragStart(p, index, positionType)}
          onRemove={onRemove ? () => onRemove(index, positionType) : undefined}
          onViewAttributes={onViewAttributes}
          isDragging={draggedPlayer?.id === player.id}
          menuOpen={isMenuOpen}
          onToggleMenu={() => onToggleMenu(menuId)}
          onCloseMenu={onCloseMenu}
          selectedTeamName={selectedTeamName}
          isTourStep={isTourStep}
        />
      ) : showGhost && draggedPlayer ? (
        <PlayerCard player={draggedPlayer} isGhost selectedTeamName={selectedTeamName} />
      ) : (
        <div 
            className="w-full h-[4.5rem] bg-[#2B3544] rounded-lg flex justify-center items-center hover:bg-[#394559] transition-colors cursor-pointer relative overflow-hidden"
            onClick={onEmptyClick}
            role="button"
            tabIndex={onEmptyClick ? 0 : -1}
            onKeyPress={(e) => { if (e.key === 'Enter' && onEmptyClick) onEmptyClick() }}
            aria-label={`Add player to ${positionType}`}
        >
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0" style={{ backgroundColor: '#2B3544' }}></div>
                <div
                    className="absolute inset-0"
                    style={backgroundStyle}
                />
            </div>
          <span className="font-bold text-white text-lg tracking-wider opacity-75 relative z-10">{positionType}</span>
        </div>
      )}
    </div>
  );
};