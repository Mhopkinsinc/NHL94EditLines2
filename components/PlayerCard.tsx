import React, { useEffect, useMemo, useRef } from 'react';
import type { Player } from '../types';
import { AnchorIcon, DotsIcon, FeatherIcon, RookieIcon, WaiversIcon } from './icons';

interface PlayerCardProps {
  player: Player;
  onDragStart?: (player: Player) => void;
  onRemove?: () => void;
  onViewAttributes?: (player: Player) => void;
  isDragging?: boolean;
  isGhost?: boolean;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
  selectedTeamName?: string;
  isTourStep?: boolean;
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


export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onDragStart, onRemove, onViewAttributes, isDragging, isGhost, menuOpen, onToggleMenu, onCloseMenu, selectedTeamName, isTourStep }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isGoalie = player.role === 'Goalie';

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

  const backgroundStyle = useMemo(() => {
    const style = {
      backgroundRepeat: 'no-repeat',
    };
    if (selectedTeamName === 'Toronto Maple Leafs') {
      return {
        ...style,
        backgroundImage: 'url(https://puckgm.puckpedia.com/icons/8-dark.svg)',
        backgroundSize: '160%',
        backgroundPosition: '80% 50%',
        opacity: 0.15,
      };
    } else if (selectedTeamName === 'Chicago Blackhawks') {
      return {
        ...style,
        backgroundImage: 'url(https://puckgm.puckpedia.com/icons/22.svg)',
        backgroundSize: '160%',
        backgroundPosition: '80% 50%',
        opacity: 0.15,
      };
    }
    return {
      ...style,
      backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/NHL_Logo_former.svg/247px-NHL_Logo_former.svg.png?20241024225219)',
      backgroundSize: '90%',
        backgroundPosition: '80% 50%',
      opacity: 0.1,
    };
  }, [selectedTeamName]);
  
  const baseClasses = "rounded-lg pt-1 pb-2 px-2 text-white shadow-lg relative h-[4.5rem] flex w-full transition-all duration-200 ring-1 ring-sky-400/50";
  const draggingClasses = "opacity-80 scale-105 -rotate-2 shadow-2xl z-20 ring-2 ring-sky-400 ring-offset-4 ring-offset-[#212934]";
  const ghostClasses = "opacity-40 border-2 border-dashed border-gray-500 bg-transparent";
  const menuOpenClasses = "z-30";

  const isLightweight = player.attributes.weight <= 5;
  const isHeavyweight = player.attributes.weight >= 10;

  return (
    <div
      draggable={!isGhost && !!onDragStart}
      onDragStart={!isGhost ? handleDragStart : undefined}
      className={`${baseClasses} 
        ${isGhost ? ghostClasses : 'cursor-grab active:cursor-grabbing hover:scale-[1.03] hover:shadow-xl'}
        ${isDragging ? draggingClasses : ''}
        ${menuOpen ? menuOpenClasses : ''}
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
                                {...(isTourStep && {
                                    'data-step': '6',
                                    'data-intro': "Click the menu on a player card to remove the player or view their attributes.",
                                    'data-position': 'right',
                                })}
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
                                            {onRemove && (
                                                <button onClick={handleRemove} className="block w-full text-left px-3 py-1 text-xs text-gray-200 hover:bg-[#394559]" role="menuitem">
                                                    Remove Player
                                                </button>
                                            )}
                                            {onViewAttributes && (
                                                <a href="#" onClick={handleViewAttributes} className="block px-3 py-1 text-xs text-left text-gray-200 hover:bg-[#394559]" role="menuitem">View Attributes</a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="text-white">{isGoalie ? 'Glove:' : 'Shoots:'} {player.attributes.handed === 0 ? 'Left' : 'Right'}</div>
                    <div className="text-white">Wt: {player.attributes.weight}/{140 + (8 * player.attributes.weight)}</div>
                </div>
            </div>
        </div>
      </div>
      {!isGhost && (
        <div className="absolute bottom-1 left-0 right-0 z-20 flex justify-start items-center gap-x-4 pl-2 pr-2" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
          {isGoalie ? (
            <>
              <div className="text-center">
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">GLL/GLR</span>
                <span className="block font-mono text-sm text-white leading-tight">{player.attributes.aggressiveness}/{player.attributes.passacc}</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">STL/STR</span>
                <span className="block font-mono text-sm text-white leading-tight">{player.attributes.roughness}/{player.attributes.endurance}</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">DFA/PCK</span>
                <span className="block font-mono text-sm text-white leading-tight">{player.attributes.dawareness}/{player.attributes.shtpower}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">agl/spd</span>
                <span className="block font-mono text-sm text-white leading-tight">{player.attributes.agility}/{player.attributes.speed}</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">shp/sha</span>
                <span className="block font-mono text-sm text-white leading-tight">{player.attributes.shtpower}/{player.attributes.shtacc}</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">sth/pas</span>
                <span className="block font-mono text-sm text-white leading-tight">{player.attributes.stickhand}/{player.attributes.passacc}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};