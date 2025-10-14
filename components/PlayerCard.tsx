import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Player } from '../types';
import { AnchorIcon, DotsIcon, FeatherIcon, RookieIcon, WaiversIcon } from './icons';
import { torontoLogoDataUri } from './TorontoLogo';
import { chicagoLogoDataUri } from './ChicagoLogo';
import { nhlLogoDataUri } from './NhlLogo';

interface PlayerCardProps {
  player: Player;
  onDragStart?: (player: Player) => void;
  onRemove?: () => void;
  onViewAttributes?: (player: Player) => void;
  onCompare: (player: Player) => void;
  isDragging?: boolean;
  isGhost?: boolean;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
  selectedTeamName?: string;
  isTourStep?: boolean;
  isComparisonMode: boolean;
  firstComparisonPlayer: Player | null;
}

const getLastName = (name: string): string => {
    const parts = name.split(' ');
    return parts[parts.length - 1];
};


const PlayerStatusIcon: React.FC<{ status?: string }> = ({ status }) => {
  switch (status) {
    case 'anchor':
      return <AnchorIcon className="w-5 h-5 text-white" title="Veteran" />;
    case 'rookie':
      return <RookieIcon className="w-5 h-5 text-green-400" />;
    case 'waivers':
      return <WaiversIcon className="w-5 h-5 text-yellow-400" />;
    default:
      return null;
  }
};


export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onDragStart, onRemove, onViewAttributes, onCompare, isDragging, isGhost, menuOpen, onToggleMenu, onCloseMenu, selectedTeamName, isTourStep, isComparisonMode, firstComparisonPlayer }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);

  const isGoalie = player.role === 'Goalie';
  // FIX: Define isHeavyweight and isLightweight based on player attributes to resolve undefined variable errors.
  const isHeavyweight = player.attributes.weight >= 10;
  const isLightweight = player.attributes.weight <= 5;

  const isCompatibleForComparison = useMemo(() => {
    if (!isComparisonMode || !firstComparisonPlayer || firstComparisonPlayer.id === player.id) {
        return true; // Not in selection mode, or it's the selected player, so it's not "incompatible"
    }
    const firstIsGoalie = firstComparisonPlayer.role === 'Goalie';
    const currentIsGoalie = player.role === 'Goalie';
    // Comparison is compatible if both are goalies or both are skaters.
    return firstIsGoalie === currentIsGoalie;
  }, [isComparisonMode, firstComparisonPlayer, player.id, player.role]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStart) {
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(player);
    }
  };

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(onToggleMenu) {
        onToggleMenu();
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
        onRemove();
    }
    if (onCloseMenu) {
        onCloseMenu();
    }
  }

  const handleViewAttributes = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onViewAttributes) {
        onViewAttributes(player);
    }
    if (onCloseMenu) {
        onCloseMenu();
    }
  }

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare(player);
    if (onCloseMenu) {
        onCloseMenu();
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (isComparisonMode && firstComparisonPlayer?.id !== player.id) {
        if (!isCompatibleForComparison) return; // Prevent selection of incompatible player
        e.preventDefault();
        onCompare(player);
    }
  }


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if(onCloseMenu) {
            onCloseMenu();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, onCloseMenu]);

   useEffect(() => {
    if (!cardRef.current) return;

    // Set initial width to avoid a flicker on first render
    setCardWidth(cardRef.current.offsetWidth);

    const resizeObserver = new ResizeObserver(entries => {
      // requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" error
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) {
          return;
        }
        if (entries[0]) {
            setCardWidth(entries[0].contentRect.width);
        }
      });
    });

    resizeObserver.observe(cardRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const backgroundStyle = useMemo(() => {
    const style = {
      backgroundRepeat: 'no-repeat',
    };
    if (selectedTeamName === 'Toronto Maple Leafs') {
      return {
        ...style,
        backgroundImage: `url(${torontoLogoDataUri})`,
        backgroundSize: '160%',
        backgroundPosition: '80% 50%',
        opacity: 0.15,
      };
    } else if (selectedTeamName === 'Chicago Blackhawks') {
      return {
        ...style,
        backgroundImage: `url(${chicagoLogoDataUri})`,
        backgroundSize: '160%',
        backgroundPosition: '80% 50%',
        opacity: 0.15,
      };
    }
    return {
      ...style,
         backgroundImage: `url(${nhlLogoDataUri})`,
      backgroundSize: '80%',
        backgroundPosition: '-60% 50%',
      opacity: 0.1,
    };
  }, [selectedTeamName]);
  
  const isSelectedForComparison = firstComparisonPlayer?.id === player.id;
  const isClickableForComparison = isComparisonMode && !isSelectedForComparison;

  const baseClasses = "rounded-lg pt-1 pb-2 px-2 text-white shadow-lg relative h-[4.5rem] flex w-full transition-all duration-200";
  const draggingClasses = "opacity-80 scale-105 -rotate-2 shadow-2xl z-20 ring-2 ring-sky-400 ring-offset-4 ring-offset-[#212934]";
  const ghostClasses = "opacity-40 border-2 border-dashed border-gray-500 bg-transparent";
  const menuOpenClasses = "z-40";
  const comparisonSelectableClasses = 'cursor-pointer hover:ring-2 hover:ring-green-400';
  const comparisonSelectedClasses = 'ring-2 ring-blue-500 scale-105 shadow-xl';
  const comparisonDisabledClasses = 'opacity-50 cursor-not-allowed';


  return (
    <div
      ref={cardRef}
      draggable={!isGhost && !!onDragStart && !isComparisonMode}
      onDragStart={!isGhost && !isComparisonMode ? handleDragStart : undefined}
      onClick={handleCardClick}
      className={`${baseClasses} 
        ${isGhost ? ghostClasses : isComparisonMode ? '' : 'cursor-grab active:cursor-grabbing hover:scale-[1.03] hover:shadow-xl'}
        ${isDragging ? draggingClasses : ''}
        ${menuOpen ? menuOpenClasses : ''}
        ${isClickableForComparison ? (isCompatibleForComparison ? comparisonSelectableClasses : comparisonDisabledClasses) : ''}
        ${isSelectedForComparison ? comparisonSelectedClasses : 'ring-1 ring-sky-400/50'}
      `}
    >
      {!isGhost && (
        <div className="absolute inset-0 rounded-lg overflow-hidden z-0">
          <div className="absolute inset-0" style={{ backgroundColor: '#2B3544' }}></div>
          <div
            className="absolute inset-0"
            style={backgroundStyle}
          />
        </div>
      )}
      <div className={`relative z-30 w-full flex items-start ${isGhost ? 'opacity-0' : ''}`}>
        
        {/* Jersey Number */}
        <div 
            className="absolute -top-2 -left-1 text-4xl font-black text-white/90 w-14 text-center z-0"
            style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 5px rgba(0,0,0,0.8)' }}
        >
            {player.attributes.jerseynum}
        </div>
        
        {/* Name & Right-side Info */}
        <div className="flex-1 flex justify-between items-start min-w-0 ml-14 -mt-1">
            {/* Last Name */}
            <div 
              className="font-bold text-xl truncate relative"
              title={player.name}
              style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 5px rgba(0,0,0,0.8)' }}
            >
                {getLastName(player.name)}
            </div>

            {/* Other details & menu */}
            <div className="flex items-start space-x-2">
                <div className="flex flex-col items-end text-right text-xs shrink-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <PlayerStatusIcon status={player.statusIcon} />
                        {isHeavyweight && player.statusIcon !== 'anchor' && <AnchorIcon className="w-5 h-5 text-white" title="Heavyweight" />}
                        {isLightweight && <FeatherIcon className="w-5 h-5 text-white" title="Lightweight" />}
                        {onToggleMenu && (
                            <div
                                ref={menuRef}
                                className="relative"
                                id={isTourStep ? 'tour-step-6' : undefined}
                            >
                                <button
                                    onMouseDown={(e) => e.stopPropagation()} // Prevents drag from starting on menu click
                                    onClick={handleToggleMenu}
                                    className={`focus:outline-none rounded-full p-1 transition-colors ${menuOpen ? 'bg-sky-500/50 ring-2 ring-sky-400' : 'hover:bg-white/10 hover:ring-2 hover:ring-sky-400 focus:ring-2 focus:ring-sky-400'}`}
                                    aria-label="Player options menu"
                                    aria-haspopup="true"
                                    aria-expanded={menuOpen}
                                >
                                    <DotsIcon className={`w-5 h-5 ${menuOpen ? 'text-white' : 'text-gray-400'}`} />
                                </button>
                                {menuOpen && (
                                    <div
                                        className="absolute right-0 mt-2 w-40 bg-[#2B3544] rounded-md shadow-lg z-50 border border-white/50"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="options-menu"
                                    >
                                        <div className="py-2" role="none">
                                            {onViewAttributes && (
                                                <button onClick={handleViewAttributes} className="block w-full text-left px-3 py-1 text-xs text-gray-200 hover:bg-[#394559]" role="menuitem">View Attributes</button>
                                            )}
                                            <button onClick={handleCompare} className="block w-full text-left px-3 py-1 text-xs text-gray-200 hover:bg-[#394559]" role="menuitem">
                                                Compare Player
                                            </button>
                                            {onRemove && (
                                                <button onClick={handleRemove} className="block w-full text-left px-3 py-1 text-xs text-gray-200 hover:bg-[#394559]" role="menuitem">
                                                    Remove Player
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {cardWidth > 190 && (
                        <>
                            <div className="text-white">{isGoalie ? 'Glove:' : 'Shoots:'} {player.attributes.handed === 0 ? 'Left' : 'Right'}</div>
                            <div className="text-white">Wt: {player.attributes.weight}/{140 + (8 * player.attributes.weight)}</div>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>
      {!isGhost && (
        <div className="absolute bottom-1 left-0 right-0 z-20 flex justify-start items-center gap-x-4 pl-2 pr-2" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
          {isGoalie ? (
            <>
              <div className="text-center">
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">agl/spd</span>
                <span className="block font-mono text-sm text-white leading-tight">{player.attributes.agility}/{player.attributes.speed}</span>
              </div>
              {cardWidth > 120 && (
                  <div className="text-center">
                    <span className="font-bold text-[10px] text-white uppercase tracking-wider">DFA/PCK</span>
                    <span className="block font-mono text-sm text-white leading-tight">{player.attributes.dawareness}/{player.attributes.shtpower}</span>
                  </div>
              )}
            </>
          ) : (
            <>
              <div className="text-center">
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">agl/spd</span>
                <span className="block font-mono text-sm text-white leading-tight">{player.attributes.agility}/{player.attributes.speed}</span>
              </div>
              {cardWidth > 120 && (
                  <div className="text-center">
                    <span className="font-bold text-[10px] text-white uppercase tracking-wider">shp/sha</span>
                    <span className="block font-mono text-sm text-white leading-tight">{player.attributes.shtpower}/{player.attributes.shtacc}</span>
                  </div>
              )}
              {cardWidth > 170 && (
                  <div className="text-center">
                    <span className="font-bold text-[10px] text-white uppercase tracking-wider">sth/pas</span>
                    <span className="block font-mono text-sm text-white leading-tight">{player.attributes.stickhand}/{player.attributes.passacc}</span>
                  </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};