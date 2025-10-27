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
}

const parseGenesisPalette = (buffer: ArrayBuffer, offset: number, numColors: number): string[] => {
    if (offset + numColors * 2 > buffer.byteLength || offset < 0) {
        return Array(numColors).fill('rgb(128,128,128)'); // Return gray for out of bounds
    }

    const view = new DataView(buffer);
    const colors: string[] = [];

    for (let i = 0; i < numColors; i++) {
        const colorWord = view.getUint16(offset + i * 2, false); // false for big-endian
        // Sega Genesis color format: 0000 bbb ggg rrr
        const b = (colorWord >> 8) & 0b111;
        const g = (colorWord >> 4) & 0b111;
        const r = (colorWord >> 0) & 0b111;

        // Scale 3-bit color (0-7) to 8-bit (0-255)
        const r_8bit = Math.round((r / 7) * 255);
        const g_8bit = Math.round((g / 7) * 255);
        const b_8bit = Math.round((b / 7) * 255);

        colors.push(`rgb(${r_8bit}, ${g_8bit}, ${b_8bit})`);
    }
    return colors;
};

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

export const MenuLogos: React.FC<{ romBuffer: ArrayBuffer | null, teams: TeamInfo[], numberOfTeams: number }> = ({ romBuffer, teams, numberOfTeams }) => {
    const processedData = useMemo<ProcessedTeamData[]>(() => {
        if (!romBuffer || teams.length === 0) return [];

        const romtype = numberOfTeams;
        const teamcnt = numberOfTeams;
        const newImgoffsets: ProcessedTeamData[] = [];

        const baseOffsets: BaseOffsets = romtype === 32
            ? {
                rloffset: '1E317E',
                tloffset: '1D38B0',
                lpoffset: '1D34A6',
                banoffset: '1DD370',
                hvpaloffset: '1D1B0A',
                }
            : {
                rloffset: '1D6F02',
                tloffset: '1C85B8',
                lpoffset: '1C81EE',
                banoffset: '1D16CC',
                hvpaloffset: '1C6982',
                };

        const increments = {
            rloffset: parseInt('30A', 16),
            tloffset: parseInt('4D6', 16),
            lpoffset: parseInt('20', 16),
            banoffset: parseInt('2C0', 16),
            hvpaloffset: parseInt('40', 16),
        };

        for (let count = 0; count < teamcnt; count++) {
            const rloffset = parseInt(baseOffsets.rloffset, 16) + increments.rloffset * count;
            const tloffset = parseInt(baseOffsets.tloffset, 16) + increments.tloffset * count;
            const lpoffset = parseInt(baseOffsets.lpoffset, 16) + increments.lpoffset * count;
            const banoffset = parseInt(baseOffsets.banoffset, 16) + increments.banoffset * count;
            const hvpaloffset = parseInt(baseOffsets.hvpaloffset, 16) + increments.hvpaloffset * count;

            newImgoffsets.push({
                teamName: teams[count] ? `${teams[count].city} ${teams[count].name}` : `Team ${count + 1}`,
                rloffset,
                tloffset,
                lpoffset,
                banoffset,
                hvpaloffset,
                logoPalette: parseGenesisPalette(romBuffer, lpoffset, 16),
                homePalette: parseGenesisPalette(romBuffer, hvpaloffset, 16),
                visitorPalette: parseGenesisPalette(romBuffer, hvpaloffset + 32, 16),
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedData.map(data => (
                    <div key={data.teamName} className="bg-[#212934] p-4 rounded-lg border border-sky-500/20">
                        <h3 className="text-lg font-bold text-sky-300 truncate" title={data.teamName}>{data.teamName}</h3>
                        <div className="mt-3 space-y-2 text-sm">
                            <p><span className="font-semibold text-gray-400">Rink Logo Offset:</span> <code className="font-mono text-gray-300">0x{data.rloffset.toString(16).toUpperCase()}</code></p>
                            <p><span className="font-semibold text-gray-400">Team Logo Offset:</span> <code className="font-mono text-gray-300">0x{data.tloffset.toString(16).toUpperCase()}</code></p>
                            <p><span className="font-semibold text-gray-400">Banner Offset:</span> <code className="font-mono text-gray-300">0x{data.banoffset.toString(16).toUpperCase()}</code></p>
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
