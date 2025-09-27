const filesPath = '../word-bank/greek/files.json';
const datasetSelect = document.getElementById('dataset-select');
const loadButton = document.getElementById('load-button');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const greekWordEl = document.getElementById('greek-word');
const playfield = document.getElementById('playfield');
const feedbackEl = document.getElementById('feedback');
const roundEl = document.getElementById('round');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const datasetLabelEl = document.getElementById('dataset-label');

const datasetCache = new Map();
let filesMap = {};
const spawnTimers = [];

const gameState = {
  datasetKey: null,
  wordPool: [],
  deck: [],
  reviewQueue: [],
  reviewSet: new Set(),
  playing: false,
  round: 0,
  score: 0,
  lives: 3,
  activeWord: null,
  roundActive: false
};

const HEART = '❤';

async function init() {
  try {
    const response = await fetch(filesPath);
    if (!response.ok) throw new Error('Unable to load files.json');
    filesMap = await response.json();
    populateDatasetSelect(filesMap);
  } catch (error) {
    console.error(error);
    setFeedback('Failed to load vocabulary mapping. Check console.', 'error');
    loadButton.disabled = true;
    startButton.disabled = true;
  }
}

function populateDatasetSelect(map) {
  datasetSelect.innerHTML = '';
  Object.entries(map).forEach(([label, file]) => {
    const option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    option.dataset.file = file;
    datasetSelect.appendChild(option);
  });
  if (datasetSelect.children.length) {
    datasetSelect.value = datasetSelect.children[0].value;
  }
}

loadButton.addEventListener('click', async () => {
  const { value } = datasetSelect;
  if (!value) return;
  try {
    const pool = await loadDataset(value);
    if (!pool.length) {
      setFeedback('No vocabulary entries with meanings were found.', 'error');
      return;
    }
    gameState.datasetKey = value;
    gameState.wordPool = pool;
    datasetLabelEl.textContent = value;
    setFeedback(`Loaded ${pool.length} entries. Press Start to play.`, 'success');
    startButton.disabled = false;
  } catch (error) {
    console.error(error);
    setFeedback('Unable to load that vocabulary set.', 'error');
  }
});

startButton.addEventListener('click', () => {
  if (!gameState.wordPool.length) {
    setFeedback('Load a vocabulary list first.', 'error');
    return;
  }
  startGame();
});

stopButton.addEventListener('click', () => {
  stopGame('Game stopped.');
});

async function loadDataset(label) {
  if (datasetCache.has(label)) {
    return datasetCache.get(label);
  }
  const file = filesMap[label];
  if (!file) throw new Error(`Unknown vocabulary file for ${label}`);
  const response = await fetch(`../word-bank/greek/${file}`);
  if (!response.ok) throw new Error(`Failed to fetch ${file}`);
  const payload = await response.json();
  const entries = extractEntries(payload);
  datasetCache.set(label, entries);
  return entries;
}

function extractEntries(payload) {
  const entries = [];
  const pushItem = (item) => {
    if (!item || !item.word) return;
    const meaning = pickMeaning(item.meanings);
    if (!meaning) return;
    const entry = {
      word: item.word.normalize('NFC'),
      meaning,
      meaningFull: meaning.full,
      meaningShort: meaning.short,
      partOfSpeech: item.partOfSpeech || '',
      frequency: Number.isFinite(item.frequency) ? item.frequency : null
    };
    entries.push(entry);
  };

  if (Array.isArray(payload)) {
    payload.forEach(pushItem);
  } else if (payload && typeof payload === 'object') {
    Object.values(payload).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach(pushItem);
      }
    });
  }
  return entries;
}

function pickMeaning(meanings) {
  if (!meanings) return null;
  let raw = Array.isArray(meanings) ? meanings.find((m) => typeof m === 'string' && m.trim()) : meanings;
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const kjvIndex = cleaned.toUpperCase().indexOf('KJV:');
  if (kjvIndex > 0) {
    cleaned = cleaned.slice(0, kjvIndex).trim();
  }
  if (!cleaned) return null;
  const snippet = cleaned.split(/(?<=\w)[.;]|,(?![^()]*\))/)[0].trim();
  const shortText = snippet.slice(0, 70).trim();
  return {
    full: cleaned,
    short: shortText.length < cleaned.length ? `${shortText}…` : shortText
  };
}

function startGame() {
  gameState.playing = true;
  gameState.round = 0;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.deck = shuffle(gameState.wordPool);
  gameState.reviewQueue = [];
  gameState.reviewSet = new Set();
  scoreEl.textContent = '0';
  roundEl.textContent = '0';
  livesEl.textContent = HEART.repeat(gameState.lives);
  startButton.disabled = true;
  stopButton.disabled = false;
  setFeedback('Game on! Shoot the matching meanings.', 'success');
  nextRound();
}

function stopGame(message = '') {
  gameState.playing = false;
  gameState.roundActive = false;
  clearPlayfield();
  greekWordEl.textContent = '—';
  startButton.disabled = false;
  stopButton.disabled = true;
  if (message) setFeedback(message, 'error');
}

function nextRound() {
  if (!gameState.playing) return;
  if (gameState.lives <= 0) {
    endGame('All lives lost.');
    return;
  }
  gameState.round += 1;
  roundEl.textContent = String(gameState.round);

  const word = pickWord();
  gameState.activeWord = word;
  greekWordEl.textContent = word.word;

  const options = buildOptions(word);
  gameState.roundActive = true;
  spawnTargets(options);
}

function pickWord() {
  if (gameState.reviewQueue.length) {
    const entry = gameState.reviewQueue.shift();
    gameState.reviewSet.delete(entry.word);
    return entry;
  }

  if (!gameState.deck.length) {
    gameState.deck = shuffle(gameState.wordPool);
  }

  return gameState.deck.shift();
}

function buildOptions(correctEntry) {
  const meanings = new Map();
  meanings.set(correctEntry.meaningShort, {
    text: correctEntry.meaningShort,
    full: correctEntry.meaningFull,
    correct: true
  });

  const pool = shuffle(gameState.wordPool.filter((entry) => entry !== correctEntry));
  for (const entry of pool) {
    if (meanings.size >= 4) break;
    if (!entry.meaningShort || meanings.has(entry.meaningShort)) continue;
    meanings.set(entry.meaningShort, {
      text: entry.meaningShort,
      full: entry.meaningFull,
      correct: false
    });
  }

  const options = Array.from(meanings.values());
  return shuffle(options);
}

function spawnTargets(options) {
  clearPlayfield();
  if (!options.length) return;

  const baseDuration = Math.max(5.5, 11 - Math.floor((gameState.round - 1) / 7));
  const laneCount = Math.min(4, options.length);
  const laneSpacing = 100 / (laneCount + 1);
  const laneOrder = shuffle(Array.from({ length: options.length }, (_, idx) => ((idx % laneCount) + 1)));

  options.forEach((option, index) => {
    const delay = index * 800 + Math.random() * 400;
    const timerId = setTimeout(() => {
      if (!gameState.playing || !gameState.roundActive) return;

      const target = document.createElement('button');
      target.type = 'button';
      target.className = 'target';
      target.textContent = option.text;
      target.title = option.full;
      target.dataset.correct = option.correct ? 'true' : 'false';

      const durationOffset = (Math.random() * 1.8) - 0.6;
      const duration = Math.max(4.5, baseDuration + durationOffset);
      target.style.animationDuration = `${duration}s`;

      const laneIndex = laneOrder[index] || ((index % laneCount) + 1);
      const percent = laneSpacing * laneIndex;
      target.style.left = `${percent}%`;

      const handleClick = () => handleShot(target);
      const handleAnimationEnd = () => {
        target.removeEventListener('click', handleClick);
        target.removeEventListener('animationend', handleAnimationEnd);
        if (target.dataset.correct === 'true' && gameState.roundActive) {
          target.classList.add('missed');
          gameState.roundActive = false;
          loseLife('The correct meaning slipped past!', true);
        }
      };

      target.addEventListener('click', handleClick);
      target.addEventListener('animationend', handleAnimationEnd, { once: true });
      playfield.appendChild(target);
    }, delay);
    spawnTimers.push(timerId);
  });
}

function handleShot(target) {
  if (!gameState.roundActive || !gameState.playing) return;
  const isCorrect = target.dataset.correct === 'true';
  target.disabled = true;
  target.classList.add(isCorrect ? 'correct' : 'wrong');

  if (isCorrect) {
    gameState.score += Math.max(5, 10 + Math.floor(gameState.round / 2));
    scoreEl.textContent = String(gameState.score);
    setFeedback('Direct hit! Keep going.', 'success');
    gameState.roundActive = false;
    setTimeout(() => {
      clearPlayfield();
      nextRound();
    }, 900);
  } else {
    target.classList.add('wrong');
    setFeedback('Wrong target! You lose a life.', 'error');
    queueForReview(gameState.activeWord);
    loseLife();
  }
}

function loseLife(message, endRound = false) {
  if (!gameState.playing) return;
  gameState.lives -= 1;
  livesEl.textContent = gameState.lives > 0 ? HEART.repeat(gameState.lives) : '✖';
  if (gameState.lives <= 0) {
    endGame(message || 'Out of lives!');
  } else {
    if (message) setFeedback(message, 'error');
    if (endRound) {
      queueForReview(gameState.activeWord);
      setTimeout(() => {
        clearPlayfield();
        nextRound();
      }, 900);
    }
  }
}

function endGame(message) {
  setFeedback(`${message} Final score: ${gameState.score}.`, 'error');
  stopGame();
}

function clearPlayfield() {
  while (spawnTimers.length) {
    const timerId = spawnTimers.pop();
    clearTimeout(timerId);
  }
  playfield.innerHTML = '';
}

function queueForReview(entry) {
  if (!entry || !entry.word) return;
  if (gameState.reviewSet.has(entry.word)) return;
  gameState.reviewSet.add(entry.word);
  gameState.reviewQueue.push(entry);
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setFeedback(message, type = '') {
  if (!feedbackEl) return;
  feedbackEl.textContent = message;
  feedbackEl.classList.toggle('success', type === 'success');
  feedbackEl.classList.toggle('error', type === 'error');
}

init();
