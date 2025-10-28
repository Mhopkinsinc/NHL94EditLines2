import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { TeamInfo } from '../rom-parser';

// Interfaces for offset data structures
interface ImageOffsets {
    rloffset: number;
    tloffset: number;
    lpoffset: number;
    banoffset: number;
    homePaletteOffset: number; // from team data
    awayPaletteOffset: number; // from team data
    homeBannerPaletteOffset: number;
}

type BaseOffsets = {
    rloffset: string;
    tloffset: string;
    lpoffset: string;
    banoffset: string;
    hvpaloffset: string;
};

interface PaletteColor {
    rgb: [number, number, number];
    hex: string;
}

interface ProcessedTeamData extends ImageOffsets {
    teamName: string;
    logoPalette: PaletteColor[];
    homePalette: PaletteColor[];
    visitorPalette: PaletteColor[];
    homeBannerPalette: PaletteColor[];
    rinkLogoUrl: string;
    teamLogoUrl: string;
    bannerUrl: string;
    // Store raw tile data to allow for re-rendering with new palettes
    bannerTiles: number[][][]; 
}

// --- Image & Palette Parsing Logic ---

/**
 * Parses 9-bit Sega Genesis palette data into an array of {rgb: [r, g, b], hex: string} objects.
 */
const parseGenesisPaletteRGB = (buffer: ArrayBuffer, offset: number, numColors: number): PaletteColor[] => {
    if (offset + numColors * 2 > buffer.byteLength || offset < 0) {
        return Array(numColors).fill({ rgb: [128, 128, 128], hex: '0x0888' });
    }
    const view = new DataView(buffer);
    const colors: PaletteColor[] = [];
    for (let i = 0; i < numColors; i++) {
        const word = view.getUint16(offset + i * 2, false);
        const b = (word >> 9) & 0x7;
        const g = (word >> 5) & 0x7;
        const r = (word >> 1) & 0x7;
        const r8 = (r << 5) | (r << 2) | (r >> 1);
        const g8 = (g << 5) | (g << 2) | (g >> 1);
        const b8 = (b << 5) | (b << 2) | (b >> 1);
        colors.push({
            rgb: [r8, g8, b8],
            hex: `0x${word.toString(16).toUpperCase().padStart(4, '0')}`
        });
    }
    return colors;
};

/**
 * Parses 9-bit Sega Genesis palette data from a Uint8Array.
 */
const parsePaletteFromBytes = (paletteBytes: Uint8Array): PaletteColor[] => {
    const numColors = paletteBytes.length / 2;
    const view = new DataView(paletteBytes.buffer, paletteBytes.byteOffset, paletteBytes.byteLength);
    const colors: PaletteColor[] = [];
    for (let i = 0; i < numColors; i++) {
        if ((i * 2) + 2 > view.byteLength) break;
        const word = view.getUint16(i * 2, false);
        const b = (word >> 9) & 0x7;
        const g = (word >> 5) & 0x7;
        const r = (word >> 1) & 0x7;
        const r8 = (r << 5) | (r << 2) | (r >> 1);
        const g8 = (g << 5) | (g << 2) | (g >> 1);
        const b8 = (b << 5) | (b << 2) | (b >> 1);
        colors.push({
            rgb: [r8, g8, b8],
            hex: `0x${word.toString(16).toUpperCase().padStart(4, '0')}`
        });
    }
    return colors;
};

/**
 * Parses 4-bit-per-pixel tile data from a Uint8Array.
 */
const parseTiles = (tileBytes: Uint8Array): number[][][] => {
    const tiles: number[][][] = [];
    for (let tileOffset = 0; tileOffset < tileBytes.length; tileOffset += 32) {
        const tile: number[][] = [];
        for (let row = 0; row < 8; row++) {
            const rowData: number[] = [];
            for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
                const byteOffset = tileOffset + row * 4 + byteIndex;
                if (byteOffset < tileBytes.length) {
                    const byte = tileBytes[byteOffset];
                    rowData.push((byte >> 4) & 0xF, byte & 0xF);
                } else {
                    rowData.push(0, 0);
                }
            }
            tile.push(rowData);
        }
        tiles.push(tile);
    }
    return tiles;
};

/**
 * Creates a base64 PNG data URL from tile data and a palette.
 */
function createPngFromTiles(tiles: number[][][], palette: [number, number, number][], tilesPerRow: number): string {
    const numTiles = tiles.length;
    if (numTiles === 0 || !tiles[0]) return '';
    
    const numRows = Math.ceil(numTiles / tilesPerRow);
    const width = tilesPerRow * 8;
    const height = numRows * 8;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let tileRow = 0; tileRow < numRows; tileRow++) {
        for (let pixelRow = 0; pixelRow < 8; pixelRow++) {
            for (let tileCol = 0; tileCol < tilesPerRow; tileCol++) {
                const tileIdx = tileRow * tilesPerRow + tileCol;
                if (tileIdx < numTiles && tiles[tileIdx] && tiles[tileIdx][pixelRow]) {
                    const tilePixelRow = tiles[tileIdx][pixelRow];
                    for (let pixelCol = 0; pixelCol < 8; pixelCol++) {
                        const paletteIndex = tilePixelRow[pixelCol];
                        const x = tileCol * 8 + pixelCol;
                        const y = tileRow * 8 + pixelRow;
                        const dataIndex = (y * width + x) * 4;

                        if (palette[paletteIndex]) {
                            const [r, g, b] = palette[paletteIndex];
                            data[dataIndex] = r;
                            data[dataIndex + 1] = g;
                            data[dataIndex + 2] = b;
                            data[dataIndex + 3] = 255; // Opaque
                        } else {
                            data[dataIndex + 3] = 0; // Transparent for invalid indices
                        }
                    }
                }
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

// --- React Components ---

const ColorPickerPopover: React.FC<{
  anchorEl: HTMLElement;
  initialColor: [number, number, number];
  onChange: (color: string) => void;
  onClose: () => void;
}> = ({ anchorEl, initialColor, onChange, onClose }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    const initialHex = `#${toHex(initialColor[0])}${toHex(initialColor[1])}${toHex(initialColor[2])}`;

    useEffect(() => {
        inputRef.current?.click();
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const rect = anchorEl.getBoundingClientRect();
    const style: React.CSSProperties = {
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
        zIndex: 100,
    };
    
    return (
        <div ref={popoverRef} style={style} className="bg-gray-800 p-2 rounded-lg shadow-2xl border border-gray-600" onClick={(e) => e.stopPropagation()}>
            <input
                ref={inputRef}
                type="color"
                value={initialHex}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onClose}
                className="w-16 h-8 p-0 border-none bg-transparent"
                style={{ cursor: 'pointer' }}
            />
        </div>
    );
};

const PaletteDisplay: React.FC<{ 
    title: string; 
    colors: PaletteColor[];
    onColorClick?: (index: number, event: React.MouseEvent<HTMLDivElement>) => void;
    isDraggable?: boolean;
    draggedColorIndex?: number | null;
    dropTargetColorIndex?: number | null;
    onColorDragStart?: (colorIndex: number, e: React.DragEvent<HTMLDivElement>) => void;
    onColorDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    onColorDragEnter?: (colorIndex: number, e: React.DragEvent<HTMLDivElement>) => void;
    onColorDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
    onColorDrop?: (colorIndex: number, e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ 
    title, 
    colors, 
    onColorClick,
    isDraggable = false,
    draggedColorIndex,
    dropTargetColorIndex,
    onColorDragStart,
    onColorDragOver,
    onColorDragEnter,
    onColorDragLeave,
    onColorDrop,
}) => (
    <div>
        <h4 className="text-sm font-semibold text-gray-400 mt-2">{title}</h4>
        <div className="flex flex-wrap gap-1 mt-1">
            {colors.map((color, index) => {
                const rgbString = `rgb(${color.rgb.join(',')})`;
                const isBeingDragged = isDraggable && draggedColorIndex === index;
                const isDropTarget = isDraggable && dropTargetColorIndex === index && draggedColorIndex !== index;

                return (
                    <div 
                        key={index}
                        draggable={isDraggable}
                        onDragStart={isDraggable && onColorDragStart ? (e) => onColorDragStart(index, e) : undefined}
                        onDragOver={isDraggable && onColorDragOver ? onColorDragOver : undefined}
                        onDragEnter={isDraggable && onColorDragEnter ? (e) => onColorDragEnter(index, e) : undefined}
                        onDragLeave={isDraggable && onColorDragLeave ? onColorDragLeave : undefined}
                        onDrop={isDraggable && onColorDrop ? (e) => { e.preventDefault(); onColorDrop(index, e); } : undefined}
                        className={`w-6 h-6 rounded border border-gray-600 transition-all duration-150 
                            ${onColorClick ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-sky-400' : ''}
                            ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
                            ${isBeingDragged ? 'opacity-30 scale-90' : ''}
                            ${isDropTarget ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-yellow-400 scale-110' : ''}`}
                        style={{ backgroundColor: rgbString }}
                        title={`${rgbString} - ${color.hex}`}
                        onClick={onColorClick ? (e) => onColorClick(index, e) : undefined}
                    />
                );
            })}
        </div>
    </div>
);


const AssetDisplay: React.FC<{ title: string; offset: number; imageUrl: string }> = ({ title, offset, imageUrl }) => (
    <div className="mt-4">
        <p className="font-semibold text-gray-400">{title}: <code className="font-mono text-gray-300">0x{offset.toString(16).toUpperCase()}</code></p>
        {imageUrl ? (
            <div className="mt-2 bg-black/30 p-2 rounded inline-block">
                <img src={imageUrl} alt={title} style={{ imageRendering: 'pixelated' }} className="border border-gray-600" />
            </div>
        ) : <p className="text-xs text-gray-500 italic mt-1">Could not generate image.</p>}
    </div>
);


export const MenuLogos: React.FC<{ romBuffer: ArrayBuffer | null, teams: TeamInfo[], numberOfTeams: number }> = ({ romBuffer, teams, numberOfTeams }) => {
    const [processedData, setProcessedData] = useState<ProcessedTeamData[]>([]);
    const [pickerState, setPickerState] = useState<{ teamIndex: number; colorIndex: number; anchorEl: HTMLElement } | null>(null);
    const [draggedColor, setDraggedColor] = useState<{ teamIndex: number; colorIndex: number } | null>(null);
    const [dropTarget, setDropTarget] = useState<{ teamIndex: number; colorIndex: number } | null>(null);

    useEffect(() => {
        if (!romBuffer || teams.length === 0) {
            setProcessedData([]);
            return;
        }

        const romtype = numberOfTeams;
        const teamcnt = numberOfTeams;
        const newImgoffsets: ProcessedTeamData[] = [];

        const baseOffsets: BaseOffsets = romtype === 32
            ? { rloffset: '1E317E', tloffset: '1D38B0', lpoffset: '1D34A6', banoffset: '1DD370', hvpaloffset: '1D1B0A' }
            : { rloffset: '1D6F02', tloffset: '1C85B8', lpoffset: '1C81EE', banoffset: '1D16CC', hvpaloffset: '1C6982' };

        const increments = { rloffset: 0x30A, tloffset: 0x4D6, lpoffset: 0x20, banoffset: 0x2C0, hvpaloffset: 0x40 };
        const imageByteSizes = { rinkLogo: 0x300, teamLogo: 0x480, banner: 0x2C0 };

        for (let count = 0; count < teamcnt; count++) {
            const rloffset = parseInt(baseOffsets.rloffset, 16) + increments.rloffset * count;
            const tloffset = parseInt(baseOffsets.tloffset, 16) + increments.tloffset * count;
            const lpoffset = parseInt(baseOffsets.lpoffset, 16) + increments.lpoffset * count;
            const banoffset = parseInt(baseOffsets.banoffset, 16) + increments.banoffset * count;
            const hvpaloffset = parseInt(baseOffsets.hvpaloffset, 16) + increments.hvpaloffset * count;
            const homeBannerPaletteOffset = hvpaloffset;
            
            const logoPaletteData = parseGenesisPaletteRGB(romBuffer, lpoffset, 16);
            const homeBannerPaletteData = parseGenesisPaletteRGB(romBuffer, homeBannerPaletteOffset, 16);
            
            if (homeBannerPaletteData.length > 5) { homeBannerPaletteData[5] = { rgb: [255, 255, 255], hex: '0x0EEE' }; }
            if (homeBannerPaletteData.length > 6) { homeBannerPaletteData[6] = { rgb: [0, 0, 0], hex: '0x0000' }; }

            const teamData = teams[count];
            const homePaletteData = teamData ? parsePaletteFromBytes(teamData.homePalette) : [];
            const visitorPaletteData = teamData ? parsePaletteFromBytes(teamData.awayPalette) : [];
            const homePaletteOffset = teamData ? teamData.teamPointer + 12 : 0;
            const awayPaletteOffset = teamData ? teamData.teamPointer + 44 : 0;
            
            const rinkLogoTiles = parseTiles(new Uint8Array(romBuffer, rloffset, imageByteSizes.rinkLogo));
            const teamLogoTiles = parseTiles(new Uint8Array(romBuffer, tloffset, imageByteSizes.teamLogo));
            const bannerTiles = parseTiles(new Uint8Array(romBuffer, banoffset, imageByteSizes.banner));

            newImgoffsets.push({
                teamName: teamData ? `${teamData.city} ${teamData.name}` : `Team ${count + 1}`,
                rloffset, tloffset, lpoffset, banoffset,
                homePaletteOffset, awayPaletteOffset,
                homeBannerPaletteOffset,
                logoPalette: logoPaletteData,
                homePalette: homePaletteData,
                visitorPalette: visitorPaletteData,
                homeBannerPalette: homeBannerPaletteData,
                rinkLogoUrl: createPngFromTiles(rinkLogoTiles, homePaletteData.map(c => c.rgb) as [number,number,number][], 6),
                teamLogoUrl: createPngFromTiles(teamLogoTiles, logoPaletteData.map(c => c.rgb) as [number,number,number][], 6),
                bannerUrl: createPngFromTiles(bannerTiles, homeBannerPaletteData.map(c => c.rgb) as [number,number,number][], 11),
                bannerTiles,
            });
        }
        setProcessedData(newImgoffsets);
    }, [romBuffer, teams, numberOfTeams]);

    const handleColorSwatchClick = (teamIndex: number, colorIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
        setPickerState({ teamIndex, colorIndex, anchorEl: event.currentTarget });
    };

    const handleColorChange = (newColorHex: string) => {
        if (!pickerState) return;
        const { teamIndex, colorIndex } = pickerState;

        const r = parseInt(newColorHex.slice(1, 3), 16);
        const g = parseInt(newColorHex.slice(3, 5), 16);
        const b = parseInt(newColorHex.slice(5, 7), 16);

        setProcessedData(prevData => {
            const newData = prevData.map((team, index) => {
                if (index === teamIndex) {
                    const newHomeBannerPalette = [...team.homeBannerPalette];
                    const newColor: PaletteColor = { ...newHomeBannerPalette[colorIndex], rgb: [r, g, b] };
                    newHomeBannerPalette[colorIndex] = newColor;

                    const newBannerUrl = createPngFromTiles(team.bannerTiles, newHomeBannerPalette.map(c => c.rgb) as [number,number,number][], 11);
                    
                    return { ...team, homeBannerPalette: newHomeBannerPalette, bannerUrl: newBannerUrl };
                }
                return team;
            });
            return newData;
        });
    };

    const handleClosePicker = () => {
        setPickerState(null);
    };

    const handleColorDragStart = (teamIndex: number, colorIndex: number, e: React.DragEvent) => {
        setDraggedColor({ teamIndex, colorIndex });
        e.dataTransfer.effectAllowed = 'copy';
    };
    
    const handleColorDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };
    
    const handleColorDragEnter = (teamIndex: number, colorIndex: number) => {
        if (draggedColor && (draggedColor.teamIndex !== teamIndex || draggedColor.colorIndex !== colorIndex)) {
            setDropTarget({ teamIndex, colorIndex });
        }
    };
    
    const handleColorDragLeave = () => {
        setDropTarget(null);
    };
    
    const handleColorDrop = (teamIndex: number, colorIndex: number) => {
        if (!draggedColor || (draggedColor.teamIndex === teamIndex && draggedColor.colorIndex === colorIndex)) {
            setDraggedColor(null);
            setDropTarget(null);
            return;
        }
    
        const sourceColor = processedData[draggedColor.teamIndex].homeBannerPalette[draggedColor.colorIndex];
    
        setProcessedData(prevData => {
            const newData = [...prevData];
            const targetTeam = { ...newData[teamIndex] };
            const newPalette = [...targetTeam.homeBannerPalette];
            
            newPalette[colorIndex] = sourceColor;
            
            targetTeam.homeBannerPalette = newPalette;
            targetTeam.bannerUrl = createPngFromTiles(targetTeam.bannerTiles, newPalette.map(c => c.rgb) as [number,number,number][], 11);
            
            newData[teamIndex] = targetTeam;
            return newData;
        });
    
        setDraggedColor(null);
        setDropTarget(null);
    };

    if (!romBuffer) {
        return (
            <div className="text-center py-20 bg-[#2B3544] rounded-lg mt-4">
                <h2 className="text-2xl font-bold mb-4">No ROM Loaded</h2>
                <p className="text-gray-400">Load a ROM file to view menu logo asset data.</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-[#2B3544] p-4 rounded-lg" onDragEnd={() => { setDraggedColor(null); setDropTarget(null); }}>
                <h2 className="text-2xl font-bold mb-4">Menu Logo Assets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {processedData.map((data, teamIndex) => (
                        <div key={data.teamName} className="bg-[#212934] p-4 rounded-lg border border-sky-500/20">
                            <h3 className="text-lg font-bold text-sky-300 truncate" title={data.teamName}>{data.teamName}</h3>
                            
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                <AssetDisplay title="Rink Logo" offset={data.rloffset} imageUrl={data.rinkLogoUrl} />
                                <AssetDisplay title="Team Logo" offset={data.tloffset} imageUrl={data.teamLogoUrl} />
                                <AssetDisplay title="Banner" offset={data.banoffset} imageUrl={data.bannerUrl} />
                            </div>

                            <div className="mt-3 border-t border-gray-700 pt-3">
                                <PaletteDisplay title={`Logo Palette (0x${data.lpoffset.toString(16).toUpperCase()})`} colors={data.logoPalette} />
                                <PaletteDisplay title={`Home Jersey Palette (0x${data.homePaletteOffset.toString(16).toUpperCase()})`} colors={data.homePalette} />
                                <PaletteDisplay title={`Away Jersey Palette (0x${data.awayPaletteOffset.toString(16).toUpperCase()})`} colors={data.visitorPalette} />
                                <PaletteDisplay 
                                    title={`Banner Palette (0x${data.homeBannerPaletteOffset.toString(16).toUpperCase()})`} 
                                    colors={data.homeBannerPalette} 
                                    onColorClick={(colorIndex, event) => handleColorSwatchClick(teamIndex, colorIndex, event)}
                                    isDraggable={true}
                                    draggedColorIndex={draggedColor?.teamIndex === teamIndex ? draggedColor.colorIndex : null}
                                    dropTargetColorIndex={dropTarget?.teamIndex === teamIndex ? dropTarget.colorIndex : null}
                                    onColorDragStart={(colorIndex, e) => handleColorDragStart(teamIndex, colorIndex, e)}
                                    onColorDragOver={handleColorDragOver}
                                    onColorDragEnter={(colorIndex) => handleColorDragEnter(teamIndex, colorIndex)}
                                    onColorDragLeave={handleColorDragLeave}
                                    onColorDrop={(colorIndex) => handleColorDrop(teamIndex, colorIndex)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {pickerState && pickerState.anchorEl && (
                <ColorPickerPopover
                    anchorEl={pickerState.anchorEl}
                    initialColor={processedData[pickerState.teamIndex].homeBannerPalette[pickerState.colorIndex].rgb}
                    onChange={handleColorChange}
                    onClose={handleClosePicker}
                />
            )}
        </>
    );
};