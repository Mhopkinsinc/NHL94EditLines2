import React, { useState, useCallback, useRef, useEffect } from 'react';
import { INITIAL_LINEUP, NHL_TEAMS_1994 } from './constants';
import type { Lineup, Player, PositionType, HistoryEntry } from './types';
import { PositionSlot } from './components/PositionSlot';
import { Roster } from './components/Roster';
import { PlayerSelectionModal } from './components/PlayerSelectionModal';
import { TeamSelector } from './components/TeamSelector';
import { AttributeCardModal } from './components/AttributeCardModal';
import { parseRomData, RomData, parseAllTeams, TeamInfo, updateRomChecksum } from './rom-parser';
import { EASportsIcon, HistoryIcon, SaveIcon, UploadIcon, UploadRomIcon } from './components/icons';
import { RomInfoModal } from './components/RomInfoModal';
import { HistoryModal } from './components/HistoryModal';

declare const introJs: any;

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
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [romBuffer, setRomBuffer] = useState<ArrayBuffer | null>(null);
  const [modifiedLineups, setModifiedLineups] = useState<Record<string, Lineup>>({});
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isTourReady, setIsTourReady] = useState(false);
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
            introJs.tour().oncomplete(() => {
                sessionStorage.setItem('nhl94-tour-shown', 'true');
            }).onexit(() => {
                sessionStorage.setItem('nhl94-tour-shown', 'true');
            }).start();
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

            const tourShown = sessionStorage.getItem('nhl94-tour-shown');
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

  const handleSaveChanges = useCallback(() => {
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
    setDraggedItem({ player, source });
    handleCloseMenus();
  }, [handleCloseMenus]);
  
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

  return (
    <div className="min-h-screen text-white font-sans p-4 md:p-8" onDragEnd={handleDragEnd}>
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_1fr_1fr_1fr] gap-x-2 gap-y-2 items-center">
          {/* Controls Row */}
          <div className="flex justify-center items-center h-full font-bold text-gray-400 text-lg">
            Team
          </div>
          
          <div data-step="1" data-intro="Welcome! Start by selecting a team from this dropdown to view and edit their lineup.">
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
                  onClick={handleSaveChanges}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-1 px-3 text-sm rounded-md transition-colors flex items-center gap-1.5"
                  disabled={!isDirty}
                  title={isDirty ? "Save all changes to a new ROM file" : "No changes to save"}
                  data-step="2"
                  data-intro="When you're finished, click 'Save ROM' to download a new file with all your changes."
              >
                  <SaveIcon className="w-4 h-4" />
                  Save ROM
              </button>
              {romInfo && (
                  <div className="flex items-center gap-2 border-l border-gray-600 pl-2">
                       <button
                          onClick={handleOpenHistoryModal}
                          className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                          aria-label="Show Change History"
                          disabled={historyLog.length === 0}
                          title={historyLog.length > 0 ? "Show change history" : "No changes made yet"}
                          data-step="3"
                          data-intro="Every change you make is tracked. Click this icon to view your edit history and undo any actions."
                      >
                          <HistoryIcon className="w-5 h-5" />
                      </button>
                      <button
                          onClick={handleOpenRomInfoModal}
                          className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md transition-colors"
                          aria-label="Show ROM Information"
                          data-step="4"
                          data-intro="Click this icon to view detailed information about the loaded ROM, including all teams and players found."
                      >
                          <EASportsIcon className="w-5 h-5 text-white" />
                      </button>
                  </div>
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
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-x-2 gap-y-2 items-center" data-step="5" data-intro="This is the lineup grid. Active players are shown in their assigned positions.">
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
                            isDragSource={getIsDragSource('FORWARD_LINE', lineIndex, position)}
                            draggedPlayer={draggedItem?.player}
                            menuId={menuId}
                            isMenuOpen={openMenuId === menuId}
                            onToggleMenu={handleToggleMenu}
                            onCloseMenu={handleCloseMenus}
                            selectedTeamName={selectedTeamName}
                            isTourStep={isTourStepTarget && !!forwardLine[position]}
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
                                onRemove={(idx, pos) => handleRemovePlayer('defense', idx, pos)}
                                onEmptyClick={() => handleOpenPlayerSelection('defense', pairIndex, position)}
                                onViewAttributes={handleOpenAttributeModal}
                                isDragSource={getIsDragSource('DEFENSE_PAIRING', pairIndex, position)}
                                draggedPlayer={draggedItem?.player}
                                menuId={menuId}
                                isMenuOpen={openMenuId === menuId}
                                onToggleMenu={handleToggleMenu}
                                onCloseMenu={handleCloseMenus}
                                selectedTeamName={selectedTeamName}
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
                  onDragStart={(player, pIdx) => handleDragStart(player, { type: 'ROSTER', playerIndex: pIdx })}
                  onDrop={() => handleDrop({ type: 'ROSTER' })}
                  onViewAttributes={handleOpenAttributeModal}
                  isDragSource={getIsDragSource('ROSTER')}
                  draggedPlayer={draggedItem?.player}
                  openMenuId={openMenuId}
                  onToggleMenu={handleToggleMenu}
                  onCloseMenu={handleCloseMenus}
                  selectedTeamName={selectedTeamName}
                />
            </div>
          </>
        )}
      </main>
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
    </div>
  );
};

export default App;