import React, { useState, useMemo } from 'react';
import type { Player, PositionType } from '../types';
import { PlayerCard } from './PlayerCard';
import { chicagoLogoDataUri } from './ChicagoLogo';
import { torontoLogoDataUri } from './TorontoLogo';
import { nhlLogoDataUri } from './NhlLogo';

interface PositionSlotProps {
  index: number;
  positionType: PositionType;
  player: Player | null;
  onDragStart: (player: Player, index: number, position: PositionType) => void;
  onDrop: (index: number, position: PositionType) => void;
  onRemove?: (index: number, position: PositionType) => void;
  onEmptyClick?: () => void;
  onViewAttributes: (player: Player) => void;
  onCompare: (player: Player) => void;
  isDragSource: boolean;
  draggedPlayer?: Player | null;
  menuId: string;
  isMenuOpen: boolean;
  onToggleMenu: (menuId: string) => void;
  onCloseMenu: () => void;
  selectedTeamName: string;
  isTourStep?: boolean;
  isComparisonMode: boolean;
  firstComparisonPlayer: Player | null;
}

export const PositionSlot: React.FC<PositionSlotProps> = ({ index, positionType, player, onDragStart, onDrop, onRemove, onEmptyClick, onViewAttributes, onCompare, isDragSource, draggedPlayer, menuId, isMenuOpen, onToggleMenu, onCloseMenu, selectedTeamName, isTourStep, isComparisonMode, firstComparisonPlayer }) => {
  const [isHovered, setIsHovered] = useState(false);

  const canDrop = useMemo(() => {
    if (isComparisonMode || !draggedPlayer) return false;

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
  }, [draggedPlayer, positionType, isComparisonMode]);

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
        backgroundImage: `url(${torontoLogoDataUri})`,
        backgroundSize: '160%',
        backgroundPosition: '80% 50%',
      };
    } else if (selectedTeamName === 'Chicago Blackhawks') {
      return {
        ...style,
        backgroundImage: `url(${chicagoLogoDataUri})`,
        backgroundSize: '160%',
        backgroundPosition: '80% 50%',
      };
    }
    return {
      ...style,
      backgroundImage: `url(${nhlLogoDataUri})`,
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
          onCompare={onCompare}
          isDragging={draggedPlayer?.id === player.id}
          menuOpen={isMenuOpen}
          onToggleMenu={() => onToggleMenu(menuId)}
          onCloseMenu={onCloseMenu}
          selectedTeamName={selectedTeamName}
          isTourStep={isTourStep}
          isComparisonMode={isComparisonMode}
          firstComparisonPlayer={firstComparisonPlayer}
        />
      ) : showGhost && draggedPlayer ? (
        <PlayerCard player={draggedPlayer} isGhost selectedTeamName={selectedTeamName} onCompare={onCompare} isComparisonMode={isComparisonMode} firstComparisonPlayer={firstComparisonPlayer} />
      ) : (
        <div 
            className={`w-full h-[4.5rem] bg-[#2B3544] rounded-lg flex justify-center items-center transition-colors relative overflow-hidden ${isComparisonMode ? 'cursor-not-allowed opacity-50' : 'hover:bg-[#394559] cursor-pointer'}`}
            onClick={isComparisonMode ? undefined : onEmptyClick}
            role="button"
            tabIndex={onEmptyClick && !isComparisonMode ? 0 : -1}
            onKeyPress={(e) => { if (e.key === 'Enter' && onEmptyClick && !isComparisonMode) onEmptyClick() }}
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
