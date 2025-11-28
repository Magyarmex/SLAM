import { cards, synergyNotes, matchupDecks, describeMatchup } from '../data/cards.js';

function assert(condition, message) {
  if (!condition) {
    console.error('❌', message);
    process.exitCode = 1;
  } else {
    console.log('✅', message);
  }
}

assert(cards.length > 20, 'card library contains many entries');
assert(new Set(cards.map((c) => c.name)).size === cards.length, 'card names are unique');
assert(synergyNotes.length >= 5, 'synergy bank is populated');

const [deckName] = Object.keys(matchupDecks);
assert(Array.isArray(matchupDecks[deckName]), 'matchup deck values are arrays');

const sampleNotes = describeMatchup(matchupDecks[deckName], matchupDecks[deckName]);
assert(Array.isArray(sampleNotes) && sampleNotes.length > 0, 'matchup description returns guidance');

const avgCost =
  cards.slice(0, 5).reduce((sum, card) => sum + (card.cost || 0), 0) / Math.max(1, cards.slice(0, 5).length);
assert(avgCost > 0, 'average cost math works');

console.log('Test run complete.');
