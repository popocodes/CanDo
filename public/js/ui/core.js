// CanDo! UI core: server data, routing and shared components.
(() => {
'use strict';
const standalone = !!window.Capacitor || location.protocol === 'file:';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } }
};
// The Android build ships a default server address (js/config.js); it can be changed in the app.
const base = () => standalone ? (store.get('cando_server') || window.CANDO_SERVER || '') : '';

const S = {
  data: null,
  pin: null,                          // parent PIN, memory only
  kidId: +store.get('cando_kid') || null,
  tmp: {}                             // per-flow scratch values
};

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sfx = (name) => { try { window.sounds && window.sounds[name] && window.sounds[name](); } catch { /* sound is optional */ } };
const voice = (cat) => { try { if (S.data?.prefs.cadet.narration) window.sounds?.playVoice(cat); } catch { /* optional */ } };

async function api(url, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (S.pin) headers['x-parent-pin'] = S.pin;
  let res;
  try {
    res = await fetch(base() + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    const e = new Error('offline'); e.offline = true; throw e;
  }
  const out = await res.json().catch(() => null);
  if (!res.ok || out === null) {
    const e = new Error(out?.error || 'The CanDo! server did not answer properly.');
    e.status = res.status; e.offline = out === null; throw e;
  }
  return out;
}
async function load() { S.data = await api('/api/v2/state'); document.body.classList.toggle('calm', !!S.data.prefs.cadet.calmMotion); }

// ---------- routing: #name?key=value, so the phone's back button works ----------
const screens = {};
const screen = (name, fn) => { screens[name] = fn; };
let current = null, cleanup = null, trail = [], drawn = '';

function parseHash() {
  const [name, query] = location.hash.slice(1).split('?');
  return { name: name || 'splash', p: Object.fromEntries(new URLSearchParams(query || '')) };
}
function href(name, p) { const q = new URLSearchParams(p || {}).toString(); return '#' + name + (q ? '?' + q : ''); }
function go(name, p, { replace } = {}) {
  const next = href(name, p);
  if (location.hash === next) return render();
  if (replace) { history.replaceState(null, '', next); render(); } else location.hash = next;
}
function back(fallback) { if (trail.length > 1) history.back(); else go(fallback || 'role', null, { replace: true }); }

const root = () => document.getElementById('app');

function render({ refresh } = {}) {
  let { name, p } = parseHash();
  if (!S.data && !['offline', 'splash'].includes(name)) {
    if (name.startsWith('a.')) S.deepLink = location.hash; // emailed, sign-in and payment links
    name = 'splash';
  }
  if (name.startsWith('p.') && !S.pin && !name.startsWith('p.pin')) return go('p.pin', null, { replace: true });
  if (name.startsWith('c.') && !['c.login', 'c.scan', 'c.lost', 'c.offline'].includes(name) && !kid()) return go('c.login', null, { replace: true });
  const view = screens[name] || screens.role;
  const scrollTop = refresh ? root().querySelector('.scroll')?.scrollTop : 0;
  const v = view(p);
  if (!v) return; // the screen redirected
  if (cleanup) { cleanup(); cleanup = null; }
  if (!refresh) closeModal();
  const keepModal = refresh ? root().querySelector('.overlay') : null;
  current = { name, p, view: v };
  drawn = JSON.stringify(S.data);
  if (!refresh) { const h = href(name, p); if (trail[trail.length - 2] === h) trail.pop(); else if (trail[trail.length - 1] !== h) trail.push(h); }
  root().innerHTML = `<main class="screen ${v.cls || ''}">${v.html}</main>`;
  if (keepModal) root().appendChild(keepModal);
  if (scrollTop) root().querySelector('.scroll').scrollTop = scrollTop;
  if (v.mount) cleanup = v.mount(root()) || null;
}

// Re-render after live changes, but never under someone's fingers (forms, camera, game).
async function refresh() {
  try { await load(); } catch { return; }
  // redraw only when something really changed, so frequent checks never flicker or replay animations
  if (current?.view.live && JSON.stringify(S.data) !== drawn) render({ refresh: true });
}

// ---------- actions ----------
const globalActs = {
  go: (el) => go(el.dataset.to, el.dataset.q ? Object.fromEntries(new URLSearchParams(el.dataset.q)) : null),
  back: (el) => back(el.dataset.to),
  close: () => closeModal()
};
let modalActs = {};
let busy = false;
document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const name = el.dataset.act;
  const fn = (el.closest('.overlay') && modalActs[name]) || current?.view.on?.[name] || globalActs[name];
  if (!fn || busy) return;
  busy = true;
  sfx('playButtonTap');
  try { await fn(el, ev); }
  catch (err) {
    if (err.offline) go(location.hash.startsWith('#c.') ? 'c.offline' : 'offline');
    else if (err.status === 401) { S.pin = null; toast('Please enter your PIN again.'); go('p.pin'); }
    else toast(err.message);
  } finally { busy = false; }
});
document.addEventListener('submit', ev => ev.preventDefault());

function modal(html, acts = {}) {
  closeModal();
  modalActs = acts;
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  root().appendChild(o);
  return o;
}
function closeModal() { root()?.querySelectorAll('.overlay').forEach(o => o.remove()); modalActs = {}; }
function toast(msg) {
  root().querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  root().appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ---------- data helpers ----------
const kid = (id) => S.data?.kids.find(k => k.id === (id === undefined ? S.kidId : +id));
function setKid(id) { S.kidId = id ? +id : null; store.set('cando_kid', id ? String(id) : null); }
const mission = id => S.data.missions.find(m => m.id === +id);
const room = id => S.data.rooms.find(r => r.id === id);
const OPEN = ['assigned', 'in_progress', 'needs_fixing'];
const dueMissions = (kidId) => S.data.missions.filter(m => m.kid_id === kidId && OPEN.includes(m.status) && !m.is_paused && (!m.scheduled_date || m.scheduled_date <= S.data.today)).sort((a, b) => a.id - b.id);
// Low Battery Mode shows only two quests: any already started, topped up to two (same rule as the server).
function activeSteps(m) {
  if (!m.is_low_battery || !m.steps.some(s => s.quest_num != null)) return m.steps;
  const nums = [...new Set(m.steps.map(s => s.quest_num))];
  const started = nums.filter(n => m.steps.some(s => s.quest_num === n && (s.is_completed || s.is_skipped)));
  const keep = new Set([...started, ...nums.filter(n => !started.includes(n))].slice(0, Math.max(2, started.length)));
  return m.steps.filter(s => keep.has(s.quest_num));
}
function quests(m) {
  const map = new Map();
  for (const s of activeSteps(m)) {
    const n = s.quest_num ?? s.step_num;
    if (!map.has(n)) map.set(n, { num: n, title: s.quest_title || s.text, steps: [] });
    map.get(n).steps.push(s);
  }
  return [...map.values()].map(q => ({ ...q, skipped: q.steps.some(s => s.is_skipped), done: q.steps.every(s => s.is_completed) }));
}
const nextStep = m => activeSteps(m).find(s => !s.is_completed && !s.is_skipped);
const parseDate = v => new Date(String(v).replace(' ', 'T') + (String(v).includes('Z') || !String(v).includes(' ') ? '' : 'Z'));
function ago(v) {
  const min = Math.max(0, Math.round((Date.now() - parseDate(v)) / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (min < 1440) return `${Math.round(min / 60)} h ago`;
  return min < 2880 ? 'Yesterday' : parseDate(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------- components ----------
const PATHS = {
  back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>', left: '<path d="M20 12H4m7-7l-7 7 7 7"/>', right: '<path d="M4 12h16m-7-7l7 7-7 7"/>',
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-5h-6v5H5a1 1 0 01-1-1z"/>', flag: '<path d="M6 21V4h12l-3 4 3 4H6"/>', inbox: '<path d="M4 13l3-8h10l3 8v6H4zm0 0h5l1 2h4l1-2h5"/>',
  bag: '<path d="M5 9h14l-1 11H6zm4 0V7a3 3 0 016 0v2"/>', gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1m0-12.8l-2.1 2.1m-8.6 8.6l-2.1 2.1"/>',
  bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4zm4 4h4"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', camera: '<path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  mail: '<path d="M4 6h16v12H4zm0 1l8 6 8-6"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', lock: '<path d="M6 11h12v9H6zm2 0V8a4 4 0 018 0v3"/>',
  sound: '<path d="M4 10v4h4l5 4V6L8 10zm12-1a4 4 0 010 6m2-9a8 8 0 010 12"/>', pause: '<path d="M9 6v12M15 6v12"/>', play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>', calendar: '<path d="M5 6h14v14H5zm0 4h14M9 4v4m6-4v4"/>', trash: '<path d="M5 7h14M10 7V5h4v2m-7 0l1 13h8l1-13"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18-3-3-3-15 0-18"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 113.5 2.3c-.8.4-1 .9-1 1.7m0 3v.1"/>',
  logout: '<path d="M10 4H5v16h5m4-12l4 4-4 4m4-4H9"/>', chart: '<path d="M5 20V11m7 9V4m7 16v-7"/>', check: '<path d="M5 12l5 5 9-10"/>', key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9m-3 0v4"/>',
  qr: '<path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h2v2h-2zm4 4h2v2h-2zm0-4h2m-6 6h2"/>'
};
const icon = n => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${PATHS[n] || ''}</svg>`;
const art = p => `assets/ui/${p}.png`;
const popo = (pose, cls = '') => `<img class="popo ${cls}" src="${art('popo/' + pose)}" alt="">`;
const roomImg = (id, cls) => `<img class="${cls}" src="${art('rooms/' + (S.data.rooms.some(r => r.id === id) ? id : 'bedroom'))}" alt="">`;
const AVATARS = { bear: null, bunny: null, fox: ['🦊', '#BDE8CB'], panda: ['🐼', '#FFE08A'] };
function avatar(value, cls = '') {
  if (value in AVATARS) {
    const e = AVATARS[value];
    return e ? `<span class="avatar ${cls}" style="background:${e[1]}">${e[0]}</span>` : `<span class="avatar ${cls}"><img src="${art('avatars/' + value)}" alt=""></span>`;
  }
  // cadets created by the old app stored an image path
  // (the Android app does not bundle those files, so it loads them from the server)
  const src = standalone && !/^(https?:|data:)/.test(value) ? `${base()}/${String(value).replace(/^\//, '')}` : value;
  return `<span class="avatar ${cls}"><img src="${esc(src)}" alt=""></span>`;
}
const btn = (label, act, opts = {}) => `<button type="button" class="btn ${opts.cls || ''}" data-act="${act}" ${opts.attrs || ''} ${opts.disabled ? 'disabled' : ''}>${label}${opts.arrow ? icon('next') : ''}</button>`;
const to = (label, name, opts = {}, q) => btn(label, 'go', { ...opts, attrs: `data-to="${name}" ${q ? `data-q="${esc(new URLSearchParams(q))}"` : ''}` });
const link = (label, act, attrs = '') => `<button type="button" class="link" data-act="${act}" ${attrs}>${label}</button>`;
const top = ({ backTo, logo = true, right = '' } = {}) => `<div class="top">${backTo !== undefined ? `<button type="button" class="icon-btn back" data-act="back" data-to="${backTo}" aria-label="Back">${icon('back')}</button>` : ''}${logo ? `<img class="logo" src="${art('brand/wordmark')}" alt="CanDo!">` : ''}<div class="right">${right}</div></div>`;
const stepper = (n, total) => `<div class="steps"><div class="dots">${Array.from({ length: total }, (_, i) => `<i class="${i + 1 === n ? 'on' : i + 1 < n ? 'past' : ''}"></i>`).join('')}</div>Step ${n} of ${total}</div>`;
function item({ lead = '', title, text = '', end, act, attrs = '' }) {
  const tag = act ? 'button type="button"' : 'div';
  return `<${tag} class="item" ${act ? `data-act="${act}"` : ''} ${attrs}>${lead}<span class="body"><b>${title}</b>${text ? `<small>${text}</small>` : ''}</span>${end ?? (act ? icon('next') : '')}</${act ? 'button' : 'div'}>`;
}
const ico = n => `<span class="tile-ico">${PATHS[n] ? icon(n) : n}</span>`;
const goAttr = (name, q) => `data-to="${name}" ${q ? `data-q="${esc(new URLSearchParams(q))}"` : ''}`;
const toggle = (on, act, label, attrs = '') => `<button type="button" class="switch" role="switch" aria-checked="${!!on}" aria-label="${esc(label)}" data-act="${act}" ${attrs}></button>`;
const field = (ic, name, placeholder, value = '', extra = '') => `<label class="field">${icon(ic)}<input name="${name}" placeholder="${placeholder}" aria-label="${placeholder}" value="${esc(value)}" autocomplete="off" ${extra}></label>`;
const val = name => root().querySelector(`[name="${name}"]`)?.value.trim() || '';
const note = (pose, title, text) => `<div class="card popo-note"><img src="${art('popo/' + pose)}" alt=""><div><h3>${title}</h3><p class="small">${text}</p></div></div>`;
function stateCard({ pose, badge, title, text, actions }) {
  return `<div class="state-card"><div class="art"><img src="${art('popo/' + pose)}" alt=""><span aria-hidden="true">${badge}</span></div><h2>${title}</h2><p class="sub">${text}</p>${actions}</div>`;
}

// ---------- camera ----------
async function startCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  video.srcObject = stream;
  await video.play().catch(() => {});
  return () => stream.getTracks().forEach(t => t.stop());
}
function toJpeg(source, w, h) {
  const k = Math.min(1, 1280 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}

// ---------- reading aloud (Android's web view has no speech engine of its own) ----------
const nativeSpeech = () => window.Capacitor?.Plugins?.TextToSpeech;
const SPEECH_LANG = { en: 'en-US', ms: 'ms-MY', zh: 'zh-CN', ta: 'ta-IN' };
function speak(text) {
  const lang = SPEECH_LANG[S.data?.prefs.general.language] || 'en-US';
  try {
    if (nativeSpeech()) { nativeSpeech().speak({ text, lang, rate: 0.95 }).catch(() => {}); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = 0.95; speechSynthesis.speak(u);
  } catch { /* reading aloud is optional */ }
}
function hush() { try { nativeSpeech() ? nativeSpeech().stop().catch(() => {}) : speechSynthesis.cancel(); } catch { /* ignore */ } }

// ---------- live updates ----------
function listen() {
  if (typeof EventSource === 'undefined' || (standalone && !base())) return;
  const es = new EventSource(base() + '/api/events');
  let timer;
  es.onmessage = (m) => {
    let type; try { type = JSON.parse(m.data).type; } catch { return; }
    if (type === 'connected') return;
    if (type === 'cadet_paired') window.dispatchEvent(new CustomEvent('cadet-paired', { detail: JSON.parse(m.data).payload }));
    clearTimeout(timer);
    timer = setTimeout(refresh, 250);
  };
}
// Cloudflare quick tunnels do not pass server-sent events through, so also check regularly.
let checking = false;
setInterval(async () => {
  if (checking || document.hidden || !S.data) return;
  checking = true;
  try { await refresh(); } finally { checking = false; }
}, 4000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.data) refresh(); });

window.CanDo = {
  S, standalone, base, speak, hush, activeSteps, store, esc, api, load, refresh, screen, go, back, render, modal, closeModal, toast, sfx, voice,
  kid, setKid, mission, room, dueMissions, quests, nextStep, OPEN, ago, parseDate, dayKey,
  icon, art, popo, roomImg, avatar, AVATARS, btn, to, link, top, stepper, item, ico, goAttr, toggle, field, val, note, stateCard, startCamera, toJpeg, listen,
  currentName: () => current?.name
};
window.addEventListener('hashchange', () => render());
// Android's back button: close a pop-up, otherwise go back one screen, and leave the app only from a start screen.
const nativeApp = window.Capacitor?.Plugins?.App;
nativeApp?.addListener('backButton', ({ canGoBack }) => {
  if (root().querySelector('.overlay')) closeModal();
  else if (['splash', 'role', 'c.home', 'p.home', 'offline'].includes(parseHash().name) || !canGoBack) nativeApp.exitApp();
  else history.back();
});
})();
