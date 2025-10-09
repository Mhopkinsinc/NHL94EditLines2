
import React, { useEffect, useMemo } from 'react';
import type { Player, PositionType } from '../types';
import { PlayerCard } from './PlayerCard';

interface PlayerSelectionModalProps {
  roster: Player[];
  targetPosition: PositionType;
  onSelectPlayer: (player: Player) => void;
  onClose: () => void;
  selectedTeamName: string;
}

const isEligible = (player: Player, position: PositionType): boolean => {
    const forwardPositions: ReadonlyArray<PositionType> = ['LW', 'C', 'RW', 'EX'];
    const defensePositions: ReadonlyArray<PositionType> = ['LD', 'RD'];

    const playerIsForward = player.role === 'Forward';
    const playerIsDefense = player.role === 'Defenseman';
    const playerIsGoalie = player.role === 'Goalie';

    const slotIsForward = forwardPositions.includes(position);
    const slotIsDefense = defensePositions.includes(position);
    const slotIsGoalie = position === 'G';

    if (playerIsForward && slotIsForward) return true;
    if (playerIsDefense && slotIsDefense) return true;
    if (playerIsGoalie && slotIsGoalie) return true;
    
    return false;
};

const getLastName = (name: string): string => {
    const parts = name.split(' ');
    return parts[parts.length - 1];
};

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({ roster, targetPosition, onSelectPlayer, onClose, selectedTeamName }) => {
    const eligiblePlayers = useMemo(() => {
        return roster
            .filter(player => isEligible(player, targetPosition))
            .sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));
    }, [roster, targetPosition]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    
    return (
        <div 
            className="fixed inset-0 bg-black/70 z-40 flex justify-center items-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[#2B3544] rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-white">Select Player for {targetPosition}</h2>
                    <button 
                      onClick={onClose} 
                      className="text-gray-400 hover:text-white text-2xl font-bold"
                      aria-label="Close"
                    >
                        &times;
                    </button>
                </div>
                <div className="overflow-y-auto p-4 space-y-3">
                    {eligiblePlayers.length > 0 ? (
                        eligiblePlayers.map(player => (
                            <div
                                key={player.id}
                                onClick={() => onSelectPlayer(player)}
                                className="cursor-pointer rounded-lg hover:ring-2 hover:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-150"
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => { if (e.key === 'Enter') onSelectPlayer(player); }}
                                aria-label={`Select ${player.name}`}
                            >
                                <PlayerCard player={player} selectedTeamName={selectedTeamName} />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-center py-8">No eligible players in the roster for this position.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
