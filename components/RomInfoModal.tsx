
import React, { useEffect } from 'react';
import type { RomData, TeamInfo } from '../rom-parser';
import type { Player } from '../types';

interface RomInfoModalProps {
  romData: RomData;
  teams: TeamInfo[];
  onClose: () => void;
}

const PlayerListItem: React.FC<{ player: Player }> = ({ player }) => (
    <div className="grid grid-cols-[2rem_1fr_4rem] gap-2 items-center text-xs p-1">
        <span className="font-mono text-gray-500 text-right">{player.attributes.jerseynum}</span>
        <span className="text-gray-200 truncate" title={player.name}>{player.name}</span>
        <span className="text-gray-400">{player.role.substring(0,1)}</span>
    </div>
);

export const RomInfoModal: React.FC<RomInfoModalProps> = ({ romData, teams, onClose }) => {
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
            className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[#212934] border-2 border-sky-500/50 shadow-sky-500/20 shadow-2xl rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundImage: 'radial-gradient(circle at top, rgba(0, 32, 91, 0.4), transparent 60%)',
                }}
            >
                {/* Header */}
                <div className="p-4 border-b-2 border-sky-500/30 flex justify-between items-center shrink-0 bg-black/20">
                    <h2 
                        className="text-xl font-black tracking-wide text-white"
                        style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}
                    >
                        ROM Information
                    </h2>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto">
                   <div className="bg-black/20 p-3 rounded-md mb-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-semibold">Cartridge Name:</span>
                            <span className="text-white font-bold text-sm text-right">{romData.cartridgeName ?? 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-semibold">Number of Teams:</span>
                            <span className="text-white font-bold text-lg">{romData.numberOfTeams ?? 'N/A'}</span>
                        </div>
                   </div>
                   <h3 className="text-lg font-bold text-sky-400 mb-2">Teams Found</h3>
                   <div className="bg-black/20 p-2 rounded-md space-y-1 text-sm max-h-96 overflow-y-auto">
                        {teams.length > 0 ? (
                            <div className="space-y-1">
                                {teams.map((team, index) => (
                                    <details key={index}>
                                        <summary className="cursor-pointer text-gray-200 p-1.5 rounded hover:bg-sky-900/50 transition-colors font-semibold list-none flex justify-between items-center">
                                            <span>{team.city} {team.name} <span className="text-gray-500">({team.abv})</span></span>
                                            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">{team.totalPlayers} Players ({team.numForwards}F, {team.numDefensemen}D, {team.numGoalies}G)</span>
                                        </summary>
                                        <div className="pl-4 pr-2 py-2 border-l-2 border-gray-700 ml-2">
                                            {team.players.length > 0 ? (
                                                team.players.map((player) => (
                                                    <PlayerListItem key={player.id} player={player} />
                                                ))
                                            ) : (
                                                <p className="text-gray-500 italic">No players found for this team.</p>
                                            )}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center p-4">No team data could be parsed.</p>
                        )}
                   </div>
                </div>

                 <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl font-bold bg-black/20 rounded-full w-7 h-7 flex items-center justify-center"
                    aria-label="Close"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};