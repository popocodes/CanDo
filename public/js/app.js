/**
 * CanDo! - Main Client Application Logic
 * Implements ADHD-friendly design, 2D AR Magic Lens, SoftLock Distraction Monitor,
 * Spaceship Progress Bar, Roulette Wheel, and Parent Command Center.
 */

const state = {
  currentScreen: 'gateway',
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
  parentPin: ''
};

// --- HELPERS ---
const $id = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const POSES = ['popo_idea', 'popo_backpack', 'popo_clipboard', 'popo_blocks', 'popo_star', 'popo_celebrate', 'popo_reading'];

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

  // If kids exist, show gateway; else show onboarding
  if (state.kids.length > 0) {
    showScreen('gateway');
  } else {
    showScreen('gateway');
  }
});

// --- SERVER-SENT EVENTS (SSE) FOR LIVE UPDATES ---
function initSSE() {
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
    if (window.sounds) window.sounds.playFanfare();
    if (state.currentScreen === 'base' || state.currentScreen === 'arcade') loadKidChores();
  }
  if (evt.type === 'chore_redo' && state.currentKid && evt.payload.kidId === state.currentKid.id) {
    toast('💬 Popo: ' + (evt.payload.note || "That's okay! Let's do one more small round."), 'star');
    if (state.currentScreen === 'base') loadKidChores();
  }
  if (evt.type === 'kid_created') loadKids();

  if (evt.type === 'mission_completed' || evt.type === 'alert' || evt.type === 'reward_claimed' || evt.type === 'chore_approved') {
    // If on parent dashboard, reload inbox and alerts
    if (state.currentScreen === 'parent') {
      loadParentInbox();
      loadAlertsFeed();
      loadRedemptions();
      loadStats();
    }
    // Update kid star count if current kid matches
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

  if (screenId === 'gateway') {
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

  // Bubble Arcade lifecycle
  if (screenId === 'arcade') {
    if (!state.bubbleGame) {
      state.bubbleGame = new CosmicBubblePop('bubbleCanvas');
    }
    state.bubbleGame.start();
  } else if (state.bubbleGame) {
    state.bubbleGame.stop();
  }

  state.inChoreMode = (screenId === 'chore');
}

function updateHeaderStars() {
  if (state.currentKid) {
    const el = document.getElementById('headerStarsText');
    if (el) el.textContent = `${state.currentKid.stars} ⭐`;
  }
}

// --- SOFTLOCK DISTRACTION MONITOR ---
// Detects if child switches tabs, minimizes window, or leaves app mid-chore
function initDistractionMonitor() {
  const reportDistraction = async () => {
    if (!state.inChoreMode || !state.activeChore || !state.currentKid) return;
    const now = Date.now();
    // Throttle alerts: once every 45s
    if (now - state.lastDistractionTime < 45000) return;
    state.lastDistractionTime = now;

    try {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kid_id: state.currentKid.id,
          type: 'distraction',
          title: '🚨 Task Paused',
          message: `${state.currentKid.name} left CanDo! at ${timeStr}. Text or check in to get them back on track!`
        })
      });
    } catch (e) {
      console.warn('Failed to send distraction alert', e);
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      reportDistraction();
    } else {
      // Child returned!
      if (state.inChoreMode && state.activeChore) {
        showDistractionWelcome();
      }
    }
  });

  window.addEventListener('blur', () => {
    reportDistraction();
  });
}

function showDistractionWelcome() {
  const toast = document.getElementById('distractionToast');
  if (!toast) return;
  toast.classList.add('show');
  if (window.sounds) window.sounds.playGentleChime();
  setTimeout(() => {
    toast.classList.remove('show');
  }, 6000);
}

// --- DATA FETCHING ---
async function loadKids() {
  try {
    const res = await fetch('/api/kids');
    state.kids = await res.json();
    renderGatewayKids();
  } catch (err) {
    console.error('Failed to load kids', err);
  }
}

async function loadTemplates() {
  try {
    const res = await fetch('/api/templates');
    state.templates = await res.json();
    renderTemplatesList();
  } catch (err) {
    console.error('Failed to load templates', err);
  }
}

// --- SCREEN 1: GATEWAY RENDERING ---
function renderGatewayKids() {
  const grid = document.getElementById('gatewayKidsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const emptyEl = $id('gatewayEmpty');
  if (emptyEl) emptyEl.style.display = state.kids.length ? 'none' : 'block';
  state.kids.forEach(k => {
    const card = document.createElement('div');
    card.className = 'kid-card';
    card.style.borderColor = k.color || 'var(--alien-green)';
    card.innerHTML = `
      <div class="kid-avatar-wrap" style="border-color: ${k.color || 'var(--alien-green)'}">
        <img src="${esc(k.avatar)}" alt="${esc(k.name)}">
      </div>
      <div class="kid-name">${esc(k.name)}</div>
      <div class="kid-card-stars">⭐ ${k.stars} Stars</div>
    `;
    card.onclick = () => selectKid(k);
    grid.appendChild(card);
  });

  // Add kid card
  const addCard = document.createElement('div');
  addCard.className = 'kid-card add-kid-card';
  addCard.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 8px;">➕</div>
    <div style="font-size: 18px; font-weight: 700;">Add Explorer</div>
    <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">For Parents</div>
  `;
  addCard.onclick = () => openPinModal('add_kid');
  grid.appendChild(addCard);
}

async function selectKid(kid) {
  state.currentKid = kid;
  updateHeaderStars();
  await loadKidSpaceBase();
  showScreen('base');
}

// --- SCREEN 2: THE SPACE BASE (QUEST HUB) ---
async function loadKidSpaceBase() {
  if (!state.currentKid) return;

  document.getElementById('baseKidName').textContent = `${state.currentKid.name}'s Space Base`;

  // Load chores for this kid
  await loadKidChores();
  // Load room decorations
  await loadKidDecorations();
}

async function loadKidChores() {
  if (!state.currentKid) return;
  try {
    const res = await fetch(`/api/chores?kid_id=${state.currentKid.id}`);
    state.chores = await res.json();
    renderTaskBoard();
    updateArcadeMachineState();
  } catch (err) {
    console.error('Failed to load chores', err);
  }
}

function renderTaskBoard() {
  const listEl = document.getElementById('taskBoardList');
  if (!listEl) return;

  // Filter uncompleted chores
  const activeChores = state.chores.filter(c => c.status !== 'completed');

  if (activeChores.length === 0) {
    listEl.innerHTML = `
      <div class="empty-tasks-card">
        <img src="assets/popo_celebrate.png" alt="All Done!">
        <h3 style="font-size: 22px; color: var(--star-gold); margin-bottom: 6px;">All Missions Clear! 🌟</h3>
        <p style="color: var(--text-muted); margin-bottom: 16px;">Awesome work! You completed all today's quests.</p>
        <button class="btn-start-chore" onclick="showScreen('arcade')">
          🕹️ Play Cosmic Bubble Pop
        </button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = '';
  activeChores.forEach(chore => {
    const card = document.createElement('div');
    card.className = 'chore-card';

    const tpl = state.templates.find(t => t.id === chore.room_template_id);
    const roomIcon = tpl ? tpl.icon : '🚀';

    const isPending = chore.status === 'pending_approval';
    const btnLabel = isPending ? '⏳ Under Review' : (chore.status === 'in_progress' ? 'Continue 🚀' : 'Start 🚀');

    card.innerHTML = `
      <div class="chore-left">
        <div class="chore-room-icon">${roomIcon}</div>
        <div>
          <div class="chore-title">${esc(chore.title)}</div>
          <div class="chore-finish-goal">${esc(chore.finish_goal || 'Tidy up and reset your space')}</div>
          ${chore.safety_note ? `<div style="font-size: 12px; color: var(--cosmic-pink); margin-top: 4px;">⚠️ ${esc(chore.safety_note)}</div>` : ''}
        </div>
      </div>
      <div class="chore-right">
        <div class="chore-stars-badge">
          +${chore.stars_reward || 10} ⭐
        </div>
        <button class="btn-start-chore" ${isPending ? 'style="opacity:0.75; cursor:default;"' : ''}>
          ${btnLabel}
        </button>
      </div>
    `;

    if (!isPending) {
      card.onclick = () => startChore(chore.id);
    }
    listEl.appendChild(card);
  });
}

function updateArcadeMachineState() {
  const btn = document.getElementById('arcadeHubBtn');
  const badge = document.getElementById('arcadeTapeBadge');
  if (!btn) return;

  const pendingOrActive = state.chores.filter(c => c.status === 'assigned' || c.status === 'in_progress');
  if (pendingOrActive.length === 0) {
    btn.classList.remove('arcade-locked');
    btn.classList.add('arcade-unlocked');
    if (badge) badge.style.display = 'none';
  } else {
    btn.classList.add('arcade-locked');
    btn.classList.remove('arcade-unlocked');
    if (badge) badge.style.display = 'block';
  }
}

// --- SPACE BASE ROOM CUSTOMIZER ---
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

function renderRoomDecorations() {
  const container = document.getElementById('roomDecorations');
  if (!container) return;

  container.innerHTML = '';

  // Popo buddy is always in the center
  const mascotSpot = document.createElement('div');
  mascotSpot.className = 'room-mascot-spot';
  mascotSpot.innerHTML = `
    <img src="assets/popo_mascot.png" alt="Popo">
    <div style="font-size: 14px; font-weight: 700; color: var(--alien-green); margin-top: 4px;">Popo</div>
  `;
  container.appendChild(mascotSpot);

  // Render placed items
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
      toast(data.error || 'Cannot unlock item');
      return;
    }
    state.currentKid.stars = data.kid.stars;
    updateHeaderStars();
    if (window.sounds) window.sounds.playStarDing();
    await loadKidDecorations();
    openRoomCustomizerModal(); // refresh list
  } catch (err) {
    console.error('Failed to buy decoration', err);
  }
}

// --- ROULETTE WHEEL: DECIDE FOR ME! ---
let wheelSpinning = false;
let wheelAngle = 0;

function openRouletteModal() {
  const activeChores = state.chores.filter(c => c.status !== 'completed' && c.status !== 'pending_approval');
  if (activeChores.length === 0) {
    toast('No pending missions to spin for! You are all caught up! 🌟');
    return;
  }

  const modal = document.getElementById('rouletteModal');
  modal.classList.add('active');
  drawRouletteWheel(activeChores);

  const spinBtn = document.getElementById('spinWheelBtn');
  spinBtn.disabled = false;
  spinBtn.onclick = () => spinWheel(activeChores);
}

function drawRouletteWheel(chores) {
  const canvas = document.getElementById('rouletteCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 8;

  ctx.clearRect(0, 0, size, size);

  const numSlices = chores.length;
  const sliceAngle = (Math.PI * 2) / numSlices;
  const colors = ['#8dbd61', '#70459e', '#ffb644', '#f4718d', '#4cd3e3', '#6B5BFF'];

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(wheelAngle);

  for (let i = 0; i < numSlices; i++) {
    const start = i * sliceAngle;
    const end = start + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#14142b';
    ctx.stroke();

    // Text label
    ctx.save();
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Fredoka, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;

    const choreTitle = chores[i].title;
    const shortTitle = choreTitle.length > 14 ? choreTitle.substring(0, 12) + '...' : choreTitle;
    ctx.fillText(shortTitle, radius - 20, 5);
    ctx.restore();
  }

  ctx.restore();
}

function spinWheel(chores) {
  if (wheelSpinning) return;
  wheelSpinning = true;
  const spinBtn = document.getElementById('spinWheelBtn');
  spinBtn.disabled = true;

  const canvas = document.getElementById('rouletteCanvas');
  const numSlices = chores.length;
  const sliceAngle = (Math.PI * 2) / numSlices;

  // Random number of full turns (4-7) + target offset
  const fullRotations = 4 + Math.random() * 3;
  const targetSector = Math.floor(Math.random() * numSlices);
  // Pointer is at the top (-PI/2), calculate stop angle
  const targetAngle = (fullRotations * Math.PI * 2) + ((numSlices - targetSector - 0.5) * sliceAngle) - (Math.PI / 2);

  const startAngle = wheelAngle % (Math.PI * 2);
  const totalChange = targetAngle - startAngle;
  const duration = 3800;
  const startTime = performance.now();
  let lastTickIndex = -1;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic ease-out
    const ease = 1 - Math.pow(1 - progress, 3);
    wheelAngle = startAngle + totalChange * ease;

    // Check tick sound on sector pass
    const currentSector = Math.floor(((wheelAngle + Math.PI / 2) / sliceAngle)) % numSlices;
    if (currentSector !== lastTickIndex) {
      if (window.sounds) window.sounds.playWheelTick();
      lastTickIndex = currentSector;
    }

    drawRouletteWheel(chores);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      wheelSpinning = false;
      spinBtn.disabled = false;
      const chosenChore = chores[targetSector];
      if (window.sounds) window.sounds.playStarDing();

      setTimeout(() => {
        closeModal('rouletteModal');
        startChore(chosenChore.id);
      }, 700);
    }
  }

  requestAnimationFrame(animate);
}

// --- STAR REWARDS SHOP ---
async function openRewardsShopModal() {
  if (!state.currentKid) return;
  try {
    const res = await fetch('/api/rewards');
    state.rewards = await res.json();

    const listEl = document.getElementById('rewardsShopList');
    listEl.innerHTML = '';

    state.rewards.forEach(r => {
      const canAfford = state.currentKid.stars >= r.star_cost;
      const card = document.createElement('div');
      card.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 14px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 36px;">${r.icon}</span>
          <div>
            <div style="font-size: 17px; font-weight: 700;">${esc(r.title)}</div>
            <div style="font-size: 13px; color: var(--text-muted);">${esc(r.description || '')}</div>
            <div style="font-size: 14px; color: var(--star-gold); font-weight: 700; margin-top: 2px;">Cost: ${r.star_cost} ⭐</div>
          </div>
        </div>
        <div>
          <button class="btn-start-chore" style="padding: 8px 16px; font-size: 14px; ${!canAfford ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${!canAfford ? 'disabled' : ''} onclick="redeemReward(${r.id})">
            Claim 🎁
          </button>
        </div>
      `;
      listEl.appendChild(card);
    });

    document.getElementById('rewardsShopModal').classList.add('active');
  } catch (err) {
    console.error('Failed to load rewards shop', err);
  }
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
    if (window.sounds) window.sounds.playFanfare();

    closeModal('rewardsShopModal');
    toast(`🎉 Reward Claimed: "${data.reward.title}"! Popo notified your parents!`);
  } catch (err) {
    console.error('Failed to redeem reward', err);
  }
}

// --- SCREEN 3: ACTIVE CHORE MODE (MICRO-STEP FLOW) ---
async function startChore(choreId) {
  try {
    const res = await fetch(`/api/chores/${choreId}`);
    state.activeChore = await res.json();

    // Check low battery preference
    state.lowBatteryMode = state.activeChore.is_low_battery === 1;
    const toggleEl = document.getElementById('lowBatteryToggle');
    if (toggleEl) toggleEl.checked = state.lowBatteryMode;

    // Filter steps if low battery mode is on
    const steps = getVisibleSteps();
    // Start on first uncompleted step or step 0
    let startIndex = steps.findIndex(s => s.is_completed === 0);
    if (startIndex === -1) startIndex = 0;
    state.activeStepIndex = startIndex;

    showScreen('chore');
    renderActiveStep();
  } catch (err) {
    console.error('Failed to start chore', err);
  }
}

function getVisibleSteps() {
  if (!state.activeChore || !state.activeChore.steps) return [];
  if (state.lowBatteryMode) {
    // ADHD Low Battery Mode: Filter down to essential 1-2 steps
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

  // Update Chore Title
  document.getElementById('activeChoreTitle').textContent = chore.title;

  // Update ADHD Spaceship Progress Bar (Visual, NO ticking numbers!)
  renderSpaceshipProgress(steps.length, state.activeStepIndex);

  // Step Number Tag
  document.getElementById('stepTag').textContent = `Step ${state.activeStepIndex + 1} of ${steps.length}`;

  // Step Instruction Text
  document.getElementById('stepInstruction').textContent = currentStep.text;

  // Popo Guide Box
  const popoImg = document.getElementById('popoPoseImg');
  popoImg.src = currentStep.pose || 'assets/popo_mascot.png';
  document.getElementById('popoHintText').textContent = currentStep.popo_hint || 'Popo is right here cheering you on!';

  // Safety Note
  const safetyEl = document.getElementById('choreSafetyBanner');
  if (chore.safety_note) {
    safetyEl.style.display = 'block';
    safetyEl.textContent = `⚠️ ${esc(chore.safety_note)}`;
  } else {
    safetyEl.style.display = 'none';
  }

  // Previous button visibility
  const prevBtn = document.getElementById('prevStepBtn');
  prevBtn.style.visibility = (state.activeStepIndex > 0) ? 'visible' : 'hidden';

  // Primary Action Button (Next or Snap Proof)
  const isLast = (state.activeStepIndex === steps.length - 1);
  const nextBtn = document.getElementById('nextStepBtn');
  if (isLast) {
    nextBtn.innerHTML = `📸 Done! Snap Mission Proof ⭐`;
  } else {
    nextBtn.innerHTML = `Done! Next Step ➡️ ⭐`;
  }
  const cs = $id('collectedStars');
  if (cs) cs.textContent = `⭐ ${state.activeStepIndex} collected`;

  // Speak instruction aloud automatically (Audio First ADHD psychology)
  if (window.sounds && window.sounds.speechEnabled) {
    window.sounds.speak(currentStep.text);
  }
}

// Visual Spaceship Progress Bar
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

  // Position the spaceship
  setTimeout(() => {
    const pct = totalSteps > 1 ? (currentIndex / (totalSteps - 1)) * 100 : 100;
    ship.style.left = `calc(${pct}% - 14px)`;
  }, 50);
}

async function completeCurrentStep() {
  const steps = getVisibleSteps();
  const currentStep = steps[state.activeStepIndex];

  if (window.sounds) window.sounds.playStarDing();

  // Mark step complete in database
  if (state.activeChore) {
    await fetch(`/api/chores/${state.activeChore.id}/step/${currentStep.step_num}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: true })
    });
  }

  // Check if was last step
  if (state.activeStepIndex >= steps.length - 1) {
    // "Is the room clean enough for now?" check-in
    openCheckin();
  } else {
    state.activeStepIndex++;
    if (window.sounds) window.sounds.playWhoosh();
    renderActiveStep();
  }
}

function openCheckin(note = '') {
  $id('checkinNote').textContent = note;
  $id('checkinModal').classList.add('active');
  if (window.sounds) window.sounds.speak('Is the room clean enough for now?');
}

async function requestHelp() {
  if (!state.currentKid || !state.activeChore) return;
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
    window.sounds.speak(currentStep.text);
  }
}

// --- SCREEN 4: 2D AR "MAGIC LENS" (VISUAL PROMPTING) ---
async function openArMagicLens() {
  const modal = document.getElementById('arModal');
  const video = document.getElementById('arVideo');
  const steps = getVisibleSteps();
  const currentStep = steps[state.activeStepIndex];

  document.getElementById('arStepText').textContent = currentStep ? currentStep.text : 'Spot where your items go!';

  modal.classList.add('active');

  // Request camera
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    state.cameraStream = stream;
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.warn('Camera access unavailable or denied for AR:', err);
    // Simulated cosmic visual scanner fallback
    video.poster = 'assets/popo_mascot.png';
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

function triggerCelebration() {
  if (window.sounds) window.sounds.playFanfare();
  const modal = document.getElementById('celebrationModal');
  modal.classList.add('active');

  // Launch HTML5 Confetti
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

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 20,
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
      p.vy += 0.4; // gravity
      p.rotation += p.rotSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (frames < 200) {
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
    loadKidSpaceBase();
    showScreen('base');
  }
}

// --- SCREEN 6: PARENT COMMAND CENTER (PIN PROTECTED) ---
let pendingPinAction = null;

function openPinModal(action = 'open_parent') {
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
      if (i <= state.enteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    }
  }
}

async function verifyPin() {
  try {
    const res = await fetch('/api/settings/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: state.enteredPin })
    });
    const data = await res.json();
    if (data.success) {
      state.parentPin = state.enteredPin;
      closeModal('pinModal');
      if (pendingPinAction === 'open_parent') {
        openParentDashboard();
      } else if (pendingPinAction === 'add_kid') {
        openParentDashboard('settings');
      }
    } else {
      toast('Incorrect PIN. Try again.');
      state.enteredPin = '';
      updatePinDots();
    }
  } catch (err) {
    console.error('PIN verification error', err);
  }
}

async function openParentDashboard(initialTab = 'inbox') {
  showScreen('parent');
  switchParentTab(initialTab);
  await loadParentInbox();
  await loadAlertsFeed();
  await loadRedemptions();
  await loadParentKids();
  loadStats();
  loadParentChoresList();
  fillCustomChoreKids();
}

function switchParentTab(tabName) {
  document.querySelectorAll('.parent-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const tabBtn = document.querySelector(`.parent-tab[data-tab="${tabName}"]`);
  const pane = document.getElementById(`tab-${tabName}`);
  if (tabBtn) tabBtn.classList.add('active');
  if (pane) pane.classList.add('active');
  if (tabName === 'notify') loadNtfyForm();
  if (tabName === 'rewards') loadParentRewards();
  if (tabName === 'assigner') { fillCustomChoreKids(); loadParentChoresList(); }
}

// Stats cards
async function loadStats() {
  const grid = $id('statsGrid');
  if (!grid) return;
  try {
    const st = await (await fetch('/api/stats')).json();
    const cards = [
      ['📥', st.pendingApprovals, 'waiting for approval'],
      ['✅', st.completedThisWeek, 'missions this week'],
      ['⭐', st.starsAwardedThisWeek, 'stars awarded this week'],
      ['🚨', st.distractionsToday, 'left-app events today'],
      ['🎁', st.pendingRewardClaims, 'rewards to grant']
    ];
    grid.innerHTML = cards.map(c => `<div class="stat-card"><div class="num">${c[0]} ${c[1]}</div><div class="lbl">${c[2]}</div></div>`).join('');
  } catch (e) { /* ignore */ }
}

// ntfy notification settings
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

// Custom chore
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
    pose: `assets/${POSES[i % POSES.length]}.png`,
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

// Rewards list for parents
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

// Tab 1: Inbox (Approvals)
async function loadParentInbox() {
  try {
    const res = await fetch('/api/chores?status=pending_approval');
    const pending = await res.json();

    const badge = document.getElementById('inboxBadge');
    if (badge) badge.textContent = pending.length;

    const list = document.getElementById('parentInboxList');
    if (!list) return;

    if (pending.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 40px; margin-bottom: 8px;">✨</div>
          <h3>Inbox Zero!</h3>
          <p>All mission photos are reviewed and approved.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = '';
    pending.forEach(item => {
      const row = document.createElement('div');
      row.className = 'inbox-item';
      row.innerHTML = `
        <img src="${item.proof_photo || 'assets/popo_celebrate.png'}" class="inbox-proof-thumb" onclick="previewProofPhoto('${item.proof_photo}')" alt="Proof photo">
        <div class="inbox-details">
          <div class="inbox-kid-tag">Cadet: ${esc(item.kid_name)}</div>
          <div class="inbox-title">${esc(item.title)}</div>
          <div class="inbox-time">Goal: ${item.finish_goal || ''}</div>
          <div class="inbox-time">Reward: +${item.stars_reward || 10} ⭐</div>
        </div>
        <div class="inbox-actions">
          <button class="btn-approve" onclick="approveChore(${item.id})">
            Approve ⭐
          </button>
          <button class="btn-redo" onclick="requestRedo(${item.id})">
            Gentle Redo
          </button>
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
      if (window.sounds) window.sounds.playFanfare();
      await loadParentInbox();
      await loadAlertsFeed();
      loadStats();
    }
  } catch (err) {
    console.error('Failed to approve chore', err);
  }
}

async function requestRedo(choreId) {
  const note = prompt('Add an encouraging touch-up note for Popo to say:', 'Almost done! Popo noticed one more tiny spot. Give it one more quick look!');
  if (note === null) return;
  try {
    await fetch(`/api/chores/${choreId}/request-redo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    await loadParentInbox();
    await loadAlertsFeed();
  } catch (err) {
    console.error('Failed to request redo', err);
  }
}

// Tab 2: Task Assigner (Preloaded with all 10 rooms!)
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
      <div>
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
  // Brand click goes to gateway
  document.getElementById('brandLogoBadge').onclick = () => {
    if (state.inChoreMode) {
      if (confirm('Leave current chore? Popo will save your spot.')) {
        showScreen('base');
      }
    } else {
      showScreen('gateway');
    }
  };

  // Header explorer switch
  document.getElementById('headerExplorerBtn').onclick = () => showScreen('gateway');

  // Sound toggle
  document.getElementById('soundToggleBtn').onclick = () => {
    if (window.sounds) {
      const isMuted = window.sounds.toggleMute();
      document.getElementById('soundToggleIcon').textContent = isMuted ? '🔇' : '🔊';
    }
  };

  // Parent lock button
  document.getElementById('parentLockBtn').onclick = () => openPinModal('open_parent');

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

  // Rewards shop
  document.getElementById('rewardsHubBtn').onclick = openRewardsShopModal;

  // Room customizer
  document.getElementById('customizeRoomBtn').onclick = openRoomCustomizerModal;

  // Check-in modal
  $id('checkinYes').onclick = () => { closeModal('checkinModal'); openProofPhotoScreen(); };
  $id('checkinPhoto').onclick = () => { closeModal('checkinModal'); openProofPhotoScreen(); };
  $id('checkinNo').onclick = () => {
    closeModal('checkinModal');
    state.activeStepIndex = 0;
    renderActiveStep();
    toast("That's okay! Let's do one more small round. 💪", 'star');
  };
  $id('checkinHelp').onclick = () => { requestHelp(); };
  $id('helpBtn').onclick = requestHelp;

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
