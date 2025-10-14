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
    endurance,
  } = player.attributes;

  const total =
    (agility * 2) +
    (speed * 3) +
    (oawareness * 3) +
    (dawareness * 2) +
    (shtpower * 1) +
    (checking * 2) +
    (stickhand * 3) +
    (shtacc * 2) +
    (endurance * 1) +
    (passacc * 1);

  let overall: number;

  if (total < 50) {
    overall = Math.round(total / 2) + 25;
  } else if (total > 99) {
    overall = 99;
  } else {
    overall = total;
  }

  return overall;
};
