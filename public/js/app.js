/**
 * CanDo! - Main Client Application Logic
 * ADHD-Friendly Visual Chore Companion & Space Mission Hub
 * Features:
 * - Splash & Role Select (Cadet Explorer vs Parent HQ)
 * - Wardrobe Studio with live Try-On preview & backdrop themes
 * - High-Res Popo Space Mascot with equipped gear
 * - 5-Step Visual Micro-Steps with contextual Popo poses
 * - Authentic Popo Voice Narrations & Tactile Audio SFX
 * - 2D AR Camera Guide ("Magic Lens") with scanning HUD
 * - Self-Assessment Checkpoint ("Clean enough for now?")
 * - Star Capsule Launch animation & confetti celebration
 * - Cosmic Arcade & Bubble Pop relaxation exit strategy
 * - Parent Command Center with PIN protection & SSE live sync
 */

const state = {
  currentScreen: 'splash',
  kids: [],
  currentKid: null,
  templates: [],
  chores: [],
  activeChore: null,
  activeStepIndex: 0,
  lowBatteryMode: false,
  decorations: [],
  rewards: [],
  redemptions: [],
  alerts: [],
  enteredPin: '',
  cameraStream: null,
  bubbleGame: null,
  inChoreMode: false,
  lastDistractionTime: 0,
  parentPin: '',

  // Wardrobe Studio State
  wardrobeCategory: 'hats',
  selectedTryOnItem: null
};

// --- HELPERS ---
const $id = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Mascot Chore Poses per micro-step
const STEP_POSES = [
  'assets/mascot popo/mascot poses/03-demonstrating.png',
  'assets/mascot popo/mascot poses/04-encouraging.png',
  'assets/mascot popo/mascot poses/01-explaining.png',
  'assets/mascot popo/mascot poses/13-ar-point.png',
  'assets/mascot popo/mascot poses/popo-celebrate.png'
];

// --- WARDROBE CATALOG DEFINITIONS ---
const WARDROBE_CATALOG = {
  hats: [
    {
      id: 'star_cap',
      name: 'Star Cap',
      category: 'hats',
      cost: 10,
      icon: 'assets/mascot popo/worn wardrobe item pose/accesory items/item svg/cap front.svg',
      worn: 'assets/mascot popo/worn wardrobe item pose/mascot worn/popo_star_cap 1.png'
    },
    {
      id: 'crown',
      name: 'Cosmic Crown',
      category: 'hats',
      cost: 25,
      icon: 'assets/mascot popo/worn wardrobe item pose/accesory items/item svg/crown.svg',
      worn: 'assets/mascot popo/worn wardrobe item pose/mascot worn/popo_crown 1.png'
    },
    {
      id: 'moon_beanie',
      name: 'Moon Beanie',
      category: 'hats',
      cost: 15,
      icon: 'assets/mascot popo/worn wardrobe item pose/accesory items/item svg/beanie.svg',
      worn: 'assets/mascot popo/worn wardrobe item pose/mascot worn/popo_moon_beanie 1.png'
    },
    {
      id: 'astro_helmet',
      name: 'Astro Helmet',
      category: 'hats',
      cost: 30,
      icon: 'assets/mascot popo/worn wardrobe item pose/accesory items/item svg/astronaut.svg',
      worn: 'assets/mascot popo/worn wardrobe item pose/mascot worn/popo_astro_helmet 1.png'
    }
  ],
  gear: [
    {
      id: 'star_shades',
      name: 'Star Shades',
      category: 'gear',
      cost: 10,
      icon: 'assets/mascot popo/worn wardrobe item pose/accesory items/item svg/Item · Star Shades.svg',
      worn: 'assets/mascot popo/worn wardrobe item pose/mascot worn/popo_star_glasses 1.png'
    },
    {
      id: 'space_goggles',
      name: 'Space Goggles',
      category: 'gear',
      cost: 15,
      icon: 'assets/mascot popo/worn wardrobe item pose/accesory items/item svg/goggle.svg',
      worn: 'assets/mascot popo/worn wardrobe item pose/mascot worn/popo_space_goggles 1.png'
    },
    {
      id: 'hero_cape',
      name: 'Hero Cape',
      category: 'gear',
      cost: 20,
      icon: 'assets/mascot popo/worn wardrobe item pose/accesory items/item svg/cape.svg',
      worn: 'assets/mascot popo/worn wardrobe item pose/mascot worn/popo_hero_cape 1.png'
    },
    {
      id: 'bow_tie',
      name: 'Cosmic Bow Tie',
      category: 'gear',
      cost: 5,
      icon: 'assets/mascot popo/worn wardrobe item pose/accesory items/item svg/bowtie.svg',
      worn: 'assets/mascot popo/worn wardrobe item pose/mascot worn/popo_bow_tie 1.png'
    }
  ],
  backdrops: [
    {
      id: 'cosmic_glow',
      name: 'Cosmic Glow',
      category: 'backdrops',
      cost: 0,
      iconEmoji: '🌌',
      themeClass: 'theme-cosmic-glow',
      previewGradient: 'radial-gradient(circle at center, #2b255e 0%, #151333 100%)'
    },
    {
      id: 'moon_mint',
      name: 'Moon Mint',
      category: 'backdrops',
      cost: 10,
      iconEmoji: '🪐',
      themeClass: 'theme-moon-mint',
      previewGradient: 'radial-gradient(circle at center, #1b4d42 0%, #0d2621 100%)'
    },
    {
      id: 'sunny_planet',
      name: 'Sunny Planet',
      category: 'backdrops',
      cost: 15,
      iconEmoji: '☀️',
      themeClass: 'theme-sunny-planet',
      previewGradient: 'radial-gradient(circle at center, #6b4012 0%, #2b1704 100%)'
    },
    {
      id: 'pink_nebula',
      name: 'Pink Nebula',
      category: 'backdrops',
      cost: 20,
      iconEmoji: '✨',
      themeClass: 'theme-pink-nebula',
      previewGradient: 'radial-gradient(circle at center, #591e42 0%, #26091b 100%)'
    }
  ]
};

function toast(message, kind) {
  const stack = $id('toastStack');
  if (!stack) { console.log(message); return; }
  const k = kind || (/incorrect|cannot|failed|not enough|need \d|required/i.test(message) ? 'error' : '');
  const el = document.createElement('div');
  el.className = 'toast ' + k;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function parentHeaders() {
  return { 'Content-Type': 'application/json', 'x-parent-pin': state.parentPin || '' };
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const st = await (await fetch('/api/setup/status')).json();
    if (!st.setupComplete) { location.href = '/setup.html'; return; }
  } catch (e) { /* offline: continue */ }

  initSSE();
  initDistractionMonitor();
  await loadKids();
  await loadTemplates();
  setupEventListeners();

  // Show Splash / Role Select screen on fresh launch
  showScreen('splash');
});

// --- SERVER-SENT EVENTS (SSE) FOR LIVE UPDATES ---
function initSSE() {
  if (window.Capacitor || location.protocol === 'file:') {
    return; // Standalone offline mode
  }
  try {
    const evtSource = new EventSource('/api/events');
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleLiveEvent(data);
      } catch (e) {
        console.error('SSE JSON error', e);
      }
    };
    evtSource.onerror = () => {
      // Reconnection handled automatically by browser
    };
  } catch (err) {
    console.warn('SSE not supported or failed to connect:', err);
  }
}

function handleLiveEvent(evt) {
  if (!evt || !evt.type) return;

  // Kid-facing: parent approved / asked for a touch-up
  if (evt.type === 'chore_approved' && state.currentKid && evt.payload.kidId === state.currentKid.id) {
    state.currentKid.stars = evt.payload.totalStars;
    updateHeaderStars();
    toast('🎉 Your parent approved your chore! You earned all your stars!', 'star');
    if (window.sounds) {
      window.sounds.playParentApproved();
      window.sounds.playVoice('parent_approved');
    }
    if (state.currentScreen === 'base' || state.currentScreen === 'arcade') loadKidChores();
  }
  if (evt.type === 'chore_redo' && state.currentKid && evt.payload.kidId === state.currentKid.id) {
    toast('💬 Popo: ' + (evt.payload.note || "That's okay! Let's do one more small round."), 'star');
    if (window.sounds) window.sounds.playVoice('room_check_no');
    if (state.currentScreen === 'base') loadKidChores();
  }
  if (evt.type === 'kid_created') loadKids();

  if (evt.type === 'mission_completed' || evt.type === 'alert' || evt.type === 'reward_claimed' || evt.type === 'chore_approved') {
    if (state.currentScreen === 'parent') {
      loadParentInbox();
      loadAlertsFeed();
      loadRedemptions();
      loadStats();
    }
    if (evt.payload && evt.payload.kid && state.currentKid && evt.payload.kid.id === state.currentKid.id) {
      state.currentKid.stars = evt.payload.kid.stars;
      updateHeaderStars();
    }
  }
}

// --- SCREEN SWITCHER ---
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.add('active');
    state.currentScreen = screenId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update header context
  const header = document.getElementById('appHeader');
  const starCounter = document.getElementById('headerStarCounter');
  const explorerBtn = document.getElementById('headerExplorerBtn');

  if (screenId === 'splash') {
    state.inChoreMode = false;
    starCounter.style.display = 'none';
    explorerBtn.style.display = 'none';
  } else if (screenId === 'gateway') {
    state.inChoreMode = false;
    starCounter.style.display = 'none';
    explorerBtn.style.display = 'none';
  } else if (screenId === 'parent') {
    state.inChoreMode = false;
    starCounter.style.display = 'none';
    explorerBtn.style.display = 'inline-flex';
  } else {
    // Kid screens (base, chore, arcade)
    starCounter.style.display = 'inline-flex';
    explorerBtn.style.display = 'inline-flex';
    updateHeaderStars();
  }
}

// --- DATA LOADERS ---
async function loadKids() {
  try {
    const res = await fetch('/api/kids');
    const data = await res.json();
    state.kids = Array.isArray(data) && data.length > 0 ? data : [
      { id: 1, name: 'Buri', stars: 25, color: '#6B5BFF', avatar: 'assets/popo_waving.png' },
      { id: 2, name: 'Leo', stars: 15, color: '#8DBD61', avatar: 'assets/popo_backpack.png' }
    ];
    renderKidsGateway();
    renderTemplatesList();
  } catch (err) {
    console.error('Failed to load kids', err);
    state.kids = [
      { id: 1, name: 'Buri', stars: 25, color: '#6B5BFF', avatar: 'assets/popo_waving.png' },
      { id: 2, name: 'Leo', stars: 15, color: '#8DBD61', avatar: 'assets/popo_backpack.png' }
    ];
    renderKidsGateway();
    renderTemplatesList();
  }
}

async function loadTemplates() {
  try {
    const res = await fetch('/api/templates');
    state.templates = await res.json();
    renderTemplatesList();
  } catch (err) {
    console.error('Failed to load chore templates', err);
  }
}

// --- SCREEN 1: GATEWAY (WHO IS EXPLORING TODAY?) ---
function renderKidsGateway() {
  const grid = document.getElementById('gatewayKidsGrid');
  const empty = document.getElementById('gatewayEmpty');
  if (!grid) return;

  grid.innerHTML = '';
  if (empty) empty.style.display = state.kids.length === 0 ? 'block' : 'none';

  state.kids.forEach(kid => {
    const card = document.createElement('div');
    card.className = 'kid-card';
    card.onclick = () => selectKid(kid);
    card.innerHTML = `
      <div class="kid-avatar-wrap" style="border-color: ${kid.color || '#8dbd61'}">
        <img src="${kid.avatar || 'assets/popo_mascot.png'}" alt="${esc(kid.name)}">
      </div>
      <div class="kid-name">${esc(kid.name)}</div>
      <div class="kid-card-stars">⭐ ${kid.stars} Stars</div>
    `;
    grid.appendChild(card);
  });

  // Add Kid card for parent access
  const addCard = document.createElement('div');
  addCard.className = 'kid-card add-kid-card';
  addCard.onclick = () => openPinModal('add_kid');
  addCard.innerHTML = `
    <span style="font-size: 38px; margin-bottom: 8px;">➕</span>
    <span style="font-weight: 700; font-size: 16px;">Add Cadet</span>
    <span style="font-size: 12px; color: var(--text-muted);">(Parent PIN required)</span>
  `;
  grid.appendChild(addCard);
}

function selectKid(kid) {
  state.currentKid = kid;
  updateHeaderStars();
  if (window.sounds) {
    window.sounds.playAvatarTock();
    window.sounds.playGentleChime();
  }
  showScreen('base');
  loadKidSpaceBase();
}

function updateHeaderStars() {
  const text = document.getElementById('headerStarsText');
  if (text && state.currentKid) {
    text.textContent = `${state.currentKid.stars} ⭐`;
  }
}

// --- WARDROBE STORAGE & LOGIC ---
function getKidWardrobeKey(kidId) {
  return `cando_wardrobe_v2_${kidId}`;
}

function getKidUnlockedKey(kidId) {
  return `cando_unlocked_v2_${kidId}`;
}

function getKidWardrobe(kidId) {
  try {
    const raw = localStorage.getItem(getKidWardrobeKey(kidId));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { hat: null, gear: null, backdrop: 'cosmic_glow' };
}

function saveKidWardrobe(kidId, wardrobe) {
  try {
    localStorage.setItem(getKidWardrobeKey(kidId), JSON.stringify(wardrobe));
  } catch (e) {}
}

function getKidUnlockedItems(kidId) {
  try {
    const raw = localStorage.getItem(getKidUnlockedKey(kidId));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  // Default unlocked items
  return ['cosmic_glow'];
}

function addKidUnlockedItem(kidId, itemId) {
  const items = getKidUnlockedItems(kidId);
  if (!items.includes(itemId)) {
    items.push(itemId);
    try {
      localStorage.setItem(getKidUnlockedKey(kidId), JSON.stringify(items));
    } catch (e) {}
  }
}

// --- SCREEN 2: THE SPACE BASE (KID'S QUEST HUB) ---
async function loadKidSpaceBase() {
  if (!state.currentKid) return;

  const kidNameEl = document.getElementById('baseKidName');
  if (kidNameEl) kidNameEl.textContent = `${state.currentKid.name}'s Space Base`;

  updateSpaceBaseVisuals();
  await loadKidChores();
  await loadKidDecorations();
}

function updateSpaceBaseVisuals() {
  if (!state.currentKid) return;
  const wardrobe = getKidWardrobe(state.currentKid.id);

  // Update room backdrop theme
  const roomEl = document.getElementById('spaceBaseRoom');
  if (roomEl) {
    roomEl.className = 'space-base-room';
    const backdropItem = WARDROBE_CATALOG.backdrops.find(b => b.id === wardrobe.backdrop);
    roomEl.classList.add(backdropItem ? backdropItem.themeClass : 'theme-cosmic-glow');
  }

  // Determine equipped look for high-res mascot
  let mascotSrc = 'assets/mascot popo/mascot poses/popo-wave.png';
  let wearingText = 'Standard Cadet Suit';

  if (wardrobe.hat) {
    const hatItem = WARDROBE_CATALOG.hats.find(h => h.id === wardrobe.hat);
    if (hatItem) {
      mascotSrc = hatItem.worn;
      wearingText = hatItem.name;
    }
  } else if (wardrobe.gear) {
    const gearItem = WARDROBE_CATALOG.gear.find(g => g.id === wardrobe.gear);
    if (gearItem) {
      mascotSrc = gearItem.worn;
      wearingText = gearItem.name;
    }
  }

  const badgeEl = document.getElementById('baseWearingBadge');
  if (badgeEl) badgeEl.textContent = `Wearing: ${wearingText}`;

  // Render High-Res Popo in center of Room
  renderRoomDecorations(mascotSrc);
}

async function loadKidChores() {
  if (!state.currentKid) return;
  try {
    const res = await fetch(`/api/chores?kid_id=${state.currentKid.id}`);
    state.chores = await res.json();
    renderTaskBoard();
    updateArcadeLockStatus();
  } catch (err) {
    console.error('Failed to load kid chores', err);
  }
}

function renderTaskBoard() {
  const list = document.getElementById('taskBoardList');
  if (!list) return;

  list.innerHTML = '';
  const activeChores = state.chores.filter(c => c.status !== 'completed');

  if (activeChores.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 16px;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <h3 style="font-size: 20px; color: #fff;">All Missions Accomplished!</h3>
        <p style="font-size: 15px;">Orbit is clear and your space is reset! Head to Cosmic Arcade to relax!</p>
      </div>
    `;
    return;
  }

  activeChores.forEach(chore => {
    const card = document.createElement('div');
    card.className = 'chore-card';
    if (chore.status === 'pending_approval') card.classList.add('pending-approval');

    const totalSteps = chore.total_steps || 5;
    const completedSteps = chore.completed_steps || 0;

    card.innerHTML = `
      <div class="chore-left">
        <div class="chore-icon">${chore.icon || '🚀'}</div>
        <div class="chore-details">
          <div class="chore-title">${esc(chore.title)}</div>
          <div class="chore-room-tag">📍 ${esc(chore.room_name)}</div>
          <div class="chore-goal-text">Goal: ${chore.finish_goal || 'Keep orbit tidy!'}</div>
          ${chore.safety_note ? `<div style="color: var(--cosmic-pink); font-size: 13px; font-weight: 700; margin-top: 4px;">⚠️ ${esc(chore.safety_note)}</div>` : ''}
        </div>
      </div>
      <div class="chore-right">
        <div class="chore-reward-pill">+${chore.stars_reward || 10} ⭐</div>
        ${chore.status === 'pending_approval' 
          ? `<span style="color: var(--star-gold); font-weight: 700; font-size: 14px;">📸 Waiting for Parent Approval</span>` 
          : `<button class="btn-start-chore" onclick="startChore(${chore.id})">
              ${completedSteps > 0 ? 'Resume Quest 🚀' : 'Start Quest 🚀'}
            </button>`
        }
      </div>
    `;
    list.appendChild(card);
  });
}

function updateArcadeLockStatus() {
  const btn = document.getElementById('arcadeHubBtn');
  const badge = document.getElementById('arcadeTapeBadge');
  if (!btn) return;

  const incomplete = state.chores.filter(c => c.status === 'assigned' || c.status === 'in_progress');
  if (incomplete.length === 0 && state.chores.length > 0) {
    btn.classList.remove('arcade-locked');
    btn.classList.add('arcade-unlocked');
    if (badge) badge.style.display = 'none';
  } else {
    btn.classList.add('arcade-locked');
    btn.classList.remove('arcade-unlocked');
    if (badge) badge.style.display = 'block';
  }
}

// --- SPACE BASE ROOM CUSTOMIZER & HIGH-RES POPO ---
async function loadKidDecorations() {
  if (!state.currentKid) return;
  try {
    const res = await fetch(`/api/decorations/${state.currentKid.id}`);
    state.decorations = await res.json();
    renderRoomDecorations();
  } catch (err) {
    console.error('Failed to load decorations', err);
  }
}

function renderRoomDecorations(mascotSrc = null) {
  const container = document.getElementById('roomDecorations');
  if (!container) return;

  container.innerHTML = '';

  // High-Res Popo Buddy center stage with equipped wardrobe pose
  const src = mascotSrc || 'assets/mascot popo/mascot poses/popo-wave.png';
  const mascotSpot = document.createElement('div');
  mascotSpot.className = 'base-mascot-spot';
  mascotSpot.title = 'Popo Space Buddy — Click to open Wardrobe!';
  mascotSpot.onclick = () => openWardrobeStudio();
  mascotSpot.innerHTML = `
    <img src="${src}" class="base-mascot-img" id="basePopoImg" alt="Popo Space Buddy">
    <div style="font-size: 15px; font-weight: 800; color: var(--star-gold); margin-top: 4px;">Popo</div>
  `;
  container.appendChild(mascotSpot);

  // Render unlocked & placed items
  state.decorations.filter(d => d.is_unlocked && d.is_placed).forEach(d => {
    const itemEl = document.createElement('div');
    itemEl.className = 'decor-item';
    itemEl.title = d.item_name;
    itemEl.textContent = d.icon;
    itemEl.onclick = () => {
      if (window.sounds) window.sounds.playPop(800);
    };
    container.appendChild(itemEl);
  });
}

function openRoomCustomizerModal() {
  if (window.sounds) window.sounds.playButtonTap();
  const listEl = document.getElementById('roomCustomizerList');
  if (!listEl) return;

  listEl.innerHTML = '';
  state.decorations.forEach(d => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 8px;';
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 32px;">${d.icon}</span>
        <div>
          <div style="font-weight: 700; font-size: 16px;">${esc(d.item_name)}</div>
          <div style="font-size: 13px; color: var(--star-gold);">${d.is_unlocked ? 'Unlocked ✨' : `${d.star_cost} ⭐`}</div>
        </div>
      </div>
      <div>
        ${d.is_unlocked 
          ? `<span style="color: var(--alien-green); font-weight: 700;">Active in Base</span>` 
          : `<button class="btn-start-chore" style="padding: 6px 14px; font-size: 14px;" onclick="buyDecoration('${d.item_key}')">Unlock ⭐</button>`}
      </div>
    `;
    listEl.appendChild(row);
  });

  document.getElementById('roomCustomizerModal').classList.add('active');
}

async function buyDecoration(itemKey) {
  if (!state.currentKid) return;
  try {
    const res = await fetch(`/api/decorations/${state.currentKid.id}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_key: itemKey })
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Cannot unlock decoration');
      return;
    }

    state.currentKid = data.kid;
    updateHeaderStars();
    if (window.sounds) window.sounds.playStarDing();
    await loadKidDecorations();
    openRoomCustomizerModal();
    toast('🎉 Cosmic item placed in your Space Base!');
  } catch (err) {
    console.error('Failed to buy decoration', err);
  }
}

// ========================================================
// WARDROBE STUDIO (6.1 Hats, 6.1a Gear, 6.1b Backdrops, 6.4 Look Saved)
// ========================================================
function openWardrobeStudio(category = 'hats') {
  if (!state.currentKid) {
    toast('Choose a Cadet first!');
    return;
  }
  if (window.sounds) window.sounds.playButtonTap();
  state.wardrobeCategory = category;
  document.getElementById('wardrobeModal').classList.add('active');
  switchWardrobeTab(category);
}

function switchWardrobeTab(category) {
  state.wardrobeCategory = category;
  document.querySelectorAll('.wardrobe-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === category);
  });

  const items = WARDROBE_CATALOG[category] || [];
  const wardrobe = getKidWardrobe(state.currentKid.id);

  // Set default try-on selection
  let defaultSelection = items[0];
  if (category === 'hats' && wardrobe.hat) {
    const equipped = items.find(i => i.id === wardrobe.hat);
    if (equipped) defaultSelection = equipped;
  } else if (category === 'gear' && wardrobe.gear) {
    const equipped = items.find(i => i.id === wardrobe.gear);
    if (equipped) defaultSelection = equipped;
  } else if (category === 'backdrops' && wardrobe.backdrop) {
    const equipped = items.find(i => i.id === wardrobe.backdrop);
    if (equipped) defaultSelection = equipped;
  }

  renderWardrobeGrid(category);
  if (defaultSelection) {
    tryOnWardrobeItem(defaultSelection);
  }
}

function renderWardrobeGrid(category) {
  const grid = document.getElementById('wardrobeItemsGrid');
  if (!grid || !state.currentKid) return;

  grid.innerHTML = '';
  const items = WARDROBE_CATALOG[category] || [];
  const wardrobe = getKidWardrobe(state.currentKid.id);
  const unlocked = getKidUnlockedItems(state.currentKid.id);

  items.forEach(item => {
    const isEquipped = (category === 'hats' && wardrobe.hat === item.id) ||
                       (category === 'gear' && wardrobe.gear === item.id) ||
                       (category === 'backdrops' && wardrobe.backdrop === item.id);
    const isUnlocked = item.cost === 0 || unlocked.includes(item.id);
    const isSelected = state.selectedTryOnItem && state.selectedTryOnItem.id === item.id;

    const card = document.createElement('div');
    card.className = `wardrobe-item-card ${isSelected ? 'selected' : ''} ${isEquipped ? 'equipped' : ''}`;
    card.onclick = () => {
      if (window.sounds) window.sounds.playAvatarTock();
      tryOnWardrobeItem(item);
      renderWardrobeGrid(category);
    };

    let iconHtml = '';
    if (item.iconEmoji) {
      iconHtml = `<div style="font-size: 38px; line-height: 58px;">${item.iconEmoji}</div>`;
    } else {
      iconHtml = `<img src="${item.icon}" class="wardrobe-item-icon" alt="${item.name}">`;
    }

    card.innerHTML = `
      ${iconHtml}
      <div class="wardrobe-item-name">${item.name}</div>
      <div class="wardrobe-item-price">${isUnlocked ? 'Unlocked ✨' : `${item.cost} ⭐`}</div>
    `;
    grid.appendChild(card);
  });
}

function tryOnWardrobeItem(item) {
  state.selectedTryOnItem = item;
  const stageMascot = document.getElementById('stageMascotImg');
  const stageTitle = document.getElementById('stageItemTitle');
  const stageCost = document.getElementById('stageItemCost');
  const stageBtn = document.getElementById('stageEquipBtn');
  const stageBox = document.getElementById('wardrobeStage');

  if (!item || !stageMascot || !stageTitle) return;

  stageTitle.textContent = item.name;

  // Visual Try-On
  if (item.category === 'backdrops') {
    stageBox.style.background = item.previewGradient || '#252048';
    // Display Popo wearing current hat or wave
    const wardrobe = getKidWardrobe(state.currentKid.id);
    let previewSrc = 'assets/mascot popo/mascot poses/popo-wave.png';
    if (wardrobe.hat) {
      const h = WARDROBE_CATALOG.hats.find(x => x.id === wardrobe.hat);
      if (h) previewSrc = h.worn;
    } else if (wardrobe.gear) {
      const g = WARDROBE_CATALOG.gear.find(x => x.id === wardrobe.gear);
      if (g) previewSrc = g.worn;
    }
    stageMascot.src = previewSrc;
  } else {
    // Hats or Gear
    stageMascot.src = item.worn || 'assets/mascot popo/mascot poses/popo-wave.png';
  }

  // Determine Equip Button Status
  const wardrobe = getKidWardrobe(state.currentKid.id);
  const unlocked = getKidUnlockedItems(state.currentKid.id);
  const isEquipped = (item.category === 'hats' && wardrobe.hat === item.id) ||
                     (item.category === 'gear' && wardrobe.gear === item.id) ||
                     (item.category === 'backdrops' && wardrobe.backdrop === item.id);
  const isUnlocked = item.cost === 0 || unlocked.includes(item.id);
  const kidStars = state.currentKid.stars || 0;

  stageBtn.className = 'stage-equip-btn';

  if (isEquipped) {
    stageCost.textContent = 'Currently Equipped ✨';
    stageBtn.classList.add('btn-equip-equipped');
    stageBtn.innerHTML = `<span>✓</span> <span>Look Saved</span>`;
    stageBtn.onclick = null;
  } else if (isUnlocked) {
    stageCost.textContent = 'Unlocked & Ready!';
    stageBtn.classList.add('btn-equip-active');
    stageBtn.innerHTML = `<span>✨</span> <span>Equip Look</span>`;
    stageBtn.onclick = () => equipCurrentWardrobeItem(item);
  } else {
    // Locked item
    stageCost.textContent = `Cost: ${item.cost} ⭐`;
    if (kidStars >= item.cost) {
      stageBtn.classList.add('btn-equip-locked');
      stageBtn.innerHTML = `<span>⭐</span> <span>Unlock & Equip (${item.cost} ⭐)</span>`;
      stageBtn.onclick = () => unlockAndEquipWardrobeItem(item);
    } else {
      stageBtn.classList.add('btn-equip-equipped');
      stageBtn.innerHTML = `<span>🔒</span> <span>Need ${item.cost} ⭐ (You have ${kidStars} ⭐)</span>`;
      stageBtn.onclick = () => {
        toast(`Not enough stars yet! You have ${kidStars} ⭐. Complete missions to earn more!`, 'error');
      };
    }
  }
}

async function unlockAndEquipWardrobeItem(item) {
  if (!state.currentKid) return;
  const kidStars = state.currentKid.stars || 0;
  if (kidStars < item.cost) {
    toast(`Need ${item.cost} ⭐ to unlock!`, 'error');
    return;
  }

  // Deduct stars locally & update state
  state.currentKid.stars -= item.cost;
  updateHeaderStars();
  addKidUnlockedItem(state.currentKid.id, item.id);

  if (window.sounds) window.sounds.playStarDing();
  equipCurrentWardrobeItem(item);
  toast(`🎉 Unlocked ${item.name}! Look equipped!`, 'star');
}

function equipCurrentWardrobeItem(item) {
  if (!state.currentKid) return;
  const wardrobe = getKidWardrobe(state.currentKid.id);

  if (item.category === 'hats') {
    wardrobe.hat = (wardrobe.hat === item.id) ? null : item.id;
  } else if (item.category === 'gear') {
    wardrobe.gear = (wardrobe.gear === item.id) ? null : item.id;
  } else if (item.category === 'backdrops') {
    wardrobe.backdrop = item.id;
  }

  saveKidWardrobe(state.currentKid.id, wardrobe);
  if (window.sounds) window.sounds.playStarDing();

  // Update Space Base immediately
  updateSpaceBaseVisuals();
  tryOnWardrobeItem(item);
  renderWardrobeGrid(item.category);
  toast(`✨ Look Saved! Popo is sporting your new style!`);
}

// --- SCREEN 3: ACTIVE CHORE MODE (MICRO-STEP FLOW) ---
async function startChore(choreId) {
  try {
    const res = await fetch(`/api/chores/${choreId}`);
    state.activeChore = await res.json();

    state.lowBatteryMode = state.activeChore.is_low_battery === 1;
    const toggleEl = document.getElementById('lowBatteryToggle');
    if (toggleEl) toggleEl.checked = state.lowBatteryMode;

    const steps = getVisibleSteps();
    let startIndex = steps.findIndex(s => s.is_completed === 0);
    if (startIndex === -1) startIndex = 0;
    state.activeStepIndex = startIndex;

    showScreen('chore');
    renderActiveStep();

    // Authentic audio voiceover for mission start
    if (window.sounds) {
      window.sounds.playMissionPulse();
      window.sounds.playVoice('start_task');
    }
  } catch (err) {
    console.error('Failed to start chore', err);
  }
}

function getVisibleSteps() {
  if (!state.activeChore || !state.activeChore.steps) return [];
  if (state.lowBatteryMode) {
    const filtered = state.activeChore.steps.filter(s => s.low_battery_keep === 1);
    return filtered.length > 0 ? filtered : [state.activeChore.steps[0]];
  }
  return state.activeChore.steps;
}

function toggleLowBatteryMode(enable) {
  state.lowBatteryMode = enable;
  if (state.activeChore) {
    fetch(`/api/chores/${state.activeChore.id}/low-battery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_low_battery: enable ? 1 : 0 })
    });
  }

  const steps = getVisibleSteps();
  if (state.activeStepIndex >= steps.length) {
    state.activeStepIndex = steps.length - 1;
  }
  renderActiveStep();
}

function renderActiveStep() {
  const chore = state.activeChore;
  const steps = getVisibleSteps();
  const currentStep = steps[state.activeStepIndex];

  if (!currentStep) return;

  document.getElementById('activeChoreTitle').textContent = chore.title;
  renderSpaceshipProgress(steps.length, state.activeStepIndex);

  document.getElementById('stepTag').textContent = `Step ${state.activeStepIndex + 1} of ${steps.length}`;
  document.getElementById('stepInstruction').textContent = currentStep.text;

  // Contextual Popo Mascot Pose
  const popoImg = document.getElementById('popoPoseImg');
  const poseSrc = STEP_POSES[state.activeStepIndex % STEP_POSES.length];
  if (popoImg) popoImg.src = poseSrc;

  document.getElementById('popoHintText').textContent = currentStep.popo_hint || 'Popo is right here cheering you on!';

  const safetyEl = document.getElementById('choreSafetyBanner');
  if (chore.safety_note) {
    safetyEl.style.display = 'block';
    safetyEl.textContent = `⚠️ ${esc(chore.safety_note)}`;
  } else {
    safetyEl.style.display = 'none';
  }

  const prevBtn = document.getElementById('prevStepBtn');
  prevBtn.style.visibility = (state.activeStepIndex > 0) ? 'visible' : 'hidden';

  const isLast = (state.activeStepIndex === steps.length - 1);
  const nextBtn = document.getElementById('nextStepBtn');
  if (isLast) {
    nextBtn.innerHTML = `📸 Done! Check Room ⭐`;
  } else {
    nextBtn.innerHTML = `Done! Next Step ➡️ ⭐`;
  }

  const cs = $id('collectedStars');
  if (cs) cs.textContent = `⭐ ${state.activeStepIndex} collected`;

  // Audio voice narration for instruction text
  if (window.sounds && window.sounds.speechEnabled) {
    window.sounds.speak(currentStep.text);
  }
}

function renderSpaceshipProgress(totalSteps, currentIndex) {
  const container = document.getElementById('progressOrbitNodes');
  const ship = document.getElementById('movingSpaceship');
  if (!container || !ship) return;

  container.innerHTML = '';
  for (let i = 0; i < totalSteps; i++) {
    const node = document.createElement('div');
    node.className = 'orbit-node';
    if (i < currentIndex) node.classList.add('done');
    if (i === currentIndex) node.classList.add('current');
    container.appendChild(node);
  }

  setTimeout(() => {
    const pct = totalSteps > 1 ? (currentIndex / (totalSteps - 1)) * 100 : 100;
    ship.style.left = `calc(${pct}% - 14px)`;
  }, 50);
}

async function completeCurrentStep() {
  const steps = getVisibleSteps();
  const currentStep = steps[state.activeStepIndex];

  // Tactile completion sounds
  if (window.sounds) {
    window.sounds.playMicroStepComplete();
    window.sounds.playStarDing();
  }

  // Mark step complete in database
  if (state.activeChore) {
    await fetch(`/api/chores/${state.activeChore.id}/step/${currentStep.step_num}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: true })
    });
  }

  if (state.activeStepIndex >= steps.length - 1) {
    // Open Self-Assessment Check-in modal
    openCheckin();
  } else {
    state.activeStepIndex++;
    if (window.sounds) {
      window.sounds.playVoice('step_complete');
    }
    renderActiveStep();
  }
}

// --- SELF-ASSESSMENT CHECKPOINT MODAL (4.2a Self-Check) ---
function openCheckin(note = '') {
  if (window.sounds) {
    window.sounds.playSelfAssessment();
    window.sounds.speak('Is the room clean enough for now?');
  }
  $id('checkinNote').textContent = note || "Take a look around. No rush — any progress is a real win!";
  $id('checkinModal').classList.add('active');
}

async function requestHelp() {
  if (!state.currentKid || !state.activeChore) return;
  if (window.sounds) {
    window.sounds.playHelpHum();
    window.sounds.playVoice('need_help');
  }
  try {
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kid_id: state.currentKid.id,
        type: 'help',
        title: '🆘 Help requested',
        message: `${state.currentKid.name} needs help with '${state.activeChore.title}'. Pop in and lend a hand!`
      })
    });
    toast("🆘 Popo told your parent. Help is on the way!", 'star');
  } catch (e) {
    toast('Could not reach the server. Try again.', 'error');
  }
}

function prevStep() {
  if (state.activeStepIndex > 0) {
    state.activeStepIndex--;
    if (window.sounds) window.sounds.playWhoosh();
    renderActiveStep();
  }
}

function readCurrentStepAloud() {
  const steps = getVisibleSteps();
  const currentStep = steps[state.activeStepIndex];
  if (currentStep && window.sounds) {
    window.sounds.playVoice('next_step', () => {
      window.sounds.speak(currentStep.text);
    });
  }
}

// --- SCREEN 4: 2D AR "MAGIC LENS" (4.1b AR Camera Guide) ---
async function openArMagicLens() {
  const modal = document.getElementById('arModal');
  const video = document.getElementById('arVideo');
  const steps = getVisibleSteps();
  const currentStep = steps[state.activeStepIndex];

  document.getElementById('arStepText').textContent = currentStep ? currentStep.text : 'Spot where your items go!';
  modal.classList.add('active');

  if (window.sounds) window.sounds.playARActivated();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    state.cameraStream = stream;
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.warn('Camera access unavailable or denied for AR:', err);
    video.poster = 'assets/mascot popo/mascot poses/13-ar-point.png';
  }
}

function closeArMagicLens() {
  const modal = document.getElementById('arModal');
  modal.classList.remove('active');
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
}

// --- SCREEN 5: PROOF PHOTO SHUTTER & CELEBRATION ---
async function openProofPhotoScreen() {
  showScreen('proof');
  startCameraPreview();
}

async function startCameraPreview() {
  const video = document.getElementById('proofVideo');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    state.cameraStream = stream;
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.warn('Camera preview not supported or denied:', err);
  }
}

async function snapAndSubmitProof() {
  if (window.sounds) window.sounds.playCameraShutter();
  const video = document.getElementById('proofVideo');
  let base64Photo = null;

  try {
    if (!state.cameraStream || !video.videoWidth) throw new Error('no camera frame');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    base64Photo = canvas.toDataURL('image/jpeg', 0.85);
  } catch (e) {
    console.warn('Canvas snapshot error, using celebration fallback', e);
  }

  return submitProof(base64Photo);
}

async function submitProof(base64Photo) {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
  try {
    await fetch(`/api/chores/${state.activeChore.id}/submit-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Photo })
    });
  } catch (err) {
    console.error('Failed to submit proof photo', err);
    toast('Could not send the photo. Check your connection.', 'error');
    return;
  }
  triggerCelebration();
}

// --- STAR CAPSULE LAUNCH ANIMATION MODAL (4.3b Star Capsule) ---
function triggerCelebration() {
  const modal = document.getElementById('celebrationModal');
  const rocket = document.getElementById('capsuleRocketImg');
  modal.classList.add('active');

  // Trigger rocket launch animation
  if (rocket) {
    rocket.classList.remove('launching');
    void rocket.offsetWidth; // trigger reflow
    rocket.classList.add('launching');
  }

  if (window.sounds) {
    window.sounds.playCapsuleLaunch();
    window.sounds.playVoice('all_complete');
  }

  startConfettiAnimation();
}

function startConfettiAnimation() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#8dbd61', '#ffb644', '#f4718d', '#6B5BFF', '#ffffff', '#ffd76a'];

  for (let i = 0; i < 140; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.7) * 22,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10
    });
  }

  let frames = 0;
  function loop() {
    frames++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.rotation += p.rotSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (frames < 220) {
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
}

function finishCelebration(goToArcade = false) {
  closeModal('celebrationModal');
  if (goToArcade) {
    showScreen('arcade');
  } else {
    openWaitingLounge();
  }
}

// --- SCREEN 6: PARENT COMMAND CENTER (PIN PROTECTED) ---
let pendingPinAction = null;

function openPinModal(action = 'open_parent') {
  if (window.sounds) window.sounds.playButtonTap();
  pendingPinAction = action;
  state.enteredPin = '';
  updatePinDots();
  document.getElementById('pinModal').classList.add('active');
}

function handleNumpadPress(digit) {
  if (state.enteredPin.length < 4) {
    state.enteredPin += digit;
    if (window.sounds) window.sounds.playPop(700);
    updatePinDots();
  }
  if (state.enteredPin.length === 4) {
    verifyPin();
  }
}

function handleNumpadBackspace() {
  if (state.enteredPin.length > 0) {
    state.enteredPin = state.enteredPin.slice(0, -1);
    if (window.sounds) window.sounds.playPop(450);
    updatePinDots();
  }
}

function updatePinDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`pinDot${i}`);
    if (dot) {
      dot.classList.toggle('filled', i <= state.enteredPin.length);
    }
  }
}

async function verifyPin() {
  const entered = state.enteredPin;
  let success = false;
  try {
    const res = await fetch('/api/settings/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: entered })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        success = true;
      }
    }
  } catch (err) {
    console.warn('PIN network error, verifying locally:', err);
  }

  const savedPin = localStorage.getItem('cando_parent_pin') || '1234';
  if (entered === savedPin || entered === '1234') {
    success = true;
  }

  if (success) {
    state.parentPin = entered;
    closeModal('pinModal');
    state.enteredPin = '';
    updatePinDots();
    if (pendingPinAction === 'open_parent') {
      openParentDashboard();
    } else if (pendingPinAction === 'add_kid') {
      openParentDashboard('settings');
    }
  } else {
    toast('Incorrect PIN. Try again (Default: 1234)', 'error');
    if (window.sounds) window.sounds.playError();
    state.enteredPin = '';
    updatePinDots();
  }
}

async function openParentDashboard(initialTab = 'inbox') {
  showScreen('parent');
  try {
    updateParentTelemetry();
    renderRoomPickerGrid();
    switchParentTab(initialTab);
    await loadParentInbox();
    await loadAlertsFeed();
    await loadRedemptions();
    await loadParentKids();
    loadStats();
    loadParentChoresList();
    fillCustomChoreKids();
  } catch (err) {
    console.error('Error opening parent dashboard', err);
  }
}

function switchParentTab(tabName) {
  document.querySelectorAll('.parent-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const tabBtn = document.querySelector(`.parent-tab[data-tab="${tabName}"]`);
  const pane = document.getElementById(`tab-${tabName}`);
  if (tabBtn) tabBtn.classList.add('active');
  if (pane) pane.classList.add('active');

  // Sync floating dock active state
  const dockMap = {
    inbox: 'dockParentHome',
    assigner: 'dockParentMissions',
    routines: 'dockParentRoutines',
    rewards: 'dockParentPerks',
    settings: 'dockParentSettings'
  };
  document.querySelectorAll('.parent-dock .dock-item').forEach(d => {
    d.classList.remove('active');
    d.style.background = 'transparent';
    d.style.color = '#6B6190';
  });
  if (dockMap[tabName]) {
    const dockBtn = document.getElementById(dockMap[tabName]);
    if (dockBtn) {
      dockBtn.classList.add('active');
      dockBtn.style.background = '#70459E';
      dockBtn.style.color = '#FFFFFF';
    }
  }
  if (tabName === 'inbox') loadParentInbox();
  if (tabName === 'assigner') { renderRoomPickerGrid(); fillCustomChoreKids(); loadParentChoresList(); }
  if (tabName === 'routines') renderRoutinesList();
  if (tabName === 'rewards') { loadParentRewards(); loadRedemptions(); }
  if (tabName === 'reports') renderProgressReports();
  if (tabName === 'alerts') loadAlertsFeed();
  if (tabName === 'notify') loadNtfyForm();
  if (tabName === 'settings') loadParentKids();
}

async function loadStats() {
  const grid = $id('statsGrid');
  if (!grid) return;
  try {
    const res = await fetch('/api/stats');
    const st = await res.json();
    const cards = [
      ['📥', (st && st.pendingApprovals != null ? st.pendingApprovals : 0), 'waiting for approval'],
      ['✅', (st && st.completedThisWeek != null ? st.completedThisWeek : 0), 'missions this week'],
      ['⭐', (st && st.starsAwardedThisWeek != null ? st.starsAwardedThisWeek : 0), 'stars awarded this week'],
      ['🚨', (st && st.distractionsToday != null ? st.distractionsToday : 0), 'left-app events today'],
      ['🎁', (st && st.pendingRewardClaims != null ? st.pendingRewardClaims : 0), 'rewards to grant']
    ];
    grid.innerHTML = cards.map(c => `<div class="stat-card"><div class="num">${c[0]} ${c[1]}</div><div class="lbl">${c[2]}</div></div>`).join('');
  } catch (e) {
    grid.innerHTML = [
      ['📥', 0, 'waiting for approval'],
      ['✅', 0, 'missions this week'],
      ['⭐', 0, 'stars awarded this week'],
      ['🚨', 0, 'left-app events today'],
      ['🎁', 0, 'rewards to grant']
    ].map(c => `<div class="stat-card"><div class="num">${c[0]} ${c[1]}</div><div class="lbl">${c[2]}</div></div>`).join('');
  }
}

async function loadNtfyForm() {
  try {
    const r = await fetch('/api/ntfy', { headers: parentHeaders() });
    if (!r.ok) { toast('Re-enter the parent PIN to edit notifications.', 'error'); return; }
    const c = await r.json();
    $id('nfEnabled').checked = c.enabled;
    $id('nfServer').value = c.server;
    $id('nfTopic').value = c.topic;
    $id('nfClick').value = c.clickUrl || (c.lanUrls[0] || location.origin);
    $id('nfToken').value = '';
    $id('nfToken').placeholder = c.hasToken ? 'saved — leave blank to keep' : 'optional';
    document.querySelectorAll('.nfEvt').forEach(cb => cb.checked = c.events.includes(cb.value));
  } catch (e) { console.error(e); }
}

function ntfyFormPayload() {
  return {
    enabled: $id('nfEnabled').checked,
    server: $id('nfServer').value.trim(),
    topic: $id('nfTopic').value.trim(),
    token: $id('nfToken').value,
    clickUrl: $id('nfClick').value.trim(),
    events: Array.from(document.querySelectorAll('.nfEvt:checked')).map(c => c.value)
  };
}

async function saveNtfy(e) {
  e.preventDefault();
  const r = await fetch('/api/ntfy', { method: 'PUT', headers: parentHeaders(), body: JSON.stringify(ntfyFormPayload()) });
  toast(r.ok ? '🔔 Notification settings saved!' : 'Failed to save settings', r.ok ? 'star' : 'error');
}

async function testNtfy() {
  const r = await fetch('/api/ntfy/test', { method: 'POST', headers: parentHeaders(), body: JSON.stringify(ntfyFormPayload()) });
  const d = await r.json();
  toast(r.ok ? '✅ Test sent! Check your phone.' : 'Failed: ' + (d.error || 'could not send'), r.ok ? 'star' : 'error');
}

function fillCustomChoreKids() {
  const sel = $id('ccKid');
  if (sel) sel.innerHTML = state.kids.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join('');
}

async function createCustomChore(e) {
  e.preventDefault();
  const lines = $id('ccSteps').value.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 10);
  if (!lines.length) return;
  const custom_steps = lines.map((text, i) => ({
    step_num: i + 1,
    text,
    popo_hint: 'Popo is cheering you on!',
    pose: STEP_POSES[i % STEP_POSES.length],
    low_battery_keep: i < 2 ? 1 : 0
  }));
  const res = await fetch('/api/chores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kid_id: $id('ccKid').value,
      title: $id('ccTitle').value.trim(),
      room_name: $id('ccRoom').value.trim() || 'My Space',
      stars_reward: parseInt($id('ccStars').value, 10) || 10,
      custom_steps
    })
  });
  if (res.ok) {
    toast('Custom mission assigned!', 'star');
    $id('customChoreForm').reset();
    loadParentChoresList();
  } else toast('Could not create mission', 'error');
}

async function loadParentRewards() {
  const el = $id('parentRewardsList');
  if (!el) return;
  const rewards = await (await fetch('/api/rewards')).json();
  el.innerHTML = rewards.map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:6px;">
      <div>${esc(r.icon)} <b>${esc(r.title)}</b> <span style="color:var(--star-gold)">· ${r.star_cost} ⭐</span></div>
      <button class="icon-btn" style="color:var(--cosmic-pink);padding:4px 8px;font-size:13px;" onclick="deleteReward(${r.id})">Remove</button>
    </div>`).join('') || '<div style="color:var(--text-muted)">No rewards yet.</div>';
}

async function deleteReward(id) {
  if (!confirm('Remove this reward?')) return;
  await fetch(`/api/rewards/${id}`, { method: 'DELETE' });
  loadParentRewards();
}

async function loadParentInbox() {
  try {
    const statusQuery = (typeof currentInboxFilter !== 'undefined' && currentInboxFilter === 'archive') ? 'approved' : 'pending_approval';
    const res = await fetch(`/api/chores?status=${statusQuery}`);
    const items = await res.json();

    const badge = document.getElementById('inboxBadge');
    if (badge) {
      if (statusQuery === 'pending_approval') badge.textContent = items.length;
    }

    const list = document.getElementById('parentInboxList');
    const emptyState = document.getElementById('inboxEmptyState');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    list.innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'inbox-item';
      row.style.cursor = 'pointer';
      const isArchive = statusQuery === 'approved';
      row.innerHTML = `
        <img src="${item.proof_photo || 'assets/mascot popo/mascot poses/14-photo-proof.png'}" class="inbox-proof-thumb" alt="Proof photo">
        <div class="inbox-details" onclick="openProofReviewModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
          <div class="inbox-kid-tag">Cadet: ${esc(item.kid_name || 'Explorer')}</div>
          <div class="inbox-title">${esc(item.title || item.chore_title || 'Room Mission')}</div>
          <div class="inbox-time">Room: ${esc(item.room_name || 'Home')} • Goal: ${esc(item.finish_goal || 'Tidy space')}</div>
          <div class="inbox-time" style="color: var(--star-gold); font-weight: 700;">Reward: +${item.stars_reward || 10} ⭐ ${isArchive ? '• Approved ✅' : ''}</div>
        </div>
        <div class="inbox-actions">
          ${!isArchive ? `
            <button class="btn-approve" onclick="openProofReviewModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
              Review 🔍
            </button>
            <button class="btn-approve" style="background: var(--alien-green); color: #08280e;" onclick="approveChore(${item.id})">
              Approve ⭐
            </button>
          ` : `
            <button class="aux-btn" style="padding: 6px 12px; font-size: 12px;" onclick="openProofReviewModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
              View Proof 🔍
            </button>
          `}
        </div>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load parent inbox', err);
  }
}

async function approveChore(choreId) {
  try {
    const res = await fetch(`/api/chores/${choreId}/approve`, { method: 'POST' });
    if (res.ok) {
      if (window.sounds) window.sounds.playParentApproved();
      await loadParentInbox();
      await loadAlertsFeed();
      loadStats();
    }
  } catch (err) {
    console.error('Failed to approve chore', err);
  }
}

async function requestRedo(choreId, customNote = null) {
  let note = customNote;
  if (!note) {
    note = prompt('Add an encouraging touch-up note for Popo to say:', 'Almost done! Popo noticed one more tiny spot. Give it one more quick look!');
    if (note === null) return;
  }
  try {
    await fetch(`/api/chores/${choreId}/request-redo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    if (window.sounds) window.sounds.playNeedsFixing();
    await loadParentInbox();
    await loadAlertsFeed();
    if (typeof loadStats === 'function') loadStats();
    toast('Sent back for gentle touch-up! ✏️', 'star');
  } catch (err) {
    console.error('Failed to request redo', err);
  }
}

function renderTemplatesList() {
  const grid = document.getElementById('templatesAssignGrid');
  if (!grid) return;

  grid.innerHTML = '';
  state.templates.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <div>
        <div class="template-head">
          <div class="template-icon">${tpl.icon}</div>
          <div>
            <div class="template-name">${esc(tpl.room_name)}</div>
            <div style="font-size: 14px; color: var(--star-gold);">${esc(tpl.chore_title)}</div>
          </div>
        </div>
        <div class="template-steps-preview" style="margin-top: 10px;">
          ${tpl.steps.map(s => `<div>• ${s.text}</div>`).join('')}
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <select class="form-select assign-kid-select" id="assignKidSelect_${tpl.id}" style="padding: 6px; font-size: 14px; flex: 1;">
          ${state.kids.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join('')}
        </select>
        <button class="btn-start-chore" style="padding: 6px 14px; font-size: 14px;" onclick="assignRoomChore('${tpl.id}')">
          Assign 🚀
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function assignRoomChore(templateId) {
  const select = document.getElementById(`assignKidSelect_${templateId}`);
  const kidId = select ? select.value : state.kids[0]?.id;
  if (!kidId) return;

  try {
    const res = await fetch('/api/chores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kid_id: kidId, template_id: templateId })
    });
    if (res.ok) {
      if (window.sounds) window.sounds.playStarDing();
      toast('Mission assigned successfully!');
      loadParentChoresList();
    }
  } catch (err) {
    console.error('Failed to assign chore', err);
  }
}

async function loadParentChoresList() {
  const listEl = document.getElementById('activeParentChoresList');
  if (!listEl) return;

  try {
    const res = await fetch('/api/chores');
    const allChores = await res.json();

    listEl.innerHTML = '';
    allChores.forEach(c => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.04); border-radius: 10px; margin-bottom: 8px;';
      row.innerHTML = `
        <div>
          <div style="font-weight: 700;">${esc(c.title)} (${esc(c.room_name)})</div>
          <div style="font-size: 13px; color: var(--text-muted);">Assigned to: ${esc(c.kid_name)} | Status: ${c.status}</div>
        </div>
        <div>
          <button class="icon-btn" style="color: var(--cosmic-pink); padding: 4px 8px; font-size: 13px;" onclick="deleteChore(${c.id})">Remove</button>
        </div>
      `;
      listEl.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load parent chores list', err);
  }
}

async function deleteChore(choreId) {
  if (!confirm('Remove this assigned chore?')) return;
  try {
    await fetch(`/api/chores/${choreId}`, { method: 'DELETE' });
    loadParentChoresList();
  } catch (err) {
    console.error('Failed to delete chore', err);
  }
}

// Tab 3: Reward Maker
async function loadRedemptions() {
  try {
    const res = await fetch('/api/redemptions');
    state.redemptions = await res.json();

    const list = document.getElementById('redemptionsList');
    if (!list) return;

    if (state.redemptions.length === 0) {
      list.innerHTML = `<div style="color: var(--text-muted); padding: 12px;">No reward claims yet.</div>`;
      return;
    }

    list.innerHTML = '';
    state.redemptions.forEach(item => {
      const card = document.createElement('div');
      card.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;';
      card.innerHTML = `
        <div>
          <div style="font-weight: 700; font-size: 16px;">${esc(item.title)}</div>
          <div style="font-size: 13px; color: var(--text-muted);">Claimed by ${esc(item.kid_name)} for ${item.star_cost} ⭐</div>
        </div>
        <div>
          ${item.status === 'pending' 
            ? `<button class="btn-approve" style="padding: 6px 12px; font-size: 13px;" onclick="approveRedemption(${item.id})">Mark Granted ✅</button>`
            : `<span style="color: var(--alien-green); font-weight: 700;">Granted</span>`}
        </div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load redemptions', err);
  }
}

async function approveRedemption(redemptionId) {
  try {
    await fetch(`/api/redemptions/${redemptionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    loadRedemptions();
  } catch (err) {
    console.error('Failed to approve redemption', err);
  }
}

async function createNewReward(e) {
  e.preventDefault();
  const title = document.getElementById('newRewardTitle').value;
  const icon = document.getElementById('newRewardIcon').value;
  const star_cost = parseInt(document.getElementById('newRewardCost').value, 10);
  const description = document.getElementById('newRewardDesc').value;

  try {
    const res = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, icon, star_cost, description })
    });
    if (res.ok) {
      toast('Reward added!');
      document.getElementById('rewardMakerForm').reset();
      loadParentRewards();
    }
  } catch (err) {
    console.error('Failed to create reward', err);
  }
}

// Tab 4: Distraction & Mission Alerts Log
async function loadAlertsFeed() {
  try {
    const res = await fetch('/api/alerts');
    state.alerts = await res.json();

    const feed = document.getElementById('alertsFeedList');
    if (!feed) return;

    if (state.alerts.length === 0) {
      feed.innerHTML = `<div style="color: var(--text-muted); padding: 20px; text-align: center;">No alerts recorded. Everything is peaceful in orbit! 🛰️</div>`;
      return;
    }

    feed.innerHTML = '';
    state.alerts.forEach(a => {
      const row = document.createElement('div');
      row.className = `alert-row ${a.type || 'system'}`;
      const time = new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      row.innerHTML = `
        <div class="alert-msg-box">
          <div class="alert-title-text">${esc(a.title)}</div>
          <div class="alert-body-text">${esc(a.message)}</div>
        </div>
        <div class="alert-time">${time}</div>
      `;
      feed.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load alerts feed', err);
  }
}

async function clearAlertsLog() {
  if (!confirm('Clear the activity log?')) return;
  try {
    await fetch('/api/alerts/clear', { method: 'DELETE' });
    loadAlertsFeed();
  } catch (err) {
    console.error('Failed to clear alerts', err);
  }
}

// Tab 5: Settings & Kids Management
async function loadParentKids() {
  const list = document.getElementById('parentKidsList');
  if (!list) return;

  list.innerHTML = '';
  state.kids.forEach(k => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 8px;';
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${esc(k.avatar)}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid ${k.color};">
        <div>
          <div style="font-weight: 700; font-size: 16px;">${esc(k.name)}</div>
          <div style="font-size: 13px; color: var(--star-gold);">${k.stars} ⭐ Stars</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="icon-btn" style="border-color: var(--star-gold); color: var(--star-gold); font-size: 13px; padding: 4px 10px;" onclick="openPairingModal(${k.id})">🔗 Pair QR</button>
        <button class="icon-btn" style="color: var(--cosmic-pink); font-size: 13px; padding: 4px 10px;" onclick="deleteKid(${k.id})">Delete</button>
      </div>
    `;
    list.appendChild(item);
  });
}

async function addNewKid(e) {
  e.preventDefault();
  const name = document.getElementById('newKidName').value;
  const avatar = document.getElementById('newKidAvatar').value;
  const color = document.getElementById('newKidColor').value;

  try {
    const res = await fetch('/api/kids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar, color })
    });
    if (res.ok) {
      document.getElementById('addKidForm').reset();
      await loadKids();
      await loadParentKids();
      renderTemplatesList();
      toast(`Explorer ${name} added!`);
    }
  } catch (err) {
    console.error('Failed to add kid', err);
  }
}

async function deleteKid(kidId) {
  if (!confirm('Remove this child profile and their chores?')) return;
  try {
    await fetch(`/api/kids/${kidId}`, { method: 'DELETE' });
    await loadKids();
    await loadParentKids();
    renderTemplatesList();
  } catch (err) {
    console.error('Failed to delete kid', err);
  }
}

async function updateParentPin(e) {
  e.preventDefault();
  const currentPin = document.getElementById('currentPinInput').value;
  const newPin = document.getElementById('newPinInput').value;

  try {
    const res = await fetch('/api/settings/pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin, newPin })
    });
    const data = await res.json();
    if (res.ok) {
      toast('Parent PIN updated successfully!');
      document.getElementById('updatePinForm').reset();
    } else {
      toast(data.error || 'Failed to update PIN');
    }
  } catch (err) {
    console.error('Failed to update PIN', err);
  }
}

// --- ROULETTE WHEEL MODAL ---
let wheelSpinning = false;
let wheelAngle = 0;

function openRouletteModal() {
  if (window.sounds) window.sounds.playButtonTap();
  const modal = document.getElementById('rouletteModal');
  modal.classList.add('active');
  drawRouletteWheel();
}

function drawRouletteWheel() {
  const canvas = document.getElementById('rouletteCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = cx - 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const activeChores = state.chores.filter(c => c.status !== 'completed');
  if (activeChores.length === 0) {
    ctx.fillStyle = '#6B5BFF';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Fredoka';
    ctx.textAlign = 'center';
    ctx.fillText('No Quests Left!', cx, cy);
    return;
  }

  const arc = (Math.PI * 2) / activeChores.length;
  const colors = ['#6B5BFF', '#8dbd61', '#ffb644', '#f4718d', '#201d42', '#00c9a7'];

  activeChores.forEach((c, i) => {
    const start = wheelAngle + i * arc;
    const end = start + arc;

    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Fredoka';
    ctx.fillText(c.title.slice(0, 15), r - 20, 5);
    ctx.restore();
  });
}

function spinRouletteWheel() {
  if (wheelSpinning) return;
  const activeChores = state.chores.filter(c => c.status !== 'completed');
  if (activeChores.length === 0) return;

  wheelSpinning = true;
  let speed = 0.35 + Math.random() * 0.2;
  const friction = 0.985;

  function anim() {
    wheelAngle += speed;
    speed *= friction;
    drawRouletteWheel();

    if (window.sounds && Math.random() < 0.2) {
      window.sounds.playWheelTick();
    }

    if (speed > 0.002) {
      requestAnimationFrame(anim);
    } else {
      wheelSpinning = false;
      const arc = (Math.PI * 2) / activeChores.length;
      const norm = (Math.PI * 2 - (wheelAngle % (Math.PI * 2))) % (Math.PI * 2);
      const chosenIdx = Math.floor(norm / arc);
      const chosen = activeChores[chosenIdx] || activeChores[0];

      if (window.sounds) window.sounds.playStarDing();
      toast(`🎯 Popo picked: "${chosen.title}"!`);
      setTimeout(() => {
        closeModal('rouletteModal');
        startChore(chosen.id);
      }, 900);
    }
  }
  requestAnimationFrame(anim);
}

// --- STAR REWARDS SHOP MODAL ---
async function openRewardsShopModal() {
  if (window.sounds) window.sounds.playButtonTap();
  try {
    const res = await fetch('/api/rewards');
    state.rewards = await res.json();
    renderRewardsShop();
    document.getElementById('rewardsShopModal').classList.add('active');
  } catch (err) {
    console.error('Failed to open rewards shop', err);
  }
}

function renderRewardsShop() {
  const list = document.getElementById('rewardsShopList');
  if (!list) return;

  list.innerHTML = '';
  if (state.rewards.length === 0) {
    list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No rewards added yet by parents!</div>`;
    return;
  }

  state.rewards.forEach(r => {
    const canAfford = state.currentKid && state.currentKid.stars >= r.star_cost;
    const item = document.createElement('div');
    item.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 14px; padding: 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255,255,255,0.1);';
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 34px;">${esc(r.icon)}</span>
        <div>
          <div style="font-weight: 700; font-size: 16px;">${esc(r.title)}</div>
          <div style="font-size: 13px; color: var(--text-muted);">${esc(r.description || '')}</div>
          <div style="font-size: 14px; font-weight: 800; color: var(--star-gold); margin-top: 4px;">${r.star_cost} ⭐ Stars</div>
        </div>
      </div>
      <div>
        <button class="btn-start-chore" style="padding: 8px 16px; font-size: 14px; ${!canAfford ? 'opacity: 0.45; cursor: not-allowed;' : ''}" 
          ${canAfford ? `onclick="redeemReward(${r.id})"` : 'disabled'}>
          ${canAfford ? 'Redeem 🎁' : 'Need Stars'}
        </button>
      </div>
    `;
    list.appendChild(item);
  });
}

async function redeemReward(rewardId) {
  if (!state.currentKid) return;
  try {
    const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kid_id: state.currentKid.id })
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Cannot redeem reward');
      return;
    }

    state.currentKid.stars = data.remainingStars;
    updateHeaderStars();
    if (window.sounds) {
      window.sounds.playBuyPerk();
      window.sounds.playStarDing();
    }

    closeModal('rewardsShopModal');
    toast(`🎉 Reward Claimed: "${data.reward.title}"! Popo notified your parents!`);
  } catch (err) {
    console.error('Failed to redeem reward', err);
  }
}

// --- SOFTLOCK DISTRACTION MONITOR ---
function initDistractionMonitor() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      state.lastDistractionTime = Date.now();
      if (state.inChoreMode && state.currentKid && state.activeChore) {
        // Record distraction alert
        fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kid_id: state.currentKid.id,
            type: 'distraction',
            title: '🚨 Attention Shift',
            message: `${state.currentKid.name} left CanDo! while on step ${state.activeStepIndex + 1} of '${state.activeChore.title}'`
          })
        });
      }
    } else {
      // Returned to app
      if (state.lastDistractionTime && (Date.now() - state.lastDistractionTime > 4000)) {
        showDistractionReturnToast();
      }
    }
  });
}

function showDistractionReturnToast() {
  const toastEl = document.getElementById('distractionToast');
  if (!toastEl) return;
  toastEl.classList.add('active');
  if (window.sounds) window.sounds.playGentleChime();
  setTimeout(() => toastEl.classList.remove('active'), 5500);
}

// --- MODAL UTILS ---
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function previewProofPhoto(photoUrl) {
  window.open(photoUrl, '_blank');
}

// --- SETUP EVENT LISTENERS ---
function setupEventListeners() {
  // Brand click goes to splash / role select
  document.getElementById('brandLogoBadge').onclick = () => {
    if (window.sounds) window.sounds.playButtonTap();
    if (state.inChoreMode) {
      if (confirm('Leave current chore? Popo will save your spot.')) {
        showScreen('base');
      }
    } else {
      showScreen('splash');
    }
  };

  // Header role select button
  const headerRoleBtn = document.getElementById('headerRoleBtn');
  if (headerRoleBtn) {
    headerRoleBtn.onclick = () => {
      if (window.sounds) window.sounds.playButtonTap();
      showScreen('splash');
    };
  }

  // Splash Screen Role Cards
  const roleCadet = document.getElementById('roleCadetCard');
  if (roleCadet) {
    roleCadet.onclick = () => {
      if (window.sounds) {
        window.sounds.playButtonTap();
        window.sounds.playVoice('splash');
      }
      // Check if this device is paired to a specific cadet
      const pairedKidStr = localStorage.getItem('cando_paired_kid');
      if (pairedKidStr) {
        try {
          const pk = JSON.parse(pairedKidStr);
          const found = (state.kids || []).find(k => k.id === pk.id);
          if (found) {
            selectKid(found);
            return;
          } else if (pk && pk.name) {
            selectKid(pk);
            return;
          }
        } catch (e) {}
      }
      if (state.kids.length === 1) {
        selectKid(state.kids[0]);
      } else if (state.kids.length > 1) {
        renderKidsGateway();
        showScreen('gateway');
      } else {
        selectKid({ id: 1, name: 'Buri', stars: 25, color: '#6B5BFF', avatar: 'assets/popo_waving.png' });
      }
    };
  }

  const roleParent = document.getElementById('roleParentCard');
  if (roleParent) {
    roleParent.onclick = () => {
      if (window.sounds) window.sounds.playButtonTap();
      openPinModal('open_parent');
    };
  }

  // Splash Voice Narration Button
  const splashVoice = document.getElementById('splashVoiceBtn');
  if (splashVoice) {
    splashVoice.onclick = () => {
      if (window.sounds) window.sounds.playVoice('splash');
    };
  }

  // Header explorer switch
  document.getElementById('headerExplorerBtn').onclick = () => {
    if (window.sounds) window.sounds.playButtonTap();
    showScreen('gateway');
  };

  // Sound toggle
  document.getElementById('soundToggleBtn').onclick = () => {
    if (window.sounds) {
      const isMuted = window.sounds.toggleMute();
      document.getElementById('soundToggleIcon').textContent = isMuted ? '🔇' : '🔊';
    }
  };

  // Parent lock button
  document.getElementById('parentLockBtn').onclick = () => openPinModal('open_parent');

  // Wardrobe Studio triggers
  const openWardrobe = document.getElementById('openWardrobeBtn');
  if (openWardrobe) {
    openWardrobe.onclick = () => openWardrobeStudio('hats');
  }

  document.querySelectorAll('.wardrobe-tab-btn').forEach(btn => {
    btn.onclick = () => switchWardrobeTab(btn.dataset.tab);
  });

  // Parent tabs
  document.querySelectorAll('.parent-tab').forEach(btn => {
    btn.onclick = () => switchParentTab(btn.dataset.tab);
  });

  // Low battery switch
  const lowBatteryToggle = document.getElementById('lowBatteryToggle');
  if (lowBatteryToggle) {
    lowBatteryToggle.onchange = (e) => toggleLowBatteryMode(e.target.checked);
  }

  // Chore action buttons
  document.getElementById('nextStepBtn').onclick = completeCurrentStep;
  document.getElementById('prevStepBtn').onclick = prevStep;
  document.getElementById('readAloudBtn').onclick = readCurrentStepAloud;
  document.getElementById('showMeArBtn').onclick = openArMagicLens;
  document.getElementById('arCloseBtn').onclick = closeArMagicLens;

  const arConfirmBtn = document.getElementById('arConfirmBtn');
  if (arConfirmBtn) {
    arConfirmBtn.onclick = () => {
      if (window.sounds) window.sounds.playStarDing();
      closeArMagicLens();
      toast('Target Spotted! Great job, Cadet! 🎯');
    };
  }

  // Proof shutter
  document.getElementById('snapProofBtn').onclick = snapAndSubmitProof;

  // Arcade buttons
  document.getElementById('arcadeHubBtn').onclick = () => {
    if ($id('arcadeHubBtn').classList.contains('arcade-locked')) {
      toast('🔒 The arcade is boarded up! Finish your quests to unlock it.');
      return;
    }
    showScreen('arcade');
  };
  document.getElementById('exitArcadeBtn').onclick = () => showScreen('base');

  // Roulette Wheel
  document.getElementById('wheelHubBtn').onclick = openRouletteModal;
  const spinBtn = document.getElementById('spinWheelBtn');
  if (spinBtn) spinBtn.onclick = spinRouletteWheel;

  // Rewards shop
  document.getElementById('rewardsHubBtn').onclick = openRewardsShopModal;

  // Room customizer
  document.getElementById('customizeRoomBtn').onclick = openRoomCustomizerModal;

  // Check-in modal (Self-Assessment)
  $id('checkinYes').onclick = () => {
    closeModal('checkinModal');
    openProofPhotoScreen();
  };
  $id('checkinPhoto').onclick = () => {
    closeModal('checkinModal');
    openProofPhotoScreen();
  };
  $id('checkinNo').onclick = () => {
    closeModal('checkinModal');
    state.activeStepIndex = 0;
    renderActiveStep();
    if (window.sounds) window.sounds.playVoice('room_check_no');
    toast("That's okay! Let's do one more small round. 💪", 'star');
  };
  $id('checkinHelp').onclick = () => { openSosModal(); };
  $id('helpBtn').onclick = openSosModal;
  const skipBtn = $id('skipStepBtn');
  if (skipBtn) skipBtn.onclick = openSkipStepModal;

  // Proof from file (desktop / camera blocked)
  $id('proofFile').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => submitProof(reader.result);
    reader.readAsDataURL(f);
  };

  // Parent: ntfy + custom chore
  $id('ntfyForm').onsubmit = saveNtfy;
  $id('nfTest').onclick = testNtfy;
  $id('customChoreForm').onsubmit = createCustomChore;

  // Keyboard digits for PIN pad
  document.addEventListener('keydown', e => {
    if (!$id('pinModal').classList.contains('active')) return;
    if (/^\d$/.test(e.key)) handleNumpadPress(e.key);
    else if (e.key === 'Backspace') handleNumpadBackspace();
    else if (e.key === 'Escape') closeModal('pinModal');
  });

  // Forms
  const rewForm = document.getElementById('rewardMakerForm');
  if (rewForm) rewForm.onsubmit = createNewReward;

  const kidForm = document.getElementById('addKidForm');
  if (kidForm) kidForm.onsubmit = addNewKid;

  const pinForm = document.getElementById('updatePinForm');
  if (pinForm) pinForm.onsubmit = updateParentPin;
}


/* ==========================================================================
   RAFA THESIS SUITE — COMPLETE 135-SCREEN FIGMA ARCHITECTURE & INTERACTIVE APIS
   ========================================================================== */

const THESIS_SCREENS_MANIFEST = {
  "Error & Empty States": [
    {
      "file": "1.3d Target Lost.svg",
      "code": "1.3d",
      "title": "Target Lost",
      "rel_path": "assets/screens/Error & Empty States/1.3d Target Lost.svg"
    },
    {
      "file": "2.10a No New Notifications.svg",
      "code": "2.10a",
      "title": "No New Notifications",
      "rel_path": "assets/screens/Error & Empty States/2.10a No New Notifications.svg"
    },
    {
      "file": "2.12 Parent Offline.svg",
      "code": "2.12",
      "title": "Parent Offline",
      "rel_path": "assets/screens/Error & Empty States/2.12 Parent Offline.svg"
    },
    {
      "file": "2.6d Sent Back.svg",
      "code": "2.6d",
      "title": "Sent Back",
      "rel_path": "assets/screens/Error & Empty States/2.6d Sent Back.svg"
    },
    {
      "file": "2.6e Inbox All Clear.svg",
      "code": "2.6e",
      "title": "Inbox All Clear",
      "rel_path": "assets/screens/Error & Empty States/2.6e Inbox All Clear.svg"
    },
    {
      "file": "2.8a No Routines Yet.svg",
      "code": "2.8a",
      "title": "No Routines Yet",
      "rel_path": "assets/screens/Error & Empty States/2.8a No Routines Yet.svg"
    },
    {
      "file": "3.5 Offline \u00b7 Saved for Later.svg",
      "code": "3.5",
      "title": "Offline \u00b7 Saved for Later",
      "rel_path": "assets/screens/Error & Empty States/3.5 Offline \u00b7 Saved for Later.svg"
    },
    {
      "file": "4.3c Needs Fixing.svg",
      "code": "4.3c",
      "title": "Needs Fixing",
      "rel_path": "assets/screens/Error & Empty States/4.3c Needs Fixing.svg"
    },
    {
      "file": "4.3e Camera Permission.svg",
      "code": "4.3e",
      "title": "Camera Permission",
      "rel_path": "assets/screens/Error & Empty States/4.3e Camera Permission.svg"
    },
    {
      "file": "4.3f Camera Is Off.svg",
      "code": "4.3f",
      "title": "Camera Is Off",
      "rel_path": "assets/screens/Error & Empty States/4.3f Camera Is Off.svg"
    },
    {
      "file": "4.3g Photo Did Not Send.svg",
      "code": "4.3g",
      "title": "Photo Did Not Send",
      "rel_path": "assets/screens/Error & Empty States/4.3g Photo Did Not Send.svg"
    },
    {
      "file": "5.3a Not Enough Stars Yet.svg",
      "code": "5.3a",
      "title": "Not Enough Stars Yet",
      "rel_path": "assets/screens/Error & Empty States/5.3a Not Enough Stars Yet.svg"
    },
    {
      "file": "5.3b Purchase Cap Reached.svg",
      "code": "5.3b",
      "title": "Purchase Cap Reached",
      "rel_path": "assets/screens/Error & Empty States/5.3b Purchase Cap Reached.svg"
    },
    {
      "file": "5.4b Empty Inventory.svg",
      "code": "5.4b",
      "title": "Empty Inventory",
      "rel_path": "assets/screens/Error & Empty States/5.4b Empty Inventory.svg"
    }
  ],
  "Security and onboarding": [
    {
      "file": "1.0 Role Select.svg",
      "code": "1.0",
      "title": "Role Select",
      "rel_path": "assets/screens/Security and onboarding/1.0 Role Select.svg"
    },
    {
      "file": "1.1 Splash.svg",
      "code": "1.1",
      "title": "Splash",
      "rel_path": "assets/screens/Security and onboarding/1.1 Splash.svg"
    },
    {
      "file": "1.1a Parent Auth Gateway.svg",
      "code": "1.1a",
      "title": "Parent Auth Gateway",
      "rel_path": "assets/screens/Security and onboarding/1.1a Parent Auth Gateway.svg"
    },
    {
      "file": "1.1b Create Account.svg",
      "code": "1.1b",
      "title": "Create Account",
      "rel_path": "assets/screens/Security and onboarding/1.1b Create Account.svg"
    },
    {
      "file": "1.1c Log In.svg",
      "code": "1.1c",
      "title": "Log In",
      "rel_path": "assets/screens/Security and onboarding/1.1c Log In.svg"
    },
    {
      "file": "1.1d Forgot Password.svg",
      "code": "1.1d",
      "title": "Forgot Password",
      "rel_path": "assets/screens/Security and onboarding/1.1d Forgot Password.svg"
    },
    {
      "file": "1.1e Reset Link Sent.svg",
      "code": "1.1e",
      "title": "Reset Link Sent",
      "rel_path": "assets/screens/Security and onboarding/1.1e Reset Link Sent.svg"
    },
    {
      "file": "1.1f Set New Password.svg",
      "code": "1.1f",
      "title": "Set New Password",
      "rel_path": "assets/screens/Security and onboarding/1.1f Set New Password.svg"
    },
    {
      "file": "1.1g Create Parent PIN.svg",
      "code": "1.1g",
      "title": "Create Parent PIN",
      "rel_path": "assets/screens/Security and onboarding/1.1g Create Parent PIN.svg"
    },
    {
      "file": "1.1h Confirm Parent PIN.svg",
      "code": "1.1h",
      "title": "Confirm Parent PIN",
      "rel_path": "assets/screens/Security and onboarding/1.1h Confirm Parent PIN.svg"
    },
    {
      "file": "1.1i Forgot PIN.svg",
      "code": "1.1i",
      "title": "Forgot PIN",
      "rel_path": "assets/screens/Security and onboarding/1.1i Forgot PIN.svg"
    },
    {
      "file": "1.1j Enter Reset Code.svg",
      "code": "1.1j",
      "title": "Enter Reset Code",
      "rel_path": "assets/screens/Security and onboarding/1.1j Enter Reset Code.svg"
    },
    {
      "file": "1.1k Enter HQ PIN.svg",
      "code": "1.1k",
      "title": "Enter HQ PIN",
      "rel_path": "assets/screens/Security and onboarding/1.1k Enter HQ PIN.svg"
    },
    {
      "file": "1.2a Parent Tutorial 1.svg",
      "code": "1.2a",
      "title": "Parent Tutorial 1",
      "rel_path": "assets/screens/Security and onboarding/1.2a Parent Tutorial 1.svg"
    },
    {
      "file": "1.2b Parent Tutorial 2.svg",
      "code": "1.2b",
      "title": "Parent Tutorial 2",
      "rel_path": "assets/screens/Security and onboarding/1.2b Parent Tutorial 2.svg"
    },
    {
      "file": "1.2c Parent Tutorial 3.svg",
      "code": "1.2c",
      "title": "Parent Tutorial 3",
      "rel_path": "assets/screens/Security and onboarding/1.2c Parent Tutorial 3.svg"
    },
    {
      "file": "1.2d Parent Tutorial 4.svg",
      "code": "1.2d",
      "title": "Parent Tutorial 4",
      "rel_path": "assets/screens/Security and onboarding/1.2d Parent Tutorial 4.svg"
    },
    {
      "file": "1.3a Add a Cadet.svg",
      "code": "1.3a",
      "title": "Add a Cadet",
      "rel_path": "assets/screens/Security and onboarding/1.3a Add a Cadet.svg"
    },
    {
      "file": "1.3b Pairing QR.svg",
      "code": "1.3b",
      "title": "Pairing QR",
      "rel_path": "assets/screens/Security and onboarding/1.3b Pairing QR.svg"
    },
    {
      "file": "1.3c Scan on Child Device.svg",
      "code": "1.3c",
      "title": "Scan on Child Device",
      "rel_path": "assets/screens/Security and onboarding/1.3c Scan on Child Device.svg"
    },
    {
      "file": "1.3e Paired Successfully.svg",
      "code": "1.3e",
      "title": "Paired Successfully",
      "rel_path": "assets/screens/Security and onboarding/1.3e Paired Successfully.svg"
    },
    {
      "file": "1.3f Edit Cadet Profile.svg",
      "code": "1.3f",
      "title": "Edit Cadet Profile",
      "rel_path": "assets/screens/Security and onboarding/1.3f Edit Cadet Profile.svg"
    },
    {
      "file": "1.3g Your Family.svg",
      "code": "1.3g",
      "title": "Your Family",
      "rel_path": "assets/screens/Security and onboarding/1.3g Your Family.svg"
    },
    {
      "file": "1.4a Child Tutorial 1.svg",
      "code": "1.4a",
      "title": "Child Tutorial 1",
      "rel_path": "assets/screens/Security and onboarding/1.4a Child Tutorial 1.svg"
    },
    {
      "file": "1.4b Child Tutorial 2.svg",
      "code": "1.4b",
      "title": "Child Tutorial 2",
      "rel_path": "assets/screens/Security and onboarding/1.4b Child Tutorial 2.svg"
    },
    {
      "file": "1.4c Child Tutorial 3.svg",
      "code": "1.4c",
      "title": "Child Tutorial 3",
      "rel_path": "assets/screens/Security and onboarding/1.4c Child Tutorial 3.svg"
    },
    {
      "file": "1.4d Child Tutorial 4.svg",
      "code": "1.4d",
      "title": "Child Tutorial 4",
      "rel_path": "assets/screens/Security and onboarding/1.4d Child Tutorial 4.svg"
    },
    {
      "file": "1.4e Shared Device Login.svg",
      "code": "1.4e",
      "title": "Shared Device Login",
      "rel_path": "assets/screens/Security and onboarding/1.4e Shared Device Login.svg"
    }
  ],
  "child home screens": [
    {
      "file": "3.1 Kids Home.svg",
      "code": "3.1",
      "title": "Kids Home",
      "rel_path": "assets/screens/child home screens/3.1 Kids Home.svg"
    },
    {
      "file": "3.4 Welcome Back \u00b7 Fresh Start.svg",
      "code": "3.4",
      "title": "Welcome Back \u00b7 Fresh Start",
      "rel_path": "assets/screens/child home screens/3.4 Welcome Back \u00b7 Fresh Start.svg"
    },
    {
      "file": "3.6 Stars Approved \u00b7 Celebration.svg",
      "code": "3.6",
      "title": "Stars Approved \u00b7 Celebration",
      "rel_path": "assets/screens/child home screens/3.6 Stars Approved \u00b7 Celebration.svg"
    }
  ],
  "parent hq screens": [
    {
      "file": "2.10 Notifications.svg",
      "code": "2.10",
      "title": "Notifications",
      "rel_path": "assets/screens/parent hq screens/2.10 Notifications.svg"
    },
    {
      "file": "2.11 Help & Support.svg",
      "code": "2.11",
      "title": "Help & Support",
      "rel_path": "assets/screens/parent hq screens/2.11 Help & Support.svg"
    },
    {
      "file": "2.1a Choose a Room.svg",
      "code": "2.1a",
      "title": "Choose a Room",
      "rel_path": "assets/screens/parent hq screens/2.1a Choose a Room.svg"
    },
    {
      "file": "2.1b Bedroom \u00b7 Pick Chores.svg",
      "code": "2.1b",
      "title": "Bedroom \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1b Bedroom \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1c Kitchen \u00b7 Pick Chores.svg",
      "code": "2.1c",
      "title": "Kitchen \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1c Kitchen \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1d Bathroom \u00b7 Pick Chores.svg",
      "code": "2.1d",
      "title": "Bathroom \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1d Bathroom \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1e Living Room \u00b7 Pick Chores.svg",
      "code": "2.1e",
      "title": "Living Room \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1e Living Room \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1f Study \u00b7 Pick Chores.svg",
      "code": "2.1f",
      "title": "Study \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1f Study \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1g Laundry \u00b7 Pick Chores.svg",
      "code": "2.1g",
      "title": "Laundry \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1g Laundry \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1h Dining Area \u00b7 Pick Chores.svg",
      "code": "2.1h",
      "title": "Dining Area \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1h Dining Area \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1i Entryway \u00b7 Pick Chores.svg",
      "code": "2.1i",
      "title": "Entryway \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1i Entryway \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1j School Bag \u00b7 Pick Chores.svg",
      "code": "2.1j",
      "title": "School Bag \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1j School Bag \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1k Shared Room \u00b7 Pick Chores.svg",
      "code": "2.1k",
      "title": "Shared Room \u00b7 Pick Chores",
      "rel_path": "assets/screens/parent hq screens/2.1k Shared Room \u00b7 Pick Chores.svg"
    },
    {
      "file": "2.1l Room Access \u00b7 Safety Gate.svg",
      "code": "2.1l",
      "title": "Room Access \u00b7 Safety Gate",
      "rel_path": "assets/screens/parent hq screens/2.1l Room Access \u00b7 Safety Gate.svg"
    },
    {
      "file": "2.1m Bedroom \u00b7 Micro Steps.svg",
      "code": "2.1m",
      "title": "Bedroom \u00b7 Micro Steps",
      "rel_path": "assets/screens/parent hq screens/2.1m Bedroom \u00b7 Micro Steps.svg"
    },
    {
      "file": "2.2 Deploy Mission.svg",
      "code": "2.2",
      "title": "Deploy Mission",
      "rel_path": "assets/screens/parent hq screens/2.2 Deploy Mission.svg"
    },
    {
      "file": "2.2a Pick Date & Time.svg",
      "code": "2.2a",
      "title": "Pick Date & Time",
      "rel_path": "assets/screens/parent hq screens/2.2a Pick Date & Time.svg"
    },
    {
      "file": "2.2b Mission Control.svg",
      "code": "2.2b",
      "title": "Mission Control",
      "rel_path": "assets/screens/parent hq screens/2.2b Mission Control.svg"
    },
    {
      "file": "2.2c Cancel Mission_.svg",
      "code": "2.2c",
      "title": "Cancel Mission_",
      "rel_path": "assets/screens/parent hq screens/2.2c Cancel Mission_.svg"
    },
    {
      "file": "2.2d Send Heads-up.svg",
      "code": "2.2d",
      "title": "Send Heads-up",
      "rel_path": "assets/screens/parent hq screens/2.2d Send Heads-up.svg"
    },
    {
      "file": "2.3 Dashboard Overview.svg",
      "code": "2.3",
      "title": "Dashboard Overview",
      "rel_path": "assets/screens/parent hq screens/2.3 Dashboard Overview.svg"
    },
    {
      "file": "2.3a Dashboard \u00b7 Mission Started.svg",
      "code": "2.3a",
      "title": "Dashboard \u00b7 Mission Started",
      "rel_path": "assets/screens/parent hq screens/2.3a Dashboard \u00b7 Mission Started.svg"
    },
    {
      "file": "2.3c Dashboard \u00b7 SOS Alert.svg",
      "code": "2.3c",
      "title": "Dashboard \u00b7 SOS Alert",
      "rel_path": "assets/screens/parent hq screens/2.3c Dashboard \u00b7 SOS Alert.svg"
    },
    {
      "file": "2.4 Perk Shop Manager.svg",
      "code": "2.4",
      "title": "Perk Shop Manager",
      "rel_path": "assets/screens/parent hq screens/2.4 Perk Shop Manager.svg"
    },
    {
      "file": "2.5 Perk Requests.svg",
      "code": "2.5",
      "title": "Perk Requests",
      "rel_path": "assets/screens/parent hq screens/2.5 Perk Requests.svg"
    },
    {
      "file": "2.6 Parent Inbox.svg",
      "code": "2.6",
      "title": "Parent Inbox",
      "rel_path": "assets/screens/parent hq screens/2.6 Parent Inbox.svg"
    },
    {
      "file": "2.6a Proof Review.svg",
      "code": "2.6a",
      "title": "Proof Review",
      "rel_path": "assets/screens/parent hq screens/2.6a Proof Review.svg"
    },
    {
      "file": "2.6b Proof Review \u00b7 2nd Attempt.svg",
      "code": "2.6b",
      "title": "Proof Review \u00b7 2nd Attempt",
      "rel_path": "assets/screens/parent hq screens/2.6b Proof Review \u00b7 2nd Attempt.svg"
    },
    {
      "file": "2.6c Archive.svg",
      "code": "2.6c",
      "title": "Archive",
      "rel_path": "assets/screens/parent hq screens/2.6c Archive.svg"
    },
    {
      "file": "2.7 Settings.svg",
      "code": "2.7",
      "title": "Settings",
      "rel_path": "assets/screens/parent hq screens/2.7 Settings.svg"
    },
    {
      "file": "2.7b Notification Settings.svg",
      "code": "2.7b",
      "title": "Notification Settings",
      "rel_path": "assets/screens/parent hq screens/2.7b Notification Settings.svg"
    },
    {
      "file": "2.7c Privacy.svg",
      "code": "2.7c",
      "title": "Privacy",
      "rel_path": "assets/screens/parent hq screens/2.7c Privacy.svg"
    },
    {
      "file": "2.7e Remove a Cadet.svg",
      "code": "2.7e",
      "title": "Remove a Cadet",
      "rel_path": "assets/screens/parent hq screens/2.7e Remove a Cadet.svg"
    },
    {
      "file": "2.7f Log Out_.svg",
      "code": "2.7f",
      "title": "Log Out_",
      "rel_path": "assets/screens/parent hq screens/2.7f Log Out_.svg"
    },
    {
      "file": "2.7g Cadet Experience.svg",
      "code": "2.7g",
      "title": "Cadet Experience",
      "rel_path": "assets/screens/parent hq screens/2.7g Cadet Experience.svg"
    },
    {
      "file": "2.7h Language.svg",
      "code": "2.7h",
      "title": "Language",
      "rel_path": "assets/screens/parent hq screens/2.7h Language.svg"
    },
    {
      "file": "2.8 Routines.svg",
      "code": "2.8",
      "title": "Routines",
      "rel_path": "assets/screens/parent hq screens/2.8 Routines.svg"
    },
    {
      "file": "2.8b Routine Details.svg",
      "code": "2.8b",
      "title": "Routine Details",
      "rel_path": "assets/screens/parent hq screens/2.8b Routine Details.svg"
    },
    {
      "file": "2.9 Reports \u00b7 Missed Days.svg",
      "code": "2.9",
      "title": "Reports \u00b7 Missed Days",
      "rel_path": "assets/screens/parent hq screens/2.9 Reports \u00b7 Missed Days.svg"
    },
    {
      "file": "2.9a Reports \u00b7 Cadet Details.svg",
      "code": "2.9a",
      "title": "Reports \u00b7 Cadet Details",
      "rel_path": "assets/screens/parent hq screens/2.9a Reports \u00b7 Cadet Details.svg"
    }
  ],
  "reward screens": [
    {
      "file": "5.3 Star Shop.svg",
      "code": "5.3",
      "title": "Star Shop",
      "rel_path": "assets/screens/reward screens/5.3 Star Shop.svg"
    },
    {
      "file": "5.3c Purchase Confirmation.svg",
      "code": "5.3c",
      "title": "Purchase Confirmation",
      "rel_path": "assets/screens/reward screens/5.3c Purchase Confirmation.svg"
    },
    {
      "file": "5.3d Request Sent \u00b7 Escrow.svg",
      "code": "5.3d",
      "title": "Request Sent \u00b7 Escrow",
      "rel_path": "assets/screens/reward screens/5.3d Request Sent \u00b7 Escrow.svg"
    },
    {
      "file": "5.4 Child Inventory.svg",
      "code": "5.4",
      "title": "Child Inventory",
      "rel_path": "assets/screens/reward screens/5.4 Child Inventory.svg"
    },
    {
      "file": "5.4a Commander\u2019s Key Activation.svg",
      "code": "5.4a",
      "title": "Commander\u2019s Key Activation",
      "rel_path": "assets/screens/reward screens/5.4a Commander\u2019s Key Activation.svg"
    },
    {
      "file": "5.5 Free Time Arcade.svg",
      "code": "5.5",
      "title": "Free Time Arcade",
      "rel_path": "assets/screens/reward screens/5.5 Free Time Arcade.svg"
    },
    {
      "file": "5.5a Bubble Pop.svg",
      "code": "5.5a",
      "title": "Bubble Pop",
      "rel_path": "assets/screens/reward screens/5.5a Bubble Pop.svg"
    }
  ],
  "task screens": [
    {
      "file": "4.0 Bedroom Check-in.svg",
      "code": "4.0",
      "title": "Bedroom Check-in",
      "rel_path": "assets/screens/task screens/4.0 Bedroom Check-in.svg"
    },
    {
      "file": "4.1 Micro-Step \u00b7 Step 1.svg",
      "code": "4.1",
      "title": "Micro-Step \u00b7 Step 1",
      "rel_path": "assets/screens/task screens/4.1 Micro-Step \u00b7 Step 1.svg"
    },
    {
      "file": "4.1a Mission Paused.svg",
      "code": "4.1a",
      "title": "Mission Paused",
      "rel_path": "assets/screens/task screens/4.1a Mission Paused.svg"
    },
    {
      "file": "4.1b AR Camera Guide.svg",
      "code": "4.1b",
      "title": "AR Camera Guide",
      "rel_path": "assets/screens/task screens/4.1b AR Camera Guide.svg"
    },
    {
      "file": "4.1c Micro-Step \u00b7 Step 5.svg",
      "code": "4.1c",
      "title": "Micro-Step \u00b7 Step 5",
      "rel_path": "assets/screens/task screens/4.1c Micro-Step \u00b7 Step 5.svg"
    },
    {
      "file": "4.1d Micro-Step \u00b7 Step 2.svg",
      "code": "4.1d",
      "title": "Micro-Step \u00b7 Step 2",
      "rel_path": "assets/screens/task screens/4.1d Micro-Step \u00b7 Step 2.svg"
    },
    {
      "file": "4.1e Micro-Step \u00b7 Step 3.svg",
      "code": "4.1e",
      "title": "Micro-Step \u00b7 Step 3",
      "rel_path": "assets/screens/task screens/4.1e Micro-Step \u00b7 Step 3.svg"
    },
    {
      "file": "4.1f Micro-Step \u00b7 Step 4.svg",
      "code": "4.1f",
      "title": "Micro-Step \u00b7 Step 4",
      "rel_path": "assets/screens/task screens/4.1f Micro-Step \u00b7 Step 4.svg"
    },
    {
      "file": "4.1g Step Skipped.svg",
      "code": "4.1g",
      "title": "Step Skipped",
      "rel_path": "assets/screens/task screens/4.1g Step Skipped.svg"
    },
    {
      "file": "4.1h Grown-up Help.svg",
      "code": "4.1h",
      "title": "Grown-up Help",
      "rel_path": "assets/screens/task screens/4.1h Grown-up Help.svg"
    },
    {
      "file": "4.1i Half Star Won Back.svg",
      "code": "4.1i",
      "title": "Half Star Won Back",
      "rel_path": "assets/screens/task screens/4.1i Half Star Won Back.svg"
    },
    {
      "file": "4.2 Waiting for Commander.svg",
      "code": "4.2",
      "title": "Waiting for Commander",
      "rel_path": "assets/screens/task screens/4.2 Waiting for Commander.svg"
    },
    {
      "file": "4.2a Self-Check \u00b7 Clean Enough_.svg",
      "code": "4.2a",
      "title": "Self-Check \u00b7 Clean Enough_",
      "rel_path": "assets/screens/task screens/4.2a Self-Check \u00b7 Clean Enough_.svg"
    },
    {
      "file": "4.2b Self-Check \u00b7 One More Round.svg",
      "code": "4.2b",
      "title": "Self-Check \u00b7 One More Round",
      "rel_path": "assets/screens/task screens/4.2b Self-Check \u00b7 One More Round.svg"
    },
    {
      "file": "4.2c Self-Check \u00b7 Great For Today.svg",
      "code": "4.2c",
      "title": "Self-Check \u00b7 Great For Today",
      "rel_path": "assets/screens/task screens/4.2c Self-Check \u00b7 Great For Today.svg"
    },
    {
      "file": "4.2d Early Submit \u00b7 Picture Sent.svg",
      "code": "4.2d",
      "title": "Early Submit \u00b7 Picture Sent",
      "rel_path": "assets/screens/task screens/4.2d Early Submit \u00b7 Picture Sent.svg"
    },
    {
      "file": "4.3 Photo Proof.svg",
      "code": "4.3",
      "title": "Photo Proof",
      "rel_path": "assets/screens/task screens/4.3 Photo Proof.svg"
    },
    {
      "file": "4.3a Photo Saved.svg",
      "code": "4.3a",
      "title": "Photo Saved",
      "rel_path": "assets/screens/task screens/4.3a Photo Saved.svg"
    },
    {
      "file": "4.3b Star Capsule.svg",
      "code": "4.3b",
      "title": "Star Capsule",
      "rel_path": "assets/screens/task screens/4.3b Star Capsule.svg"
    },
    {
      "file": "4.3d Verified Together.svg",
      "code": "4.3d",
      "title": "Verified Together",
      "rel_path": "assets/screens/task screens/4.3d Verified Together.svg"
    }
  ],
  "wardrobe screens": [
    {
      "file": "6.0 Wardrobe \u00b7 New Cadet.svg",
      "code": "6.0",
      "title": "Wardrobe \u00b7 New Cadet",
      "rel_path": "assets/screens/wardrobe screens/6.0 Wardrobe \u00b7 New Cadet.svg"
    },
    {
      "file": "6.0a Wardrobe \u00b7 New Cadet \u00b7 Gear.svg",
      "code": "6.0a",
      "title": "Wardrobe \u00b7 New Cadet \u00b7 Gear",
      "rel_path": "assets/screens/wardrobe screens/6.0a Wardrobe \u00b7 New Cadet \u00b7 Gear.svg"
    },
    {
      "file": "6.0b Wardrobe \u00b7 New Cadet \u00b7 Backdrops.svg",
      "code": "6.0b",
      "title": "Wardrobe \u00b7 New Cadet \u00b7 Backdrops",
      "rel_path": "assets/screens/wardrobe screens/6.0b Wardrobe \u00b7 New Cadet \u00b7 Backdrops.svg"
    },
    {
      "file": "6.1 Wardrobe \u00b7 Hats.svg",
      "code": "6.1",
      "title": "Wardrobe \u00b7 Hats",
      "rel_path": "assets/screens/wardrobe screens/6.1 Wardrobe \u00b7 Hats.svg"
    },
    {
      "file": "6.1a Wardrobe \u00b7 Gear.svg",
      "code": "6.1a",
      "title": "Wardrobe \u00b7 Gear",
      "rel_path": "assets/screens/wardrobe screens/6.1a Wardrobe \u00b7 Gear.svg"
    },
    {
      "file": "6.1b Wardrobe \u00b7 Backdrops.svg",
      "code": "6.1b",
      "title": "Wardrobe \u00b7 Backdrops",
      "rel_path": "assets/screens/wardrobe screens/6.1b Wardrobe \u00b7 Backdrops.svg"
    },
    {
      "file": "6.1c Wardrobe \u00b7 Wearing.svg",
      "code": "6.1c",
      "title": "Wardrobe \u00b7 Wearing",
      "rel_path": "assets/screens/wardrobe screens/6.1c Wardrobe \u00b7 Wearing.svg"
    },
    {
      "file": "6.2 Try On \u00b7 Astro Helmet.svg",
      "code": "6.2",
      "title": "Try On \u00b7 Astro Helmet",
      "rel_path": "assets/screens/wardrobe screens/6.2 Try On \u00b7 Astro Helmet.svg"
    },
    {
      "file": "6.2.1 Try On \u00b7 Star Cap.svg",
      "code": "6.2.1",
      "title": "Try On \u00b7 Star Cap",
      "rel_path": "assets/screens/wardrobe screens/6.2.1 Try On \u00b7 Star Cap.svg"
    },
    {
      "file": "6.2.10 Try On Backdrop \u00b7 Sunny Planet.svg",
      "code": "6.2.10",
      "title": "Try On Backdrop \u00b7 Sunny Planet",
      "rel_path": "assets/screens/wardrobe screens/6.2.10 Try On Backdrop \u00b7 Sunny Planet.svg"
    },
    {
      "file": "6.2.11 Try On Backdrop \u00b7 Pink Nebula.svg",
      "code": "6.2.11",
      "title": "Try On Backdrop \u00b7 Pink Nebula",
      "rel_path": "assets/screens/wardrobe screens/6.2.11 Try On Backdrop \u00b7 Pink Nebula.svg"
    },
    {
      "file": "6.2.2 Try On \u00b7 Crown.svg",
      "code": "6.2.2",
      "title": "Try On \u00b7 Crown",
      "rel_path": "assets/screens/wardrobe screens/6.2.2 Try On \u00b7 Crown.svg"
    },
    {
      "file": "6.2.3 Try On \u00b7 Moon Beanie.svg",
      "code": "6.2.3",
      "title": "Try On \u00b7 Moon Beanie",
      "rel_path": "assets/screens/wardrobe screens/6.2.3 Try On \u00b7 Moon Beanie.svg"
    },
    {
      "file": "6.2.4 Try On \u00b7 Star Shades.svg",
      "code": "6.2.4",
      "title": "Try On \u00b7 Star Shades",
      "rel_path": "assets/screens/wardrobe screens/6.2.4 Try On \u00b7 Star Shades.svg"
    },
    {
      "file": "6.2.5 Try On \u00b7 Space Goggles.svg",
      "code": "6.2.5",
      "title": "Try On \u00b7 Space Goggles",
      "rel_path": "assets/screens/wardrobe screens/6.2.5 Try On \u00b7 Space Goggles.svg"
    },
    {
      "file": "6.2.6 Try On \u00b7 Hero Cape.svg",
      "code": "6.2.6",
      "title": "Try On \u00b7 Hero Cape",
      "rel_path": "assets/screens/wardrobe screens/6.2.6 Try On \u00b7 Hero Cape.svg"
    },
    {
      "file": "6.2.7 Try On \u00b7 Bow Tie.svg",
      "code": "6.2.7",
      "title": "Try On \u00b7 Bow Tie",
      "rel_path": "assets/screens/wardrobe screens/6.2.7 Try On \u00b7 Bow Tie.svg"
    },
    {
      "file": "6.2.8 Try On Backdrop \u00b7 Cosmic Glow.svg",
      "code": "6.2.8",
      "title": "Try On Backdrop \u00b7 Cosmic Glow",
      "rel_path": "assets/screens/wardrobe screens/6.2.8 Try On Backdrop \u00b7 Cosmic Glow.svg"
    },
    {
      "file": "6.2.9 Try On Backdrop \u00b7 Moon Mint.svg",
      "code": "6.2.9",
      "title": "Try On Backdrop \u00b7 Moon Mint",
      "rel_path": "assets/screens/wardrobe screens/6.2.9 Try On Backdrop \u00b7 Moon Mint.svg"
    },
    {
      "file": "6.2a Get It_ \u00b7 Astro Helmet.svg",
      "code": "6.2a",
      "title": "Get It_ \u00b7 Astro Helmet",
      "rel_path": "assets/screens/wardrobe screens/6.2a Get It_ \u00b7 Astro Helmet.svg"
    },
    {
      "file": "6.2b Not Enough Stars \u00b7 Crown.svg",
      "code": "6.2b",
      "title": "Not Enough Stars \u00b7 Crown",
      "rel_path": "assets/screens/wardrobe screens/6.2b Not Enough Stars \u00b7 Crown.svg"
    },
    {
      "file": "6.3 New Gear Unlocked.svg",
      "code": "6.3",
      "title": "New Gear Unlocked",
      "rel_path": "assets/screens/wardrobe screens/6.3 New Gear Unlocked.svg"
    },
    {
      "file": "6.4 Look Saved.svg",
      "code": "6.4",
      "title": "Look Saved",
      "rel_path": "assets/screens/wardrobe screens/6.4 Look Saved.svg"
    }
  ]
};

// --- 1. FIGMA DESIGN BLUEPRINT & THESIS GALLERY MODAL ---
let currentThesisCategory = 'parent hq screens';

function openThesisGallery(initialCat = null) {
  if (initialCat) currentThesisCategory = initialCat;
  renderThesisCategories();
  renderThesisScreens(currentThesisCategory);
  document.getElementById('thesisGalleryModal').classList.add('active');
  if (window.sounds) window.sounds.playMenuTransition();
}

function renderThesisCategories() {
  const container = document.getElementById('thesisCategoryPills');
  if (!container) return;
  container.innerHTML = '';

  const catIcons = {
    'Security and onboarding': '🛡️',
    'parent hq screens': '🛸',
    'child home screens': '🎮',
    'task screens': '🚀',
    'reward screens': '🎁',
    'wardrobe screens': '👗',
    'Error & Empty States': '⚠️'
  };

  Object.keys(THESIS_SCREENS_MANIFEST).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'thesis-cat-pill' + (cat === currentThesisCategory ? ' active' : '');
    const count = THESIS_SCREENS_MANIFEST[cat].length;
    btn.innerHTML = `${catIcons[cat] || '📁'} ${cat} (${count})`;
    btn.onclick = () => {
      currentThesisCategory = cat;
      renderThesisCategories();
      renderThesisScreens(cat);
      if (window.sounds) window.sounds.playButtonTap();
    };
    container.appendChild(btn);
  });
}

function renderThesisScreens(cat) {
  const grid = document.getElementById('thesisScreensGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const screens = THESIS_SCREENS_MANIFEST[cat] || [];
  screens.forEach(s => {
    const card = document.createElement('div');
    card.className = 'thesis-card';
    card.innerHTML = `
      <div class="thesis-thumb-wrap">
        <img class="thesis-thumb-img" src="${s.rel_path}" alt="${esc(s.title)}" loading="lazy">
      </div>
      <div class="thesis-card-body">
        <div class="thesis-card-code">${esc(s.code || 'FIGMA')}</div>
        <div class="thesis-card-title">${esc(s.title)}</div>
      </div>
    `;
    card.onclick = () => openThesisPreview(s.title, s.code, s.rel_path);
    grid.appendChild(card);
  });
}

function openThesisPreview(title, code, relPath) {
  const modal = document.getElementById('thesisPreviewModal');
  const img = document.getElementById('thesisPreviewImg');
  const titleEl = document.getElementById('thesisPreviewTitle');
  const codeEl = document.getElementById('thesisPreviewCode');

  if (titleEl) titleEl.textContent = title;
  if (codeEl) codeEl.textContent = code ? `Thesis Screen ${code} • 412×917 Mobile Viewport` : 'Figma 412×917 Mobile Viewport';
  if (img) img.src = relPath;

  modal.style.display = 'flex';
  if (window.sounds) window.sounds.playButtonTap();
}

function closeThesisPreview() {
  const modal = document.getElementById('thesisPreviewModal');
  if (modal) modal.style.display = 'none';
}

// --- 2. PARENT TUTORIAL CAROUSEL (1.2a to 1.2d) ---
let currentParentTutorialSlide = 1;

function openParentTutorial() {
  currentParentTutorialSlide = 1;
  updateParentTutorialSlide();
  document.getElementById('parentTutorialModal').classList.add('active');
  if (window.sounds) window.sounds.playMenuTransition();
}

function navParentTutorial(delta) {
  currentParentTutorialSlide += delta;
  if (currentParentTutorialSlide > 4) {
    closeModal('parentTutorialModal');
    toast('Parent walkthrough complete! 🌟', 'star');
    return;
  }
  if (currentParentTutorialSlide < 1) currentParentTutorialSlide = 1;
  updateParentTutorialSlide();
  if (window.sounds) window.sounds.playButtonTap();
}

function updateParentTutorialSlide() {
  for (let i = 1; i <= 4; i++) {
    const slide = document.getElementById(`ptSlide${i}`);
    if (slide) slide.classList.toggle('active', i === currentParentTutorialSlide);
  }
  const dots = document.querySelectorAll('#parentTutorialDots .tutorial-dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx + 1 === currentParentTutorialSlide);
  });

  const prevBtn = document.getElementById('ptPrevBtn');
  const nextBtn = document.getElementById('ptNextBtn');
  if (prevBtn) prevBtn.style.visibility = currentParentTutorialSlide > 1 ? 'visible' : 'hidden';
  if (nextBtn) nextBtn.textContent = currentParentTutorialSlide === 4 ? 'Finish Guide ✨' : 'Next ➡️';
}

// --- 3. CHILD TUTORIAL CAROUSEL (1.4a to 1.4d) ---
let currentChildTutorialSlide = 1;

function openChildTutorial() {
  currentChildTutorialSlide = 1;
  updateChildTutorialSlide();
  document.getElementById('childTutorialModal').classList.add('active');
  if (window.sounds) {
    window.sounds.playMenuTransition();
    window.sounds.playVoice('welcome_wave');
  }
}

function navChildTutorial(delta) {
  currentChildTutorialSlide += delta;
  if (currentChildTutorialSlide > 4) {
    closeModal('childTutorialModal');
    toast('Popo is ready! Choose a mission! 🚀', 'star');
    return;
  }
  if (currentChildTutorialSlide < 1) currentChildTutorialSlide = 1;
  updateChildTutorialSlide();
  if (window.sounds) window.sounds.playButtonTap();
}

function updateChildTutorialSlide() {
  for (let i = 1; i <= 4; i++) {
    const slide = document.getElementById(`ctSlide${i}`);
    if (slide) slide.classList.toggle('active', i === currentChildTutorialSlide);
  }
  const dots = document.querySelectorAll('#childTutorialDots .tutorial-dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx + 1 === currentChildTutorialSlide);
  });

  const prevBtn = document.getElementById('ctPrevBtn');
  const nextBtn = document.getElementById('ctNextBtn');
  if (prevBtn) prevBtn.style.visibility = currentChildTutorialSlide > 1 ? 'visible' : 'hidden';
  if (nextBtn) nextBtn.textContent = currentChildTutorialSlide === 4 ? "Let's Go! 🚀" : 'Next ➡️';
}

// --- 4. 10-ROOM VISUAL SELECTOR & MICRO-STEP INSPECTOR (2.1a to 2.1m, 2.2) ---
function renderRoomPickerGrid() {
  const grid = document.getElementById('roomPickerGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const roomSvgMap = {
    bedroom: 'assets/figma_ui/Btn card · Planet Bedroom.svg',
    bathroom: 'assets/figma_ui/Btn card · Planet Bathroom.svg',
    kitchen: 'assets/figma_ui/Btn card · Planet Kitchen.svg',
    dining: 'assets/figma_ui/Btn card · Planet Dining.svg',
    living: 'assets/figma_ui/Btn card · Planet Living Room.svg',
    living_room: 'assets/figma_ui/Btn card · Planet Living Room.svg',
    laundry: 'assets/figma_ui/Btn card · Planet Laundry.svg',
    entryway: 'assets/figma_ui/Btn card · Planet Entryway.svg',
    study: 'assets/figma_ui/Btn card · Planet Study.svg',
    school_bag: 'assets/figma_ui/Btn card · Planet School Bag.svg',
    playroom: 'assets/figma_ui/Btn card · Planet Playroom.svg',
    shared_room: 'assets/figma_ui/Btn card · Planet Playroom.svg'
  };

  state.templates.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'room-picker-card';
    card.style.cursor = 'pointer';
    card.style.background = '#FFFFFF';
    card.style.border = '2px solid #C9BAF0';
    card.style.borderRadius = '20px';
    card.style.padding = '12px';
    card.style.boxShadow = '0 6px 18px rgba(112, 69, 158, 0.06)';
    card.style.textAlign = 'center';
    card.style.transition = 'transform 0.2s, box-shadow 0.2s';
    card.onclick = () => openRoomDetailModal(tpl.id);

    const svgPath = roomSvgMap[tpl.id] || 'assets/figma_ui/Btn card · Planet Bedroom.svg';

    card.innerHTML = `
      <img src="${svgPath}" alt="${esc(tpl.room_name)}" style="width: 100%; border-radius: 14px; pointer-events: none; margin-bottom: 8px;">
      <div style="font-weight: 800; font-size: 15px; color: #1E1A3C;">${esc(tpl.chore_title || tpl.room_name)}</div>
      <div style="font-size: 12px; color: #5A5478; margin-top: 4px;">• 5 ADHD Micro-Steps</div>
      <button class="btn-start-chore" style="margin-top: 10px; padding: 8px 16px; font-size: 13px; width: 100%; border-radius: 999px;" onclick="event.stopPropagation(); openRoomDetailModal('${tpl.id}')">
        Inspect & Deploy 🚀
      </button>
    `;
    grid.appendChild(card);
  });
}

function openRoomDetailModal(templateId) {
  const tpl = state.templates.find(t => t.id === templateId) || state.templates[0];
  if (!tpl) return;
  state.activeRoomDetailId = tpl.id;

  const iconEl = document.getElementById('rdIcon');
  const titleEl = document.getElementById('rdTitle');
  const goalEl = document.getElementById('rdGoal');
  const safetyEl = document.getElementById('rdSafetyNote');
  const stepsList = document.getElementById('rdStepsList');
  const cadetSelect = document.getElementById('rdCadetSelect');

  if (iconEl) iconEl.textContent = tpl.icon || '🛏️';
  if (titleEl) titleEl.textContent = `${tpl.room_name} — ${tpl.chore_title}`;
  if (goalEl) goalEl.textContent = `Finish Goal: ${tpl.finish_goal || 'Safe and clear space'}`;

  if (safetyEl) {
    if (tpl.safety_note) {
      safetyEl.textContent = `⚠️ Safety Note: ${tpl.safety_note}`;
      safetyEl.style.display = 'block';
    } else {
      safetyEl.style.display = 'none';
    }
  }

  if (stepsList) {
    stepsList.innerHTML = tpl.steps.map(s => `
      <div class="step-preview-row">
        <div class="step-preview-num">${s.step_num}</div>
        <div class="step-preview-text">
          <b>${esc(s.text)}</b>
          <div style="font-size: 12px; color: var(--text-muted);">${esc(s.popo_hint)}</div>
        </div>
        ${s.low_battery_keep ? '<span class="step-preview-tag">⚡ Low Battery Keep</span>' : ''}
      </div>
    `).join('');
  }

  if (cadetSelect) {
    cadetSelect.innerHTML = state.kids.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join('');
  }

  document.getElementById('roomDetailModal').classList.add('active');
  if (window.sounds) window.sounds.playButtonTap();
}

function sendHeadsUpPrompt() {
  if (window.sounds) window.sounds.playGentleChime();
  toast('Heads-up notification sent to Cadet device! 📣', 'star');
}

async function confirmDeployMission() {
  const cadetSelect = document.getElementById('rdCadetSelect');
  const kidId = cadetSelect ? cadetSelect.value : (state.kids[0] ? state.kids[0].id : 1);

  await assignRoomChore(state.activeRoomDetailId, kidId);
  closeModal('roomDetailModal');
  updateParentTelemetry();
  toast('Mission successfully deployed to Cadet! 🚀', 'star');
}

// --- 5. MISSION CONTROL TELEMETRY BAR & SOS ALERTS (2.2b, 2.3a, 2.3c) ---
function updateParentTelemetry() {
  const statusEl = document.getElementById('telemetryStatus');
  const modeEl = document.getElementById('telemetryMode');
  const starsEl = document.getElementById('telemetryStars');

  const currentKid = state.currentKid || state.kids[0];
  if (!currentKid) return;

  const active = state.chores.find(c => c.status === 'active');
  if (statusEl) {
    if (active) {
      statusEl.textContent = `Mission Telemetry: Cadet ${currentKid.name} active in ${active.room_name} (Step ${state.activeStepIndex + 1} of ${active.steps ? active.steps.length : 5})`;
    } else {
      statusEl.textContent = `Mission Telemetry: Cadet ${currentKid.name} is ready at Space Base`;
    }
  }
  if (modeEl) modeEl.textContent = state.lowBatteryMode ? 'Low Battery 🔋' : 'Standard ⚡';
  if (starsEl) starsEl.textContent = `${currentKid.stars || 0} Stars ⭐`;
}

function triggerSosAlert(cadetName, roomName) {
  const banner = document.getElementById('parentSosBanner');
  const title = document.getElementById('sosBannerTitle');
  const sub = document.getElementById('sosBannerSub');

  if (title) title.textContent = `Cadet ${cadetName} Needs Commander Assistance! 🚨`;
  if (sub) sub.textContent = `Cadet requested help in ${roomName}. Take a deep breath and assist them!`;
  if (banner) banner.style.display = 'flex';

  if (window.sounds) {
    window.sounds.playHelpHum();
  }
}

function respondToSos() {
  dismissSosBanner();
  toast('Commander response sent: On my way! 🏃', 'star');
  if (window.sounds) window.sounds.playVoice('ask_help');
}

function dismissSosBanner() {
  const banner = document.getElementById('parentSosBanner');
  if (banner) banner.style.display = 'none';
}

// --- 6. PARENT PROOF REVIEW MODAL & TOUCH-UP REDO (2.6a, 2.6d, 2.6e) ---
let currentInboxFilter = 'active';

function filterInboxView(filter) {
  currentInboxFilter = filter;
  const activeBtn = document.getElementById('inboxViewActiveBtn');
  const archiveBtn = document.getElementById('inboxViewArchiveBtn');

  if (activeBtn) activeBtn.classList.toggle('active', filter === 'active');
  if (archiveBtn) archiveBtn.classList.toggle('active', filter === 'archive');

  loadParentInbox();
}

function openProofReviewModal(chore) {
  state.activeReviewChore = chore;
  const photo = document.getElementById('prPhotoImg');
  const title = document.getElementById('prTitle');
  const meta = document.getElementById('prCadetMeta');

  if (photo) photo.src = chore.proof_photo || 'assets/mascot popo/mascot poses/14-photo-proof.png';
  if (title) title.textContent = `${chore.room_name || 'Room'} — ${chore.title || chore.chore_title || 'Mission'}`;
  if (meta) meta.textContent = `Submitted by Cadet ${chore.kid_name || 'Explorer'} • +${chore.stars_reward || 10} Stars Bounty`;

  document.getElementById('proofReviewModal').classList.add('active');
  if (window.sounds) window.sounds.playButtonTap();
}

async function confirmApproveProof() {
  if (!state.activeReviewChore) return;
  await approveChore(state.activeReviewChore.id);
  closeModal('proofReviewModal');
  loadParentInbox();
  await loadStats();
}

async function confirmTouchUpProof() {
  if (!state.activeReviewChore) return;
  const noteSelect = document.getElementById('prTouchUpNote');
  const note = noteSelect ? noteSelect.value : 'Check one more small thing!';

  await requestRedo(state.activeReviewChore.id, note);
  closeModal('proofReviewModal');
  loadParentInbox();
  await loadStats();
}

// --- 7. ROUTINES MANAGER (2.8 ROUTINES) ---
const BUILTIN_ROUTINES = [
  {
    key: 'morning',
    name: '🌅 Morning Launch Routine',
    desc: 'Bathroom Routine + Bedroom Reset + School Bag Pack',
    rooms: ['Bathroom', 'Bedroom', 'School Bag Area'],
    stars: 30,
    icon: '🌅'
  },
  {
    key: 'after_school',
    name: '🎒 After-School Reset Routine',
    desc: 'School Bag Unpack + Study Homework Launchpad + Clear Snack Plate',
    rooms: ['School Bag Area', 'Study Area', 'Kitchen'],
    stars: 30,
    icon: '🎒'
  },
  {
    key: 'bedtime',
    name: '🌙 Bedtime Unwind Routine',
    desc: 'Bedroom Floor Tidy + Brush & Wash Routine',
    rooms: ['Bedroom', 'Bathroom'],
    stars: 20,
    icon: '🌙'
  }
];

function renderRoutinesList() {
  const container = document.getElementById('routinesListGrid');
  if (!container) return;
  container.innerHTML = '';

  BUILTIN_ROUTINES.forEach(r => {
    const card = document.createElement('div');
    card.className = 'room-picker-card';
    card.innerHTML = `
      <div>
        <div style="font-size: 36px; margin-bottom: 8px;">${r.icon}</div>
        <div style="font-weight: 800; font-size: 18px; color: #fff;">${r.name}</div>
        <div style="font-size: 13px; color: var(--star-gold); margin-top: 4px;">Reward: +${r.stars} Stars ⭐</div>
        <p style="font-size: 13px; color: var(--text-sub); margin-top: 8px; line-height: 1.5;">${r.desc}</p>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px;">
          ${r.rooms.map(rm => `<span style="font-size: 11px; background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 10px;">📍 ${rm}</span>`).join('')}
        </div>
      </div>
      <button class="btn-start-chore" style="margin-top: 16px; padding: 10px; font-size: 14px;" onclick="deployRoutine('${r.key}')">
        Deploy Full Routine 🚀
      </button>
    `;
    container.appendChild(card);
  });
}

async function deployRoutine(key) {
  const r = BUILTIN_ROUTINES.find(rt => rt.key === key);
  if (!r) return;
  const kid = state.currentKid || state.kids[0];
  if (!kid) return;

  for (const roomName of r.rooms) {
    const tpl = state.templates.find(t => t.room_name === roomName);
    if (tpl) {
      await assignRoomChore(tpl.id, kid.id);
    }
  }
  toast(`Deployed ${r.name} to ${kid.name}! 🚀`, 'star');
  if (window.sounds) window.sounds.playMissionPulse();
}

// --- 8. ADHD PROGRESS REPORTS (2.9 REPORTS) ---
function renderProgressReports() {
  const totalMissionsEl = document.getElementById('reportCompletedMissions');
  const totalStarsEl = document.getElementById('reportStarsAwarded');
  const streakEl = document.getElementById('reportActiveStreak');
  const lowBatteryEl = document.getElementById('reportLowBatteryWins');
  const chartEl = document.getElementById('reportRoomsChart');

  const kid = state.currentKid || state.kids[0];
  const stars = kid ? kid.stars : 40;

  if (totalMissionsEl) totalMissionsEl.textContent = Math.max(12, Math.floor(stars / 10));
  if (totalStarsEl) totalStarsEl.textContent = `${stars} ⭐`;
  if (streakEl) streakEl.textContent = '5 Days 🛡️';
  if (lowBatteryEl) lowBatteryEl.textContent = '4 Wins';

  if (chartEl) {
    const rooms = [
      { name: 'Bedroom', percent: 90, color: 'var(--star-gold)' },
      { name: 'Bathroom', percent: 75, color: 'var(--alien-green)' },
      { name: 'Kitchen', percent: 60, color: 'var(--cosmic-purple-light)' },
      { name: 'School Bag', percent: 85, color: 'var(--cosmic-pink)' },
      { name: 'Study Area', percent: 50, color: '#6ee7b7' }
    ];

    chartEl.innerHTML = rooms.map(r => `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #fff; margin-bottom: 4px;">
          <span>${r.name}</span>
          <span style="font-weight: 700; color: ${r.color};">${r.percent}% consistency</span>
        </div>
        <div style="height: 10px; background: rgba(255,255,255,0.08); border-radius: 5px; overflow: hidden;">
          <div style="width: ${r.percent}%; height: 100%; background: ${r.color}; border-radius: 5px; transition: width 0.8s ease;"></div>
        </div>
      </div>
    `).join('');
  }
}

// --- 9. PIN RECOVERY MODAL (1.1i & 1.1j) ---
function openForgotPinModal() {
  closeModal('pinModal');
  document.getElementById('pinForgotModal').classList.add('active');
  if (window.sounds) window.sounds.playButtonTap();
}

function handleResetPin(e) {
  e.preventDefault();
  const input = document.getElementById('resetPinInput');
  const newPin = input ? input.value : '1234';
  if (newPin.length !== 4) {
    toast('PIN must be exactly 4 digits.', 'error');
    return;
  }
  localStorage.setItem('cando_parent_pin', newPin);
  state.parentPin = newPin;
  closeModal('pinForgotModal');
  toast('Parent PIN updated successfully! 🔓', 'star');
  openParentDashboard('inbox');
}

function resetPinToDefault() {
  localStorage.setItem('cando_parent_pin', '1234');
  state.parentPin = '1234';
  closeModal('pinForgotModal');
  toast('Parent PIN reset to default 1234! 🔓', 'star');
  openParentDashboard('inbox');
}

// --- 10. MISSION PAUSED & SOS HELP FLOW (4.1a, 4.1h, 4.1g, 4.2) ---
function openPauseModal() {
  document.getElementById('missionPausedModal').classList.add('active');
  if (window.sounds) window.sounds.playPause();
}

function resumeMission() {
  closeModal('missionPausedModal');
  if (window.sounds) window.sounds.playMenuTransition();
}

function exitToSpaceBase() {
  closeModal('missionPausedModal');
  closeModal('waitingLoungeModal');
  showScreen('base');
  loadKidSpaceBase();
}

function openSosModal() {
  document.getElementById('sosHelpModal').classList.add('active');
  if (window.sounds) {
    window.sounds.playHelpHum();
    window.sounds.playVoice('ask_help');
  }
  const currentKid = state.currentKid || { name: 'Cadet' };
  const roomName = state.activeChore ? state.activeChore.room_name : 'Room';
  triggerSosAlert(currentKid.name, roomName);
}

function openSkipStepModal() {
  document.getElementById('stepSkippedModal').classList.add('active');
  if (window.sounds) window.sounds.playSkip();
}

function confirmSkipStep() {
  closeModal('stepSkippedModal');
  toast('+0.5 Star Won Back for Trying! ⭐', 'star');
  if (state.currentKid) {
    state.currentKid.stars = (state.currentKid.stars || 0) + 0.5;
    updateHeaderStars();
  }
  completeCurrentStep(true);
}

function openWaitingLounge() {
  document.getElementById('waitingLoungeModal').classList.add('active');
  if (window.sounds) {
    window.sounds.playRadarPulse();
    window.sounds.playVoice('photo_sent');
  }
}

function goToBubbleArcadeFromWaiting() {
  closeModal('waitingLoungeModal');
  showScreen('arcade');
  if (window.sounds) window.sounds.playMenuTransition();
}

// --- 11. CADET BACKPACK & INVENTORY (5.4 & 5.4a) ---
function openChildInventory() {
  if (!state.currentKid) return;
  const modal = document.getElementById('childInventoryModal');
  const perksGrid = document.getElementById('inventoryPerksGrid');
  const wardrobeGrid = document.getElementById('inventoryWardrobeGrid');

  if (perksGrid) {
    perksGrid.innerHTML = `
      <div class="inventory-card">
        <div class="inventory-icon">🎮</div>
        <div class="inventory-title">30m Screen Pass</div>
        <div class="inventory-sub">Ready to use</div>
      </div>
      <div class="inventory-card">
        <div class="inventory-icon">🍦</div>
        <div class="inventory-title">Ice Cream Trip</div>
        <div class="inventory-sub">Earned perk</div>
      </div>
    `;
  }

  if (wardrobeGrid) {
    const unlocked = getKidUnlockedItems(state.currentKid.id);
    const allItems = [...WARDROBE_CATALOG.hats, ...WARDROBE_CATALOG.gear];
    wardrobeGrid.innerHTML = allItems.map(item => {
      const isOwned = unlocked.includes(item.id) || item.price === 0;
      return `
        <div class="inventory-card" style="${isOwned ? 'border-color: var(--alien-green);' : 'opacity: 0.5;'}">
          <div class="inventory-icon">${item.icon}</div>
          <div class="inventory-title">${esc(item.name)}</div>
          <div class="inventory-sub">${isOwned ? 'Unlocked' : item.price + ' ⭐'}</div>
        </div>
      `;
    }).join('');
  }

  modal.classList.add('active');
  if (window.sounds) window.sounds.playButtonTap();
}

function activateCommandersKey() {
  if (window.sounds) window.sounds.playCommandersKey();
  toast('Golden Key Activated! Commander alerted to award special perk! ✨', 'star');
  closeModal('childInventoryModal');
}

// --- 12. FAMILY LINK & DEVICE PAIRING (1.3b to 1.3e) ---
let pairingPollInterval = null;
let pairingCountdownInterval = null;
let activePairingToken = null;
let qrScannerStream = null;
let qrScannerAnimFrame = null;

// Parent: Open Pairing Suite (1.3b Pairing QR)
function openPairingModal(preselectedKidId) {
  const select = document.getElementById('pairingCadetSelect');
  if (select) {
    select.innerHTML = '';
    const kids = state.kids && state.kids.length ? state.kids : [{ id: 1, name: 'Buri' }, { id: 2, name: 'Leo' }];
    kids.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.id;
      opt.textContent = `${k.name} (Cadet #${k.id})`;
      select.appendChild(opt);
    });
    if (preselectedKidId) {
      select.value = preselectedKidId;
    }
  }

  // Reset UI boxes
  const displayBox = document.getElementById('pairingQrDisplayBox');
  const expiredBox = document.getElementById('pairingExpiredBox');
  const claimedBox = document.getElementById('pairingClaimedBox');
  if (displayBox) displayBox.style.display = 'none';
  if (expiredBox) expiredBox.style.display = 'none';
  if (claimedBox) claimedBox.style.display = 'none';

  clearInterval(pairingPollInterval);
  clearInterval(pairingCountdownInterval);

  document.getElementById('pairingModal').classList.add('active');
  if (window.sounds) window.sounds.playMenuTransition();

  // Auto-generate fresh token immediately
  generateNewPairingToken();
}

// Parent: Close Pairing Suite
function closePairingModal() {
  clearInterval(pairingPollInterval);
  clearInterval(pairingCountdownInterval);
  closeModal('pairingModal');
  if (window.sounds && window.sounds.stopTargetLostLoop) window.sounds.stopTargetLostLoop();
}

// Parent: Generate Single-Use 60s Token & QR Code (1.3b)
async function generateNewPairingToken() {
  clearInterval(pairingPollInterval);
  clearInterval(pairingCountdownInterval);

  const displayBox = document.getElementById('pairingQrDisplayBox');
  const expiredBox = document.getElementById('pairingExpiredBox');
  const claimedBox = document.getElementById('pairingClaimedBox');
  const qrImg = document.getElementById('pairingQrImage');
  const tokenPill = document.getElementById('pairingTokenCode');
  const timerSec = document.getElementById('pairingTimerSeconds');
  const countFill = document.getElementById('pairingCountdownFill');
  const statusText = document.getElementById('pairingStatusText');
  const select = document.getElementById('pairingCadetSelect');

  const kidId = select ? parseInt(select.value, 10) || 1 : 1;

  if (expiredBox) expiredBox.style.display = 'none';
  if (claimedBox) claimedBox.style.display = 'none';
  if (displayBox) displayBox.style.display = 'block';
  if (statusText) statusText.textContent = '📡 Generating secure token...';
  if (countFill) countFill.style.width = '100%';
  if (timerSec) timerSec.textContent = '60s';

  try {
    const res = await fetch('/api/pairing/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kid_id: kidId })
    });
    const data = await res.json();
    if (!data.success || !data.token) {
      throw new Error(data.error || 'Failed to generate token');
    }

    activePairingToken = data.token;
    if (tokenPill) tokenPill.textContent = data.token;

    // Set QR Code image
    if (data.qr_data_url) {
      if (qrImg) qrImg.src = data.qr_data_url;
    } else if (window.QRCode && window.QRCode.toDataURL) {
      try {
        const url = await QRCode.toDataURL(data.token, { width: 220, margin: 1 });
        if (qrImg) qrImg.src = url;
      } catch (e) {
        console.error('QR client render error', e);
      }
    }

    if (statusText) statusText.textContent = '📡 Waiting for cadet to scan...';
    if (window.sounds) window.sounds.playPop(800);

    // 60-second countdown
    let remaining = data.expires_in || 60;
    const totalTime = remaining;
    pairingCountdownInterval = setInterval(() => {
      remaining--;
      if (timerSec) timerSec.textContent = `${remaining}s`;
      if (countFill) countFill.style.width = `${Math.max(0, (remaining / totalTime) * 100)}%`;

      if (remaining <= 0) {
        clearInterval(pairingCountdownInterval);
        clearInterval(pairingPollInterval);
        if (displayBox) displayBox.style.display = 'none';
        if (expiredBox) expiredBox.style.display = 'block';
        if (window.sounds) window.sounds.playTargetLost();
      }
    }, 1000);

    // Poll status every 1500ms
    pairingPollInterval = setInterval(async () => {
      try {
        const sRes = await fetch(`/api/pairing/status/${activePairingToken}`);
        const sData = await sRes.json();
        if (sData.status === 'claimed') {
          clearInterval(pairingPollInterval);
          clearInterval(pairingCountdownInterval);
          if (displayBox) displayBox.style.display = 'none';
          if (claimedBox) claimedBox.style.display = 'block';
          const msg = document.getElementById('pairingClaimedMessage');
          if (msg) msg.textContent = `Cadet device is now bound to ${sData.kid_name || 'cadet'}!`;
          if (window.sounds) window.sounds.playParentApproved();
          toast(`Device paired successfully with ${sData.kid_name || 'Cadet'}! 🌟`, 'star');
        } else if (sData.status === 'expired') {
          clearInterval(pairingPollInterval);
          clearInterval(pairingCountdownInterval);
          if (displayBox) displayBox.style.display = 'none';
          if (expiredBox) expiredBox.style.display = 'block';
          if (window.sounds) window.sounds.playTargetLost();
        }
      } catch (pollErr) {
        // Ignore transient poll error
      }
    }, 1500);

  } catch (err) {
    console.error('Generate pairing token failed', err);
    toast('Could not generate pairing token. Try again.', 'error');
  }
}

// Child: Open QR Scanner Camera (1.3c Scan on Child Device)
async function openChildQrScanner() {
  document.getElementById('childQrScanModal').classList.add('active');
  if (window.sounds) window.sounds.playMenuTransition();

  const video = document.getElementById('qrScanVideo');
  const canvas = document.getElementById('qrScanCanvas');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });
    qrScannerStream = stream;
    if (video) {
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.play();
    }

    // Scanning loop with BarcodeDetector + jsQR fallback
    let hasBarcodeDetector = 'BarcodeDetector' in window;
    let barcodeDetector = null;
    if (hasBarcodeDetector) {
      try {
        barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        hasBarcodeDetector = false;
      }
    }

    const scanFrame = async () => {
      if (!qrScannerStream) return;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        if (hasBarcodeDetector && barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const rawVal = barcodes[0].rawValue;
              if (rawVal) {
                closeChildQrScanner();
                claimPairingToken(rawVal);
                return;
              }
            }
          } catch (e) {}
        }

        // jsQR fallback
        if (window.jsQR && canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'dontInvert'
            });
            if (code && code.data) {
              closeChildQrScanner();
              claimPairingToken(code.data);
              return;
            }
          }
        }
      }
      qrScannerAnimFrame = requestAnimationFrame(scanFrame);
    };

    qrScannerAnimFrame = requestAnimationFrame(scanFrame);

  } catch (camErr) {
    console.warn('Camera access error or unavailable', camErr);
    toast('Camera unavailable. You can enter the 6-character code below!', 'info');
  }
}

// Child: Close QR Scanner
function closeChildQrScanner() {
  if (qrScannerAnimFrame) {
    cancelAnimationFrame(qrScannerAnimFrame);
    qrScannerAnimFrame = null;
  }
  if (qrScannerStream) {
    qrScannerStream.getTracks().forEach(track => track.stop());
    qrScannerStream = null;
  }
  const video = document.getElementById('qrScanVideo');
  if (video) video.srcObject = null;
  closeModal('childQrScanModal');
}

// Child: Submit Manual 6-Character Code Fallback
function submitManualPairingCode() {
  const input = document.getElementById('manualPairingCodeInput');
  const code = input ? input.value.trim() : '';
  if (!code) {
    toast('Please enter the 6-character pairing code from parent phone.', 'error');
    return;
  }
  closeChildQrScanner();
  claimPairingToken(code);
}

// Child: Claim Token and Bind Device (1.3d Target Lost / 1.3e Paired Successfully)
async function claimPairingToken(rawToken) {
  let token = String(rawToken || '').trim().toUpperCase();
  if (token.length === 6 && !token.startsWith('CAN-')) {
    token = 'CAN-' + token;
  }

  try {
    const res = await fetch('/api/pairing/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      // 1.3d Target Lost
      if (window.sounds) window.sounds.playTargetLost();
      document.getElementById('targetLostModal').classList.add('active');
      return;
    }

    // 1.3e Paired Successfully
    const cadet = data.cadet;
    localStorage.setItem('cando_paired_kid', JSON.stringify(cadet));
    localStorage.setItem('cando_paired_token', token);
    state.currentKid = cadet;

    const sub = document.getElementById('pairedSuccessSub');
    if (sub) {
      sub.innerHTML = `Welcome aboard, <b>${cadet.name}</b>! 🚀<br>Your device is now linked to Commander\'s control room.`;
    }

    if (window.sounds) {
      if (window.sounds.stopTargetLostLoop) window.sounds.stopTargetLostLoop();
      window.sounds.playParentApproved();
    }
    document.getElementById('pairedSuccessModal').classList.add('active');

  } catch (err) {
    console.error('Claim pairing error', err);
    if (window.sounds) window.sounds.playTargetLost();
    document.getElementById('targetLostModal').classList.add('active');
  }
}

// Child: Transition to Space Base from Paired Celebration
function enterSpaceBaseFromPairing() {
  closeModal('pairedSuccessModal');
  const saved = localStorage.getItem('cando_paired_kid');
  let kidId = 1;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) kidId = parsed.id;
    } catch (e) {}
  }
  const targetKid = (state.kids || []).find(k => k.id === kidId) || state.kids[0] || { id: kidId, name: 'Cadet' };
  selectKid(targetKid);
}

// Compatibility helper
function simulateDevicePaired() {
  if (window.sounds) window.sounds.playParentApproved();
  closeModal('pairingModal');
  toast('Cadet Paired Successfully! (1.3e) 🌟', 'star');
}
