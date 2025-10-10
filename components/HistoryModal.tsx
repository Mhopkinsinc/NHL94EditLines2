import React, { useEffect, useMemo, useState } from 'react';
import type { HistoryEntry } from '../types';
import { SaveIcon } from './icons';

interface HistoryModalProps {
  history: HistoryEntry[];
  onClose: () => void;
  onUndo: (entryId: string) => void;
}

const TimelineArrow: React.FC<{ type: 'top' | 'middle' | 'bottom' | 'single' | 'none' }> = ({ type }) => {
    if (type === 'none') {
        return <div className="w-8 shrink-0" />; // Keep layout consistent
    }

    const Circle = () => <div className="w-3 h-3 bg-red-500 rounded-full ring-2 ring-[#212934] z-10" />;
    const Line = () => <div className="w-0.5 flex-1 bg-red-500/70" />;
    const ArrowHead = () => <div className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-red-500" />;

    return (
        <div className="w-8 shrink-0 flex flex-col items-center self-stretch">
            {type === 'top' && (
                <>
                    <div className="flex-1" />
                    <Circle />
                    <Line />
                </>
            )}
            {type === 'middle' && (
                <>
                    <div className="w-0.5 h-full bg-red-500/70" />
                </>
            )}
            {type === 'bottom' && (
                <>
                    <Line />
                    <ArrowHead />
                    <div className="flex-1" />
                </>
            )}
            {type === 'single' && (
                <>
                    <div className="flex-1" />
                    <Circle />
                    <div className="w-0.5 h-1 bg-red-500/70" />
                    <ArrowHead />
                    <div className="flex-1" />
                </>
            )}
        </div>
    );
};

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onUndo }) => {
    const [hoveredUndoId, setHoveredUndoId] = useState<string | null>(null);

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

    const handleExportCSV = () => {
        if (history.length === 0) return;

        const escapeCSV = (field: string | Date): string => {
            const strField = typeof field === 'string' ? field : field.toLocaleString();
            let escaped = strField.replace(/"/g, '""'); // Escape double quotes
            // Wrap in double quotes if it contains comma, newline, or the original had a quote
            if (strField.includes(',') || strField.includes('"') || strField.includes('\n') || strField.includes('\r')) {
                escaped = `"${escaped}"`;
            }
            return escaped;
        };

        const headers = ['Timestamp', 'Team', 'Description'];
        // The history log is newest-first, so reverse it for a chronological CSV export.
        const sortedHistory = [...history].reverse();

        const rows = sortedHistory.map(entry =>
            [
                escapeCSV(entry.timestamp),
                escapeCSV(entry.teamName),
                escapeCSV(entry.description)
            ].join(',')
        );

        const csvContent = [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "nhl94-changes-history.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const cascadingEntriesInfo = useMemo(() => {
        const hoveredEntry = hoveredUndoId ? history.find(entry => entry.id === hoveredUndoId) : null;
        if (!hoveredEntry) {
            return {
                ids: new Set<string>(),
                firstId: null,
                lastId: null,
            };
        }
        const filtered = history.filter(entry => 
            entry.teamName === hoveredEntry.teamName && entry.timestamp >= hoveredEntry.timestamp
        );
        return {
            ids: new Set(filtered.map(e => e.id)),
            firstId: filtered.length > 0 ? filtered[0].id : null,
            lastId: filtered.length > 0 ? filtered[filtered.length - 1].id : null,
        };
    }, [hoveredUndoId, history]);


    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[#212934] border-2 border-sky-500/50 shadow-sky-500/20 shadow-2xl rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden"
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
                        Change History
                    </h2>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto">
                   <div className="bg-black/20 p-2 rounded-md space-y-1 text-sm max-h-[65vh] overflow-y-auto">
                        {history.length > 0 ? (
                            <ul className="flex flex-col">
                                {history.map((entry) => {
                                    const { ids, firstId, lastId } = cascadingEntriesInfo;
                                    const isCascading = ids.has(entry.id);
                                    let arrowPart: 'top' | 'middle' | 'bottom' | 'single' | 'none' = 'none';

                                    if (isCascading) {
                                        const isFirst = entry.id === firstId;
                                        const isLast = entry.id === lastId;
                                        if (isFirst && isLast) {
                                            arrowPart = 'single';
                                        } else if (isFirst) {
                                            arrowPart = 'top';
                                        } else if (isLast) {
                                            arrowPart = 'bottom';
                                        } else {
                                            arrowPart = 'middle';
                                        }
                                    }
                                    
                                    return (
                                        <li 
                                            key={entry.id} 
                                            className="flex items-stretch transition-all duration-200"
                                            onMouseEnter={() => setHoveredUndoId(entry.id)}
                                            onMouseLeave={() => setHoveredUndoId(null)}
                                        >
                                           <TimelineArrow type={arrowPart} />
                                           <div className={`my-0.5 p-2 rounded flex-grow bg-[#2B3544]/60 flex items-center gap-4 transition-all duration-200 ${isCascading ? 'bg-red-900/40 ring-1 ring-red-500/50' : ''}`}>
                                                <div className="text-right shrink-0 w-28">
                                                        <div className="font-semibold text-gray-400 truncate" title={entry.teamName}>{entry.teamName}</div>
                                                        <div className="text-xs text-gray-500">{entry.timestamp.toLocaleTimeString()}</div>
                                                </div>
                                                <div className="border-l border-gray-700 pl-4 text-gray-200 flex-grow">
                                                        {entry.description}
                                                </div>
                                                <button 
                                                        onClick={() => onUndo(entry.id)}
                                                        className="text-sky-400 hover:text-sky-300 text-sm font-semibold px-3 py-1 rounded-md hover:bg-sky-500/20 transition-colors"
                                                        aria-label={`Undo change: ${entry.description}`}
                                                    >
                                                        Undo
                                                    </button>
                                           </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center p-8">No changes have been made yet.</p>
                        )}
                   </div>
                </div>

                {/* Footer */}
                <div className="p-3 mt-auto bg-black/20 border-t-2 border-sky-500/30 flex justify-end items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        disabled={history.length === 0}
                        className="bg-sky-600 hover:bg-sky-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center gap-2"
                        aria-label="Export history to CSV"
                        title={history.length > 0 ? "Export history to CSV" : "No history to export"}
                    >
                        <SaveIcon className="w-5 h-5" />
                        Export to CSV
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