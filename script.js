/* Regina Era Tracker - clean front-end rewrite
   Features:
   - Daily Gem
   - Weekly Garden
   - Brick Wall
   - Daily Tarot
   - Angel Aura Orb

   Storage key: 'reginaEraTracker'
*/

const STORAGE_KEY = 'reginaEraTracker';
const GEM_TARGET = 8;
const NUM_BLOOMS = 7;
const NUM_BRICKS = 12;

/* ---------------------------
   Helpers: state load/save & date
   --------------------------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse state', e);
  }
  // default state
  return {
    gem: {},      // { '2025-12-10': { wins: 0, notes: '' } }
    garden: {},   // { '2025-12-10': { bloomed: true } }
    bricks: { currentBricks: 0, wallsCompleted: 0 },
    aura: {},     // { '2025-12-10': { numbers: [], log: [], note: '' } }
    tarot: {}     // { '2025-12-10': { cardId: 'the-sun' } }
  };
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}
function getTodayKey(date = new Date()) {
  const d = new Date(date.getTime() - date.getTimezoneOffset()*60000);
  return d.toISOString().slice(0,10);
}

/* in-memory state */
let state = loadState();

/* ---------------------------
   Utility: safe ensure day objects
   --------------------------- */
function ensureGem(dateKey) {
  if (!state.gem[dateKey]) state.gem[dateKey] = { wins: 0, notes: '' };
}
function ensureGarden(dateKey) {
  if (!state.garden[dateKey]) state.garden[dateKey] = { bloomed: false };
}
function ensureAura(dateKey) {
  if (!state.aura[dateKey]) state.aura[dateKey] = { numbers: [], log: [], note: '' };
}
function ensureTarot(dateKey) {
  if (!state.tarot[dateKey]) state.tarot[dateKey] = { cardId: null };
}

/* ---------------------------
   Tarot cards definition
   --------------------------- */
const TAROT_CARDS = [
  { id: 'sun', title: 'The Sun', glyph: '☼', tagline: 'Warmth, clarity', meaning: 'A day of warmth, clarity, and small victories. Focus on what brings light.' },
  { id: 'moon', title: 'The Moon', glyph: '◐', tagline: 'Intuition, rest', meaning: 'Trust your inner guide. Slow down and listen, dreams carry hints.' },
  { id: 'star', title: 'The Star', glyph: '✦', tagline: 'Hope, healing', meaning: 'Gentle healing energy. Replenish yourself and share soft light.' },
  { id: 'hermit', title: 'The Hermit', glyph: '◎', tagline: 'Focus, study', meaning: 'A small retreat fuels insight. Take a quiet hour for deep work.' },
  { id: 'empress', title: 'The Empress', glyph: '♁', tagline: 'Nurture, steadiness', meaning: 'Tend to your environment and body. Comfort creates momentum.' },
  { id: 'magus', title: 'The Magus', glyph: '✶', tagline: 'Craft, speak', meaning: 'Your words and craft have effect. Try a clear small action.' },
  { id: 'temperance', title: 'Temperance', glyph: '△', tagline: 'Balance', meaning: 'Small balance shifts accumulate. Mix routine with small joys.' },
  { id: 'strength', title: 'Strength', glyph: '♯', tagline: 'Gentle power', meaning: 'Soft discipline wins. Show up and honor limits kindly.' }
];

/* deterministic index for date */
function tarotIndexForKey(key) {
  // simple deterministic hash: sum of char codes
  let sum = 0;
  for (let i=0;i<key.length;i++) sum += key.charCodeAt(i);
  return sum % TAROT_CARDS.length;
}

/* ---------------------------
   ANGEL MEANINGS
   --------------------------- */
const ANGEL_MEANINGS = {
  '2': [
    'Support is near — small steady steps matter.',
    'A reminder to breathe and accept help.',
    'Balance and gentle structure are supporting you.'
  ],
  '3': [
    'Creative energy spark — try a tiny experiment.',
    'Play opens new doors; curiosity leads.',
    'Communication blossoms; say one kind truth.'
  ],
  '4': [
    'Grounding energy — build one reliable habit.',
    'Practical care brings comfort later.',
    'Tend the foundation: rest, food, shelter, rhythm.'
  ],
  '5': [
    'Change approaches — stay curious and adaptive.',
    'A small pivot opens surprising options.',
    'Movement and exploration are favored this day.'
  ]
};

/* ---------------------------
   Rendering functions
   --------------------------- */
function updateUI() {
  renderGem();
  renderGarden();
  renderWall();
  renderTarot();
  renderOrb();
}

/* ---------- GEM ---------- */
function renderGem(dateKey = getTodayKey()) {
  ensureGem(dateKey);
  const elCount = document.getElementById('gemCount');
  const elFill = document.getElementById('gemFill');
  const elDiamond = document.getElementById('gemDiamond');
  const notes = document.getElementById('gemNotes');

  const wins = state.gem[dateKey].wins || 0;
  if (elCount) elCount.textContent = `${wins} / ${GEM_TARGET}`;
  if (notes) notes.value = state.gem[dateKey].notes || '';

  // compute fill percent relative to target and set height
  const pct = Math.max(0, Math.min(100, Math.round((wins / GEM_TARGET) * 100)));
  if (elFill) elFill.style.height = pct + '%';

  // classes for shimmer / full
  if (elDiamond) {
    elDiamond.classList.toggle('shimmer', wins > 0 && wins < GEM_TARGET);
    elDiamond.classList.toggle('full', wins >= GEM_TARGET);
  }
}

function gemAdd() {
  const key = getTodayKey();
  ensureGem(key);
  state.gem[key].wins = Math.min(GEM_TARGET, (state.gem[key].wins || 0) + 1);
  saveState(); updateUI();
}
function gemSetFull(){
  const key = getTodayKey();
  ensureGem(key);
  state.gem[key].wins = GEM_TARGET;
  saveState(); updateUI();
}
function gemResetToday(){
  const key = getTodayKey();
  ensureGem(key);
  state.gem[key].wins = 0;
  state.gem[key].notes = '';
  saveState(); updateUI();
}

/* save gem notes on blur */
function gemNotesSave() {
  const key = getTodayKey();
  ensureGem(key);
  const notes = document.getElementById('gemNotes');
  if (!notes) return;
  state.gem[key].notes = notes.value;
  saveState();
}

/* ---------- GARDEN ---------- */
function renderGarden() {
  const row = document.getElementById('gardenRow');
  if (!row) return;
  row.innerHTML = '';
  // render last 7 days ending with today
  for (let i = NUM_BLOOMS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getTodayKey(d);
    ensureGarden(key);
    const plot = document.createElement('div');
    plot.className = 'plot';
    plot.dataset.date = key;
    plot.textContent = new Date(key).toLocaleDateString(undefined, {weekday: 'short'});
    if (state.garden[key].bloomed) {
      plot.classList.add('bloomed');
    }
    plot.addEventListener('click', () => {
      toggleBloom(key, plot);
    });
    row.appendChild(plot);
  }
}

function toggleBloom(key, el) {
  ensureGarden(key);
  state.garden[key].bloomed = !state.garden[key].bloomed;
  saveState();
  if (state.garden[key].bloomed && el) {
    el.classList.remove('animate');
    void el.offsetWidth;
    el.classList.add('animate'); // triggers pop animation
    el.classList.add('bloomed');
  } else if (el) {
    el.classList.remove('bloomed');
  }
  updateUI();
}
function bloomToday() {
  const key = getTodayKey();
  ensureGarden(key);
  state.garden[key].bloomed = true;
  saveState(); updateUI();
}

/* ---------- WALL ---------- */
function renderWall() {
  const container = document.getElementById('wallGrid');
  const label = document.getElementById('wallLabel');
  const completed = document.getElementById('wallsCompleted');
  if (!container) return;
  container.innerHTML = '';
  const count = state.bricks.currentBricks || 0;
  for (let i = 0; i < NUM_BRICKS; i++) {
    const b = document.createElement('div');
    b.className = 'brick' + (i < count ? ' filled' : '');
    b.textContent = (i < count) ? '' : '';
    container.appendChild(b);
  }
  if (label) label.textContent = `${count} / ${NUM_BRICKS}`;
  if (completed) completed.textContent = `Walls completed: ${state.bricks.wallsCompleted || 0}`;
}

function addBrick() {
  state.bricks.currentBricks = Math.min(NUM_BRICKS, (state.bricks.currentBricks || 0) + 1);
  saveState(); updateUI();
}
function completeWall() {
  if ((state.bricks.currentBricks || 0) >= NUM_BRICKS) {
    state.bricks.wallsCompleted = (state.bricks.wallsCompleted || 0) + 1;
    state.bricks.currentBricks = 0;
    saveState(); updateUI();
  } else {
    // if not full, do nothing (or we could prompt)
    // For clarity, we simply set to full and complete
    // but keep to spec: require 12 to complete
    alert('You must have 12 bricks to complete the wall.');
  }
}
function resetWall() {
  state.bricks.currentBricks = 0;
  saveState(); updateUI();
}

/* ---------- TAROT ---------- */
function renderTarot(dateKey = getTodayKey()) {
  ensureTarot(dateKey);
  const cardField = document.getElementById('tarotCard');
  const title = document.getElementById('tarotTitle');
  const tagline = document.getElementById('tarotTagline');
  const glyph = document.getElementById('tarotGlyph');

  // choose deterministic card and persist for the day
  if (!state.tarot[dateKey].cardId) {
    const idx = tarotIndexForKey(dateKey);
    state.tarot[dateKey].cardId = TAROT_CARDS[idx].id;
    saveState();
  }
  const card = TAROT_CARDS.find(c => c.id === state.tarot[dateKey].cardId) || TAROT_CARDS[0];
  if (title) title.textContent = card.title;
  if (tagline) tagline.textContent = card.tagline;
  if (glyph) glyph.textContent = card.glyph;
}

/* tarot modal */
function openTarotModal() {
  const key = getTodayKey();
  ensureTarot(key);
  const card = TAROT_CARDS.find(c => c.id === state.tarot[key].cardId) || TAROT_CARDS[0];
  document.getElementById('modalTarotTitle').textContent = card.title;
  document.getElementById('modalTarotGlyph').textContent = card.glyph;
  document.getElementById('modalTarotMeaning').textContent = card.meaning;
  document.getElementById('modalTarot').classList.remove('hidden');
}
function closeTarotModal() {
  document.getElementById('modalTarot').classList.add('hidden');
}

/* ---------- ORB / AURA ---------- */
function renderOrb() {
  const orb = document.getElementById('auraOrb');
  const summary = document.getElementById('auraSummary');
  const today = getTodayKey();
  ensureAura(today);
  const btn = document.getElementById('btnOpenAura');

  // compute unique numbers and dominant
  const numbers = state.aura[today].numbers || [];
  const log = state.aura[today].log || [];
  const note = state.aura[today].note || '';
  if (summary) {
    if (numbers.length === 0) summary.textContent = 'No aura numbers logged today';
    else summary.textContent = `Today: ${numbers.join(', ')}`;
  }

  // apply color classes or gradient depending on numbers
  if (orb) {
    orb.classList.remove('papaya','berry','vervain','dusty','pulse');
    if (numbers.length === 0) {
      // neutral default
      orb.style.background = 'radial-gradient(circle at 30% 30%, rgba(189,104,9,0.95), rgba(154,63,74,0.9))';
    } else {
      // map base digits to colors and blend if multiple
      const colorMap = { '2': 'var(--papaya)', '3': 'var(--berry)', '4': 'var(--vervain)', '5': 'var(--dusty-blue)' };
      if (numbers.length === 1) {
        const cls = numbers[0] === 2 ? 'papaya' : numbers[0] === 3 ? 'berry' : numbers[0] === 4 ? 'vervain' : 'dusty';
        orb.classList.add(cls);
        orb.classList.add('pulse');
      } else {
        // create a small gradient blend
        const stops = numbers.map((n,i) => `${colorMap[String(n)]} ${Math.round((i/(numbers.length))*100)}%`);
        orb.style.background = `linear-gradient(135deg, ${stops.join(',')})`;
        orb.classList.add('pulse');
      }
    }
  }

  // update modal log if open
  const logEl = document.getElementById('auraLog');
  if (logEl) logEl.textContent = note || '';
}

/* parse a number string to its base digit (2-5) for repeating-digit forms */
function baseDigit(s) {
  if (s === null || s === undefined) return null;
  const str = String(s).trim();
  if (!str) return null;
  // if all characters same (e.g., 222, 333)
  if (str.split('').every(ch => ch === str[0])) {
    const n = parseInt(str[0], 10);
    if (n >= 2 && n <= 5) return n;
  }
  // fallback: find first digit 2-5
  const m = str.match(/[2-5]/);
  return m ? parseInt(m[0],10) : null;
}

/* open/close aura modal */
function openAuraModal() {
  const modal = document.getElementById('modalAura');
  const input = document.getElementById('auraInput');
  const today = getTodayKey();
  ensureAura(today);
  // populate log
  document.getElementById('auraLog').textContent = state.aura[today].note || '';
  if (modal) modal.classList.remove('hidden');
  if (input) input.value = '';
}
function closeAuraModal() {
  const modal = document.getElementById('modalAura');
  if (modal) modal.classList.add('hidden');
}

/* Log aura numbers from input */
function logAuraFromInput() {
  const input = document.getElementById('auraInput');
  if (!input) return;
  const raw = input.value || '';
  if (!raw.trim()) return;
  // split by commas or whitespace
  const parts = raw.split(/[,|\s]+/).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return;
  const today = getTodayKey();
  ensureAura(today);
  for (const p of parts) {
    state.aura[today].log.push(p);
    const b = baseDigit(p);
    if (b && !state.aura[today].numbers.includes(b)) state.aura[today].numbers.push(b);
    // pick random meaning
    const choices = ANGEL_MEANINGS[String(b)] || ['A gentle message arrives.'];
    const msg = choices[Math.floor(Math.random() * choices.length)];
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    state.aura[today].note += `[${time}] ${p}: ${msg}\n`;
  }
  saveState();
  renderOrb();
  // update modal log and close or keep open
  document.getElementById('auraLog').textContent = state.aura[today].note;
  // keep modal open for review
}

/* ---------- Wiring / Event listeners ---------- */
function wire() {
  // GEM
  const btnAdd = document.getElementById('btnGemAdd');
  const btnFull = document.getElementById('btnGemFull');
  const btnReset = document.getElementById('btnGemReset');
  const notes = document.getElementById('gemNotes');
  if (btnAdd) btnAdd.addEventListener('click', gemAdd);
  if (btnFull) btnFull.addEventListener('click', gemSetFull);
  if (btnReset) btnReset.addEventListener('click', () => {
    if (confirm('Reset today\'s gem?')) gemResetToday();
  });
  if (notes) {
    notes.addEventListener('blur', gemNotesSave);
    notes.addEventListener('change', gemNotesSave);
  }

  // GARDEN
  const btnBloom = document.getElementById('btnBloomToday');
  if (btnBloom) btnBloom.addEventListener('click', bloomToday);

  // WALL
  const btnAddBrick = document.getElementById('btnAddBrick');
  const btnComplete = document.getElementById('btnCompleteWall');
  const btnResetWall = document.getElementById('btnResetWall');
  if (btnAddBrick) btnAddBrick.addEventListener('click', addBrick);
  if (btnComplete) btnComplete.addEventListener('click', completeWall);
  if (btnResetWall) btnResetWall.addEventListener('click', () => {
    if (confirm('Reset current wall (this will clear current bricks)?')) resetWall();
  });

  // TAROT
  const btnTarotOpen = document.getElementById('btnTarotOpen');
  const btnTarotClose = document.getElementById('btnCloseTarot');
  if (btnTarotOpen) btnTarotOpen.addEventListener('click', openTarotModal);
  if (btnTarotClose) btnTarotClose.addEventListener('click', closeTarotModal);

  // AURA
  const orb = document.getElementById('auraOrb');
  const btnOpenAura = document.getElementById('btnOpenAura');
  const btnCloseAura = document.getElementById('btnCloseAura');
  const btnLogAura = document.getElementById('btnLogAura');
  const btnClearAuraInput = document.getElementById('btnClearAuraInput');

  if (orb) orb.addEventListener('click', openAuraModal);
  if (btnOpenAura) btnOpenAura.addEventListener('click', openAuraModal);
  if (btnCloseAura) btnCloseAura.addEventListener('click', closeAuraModal);
  if (btnLogAura) btnLogAura.addEventListener('click', () => {
    logAuraFromInput();
  });
  if (btnClearAuraInput) btnClearAuraInput.addEventListener('click', () => {
    const input = document.getElementById('auraInput');
    if (input) input.value = '';
  });

  // modal close via overlay click (click outside panel)
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
}

/* ---------------------------
   Init: ensure today's keys and render
   --------------------------- */
function init() {
  // ensure today's shadow objects
  const today = getTodayKey();
  ensureGem(today);
  ensureGarden(today);
  ensureAura(today);
  ensureTarot(today);

  // wire UI
  wire();

  // initial render
  updateUI();

  // save initial state (in case defaults were added)
  saveState();
}

/* start */
document.addEventListener('DOMContentLoaded', init);
/* Regina Era Tracker - clean front-end rewrite
   Features:
   - Daily Gem
   - Weekly Garden
   - Brick Wall
   - Daily Tarot
   - Angel Aura Orb

   Storage key: 'reginaEraTracker'
*/

const STORAGE_KEY = 'reginaEraTracker';
const GEM_TARGET = 8;
const NUM_BLOOMS = 7;
const NUM_BRICKS = 12;

/* ---------------------------
   Helpers: state load/save & date
   --------------------------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse state', e);
  }
  // default state
  return {
    gem: {},      // { '2025-12-10': { wins: 0, notes: '' } }
    garden: {},   // { '2025-12-10': { bloomed: true } }
    bricks: { currentBricks: 0, wallsCompleted: 0 },
    aura: {},     // { '2025-12-10': { numbers: [], log: [], note: '' } }
    tarot: {}     // { '2025-12-10': { cardId: 'the-sun' } }
  };
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}
function getTodayKey(date = new Date()) {
  const d = new Date(date.getTime() - date.getTimezoneOffset()*60000);
  return d.toISOString().slice(0,10);
}

/* in-memory state */
let state = loadState();

/* ---------------------------
   Utility: safe ensure day objects
   --------------------------- */
function ensureGem(dateKey) {
  if (!state.gem[dateKey]) state.gem[dateKey] = { wins: 0, notes: '' };
}
function ensureGarden(dateKey) {
  if (!state.garden[dateKey]) state.garden[dateKey] = { bloomed: false };
}
function ensureAura(dateKey) {
  if (!state.aura[dateKey]) state.aura[dateKey] = { numbers: [], log: [], note: '' };
}
function ensureTarot(dateKey) {
  if (!state.tarot[dateKey]) state.tarot[dateKey] = { cardId: null };
}

/* ---------------------------
   Tarot cards definition
   --------------------------- */
const TAROT_CARDS = [
  { id: 'sun', title: 'The Sun', glyph: '☼', tagline: 'Warmth, clarity', meaning: 'A day of warmth, clarity, and small victories. Focus on what brings light.' },
  { id: 'moon', title: 'The Moon', glyph: '◐', tagline: 'Intuition, rest', meaning: 'Trust your inner guide. Slow down and listen, dreams carry hints.' },
  { id: 'star', title: 'The Star', glyph: '✦', tagline: 'Hope, healing', meaning: 'Gentle healing energy. Replenish yourself and share soft light.' },
  { id: 'hermit', title: 'The Hermit', glyph: '◎', tagline: 'Focus, study', meaning: 'A small retreat fuels insight. Take a quiet hour for deep work.' },
  { id: 'empress', title: 'The Empress', glyph: '♁', tagline: 'Nurture, steadiness', meaning: 'Tend to your environment and body. Comfort creates momentum.' },
  { id: 'magus', title: 'The Magus', glyph: '✶', tagline: 'Craft, speak', meaning: 'Your words and craft have effect. Try a clear small action.' },
  { id: 'temperance', title: 'Temperance', glyph: '△', tagline: 'Balance', meaning: 'Small balance shifts accumulate. Mix routine with small joys.' },
  { id: 'strength', title: 'Strength', glyph: '♯', tagline: 'Gentle power', meaning: 'Soft discipline wins. Show up and honor limits kindly.' }
];

/* deterministic index for date */
function tarotIndexForKey(key) {
  // simple deterministic hash: sum of char codes
  let sum = 0;
  for (let i=0;i<key.length;i++) sum += key.charCodeAt(i);
  return sum % TAROT_CARDS.length;
}

/* ---------------------------
   ANGEL MEANINGS
   --------------------------- */
const ANGEL_MEANINGS = {
  '2': [
    'Support is near — small steady steps matter.',
    'A reminder to breathe and accept help.',
    'Balance and gentle structure are supporting you.'
  ],
  '3': [
    'Creative energy spark — try a tiny experiment.',
    'Play opens new doors; curiosity leads.',
    'Communication blossoms; say one kind truth.'
  ],
  '4': [
    'Grounding energy — build one reliable habit.',
    'Practical care brings comfort later.',
    'Tend the foundation: rest, food, shelter, rhythm.'
  ],
  '5': [
    'Change approaches — stay curious and adaptive.',
    'A small pivot opens surprising options.',
    'Movement and exploration are favored this day.'
  ]
};

/* ---------------------------
   Rendering functions
   --------------------------- */
function updateUI() {
  renderGem();
  renderGarden();
  renderWall();
  renderTarot();
  renderOrb();
}

/* ---------- GEM ---------- */
function renderGem(dateKey = getTodayKey()) {
  ensureGem(dateKey);
  const elCount = document.getElementById('gemCount');
  const elFill = document.getElementById('gemFill');
  const elDiamond = document.getElementById('gemDiamond');
  const notes = document.getElementById('gemNotes');

  const wins = state.gem[dateKey].wins || 0;
  if (elCount) elCount.textContent = `${wins} / ${GEM_TARGET}`;
  if (notes) notes.value = state.gem[dateKey].notes || '';

  // compute fill percent relative to target and set height
  const pct = Math.max(0, Math.min(100, Math.round((wins / GEM_TARGET) * 100)));
  if (elFill) elFill.style.height = pct + '%';

  // classes for shimmer / full
  if (elDiamond) {
    elDiamond.classList.toggle('shimmer', wins > 0 && wins < GEM_TARGET);
    elDiamond.classList.toggle('full', wins >= GEM_TARGET);
  }
}

function gemAdd() {
  const key = getTodayKey();
  ensureGem(key);
  state.gem[key].wins = Math.min(GEM_TARGET, (state.gem[key].wins || 0) + 1);
  saveState(); updateUI();
}
function gemSetFull(){
  const key = getTodayKey();
  ensureGem(key);
  state.gem[key].wins = GEM_TARGET;
  saveState(); updateUI();
}
function gemResetToday(){
  const key = getTodayKey();
  ensureGem(key);
  state.gem[key].wins = 0;
  state.gem[key].notes = '';
  saveState(); updateUI();
}

/* save gem notes on blur */
function gemNotesSave() {
  const key = getTodayKey();
  ensureGem(key);
  const notes = document.getElementById('gemNotes');
  if (!notes) return;
  state.gem[key].notes = notes.value;
  saveState();
}

/* ---------- GARDEN ---------- */
function renderGarden() {
  const row = document.getElementById('gardenRow');
  if (!row) return;
  row.innerHTML = '';
  // render last 7 days ending with today
  for (let i = NUM_BLOOMS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getTodayKey(d);
    ensureGarden(key);
    const plot = document.createElement('div');
    plot.className = 'plot';
    plot.dataset.date = key;
    plot.textContent = new Date(key).toLocaleDateString(undefined, {weekday: 'short'});
    if (state.garden[key].bloomed) {
      plot.classList.add('bloomed');
    }
    plot.addEventListener('click', () => {
      toggleBloom(key, plot);
    });
    row.appendChild(plot);
  }
}

function toggleBloom(key, el) {
  ensureGarden(key);
  state.garden[key].bloomed = !state.garden[key].bloomed;
  saveState();
  if (state.garden[key].bloomed && el) {
    el.classList.remove('animate');
    void el.offsetWidth;
    el.classList.add('animate'); // triggers pop animation
    el.classList.add('bloomed');
  } else if (el) {
    el.classList.remove('bloomed');
  }
  updateUI();
}
function bloomToday() {
  const key = getTodayKey();
  ensureGarden(key);
  state.garden[key].bloomed = true;
  saveState(); updateUI();
}

/* ---------- WALL ---------- */
function renderWall() {
  const container = document.getElementById('wallGrid');
  const label = document.getElementById('wallLabel');
  const completed = document.getElementById('wallsCompleted');
  if (!container) return;
  container.innerHTML = '';
  const count = state.bricks.currentBricks || 0;
  for (let i = 0; i < NUM_BRICKS; i++) {
    const b = document.createElement('div');
    b.className = 'brick' + (i < count ? ' filled' : '');
    b.textContent = (i < count) ? '' : '';
    container.appendChild(b);
  }
  if (label) label.textContent = `${count} / ${NUM_BRICKS}`;
  if (completed) completed.textContent = `Walls completed: ${state.bricks.wallsCompleted || 0}`;
}

function addBrick() {
  state.bricks.currentBricks = Math.min(NUM_BRICKS, (state.bricks.currentBricks || 0) + 1);
  saveState(); updateUI();
}
function completeWall() {
  if ((state.bricks.currentBricks || 0) >= NUM_BRICKS) {
    state.bricks.wallsCompleted = (state.bricks.wallsCompleted || 0) + 1;
    state.bricks.currentBricks = 0;
    saveState(); updateUI();
  } else {
    // if not full, do nothing (or we could prompt)
    // For clarity, we simply set to full and complete
    // but keep to spec: require 12 to complete
    alert('You must have 12 bricks to complete the wall.');
  }
}
function resetWall() {
  state.bricks.currentBricks = 0;
  saveState(); updateUI();
}

/* ---------- TAROT ---------- */
function renderTarot(dateKey = getTodayKey()) {
  ensureTarot(dateKey);
  const cardField = document.getElementById('tarotCard');
  const title = document.getElementById('tarotTitle');
  const tagline = document.getElementById('tarotTagline');
  const glyph = document.getElementById('tarotGlyph');

  // choose deterministic card and persist for the day
  if (!state.tarot[dateKey].cardId) {
    const idx = tarotIndexForKey(dateKey);
    state.tarot[dateKey].cardId = TAROT_CARDS[idx].id;
    saveState();
  }
  const card = TAROT_CARDS.find(c => c.id === state.tarot[dateKey].cardId) || TAROT_CARDS[0];
  if (title) title.textContent = card.title;
  if (tagline) tagline.textContent = card.tagline;
  if (glyph) glyph.textContent = card.glyph;
}

/* tarot modal */
function openTarotModal() {
  const key = getTodayKey();
  ensureTarot(key);
  const card = TAROT_CARDS.find(c => c.id === state.tarot[key].cardId) || TAROT_CARDS[0];
  document.getElementById('modalTarotTitle').textContent = card.title;
  document.getElementById('modalTarotGlyph').textContent = card.glyph;
  document.getElementById('modalTarotMeaning').textContent = card.meaning;
  document.getElementById('modalTarot').classList.remove('hidden');
}
function closeTarotModal() {
  document.getElementById('modalTarot').classList.add('hidden');
}

/* ---------- ORB / AURA ---------- */
function renderOrb() {
  const orb = document.getElementById('auraOrb');
  const summary = document.getElementById('auraSummary');
  const today = getTodayKey();
  ensureAura(today);
  const btn = document.getElementById('btnOpenAura');

  // compute unique numbers and dominant
  const numbers = state.aura[today].numbers || [];
  const log = state.aura[today].log || [];
  const note = state.aura[today].note || '';
  if (summary) {
    if (numbers.length === 0) summary.textContent = 'No aura numbers logged today';
    else summary.textContent = `Today: ${numbers.join(', ')}`;
  }

  // apply color classes or gradient depending on numbers
  if (orb) {
    orb.classList.remove('papaya','berry','vervain','dusty','pulse');
    if (numbers.length === 0) {
      // neutral default
      orb.style.background = 'radial-gradient(circle at 30% 30%, rgba(189,104,9,0.95), rgba(154,63,74,0.9))';
    } else {
      // map base digits to colors and blend if multiple
      const colorMap = { '2': 'var(--papaya)', '3': 'var(--berry)', '4': 'var(--vervain)', '5': 'var(--dusty-blue)' };
      if (numbers.length === 1) {
        const cls = numbers[0] === 2 ? 'papaya' : numbers[0] === 3 ? 'berry' : numbers[0] === 4 ? 'vervain' : 'dusty';
        orb.classList.add(cls);
        orb.classList.add('pulse');
      } else {
        // create a small gradient blend
        const stops = numbers.map((n,i) => `${colorMap[String(n)]} ${Math.round((i/(numbers.length))*100)}%`);
        orb.style.background = `linear-gradient(135deg, ${stops.join(',')})`;
        orb.classList.add('pulse');
      }
    }
  }

  // update modal log if open
  const logEl = document.getElementById('auraLog');
  if (logEl) logEl.textContent = note || '';
}

/* parse a number string to its base digit (2-5) for repeating-digit forms */
function baseDigit(s) {
  if (s === null || s === undefined) return null;
  const str = String(s).trim();
  if (!str) return null;
  // if all characters same (e.g., 222, 333)
  if (str.split('').every(ch => ch === str[0])) {
    const n = parseInt(str[0], 10);
    if (n >= 2 && n <= 5) return n;
  }
  // fallback: find first digit 2-5
  const m = str.match(/[2-5]/);
  return m ? parseInt(m[0],10) : null;
}

/* open/close aura modal */
function openAuraModal() {
  const modal = document.getElementById('modalAura');
  const input = document.getElementById('auraInput');
  const today = getTodayKey();
  ensureAura(today);
  // populate log
  document.getElementById('auraLog').textContent = state.aura[today].note || '';
  if (modal) modal.classList.remove('hidden');
  if (input) input.value = '';
}
function closeAuraModal() {
  const modal = document.getElementById('modalAura');
  if (modal) modal.classList.add('hidden');
}

/* Log aura numbers from input */
function logAuraFromInput() {
  const input = document.getElementById('auraInput');
  if (!input) return;
  const raw = input.value || '';
  if (!raw.trim()) return;
  // split by commas or whitespace
  const parts = raw.split(/[,|\s]+/).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return;
  const today = getTodayKey();
  ensureAura(today);
  for (const p of parts) {
    state.aura[today].log.push(p);
    const b = baseDigit(p);
    if (b && !state.aura[today].numbers.includes(b)) state.aura[today].numbers.push(b);
    // pick random meaning
    const choices = ANGEL_MEANINGS[String(b)] || ['A gentle message arrives.'];
    const msg = choices[Math.floor(Math.random() * choices.length)];
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    state.aura[today].note += `[${time}] ${p}: ${msg}\n`;
  }
  saveState();
  renderOrb();
  // update modal log and close or keep open
  document.getElementById('auraLog').textContent = state.aura[today].note;
  // keep modal open for review
}

/* ---------- Wiring / Event listeners ---------- */
function wire() {
  // GEM
  const btnAdd = document.getElementById('btnGemAdd');
  const btnFull = document.getElementById('btnGemFull');
  const btnReset = document.getElementById('btnGemReset');
  const notes = document.getElementById('gemNotes');
  if (btnAdd) btnAdd.addEventListener('click', gemAdd);
  if (btnFull) btnFull.addEventListener('click', gemSetFull);
  if (btnReset) btnReset.addEventListener('click', () => {
    if (confirm('Reset today\'s gem?')) gemResetToday();
  });
  if (notes) {
    notes.addEventListener('blur', gemNotesSave);
    notes.addEventListener('change', gemNotesSave);
  }

  // GARDEN
  const btnBloom = document.getElementById('btnBloomToday');
  if (btnBloom) btnBloom.addEventListener('click', bloomToday);

  // WALL
  const btnAddBrick = document.getElementById('btnAddBrick');
  const btnComplete = document.getElementById('btnCompleteWall');
  const btnResetWall = document.getElementById('btnResetWall');
  if (btnAddBrick) btnAddBrick.addEventListener('click', addBrick);
  if (btnComplete) btnComplete.addEventListener('click', completeWall);
  if (btnResetWall) btnResetWall.addEventListener('click', () => {
    if (confirm('Reset current wall (this will clear current bricks)?')) resetWall();
  });

  // TAROT
  const btnTarotOpen = document.getElementById('btnTarotOpen');
  const btnTarotClose = document.getElementById('btnCloseTarot');
  if (btnTarotOpen) btnTarotOpen.addEventListener('click', openTarotModal);
  if (btnTarotClose) btnTarotClose.addEventListener('click', closeTarotModal);

  // AURA
  const orb = document.getElementById('auraOrb');
  const btnOpenAura = document.getElementById('btnOpenAura');
  const btnCloseAura = document.getElementById('btnCloseAura');
  const btnLogAura = document.getElementById('btnLogAura');
  const btnClearAuraInput = document.getElementById('btnClearAuraInput');

  if (orb) orb.addEventListener('click', openAuraModal);
  if (btnOpenAura) btnOpenAura.addEventListener('click', openAuraModal);
  if (btnCloseAura) btnCloseAura.addEventListener('click', closeAuraModal);
  if (btnLogAura) btnLogAura.addEventListener('click', () => {
    logAuraFromInput();
  });
  if (btnClearAuraInput) btnClearAuraInput.addEventListener('click', () => {
    const input = document.getElementById('auraInput');
    if (input) input.value = '';
  });

  // modal close via overlay click (click outside panel)
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
}

/* ---------------------------
   Init: ensure today's keys and render
   --------------------------- */
function init() {
  // ensure today's shadow objects
  const today = getTodayKey();
  ensureGem(today);
  ensureGarden(today);
  ensureAura(today);
  ensureTarot(today);

  // wire UI
  wire();

  // initial render
  updateUI();

  // save initial state (in case defaults were added)
  saveState();
}

/* start */
document.addEventListener('DOMContentLoaded', init);
