// Basic config
const NUM_FACETS = 6;
const NUM_BLOOMS = 7;
const NUM_BRICKS = 12;
const DAILY_GEM_TARGET = 8; // wins to hit 100%

const SHRINE_ITEMS = [
  { id: 'candle', label: 'Candle', emoji: '🕯️' },
  { id: 'tea', label: 'Tea', emoji: '🍵' },
  { id: 'jewelry', label: 'Jewelry', emoji: '💍' },
  { id: 'flowers', label: 'Flowers', emoji: '🌸' },
  { id: 'bath', label: 'Bath', emoji: '🛁' },
  { id: 'journal', label: 'Journal', emoji: '📓' },
  { id: 'moon', label: 'Early night', emoji: '🌙' }
];

// Local storage
let data = loadData();

function loadData() {
  try {
    const raw = localStorage.getItem('reginaEraTrackerFullV3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.days) parsed.days = {};
      if (!parsed.wall) parsed.wall = { bricksInCurrent: 0, wallsCompleted: 0 };
      if (!parsed.shrine) parsed.shrine = { level: 0, placed: [] };
      return parsed;
    }
  } catch (e) {}
  return {
    days: {}, // by YYYY-MM-DD
    wall: {
      bricksInCurrent: 0,
      wallsCompleted: 0
    },
    shrine: {
      level: 0,
      placed: []
    }
  };
}

function saveData() {
  localStorage.setItem('reginaEraTrackerFullV3', JSON.stringify(data));
}

function todayKey() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function ensureDay(key) {
  if (!data.days[key]) {
    data.days[key] = {
      gemFacets: 0,
      gemCompleted: false,
      bloom: false,
      gemNotes: "",
      gardenNotes: "",
      brickNotes: "",
      tarotId: null,
      auraNumbers: [],
      auraNote: ""
    };
  } else {
    const d = data.days[key];
    if (typeof d.gemFacets !== 'number') d.gemFacets = 0;
    if (typeof d.gemCompleted !== 'boolean') d.gemCompleted = false;
    if (typeof d.bloom !== 'boolean') d.bloom = false;
    if (typeof d.gemNotes !== 'string') d.gemNotes = '';
    if (typeof d.gardenNotes !== 'string') d.gardenNotes = '';
    if (typeof d.brickNotes !== 'string') d.brickNotes = '';
    if (!('tarotId' in d)) d.tarotId = null;
    if (!Array.isArray(d.auraNumbers)) d.auraNumbers = [];
    if (typeof d.auraNote !== 'string') d.auraNote = '';
  }
  if (!data.shrine) data.shrine = { level: 0, placed: [] };
  if (!Array.isArray(data.shrine.placed)) data.shrine.placed = [];
}

// Tarot cards
const TAROT_CARDS = [
  {
    id: "sag-arrow-morning",
    title: "Sagittarian Arrow Morning",
    short: "Arrow Morning",
    glyph: "🏹",
    theme: 1,
    tagline: "Aim your first hour at what matters most.",
    meaning: "Today wants a clear aim. Use your first hour to point your energy at one thing that actually moves life forward — even a tiny step. Say no to scattered tabs and yes to one meaningful arrow."
  },
  {
    id: "gemini-butterfly",
    title: "Gemini Butterfly Brain",
    short: "Butterfly Brain",
    glyph: "🦋",
    theme: 2,
    tagline: "Follow curiosity, not chaos.",
    meaning: "Let your mind flit — but within a garden, not a storm. Choose 1–2 branches to explore and tuck everything else into a later list. Your ideas are valid; they just need gentle lanes."
  },
  {
    id: "taurus-soft-ground",
    title: "Taurus Soft Grounding",
    short: "Soft Grounding",
    glyph: "🌿",
    theme: 3,
    tagline: "Slow, steady, sensual presence.",
    meaning: "Today is about anchoring into your body: warm drinks, comfortable clothes, one grounded task at a time. Your nervous system is your first home — treat it like a sacred space."
  },
  {
    id: "future-self-portal",
    title: "Future Self Portal",
    short: "Future Portal",
    glyph: "🚪",
    theme: 4,
    tagline: "One brave move she’ll thank you for.",
    meaning: "Choose the tiniest action your future self would high-five you for: send the message, open the bill, schedule the appointment. It doesn’t have to be big to be timeline-altering."
  },
  {
    id: "micro-integrity-thread",
    title: "Micro-Integrity Thread",
    short: "Integrity Thread",
    glyph: "🧵",
    theme: 2,
    tagline: "Keep one promise to yourself.",
    meaning: "Pick a promise so small it almost feels silly — and keep it. You’re quietly rewiring your brain to believe you when you say, 'I’ve got us.' These threads become a net that catches you."
  },
  {
    id: "motherhood-magic",
    title: "Motherhood Magic",
    short: "Motherhood Magic",
    glyph: "🧸",
    theme: 3,
    tagline: "Your presence is the spell.",
    meaning: "The way you look at your babies, the tone you use with yourself, the softness you allow — that’s the magic. Let 'good enough but loving' be your baseline enchantment today."
  },
  {
    id: "brick-by-brick",
    title: "Brick by Brick Builder",
    short: "Brick Builder",
    glyph: "🧱",
    theme: 4,
    tagline: "Tiny boring moves = iconic life later.",
    meaning: "Today is quietly foundational. Each email, phone call, or tiny money move is one more brick in a life that feels stable. You don’t need to feel motivated — you just need to lay one brick."
  },
  {
    id: "night-garden-reset",
    title: "Night Garden Reset",
    short: "Night Garden",
    glyph: "🌙",
    theme: 1,
    tagline: "Close the day with softness, not judgment.",
    meaning: "However today went, you’re allowed a gentle reset. Tidy one corner, wash your face, or light a candle. Let the day fall off you like petals — tomorrow gets fresh soil."
  }
];

function getDailyTarotId(key) {
  const d = new Date(key);
  const serial = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const index = serial % TAROT_CARDS.length;
  return TAROT_CARDS[index].id;
}

function renderTarotCard() {
  const key = todayKey();
  ensureDay(key);
  if (!data.days[key].tarotId) {
    data.days[key].tarotId = getDailyTarotId(key);
    saveData();
  }
  const cardId = data.days[key].tarotId;
  const card = TAROT_CARDS.find(c => c.id === cardId) || TAROT_CARDS[0];

  const face = document.getElementById('tarotFace');
  const titleShort = document.getElementById('tarotTitleShort');
  const taglineShort = document.getElementById('tarotTaglineShort');
  const glyph = document.getElementById('tarotArtGlyph');
  const modalContent = document.getElementById('cardModalContent');

  if (face) {
    face.className = 'tarot-face theme-' + card.theme;
  }
  if (glyph) glyph.textContent = card.glyph;
  if (titleShort) titleShort.textContent = card.short;
  if (taglineShort) taglineShort.textContent = card.tagline;
  if (modalContent) {
    modalContent.innerHTML = `
      <div class="tarot-title">${card.title}</div>
      <div class="tarot-tagline">${card.tagline}</div>
      <div class="tarot-meaning">${card.meaning}</div>
    `;
  }
}

// Angel numbers – multiple fresh messages per number

const ANGEL_MEANINGS = {
  1: [
    "New beginnings — tiny brave moves count.",
    "Leadership energy is on; go first in a small way.",
    "Your decisions today plant seeds for a new chapter."
  ],
  2: [
    "Balance and partnership — you don’t have to carry it alone.",
    "Soften your schedule so your nervous system can breathe.",
    "Tiny harmonizing moves (text replies, dishes, prep) restore flow."
  ],
  3: [
    "Creative flow — speak, write, or play something out of your head.",
    "Your ideas want a low-stakes outlet, not perfection.",
    "Express instead of suppress — even if it’s just messy notes."
  ],
  4: [
    "Stability — one small routine will do more than a mood swing.",
    "Foundations first: food, water, sleep, body comfort.",
    "You’re quietly building a life that holds you, not just looks good."
  ],
  5: [
    "Change is active — let something be easier than you’re used to.",
    "You’re outgrowing an old micro-habit today.",
    "Tiny experiments are safe; you can always adjust."
  ],
  7: [
    "Inner wisdom — your gut already voted, listen to it.",
    "You’re allowed to move slower while your intuition catches up.",
    "Alone-time or quiet pockets will give you the next right step."
  ],
  9: [
    "Release era — something can be 'good enough' and done.",
    "You’re allowed to step out of old roles and patterns.",
    "Closing loops now makes room for better offers later."
  ],
  11: [
    "Portal number — the way you talk to yourself today matters.",
    "Your self-trust is glitching into a higher version.",
    "Notice what repeats today; that’s your portal hint."
  ],
  22: [
    "Master builder — tiny boring steps support huge dreams.",
    "Write or refine one practical piece of a big vision.",
    "You’re allowed to think long-term even in a messy season."
  ],
  33: [
    "Compassion leadership — your softness teaches others how.",
    "Offer yourself the tone you’d use with a friend.",
    "Healing doesn’t have to be dramatic; it can be a nap and a snack."
  ],
  44: [
    "Protection — you’re more supported than you feel.",
    "Your effort is seen even when results are delayed.",
    "You can relax your shoulders; something bigger has your back."
  ],
  55: [
    "Big upgrades — you’re not overreacting; your standards are rising.",
    "Old coping tools might feel itchy; that’s growth.",
    "You’re allowed to redesign routines so they fit this era of you."
  ]
};

function angelColorForNumber(n) {
  if (n === 2 || n === 22) return 'papaya';
  if (n === 3 || n === 33) return 'fig';
  if (n === 4 || n === 44) return 'vervain';
  if (n === 5 || n === 55) return 'dusty';
  return null;
}

function getAuraThemeAndLayers(nums) {
  if (!nums || !nums.length) return { theme: 'neutral', layers: [] };
  const set = new Set(nums);
  const layers = [];
  if ([2,22].some(n => set.has(n))) layers.push('papaya');
  if ([3,33].some(n => set.has(n))) layers.push('fig');
  if ([4,44].some(n => set.has(n))) layers.push('vervain');
  if ([5,55].some(n => set.has(n))) layers.push('dusty');
  if (!layers.length) return { theme: 'neutral', layers: [] };
  if (layers.length === 1) return { theme: layers[0], layers };
  return { theme: 'mix', layers };
}

function renderAuraOrb() {
  const orb = document.getElementById('auraOrb');
  if (!orb) return;
  const key = todayKey();
  ensureDay(key);
  const auraNums = data.days[key].auraNumbers || [];
  const count = auraNums.length;
  let level = 0;
  if (count >= 1) level = 1;
  if (count >= 2) level = 2;
  if (count >= 3) level = 3;
  if (count >= 4) level = 4;

  const { theme } = getAuraThemeAndLayers(auraNums);
  orb.className = 'aura-orb level-' + level + ' theme-' + theme + (auraNums.length ? ' active' : '');
}

function renderOrbChips(nums) {
  const row = document.getElementById('orbSeenToday');
  if (!row) return;
  row.innerHTML = '';
  if (!nums || !nums.length) return;
  nums.forEach(n => {
    const div = document.createElement('div');
    const color = angelColorForNumber(n);
    let extra = '';
    if (color === 'papaya') extra = ' chip-papaya';
    if (color === 'fig') extra = ' chip-fig';
    if (color === 'vervain') extra = ' chip-vervain';
    if (color === 'dusty') extra = ' chip-dusty';
    div.className = 'chip' + extra;
    div.textContent = n;
    row.appendChild(div);
  });
}

function attachOrbHandlers() {
  const orb = document.getElementById('auraOrb');
  const modal = document.getElementById('orbModal');
  const btnClose = document.getElementById('btnOrbClose');
  const btnGenerate = document.getElementById('btnOrbGenerate');
  const btnSave = document.getElementById('btnOrbSave');
  const input = document.getElementById('orbInput');
  const note = document.getElementById('orbNote');

  if (orb) {
    orb.addEventListener('click', () => {
      const key = todayKey();
      ensureDay(key);
      const auraNums = data.days[key].auraNumbers || [];
      const auraNote = data.days[key].auraNote || '';
      renderOrbChips(auraNums);
      input.value = '';
      note.value = auraNote;
      if (modal) modal.classList.add('visible');
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => modal.classList.remove('visible'));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('visible');
    });
  }

  if (btnGenerate && input && note) {
    btnGenerate.addEventListener('click', () => {
      const key = todayKey();
      ensureDay(key);
      const text = input.value || '';
      const numbers = text.split(/[^0-9]+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));

      if (!numbers.length) {
        return;
      }

      // Update unique numbers for color/theme tracking
      const uniqueSet = new Set(data.days[key].auraNumbers || []);
      numbers.forEach(n => uniqueSet.add(n));
      data.days[key].auraNumbers = Array.from(uniqueSet.values()).sort((a,b) => a-b);

      // Build fresh reflection line(s) for every entry, even repeats
      const snippets = numbers.map(n => {
        const meanings = ANGEL_MEANINGS[n];
        if (Array.isArray(meanings) && meanings.length) {
          const pick = meanings[Math.floor(Math.random() * meanings.length)];
          return `${n}: ${pick}`;
        } else {
          return `${n}: subtle guidance to stay present and gently course-correct.`;
        }
      });

      const line = "• " + snippets.join(" | ");
      note.value = (note.value ? note.value + "\n" : "") + line;
      input.value = '';

      saveData();
      renderAuraOrb();
      renderOrbChips(data.days[key].auraNumbers);
    });
  }

  if (btnSave && note) {
    btnSave.addEventListener('click', () => {
      const key = todayKey();
      ensureDay(key);
      data.days[key].auraNote = note.value || '';
      saveData();
      renderAuraOrb();
      if (modal) modal.classList.remove('visible');
    });
  }
}

// Helpers

function getRecentDayKeys(daysBack) {
  const keys = [];
  const today = new Date(todayKey());
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function sumForRange(daysBack, field) {
  const keys = getRecentDayKeys(daysBack);
  let sum = 0;
  for (const k of keys) {
    if (data.days[k]) {
      if (field === 'bloom') {
        if (data.days[k].bloom) sum += 1;
      } else if (field === 'gemFacets') {
        sum += data.days[k].gemFacets || 0;
      }
    }
  }
  return sum;
}

function countDaysWithGem(daysBack) {
  const keys = getRecentDayKeys(daysBack);
  let sum = 0;
  for (const k of keys) {
    if (data.days[k] && (data.days[k].gemFacets || 0) > 0) sum += 1;
  }
  return sum;
}

function sumForMonth(field) {
  const now = new Date(todayKey());
  const year = now.getFullYear();
  const month = now.getMonth();
  let sum = 0;
  for (const key in data.days) {
    const d = new Date(key);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayData = data.days[key];
      if (field === 'bloom' && dayData.bloom) sum += 1;
      if (field === 'gemFacets') sum += dayData.gemFacets || 0;
    }
  }
  return sum;
}

function sumForYear(field) {
  const now = new Date(todayKey());
  const year = now.getFullYear();
  let sum = 0;
  for (const key in data.days) {
    const d = new Date(key);
    if (d.getFullYear() === year) {
      const dayData = data.days[key];
      if (field === 'bloom' && dayData.bloom) sum += 1;
      if (field === 'gemFacets') sum += dayData.gemFacets || 0;
    }
  }
  return sum;
}

// Gem helpers

function isGemFullForKey(key) {
  ensureDay(key);
  return (data.days[key].gemFacets || 0) >= DAILY_GEM_TARGET;
}

function handleGemFullTransition(key, wasFull, isFull) {
  if (!wasFull && isFull) {
    ensureDay(key);
    data.days[key].gemCompleted = true;
    if (data.shrine.level < SHRINE_ITEMS.length) {
      data.shrine.level += 1;
    }
    saveData();
  }
}

function setGemWins(count) {
  const key = todayKey();
  ensureDay(key);
  const wasFull = isGemFullForKey(key);
  const safe = Math.max(0, count);
  data.days[key].gemFacets = safe;
  const isFull = isGemFullForKey(key);
  handleGemFullTransition(key, wasFull, isFull);
  saveData();
  render();
}

function addGemWin() {
  const key = todayKey();
  ensureDay(key);
  const wasFull = isGemFullForKey(key);
  data.days[key].gemFacets = (data.days[key].gemFacets || 0) + 1;
  const isFull = isGemFullForKey(key);
  handleGemFullTransition(key, wasFull, isFull);
  saveData();
  render();
}

// Garden

function toggleTodayBloom() {
  const key = todayKey();
  ensureDay(key);
  data.days[key].bloom = !data.days[key].bloom;
  saveData();
  render();
}

function resetWeek() {
  const overlay = document.getElementById('gardenResetOverlay');
  if (overlay) overlay.classList.add('visible');

  setTimeout(() => {
    const today = new Date(todayKey());
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (data.days[key]) {
        data.days[key].bloom = false;
      }
    }
    saveData();
    render();
    if (overlay) overlay.classList.remove('visible');
  }, 700);
}

// Bricks

function setBricksInCurrent(count) {
  const safe = Math.max(0, Math.min(NUM_BRICKS, count));
  data.wall.bricksInCurrent = safe;
  saveData();
  render();
}

function resetWall() {
  data.wall.bricksInCurrent = 0;
  saveData();
  render();
}

function completeWall() {
  if (data.wall.bricksInCurrent === NUM_BRICKS) {
    data.wall.wallsCompleted = (data.wall.wallsCompleted || 0) + 1;
    data.wall.bricksInCurrent = 0;
    saveData();
    render();
  } else {
    alert('Fill all 12 bricks before marking the wall complete.');
  }
}

// Shrine rendering

function renderShrine() {
  const altar = document.getElementById('shrineAltarEmojis');
  const grid = document.getElementById('shrineItemsGrid');
  if (!altar || !grid) return;
  altar.innerHTML = '';
  grid.innerHTML = '';

  const placedSet = new Set(data.shrine.placed || []);

  // Altar emojis
  SHRINE_ITEMS.forEach(item => {
    if (placedSet.has(item.id)) {
      const span = document.createElement('span');
      span.textContent = item.emoji;
      altar.appendChild(span);
    }
  });
  if (!altar.childNodes.length) {
    const span = document.createElement('span');
    span.style.opacity = '0.6';
    span.style.fontSize = '0.8rem';
    span.textContent = 'Tap an unlocked item below to place it.';
    altar.appendChild(span);
  }

  // Grid
  SHRINE_ITEMS.forEach((item, index) => {
    const unlocked = data.shrine.level > index;
    const active = placedSet.has(item.id);
    const div = document.createElement('div');
    div.className = 'shrine-item' + (unlocked ? '' : ' locked') + (active ? ' active' : '');
    div.dataset.id = item.id;
    div.innerHTML = `
      <div class="shrine-item-emoji">${item.emoji}</div>
      <div class="shrine-item-label">${item.label}</div>
    `;
    if (unlocked) {
      div.addEventListener('click', () => {
        const id = item.id;
        const set = new Set(data.shrine.placed || []);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        data.shrine.placed = Array.from(set);
        saveData();
        renderShrine();
      });
    }
    grid.appendChild(div);
  });
}

function attachShrineHandlers() {
  const btnOpen = document.getElementById('btnShrineOpen');
  const modal = document.getElementById('shrineModal');
  const btnClose = document.getElementById('btnShrineClose');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      renderShrine();
      modal.classList.add('visible');
    });
  }
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => modal.classList.remove('visible'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('visible');
    });
  }
}

// Stats + chapter title

function getChapterTitle(monthlyBlooms, monthlyWins, wallsCompleted) {
  if (monthlyBlooms >= 20 && monthlyWins >= 80) return "Chapter: Month of Quiet Mastery";
  if (monthlyBlooms >= 15 && monthlyWins >= 40) return "Chapter: Month of Soft Discipline";
  if (monthlyBlooms >= 10 && monthlyWins < 40) return "Chapter: Month of Soft Presence";
  if (wallsCompleted >= 3) return "Chapter: Month of Foundations";
  if (monthlyWins >= 20 && monthlyBlooms < 7) return "Chapter: Month of Inner Grind";
  return "Chapter: Month of Gentle Rebalancing";
}

function renderStats() {
  const stats = document.getElementById('stats');
  const chapterEl = document.getElementById('chapterTitle');
  const weeklyGemFill = document.getElementById('weeklyGemFill');
  const statGemText = document.getElementById('statGemText');
  const weeklyGardenBed = document.getElementById('weeklyGardenBed');
  const statGardenText = document.getElementById('statGardenText');

  if (!stats) return;
  stats.innerHTML = '';

  const weeklyBlooms = sumForRange(7, 'bloom');
  const weeklyWins = sumForRange(7, 'gemFacets');
  const weeklyGemDays = countDaysWithGem(7);
  const monthlyBlooms = sumForMonth('bloom');
  const monthlyWins = sumForMonth('gemFacets');
  const yearlyBlooms = sumForYear('bloom');
  const yearlyWins = sumForYear('gemFacets');
  const totalBricks = (data.wall.wallsCompleted || 0) * NUM_BRICKS + (data.wall.bricksInCurrent || 0);

  const weekGemPercent = Math.min(100, (weeklyWins / (DAILY_GEM_TARGET * 7)) * 100);

  if (chapterEl) {
    chapterEl.textContent = getChapterTitle(monthlyBlooms, monthlyWins, data.wall.wallsCompleted || 0);
  }
  if (weeklyGemFill) {
    weeklyGemFill.style.height = weekGemPercent + '%';
  }
  if (statGemText) statGemText.textContent = `${weeklyWins} little wins logged this week`;

  if (weeklyGardenBed) {
    weeklyGardenBed.innerHTML = '';
    const keys = getRecentDayKeys(NUM_BLOOMS).reverse();
    let bloomCount = 0;
    keys.forEach(k => {
      ensureDay(k);
      const d = new Date(k);
      const label = ['S','M','T','W','T','F','S'][d.getDay()];
      const div = document.createElement('div');
      div.className = 'weekly-garden-day';
      const bloomed = data.days[k].bloom;
      if (bloomed) bloomCount++;
      div.innerHTML = `<span>${bloomed ? '🌸' : '🌱'}</span><span>${label}</span>`;
      weeklyGardenBed.appendChild(div);
    });
    if (statGardenText) statGardenText.textContent = `${bloomCount}/${NUM_BLOOMS} blooms this week`;
  }

  const blocks = [
    { title: 'This Week', text: `${weeklyBlooms} blooms • ${weeklyWins} wins • ${weeklyGemDays} gem days` },
    { title: 'This Month', text: `${monthlyBlooms} blooms • ${monthlyWins} wins` },
    { title: 'This Year', text: `${yearlyBlooms} blooms • ${yearlyWins} wins` },
    { title: 'Brick Stats', text: `${totalBricks} bricks • ${data.wall.wallsCompleted || 0} walls completed` }
  ];

  blocks.forEach(b => {
    const div = document.createElement('div');
    div.className = 'stat-block';
    div.innerHTML = `<strong>${b.title}</strong>${b.text}`;
    stats.appendChild(div);
  });
}

// Summary for GPT

function generateSummary() {
  const key = todayKey();
  ensureDay(key);
  const todayData = data.days[key];

  const weeklyBlooms = sumForRange(7, 'bloom');
  const weeklyWins = sumForRange(7, 'gemFacets');
  const weeklyGemDays = countDaysWithGem(7);
  const monthlyBlooms = sumForMonth('bloom');
  const monthlyWins = sumForMonth('gemFacets');
  const yearlyBlooms = sumForYear('bloom');
  const yearlyWins = sumForYear('gemFacets');
  const totalBricks = (data.wall.wallsCompleted || 0) * NUM_BRICKS + (data.wall.bricksInCurrent || 0);

  const lines = [];

  lines.push(`Regina Era Tracker Summary (Full V3)`);
  lines.push(`Date: ${key}`);
  lines.push('');
  lines.push(`Today:`);
  lines.push(`- Little wins logged today: ${todayData.gemFacets}`);
  lines.push(`- Gem percent (0–100): ${Math.round(Math.min(todayData.gemFacets, DAILY_GEM_TARGET) / DAILY_GEM_TARGET * 100)}%`);
  lines.push(`- Bloomed today: ${todayData.bloom ? 'yes' : 'no'}`);
  if (todayData.gemNotes) lines.push(`- Gem notes: ${todayData.gemNotes}`);
  if (todayData.gardenNotes) lines.push(`- Garden notes: ${todayData.gardenNotes}`);
  if (todayData.brickNotes) lines.push(`- Brick notes: ${todayData.brickNotes}`);
  if (todayData.auraNumbers && todayData.auraNumbers.length) {
    lines.push(`- Angel numbers seen today: ${todayData.auraNumbers.join(', ')}`);
  }
  if (todayData.auraNote) {
    lines.push(`- Aura orb journal: ${todayData.auraNote}`);
  }
  lines.push('');
  lines.push(`This week:`);
  lines.push(`- Bloom days: ${weeklyBlooms}/${NUM_BLOOMS}`);
  lines.push(`- Total little wins logged: ${weeklyWins}`);
  lines.push(`- Days you logged at least one win: ${weeklyGemDays}`);
  lines.push('');
  lines.push(`This month:`);
  lines.push(`- Blooms: ${monthlyBlooms}`);
  lines.push(`- Little wins: ${monthlyWins}`);
  lines.push('');
  lines.push(`This year:`);
  lines.push(`- Blooms: ${yearlyBlooms}`);
  lines.push(`- Little wins: ${yearlyWins}`);
  lines.push('');
  lines.push(`Bricks & walls:`);
  lines.push(`- Bricks in current wall: ${data.wall.bricksInCurrent}/${NUM_BRICKS}`);
  lines.push(`- Walls completed: ${data.wall.wallsCompleted || 0}`);
  lines.push(`- Total bricks ever: ${totalBricks}`);
  lines.push('');
  lines.push(`Shrine:`);
  lines.push(`- Shrine level (items unlocked): ${data.shrine.level}`);
  if (data.shrine.placed && data.shrine.placed.length) {
    lines.push(`- Items currently on altar: ${data.shrine.placed.join(', ')}`);
  }
  lines.push('');
  lines.push(`Use this summary to update the Regina Era Tracker GPT so it can reflect today’s progress, patterns, angel numbers, shrine unlocks, and how your gem, garden, and walls are growing.`);

  const summaryOutput = document.getElementById('summaryOutput');
  if (summaryOutput) summaryOutput.value = lines.join('\n');
}

function copySummary() {
  const summaryOutput = document.getElementById('summaryOutput');
  if (!summaryOutput || !summaryOutput.value) return;
  summaryOutput.select();
  summaryOutput.setSelectionRange(0, 99999);
  try {
    document.execCommand('copy');
  } catch (e) {}
}

// Notes + actions

function attachNoteListeners() {
  const gemNotes = document.getElementById('gemNotes');
  const gardenNotes = document.getElementById('gardenNotes');
  const brickNotes = document.getElementById('brickNotes');

  if (gemNotes) {
    gemNotes.addEventListener('input', () => {
      const key = todayKey();
      ensureDay(key);
      data.days[key].gemNotes = gemNotes.value;
      saveData();
    });
  }

  if (gardenNotes) {
    gardenNotes.addEventListener('input', () => {
      const key = todayKey();
      ensureDay(key);
      data.days[key].gardenNotes = gardenNotes.value;
      saveData();
    });
  }

  if (brickNotes) {
    brickNotes.addEventListener('input', () => {
      const key = todayKey();
      ensureDay(key);
      data.days[key].brickNotes = brickNotes.value;
      saveData();
    });
  }
}

function attachQuickActions() {
  const container = document.querySelector('.quick-actions');
  if (!container) return;
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    addGemWin();
  });
}

// Tarot modal only

function attachCardHandlers() {
  const tarotCard = document.getElementById('tarotCard');
  const btnExpand = document.getElementById('btnCardExpand');
  const modal = document.getElementById('cardModal');
  const btnClose = document.getElementById('btnCardClose');

  function openModal() {
    if (modal) modal.classList.add('visible');
  }

  if (tarotCard) {
    tarotCard.addEventListener('click', openModal);
  }

  if (btnExpand) {
    btnExpand.addEventListener('click', openModal);
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => modal.classList.remove('visible'));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('visible');
    });
  }
}

// Main render

function render() {
  const today = todayKey();
  ensureDay(today);

  const todayLabel = document.getElementById('todayLabel');
  if (todayLabel) {
    const d = new Date(today);
    todayLabel.textContent = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Tarot
  renderTarotCard();

  // Aura orb
  renderAuraOrb();

  // Gem
  const gemRow = document.getElementById('gemRow');
  const gemFill = document.getElementById('gemFill');
  const gemText = document.getElementById('gemText');
  const gemVisualFill = document.getElementById('gemVisualFill');

  gemRow.innerHTML = '';
  const winsToday = data.days[today].gemFacets || 0;
  const cappedWins = Math.min(winsToday, DAILY_GEM_TARGET);
  const gemPercent = (cappedWins / DAILY_GEM_TARGET) * 100;

  for (let i = 0; i < NUM_FACETS; i++) {
    const div = document.createElement('div');
    const threshold = ((i + 1) / NUM_FACETS) * 100;
    const filled = gemPercent >= threshold;
    div.className = 'facet' + (filled ? ' filled' : '');
    div.textContent = filled ? '💎' : '◇';
    div.onclick = addGemWin;
    gemRow.appendChild(div);
  }

  gemFill.style.width = gemPercent + '%';
  gemFill.className = 'progress-fill gem-fill';
  if (gemPercent >= 100) gemFill.classList.add('level-4');
  else if (gemPercent >= 75) gemFill.classList.add('level-3');
  else if (gemPercent >= 50) gemFill.classList.add('level-2');
  else if (gemPercent >= 25) gemFill.classList.add('level-1');

  if (gemVisualFill) {
    gemVisualFill.style.height = gemPercent + '%';
  }

  gemText.textContent = `Little wins: ${winsToday} • Gem ${Math.round(gemPercent)}% charged`;

  // Notes
  const gemNotes = document.getElementById('gemNotes');
  const gardenNotes = document.getElementById('gardenNotes');
  const brickNotes = document.getElementById('brickNotes');
  if (gemNotes) gemNotes.value = data.days[today].gemNotes || '';
  if (gardenNotes) gardenNotes.value = data.days[today].gardenNotes || '';
  if (brickNotes) brickNotes.value = data.days[today].brickNotes || '';

  // Garden row (last 7 days) + visual plot
  const gardenRow = document.getElementById('gardenRow');
  const gardenPlot = document.getElementById('gardenPlot');
  gardenRow.innerHTML = '';
  gardenPlot.innerHTML = '';

  const keys = getRecentDayKeys(NUM_BLOOMS).reverse();
  let bloomsCount = 0;
  keys.forEach((k) => {
    ensureDay(k);
    const d = new Date(k);
    const label = ['S','M','T','W','T','F','S'][d.getDay()];
    const isToday = k === today;
    const filled = data.days[k].bloom;
    if (filled) bloomsCount++;

    const div = document.createElement('div');
    div.className = 'bloom' + (filled ? ' filled' : '');
    div.title = `${k} (${label})`;
    div.textContent = filled ? '🌸' : (isToday ? '🌱' : '⚪');
    if (isToday) {
      div.onclick = toggleTodayBloom;
    }
    gardenRow.appendChild(div);

    const plotDay = document.createElement('div');
    plotDay.className = 'garden-plot-day';
    const flower = document.createElement('div');
    flower.className = 'garden-plot-flower';
    flower.textContent = filled ? '🌺' : (isToday ? '🌱' : '🍂');
    const lab = document.createElement('div');
    lab.className = 'garden-plot-label';
    lab.textContent = label;
    plotDay.appendChild(flower);
    plotDay.appendChild(lab);
    gardenPlot.appendChild(plotDay);
  });

  const gardenFill = document.getElementById('gardenFill');
  const gardenText = document.getElementById('gardenText');
  const gardenPercent = (bloomsCount / NUM_BLOOMS) * 100;
  gardenFill.style.width = gardenPercent + '%';
  gardenText.textContent = `${bloomsCount}/${NUM_BLOOMS} days blooming this week`;

  // Brick row
  const brickRow = document.getElementById('brickRow');
  brickRow.innerHTML = '';
  const bricksInCurrent = data.wall.bricksInCurrent || 0;
  for (let i = 0; i < NUM_BRICKS; i++) {
    const div = document.createElement('div');
    const filled = i < bricksInCurrent;
    div.className = 'brick' + (filled ? ' filled' : '');
    div.textContent = filled ? '🧱' : '⚪';
    div.onclick = () => setBricksInCurrent(i + 1 === bricksInCurrent ? 0 : i + 1);
    brickRow.appendChild(div);
  }
  const brickFill = document.getElementById('brickFill');
  const brickText = document.getElementById('brickText');
  const brickPercent = (bricksInCurrent / NUM_BRICKS) * 100;
  brickFill.style.width = brickPercent + '%';
  brickText.textContent = `${bricksInCurrent}/${NUM_BRICKS} bricks in this wall`;

  const badges = document.getElementById('brickBadges');
  badges.innerHTML = '';
  if (data.wall.wallsCompleted > 0) {
    const b = document.createElement('div');
    b.className = 'badge';
    b.innerHTML = `🧱 Foundation Level Up × ${data.wall.wallsCompleted}`;
    badges.appendChild(b);
  }

  renderStats();
}

// Init

document.addEventListener('DOMContentLoaded', () => {
  render();
  attachNoteListeners();
  attachQuickActions();
  attachCardHandlers();
  attachOrbHandlers();
  attachShrineHandlers();

  // Buttons
  const btnGemFull = document.getElementById('btnGemFull');
  const btnGemReset = document.getElementById('btnGemReset');
  const btnBloomToday = document.getElementById('btnBloomToday');
  const btnNewWeek = document.getElementById('btnNewWeek');
  const btnWallComplete = document.getElementById('btnWallComplete');
  const btnWallReset = document.getElementById('btnWallReset');
  const btnBrickAdd = document.getElementById('btnBrickAdd');
  const btnGenerateSummary = document.getElementById('btnGenerateSummary');
  const btnCopySummary = document.getElementById('btnCopySummary');

  if (btnGemFull) btnGemFull.addEventListener('click', () => setGemWins(DAILY_GEM_TARGET));
  if (btnGemReset) btnGemReset.addEventListener('click', () => setGemWins(0));
  if (btnBloomToday) btnBloomToday.addEventListener('click', toggleTodayBloom);
  if (btnNewWeek) btnNewWeek.addEventListener('click', resetWeek);
  if (btnWallComplete) btnWallComplete.addEventListener('click', completeWall);
  if (btnWallReset) btnWallReset.addEventListener('click', resetWall);
  if (btnBrickAdd) btnBrickAdd.addEventListener('click', () => {
    const current = data.wall.bricksInCurrent || 0;
    if (current < NUM_BRICKS) {
      data.wall.bricksInCurrent = current + 1;
      saveData();
      render();
    }
  });
  if (btnGenerateSummary) btnGenerateSummary.addEventListener('click', generateSummary);
  if (btnCopySummary) btnCopySummary.addEventListener('click', copySummary);
});
script.js
/* ADDITION: Helpers appended to the end of script.js
   - safe migration for auraLogRaw
   - updateGemVisual
   - logAuraNumberForToday / compute dominant aura
   - small bloom trigger helper
*/

/* ANGEL_MEANINGS: short sample messages per base digit */
const ANGEL_MEANINGS = {
  2: [
    "Support is here; let your roots deepen.",
    "Balance your soft yes with a gentle no.",
    "Trust small consistent steps."
  ],
  3: [
    "Creative spark — open to small experiments.",
    "Speak your truth kindly; ideas will follow.",
    "Play and curiosity will lead you forward."
  ],
  4: [
    "Grounding energy — tend your foundations.",
    "Practical care now pays off in calm later.",
    "Slow, steady work builds lasting comfort."
  ],
  5: [
    "Change is active; lean into curiosity.",
    "A shift invites new options — try one small pivot.",
    "Movement and adaptability will serve you."
  ]
};

/* Safe migration: ensure auraLogRaw exists without removing existing auraNumbers
   This will run once on load if needed. */
(function ensureMigration() {
  if (!data || !data.days) return;
  let migrated = false;
  for (const key of Object.keys(data.days)) {
    const day = data.days[key];
    if (!Array.isArray(day.auraLogRaw)) {
      // If there's an existing auraNumbers array, copy it into auraLogRaw (preserve chronological)
      day.auraLogRaw = Array.isArray(day.auraNumbers) ? day.auraNumbers.slice() : [];
      migrated = true;
    }
  }
  if (migrated) {
    try { saveData(); } catch(e) { /* swallow */ }
  }
})();

/* utility: normalize a logged aura string like '222' or 222 to base digit (2..5) */
function baseDigitFromString(val) {
  const s = String(val).trim();
  if (!s) return null;
  // find the first repeating character if all are the same (e.g., '222' -> '2'), otherwise take last char
  const firstChar = s[0];
  if (s.split('').every(ch => ch === firstChar)) return parseInt(firstChar, 10);
  // fallback: look for digit 2-5 in the string
  const m = s.match(/[2-5]/);
  return m ? parseInt(m[0], 10) : null;
}

/* log an aura number for today; adds to auraLogRaw and ensures unique auraNumbers set */
function logAuraNumberForToday(numRaw) {
  const key = todayKey();
  ensureDay(key);
  const day = data.days[key];

  const normalized = String(numRaw).trim();
  if (!normalized) return;

  if (!Array.isArray(day.auraLogRaw)) day.auraLogRaw = [];
  day.auraLogRaw.push(normalized);

  // auraNumbers: unique base digits seen that day (2,3,4,5)
  const base = baseDigitFromString(normalized);
  if (base && !Array.isArray(day.auraNumbers)) day.auraNumbers = [];
  if (base && !day.auraNumbers.includes(base)) day.auraNumbers.push(base);

  // append a short message line to auraNote with chosen meaning
  try {
    const meanings = ANGEL_MEANINGS[base] || ["An angelic whisper."];
    const msg = meanings[Math.floor(Math.random()*meanings.length)];
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    day.auraNote = (day.auraNote || "") + `[${time}] ${normalized}: ${msg}\n`;
  } catch(e) {}

  saveData();
  applyAuraToDom(key);
}

/* compute dominant color class from auraLogRaw (most frequent base digit) */
function computeAuraDominantClass(key) {
  ensureDay(key);
  const day = data.days[key];
  if (!Array.isArray(day.auraLogRaw) || day.auraLogRaw.length === 0) return 'theme-neutral';

  const counts = {2:0,3:0,4:0,5:0};
  for (const raw of day.auraLogRaw) {
    const b = baseDigitFromString(raw);
    if (b >=2 && b <=5) counts[b] = (counts[b]||0) + 1;
  }
  // find highest
  let topDigit = null;
  let topCount = 0;
  for (const d of [2,3,4,5]) {
    if (counts[d] > topCount) {
      topCount = counts[d];
      topDigit = d;
    }
  }
  if (!topDigit) return 'theme-neutral';
  if (topDigit === 2) return 'theme-papaya';
  if (topDigit === 3) return 'theme-fig';
  if (topDigit === 4) return 'theme-vervain';
  if (topDigit === 5) return 'theme-dusty';
  return 'theme-neutral';
}

/* apply aura class to DOM orb and update title/tooltip */
function applyAuraToDom(key) {
  const orb = document.getElementById('auraOrb');
  if (!orb) return;
  const cls = computeAuraDominantClass(key);
  orb.classList.remove('theme-papaya','theme-fig','theme-vervain','theme-dusty','theme-neutral');
  orb.classList.add(cls);
  // toggle halo opacity based on whether there are aura entries
  ensureDay(key);
  const day = data.days[key];
  orb.style.transform = day.auraLogRaw && day.auraLogRaw.length ? 'scale(1.02)' : '';
  orb.title = `Angel Aura Orb — ${day.auraLogRaw ? day.auraLogRaw.join(', ') : ''}`;
}

/* Update gem visuals (call this after changes to today's gem) */
function updateGemVisual(key) {
  const k = key || todayKey();
  ensureDay(k);
  const day = data.days[k];
  const facets = Math.max(0, Math.min(NUM_FACETS, day.gemFacets || 0));
  const percent = Math.min(100, Math.round((facets / DAILY_GEM_TARGET) * 100));
  const fillEl = document.getElementById('gemFill');
  const visualFill = document.getElementById('gemVisualFill');
  if (fillEl) fillEl.style.width = percent + '%';
  if (visualFill) {
    visualFill.classList.remove('gem-shimmer','gem-full');
    if (facets > 0) visualFill.classList.add('gem-shimmer');
    if (facets >= DAILY_GEM_TARGET) {
      // first time completion: increment shrine level once
      if (!day.gemCompleted) {
        day.gemCompleted = true;
        data.shrine = data.shrine || { level: 0, placed: [] };
        // increment but don't exceed available items
        const newLevel = Math.min((data.shrine.level || 0) + 1, SHRINE_ITEMS.length);
        data.shrine.level = newLevel;
      }
      visualFill.classList.add('gem-full');
    } else {
      day.gemCompleted = false;
    }
  }
  saveData();
}

/* small helper to trigger bloom pop on elements that become bloomed
   expects bloom tiles to addClass 'bloomed' — this will make sure animation runs */
function triggerBloomAnimation(tileEl) {
  if (!tileEl) return;
  tileEl.classList.remove('bloomed');
  // force reflow to restart animation
  // eslint-disable-next-line no-unused-expressions
  tileEl.offsetWidth;
  tileEl.classList.add('bloomed');
}

/* wire a click on the orb to open a small prompt for quick testing (non-blocking)
   This is intentionally minimal: replace with your modal integration as needed */
document.addEventListener('DOMContentLoaded', function () {
  // apply aura for today on load
  applyAuraToDom(todayKey());

  const orb = document.getElementById('auraOrb');
  if (orb) {
    orb.addEventListener('click', function () {
      const val = prompt('Log an angel number (e.g., 222, 333, 444, 555):');
      if (val) {
        logAuraNumberForToday(val);
        applyAuraToDom(todayKey());
        alert('Logged ' + val);
      }
    });
  }

  // initial gem visual sync
  updateGemVisual(todayKey());

  // observe possible gem DOM button actions if present (non intrusive)
  document.addEventListener('click', function (e) {
    const t = e.target;
    if (!t) return;
    // example small convenience: if a button has data-action="addGem" we'll increment gem
    if (t.dataset && t.dataset.action === 'addGem') {
      const k = todayKey();
      ensureDay(k);
      data.days[k].gemFacets = (data.days[k].gemFacets || 0) + 1;
      saveData();
      updateGemVisual(k);
    }
    // if a bloom toggle button (data-action="bloomToday"), mark today's bloom and trigger animation
    if (t.dataset && t.dataset.action === 'bloomToday') {
      const k = todayKey();
      ensureDay(k);
      data.days[k].bloom = true;
      saveData();
      // try to find a tile for today and animate
      const tile = document.querySelector('.bloom-tile.today');
      if (tile) triggerBloomAnimation(tile);
    }
  });
});
