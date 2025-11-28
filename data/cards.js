export const cards = [
  { name: 'Hog Rider', cost: 4, roles: ['win-con', 'ground'], tags: ['cycle', 'pressure'] },
  { name: 'Musketeer', cost: 4, roles: ['ranged', 'air-d'], tags: ['support'] },
  { name: 'Fireball', cost: 4, roles: ['spell', 'splash'], tags: ['medium spell'] },
  { name: 'Log', cost: 2, roles: ['spell', 'small-spell'], tags: ['knockback'] },
  { name: 'Cannon', cost: 3, roles: ['building', 'ground-d'], tags: ['cycle'] },
  { name: 'Skeletons', cost: 1, roles: ['cycle', 'ground'], tags: ['cheap'] },
  { name: 'Ice Spirit', cost: 1, roles: ['cycle', 'air-d'], tags: ['cheap', 'reset'] },
  { name: 'Knight', cost: 3, roles: ['tank', 'ground-d'], tags: ['cheap'] },
  { name: 'Inferno Tower', cost: 5, roles: ['building', 'tank-killer'], tags: ['reset-vulnerable'] },
  { name: 'Tesla', cost: 4, roles: ['building', 'air-d'], tags: ['versatile'] },
  { name: 'Valkyrie', cost: 4, roles: ['splash', 'ground-d'], tags: ['mini-tank'] },
  { name: 'Wizard', cost: 5, roles: ['splash', 'ranged'], tags: ['slow'] },
  { name: 'Mini P.E.K.K.A', cost: 4, roles: ['tank-killer'], tags: ['single-target'] },
  { name: 'Prince', cost: 5, roles: ['tank-killer'], tags: ['charge'] },
  { name: 'Archers', cost: 3, roles: ['ranged', 'air-d'], tags: ['cycle'] },
  { name: 'Golem', cost: 8, roles: ['win-con', 'tank'], tags: ['beatdown'] },
  { name: 'Night Witch', cost: 4, roles: ['support', 'air-d'], tags: ['synergy-bats'] },
  { name: 'Baby Dragon', cost: 4, roles: ['splash', 'air-d'], tags: ['splash'] },
  { name: 'Graveyard', cost: 5, roles: ['win-con', 'spell'], tags: ['skeletons'] },
  { name: 'Poison', cost: 4, roles: ['spell', 'splash'], tags: ['control'] },
  { name: 'X-Bow', cost: 6, roles: ['win-con', 'siege'], tags: ['building'] },
  { name: 'Rocket', cost: 6, roles: ['spell', 'burst'], tags: ['high-damage'] },
  { name: 'Goblin Barrel', cost: 3, roles: ['win-con', 'spell'], tags: ['bait'] },
  { name: 'Princess', cost: 3, roles: ['ranged', 'chip'], tags: ['bait'] },
  { name: 'Goblin Gang', cost: 3, roles: ['swarm', 'ground-d'], tags: ['bait'] },
  { name: 'Tornado', cost: 3, roles: ['spell', 'control'], tags: ['king-activation'] },
  { name: 'Executioner', cost: 5, roles: ['splash', 'ranged'], tags: ['synergy-nado'] },
  { name: 'Mega Knight', cost: 7, roles: ['tank', 'splash'], tags: ['punish'] },
  { name: 'Royal Hogs', cost: 5, roles: ['win-con', 'split'], tags: ['dual-lane'] },
  { name: 'Earthquake', cost: 3, roles: ['spell', 'structure'], tags: ['building-hate'] },
  { name: 'Fisherman', cost: 3, roles: ['control'], tags: ['pull'] },
  { name: 'Electro Wizard', cost: 4, roles: ['reset', 'air-d'], tags: ['stun'] },
  { name: 'Ice Golem', cost: 2, roles: ['kite', 'tank'], tags: ['cycle'] },
  { name: 'Archer Queen', cost: 5, roles: ['champion', 'ranged'], tags: ['ability'] },
  { name: 'Monk', cost: 4, roles: ['champion', 'tank'], tags: ['reflect'] },
  { name: 'Phoenix', cost: 4, roles: ['air-d', 'splash'], tags: ['revive'] },
];

export const synergyNotes = [
  { pair: ['Golem', 'Night Witch'], note: 'Classic beatdown: bats plus tank pressure; support with Baby Dragon for splash.' },
  { pair: ['Executioner', 'Tornado'], note: 'Clump and cleave: Tornado groups troops for Executioner swings and king activations.' },
  { pair: ['Hog Rider', 'Ice Spirit'], note: 'Freeze support reduces tower shots and helps bypass cheap defenses.' },
  { pair: ['Goblin Barrel', 'Princess'], note: 'Bait core: Princess chip forces small spells, opening Barrel opportunities.' },
  { pair: ['Graveyard', 'Poison'], note: 'Toxic rain: Poison denies counters while skeletons stack for tower damage.' },
  { pair: ['Royal Hogs', 'Earthquake'], note: 'Structure shred: Earthquake clears buildings so Hogs connect reliably.' },
  { pair: ['Rocket', 'X-Bow'], note: 'Control siege: defend X-Bow locks with Rocket cycle for chip finish.' },
  { pair: ['Electro Wizard', 'Inferno Tower'], note: 'Reset assistance keeps Inferno from being reset; also handles support swarms.' },
  { pair: ['Phoenix', 'Monk'], note: 'Two-lives phoenix behind Monk reflect punishes spells and brawls through splash.' },
];

export const matchupDecks = {
  '2.6 Hog Cycle': ['Hog Rider', 'Musketeer', 'Fireball', 'Log', 'Cannon', 'Skeletons', 'Ice Spirit', 'Ice Golem'],
  'Golem Beatdown': ['Golem', 'Night Witch', 'Baby Dragon', 'Tornado', 'Poison', 'Mega Knight', 'Electro Wizard', 'Phoenix'],
  'X-Bow Siege': ['X-Bow', 'Tesla', 'Rocket', 'Ice Spirit', 'Skeletons', 'Fireball', 'Archers', 'Log'],
  'Bait Core': ['Goblin Barrel', 'Prince', 'Princess', 'Inferno Tower', 'Goblin Gang', 'Rocket', 'Log', 'Knight'],
  'Royal Hogs EQ': ['Royal Hogs', 'Earthquake', 'Fireball', 'Skeletons', 'Cannon', 'Ice Spirit', 'Phoenix', 'Monk'],
};

export function describeMatchup(deckA, deckB) {
  const quick = [];
  if (deckA.includes('Hog Rider') && deckB.includes('Building')) {
    quick.push('Watch for building pulls; pre-log against Tornado or Cannon setups.');
  }
  if (deckA.includes('X-Bow')) {
    quick.push('Protect X-Bow with cheap cycle; track opponent big spells.');
  }
  if (deckB.includes('Golem')) {
    quick.push('Punish elixir-heavy starts; hold Inferno/PEKKA for tank removal.');
  }
  if (!quick.length) quick.push('Play for elixir trades and protect your win condition.');
  return quick;
}
