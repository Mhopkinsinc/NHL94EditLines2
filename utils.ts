import type { Player } from './types';

export const calculateSkaterOverall = (player: Player): number => {
  if (player.role === 'Goalie') return 0;

  const {
    agility,
    speed,
    oawareness,
    dawareness,
    shtpower,
    shtacc,
    passacc,
    stickhand,
    checking,
  } = player.attributes;

  const sum =
    agility +
    speed +
    oawareness +
    dawareness +
    shtpower +
    shtacc +
    passacc +
    stickhand +
    checking;
  
  // Max possible sum is 9 attributes * 6 max value = 54
  const maxSum = 54;
  
  const overall = Math.round((sum / maxSum) * 100);
  
  return Math.min(100, overall);
};
