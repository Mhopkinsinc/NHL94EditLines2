import React, { useMemo } from 'react';
import type { TeamInfo } from '../rom-parser';

// Interfaces for offset data structures
interface ImageOffsets {
    rloffset: number;
    tloffset: number;
    lpoffset: number;
    banoffset: number;
    homePaletteOffset: number; // from team data
    awayPaletteOffset: number; // from team data
}

type BaseOffsets = {
    rloffset: string;
    tloffset: string;
    lpoffset: string;
    banoffset: string;
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
    rinkLogoUrl: string;
    teamLogoUrl: string;
    bannerUrl: string;
}

// --- Image & Palette Parsing Logic ---

/**
 * Parses 9-bit Sega Genesis palette data into an array of {rgb: [r, g, b], hex: string} objects.
 * @param buffer The ROM ArrayBuffer.
 * @param offset The starting offset of the palette data.
 * @param numColors The number of colors in the palette (usually 16).
 * @returns An array of color objects.
 */
const parseGenesisPaletteRGB = (buffer: ArrayBuffer, offset: number, numColors: number): PaletteColor[] => {
    if (offset + numColors * 2 > buffer.byteLength || offset < 0) {
        // Return a default gray palette if offset is invalid to avoid crashes
        return Array(numColors).fill({ rgb: [128, 128, 128], hex: '0x0888' });
    }
    const view = new DataView(buffer);
    const colors: PaletteColor[] = [];

    for (let i = 0; i < numColors; i++) {
        const word = view.getUint16(offset + i * 2, false); // big-endian
        // Sega Genesis 9-bit format: 0000 bbb0 ggg0 rrr0
        const b = (word >> 9) & 0x7;
        const g = (word >> 5) & 0x7;
        const r = (word >> 1) & 0x7;

        // Convert 3-bit color component (0-7) to 8-bit (0-255) using bit replication
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
 * Parses 9-bit Sega Genesis palette data from a Uint8Array into an array of color objects.
 * @param paletteBytes The raw byte data for the palette (e.g., a 32-byte Uint8Array for 16 colors).
 * @returns An array of color objects.
 */
const parsePaletteFromBytes = (paletteBytes: Uint8Array): PaletteColor[] => {
    const numColors = paletteBytes.length / 2;
    // Create a DataView on the Uint8Array's buffer, respecting its offset and length
    const view = new DataView(paletteBytes.buffer, paletteBytes.byteOffset, paletteBytes.byteLength);
    const colors: PaletteColor[] = [];

    for (let i = 0; i < numColors; i++) {
        if ((i * 2) + 2 > view.byteLength) break;
        const word = view.getUint16(i * 2, false); // big-endian
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
 * @param tileBytes The raw byte data for the tiles.
 * @returns A 3D array representing tiles, rows, and pixels: tiles[tileIndex][rowIndex][pixelIndex].
 */
const parseTiles = (tileBytes: Uint8Array): number[][][] => {
    const tiles: number[][][] = [];
    // An 8x8 4bpp tile is 32 bytes.
    for (let tileOffset = 0; tileOffset < tileBytes.length; tileOffset += 32) {
        const tile: number[][] = [];
        for (let row = 0; row < 8; row++) {
            const rowData: number[] = [];
            // Each row is 4 bytes (8 pixels * 4 bits/pixel).
            for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
                const byteOffset = tileOffset + row * 4 + byteIndex;
                if (byteOffset < tileBytes.length) {
                    const byte = tileBytes[byteOffset];
                    // Each byte contains two 4-bit pixel palette indices.
                    rowData.push((byte >> 4) & 0xF); // High nibble
                    rowData.push(byte & 0xF);      // Low nibble
                } else {
                    rowData.push(0, 0); // Pad if data is incomplete.
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
 * The first color in the palette (index 0) is treated as transparent.
 * @param tiles The parsed tile data.
 * @param palette The parsed [r, g, b] palette data.
 * @param tilesPerRow The number of tiles to draw horizontally.
 * @returns A base64 data URL string for the PNG image.
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

    // Iterate through each tile and then each pixel within that tile
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

                        // Index 0 is transparent, all other indices are opaque
                        if (paletteIndex > 0 && palette[paletteIndex]) {
                            const [r, g, b] = palette[paletteIndex];
                            data[dataIndex] = r;
                            data[dataIndex + 1] = g;
                            data[dataIndex + 2] = b;
                            data[dataIndex + 3] = 255; // Opaque
                        } else {
                            // Transparent pixel (for palette index 0 or invalid indices)
                            data[dataIndex + 3] = 0;
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

const PaletteDisplay: React.FC<{ title: string; colors: PaletteColor[] }> = ({ title, colors }) => (
    <div>
        <h4 className="text-sm font-semibold text-gray-400 mt-2">{title}</h4>
        <div className="flex flex-wrap gap-1 mt-1">
            {colors.map((color, index) => {
                const isTransparent = index === 0;
                const rgbString = `rgb(${color.rgb.join(',')})`;
                return (
                    <div 
                        key={index} 
                        className="w-6 h-6 rounded border border-gray-600 relative overflow-hidden"
                        style={isTransparent ? {
                            backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                        } : { backgroundColor: rgbString }}
                        title={isTransparent ? 'Transparent' : `${rgbString} - ${color.hex}`}
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
    const processedData = useMemo<ProcessedTeamData[]>(() => {
        if (!romBuffer || teams.length === 0) return [];

        const romtype = numberOfTeams;
        const teamcnt = numberOfTeams;
        const newImgoffsets: ProcessedTeamData[] = [];

        const baseOffsets: BaseOffsets = romtype === 32
            ? { rloffset: '1E317E', tloffset: '1D38B0', lpoffset: '1D34A6', banoffset: '1DD370' }
            : { rloffset: '1D6F02', tloffset: '1C85B8', lpoffset: '1C81EE', banoffset: '1D16CC' };

        const increments = { rloffset: 0x30A, tloffset: 0x4D6, lpoffset: 0x20, banoffset: 0x2C0 };
        const imageByteSizes = { rinkLogo: 0x300, teamLogo: 0x480, banner: 0x2C0 }; // Approximate byte sizes for tiles

        for (let count = 0; count < teamcnt; count++) {
            const rloffset = parseInt(baseOffsets.rloffset, 16) + increments.rloffset * count;
            const tloffset = parseInt(baseOffsets.tloffset, 16) + increments.tloffset * count;
            const lpoffset = parseInt(baseOffsets.lpoffset, 16) + increments.lpoffset * count;
            const banoffset = parseInt(baseOffsets.banoffset, 16) + increments.banoffset * count;

            const logoPaletteData = parseGenesisPaletteRGB(romBuffer, lpoffset, 16);

            const teamData = teams[count];
            const homePaletteData = teamData ? parsePaletteFromBytes(teamData.homePalette) : [];
            const visitorPaletteData = teamData ? parsePaletteFromBytes(teamData.awayPalette) : [];
            const homePaletteOffset = teamData ? teamData.teamPointer + 12 : 0;
            const awayPaletteOffset = teamData ? teamData.teamPointer + 44 : 0;
            
            // Extract tile data based on offsets and known sizes
            const rinkLogoTiles = parseTiles(new Uint8Array(romBuffer, rloffset, imageByteSizes.rinkLogo));
            const teamLogoTiles = parseTiles(new Uint8Array(romBuffer, tloffset, imageByteSizes.teamLogo));
            const bannerTiles = parseTiles(new Uint8Array(romBuffer, banoffset, imageByteSizes.banner));

            newImgoffsets.push({
                teamName: teamData ? `${teamData.city} ${teamData.name}` : `Team ${count + 1}`,
                rloffset, tloffset, lpoffset, banoffset,
                homePaletteOffset, awayPaletteOffset,
                logoPalette: logoPaletteData,
                homePalette: homePaletteData,
                visitorPalette: visitorPaletteData,
                rinkLogoUrl: createPngFromTiles(rinkLogoTiles, homePaletteData.map(c => c.rgb), 6), // 48px width -> 6 tiles
                teamLogoUrl: createPngFromTiles(teamLogoTiles, logoPaletteData.map(c => c.rgb), 6), // 48px width -> 6 tiles
                bannerUrl: createPngFromTiles(bannerTiles, homePaletteData.map(c => c.rgb), 11), // 88px width -> 11 tiles
            });
        }
        
        return newImgoffsets;
    }, [romBuffer, teams, numberOfTeams]);

    if (!romBuffer) {
        return (
            <div className="text-center py-20 bg-[#2B3544] rounded-lg mt-4">
                <h2 className="text-2xl font-bold mb-4">No ROM Loaded</h2>
                <p className="text-gray-400">Load a ROM file to view menu logo asset data.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#2B3544] p-4 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Menu Logo Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedData.map(data => (
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
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};