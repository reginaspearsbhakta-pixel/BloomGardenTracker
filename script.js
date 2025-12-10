/* Regina Era Tracker - visual & tone upgrade
   Updates:
   - improved gem fill + shimmer + full glow
   - garden flowers with grow animation
   - tarot front glyphs rendered as small SVGs
   - tailored tarot & angel number messages (addressed to you)
   - orb visual variants and pulse tied to logged numbers

   Storage key: 'reginaEraTracker' (unchanged)
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
  return { gem: {}, garden: {}, bricks: { currentBricks: 0, wallsCompleted: 0 }, aura: {}, tarot: {} };
}
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.error('Failed save', e); } }
function getTodayKey(date = new Date()) { const d = new Date(date.getTime() - date.getTimezoneOffset()*60000); return d.toISOString().slice(0,10); }

let state = loadState();

/* ensure functions */
function ensureGem(k){ if (!state.gem[k]) state.gem[k] = { wins:0, notes:'' }; }
function ensureGarden(k){ if (!state.garden[k]) state.garden[k] = { bloomed:false }; }
function ensureAura(k){ if (!state.aura[k]) state.aura[k] = { numbers:[], log:[], note:'' }; }
function ensureTarot(k){ if (!state.tarot[k]) state.tarot[k] = { cardId:null }; }

/* ---------------- Tarot cards (with tuned tone) ---------------- */
const TAROT_CARDS = [
  { id:'sun', title:'The Sun', glyph:'sun', tagline:'Warm clarity', meaning:"You: gentle, bright, and steady. Let small wins light your day — you're carrying sunlight for your little ones and yourself." },
  { id:'moon', title:'The Moon', glyph:'moon', tagline:'Rest & trust', meaning:"This is a day for trusting your instincts and honoring tiredness. It's okay to withdraw and refuel." },
  { id:'star', title:'The Star', glyph:'star', tagline:'Soft healing', meaning:"A soft reset: small rituals (tea, rest, tidy corner) help you regroup. Your consistency is the real magic." },
  { id:'empress', title:'The Empress', glyph:'empress', tagline:'Nurture', meaning:"Tend the people and spaces that feed you. A tiny comfort today pays dividends for your patience." },
  { id:'magus', title:'The Magus', glyph:'magus', tagline:'Craft & voice', meaning:"Say the thing you mean, then let your work speak. You have more influence than you credit." },
  { id:'temperance', title:'Temperance', glyph:'balance', tagline:'Blend', meaning:"Balance the urgent with the gentle. Add one small pleasure to your routine and watch it soften the day." },
  { id:'strength', title:'Strength', glyph:'strength', tagline:'Gentle power', meaning:"Soft boundaries, steady actions. You are strong because you choose the kind track." },
  { id:'hermit', title:'The Hermit', glyph:'hermit', tagline:'Quiet focus', meaning:"A short focused session (20–40 minutes) will yield more than an all-day pull. Protect that time." }
];

function tarotIndexForKey(key){
  let sum = 0; for (let i=0;i<key.length;i++) sum += key.charCodeAt(i);
  return sum % TAROT_CARDS.length;
}

/* ---------- ANGEL MEANINGS — tailored to you ---------- */
const ANGEL_MEANINGS = {
  '2': [
    "Ask for help today — it's okay; you don't have to hold it all.",
    "Small routines steady the nervous system. Try two deep breaths before breakfast.",
    "Balance doesn't mean perfect; it means choosing the kinder path."
  ],
  '3': [
    "Write one honest line about this morning. Your voice matters here.",
    "Try a tiny creative experiment — 10 minutes, no pressure.",
    "Speak plainly to a close one; clarity opens space."
  ],
  '4': [
    "Tend the routines that keep you safe — a small habit today protects tomorrow.",
    "Boundary check: keep one task off your plate to guard energy.",
    "A steady, boring system now means more calm later."
  ],
  '5': [
    "Try a tiny pivot — change one minor thing and observe.",
    "Upgrade a small ritual (tea, playlist) and treat it like a test.",
    "Movement is the medicine; a short walk invites different choices."
  ]
};

/* ---------- RENDER / UI ---------- */
function updateUI(){ renderGem(); renderGarden(); renderWall(); renderTarot(); renderOrb(); }

/* GEM */
function renderGem(dateKey = getTodayKey()){
  ensureGem(dateKey);
  const wins = state.gem[dateKey].wins || 0;
  const elCount = document.getElementById('gemCount');
  const elFill = document.getElementById('gemFill');
  const elDiamond = document.getElementById('gemDiamond');
  const notes = document.getElementById('gemNotes');

  if (elCount) elCount.textContent = `${wins} / ${GEM_TARGET}`;
  if (notes && state.gem[dateKey]) notes.value = state.gem[dateKey].notes || '';

  const pct = Math.round(Math.max(0, Math.min(100, (wins / GEM_TARGET) * 100)));
  if (elFill) elFill.style.height = pct + '%';

  // visual classes
  if (elDiamond) {
    elDiamond.classList.toggle('shimmer', wins > 0 && wins < GEM_TARGET);
    elDiamond.classList.toggle('full', wins >= GEM_TARGET);
  }
}

function gemAdd(){ const k=getTodayKey(); ensureGem(k); state.gem[k].wins = Math.min(GEM_TARGET, (state.gem[k].wins||0)+1); saveState(); updateUI(); }
function gemSetFull(){ const k=getTodayKey(); ensureGem(k); state.gem[k].wins = GEM_TARGET; saveState(); updateUI(); }
function gemResetToday(){ const k=getTodayKey(); ensureGem(k); state.gem[k].wins = 0; state.gem[k].notes=''; saveState(); updateUI(); }
function gemNotesSave(){ const k=getTodayKey(); ensureGem(k); const notes = document.getElementById('gemNotes'); if (notes) { state.gem[k].notes = notes.value; saveState(); } }

/* GARDEN */
function renderGarden(){
  const row = document.getElementById('gardenRow');
  if (!row) return;
  row.innerHTML = '';
  for (let i = NUM_BLOOMS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getTodayKey(d);
    ensureGarden(key);
    const plot = document.createElement('div');
    plot.className = 'plot';
    plot.dataset.date = key;

    // add bud or flower element
    if (state.garden[key].bloomed) {
      plot.innerHTML = `<div class="flower" aria-hidden="true"></div><div class="plot-label">${new Date(key).toLocaleDateString(undefined,{weekday:'short'})}</div>`;
      plot.classList.add('bloomed');
    } else {
      plot.innerHTML = `<div class="bud" aria-hidden="true"></div><div class="plot-label">${new Date(key).toLocaleDateString(undefined,{weekday:'short'})}</div>`;
    }

    plot.addEventListener('click', () => {
      toggleBloom(key, plot);
    });

    row.appendChild(plot);
  }
}

function toggleBloom(key, el){
  ensureGarden(key);
  state.garden[key].bloomed = !state.garden[key].bloomed;
  saveState();
  if (state.garden[key].bloomed && el){
    // replace bud with flower then animate
    el.classList.add('bloomed');
    el.innerHTML = `<div class="flower" aria-hidden="true"></div><div class="plot-label">${new Date(key).toLocaleDateString(undefined,{weekday:'short'})}</div>`;
    el.classList.remove('animate'); void el.offsetWidth; el.classList.add('animate');
  } else if (el) {
    el.classList.remove('bloomed');
    el.innerHTML = `<div class="bud" aria-hidden="true"></div><div class="plot-label">${new Date(key).toLocaleDateString(undefined,{weekday:'short'})}</div>`;
  }
  updateUI();
}

function bloomToday(){ const k=getTodayKey(); ensureGarden(k); state.garden[k].bloomed = true; saveState(); updateUI(); }

/* WALL (unchanged behavior) */
function renderWall(){
  const container = document.getElementById('wallGrid');
  const label = document.getElementById('wallLabel');
  const completed = document.getElementById('wallsCompleted');
  if (!container) return;
  container.innerHTML = '';
  const count = state.bricks.currentBricks || 0;
  for (let i=0;i<NUM_BRICKS;i++){
    const b=document.createElement('div');
    b.className = 'brick' + (i < count ? ' filled' : '');
    container.appendChild(b);
  }
  if (label) label.textContent = `${count} / ${NUM_BRICKS}`;
  if (completed) completed.textContent = `Walls completed: ${state.bricks.wallsCompleted || 0}`;
}
function addBrick(){ state.bricks.currentBricks = Math.min(NUM_BRICKS, (state.bricks.currentBricks||0)+1); saveState(); updateUI(); }
function completeWall(){ if ((state.bricks.currentBricks||0) >= NUM_BRICKS){ state.bricks.wallsCompleted = (state.bricks.wallsCompleted||0)+1; state.bricks.currentBricks = 0; saveState(); updateUI(); } else { alert('You must have 12 bricks to complete the wall.'); } }
function resetWall(){ state.bricks.currentBricks = 0; saveState(); updateUI(); }

/* TAROT: render and modal with a small CSS/SVG front visual */
function renderTarot(dateKey = getTodayKey()){
  ensureTarot(dateKey);
  if (!state.tarot[dateKey].cardId){
    state.tarot[dateKey].cardId = TAROT_CARDS[tarotIndexForKey(dateKey)].id;
    saveState();
  }
  const card = TAROT_CARDS.find(c=>c.id===state.tarot[dateKey].cardId) || TAROT_CARDS[0];
  document.getElementById('tarotTitle').textContent = card.title;
  document.getElementById('tarotTagline').textContent = card.tagline;
  // render a small SVG glyph into tarotGlyph
  const glyphEl = document.getElementById('tarotGlyph');
  if (glyphEl) glyphEl.innerHTML = glyphSVGFor(card.glyph);
}
function glyphSVGFor(name){
  // small simple glyphs tuned to palette
  const common = `width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"`;
  if (name === 'sun') {
    return `<svg ${common}><defs><radialGradient id="g1"><stop offset="0%" stop-color="${escapeCssVar('--marigold')||'#D4AF37'}"/><stop offset="100%" stop-color="${escapeCssVar('--papaya')||'#BD6809'}"/></radialGradient></defs><circle cx="30" cy="30" r="10" fill="url(#g1)"/></svg>`;
  }
  if (name === 'moon') {
    return `<svg ${common}><path d="M36 30a12 12 0 1 1-20 10 16 16 0 0 0 20-10z" fill="${getCssHex('--berry-2','#9A3F4A')}" opacity="0.9"/></svg>`;
  }
  if (name === 'star') {
    return `<svg ${common}><polygon points="30,6 35,26 56,26 38,36 44,56 30,44 16,56 22,36 4,26 25,26" fill="${getCssHex('--berry','#7a2f3a')}" opacity="0.9"/></svg>`;
  }
  if (name === 'empress') {
    return `<svg ${common}><rect x="12" y="12" width="36" height="36" rx="6" fill="${getCssHex('--vervain','#11321c')}" opacity="0.9"/></svg>`;
  }
  if (name === 'magus') {
    return `<svg ${common}><circle cx="30" cy="30" r="18" stroke="${getCssHex('--papaya','#BD6809')}" stroke-width="4" fill="none"/></svg>`;
  }
  if (name === 'balance') {
    return `<svg ${common}><line x1="10" y1="30" x2="50" y2="30" stroke="${getCssHex('--dusty-blue','#3C4A63')}" stroke-width="4"/><circle cx="20" cy="36" r="4" fill="${getCssHex('--marigold','#D4AF37')}" /><circle cx="40" cy="24" r="4" fill="${getCssHex('--berry','#7a2f3a')}" /></svg>`;
  }
  if (name === 'strength') {
    return `<svg ${common}><path d="M20 44c6-12 20-12 26 0" stroke="${getCssHex('--berry','#7a2f3a')}" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;
  }
  // hermit fallback
  return `<svg ${common}><circle cx="30" cy="30" r="12" fill="${getCssHex('--dusty-blue','#3C4A63')}"/></svg>`;
}
function escapeCssVar(name){ try{ return getComputedStyle(document.documentElement).getPropertyValue(name).trim() }catch(e){return ''} }
function getCssHex(varName, fallback){ const val = escapeCssVar(varName); return val || fallback; }

function openTarotModal(){ const k=getTodayKey(); ensureTarot(k); const card = TAROT_CARDS.find(c=>c.id===state.tarot[k].cardId) || TAROT_CARDS[0]; document.getElementById('modalTarotTitle').textContent = card.title; document.getElementById('modalTarotGlyph').innerHTML = glyphSVGFor(card.glyph); document.getElementById('modalTarotMeaning').textContent = card.meaning; document.getElementById('modalTarot').classList.remove('hidden'); }
function closeTarotModal(){ document.getElementById('modalTarot').classList.add('hidden'); }

/* ---------- ORB / AURA ---------- */
function renderOrb(){
  const orb = document.getElementById('auraOrb');
  const summary = document.getElementById('auraSummary');
  const today = getTodayKey();
  ensureAura(today);
  const numbers = state.aura[today].numbers || [];
  const note = state.aura[today].note || '';
  if (summary) summary.textContent = numbers.length ? `Today: ${numbers.join(', ')}` : 'No aura numbers logged today';

  if (!orb) return;
  // reset classes
  orb.classList.remove('papaya','berry','vervain','dusty','pulse','variant-vervain','variant-papaya','variant-berry');
  orb.style.background = '';
  if (numbers.length === 0) {
    orb.style.background = 'radial-gradient(circle at 30% 30%, rgba(189,104,9,0.95), rgba(154,63,74,0.9))';
    orb.setAttribute('aria-pressed','false');
  } else {
    orb.setAttribute('aria-pressed','true');
    // dominant number determines variant class
    const dominant = computeAuraDominant(today);
    if (numbers.length === 1) {
      const cls = dominant === 2 ? 'papaya' : dominant === 3 ? 'berry' : dominant === 4 ? 'vervain' : 'dusty';
      orb.classList.add(cls);
      orb.classList.add('pulse');
      // add variant for subtle pattern
      if (dominant === 4) orb.classList.add('variant-vervain');
      if (dominant === 2) orb.classList.add('variant-papaya');
      if (dominant === 3) orb.classList.add('variant-berry');
    } else {
      // blend colors for multiple digits
      const colorMap = {2:getCssHex('--papaya','#BD6809'), 3:getCssHex('--berry','#7a2f3a'), 4:getCssHex('--vervain','#11321c'), 5:getCssHex('--dusty-blue','#3C4A63')};
      const stops = numbers.map((n,i)=>`${colorMap[n]} ${Math.round((i/(numbers.length-1))*100)}%`);
      orb.style.background = `linear-gradient(135deg, ${stops.join(',')})`;
      orb.classList.add('pulse');
    }
  }
  // update modal log if visible
  const logEl = document.getElementById('auraLog');
  if (logEl) logEl.textContent = note || '';
}

function computeAuraDominant(dateKey){
  ensureAura(dateKey);
  const arr = state.aura[dateKey].log || [];
  if (!arr.length) return null;
  const counts = {2:0,3:0,4:0,5:0};
  for (const s of arr){
    const b = baseDigit(s);
    if (b>=2 && b<=5) counts[b]++;
  }
  let top=2, max=counts[2];
  for (const d of [3,4,5]) if (counts[d] > max) { max=counts[d]; top=d; }
  return top;
}

function baseDigit(s){
  if (!s && s!==0) return null;
  const str = String(s).trim();
  if (!str) return null;
  // repeating pattern -> base digit
  if (str.split('').every(ch=>ch===str[0])) {
    const n = parseInt(str[0],10);
    if (n>=2 && n<=5) return n;
  }
  const m = str.match(/[2-5]/);
  return m ? parseInt(m[0],10) : null;
}

function openAuraModal(){ const modal = document.getElementById('modalAura'); const input = document.getElementById('auraInput'); const today = getTodayKey(); ensureAura(today); document.getElementById('auraLog').textContent = state.aura[today].note || ''; if (modal) modal.classList.remove('hidden'); if (input) input.value = ''; }
function closeAuraModal(){ const modal = document.getElementById('modalAura'); if (modal) modal.classList.add('hidden'); }

function logAuraFromInput(){
  const input = document.getElementById('auraInput');
  if (!input) return;
  const raw = input.value || '';
  if (!raw.trim()) return;
  const parts = raw.split(/[,|\s]+/).map(s=>s.trim()).filter(Boolean);
  if (!parts.length) return;
  const today = getTodayKey();
  ensureAura(today);
  for (const p of parts){
    state.aura[today].log.push(p);
    const b = baseDigit(p);
    if (b && !state.aura[today].numbers.includes(b)) state.aura[today].numbers.push(b);
    // choose tailored meaning
    const choices = ANGEL_MEANINGS[String(b)] || ['A gentle message arrives.'];
    const msg = choices[Math.floor(Math.random()*choices.length)];
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    state.aura[today].note += `[${time}] ${p}: ${msg}\n`;
  }
  saveState();
  renderOrb();
  // update modal log (keep modal open to review)
  document.getElementById('auraLog').textContent = state.aura[today].note;
}

/* ---------- wiring ---------- */
function wire(){
  // gem
  document.getElementById('btnGemAdd')?.addEventListener('click', gemAdd);
  document.getElementById('btnGemFull')?.addEventListener('click', gemSetFull);
  document.getElementById('btnGemReset')?.addEventListener('click', ()=>{ if (confirm("Reset today's gem?")) gemResetToday(); });
  document.getElementById('gemNotes')?.addEventListener('blur', gemNotesSave);

  // garden
  document.getElementById('btnBloomToday')?.addEventListener('click', bloomToday);

  // wall
  document.getElementById('btnAddBrick')?.addEventListener('click', addBrick);
  document.getElementById('btnCompleteWall')?.addEventListener('click', completeWall);
  document.getElementById('btnResetWall')?.addEventListener('click', ()=>{ if (confirm('Reset wall?')) resetWall(); });

  // tarot
  document.getElementById('btnTarotOpen')?.addEventListener('click', openTarotModal);
  document.getElementById('btnCloseTarot')?.addEventListener('click', closeTarotModal);

  // aura
  document.getElementById('auraOrb')?.addEventListener('click', openAuraModal);
  document.getElementById('btnOpenAura')?.addEventListener('click', openAuraModal);
  document.getElementById('btnCloseAura')?.addEventListener('click', closeAuraModal);
  document.getElementById('btnLogAura')?.addEventListener('click', logAuraFromInput);
  document.getElementById('btnClearAuraInput')?.addEventListener('click', ()=>{ const ta=document.getElementById('auraInput'); if (ta) ta.value=''; });

  // modal overlay click to close
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
  });
}

/* init */
function init(){
  const today = getTodayKey();
  ensureGem(today); ensureGarden(today); ensureAura(today); ensureTarot(today);
  wire();
  updateUI();
  saveState();
}
document.addEventListener('DOMContentLoaded', init);
