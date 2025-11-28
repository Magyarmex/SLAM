import { cards, synergyNotes, matchupDecks, describeMatchup } from '../data/cards.js';

const storage = window.localStorage;
const logger = createLogger();
const state = {
  reaction: [],
  lastPlacement: null,
  elixirScore: [],
  cycleHistory: [],
  scenarioWins: 0,
};

init();

function init() {
  wireHero();
  setupReaction();
  setupTiming();
  setupPlacement();
  setupElixir();
  setupScenarios();
  setupDeckLab();
  setupSimulator();
  renderProgress();
  pushMetrics();
  logger.log('Dojo initialized with cards: ' + cards.length, 'info');
}

function wireHero() {
  document.getElementById('startTraining').addEventListener('click', () => {
    document.getElementById('drills').scrollIntoView({ behavior: 'smooth' });
    logger.log('User jumped to drills', 'debug');
  });
  document.getElementById('openDeckLab').addEventListener('click', () => {
    document.getElementById('decklab').scrollIntoView({ behavior: 'smooth' });
    logger.log('User jumped to deck lab', 'debug');
  });
}

function setupReaction() {
  const area = document.getElementById('reactionArea');
  const start = document.getElementById('startReaction');
  const reset = document.getElementById('resetReaction');
  const stats = document.getElementById('reactionStats');
  let active = false;
  let startTime;
  const saved = JSON.parse(storage.getItem('reactionTimes') || '[]');
  state.reaction = saved;
  renderStats();

  start.addEventListener('click', () => {
    area.textContent = 'Preparing...';
    area.classList.remove('ready');
    const delay = 800 + Math.random() * 2000;
    setTimeout(() => {
      startTime = performance.now();
      active = true;
      area.textContent = 'TAP!';
      area.style.color = '#fbbf24';
    }, delay);
  });

  area.addEventListener('click', () => {
    if (!active) return;
    const elapsed = Math.round(performance.now() - startTime);
    state.reaction.push(elapsed);
    storage.setItem('reactionTimes', JSON.stringify(state.reaction));
    active = false;
    area.textContent = `Hit: ${elapsed} ms`;
    area.style.color = '#e2e8f0';
    renderStats();
    pushMetrics();
    renderProgress();
  });

  reset.addEventListener('click', () => {
    state.reaction = [];
    storage.removeItem('reactionTimes');
    renderStats();
    area.textContent = 'Waiting...';
    logger.log('Reaction stats reset', 'warn');
  });

  function renderStats() {
    stats.innerHTML = '';
    if (!state.reaction.length) {
      stats.innerHTML = '<li>No attempts yet.</li>';
      return;
    }
    const best = Math.min(...state.reaction);
    const avg = Math.round(state.reaction.reduce((a, b) => a + b, 0) / state.reaction.length);
    const median = [...state.reaction].sort((a, b) => a - b)[Math.floor(state.reaction.length / 2)];
    document.getElementById('reactionBest').textContent = `${best} ms`;
    stats.innerHTML = `
      <li>Attempts: ${state.reaction.length}</li>
      <li>Best: ${best} ms</li>
      <li>Median: ${median} ms</li>
      <li>Average: ${avg} ms</li>
    `;
  }
}

function setupTiming() {
  const start = document.getElementById('startTiming');
  const cast = document.getElementById('castLog');
  const barrel = document.getElementById('barrel');
  const feedback = document.getElementById('timingFeedback');
  let anim;
  let playing = false;
  let laneStart;
  const laneWidth = document.querySelector('.timing-lane').getBoundingClientRect().width;
  const targetStart = laneWidth - 80;

  start.addEventListener('click', () => {
    playing = true;
    const runStart = performance.now();
    laneStart = runStart;
    cancelAnimationFrame(anim);
    const speed = 0.22 + Math.random() * 0.08;
    function tick(now) {
      const elapsed = now - runStart;
      const progress = Math.min(1, elapsed * speed / laneWidth);
      barrel.style.transform = `translateX(${progress * (laneWidth + 60)}px)`;
      if (progress < 1 && playing) anim = requestAnimationFrame(tick);
      if (progress >= 1) playing = false;
    }
    requestAnimationFrame(tick);
    feedback.textContent = 'Barrel incoming...';
  });

  cast.addEventListener('click', () => {
    if (!laneStart) {
      feedback.textContent = 'Start the lane first.';
      return;
    }
    const now = performance.now();
    const elapsed = now - laneStart;
    const landingTime = laneWidth * (1 / 0.3);
    const delta = Math.abs(landingTime - elapsed);
    const rating = delta < 80 ? 'Perfect catch!' : delta < 160 ? 'Decent timing.' : 'Late/early cast.';
    feedback.textContent = `${rating} Offset ${Math.round(delta)}ms.`;
    logger.log(`Spell timing delta ${Math.round(delta)}ms`, delta < 120 ? 'info' : 'warn');
    state.scenarioWins += delta < 160 ? 1 : 0;
    renderProgress();
  });
}

function setupPlacement() {
  const arena = document.getElementById('arena');
  const scenarioBox = document.getElementById('placementScenario');
  const feedback = document.getElementById('placementFeedback');
  const tipsList = document.getElementById('placementTips');
  const debug = document.getElementById('placementDebug');
  const newBtn = document.getElementById('newPlacement');
  const validateBtn = document.getElementById('validatePlacement');
  arena.innerHTML = '';
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      arena.appendChild(cell);
    }
  }
  const marker = document.createElement('div');
  marker.className = 'marker';
  arena.appendChild(marker);
  let placement = { col: 4, row: 9 };
  placeMarker();

  const scenarios = [
    { text: 'Hog Rider inbound - activate King with Tornado', target: { col: 4, row: 5 }, tip: 'Pull to center and one tile toward king tower.' },
    { text: 'Balloon push - Tesla pull to center 4-3 placement', target: { col: 5, row: 6 }, tip: 'Buildings need to be 4 tiles from river and centered.' },
    { text: 'Giant beatdown - kite with Ice Golem', target: { col: 4, row: 7 }, tip: 'Place one tile above king to re-target support troops.' },
  ];

  let currentScenario = scenarios[0];
  applyScenario();

  arena.addEventListener('click', (e) => {
    if (!e.target.classList.contains('cell')) return;
    placement = { col: Number(e.target.dataset.col), row: Number(e.target.dataset.row) };
    placeMarker();
  });

  newBtn.addEventListener('click', () => {
    currentScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    applyScenario();
    logger.log('New placement scenario', 'info');
  });

  validateBtn.addEventListener('click', () => {
    const dist = distance(placement, currentScenario.target);
    const accuracy = Math.max(0, 100 - dist * 15);
    feedback.textContent = dist < 0.2 ? 'Pixel perfect! King tower activated.' : `Accuracy ${Math.round(accuracy)}%`;
    state.lastPlacement = accuracy;
    storage.setItem('lastPlacement', String(accuracy));
    debug.textContent = `dx ${Math.abs(placement.col - currentScenario.target.col).toFixed(1)}, dy ${Math.abs(placement.row - currentScenario.target.row).toFixed(1)}`;
    document.getElementById('placementAccuracy').textContent = `${Math.round(accuracy)}%`;
    renderProgress();
  });

  function placeMarker() {
    const cellSize = arena.getBoundingClientRect().width / 10;
    marker.style.left = `${placement.col * cellSize + cellSize / 2}px`;
    marker.style.top = `${placement.row * (arena.getBoundingClientRect().height / 12) + cellSize / 2}px`;
  }

  function applyScenario() {
    scenarioBox.textContent = currentScenario.text;
    feedback.textContent = 'Drag the marker to the grid.';
    tipsList.innerHTML = scenarios.map((s) => `<li>${s.tip}</li>`).join('');
  }
}

function setupElixir() {
  const question = document.getElementById('elixirQuestion');
  const feedback = document.getElementById('elixirFeedback');
  const answer = document.getElementById('elixirAnswer');
  const submit = document.getElementById('submitElixir');
  const next = document.getElementById('nextElixir');
  const debug = document.getElementById('elixirDebug');
  let current;

  function newQuiz() {
    const friendly = randomCard();
    const enemy = randomCard();
    const diff = enemy.cost - friendly.cost;
    current = { friendly, enemy, diff };
    question.textContent = `You used ${friendly.name} (${friendly.cost}) on their ${enemy.name} (${enemy.cost}). What is the trade for you? (positive = you are up)`;
    answer.value = '';
    feedback.textContent = '';
    debug.textContent = `Checking cost delta ${diff}`;
  }

  submit.addEventListener('click', () => {
    const val = Number(answer.value);
    if (Number.isNaN(val)) return;
    const correct = val === current.diff;
    feedback.textContent = correct ? 'Correct trade read.' : `Off by ${current.diff - val}.`;
    state.elixirScore.push(correct);
    storage.setItem('elixirScore', JSON.stringify(state.elixirScore));
    document.getElementById('elixirScore').textContent = `${scorePercent(state.elixirScore)}%`;
    renderProgress();
  });

  next.addEventListener('click', newQuiz);
  newQuiz();

  // cycle tracking
  const cycleDeck = document.getElementById('cycleDeck');
  const cyclePrompt = document.getElementById('cyclePrompt');
  const cycleInput = document.getElementById('cycleInput');
  const cycleButton = document.getElementById('submitCycle');
  let cycle;

  function newCycle() {
    const deck = shuffle([...cards]).slice(0, 8).map((c) => c.name);
    const played = [];
    for (let i = 0; i < 6; i++) played.push(deck[i % deck.length]);
    const cardToReturn = played[0];
    cycle = { deck, played, answer: cardToReturn };
    cycleDeck.innerHTML = deck.map((c) => `<span class="tag">${c}</span>`).join('');
    cyclePrompt.textContent = `Plays so far: ${played.join(' -> ')}. Which card is back in hand?`;
    cycleInput.value = '';
  }

  cycleButton.addEventListener('click', () => {
    const guess = cycleInput.value.trim();
    if (!guess) return;
    const correct = guess.toLowerCase() === cycle.answer.toLowerCase();
    document.getElementById('cycleFeedback').textContent = correct ? 'Right read on rotation.' : `Actually ${cycle.answer}.`;
    state.cycleHistory.push(correct);
    renderProgress();
  });

  newCycle();
}

function setupScenarios() {
  const question = document.getElementById('scenarioQuestion');
  const options = document.getElementById('scenarioOptions');
  const feedback = document.getElementById('scenarioFeedback');
  const next = document.getElementById('nextScenario');
  const scenarios = [
    {
      prompt: 'Opponent Golem in back at 10 elixir; you play Hog cycle.',
      answers: [
        { text: 'Pressure opposite lane with Hog + support', best: true, reason: 'Punish their heavy spend and force defense.' },
        { text: 'Cycle Musketeer in back same lane', best: false, reason: 'Gives them tempo to stack support.' },
        { text: 'Wait and build elixir', best: false, reason: 'Missed punish window; you fall behind.' },
      ],
    },
    {
      prompt: 'Facing bait; they used Log on defense. What now?',
      answers: [
        { text: 'Send Goblin Barrel immediately', best: true, reason: 'Small spell is out of cycle creating a punish window.' },
        { text: 'Play slow in back', best: false, reason: 'Lets them cycle back safely.' },
      ],
    },
    {
      prompt: 'You defended with Valkyrie + Musketeer surviving at bridge.',
      answers: [
        { text: 'Support with Hog for counter-push', best: true, reason: 'Capitalize on spent elixir turning defense to offense.' },
        { text: 'Let them die and reset', best: false, reason: 'Wastes invested elixir advantage.' },
      ],
    },
  ];

  function renderScenario() {
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    feedback.textContent = '';
    options.innerHTML = '';
    question.textContent = scenario.prompt;
    scenario.answers.forEach((ans) => {
      const el = document.createElement('div');
      el.className = 'option';
      el.textContent = ans.text;
      el.addEventListener('click', () => {
        const correctness = ans.best;
        el.classList.add(correctness ? 'correct' : 'wrong');
        feedback.textContent = ans.reason;
        if (correctness) state.scenarioWins += 1;
        renderProgress();
      });
      options.appendChild(el);
    });
  }

  next.addEventListener('click', renderScenario);
  renderScenario();
}

function setupDeckLab() {
  const deckSlots = document.getElementById('deckSlots');
  const picker = document.getElementById('cardPicker');
  const add = document.getElementById('addCard');
  const clear = document.getElementById('clearDeck');
  const feedback = document.getElementById('deckFeedback');
  const synergyA = document.getElementById('synergyA');
  const synergyB = document.getElementById('synergyB');
  const synergyResult = document.getElementById('synergyResult');
  const matchupDeckA = document.getElementById('matchupDeckA');
  const matchupDeckB = document.getElementById('matchupDeckB');
  const matchupResult = document.getElementById('matchupResult');
  const deck = [];

  cards
    .map((c) => c.name)
    .sort()
    .forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      picker.appendChild(opt.cloneNode(true));
      synergyA.appendChild(opt.cloneNode(true));
      synergyB.appendChild(opt.cloneNode(true));
    });

  Object.keys(matchupDecks).forEach((key) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key;
    matchupDeckA.appendChild(opt.cloneNode(true));
    matchupDeckB.appendChild(opt.cloneNode(true));
  });

  function renderDeck() {
    deckSlots.innerHTML = deck.map((c, idx) => `<span class="tag" data-idx="${idx}">${c} ✕</span>`).join('');
    deckSlots.querySelectorAll('.tag').forEach((tag) => {
      tag.addEventListener('click', () => {
        deck.splice(Number(tag.dataset.idx), 1);
        renderDeck();
      });
    });
    feedback.innerHTML = deck.length
      ? evaluateDeck(deck)
      : 'Add up to 8 cards to get coaching feedback.';
  }

  add.addEventListener('click', () => {
    if (deck.length >= 8) return;
    deck.push(picker.value);
    renderDeck();
  });

  clear.addEventListener('click', () => {
    deck.splice(0, deck.length);
    renderDeck();
  });

  document.getElementById('showSynergy').addEventListener('click', () => {
    const a = synergyA.value;
    const b = synergyB.value;
    const found = synergyNotes.find(
      (s) => (s.pair[0] === a && s.pair[1] === b) || (s.pair[0] === b && s.pair[1] === a)
    );
    synergyResult.textContent = found ? found.note : 'No famous synergy logged; experiment and report back!';
  });

  document.getElementById('analyzeMatchup').addEventListener('click', () => {
    const a = matchupDeckA.value;
    const b = matchupDeckB.value;
    const notes = describeMatchup(matchupDecks[a], matchupDecks[b]);
    matchupResult.innerHTML = `
      <p><strong>${a}</strong> vs <strong>${b}</strong></p>
      <p>${notes.join(' ')}</p>
      <p>Deck A tools: ${matchupDecks[a].join(', ')}</p>
      <p>Deck B tools: ${matchupDecks[b].join(', ')}</p>
    `;
  });

  renderDeck();
}

function evaluateDeck(deck) {
  const costs = deck.map((name) => cards.find((c) => c.name === name)?.cost || 0);
  const avg = (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(1);
  const hasBuilding = deck.some((c) => ['Cannon', 'Tesla', 'Inferno Tower'].includes(c));
  const hasSplash = deck.some((c) => ['Valkyrie', 'Wizard', 'Executioner', 'Baby Dragon'].includes(c));
  const hasAir = deck.some((c) => ['Musketeer', 'Archers', 'Electro Wizard', 'Phoenix', 'Baby Dragon'].includes(c));
  const winCons = deck.filter((c) => ['Hog Rider', 'Golem', 'X-Bow', 'Goblin Barrel', 'Royal Hogs', 'Graveyard'].includes(c));
  const warnings = [];
  if (!hasBuilding) warnings.push('No defensive building; vulnerable to Hog/balloon.');
  if (!hasSplash) warnings.push('Low splash; add Valkyrie/Executioner to handle swarms.');
  if (!hasAir) warnings.push('Weak air defense; include Archers, Musketeer or Phoenix.');
  if (!winCons.length) warnings.push('No clear win condition detected.');
  const good = warnings.length ? '' : 'Balanced coverage across defense and offense.';
  return `Average elixir ${avg}. ${good} ${warnings.join(' ')}`;
}

function setupSimulator() {
  const picker = document.getElementById('scenarioPicker');
  const run = document.getElementById('runScenario');
  const log = document.getElementById('scenarioLog');
  const perf = document.getElementById('simPerformance');
  const debugConsole = document.getElementById('debugConsole');
  const scenarios = [
    {
      name: 'Bridge spam rush',
      steps: ['Bandit dashes in left lane', 'Battle Ram follows', 'Magic Archer at bridge'],
      target: 'Respond with mini-tank + building',
    },
    {
      name: 'Balloon freeze',
      steps: ['Balloon at bridge', 'Freeze ready', 'Support minions follow'],
      target: 'Place building 4-3, keep reset ready',
    },
    {
      name: 'X-Bow siege',
      steps: ['X-Bow at bridge', 'Tesla center', 'Ice Spirit + Archers cycle'],
      target: 'Tank with Knight and spell cycle',
    },
  ];

  scenarios.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.textContent = s.name;
    picker.appendChild(opt);
  });

  run.addEventListener('click', () => {
    const chosen = scenarios.find((s) => s.name === picker.value) || scenarios[0];
    const aggression = Number(document.getElementById('aggression').value);
    log.innerHTML = '';
    let time = 0;
    chosen.steps.forEach((step, idx) => {
      const delay = 400 + idx * (600 - aggression * 30);
      time += delay;
      setTimeout(() => {
        const line = `[${(time / 1000).toFixed(1)}s] ${step}`;
        appendLog(log, line);
        logger.log(line, 'debug');
        if (idx === chosen.steps.length - 1) {
          const response = `${chosen.target}; aggression ${aggression}/10`;
          appendLog(log, response);
          perf.textContent = `Run complete in ${(time / 1000).toFixed(1)}s. Recommended: ${chosen.target}.`;
          document.getElementById('simPerformance').dataset.last = time;
          renderProgress();
        }
      }, time);
    });
    debugConsole.innerHTML = logger.dump();
  });
}

function renderProgress() {
  const snapshot = document.getElementById('progressSnapshot');
  const goals = document.getElementById('goalList');
  const reactionBest = state.reaction.length ? Math.min(...state.reaction) : '--';
  const placement = state.lastPlacement ?? Number(storage.getItem('lastPlacement')) || 0;
  const elixir = scorePercent(state.elixirScore);
  const cycles = scorePercent(state.cycleHistory);
  const beltScore = Math.round(
    (normalizeMetric(reactionBest, 1200) + placement + elixir + cycles + state.scenarioWins * 5) / 5
  );
  snapshot.innerHTML = `
    <li>Reaction best: ${reactionBest} ms</li>
    <li>Placement accuracy: ${Math.round(placement)}%</li>
    <li>Elixir reads: ${elixir}% correct</li>
    <li>Cycle reads: ${cycles}% correct</li>
    <li>Scenario solves: ${state.scenarioWins}</li>
    <li>Dojo belt score: ${beltScore}</li>
  `;
  goals.innerHTML = '';
  if (reactionBest === '--' || reactionBest > 350) goals.innerHTML += '<li>Push reaction under 350ms with 5 perfect hits.</li>';
  if (placement < 90) goals.innerHTML += '<li>Drill King activation until you hit 90%+ accuracy.</li>';
  if (elixir < 80) goals.innerHTML += '<li>Run 5 elixir quizzes in a row aiming for 80% accuracy.</li>';
  if (cycles < 70) goals.innerHTML += '<li>Memorize 2 decks and replay the cycle drill.</li>';
  if (!goals.innerHTML) goals.innerHTML = '<li>Keep stacking wins – you are black belt ready.</li>';
}

function pushMetrics() {
  const heroMetrics = document.getElementById('heroMetrics');
  heroMetrics.innerHTML = `
    <span class="tag">Attempts ${state.reaction.length}</span>
    <span class="tag">Placements scored ${state.lastPlacement ?? '0'}%</span>
    <span class="tag">Elixir IQ ${scorePercent(state.elixirScore)}%</span>
  `;
}

function appendLog(el, text) {
  const line = document.createElement('div');
  line.textContent = text;
  el.appendChild(line);
}

function randomCard() {
  return cards[Math.floor(Math.random() * cards.length)];
}

function scorePercent(arr) {
  if (!arr.length) return 0;
  const good = arr.filter(Boolean).length;
  return Math.round((good / arr.length) * 100);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function distance(a, b) {
  return Math.sqrt((a.col - b.col) ** 2 + (a.row - b.row) ** 2) / 10;
}

function normalizeMetric(value, max) {
  if (!value || value === '--') return 0;
  return Math.max(0, Math.min(100, 100 - (value / max) * 100));
}

function createLogger() {
  const entries = [];
  return {
    log(message, level = 'info') {
      const entry = `${new Date().toLocaleTimeString()} [${level}] ${message}`;
      entries.push(entry);
      if (entries.length > 50) entries.shift();
    },
    dump() {
      return entries.slice(-8).map((e) => `<div>${e}</div>`).join('');
    },
  };
}
