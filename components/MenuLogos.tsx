import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { TeamInfo } from '../rom-parser';
import { ChevronUpIcon, ChevronDownIcon } from './icons';

// Interfaces for offset data structures
interface ImageOffsets {
    rloffset: number;
    tloffset: number;
    lpoffset: number;
    banoffset: number;
    homePaletteOffset: number; // from team data
    awayPaletteOffset: number; // from team data
    menuBannerPaletteOffset: number;
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
    menuBannerPalette: PaletteColor[];
    rinkLogoUrl: string;
    teamLogoUrl: string;
    bannerUrl: string;
    // Store raw tile data to allow for re-rendering with new palettes
    bannerTiles: number[][][]; 
    menuBannerImageUrl: string;
}

// --- Image & Palette Parsing Logic ---

/**
 * Creates a base64 PNG data URL for a two-color striped banner.
 */
const createStripePng = (color1: [number, number, number], color2: [number, number, number], width: number, height: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const halfHeight = Math.round(height / 2);

    ctx.fillStyle = `rgb(${color1.join(',')})`;
    ctx.fillRect(0, 0, width, halfHeight);

    ctx.fillStyle = `rgb(${color2.join(',')})`;
    ctx.fillRect(0, halfHeight, width, height - halfHeight);

    return canvas.toDataURL('image/png');
};


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
        <p className="font-semibold text-gray-400">{title}{offset > 0 && (
            <>: <code className="font-mono text-gray-300">0x{offset.toString(16).toUpperCase()}</code></>
        )}</p>
        {imageUrl ? (
            <div className="mt-2 bg-black/30 p-2 rounded inline-block">
                <img src={imageUrl} alt={title} style={{ imageRendering: 'pixelated' }} className="border border-gray-600" />
            </div>
        ) : <p className="text-xs text-gray-500 italic mt-1">Could not generate image.</p>}
    </div>
);


export const MenuLogos: React.FC<{ romBuffer: ArrayBuffer | null, teams: TeamInfo[], numberOfTeams: number }> = ({ romBuffer, teams, numberOfTeams }) => {
    const [processedData, setProcessedData] = useState<ProcessedTeamData[]>([]);
    const [iceRinkPalette, setIceRinkPalette] = useState<PaletteColor[]>([]);
    const [scoreBoardPalette, setScoreBoardPalette] = useState<PaletteColor[]>([]);
    const [pickerState, setPickerState] = useState<{ 
        paletteType: 'menuBanner' | 'scoreBoard' | 'iceRink';
        teamIndex?: number;
        colorIndex: number; 
        anchorEl: HTMLElement 
    } | null>(null);
    const [draggedColor, setDraggedColor] = useState<{ 
        paletteType: 'menuBanner' | 'scoreBoard' | 'iceRink';
        teamIndex?: number;
        colorIndex: number 
    } | null>(null);
    const [dropTarget, setDropTarget] = useState<{ 
        paletteType: 'menuBanner' | 'scoreBoard' | 'iceRink';
        teamIndex?: number;
        colorIndex: number 
    } | null>(null);
    const [collapsedTeams, setCollapsedTeams] = useState<Set<number>>(new Set());
    const [romTypeOverride, setRomTypeOverride] = useState<number>(numberOfTeams);

    // Sync the override state if the base ROM changes
    useEffect(() => {
        setRomTypeOverride(numberOfTeams);
    }, [numberOfTeams]);

    const toggleTeamCollapse = (teamIndex: number) => {
        setCollapsedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamIndex)) {
                newSet.delete(teamIndex);
            } else {
                newSet.add(teamIndex);
            }
            return newSet;
        });
    };

    useEffect(() => {
        if (!romBuffer || teams.length === 0) {
            setProcessedData([]);
            setIceRinkPalette([]);
            setScoreBoardPalette([]);
            return;
        }
        
        const romView = new DataView(romBuffer);
        const romSize = romBuffer.byteLength;
        const scoreBoardBannerPaletteOffset = 0x59944;
        const iceRinkPaletteOffset = 0x59924;
        
        const scoreBoardBannerPaletteData = (scoreBoardBannerPaletteOffset + 32 <= romSize)
            ? parseGenesisPaletteRGB(romBuffer, scoreBoardBannerPaletteOffset, 16)
            : Array(16).fill({ rgb: [0, 0, 0], hex: '0x0000' });
        setScoreBoardPalette(scoreBoardBannerPaletteData);

        const iceRinkPaletteData = (iceRinkPaletteOffset + 32 <= romSize)
            ? parseGenesisPaletteRGB(romBuffer, iceRinkPaletteOffset, 16)
            : Array(16).fill({ rgb: [0, 0, 0], hex: '0x0000' });
        setIceRinkPalette(iceRinkPaletteData);

        const romtype = romTypeOverride;
        const teamcnt = romTypeOverride;
        const newImgoffsets: ProcessedTeamData[] = [];

        const baseOffsets: BaseOffsets = romtype === 32
            ? { rloffset: '1E317E', tloffset: '1D38B0', lpoffset: '1D34A6', banoffset: '1DD370', hvpaloffset: '1D1B0A' }
            : { rloffset: '1D6F02', tloffset: '1C85B8', lpoffset: '1C81EE', banoffset: '1D16CC', hvpaloffset: '1C6982' };

        const increments = { rloffset: 0x30A, tloffset: 0x4D6, lpoffset: 0x20, banoffset: 0x2C0, hvpaloffset: 0x40 };
        const imageByteSizes = { rinkLogo: 0x300, teamLogo: 0x480, banner: 0x2C0 };
        const TEAM_LOGO_POINTER_TABLE_OFFSET = romtype === 32 ? 0x180E : 0x16be;


        for (let count = 0; count < teamcnt; count++) {
            const rloffset = parseInt(baseOffsets.rloffset, 16) + increments.rloffset * count;
            const lpoffset = parseInt(baseOffsets.lpoffset, 16) + increments.lpoffset * count;
            const banoffset = parseInt(baseOffsets.banoffset, 16) + increments.banoffset * count;
            const hvpaloffset = parseInt(baseOffsets.hvpaloffset, 16) + increments.hvpaloffset * count;

            const pointerOffset = TEAM_LOGO_POINTER_TABLE_OFFSET + (count * 4);
            
            let tloffset = romSize; // Default to an out-of-bounds value
            if (pointerOffset + 4 <= romSize) {
                const logoPointer = romView.getUint32(pointerOffset, false);
                tloffset = logoPointer + 0xA;
            }
            
            const menuBannerPaletteOffset = hvpaloffset;
            const defaultPalette = Array(16).fill({ rgb: [0, 0, 0], hex: '0x0000' });
            
            const logoPaletteData = (lpoffset + 32 <= romSize)
                ? parseGenesisPaletteRGB(romBuffer, lpoffset, 16)
                : defaultPalette;

            const menuBannerPaletteData = (menuBannerPaletteOffset + 32 <= romSize)
                ? parseGenesisPaletteRGB(romBuffer, menuBannerPaletteOffset, 16)
                : defaultPalette;

            const color1: [number, number, number] = menuBannerPaletteData.length > 1 ? menuBannerPaletteData[1].rgb : [0,0,0];
            const color2: [number, number, number] = menuBannerPaletteData.length > 2 ? menuBannerPaletteData[2].rgb : [0,0,0];
            const menuBannerImageUrl = createStripePng(color1, color2, 88, 16);

            const teamData = teams[count];
            const homePaletteData = teamData ? parsePaletteFromBytes(teamData.homePalette) : [];
            const visitorPaletteData = teamData ? parsePaletteFromBytes(teamData.awayPalette) : [];
            const homePaletteOffset = teamData ? teamData.teamPointer + 12 : 0;
            const awayPaletteOffset = teamData ? teamData.teamPointer + 44 : 0;
            
            const rinkLogoTiles = (rloffset + imageByteSizes.rinkLogo <= romSize)
                ? parseTiles(new Uint8Array(romBuffer, rloffset, imageByteSizes.rinkLogo))
                : [];
            
            const teamLogoTiles = (tloffset + imageByteSizes.teamLogo <= romSize)
                ? parseTiles(new Uint8Array(romBuffer, tloffset, imageByteSizes.teamLogo))
                : [];

            const bannerTiles = (banoffset + imageByteSizes.banner <= romSize)
                ? parseTiles(new Uint8Array(romBuffer, banoffset, imageByteSizes.banner))
                : [];

            newImgoffsets.push({
                teamName: teamData ? `${teamData.city} ${teamData.name}` : `Team ${count + 1}`,
                rloffset, tloffset, lpoffset, banoffset,
                homePaletteOffset, awayPaletteOffset,
                menuBannerPaletteOffset,
                logoPalette: logoPaletteData,
                homePalette: homePaletteData,
                visitorPalette: visitorPaletteData,
                menuBannerPalette: menuBannerPaletteData,
                rinkLogoUrl: createPngFromTiles(rinkLogoTiles, homePaletteData.map(c => c.rgb), 6),
                teamLogoUrl: createPngFromTiles(teamLogoTiles, logoPaletteData.map(c => c.rgb), 6),
                bannerUrl: createPngFromTiles(bannerTiles, scoreBoardBannerPaletteData.map(c => c.rgb), 11),
                bannerTiles,
                menuBannerImageUrl,
            });
        }
        setProcessedData(newImgoffsets);
    }, [romBuffer, teams, numberOfTeams, romTypeOverride]);

    const handleColorSwatchClick = (teamIndex: number, colorIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
        setPickerState({ paletteType: 'menuBanner', teamIndex, colorIndex, anchorEl: event.currentTarget });
    };

    const handleScoreBoardColorClick = (colorIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
        setPickerState({ paletteType: 'scoreBoard', colorIndex, anchorEl: event.currentTarget });
    };

    const handleIceRinkColorClick = (colorIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
        setPickerState({ paletteType: 'iceRink', colorIndex, anchorEl: event.currentTarget });
    };

    const handleColorChange = (newColorHex: string) => {
        if (!pickerState) return;
        const { paletteType, teamIndex, colorIndex } = pickerState;

        const r = parseInt(newColorHex.slice(1, 3), 16);
        const g = parseInt(newColorHex.slice(3, 5), 16);
        const b = parseInt(newColorHex.slice(5, 7), 16);

        if (paletteType === 'scoreBoard') {
            const newPalette = [...scoreBoardPalette];
            newPalette[colorIndex] = { ...newPalette[colorIndex], rgb: [r, g, b] as [number, number, number] };
            setScoreBoardPalette(newPalette);
            
            // Re-render all banners with the new global palette
            setProcessedData(prevProcData => prevProcData.map(team => ({
                ...team,
                bannerUrl: createPngFromTiles(team.bannerTiles, newPalette.map(c => c.rgb), 11)
            })));
        } else if (paletteType === 'iceRink') {
            const newPalette = [...iceRinkPalette];
            newPalette[colorIndex] = { ...newPalette[colorIndex], rgb: [r, g, b] as [number, number, number] };
            setIceRinkPalette(newPalette);
        } else if (paletteType === 'menuBanner' && teamIndex !== undefined) {
            setProcessedData(prevData => {
                return prevData.map((team, index) => {
                    if (index === teamIndex) {
                        const newMenuBannerPalette = [...team.menuBannerPalette];
                        newMenuBannerPalette[colorIndex] = { ...newMenuBannerPalette[colorIndex], rgb: [r, g, b] as [number, number, number] };
                        
                        const color1: [number, number, number] = newMenuBannerPalette.length > 1 ? newMenuBannerPalette[1].rgb : [0,0,0];
                        const color2: [number, number, number] = newMenuBannerPalette.length > 2 ? newMenuBannerPalette[2].rgb : [0,0,0];
                        const newMenuBannerImageUrl = createStripePng(color1, color2, 88, 16);

                        return { 
                            ...team, 
                            menuBannerPalette: newMenuBannerPalette,
                            menuBannerImageUrl: newMenuBannerImageUrl
                        };
                    }
                    return team;
                });
            });
        }
    };

    const handleClosePicker = () => {
        setPickerState(null);
    };

    const handleColorDragStart = (teamIndex: number, colorIndex: number, e: React.DragEvent) => {
        setDraggedColor({ paletteType: 'menuBanner', teamIndex, colorIndex });
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleScoreBoardDragStart = (colorIndex: number, e: React.DragEvent) => {
        setDraggedColor({ paletteType: 'scoreBoard', colorIndex });
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleIceRinkDragStart = (colorIndex: number, e: React.DragEvent) => {
        setDraggedColor({ paletteType: 'iceRink', colorIndex });
        e.dataTransfer.effectAllowed = 'copy';
    };
    
    const handleColorDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };
    
    const handleColorDragEnter = (paletteType: 'menuBanner' | 'scoreBoard' | 'iceRink', teamIndex: number | null, colorIndex: number) => {
        if (draggedColor) {
            setDropTarget({ paletteType, teamIndex: teamIndex ?? undefined, colorIndex });
        }
    };
    
    const handleColorDragLeave = () => {
        setDropTarget(null);
    };
    
    const handleColorDrop = (targetPaletteType: 'menuBanner' | 'scoreBoard' | 'iceRink', targetTeamIndex: number | null, targetColorIndex: number) => {
        if (!draggedColor || !dropTarget) return;

        // Get the source color data
        let sourceColor: PaletteColor;
        if (draggedColor.paletteType === 'scoreBoard') {
            sourceColor = scoreBoardPalette[draggedColor.colorIndex];
        } else if (draggedColor.paletteType === 'iceRink') {
            sourceColor = iceRinkPalette[draggedColor.colorIndex];
        } else {
            sourceColor = processedData[draggedColor.teamIndex!].menuBannerPalette[draggedColor.colorIndex];
        }
    
        // Update the target palette
        if (targetPaletteType === 'scoreBoard') {
            const newPalette = [...scoreBoardPalette];
            newPalette[targetColorIndex] = sourceColor;
            setScoreBoardPalette(newPalette);
            // Re-render all banners
            setProcessedData(prevProcData => prevProcData.map(team => ({
                ...team,
                bannerUrl: createPngFromTiles(team.bannerTiles, newPalette.map(c => c.rgb), 11)
            })));
        } else if (targetPaletteType === 'iceRink') {
            const newPalette = [...iceRinkPalette];
            newPalette[targetColorIndex] = sourceColor;
            setIceRinkPalette(newPalette);
        } else if (targetPaletteType === 'menuBanner' && targetTeamIndex !== null) {
            setProcessedData(prevData => {
                return prevData.map((team, index) => {
                    if (index === targetTeamIndex) {
                        const newMenuBannerPalette = [...team.menuBannerPalette];
                        newMenuBannerPalette[targetColorIndex] = sourceColor;
                        
                        const color1: [number, number, number] = newMenuBannerPalette.length > 1 ? newMenuBannerPalette[1].rgb : [0,0,0];
                        const color2: [number, number, number] = newMenuBannerPalette.length > 2 ? newMenuBannerPalette[2].rgb : [0,0,0];
                        const newMenuBannerImageUrl = createStripePng(color1, color2, 88, 16);
                        
                        return { 
                            ...team, 
                            menuBannerPalette: newMenuBannerPalette,
                            menuBannerImageUrl: newMenuBannerImageUrl
                        };
                    }
                    return team;
                });
            });
        }
    
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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Team Assets</h2>
                    <div className="flex items-center gap-2">
                        <label htmlFor="rom-type-selector" className="font-semibold text-gray-400">ROM Type:</label>
                        <select
                            id="rom-type-selector"
                            value={romTypeOverride}
                            onChange={(e) => setRomTypeOverride(Number(e.target.value))}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-1.5"
                        >
                            <option value={30}>30 Team</option>
                            <option value={32}>32 Team</option>
                        </select>
                    </div>
                </div>
                <div className="bg-[#212934] p-4 rounded-lg border border-sky-500/20 mb-4">
                    <h3 className="text-lg font-bold text-sky-300">Global Palettes</h3>
                    <PaletteDisplay
                        title={`Ice and Rink Palette (0x59924)`}
                        colors={iceRinkPalette}
                        onColorClick={(colorIndex, event) => handleIceRinkColorClick(colorIndex, event)}
                        isDraggable={true}
                        draggedColorIndex={draggedColor?.paletteType === 'iceRink' ? draggedColor.colorIndex : null}
                        dropTargetColorIndex={dropTarget?.paletteType === 'iceRink' ? dropTarget.colorIndex : null}
                        onColorDragStart={(colorIndex, e) => handleIceRinkDragStart(colorIndex, e)}
                        onColorDragOver={handleColorDragOver}
                        onColorDragEnter={(colorIndex) => handleColorDragEnter('iceRink', null, colorIndex)}
                        onColorDragLeave={handleColorDragLeave}
                        onColorDrop={(colorIndex) => handleColorDrop('iceRink', null, colorIndex)}
                    />
                    <PaletteDisplay
                        title={`Scoreboard Banner Palette (0x59944)`}
                        colors={scoreBoardPalette}
                        onColorClick={(colorIndex, event) => handleScoreBoardColorClick(colorIndex, event)}
                        isDraggable={true}
                        draggedColorIndex={draggedColor?.paletteType === 'scoreBoard' ? draggedColor.colorIndex : null}
                        dropTargetColorIndex={dropTarget?.paletteType === 'scoreBoard' ? dropTarget.colorIndex : null}
                        onColorDragStart={(colorIndex, e) => handleScoreBoardDragStart(colorIndex, e)}
                        onColorDragOver={handleColorDragOver}
                        onColorDragEnter={(colorIndex) => handleColorDragEnter('scoreBoard', null, colorIndex)}
                        onColorDragLeave={handleColorDragLeave}
                        onColorDrop={(colorIndex) => handleColorDrop('scoreBoard', null, colorIndex)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {processedData.map((data, teamIndex) => {
                        const isCollapsed = collapsedTeams.has(teamIndex);
                        return (
                            <div key={data.teamName} className="bg-[#212934] p-4 rounded-lg border border-sky-500/20">
                                <button
                                    className="flex justify-between items-center w-full text-left"
                                    onClick={() => toggleTeamCollapse(teamIndex)}
                                    aria-expanded={!isCollapsed}
                                    aria-controls={`team-details-${teamIndex}`}
                                >
                                    <h3 className="text-lg font-bold text-sky-300 truncate" title={data.teamName}>{data.teamName}</h3>
                                    <div className="p-1 rounded-full hover:bg-sky-900/50">
                                        {isCollapsed ? <ChevronDownIcon className="w-5 h-5 text-gray-400" /> : <ChevronUpIcon className="w-5 h-5" />}
                                    </div>
                                </button>
                                
                                <div
                                    id={`team-details-${teamIndex}`}
                                    className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}
                                >
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                        <AssetDisplay title="Rink Logo" offset={data.rloffset} imageUrl={data.rinkLogoUrl} />
                                        <AssetDisplay title="Team Logo" offset={data.tloffset} imageUrl={data.teamLogoUrl} />
                                        <div>
                                            <AssetDisplay title="Banner" offset={data.banoffset} imageUrl={data.bannerUrl} />
                                            <AssetDisplay title="Menu Banner" offset={0} imageUrl={data.menuBannerImageUrl} />
                                        </div>
                                    </div>

                                    <div className="mt-3 border-t border-gray-700 pt-3">
                                        <PaletteDisplay title={`Logo Palette (0x${data.lpoffset.toString(16).toUpperCase()})`} colors={data.logoPalette} />
                                        <PaletteDisplay title={`Home Jersey Palette (0x${data.homePaletteOffset.toString(16).toUpperCase()})`} colors={data.homePalette} />
                                        <PaletteDisplay title={`Away Jersey Palette (0x${data.awayPaletteOffset.toString(16).toUpperCase()})`} colors={data.visitorPalette} />
                                        <PaletteDisplay 
                                            title={`Menu Banner Palette (0x${data.menuBannerPaletteOffset.toString(16).toUpperCase()})`} 
                                            colors={data.menuBannerPalette} 
                                            onColorClick={(colorIndex, event) => handleColorSwatchClick(teamIndex, colorIndex, event)}
                                            isDraggable={true}
                                            draggedColorIndex={draggedColor?.paletteType === 'menuBanner' && draggedColor.teamIndex === teamIndex ? draggedColor.colorIndex : null}
                                            dropTargetColorIndex={dropTarget?.paletteType === 'menuBanner' && dropTarget.teamIndex === teamIndex ? dropTarget.colorIndex : null}
                                            onColorDragStart={(colorIndex, e) => handleColorDragStart(teamIndex, colorIndex, e)}
                                            onColorDragOver={handleColorDragOver}
                                            onColorDragEnter={(colorIndex) => handleColorDragEnter('menuBanner', teamIndex, colorIndex)}
                                            onColorDragLeave={handleColorDragLeave}
                                            onColorDrop={(colorIndex) => handleColorDrop('menuBanner', teamIndex, colorIndex)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {pickerState && pickerState.anchorEl && (
                <ColorPickerPopover
                    anchorEl={pickerState.anchorEl}
                    initialColor={
                        pickerState.paletteType === 'scoreBoard'
                            ? scoreBoardPalette[pickerState.colorIndex].rgb
                            : pickerState.paletteType === 'iceRink'
                                ? iceRinkPalette[pickerState.colorIndex].rgb
                                : processedData[pickerState.teamIndex!].menuBannerPalette[pickerState.colorIndex].rgb
                    }
                    onChange={handleColorChange}
                    onClose={handleClosePicker}
                />
            )}
        </>
    );
};