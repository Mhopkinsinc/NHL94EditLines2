export type PlayerStatus = 'anchor' | 'rookie' | 'waivers';

export interface Player {
  id: string;
  name: string;
  role: 'Forward' | 'Defenseman' | 'Goalie';
  attributes: {
    jerseynum: number;
    agility: number;
    speed: number;
    handed: 0 | 1; // 0 for Left, 1 for Right
    oawareness: number;
    dawareness: number;
    shtpower: number;
    shtacc: number;
    passacc: number;
    stickhand: number;
    weight: number;
    endurance: number;
    aggressiveness: number;
    checking: number;
    fighting: number;
    roughness: number;
  };
  statusIcon?: PlayerStatus;
}

export type PositionType = 'LW' | 'C' | 'RW' | 'LD' | 'RD' | 'EX' | 'G';

export interface ForwardLine {
  LW: Player | null;
  C: Player | null;
  RW: Player | null;
  EX: Player | null;
}

export interface DefensePairing {
  LD: Player | null;
  RD: Player | null;
  G: Player | null;
}

export interface Lineup {
  forwardLines: [ForwardLine, ForwardLine, ForwardLine, ForwardLine, ForwardLine, ForwardLine, ForwardLine, ForwardLine];
  defensePairings: [DefensePairing, DefensePairing, DefensePairing, DefensePairing, DefensePairing, DefensePairing, DefensePairing, DefensePairing];
  roster: Player[];
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  teamName: string;
  description: string;
  previousLineup: Lineup;
}