import React, { useState, useCallback, useRef, useEffect } from 'react';
// FIX: Import `DriveStep` to correctly type the tour steps array, resolving a type incompatibility.
import { driver, type DriveStep } from 'driver.js';
import { INITIAL_LINEUP, NHL_TEAMS_1994 } from './constants';
import type { Lineup, Player, PositionType, HistoryEntry } from './types';
import { PositionSlot } from './components/PositionSlot';
import { Roster } from './components/Roster';
import { PlayerSelectionModal } from './components/PlayerSelectionModal';
import { TeamSelector } from './components/TeamSelector';
import { AttributeCardModal } from './components/AttributeCardModal';
import { parseRomData, RomData, parseAllTeams, TeamInfo, updateRomChecksum } from './rom-parser';
import { EASportsLogo, HistoryIcon, InfoIcon, ResetIcon, SaveIcon, SegaGenesisLogo, UploadIcon, UploadRomIcon } from './components/icons';
import { RomInfoModal } from './components/RomInfoModal';
import { HistoryModal } from './components/HistoryModal';
import { AppInfoModal } from './components/AppInfoModal';
import { PlayerComparisonModal } from './components/PlayerComparisonModal';

type DragSource =
  | { type: 'FORWARD_LINE'; lineIndex: number; position: 'LW' | 'C' | 'RW' | 'EX' }
  | { type: 'DEFENSE_PAIRING'; pairIndex: number; position: 'LD' | 'RD' | 'G' }
  | { type: 'ROSTER'; playerIndex: number };

type DropTarget =
  | { type: 'FORWARD_LINE'; lineIndex: number; position: 'LW' | 'C' | 'RW' | 'EX' }
  | { type: 'DEFENSE_PAIRING'; pairIndex: number; position: 'LD' | 'RD' | 'G' }
  | { type: 'ROSTER' };

const isForward = (player: Player): boolean => {
  return player.role === 'Forward';
};

const isDefense = (player: Player): boolean => {
  return player.role === 'Defenseman';
};

const isGoalie = (player: Player): boolean => {
  return player.role === 'Goalie';
};

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
  onSaveAndReset: () => void;
}

const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({ isOpen, onClose, onConfirmReset, onSaveAndReset }) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[#212934] border-2 border-sky-500/50 shadow-sky-500/20 shadow-2xl rounded-xl w-full max-w-md max-h-[90vh] flex flex-col relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b-2 border-sky-500/30 flex justify-between items-center shrink-0 bg-black/20">
                    <h2 
                        className="text-xl font-black tracking-wide text-white"
                        style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}
                    >
                        Unsaved Changes
                    </h2>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto text-gray-300 space-y-4">
                    <p>
                        You have unsaved changes. Would you like to save them before resetting the application?
                    </p>
                </div>
                
                {/* Footer */}
                <div className="p-3 mt-auto bg-black/20 border-t-2 border-sky-500/30 flex justify-end items-center gap-3">
                    <button 
                        onClick={onClose}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirmReset}
                        className="bg-red-900/80 hover:bg-red-800/80 text-red-200 hover:text-white font-semibold py-2 px-4 rounded-md transition-colors"
                    >
                        Reset Without Saving
                    </button>
                    <button 
                        onClick={onSaveAndReset}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                    >
                        Save & Reset
                    </button>
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


const App: React.FC = () => {
  const [lineup, setLineup] = useState<Lineup>(INITIAL_LINEUP);
  const [draggedItem, setDraggedItem] = useState<{ player: Player; source: DragSource } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectingForSlot, setSelectingForSlot] = useState<{ lineType: 'forward' | 'defense'; index: number; position: PositionType } | null>(null);
  const [showAllLines, setShowAllLines] = useState(false);
  const [viewingAttributesFor, setViewingAttributesFor] = useState<Player | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [romInfo, setRomInfo] = useState<{ data: RomData; teams: TeamInfo[] } | null>(null);
  const [isRomInfoModalOpen, setIsRomInfoModalOpen] = useState(false);
  const [isAppInfoModalOpen, setIsAppInfoModalOpen] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [romBuffer, setRomBuffer] = useState<ArrayBuffer | null>(null);
  const [modifiedLineups, setModifiedLineups] = useState<Record<string, Lineup>>({});
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isTourReady, setIsTourReady] = useState(false);
  const [isConfirmResetModalOpen, setIsConfirmResetModalOpen] = useState(false);
  const [firstPlayerForComparison, setFirstPlayerForComparison] = useState<Player | null>(null);
  const [playersInComparison, setPlayersInComparison] = useState<{ p1: Player; p2: Player } | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const isDirty = Object.keys(modifiedLineups).length > 0;

  const forwardLineLabels = ['NLC', 'L1', 'L2', 'Chk', 'PP1', 'PP2', 'PK1', 'PK2'];
  const defensePairingLabels = ['NLC', 'L1', 'L2', 'Chk', 'PP1', 'PP2', 'PK1', 'PK2'];


  useEffect(() => {
    if (!romInfo || !selectedTeamName) {
        // If no team is selected, ensure lineup is empty.
        if (lineup.roster.length > 0) {
            setLineup(INITIAL_LINEUP);
        }
        return;
    }
    
    // First, check if there's a modified version of the lineup in our state
    if (modifiedLineups[selectedTeamName]) {
        setLineup(modifiedLineups[selectedTeamName]);
        return;
    }

    const selectedTeamData = romInfo.teams.find(t => `${t.city} ${t.name}` === selectedTeamName);

    if (selectedTeamData) {
        const roster = selectedTeamData.players;
        const lineupsData = selectedTeamData.lineups;

        const newForwardLines: Lineup['forwardLines'] = [...INITIAL_LINEUP.forwardLines].map(() => ({ LW: null, C: null, RW: null, EX: null })) as Lineup['forwardLines'];
        const newDefensePairings: Lineup['defensePairings'] = [...INITIAL_LINEUP.defensePairings].map(() => ({ LD: null, RD: null, G: null })) as Lineup['defensePairings'];

        lineupsData.forEach((linePositions, index) => {
            const getPlayer = (romIndex: number, isGoalie: boolean): Player | null => {
                // An index of 255 (0xFF) is typically used for an empty slot.
                if (romIndex === 255) {
                    return null;
                }

                let playerIndex: number;

                if (isGoalie) {
                    // Goalie indices are 0-based in the ROM.
                    playerIndex = romIndex;
                } else {
                    // Skater indices are 1-based in the ROM. An index of 0 also signifies an empty slot.
                    if (romIndex === 0) {
                        return null;
                    }
                    playerIndex = romIndex - 1;
                }

                if (playerIndex >= 0 && playerIndex < roster.length) {
                    return roster[playerIndex];
                }
                return null;
            };

            // Populate forward lines
            newForwardLines[index] = {
                LW: getPlayer(linePositions.LW, false),
                C: getPlayer(linePositions.C, false),
                RW: getPlayer(linePositions.RW, false),
                EX: getPlayer(linePositions.EX, false),
            };

            // Populate defense pairings
            newDefensePairings[index] = {
                LD: getPlayer(linePositions.LD, false),
                RD: getPlayer(linePositions.RD, false),
                G: getPlayer(linePositions.G, true),
            };
        });

        setLineup({
            forwardLines: newForwardLines,
            defensePairings: newDefensePairings,
            roster: roster,
        });
    }
  }, [selectedTeamName, romInfo, modifiedLineups]);

  useEffect(() => {
    // A small timeout ensures that all components have rendered with data before starting the tour.
    if (isTourReady && romInfo && lineup.roster.length > 0) {
        setTimeout(() => {
            // FIX: Explicitly type `tourSteps` as `DriveStep[]` to fix the type error.
            // This ensures the object shape matches what `driver.js` expects, particularly for `popover.side`.
            const tourSteps: DriveStep[] = [
                { 
                    element: '#tour-step-1', 
                    popover: { 
                        title: 'Select a Team', 
                        description: "Welcome! Start by selecting a team from this dropdown to view and edit their lineup." 
                    } 
                },
                { 
                    element: '#tour-step-2', 
                    popover: { 
                        title: 'Save Your Work', 
                        description: "When you're finished, click 'Save ROM' to download a new file with all your changes." 
                    } 
                },
                { 
                    element: '#tour-step-4', 
                    popover: { 
                        title: 'View ROM Info', 
                        description: 'Click this icon to view detailed information about the loaded ROM, including all teams and players found.' 
                    } 
                },
                { 
                    element: '#tour-step-3', 
                    popover: { 
                        title: 'Track Changes', 
                        description: 'Every change you make is tracked. Click this icon to view your edit history and undo any actions.' 
                    } 
                },
                { 
                    element: '#tour-step-5', 
                    popover: { 
                        title: 'The Lineup Grid', 
                        description: 'This is the lineup grid. Active players are shown in their assigned positions.' 
                    } 
                },
                { 
                    element: '#tour-step-6', 
                    popover: { 
                        title: 'Player Options', 
                        description: "Click the menu on a player card to remove the player or view their attributes.",
                        side: "right",
                        align: 'start'
                    },
                    onHighlightStarted: (element) => {
                        const button = element?.querySelector('button');
                        if (button) {
                            // Add classes that mimic the hover state
                            button.classList.add('bg-white/10', 'ring-2', 'ring-sky-400');
                        }
                    },
                    onDeselected: (element) => {
                        const button = element?.querySelector('button');
                        if (button) {
                            // Remove the hover-mimicking classes when the step is done
                            button.classList.remove('bg-white/10', 'ring-2', 'ring-sky-400');
                        }
                    }
                },
                { 
                    element: '#tour-step-7', 
                    popover: { 
                        title: 'The Roster', 
                        description: 'This is the full roster, organized by position. Drag a player from here and drop them into an empty slot on the lineup grid.',
                        side: "top",
                        align: 'start'
                    } 
                }
            ];

            const availableSteps = tourSteps.filter(step => step.element && document.querySelector(step.element as string));

            if (availableSteps.length > 0) {
                 const driverObj = driver({
                    showProgress: true,
                    onDestroyed: () => {
                        localStorage.setItem('nhl94-tour-shown', 'true');
                    },
                    steps: availableSteps,
                });
                driverObj.drive();
            } else {
                localStorage.setItem('nhl94-tour-shown', 'true');
            }
        }, 500);
        setIsTourReady(false); // Reset the trigger
    }
  }, [isTourReady, romInfo, lineup]);


  const handleToggleMenu = useCallback((menuId: string) => {
    setOpenMenuId(prevId => (prevId === menuId ? null : menuId));
  }, []);

  const handleCloseMenus = useCallback(() => {
    setOpenMenuId(null);
  }, []);

  const handleOpenPlayerSelection = useCallback((lineType: 'forward' | 'defense', index: number, position: PositionType) => {
    setSelectingForSlot({ lineType, index, position });
  }, []);

  const handleClosePlayerSelection = useCallback(() => {
    setSelectingForSlot(null);
  }, []);
  
  const handleOpenAttributeModal = useCallback((player: Player) => {
    setViewingAttributesFor(player);
  }, []);

  const handleCloseAttributeModal = useCallback(() => {
    setViewingAttributesFor(null);
  }, []);

  const handleOpenRomInfoModal = useCallback(() => {
    setIsRomInfoModalOpen(true);
  }, []);

  const handleCloseRomInfoModal = useCallback(() => {
    setIsRomInfoModalOpen(false);
  }, []);

  const handleOpenAppInfoModal = useCallback(() => {
    setIsAppInfoModalOpen(true);
  }, []);

  const handleCloseAppInfoModal = useCallback(() => {
      setIsAppInfoModalOpen(false);
  }, []);
  
  const handleOpenHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(true);
  }, []);

  const handleCloseHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(false);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const processRomFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (arrayBuffer) {
        setRomBuffer(arrayBuffer);
        setModifiedLineups({}); // Reset changes on new ROM
        setHistoryLog([]); // Reset history on new ROM
        const parsedData = parseRomData(arrayBuffer);
        if (parsedData) {
            const teams = parseAllTeams(parsedData, arrayBuffer);
            const teamNames = teams.map(t => `${t.city} ${t.name}`);
            setAvailableTeams(teamNames);
            if(teamNames.length > 0) {
                setSelectedTeamName(teamNames[0]);
            }
            setRomInfo({ data: parsedData, teams });
            console.log('Parsed Team Data:', teams);

            const tourShown = localStorage.getItem('nhl94-tour-shown');
            if (!tourShown) {
                setIsTourReady(true);
            }
        } else {
            setRomInfo(null);
            setAvailableTeams([]);
            setSelectedTeamName('');
            setLineup(INITIAL_LINEUP);
            setRomBuffer(null);
            alert(`Failed to parse ROM data from "${file.name}".`);
        }
      } else {
        alert(`Failed to read file "${file.name}".`);
      }
    };
    reader.onerror = () => {
      alert(`Error reading file "${file.name}".`);
    };
    reader.readAsArrayBuffer(file);
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processRomFile(file);
    }
    // Reset the input value to allow uploading the same file again
    event.target.value = ''; 
  };
  
  const handleTeamChange = (teamName: string) => {
    setSelectedTeamName(teamName);
  };
  
  const applyChange = (updater: (lineup: Lineup) => Lineup, description: string) => {
    if (!selectedTeamName) return;

    // This function is structured to be compatible with React's StrictMode.
    // State updates are separated to avoid side-effects within a single state setter,
    // which prevents issues like duplicate history entries in development mode.

    // 1. Calculate the new lineup based on the current state.
    const newLineup = updater(lineup);

    // 2. Create a history entry using the state *before* the update.
    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      teamName: selectedTeamName,
      description,
      previousLineup: lineup, // This is the snapshot of the state before the change.
    };

    // 3. Call all state setters separately. React will batch these updates.
    setHistoryLog(prevLog => [newEntry, ...prevLog]);
    setModifiedLineups(prevModified => ({
      ...prevModified,
      [selectedTeamName]: newLineup,
    }));
    setLineup(newLineup);
  };

  const handleSaveChanges = useCallback((options?: { silent?: boolean }) => {
    if (!romBuffer || !romInfo || !isDirty) return;

    const newRomBuffer = romBuffer.slice(0);
    const romView = new DataView(newRomBuffer);

    for (const teamName in modifiedLineups) {
        const currentLineup = modifiedLineups[teamName];

        const selectedTeamData = romInfo.teams.find(t => `${t.city} ${t.name}` === teamName);
        if (!selectedTeamData) {
            alert(`Error: Could not find data for the modified team: ${teamName}. Skipping.`);
            continue;
        }

        const { teamPointer, players: roster } = selectedTeamData;

        const getPlayerRomIndex = (player: Player | null, role: 'skater' | 'goalie'): number => {
            if (!player) {
                return role === 'skater' ? 0 : 255;
            }
            const rosterIndex = roster.findIndex(p => p.id === player.id);
            if (rosterIndex === -1) {
                console.error("Critical Error: Player from lineup not found in team roster:", player);
                return role === 'skater' ? 0 : 255; // Fail safely
            }
            return role === 'skater' ? rosterIndex + 1 : rosterIndex;
        };

        const linesOffset = teamPointer + 0x52;
        for (let i = 0; i < 8; i++) {
            const lineOffset = linesOffset + (i * 8);
            const fwdLine = currentLineup.forwardLines[i];
            const defPair = currentLineup.defensePairings[i];

            // ROM Lineup Data Order: LD, RD, LW, C, RW, EX, G
            const lineBytes = [
                getPlayerRomIndex(defPair.LD, 'skater'),
                getPlayerRomIndex(defPair.RD, 'skater'),
                getPlayerRomIndex(fwdLine.LW, 'skater'),
                getPlayerRomIndex(fwdLine.C, 'skater'),
                getPlayerRomIndex(fwdLine.RW, 'skater'),
                getPlayerRomIndex(fwdLine.EX, 'skater'),
                getPlayerRomIndex(defPair.G, 'goalie'),
            ];
            
            // Byte 0 of each line is always 0x01 and is not changed. We write the 7 player indices.
            for (let j = 0; j < lineBytes.length; j++) {
                romView.setUint8(lineOffset + 1 + j, lineBytes[j]);
            }
        }
    }
    
    // Apply the requested NOP patch at offset 0x300.
    const patchOffset = 0x300;
    const patchBytes = [0x4E, 0x71, 0x4E, 0x71, 0x4E, 0x71];
    if (romView.byteLength >= patchOffset + patchBytes.length) {
        patchBytes.forEach((byte, index) => {
            romView.setUint8(patchOffset + index, byte);
        });
    }

    // After all modifications, update the checksum before creating the blob.
    updateRomChecksum(newRomBuffer);

    const blob = new Blob([newRomBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NHL94-edited.bin';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (options?.silent) {
        // Just clear the dirty state without alerts or re-parsing.
        // Used when saving and then immediately resetting the app.
        setModifiedLineups({});
        return;
    }

    // Update the app's state to use the newly saved ROM as the baseline
    setRomBuffer(newRomBuffer);
    const parsedData = parseRomData(newRomBuffer);
    if (parsedData) {
        const teams = parseAllTeams(parsedData, newRomBuffer);
        setRomInfo({ data: parsedData, teams });
    } else {
        // This should not happen if the original ROM was valid
        console.error("Failed to re-parse the saved ROM. State may be inconsistent.");
    }
    
    setModifiedLineups({});
    alert('ROM saved successfully with all team changes!');

  }, [romBuffer, romInfo, isDirty, modifiedLineups]);

  const handlePlayerSelection = useCallback((player: Player) => {
    if (!selectingForSlot) return;

    const { lineType, index, position } = selectingForSlot;

    const lineLabel = lineType === 'forward' ? forwardLineLabels[index] : defensePairingLabels[index];
    const description = `Added ${player.name} to ${lineLabel} ${position}.`;

    applyChange(prevLineup => {
      const newLineup: Lineup = JSON.parse(JSON.stringify(prevLineup));

      if (lineType === 'forward') {
        newLineup.forwardLines[index][position as 'LW' | 'C' | 'RW' | 'EX'] = player;
      } else { // defense
        newLineup.defensePairings[index][position as 'LD' | 'RD' | 'G'] = player;
      }
      return newLineup;
    }, description);
    
    handleClosePlayerSelection();
  }, [selectingForSlot, handleClosePlayerSelection, selectedTeamName, lineup]);

  const handleDragStart = useCallback((player: Player, source: DragSource) => {
    if (firstPlayerForComparison) return; // Prevent dragging in comparison mode.
    setDraggedItem({ player, source });
    handleCloseMenus();
  }, [handleCloseMenus, firstPlayerForComparison]);
  
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleDrop = useCallback((target: DropTarget) => {
    if (!draggedItem) return;

    const { player, source } = draggedItem;

    // Find player at target location (if any) to handle all drop logic.
    let existingPlayer: Player | null = null;
    if (target.type === 'FORWARD_LINE') {
        existingPlayer = lineup.forwardLines[target.lineIndex][target.position];
    } else if (target.type === 'DEFENSE_PAIRING') {
        existingPlayer = lineup.defensePairings[target.pairIndex][target.position];
    }

    // If dropping a player onto themselves (i.e., back to their original spot),
    // it's not a change. Abort the operation to prevent unnecessary history logs and state updates.
    if (existingPlayer && existingPlayer.id === player.id) {
        setDraggedItem(null);
        return;
    }

    // If dragging from roster to roster, it's a no-op and should not be recorded.
    if (source.type === 'ROSTER' && target.type === 'ROSTER') {
      setDraggedItem(null);
      return;
    }

    // Rule validation
    if (target.type === 'FORWARD_LINE' && !isForward(player)) {
        setDraggedItem(null);
        return;
    }
    if (target.type === 'DEFENSE_PAIRING') {
      if (target.position === 'G') {
        if (!isGoalie(player)) {
          setDraggedItem(null);
          return;
        }
      } else { // LD or RD
        if (!isDefense(player)) {
          setDraggedItem(null);
          return;
        }
      }
    }
    
    // History Logging Logic
    const getSlotDescription = (loc: DragSource | DropTarget): string => {
        if (loc.type === 'ROSTER') return 'Roster';
        if (loc.type === 'FORWARD_LINE') {
            return `${forwardLineLabels[loc.lineIndex]} ${loc.position}`;
        }
        if (loc.type === 'DEFENSE_PAIRING') {
            return `${defensePairingLabels[loc.pairIndex]} ${loc.position}`;
        }
        return 'Unknown';
    };

    const sourceDesc = getSlotDescription(source);
    const targetDesc = getSlotDescription(target);

    let description: string;
    if (source.type !== 'ROSTER' && existingPlayer) {
        description = `Swapped ${player.name} (${sourceDesc}) with ${existingPlayer.name} (${targetDesc}).`;
    } else if (source.type === 'ROSTER' && existingPlayer) {
         description = `Moved ${player.name} from Roster to ${targetDesc}, replacing ${existingPlayer.name}.`;
    } else {
        description = `Moved ${player.name} from ${sourceDesc} to ${targetDesc}.`;
    }

    applyChange(prevLineup => {
      const newLineup: Lineup = JSON.parse(JSON.stringify(prevLineup));

      const playerToMove: Player = player;

      // Find player at target location (if any)
      let existingPlayerInUpdate: Player | null = null;
      if (target.type === 'FORWARD_LINE') {
        existingPlayerInUpdate = newLineup.forwardLines[target.lineIndex][target.position];
      } else if (target.type === 'DEFENSE_PAIRING') {
        existingPlayerInUpdate = newLineup.defensePairings[target.pairIndex][target.position];
      }

      // Handle source: remove player from original position IF it's a line/pairing
      if (source.type === 'FORWARD_LINE') {
        newLineup.forwardLines[source.lineIndex][source.position] = null;
      } else if (source.type === 'DEFENSE_PAIRING') {
        newLineup.defensePairings[source.pairIndex][source.position] = null;
      }
      // NOTE: No 'else' block for source.type === 'ROSTER'. We don't remove from roster.

      // Handle target: place player in new position
      if (target.type === 'FORWARD_LINE') {
        newLineup.forwardLines[target.lineIndex][target.position] = playerToMove;
      } else if (target.type === 'DEFENSE_PAIRING') {
        newLineup.defensePairings[target.pairIndex][target.position] = playerToMove;
      }
      // NOTE: No 'else' block for target.type === 'ROSTER', as we don't add players to it.
      // Dragging to roster is just for removal from a line, which is handled by clearing the source slot.

      // If a player was in the target slot, and we are dragging from another slot (not roster), 
      // move the existing player to the source slot (swap).
      if (existingPlayerInUpdate && source.type !== 'ROSTER') {
        if (source.type === 'FORWARD_LINE') {
          newLineup.forwardLines[source.lineIndex][source.position] = existingPlayerInUpdate;
        } else if (source.type === 'DEFENSE_PAIRING') {
          newLineup.defensePairings[source.pairIndex][source.position] = existingPlayerInUpdate;
        }
      }
      // If dragging from roster, the existingPlayer is just overwritten and removed from the board.

      // Roster state is not modified during drag-drop, so we ensure it's preserved from the previous state.
      newLineup.roster = prevLineup.roster;

      return newLineup;
    }, description);

    setDraggedItem(null);
  }, [draggedItem, lineup, selectedTeamName]);

  const handleRemovePlayer = useCallback((lineType: 'forward' | 'defense', index: number, position: PositionType) => {
    const lineLabel = lineType === 'forward' ? forwardLineLabels[index] : defensePairingLabels[index];
    
    let playerToRemove: Player | null = null;
    if (lineType === 'forward') {
        playerToRemove = lineup.forwardLines[index][position as 'LW'|'C'|'RW'|'EX'];
    } else {
        playerToRemove = lineup.defensePairings[index][position as 'LD'|'RD'|'G'];
    }
    
    if (playerToRemove) {
        const description = `Removed ${playerToRemove.name} from ${lineLabel} ${position}.`;
        applyChange(prevLineup => {
          const newLineup: Lineup = JSON.parse(JSON.stringify(prevLineup));

          if (lineType === 'forward') {
            newLineup.forwardLines[index][position as 'LW' | 'C' | 'RW' | 'EX'] = null;
          } else {
            newLineup.defensePairings[index][position as 'LD' | 'RD' | 'G'] = null;
          }

          return newLineup;
        }, description);
    }
  }, [lineup, selectedTeamName]);
  
  const handleUndo = useCallback((entryToUndoId: string) => {
    const entryToUndo = historyLog.find(e => e.id === entryToUndoId);
    if (!entryToUndo) return;

    const { teamName, previousLineup, timestamp } = entryToUndo;

    // Filter out the undone entry and any subsequent entries for that specific team.
    // This creates the new, correct history state.
    const newHistory = historyLog.filter(entry => {
        if (entry.id === entryToUndoId) return false;
        if (entry.teamName === teamName && entry.timestamp > timestamp) return false;
        return true;
    });

    const remainingTeamChanges = newHistory.filter(e => e.teamName === teamName);

    if (remainingTeamChanges.length === 0) {
        // If no changes are left for the team, it's no longer "dirty".
        // Remove it from the modified lineups map.
        setModifiedLineups(prev => {
            const newModified = { ...prev };
            delete newModified[teamName];
            return newModified;
        });
    } else {
        // If changes remain, update the modified lineup to the state before the undone action.
        setModifiedLineups(prev => ({ ...prev, [teamName]: previousLineup }));
    }
    
    // Update the currently displayed lineup to reflect the undone state immediately.
    if (teamName === selectedTeamName) {
        setLineup(previousLineup);
    }

    // Commit the new history log.
    setHistoryLog(newHistory);
  }, [historyLog, selectedTeamName]);

  const performReset = useCallback(() => {
    setRomInfo(null);
    setRomBuffer(null);
    setAvailableTeams([]);
    setSelectedTeamName('');
    setLineup(INITIAL_LINEUP);
    setModifiedLineups({});
    setHistoryLog([]);
    setShowAllLines(false);
    setOpenMenuId(null);
    setFirstPlayerForComparison(null);
    setPlayersInComparison(null);
    setComparisonError(null);
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, []);

  const handleResetApp = useCallback(() => {
    if (isDirty) {
        setIsConfirmResetModalOpen(true);
    } else {
        performReset();
    }
  }, [isDirty, performReset]);

  const handleConfirmSaveAndReset = useCallback(() => {
    handleSaveChanges({ silent: true });
    performReset();
    setIsConfirmResetModalOpen(false);
  }, [handleSaveChanges, performReset]);

  const handleConfirmResetWithoutSaving = useCallback(() => {
    performReset();
    setIsConfirmResetModalOpen(false);
  }, [performReset]);

  const handleComparisonSelect = useCallback((player: Player) => {
    if (comparisonError) setComparisonError(null); // Clear previous error on any new attempt

    if (firstPlayerForComparison) {
        // This is the second player.
        // Don't compare a player with themselves.
        if (firstPlayerForComparison.id === player.id) {
            return;
        }

        const firstIsGoalie = firstPlayerForComparison.role === 'Goalie';
        const secondIsGoalie = player.role === 'Goalie';

        // Prevent comparison between a skater and a goalie.
        if (firstIsGoalie !== secondIsGoalie) {
            setComparisonError('Cannot compare a skater with a goalie.');
            setTimeout(() => setComparisonError(null), 3000); // Auto-clear after 3s
            return;
        }
        
        setPlayersInComparison({ p1: firstPlayerForComparison, p2: player });
        setFirstPlayerForComparison(null); // Exit comparison mode
        setComparisonError(null);
    } else {
        // This is the first player.
        setFirstPlayerForComparison(player);
        setComparisonError(null); // Clear any lingering error
    }
  }, [firstPlayerForComparison, comparisonError]);

  const handleCancelComparison = useCallback(() => {
      setFirstPlayerForComparison(null);
      setComparisonError(null);
  }, []);

  const handleCloseComparisonModal = useCallback(() => {
      setPlayersInComparison(null);
  }, []);

  const getIsDragSource = (type: 'FORWARD_LINE' | 'DEFENSE_PAIRING' | 'ROSTER', index?: number, position?: PositionType): boolean => {
    if (!draggedItem) return false;
    const { source } = draggedItem;
    if (source.type === 'FORWARD_LINE' && type === 'FORWARD_LINE') {
        return source.lineIndex === index && source.position === position;
    }
    if (source.type === 'DEFENSE_PAIRING' && type === 'DEFENSE_PAIRING') {
      return source.pairIndex === index && source.position === position;
    }
    if(source.type === 'ROSTER' && type === 'ROSTER'){
      return false;
    }
    return false;
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // This check is important to prevent flickering when dragging over child elements.
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
    }
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow dropping
  };

  const handleDropOnWelcome = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const acceptedTypes = ['.bin', '.md', '.gen'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (acceptedTypes.includes(fileExtension)) {
          processRomFile(file);
      } else {
          alert('Invalid file type. Please upload a .bin, .md, or .gen file.');
      }
      e.dataTransfer.clearData();
    }
  };

  const forwardPositions: ('LW' | 'C' | 'RW' | 'EX')[] = ['LW', 'C', 'RW', 'EX'];
  const defensePositions: ('LD' | 'RD' | 'G')[] = ['LD', 'RD', 'G'];
  const isComparisonMode = !!firstPlayerForComparison;

  return (
    <div className="min-h-screen text-white font-sans" onDragEnd={handleDragEnd}>
        <header className="bg-[#1A222C] py-2 px-4 md:px-8 flex justify-between items-center shadow-lg border-b border-black/30">
            <div className="text-lg font-bold tracking-wider text-gray-300">
                94' Line Editor & Attribute Viewer
            </div>
            <div className="flex items-center gap-4">
                <SegaGenesisLogo aria-label="Sega Genesis Logo" className="h-6 text-white" />                
                <button 
                    onClick={handleOpenAppInfoModal}
                    className="bg-gray-700/50 hover:bg-gray-600/50 p-1.5 rounded-full transition-colors"
                    aria-label="Show App Information"
                    title="About this application"
                >
                    <InfoIcon className="w-5 h-5 text-white" />
                </button>
            </div>
        </header>

      <div className="p-4 md:p-8">
        <main className="max-w-7xl mx-auto">
          <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_1fr_1fr_1fr] gap-x-2 gap-y-2 items-center">
            {/* Controls Row */}
            <div className="flex justify-center items-center h-full font-bold text-gray-400 text-lg">
              Team
            </div>
            
            <div id="tour-step-1">
              <TeamSelector 
                teams={availableTeams} 
                selectedTeamName={selectedTeamName} 
                onTeamChange={handleTeamChange}
                disabled={!romInfo}
              />
            </div>

            <div className="col-span-2 md:col-span-3 md:col-start-3 flex items-center justify-end gap-6">
              <div className="flex items-center">
                  <label htmlFor="all-lines-toggle" className="mr-3 text-sm font-medium text-gray-300 select-none">Show 'All' Lines</label>
                  <input
                      id="all-lines-toggle"
                      type="checkbox"
                      checked={showAllLines}
                      onChange={() => setShowAllLines(!showAllLines)}
                      className="w-4 h-4 text-sky-500 bg-gray-700 border-gray-600 rounded focus:ring-sky-600 ring-offset-gray-800 focus:ring-2 cursor-pointer disabled:opacity-50"
                      disabled={!romInfo}
                  />
              </div>

              <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".bin,.md,.gen"
                    aria-hidden="true"
                />
                <button
                    id="tour-step-2"
                    onClick={() => handleSaveChanges()}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-1 px-3 text-sm rounded-md transition-colors flex items-center gap-1.5"
                    disabled={!isDirty}
                    title={isDirty ? "Save all changes to a new ROM file" : "No changes to save"}
                >
                    <SaveIcon className="w-4 h-4" />
                    Save ROM
                </button>
                {romInfo && (
                    <>
                        <button
                            id="tour-step-4"
                            onClick={handleOpenRomInfoModal}
                            className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md transition-colors"
                            aria-label="Show ROM Information"
                            title="Click this icon to view detailed information about the loaded ROM"
                        >
                            <EASportsLogo className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 border-l border-gray-600 pl-2">
                             <button
                                id="tour-step-3"
                                onClick={handleOpenHistoryModal}
                                className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                                aria-label="Show Change History"
                                disabled={historyLog.length === 0}
                                title={historyLog.length > 0 ? "Show change history" : "No changes made yet"}
                            >
                                <HistoryIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleResetApp}
                                className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md transition-colors"
                                aria-label="Unload ROM and start over"
                                title="Unload ROM and start over"
                            >
                                <ResetIcon className="w-5 h-5 text-red-500" />
                            </button>
                        </div>
                    </>
                )}
              </div>
            </div>
            
            <div className="col-span-full h-2" />
          </div>
          
          {!romInfo ? (
              <div 
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnWelcome}
                  className={`relative text-center py-20 bg-[#2B3544] rounded-lg mt-4 transition-all duration-300 border-4 ${isDraggingOver ? 'border-dashed border-sky-400 scale-105 bg-sky-900/50' : 'border-transparent'}`}
              >
                  <div className={`transition-opacity duration-300 ${isDraggingOver ? 'opacity-0' : 'opacity-100'} flex flex-col items-center px-4`}>
                      <h1 className="text-5xl font-extrabold text-sky-300 mb-4" style={{textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 10px rgba(125, 211, 252, 0.3)'}}> NHL 94 Line Editor </h1>
                      <UploadRomIcon className="w-16 h-16 text-gray-500 mb-4" />
                      <h2 className="text-3xl font-bold mb-2">Upload your ROM file</h2>
                      <p className="text-gray-400 mb-6">
                          Drag & drop a 
                          <code className="bg-[#394559] text-gray-300 rounded px-1.5 py-0.5 mx-1 font-mono text-sm not-italic">.bin</code>, 
                          <code className="bg-[#394559] text-gray-300 rounded px-1.5 py-0.5 mx-1 font-mono text-sm not-italic">.md</code>, or 
                          <code className="bg-[#394559] text-gray-300 rounded px-1.5 py-0.5 mx-1 font-mono text-sm not-italic">.gen</code> file here
                      </p>
                      <p className="text-gray-500 mb-4">or</p>
                      <button
                          onClick={handleUploadClick}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
                      >
                          Browse Files
                      </button>
                  </div>
                   <div className={`absolute inset-0 flex flex-col justify-center items-center transition-opacity duration-300 ${isDraggingOver ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!isDraggingOver}>
                      <UploadIcon className="w-16 h-16 text-sky-400 mb-4" />
                      <p className="text-2xl font-bold text-sky-300">Drop ROM file to begin!</p>
                  </div>
              </div>
          ) : lineup.roster.length === 0 ? (
               <div className="text-center py-20 bg-[#2B3544] rounded-lg mt-4">
                  <h2 className="text-2xl font-bold mb-4">No Team Selected</h2>
                  <p className="text-gray-400">Select a team from the dropdown to view and edit their lineup.</p>
              </div>
          ) : (
            <>
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-x-2 gap-y-2 items-center" id="tour-step-5">
                {/* Forwards Headers */}
                <div />
                <h5 className="font-semibold text-center text-gray-300 text-sm">Left Wing</h5>
                <h5 className="font-semibold text-center text-gray-300 text-sm">Center</h5>
                <h5 className="font-semibold text-center text-gray-300 text-sm">Right Wing</h5>
                <h5 className="font-semibold text-center text-gray-300 text-sm">Extra Attacker</h5>

                {/* Forward Lines */}
                {lineup.forwardLines.map((forwardLine, lineIndex) => {
                  if (!showAllLines && forwardLineLabels[lineIndex] !== 'NLC') {
                      return null;
                  }
                  return (
                      <React.Fragment key={`fwd-line-${lineIndex}`}>
                        <div className="flex justify-center items-center h-full font-bold text-gray-400 text-lg">
                          {forwardLineLabels[lineIndex]}
                        </div>
                        {forwardPositions.map((position) => {
                          const menuId = `fwd-${lineIndex}-${position}`;
                          const isTourStepTarget = lineIndex === 0 && position === 'LW';
                          return (
                            <PositionSlot
                              key={`${lineIndex}-${position}`}
                              index={lineIndex}
                              positionType={position}
                              player={forwardLine[position]}
                              onDragStart={(player, idx, pos) => handleDragStart(player, { type: 'FORWARD_LINE', lineIndex: idx, position: pos as 'LW'|'C'|'RW'|'EX' })}
                              onDrop={(idx, pos) => handleDrop({ type: 'FORWARD_LINE', lineIndex: idx, position: pos as 'LW'|'C'|'RW'|'EX' })}
                              onRemove={(idx, pos) => handleRemovePlayer('forward', idx, pos)}
                              onEmptyClick={() => handleOpenPlayerSelection('forward', lineIndex, position)}
                              onViewAttributes={handleOpenAttributeModal}
                              onCompare={handleComparisonSelect}
                              isDragSource={getIsDragSource('FORWARD_LINE', lineIndex, position)}
                              draggedPlayer={draggedItem?.player}
                              menuId={menuId}
                              isMenuOpen={openMenuId === menuId}
                              onToggleMenu={handleToggleMenu}
                              onCloseMenu={handleCloseMenus}
                              selectedTeamName={selectedTeamName}
                              isTourStep={isTourStepTarget && !!forwardLine[position]}
                              isComparisonMode={isComparisonMode}
                              firstComparisonPlayer={firstPlayerForComparison}
                            />
                          );
                        })}
                      </React.Fragment>
                  )
                })}
                
                {/* Spacer */}
                <div className="h-4 col-span-5" />

                {/* Defense Headers */}
                <div />
                <h5 className="font-semibold text-center text-gray-300 text-sm">Left Defense</h5>
                <h5 className="font-semibold text-center text-gray-300 text-sm">Right Defense</h5>
                <h5 className="font-semibold text-center text-gray-300 text-sm">Goalie</h5>
                <div />

                {/* Defense Pairings */}
                {lineup.defensePairings.map((defensePair, pairIndex) => {
                   if (!showAllLines && defensePairingLabels[pairIndex] !== 'NLC') {
                      return null;
                  }
                  return (
                      <React.Fragment key={`def-pair-${pairIndex}`}>
                          <div className="flex justify-center items-center h-full font-bold text-gray-400 text-lg">
                          {defensePairingLabels[pairIndex]}
                          </div>
                          {defensePositions.map((position) => {
                            const menuId = `def-${pairIndex}-${position}`;
                            return (
                              <PositionSlot
                                  key={`${pairIndex}-${position}`}
                                  index={pairIndex}
                                  positionType={position}
                                  player={defensePair[position]}
                                  onDragStart={(player, idx, pos) => handleDragStart(player, { type: 'DEFENSE_PAIRING', pairIndex: idx, position: pos as 'LD'|'RD'|'G' })}
                                  onDrop={(idx, pos) => handleDrop({ type: 'DEFENSE_PAIRING', pairIndex: idx, position: pos as 'LD'|'RD'|'G' })}
                                  onRemove={(idx, pos) => handleRemovePlayer('defense', pairIndex, pos)}
                                  onEmptyClick={() => handleOpenPlayerSelection('defense', pairIndex, position)}
                                  onViewAttributes={handleOpenAttributeModal}
                                  onCompare={handleComparisonSelect}
                                  isDragSource={getIsDragSource('DEFENSE_PAIRING', pairIndex, position)}
                                  draggedPlayer={draggedItem?.player}
                                  menuId={menuId}
                                  isMenuOpen={openMenuId === menuId}
                                  onToggleMenu={handleToggleMenu}
                                  onCloseMenu={handleCloseMenus}
                                  selectedTeamName={selectedTeamName}
                                  isComparisonMode={isComparisonMode}
                                  firstComparisonPlayer={firstPlayerForComparison}
                              />
                            );
                          })}
                          <div />
                      </React.Fragment>
                  )
                })}
              </div>

              <div>
                  <Roster 
                    players={lineup.roster}
                    onDragStart={(p, pIdx) => handleDragStart(p, { type: 'ROSTER', playerIndex: pIdx })}
                    onDrop={() => handleDrop({ type: 'ROSTER' })}
                    onViewAttributes={handleOpenAttributeModal}
                    onCompare={handleComparisonSelect}
                    isDragSource={getIsDragSource('ROSTER')}
                    draggedPlayer={draggedItem?.player}
                    openMenuId={openMenuId}
                    onToggleMenu={handleToggleMenu}
                    onCloseMenu={handleCloseMenus}
                    selectedTeamName={selectedTeamName}
                    isComparisonMode={isComparisonMode}
                    firstComparisonPlayer={firstPlayerForComparison}
                  />
              </div>
            </>
          )}
        </main>
      </div>
      {firstPlayerForComparison && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 ${comparisonError ? 'bg-red-600' : 'bg-sky-600'} text-white py-2 px-6 rounded-lg shadow-2xl z-50 flex items-center gap-4 transition-all`}>
            <p>
                {comparisonError 
                    ? <strong>{comparisonError}</strong>
                    : <>Select another player to compare with <strong>{firstPlayerForComparison.name}</strong></>
                }
            </p>
            <button 
                onClick={handleCancelComparison} 
                className={`${comparisonError ? 'bg-red-800 hover:bg-red-700' : 'bg-sky-800 hover:bg-sky-700'} text-sm font-semibold py-1 px-3 rounded-md transition-colors`}
                aria-label="Cancel comparison"
            >
                Cancel
            </button>
        </div>
      )}
      {selectingForSlot && (
        <PlayerSelectionModal
            roster={lineup.roster}
            targetPosition={selectingForSlot.position}
            onSelectPlayer={handlePlayerSelection}
            onClose={handleClosePlayerSelection}
            selectedTeamName={selectedTeamName}
        />
      )}
      {viewingAttributesFor && (
        <AttributeCardModal 
          player={viewingAttributesFor}
          onClose={handleCloseAttributeModal}
          selectedTeamName={selectedTeamName}
        />
      )}
      {playersInComparison && (
        <PlayerComparisonModal 
            players={playersInComparison}
            onClose={handleCloseComparisonModal}
        />
      )}
      {isRomInfoModalOpen && romInfo && (
        <RomInfoModal
            romData={romInfo.data}
            teams={romInfo.teams}
            onClose={handleCloseRomInfoModal}
        />
      )}
      {isHistoryModalOpen && (
        <HistoryModal
            history={historyLog}
            onClose={handleCloseHistoryModal}
            onUndo={handleUndo}
        />
      )}
      {isAppInfoModalOpen && (
        <AppInfoModal onClose={handleCloseAppInfoModal} />
      )}
      <ConfirmResetModal 
        isOpen={isConfirmResetModalOpen}
        onClose={() => setIsConfirmResetModalOpen(false)}
        onConfirmReset={handleConfirmResetWithoutSaving}
        onSaveAndReset={handleConfirmSaveAndReset}
      />
    </div>
  );
};

export default App;