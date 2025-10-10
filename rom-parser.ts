
import type { Player } from './types';

export interface LineupPositions {
  LD: number;
  RD: number;
  LW: number;
  C: number;
  RW: number;
  EX: number;
  G: number;
}
export type TeamLineups = [
    LineupPositions, LineupPositions, LineupPositions, LineupPositions, 
    LineupPositions, LineupPositions, LineupPositions, LineupPositions
];

export interface RomData {
  cartridgeName: string;
  numberOfTeams: number;
  teamDataPointers: string[];
}

export interface TeamInfo {
  city: string;
  abv: string;
  name: string;
  playerDataOffset: number;
  playerDataSize: number;
  homePalette: Uint8Array;
  awayPalette: Uint8Array;
  teamPointer: number;
  players: Player[];
  numForwards: number;
  numDefensemen: number;
  numGoalies: number;
  totalPlayers: number;
  goalieRosterBytes: Uint8Array;
  lineups: TeamLineups;
}

/**
 * Helper to read a length-prefixed string from the DataView.
 * The format is 2 bytes for length (big-endian), followed by the string data.
 * The length includes the 2 length bytes themselves.
 * @param view The DataView for the ROM buffer.
 * @param offset The offset to start reading from.
 * @returns An object containing the decoded text and the total number of bytes read.
 */
const readString = (view: DataView, offset: number): { text: string; bytesRead: number } => {
    const length = view.getUint16(offset, false); // false for big-endian
    if (length <= 2) {
        return { text: '', bytesRead: 2 };
    }
    const stringBytes = new Uint8Array(view.buffer, offset + 2, length - 2);
    // Use 'latin1' for single-byte encoding which is common in old ROMs.
    const text = new TextDecoder('latin1').decode(stringBytes); 
    return { text, bytesRead: length };
};


/**
 * Parses player data for a single team from the ROM buffer.
 * @param arrayBuffer The ArrayBuffer of the ROM file.
 * @param teamPointer The memory offset for the start of the team's data.
 * @param playerDataOffset The offset from the teamPointer to the player data.
 * @param playerDataSize The size of the player data block.
 * @param numG Number of goalies.
 * @param numF Number of forwards.
 * @returns An array of Player objects.
 */
export const parsePlayersForTeam = (
    arrayBuffer: ArrayBuffer,
    teamPointer: number,
    playerDataOffset: number,
    playerDataSize: number,
    numG: number,
    numF: number,
): Player[] => {
    const romView = new DataView(arrayBuffer);
    const roster: Player[] = [];

    try {
        let currentOffset = teamPointer + playerDataOffset;
        const endOffset = currentOffset + playerDataSize;
        let playerCount = 0;

        while (currentOffset < endOffset) {
            const nameLength = romView.getUint16(currentOffset, false);
            // A name length of 0 often indicates padding/end of player data.
            if (nameLength === 0) {
                break;
            }
            currentOffset += 2;

            if (nameLength <= 2 || currentOffset + (nameLength - 2) > endOffset) {
                 // Invalid name length or would read past the end of the player data block.
                 break;
            }

            const nameBytes = new Uint8Array(arrayBuffer, currentOffset, nameLength - 2);
            let playerName = new TextDecoder('latin1').decode(nameBytes);
            playerName = playerName.replace(/[^ A-Za-z]/g, '').trim();
            currentOffset += nameLength - 2;

            // Jersey numbers are stored in Binary-Coded Decimal (BCD) format.
            // A byte like 0x93 represents the number 93.
            const jerseyByte = romView.getUint8(currentOffset);
            currentOffset += 1;
            const tens = jerseyByte >> 4;
            const ones = jerseyByte & 0x0F;
            const jerseyNumber = tens * 10 + ones;

            const attributesBytes = new Uint8Array(arrayBuffer, currentOffset, 7);
            currentOffset += 7;

            const weight = attributesBytes[0] >> 4;
            const agility = attributesBytes[0] & 0x0F;
            const speed = attributesBytes[1] >> 4;
            const oawareness = attributesBytes[1] & 0x0F;
            const dawareness = attributesBytes[2] >> 4;
            const shtpower = attributesBytes[2] & 0x0F;
            const checking = attributesBytes[3] >> 4;
            const handedValue = attributesBytes[3] & 0x0F;
            // Even = Left (0), Uneven = Right (1)
            const handed: 0 | 1 = (handedValue % 2 === 0) ? 0 : 1;
            const fighting = attributesBytes[3] & 0x0F;
            const stickhand = attributesBytes[4] >> 4;
            const shtacc = attributesBytes[4] & 0x0F;
            const endurance = attributesBytes[5] >> 4;
            const roughness = attributesBytes[5] & 0x0F;            
            const passacc = attributesBytes[6] >> 4;
            const aggressiveness = attributesBytes[6] & 0x0F;

            let role: 'Goalie' | 'Forward' | 'Defenseman';
            // The player data in the ROM is ordered: Goalies, then Forwards, then Defensemen.
            if (playerCount < numG) {
                role = 'Goalie';
            } else if (playerCount < numG + numF) {
                role = 'Forward';
            } else {
                role = 'Defenseman';
            }
            
            const id = `${playerName.toLowerCase().replace(/\s+/g, '-')}-${jerseyNumber}-${playerCount}`;

            const player: Player = {
                id,
                name: playerName,
                role,
                attributes: {
                    jerseynum: jerseyNumber,
                    agility,
                    speed,
                    handed,
                    oawareness,
                    dawareness,
                    shtpower,
                    shtacc,
                    passacc,
                    stickhand,
                    weight,
                    endurance,
                    aggressiveness,
                    checking,
                    fighting,
                    roughness
                }
            };
            roster.push(player);
            playerCount++;
        }
    } catch (error) {
        console.error(`Error parsing players for team at pointer 0x${teamPointer.toString(16).toUpperCase()}:`, error);
    }
    
    return roster;
};

/**
 * Parses information for a single team from the ROM buffer at a given pointer.
 * This is a TypeScript conversion of the provided Python method.
 * @param arrayBuffer The ArrayBuffer of the ROM file.
 * @param teamPointer The memory offset for the start of the team's data.
 * @returns A structured TeamInfo object, or null if parsing fails.
 */
export const getTeamInfo = (arrayBuffer: ArrayBuffer, teamPointer: number): Omit<TeamInfo, 'players' | 'teamPointer'> | null => {
  const romView = new DataView(arrayBuffer);

  try {
    // Player Data offset
    const playerDataOffset = romView.getUint16(teamPointer, false);
    // Team Name Data relative offset
    const teamNameDataRelativeOffset = romView.getUint16(teamPointer + 4, false);
    
    // Home and Away palette data (32 bytes each)
    const homePalette = new Uint8Array(arrayBuffer, teamPointer + 12, 32);
    const awayPalette = new Uint8Array(arrayBuffer, teamPointer + 44, 32);

    // Player Data Size calculation
    const playerDataSize = teamNameDataRelativeOffset - playerDataOffset - 2;

    // Start reading string data from its absolute offset
    let currentStringOffset = teamPointer + teamNameDataRelativeOffset;
    
    // Read Team City
    const cityResult = readString(romView, currentStringOffset);
    let city = cityResult.text;
    currentStringOffset += cityResult.bytesRead;

    // Read Team Abbreviation
    const abvResult = readString(romView, currentStringOffset);
    let abv = abvResult.text;
    currentStringOffset += abvResult.bytesRead;

    // Read Team Nickname
    const nameResult = readString(romView, currentStringOffset);
    let name = nameResult.text;
    
    // Clean strings as in the Python script to remove non-alphanumeric characters.
    city = city.replace(/[^A-Za-z ]/g, '').trim();
    abv = abv.replace(/[^A-Za-z]/g, '').trim();
    name = name.replace(/[^A-Za-z ]/g, '').trim();

    // Player counts based on https://nhl94.com/html/editing/edit_bin.php
    // Offset 0x4F from Team Pointer: High nibble = Forwards, Low nibble = Defensemen
    const fdByte = romView.getUint8(teamPointer + 0x4F);
    const numForwards = fdByte >> 4;
    const numDefensemen = fdByte & 0x0F;

    // The 4 bytes from 0x51 to 0x54 represent goalie roster spots.
    const goalieRosterBytes = new Uint8Array(arrayBuffer, teamPointer + 0x50, 2);
    
    // A non-zero value indicates a goalie.    
    const goaliehex = Array.from(goalieRosterBytes, b => b.toString(16).padStart(2, "0")).join("");
    const numGoalies = [...goaliehex].filter(c => c !== "0").length;

    const totalPlayers = numForwards + numDefensemen + numGoalies;
    
    // Parse lineup data. Offset is 0x52 from team pointer. 8 lines * 8 bytes each.
    const linesOffset = teamPointer + 0x52;
    const lineups: LineupPositions[] = [];
    for (let i = 0; i < 8; i++) {
        const lineOffset = linesOffset + (i * 8);
        // Byte 0 is always 0x01. Bytes 1-7 are player roster indices.
        // Order: LD, RD, LW, C, RW, EX, G
        const lineData: LineupPositions = {
            LD: romView.getUint8(lineOffset + 1),
            RD: romView.getUint8(lineOffset + 2),
            LW: romView.getUint8(lineOffset + 3),
            C: romView.getUint8(lineOffset + 4),
            RW: romView.getUint8(lineOffset + 5),
            EX: romView.getUint8(lineOffset + 6),
            G: romView.getUint8(lineOffset + 7),
        };
        lineups.push(lineData);
    }

    return {
      city,
      abv,
      name,
      playerDataOffset,
      playerDataSize,
      homePalette,
      awayPalette,
      numForwards,
      numDefensemen,
      numGoalies,
      totalPlayers,
      goalieRosterBytes,
      lineups: lineups as TeamLineups,
    };

  } catch (error) {
    console.error(`Error parsing team info at pointer 0x${teamPointer.toString(16).toUpperCase()}:`, error);
    return null;
  }
};


/**
 * Iterates through team pointers and parses data for all teams.
 * @param romData The basic ROM data containing pointers.
 * @param arrayBuffer The ArrayBuffer of the ROM file.
 * @returns An array of TeamInfo objects.
 */
export const parseAllTeams = (romData: RomData, arrayBuffer: ArrayBuffer): TeamInfo[] => {
    const teams: TeamInfo[] = [];
    for (const pointerStr of romData.teamDataPointers) {
        // Pointers from ROM are memory addresses, parse them from hex string to number.
        const pointer = parseInt(pointerStr, 16);
        const teamMetadata = getTeamInfo(arrayBuffer, pointer);
        if (teamMetadata) {
            const players = parsePlayersForTeam(
                arrayBuffer,
                pointer,
                teamMetadata.playerDataOffset,
                teamMetadata.playerDataSize,
                teamMetadata.numGoalies,
                teamMetadata.numForwards,
            );
            teams.push({ ...teamMetadata, players, teamPointer: pointer });
        }
    }
    return teams;
};

/**
 * Parses the ROM to find the pointers to each team's data.
 * It first reads the number of teams from a specific offset, then reads the data pointers.
 * @param arrayBuffer The ArrayBuffer of the ROM file.
 * @returns An object containing the number of teams and an array of team data pointers, or null if parsing fails.
 */
export const parseRomData = (arrayBuffer: ArrayBuffer): RomData | null => {
  const romView = new DataView(arrayBuffer);

  // 1. Read cartridge name from offset 0x120 to 0x14F
  const cartNameOffsetStart = 0x120;
  const cartNameOffsetEnd = 0x150;
  let cartridgeName = 'Unknown';
  if (arrayBuffer.byteLength >= cartNameOffsetEnd) {
      const nameBytes = new Uint8Array(arrayBuffer, cartNameOffsetStart, cartNameOffsetEnd - cartNameOffsetStart);
      // Decode as 'latin1' (ASCII compatible) and trim null characters/whitespace
      cartridgeName = new TextDecoder('latin1').decode(nameBytes).replace(/\0/g, '').trim();
  } else {
      console.warn("ROM is too small to read cartridge name.");
  }

  // 2. Read the number of teams from offset 0xF7923.
  const numTeamsOffset = 0xF7923;
  if (arrayBuffer.byteLength <= numTeamsOffset) {
    console.error("File is too small to read the number of teams at offset 0xF7923.");
    return null;
  }
  const numberOfTeams = romView.getUint8(numTeamsOffset);
  
  // 3. Calculate the total length of the team pointer table (number of teams * 4 bytes per pointer).
  const teamDataPointerTableOffset = 0x30E;
  const teamDataLength = numberOfTeams * 4;
  const chunkSize = 4;

  // 4. Ensure the buffer is large enough to read the entire pointer table.
  if (arrayBuffer.byteLength < teamDataPointerTableOffset + teamDataLength) {
    console.error("File is too small to read the full team data pointer table.");
    return null;
  }

  // 5. Get a view of the specific slice of the buffer containing the team pointers.
  const slice = arrayBuffer.slice(teamDataPointerTableOffset, teamDataPointerTableOffset + teamDataLength);
  const view = new DataView(slice);

  const chunks: string[] = [];
  
  // 6. Iterate through the slice and read each 4-byte pointer.
  for (let i = 0; i < teamDataLength; i += chunkSize) {
    // Read a 32-bit unsigned integer in big-endian format.
    const chunk = view.getUint32(i, false); // `false` for big-endian
    
    // Convert the 32-bit number to a padded, uppercase hexadecimal string.
    const hexChunk = '0x' + chunk.toString(16).toUpperCase().padStart(8, '0');
    chunks.push(hexChunk);
  }

  return {
    cartridgeName,
    numberOfTeams,
    teamDataPointers: chunks,
  };
};

/**
 * Calculates and updates the checksum for a Sega Genesis ROM.
 * The checksum is a 16-bit sum of all 16-bit words from address 0x200 to the end of the ROM.
 * The result is stored at address 0x18E.
 * @param romBuffer The ArrayBuffer of the ROM file that will be modified.
 * @returns The same ArrayBuffer that was passed in, but with the corrected checksum.
 */
export const updateRomChecksum = (romBuffer: ArrayBuffer): ArrayBuffer => {
    // A ROM's checksum is stored at 0x18E (2 bytes, big-endian).
    const checksumAddress = 0x18E;
    // The checksum calculation begins at address 0x200.
    const calculationStartAddress = 0x200;

    // We modify the buffer in place.
    const romView = new DataView(romBuffer);

    let calculatedChecksum = 0;

    // Sum all 16-bit words (big-endian) from 0x200 to the end of the ROM.
    for (let i = calculationStartAddress; i < romView.byteLength; i += 2) {
        // If there's an odd byte at the end, it's ignored.
        if (i + 1 >= romView.byteLength) {
            break;
        }
        // Read a 16-bit word in big-endian format.
        const word = romView.getUint16(i, false);
        calculatedChecksum = (calculatedChecksum + word) & 0xFFFF;
    }

    // Write the new 16-bit checksum back to the header at 0x18E in big-endian format.
    romView.setUint16(checksumAddress, calculatedChecksum, false);

    return romBuffer;
};
