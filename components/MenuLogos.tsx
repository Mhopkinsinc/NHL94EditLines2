import React, { useMemo } from 'react';
import type { TeamInfo } from '../rom-parser';

interface ImageOffsets {
    rloffset: number;
    tloffset: number;
    lpoffset: number;
    banoffset: number;
    hvpaloffset: number;
}

type BaseOffsets = {
    [K in keyof ImageOffsets]: string;
};

interface ProcessedTeamData extends ImageOffsets {
    teamName: string;
    logoPalette: string[];
    homePalette: string[];
    visitorPalette: string[];
    rinkLogoUrl: string;
    teamLogoUrl: string;
    bannerUrl: string;
}

// --- Image Generation Logic (adapted from JS to TypeScript for browser) ---

function writeUInt32LE(arr: number[], value: number): void {
    arr.push(value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF);
}

function writeInt32LE(arr: number[], value: number): void {
    writeUInt32LE(arr, value >>> 0);
}

function writeUInt16LE(arr: number[], value: number): void {
    arr.push(value & 0xFF, (value >> 8) & 0xFF);
}

// Convert 9-bit Sega Genesis palette to [r, g, b] array
const parseGenesisPaletteRGB = (buffer: ArrayBuffer, offset: number, numColors: number): [number, number, number][] => {
    if (offset + numColors * 2 > buffer.byteLength || offset < 0) {
        return Array(numColors).fill([128, 128, 128]);
    }
    const view = new DataView(buffer);
    const colors: [number, number, number][] = [];
    for (let i = 0; i < numColors; i++) {
        const word = view.getUint16(offset + i * 2, false);
        // Sega Genesis format: 0000 bbb0 ggg0 rrr0 (shifted by one bit in some contexts)
        // Correcting based on observed image data: 0000 bbb ggg rrr
        let b = (word >> 8) & 0b111;
        let g = (word >> 4) & 0b111;
        let r = (word >> 0) & 0b111;

        // More accurate 3-bit to 8-bit conversion using bit replication
        r = (r << 5) | (r << 2) | (r >> 1);
        g = (g << 5) | (g << 2) | (g >> 1);
        b = (b << 5) | (b << 2) | (b >> 1);

        colors.push([r, g, b]);
    }
    return colors;
};

const parseTiles = (tileBytes: Uint8Array): number[][][] => {
    const tiles: number[][][] = [];
    // 4bpp tile data is 32 bytes per 8x8 tile
    for (let tileOffset = 0; tileOffset < tileBytes.length; tileOffset += 32) {
        const tile: number[][] = [];
        for (let row = 0; row < 8; row++) {
            const rowData: number[] = [];
            // Each row is 4 bytes (8 pixels * 4 bits/pixel = 32 bits)
            for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
                const byteOffset = tileOffset + row * 4 + byteIndex;
                if (byteOffset < tileBytes.length) {
                    const byte = tileBytes[byteOffset];
                    // Each byte contains two 4-bit pixels
                    rowData.push((byte >> 4) & 0xF); // High nibble
                    rowData.push(byte & 0xF);      // Low nibble
                } else {
                    rowData.push(0, 0); // Handle incomplete tile data
                }
            }
            tile.push(rowData);
        }
        tiles.push(tile);
    }
    return tiles;
};

function createIndexedBmp(tiles: number[][][], palette: [number, number, number][], tilesPerRow: number): string {
    const numTiles = tiles.length;
    if (numTiles === 0) return '';
    
    const numRows = Math.ceil(numTiles / tilesPerRow);
    const width = tilesPerRow * 8;
    const height = numRows * 8;

    const pixels: number[][] = [];
    for (let tileRow = 0; tileRow < numRows; tileRow++) {
        for (let pixelRow = 0; pixelRow < 8; pixelRow++) {
            const rowPixels: number[] = [];
            for (let tileCol = 0; tileCol < tilesPerRow; tileCol++) {
                const tileIdx = tileRow * tilesPerRow + tileCol;
                if (tileIdx < numTiles && tiles[tileIdx] && tiles[tileIdx][pixelRow]) {
                    rowPixels.push(...tiles[tileIdx][pixelRow]);
                } else {
                    rowPixels.push(...new Array(8).fill(0));
                }
            }
            pixels.push(rowPixels);
        }
    }

    const bmpData: number[] = [];
    const bytesPerRow = Math.ceil(width / 2);
    const rowSize = Math.ceil(bytesPerRow / 4) * 4;
    const pixelDataSize = rowSize * height;
    const paletteSize = 16 * 4;
    const fileSize = 14 + 40 + paletteSize + pixelDataSize;

    bmpData.push(0x42, 0x4D); // 'BM'
    writeUInt32LE(bmpData, fileSize);
    writeUInt32LE(bmpData, 0);
    writeUInt32LE(bmpData, 14 + 40 + paletteSize);

    writeUInt32LE(bmpData, 40);
    writeInt32LE(bmpData, width);
    writeInt32LE(bmpData, height);
    writeUInt16LE(bmpData, 1);
    writeUInt16LE(bmpData, 4);
    writeUInt32LE(bmpData, 0);
    writeUInt32LE(bmpData, pixelDataSize);
    writeInt32LE(bmpData, 2835);
    writeInt32LE(bmpData, 2835);
    writeUInt32LE(bmpData, 16);
    writeUInt32LE(bmpData, 16);

    for (let i = 0; i < 16; i++) {
        if (i < palette.length) {
            const [r, g, b] = palette[i];
            bmpData.push(b, g, r, 0); // BGRA
        } else {
            bmpData.push(0, 0, 0, 0);
        }
    }

    const padding = rowSize - bytesPerRow;
    for (let i = pixels.length - 1; i >= 0; i--) {
        const row = pixels[i];
        for (let j = 0; j < row.length; j += 2) {
            const pixel1 = row[j] & 0xF;
            const pixel2 = (j + 1 < row.length) ? (row[j + 1] & 0xF) : 0;
            bmpData.push((pixel1 << 4) | pixel2);
        }
        for (let p = 0; p < padding; p++) {
            bmpData.push(0);
        }
    }
    
    // Convert byte array to base64 string
    const base64String = btoa(String.fromCharCode.apply(null, bmpData));
    return `data:image/bmp;base64,${base64String}`;
}

// --- React Components ---

const PaletteDisplay: React.FC<{ title: string; colors: string[] }> = ({ title, colors }) => (
    <div>
        <h4 className="text-sm font-semibold text-gray-400 mt-2">{title}</h4>
        <div className="flex flex-wrap gap-1 mt-1">
            {colors.map((color, index) => (
                <div key={index} className="w-6 h-6 rounded border border-gray-600" style={{ backgroundColor: color }} title={color} />
            ))}
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
            ? { rloffset: '1E317E', tloffset: '1D38B0', lpoffset: '1D34A6', banoffset: '1DD370', hvpaloffset: '1D1B0A' }
            : { rloffset: '1D6F02', tloffset: '1C85B8', lpoffset: '1C81EE', banoffset: '1D16CC', hvpaloffset: '1C6982' };

        const increments = {
            rloffset: 0x30A,
            tloffset: 0x4D6,
            lpoffset: 0x20,
            banoffset: 0x2C0,
            hvpaloffset: 0x40,
        };
        
        const imageSizes = {
            rinkLogo: 0x30A, // 48x32
            teamLogo: 0x4D6, // 48x48
            banner: 0x168,   // 88x16 (This seems small, let's use 352 bytes -> 11 tiles)
        };


        for (let count = 0; count < teamcnt; count++) {
            const rloffset = parseInt(baseOffsets.rloffset, 16) + increments.rloffset * count;
            const tloffset = parseInt(baseOffsets.tloffset, 16) + increments.tloffset * count;
            const lpoffset = parseInt(baseOffsets.lpoffset, 16) + increments.lpoffset * count;
            const banoffset = parseInt(baseOffsets.banoffset, 16) + increments.banoffset * count;
            const hvpaloffset = parseInt(baseOffsets.hvpaloffset, 16) + increments.hvpaloffset * count;

            const logoPaletteRGB = parseGenesisPaletteRGB(romBuffer, lpoffset, 16);
            
            const toPaletteString = (rgb: [number,number,number][]) => rgb.map(c => `rgb(${c[0]},${c[1]},${c[2]})`);

            const rinkLogoTiles = parseTiles(new Uint8Array(romBuffer, rloffset, imageSizes.rinkLogo));
            const teamLogoTiles = parseTiles(new Uint8Array(romBuffer, tloffset, imageSizes.teamLogo));
            const bannerTiles = parseTiles(new Uint8Array(romBuffer, banoffset, 352)); // Corrected size for 88x16

            newImgoffsets.push({
                teamName: teams[count] ? `${teams[count].city} ${teams[count].name}` : `Team ${count + 1}`,
                rloffset,
                tloffset,
                lpoffset,
                banoffset,
                hvpaloffset,
                logoPalette: toPaletteString(logoPaletteRGB),
                homePalette: toPaletteString(parseGenesisPaletteRGB(romBuffer, hvpaloffset, 16)),
                visitorPalette: toPaletteString(parseGenesisPaletteRGB(romBuffer, hvpaloffset + 32, 16)),
                rinkLogoUrl: createIndexedBmp(rinkLogoTiles, logoPaletteRGB, 6), // 48px width -> 6 tiles
                teamLogoUrl: createIndexedBmp(teamLogoTiles, logoPaletteRGB, 6), // 48px width -> 6 tiles
                bannerUrl: createIndexedBmp(bannerTiles, logoPaletteRGB, 11), // 88px width -> 11 tiles
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
                            <PaletteDisplay title={`Home Palette (0x${data.hvpaloffset.toString(16).toUpperCase()})`} colors={data.homePalette} />
                            <PaletteDisplay title={`Away Palette (0x${(data.hvpaloffset + 32).toString(16).toUpperCase()})`} colors={data.visitorPalette} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
