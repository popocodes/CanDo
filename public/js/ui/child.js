// Cadet (kid) mode: design screens 1.4 and 3.1 - 6.4
(() => {
'use strict';
const C = window.CanDo;
const { S, esc, api, screen, go, modal, closeModal, toast, icon, art, popo, roomImg, avatar, btn, to, link, top, stepper, field, val, stateCard } = C;

const NAV = [['home', 'Home', 'c.home'], ['star', 'Star Shop', 'c.shop'], ['bag', 'Wardrobe', 'c.wardrobe']];
const nav = on => `<nav class="nav kid" aria-label="Cadet">${NAV.map(([ic, label, name]) => `<button type="button" class="${on === name ? 'on' : ''}" data-act="go" data-to="${name}" aria-label="${label}"><span class="dot">${icon(ic)}</span>${on === name ? `<small>${label}</small>` : ''}</button>`).join('')}</nav>`;
const page = ({ body, foot = '', tab = 'c.home', center }) => `<div class="scroll ${center ? 'center' : ''}">${body}</div>${foot ? `<div class="foot">${foot}</div>` : ''}${tab ? nav(tab) : ''}`;
const me = () => C.kid();
const stars = (extra = '') => `<div class="row" style="justify-content:flex-end">${extra}<span class="starpill"><span class="star">★</span> ${me().stars}</span></div>`;
const act = async (url, opts) => { const r = await api(url, opts); await C.load(); return r; };
const bubble = (emoji, pose) => `<div class="stage"><div class="bubble-art" aria-hidden="true">${emoji}</div>${popo(pose, 'sm')}</div>`;
const message = ({ emoji, pose, heading, text, head = '', foot, tab }) => ({
  html: page({ tab, center: true, body: `${head}<div class="grow"></div>${bubble(emoji, pose)}<h1>${heading}</h1><p class="sub">${text}</p><div class="grow"></div>`, foot })
});
const SPOTS = ['left:3%;bottom:8%', 'right:3%;bottom:8%', 'left:5%;top:10%', 'right:5%;top:10%', 'left:19%;bottom:0'];
const lookImg = (look = {}, decor = []) => `<div class="look ${look.backdrop ? `backdrop bd-${look.backdrop}` : ''}"><img src="${art('looks/' + (look.wear || 'plain'))}" alt="Popo">${decor.filter(d => d.is_unlocked && d.is_placed).slice(0, 5).map((d, i) => `<span style="position:absolute;z-index:1;font-size:30px;${SPOTS[i]}" title="${esc(d.item_name)}">${esc(d.icon)}</span>`).join('')}</div>`;
const myMission = id => { const m = C.mission(id); return m && m.kid_id === S.kidId ? m : null; };
const home = () => { go('c.home', null, { replace: true }); return null; };

// A grown-up types the PIN on the child's screen for parent-only actions.
function withPin(heading, fn) {
  modal(`<h2>${heading}</h2><p class="sub">Commander, enter your HQ PIN.</p><label class="field">${icon('lock')}<input name="gpin" type="password" inputmode="numeric" maxlength="4" aria-label="Parent PIN" placeholder="4-digit PIN"></label><p class="error" role="alert"></p>${btn('Confirm', 'ok')}${btn('Cancel', 'close', { cls: 'white' })}`, {
    ok: async () => {
      const pin = val('gpin');
      try { await api('/api/settings/verify-pin', { method: 'POST', body: { pin } }); }
      catch (e) { if (e.status === 401) { document.querySelector('.modal .error').textContent = 'That PIN is not right.'; return; } throw e; }
      S.pin = pin;
      try { await fn(); } finally { S.pin = null; }
    }
  });
}

// ---------- login and pairing 1.4e, 1.3c-e ----------
screen('c.login', () => ({
  html: page({ tab: null, center: true, body: `<div class="grow"></div><h1>Scan to log in</h1><p class="sub">Scan your parent’s QR code to join your family.</p>${popo('pairing-guide')}${btn(`${icon('qr')} Scan parent’s QR code`, 'scan')}${link('Grown-up: use this device without scanning', 'manual')}<div class="grow"></div>`, foot: to('Back to role select', 'role', { cls: 'white' }) }),
  on: {
    scan: () => go('c.scan'),
    manual: () => withPin('Use this device', () => {
      if (!S.data.kids.length) { modal(`<h2>No cadets yet</h2><p class="sub">Add a cadet in Commander mode first.</p>${btn('OK', 'close')}`); return; }
      modal(`<h2>Who is this device for?</h2>${S.data.kids.map(k => `<button type="button" class="item" data-act="pick" data-id="${k.id}">${avatar(k.avatar)}<span class="body"><b>${esc(k.name)}</b></span>${icon('next')}</button>`).join('')}${link('Cancel', 'close')}`, {
        pick: el => { C.setKid(el.dataset.id); C.store.set('cando_role', 'kid'); closeModal(); go('c.tutorial', { n: 1 }); }
      });
    })
  }
}));

screen('c.scan', () => {
  let claiming = false;
  const claim = async token => {
    if (claiming) return;
    claiming = true;
    try {
      const r = await api('/api/pairing/claim', { method: 'POST', body: { token } });
      await C.load(); C.setKid(r.cadet.id); C.store.set('cando_role', 'kid'); C.sfx('playStarEarned');
      go('c.paired', null, { replace: true });
    } catch (e) {
      if (e.offline) go('c.offline'); else go('c.lost', { why: e.message }, { replace: true });
    }
  };
  return {
    html: page({ tab: null, body: `${top({ backTo: 'c.login' })}<h1>Scan on child device</h1><p class="sub">Point the camera at your parent’s phone.</p><div class="camera"><video muted playsinline></video></div><p class="small" id="camnote" style="text-align:center"></p>`,
      foot: btn('Having trouble scanning?', 'type', { cls: 'white' }) }),
    mount(root) {
      let stop, timer, dead = false;
      const video = root.querySelector('video'), canvas = document.createElement('canvas');
      C.startCamera(video).then(s => {
        if (dead) return s();
        stop = s;
        timer = setInterval(() => {
          if (!video.videoWidth || !window.jsQR) return;
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          const g = canvas.getContext('2d', { willReadFrequently: true });
          g.drawImage(video, 0, 0);
          const hit = window.jsQR(g.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
          if (hit?.data) claim(hit.data);
        }, 350);
      }).catch(() => { root.querySelector('#camnote').textContent = 'The camera is not available here. Tap “Having trouble scanning?” to type the code.'; });
      return () => { dead = true; clearInterval(timer); stop?.(); };
    },
    on: {
      type: () => modal(`<h2>Type the code</h2><p class="sub">It is shown under the QR code, like CAN-1A2B3C.</p><label class="field"><input name="code" aria-label="Pairing code" placeholder="CAN-" autocapitalize="characters" maxlength="10"></label>${btn('Join', 'join')}${link('Cancel', 'close')}`, {
        join: async () => { let t = val('code').toUpperCase(); if (t && !t.startsWith('CAN-')) t = 'CAN-' + t; if (t) await claim(t); }
      })
    }
  };
});
screen('c.lost', ({ why }) => ({
  html: page({ tab: null, center: true, body: `<div class="grow"></div><h1>Target lost!</h1><p class="sub">${esc(why || 'Hold steady and try again.')}<br>Ask your Commander for a new code.</p>${popo('need-help', 'lg')}<div class="grow"></div>`, foot: to('Try again', 'c.scan', { arrow: true }) })
}));
screen('c.paired', () => ({
  html: page({ tab: null, center: true, body: `<div class="grow"></div><div style="font-size:64px" aria-hidden="true">✅</div><h1>${esc(me().name)} is paired!</h1><p class="sub">This ship is connected to your family HQ.</p>${popo('verified-celebration', 'lg')}<div class="grow"></div>`, foot: to('Continue', 'c.tutorial', { arrow: true }, { n: 1 }) })
}));

const TUTORIAL = [
  ['', 'welcome-wave', 'Meet Popo!', 'Your mission buddy. Together we turn chores into adventures.'],
  ['🧸', 'demonstrating', 'One step at a time', 'Missions show just one tiny task at a time.'],
  ['🎁', 'star-shop-goal', 'Earn stars, get perks', 'Finish steps to fill your Star Bank, then shop for rewards.'],
  ['📱', 'encouraging', 'Stuck? Tap Backup', 'Popo calls your Commander. You can still get your star.']
];
screen('c.tutorial', ({ n = 1 }) => {
  const i = Math.min(4, Math.max(1, +n)), [emoji, pose, heading, text] = TUTORIAL[i - 1];
  return {
    html: page({ tab: null, center: true, body: `${top({ right: btn('Skip', 'go', { cls: 'white sm', attrs: 'data-to="c.home"' }) })}<div class="grow"></div>${emoji ? bubble(emoji, pose) : popo(pose, 'lg')}<h1>${heading}</h1><p class="sub">${text}</p>${stepper(i, 4)}<div class="grow"></div>`,
      foot: i < 4 ? to('Next', 'c.tutorial', { arrow: true }, { n: i + 1 }) : to('Start', 'c.home', { arrow: true }) })
  };
});

// ---------- hub 3.1, 3.4, 3.6 ----------
screen('c.home', () => {
  const k = me(), due = C.dueMissions(k.id), m = due[0];
  const waiting = S.data.missions.find(x => x.kid_id === k.id && x.status === 'pending_approval');
  const heads = S.data.alerts.find(a => a.kid_id === k.id && a.type === 'headsup' && !a.is_read);
  const unsent = C.store.get('cando_photo_id');
  const q = m ? C.quests(m) : [];
  const nextQ = q.findIndex(x => !x.done && !x.skipped);
  let say, mid, foot;
  if (m?.status === 'needs_fixing') {
    say = 'Your Commander wants one more photo.';
    foot = to('Retake photo', 'c.needsfix', { cls: 'big' }, { id: m.id });
  } else if (m) {
    say = heads ? esc(heads.message) : `Let’s clean our ${esc(m.room_name.toLowerCase())} together!`;
    mid = `<div class="row" style="justify-content:center">${roomImg(m.room_template_id, 'thumb')}<div><h3>${esc(m.title)}</h3><span class="sub">${q.length} tiny steps</span></div></div><div class="trail num">${q.map((x, i) => `<b class="${x.done || i === nextQ ? 'on' : ''}">${x.done ? '✓' : i + 1}</b><i class="${x.done ? 'on' : ''}"></i>`).join('')}<b>★</b></div>`;
    foot = btn(`${icon('play')} ${m.status === 'in_progress' ? 'Keep going' : 'Start mission'}`, 'start', { cls: 'big' });
  } else if (waiting) {
    say = 'Your Star Capsule is on its way!';
    foot = to('Play while you wait', 'c.arcade', { cls: 'big' });
  } else {
    say = heads ? esc(heads.message) : 'No missions right now. Free time!';
    foot = to('Free time', 'c.arcade', { cls: 'big' });
  }
  // Low Battery Mode and the Mission Wheel only make sense while quests are still open.
  const open = m && m.status !== 'needs_fixing';
  const total = open ? new Set(m.steps.map(s => s.quest_num ?? s.step_num)).size : 0;
  const extras = (total > 2 && m.steps[0].quest_num != null ? `<div class="card row" style="padding:10px 14px"><span aria-hidden="true">🔋</span><span class="grow"><b>Low Battery Mode</b><br><span class="small">Tired? Just 2 small quests.</span></span>${C.toggle(m.is_low_battery, 'battery', 'Low Battery Mode')}</div>` : '')
    + (open && q.filter(x => !x.done && !x.skipped).length > 1 ? to('🎡 Decide for me!', 'c.wheel', { cls: 'white sm' }) : '');
  return {
    live: true,
    html: page({ body: `<div class="row"><h1 class="grow">Hi, ${esc(k.name)}!</h1><span class="starpill"><span class="star">★</span> ${k.stars}</span><button type="button" data-act="switch" aria-label="Switch who is using CanDo!">${avatar(k.avatar)}</button></div><div class="speech">${say}</div><div class="portal">${lookImg(k.look, k.decor)}</div>${mid || ''}${extras}${unsent ? to('📷 Send your saved photo', 'c.saved', { cls: 'yellow sm' }) : ''}<div class="grow"></div>`, foot }),
    on: {
      start: async () => {
        if (heads) await api(`/api/alerts/${heads.id}/read`, { method: 'PUT' });
        if (m.status === 'assigned') go('c.checkin', { id: m.id }); else go('c.step', { id: m.id });
      },
      battery: async () => { await act(`/api/v2/missions/${m.id}/low-battery`, { method: 'POST', body: { on: !m.is_low_battery } }); C.render({ refresh: true }); },
      switch: () => modal(`<h2>Leave your hub?</h2>${btn('Back to role select', 'role')}${btn('Stay here', 'close', { cls: 'white' })}`, { role: () => { C.store.set('cando_role', null); closeModal(); go('role'); } })
    },
    mount() {
      // celebrate newly approved stars once
      const key = `cando_seen_${k.id}`;
      const approved = S.data.missions.filter(x => x.kid_id === k.id && x.status === 'completed' && x.completed_at).sort((a, b) => a.completed_at < b.completed_at ? 1 : -1)[0];
      const seen = C.store.get(key);
      const mark = approved ? `${approved.id}` : 'none';
      if (seen === null) C.store.set(key, mark);
      else if (approved && seen !== mark) {
        C.store.set(key, mark); C.sfx('playParentApproved'); C.voice('parent_approved');
        const together = approved.verified_together;
        modal(`${popo('verified-celebration')}<h2>${together ? 'Verified together!' : `Stars approved, ${esc(k.name)}`}</h2><div class="chips"><span class="price" style="font-size:18px">★ +${approved.stars_reward} stars</span></div><p class="sub">Your Commander checked it. Yay!</p>${btn('Back to Hub', 'close')}`);
      }
      const last = +C.store.get(`cando_visit_${k.id}`);
      C.store.set(`cando_visit_${k.id}`, String(Date.now()));
      if (last && Date.now() - last > 3 * 864e5) go('c.welcome', null, { replace: true });
    }
  };
});
screen('c.welcome', () => {
  const m = C.dueMissions(S.kidId)[0];
  return {
    html: page({ center: true, body: `<h1>Welcome back, ${esc(me().name)}!</h1><p class="sub">Popo missed you! All your stars are safe.</p>${popo('welcome-wave', 'lg')}${m ? `<div class="card"><span class="small">Today’s easy mission</span><br><b>${esc(m.room_name)} · ${esc(C.quests(m)[0].title)}</b></div>` : ''}`,
      foot: (m ? to('Start mission', 'c.checkin', { arrow: true }, { id: m.id }) : '') + to('Go to my Hub', 'c.home', { cls: 'white' }) })
  };
});

screen('c.checkin', ({ id }) => {
  const m = myMission(id);
  if (!m || !C.OPEN.includes(m.status) || m.is_paused) return home();
  return {
    html: page({ center: true, body: `${stars()}<div class="grow"></div><div class="stage">${roomImg(m.room_template_id, 'room-art')}${popo('welcome-wave', 'sm')}</div><h1>${esc(m.room_name)} time!</h1><p class="sub">${C.quests(m).length} tiny steps. Popo is with you the whole way!</p><div class="grow"></div>`,
      foot: btn('I’m ready!', 'ready', { arrow: true }) + to('Not yet', 'c.home', { cls: 'outline' }) }),
    on: { ready: () => { C.voice('start_task'); go('c.step', { id: m.id }); } }
  };
});

// ---------- micro steps 4.1 ----------
const speak = text => C.speak(C.translate ? C.translate(text) : text);
const afterStep = m => {
  const left = C.nextStep(m);
  if (left) go('c.step', { id: m.id, s: left.step_num }); else { C.sfx('playSelfAssessment'); go('c.selfcheck', { id: m.id }); }
};
async function askHelp(m, stepNum) {
  const r = await api(`/api/v2/missions/${m.id}/help`, { method: 'POST', body: { step_num: stepNum } });
  C.sfx('playHelpHum'); C.voice('help');
  await C.load();
  go('c.waiting', { id: m.id, s: stepNum, a: r.alertId });
}

screen('c.step', ({ id, s }) => {
  const m = myMission(id);
  if (!m || !C.OPEN.includes(m.status) || m.is_paused) return home();
  const step = m.steps.find(x => x.step_num === +s) || C.nextStep(m);
  if (!step) { go('c.selfcheck', { id: m.id }, { replace: true }); return null; }
  const all = C.quests(m), qi = all.findIndex(q => q.num === (step.quest_num ?? step.step_num)), quest = all[qi];
  const within = quest.steps.findIndex(x => x.step_num === step.step_num);
  const list = C.activeSteps(m);
  const at = list.findIndex(x => x.step_num === step.step_num);
  const pose = /^[a-z-]+$/.test(step.pose || '') ? step.pose : 'demonstrating';
  const says = step.popo_hint || 'You’ve got this! One tiny step.';
  return {
    html: page({ body: `<div class="trail" aria-label="Quest ${qi + 1} of ${all.length}">${all.map((q, i) => `${i ? `<i class="${i <= qi ? 'on' : ''}"></i>` : ''}<b class="${q.done || i === qi ? 'on' : ''} ${i === qi ? 'now' : ''}" aria-hidden="true">★</b>`).join('')}</div>
      <div class="row"><b class="grow sub">Quest ${qi + 1} · Step ${within + 1} of ${quest.steps.length}</b><button type="button" class="icon-btn lift" data-act="read" aria-label="Read this step aloud">${icon('sound')}</button></div>
      <div class="task-card"><small>Quest ${qi + 1} · ${esc(quest.title)}</small><p>${esc(step.text)}</p></div>
      <div class="play-area"><div class="ring"></div><img src="${art('popo/' + pose)}" alt=""></div>
      <div class="says"><img src="${art('faces/happy')}" alt=""><div><small>POPO SAYS</small><b>${esc(says)}</b></div></div>`,
      foot: `<div class="controls"><button type="button" class="round" data-act="prev" aria-label="Previous step" ${at <= 0 ? 'disabled' : ''}>${icon('left')}</button><button type="button" class="round" data-act="pause" aria-label="Pause">${icon('pause')}</button><button type="button" class="round solid" data-act="done" aria-label="Done, next step">${icon('right')}</button></div><div class="pair">${btn(`${icon('camera')} Show me`, 'show', { cls: 'white sm' })}${btn('I need help', 'help', { cls: 'white sm' })}</div>` }),
    mount() {
      if (S.data.prefs.cadet.narration) speak(step.text);
      let left = 0;
      const watch = () => {
        if (document.hidden) left = Date.now();
        else if (left && Date.now() - left > 4000) {
          left = 0;
          api('/api/alerts', { method: 'POST', body: { kid_id: m.kid_id, type: 'distraction', title: 'Mission paused', message: `${me().name} stepped away during ${m.title}.` } }).catch(() => {});
          toast('Welcome back! Let’s keep going.');
        }
      };
      document.addEventListener('visibilitychange', watch);
      return () => { document.removeEventListener('visibilitychange', watch); C.hush(); };
    },
    on: {
      read: () => speak(step.text),
      prev: () => go('c.step', { id: m.id, s: list[at - 1].step_num }, { replace: true }),
      done: async () => {
        if (!step.is_completed) {
          await act(`/api/v2/missions/${m.id}/step`, { method: 'POST', body: { step_num: step.step_num, done: true } });
          C.sfx('playStepComplete');
        }
        const fresh = C.mission(m.id);
        // reviewing an earlier step walks forward one at a time; otherwise jump to the next unfinished one
        const later = C.activeSteps(fresh).find(x => x.step_num > step.step_num && !x.is_skipped && (step.is_completed || !x.is_completed));
        if (later) { C.voice('step_complete'); go('c.step', { id: m.id, s: later.step_num }, { replace: true }); } else afterStep(fresh);
      },
      pause: () => {
        C.sfx('playPause');
        const anyDone = all.some(q => q.done);
        modal(`${popo('pause-break', 'sm')}<h2>Mission paused</h2><p class="sub">Take a break. Your steps are saved.</p>${btn('Resume', 'close')}${anyDone ? btn('Finish early · send photo', 'early', { cls: 'white' }) : ''}${btn('Back to Hub', 'hub', { cls: 'white' })}`, {
          early: () => { closeModal(); go('c.photo', { id: m.id }); },
          hub: () => { C.voice('finish_for_now'); closeModal(); go('c.home'); }
        });
      },
      show: () => go('c.guide', { id: m.id, s: step.step_num }),
      help: () => askHelp(m, step.step_num)
    }
  };
});

screen('c.guide', ({ id, s }) => {
  const m = myMission(id);
  if (!m) return home();
  return {
    html: page({ tab: null, body: `${top({ backTo: 'c.home', logo: false })}<div class="camera" style="flex:1;aspect-ratio:auto"><video muted playsinline></video><img id="drop" src="${art('popo/ar-point')}" alt="" style="position:absolute;width:38%;height:auto;object-fit:contain;left:31%;top:40%"></div><p class="sub" id="hint" style="text-align:center">Tap to drop Popo where it goes</p>`,
      foot: to('Close camera', 'c.step', { cls: 'white' }, { id: m.id, s }) }),
    mount(root) {
      let stop, dead = false;
      const box = root.querySelector('.camera');
      C.sfx('playARActivated');
      C.startCamera(box.querySelector('video')).then(x => { if (dead) x(); else stop = x; }).catch(() => { root.querySelector('#hint').textContent = 'The camera is off. Your mission is still safe.'; });
      box.addEventListener('pointerdown', e => {
        const r = box.getBoundingClientRect(), img = root.querySelector('#drop');
        img.style.left = `${(e.clientX - r.left) / r.width * 100 - 19}%`;
        img.style.top = `${(e.clientY - r.top) / r.height * 100 - 14}%`;
      });
      return () => { dead = true; stop?.(); };
    }
  };
});

// ---------- help, skip, win back 4.2, 4.1g-i ----------
screen('c.waiting', ({ id, s, a }) => {
  const m = myMission(id);
  if (!m || !C.OPEN.includes(m.status)) return home();
  const alert = S.data.alerts.find(x => x.id === +a);
  if (!alert || alert.is_read) { C.sfx('playParentResponse'); setTimeout(() => toast('Your Commander is on it! Keep going.'), 0); go('c.step', { id: m.id, s }, { replace: true }); return null; }
  const quest = C.quests(m).find(q => q.steps.some(x => x.step_num === +s)) || C.quests(m)[0];
  return {
    live: true,
    ...message({ emoji: '📱', pose: 'sleeping', heading: 'Waiting for Commander', text: 'Popo told your Commander. Please wait.<br>Your Commander can help from their phone.',
      foot: btn('Skip for now', 'skip') + to('Back to my step', 'c.step', { cls: 'white sm' }, { id: m.id, s }) }),
    on: { skip: async () => { await act(`/api/v2/missions/${m.id}/quest`, { method: 'POST', body: { quest_num: quest.num, skipped: true } }); C.sfx('playSkip'); go('c.skipped', { id: m.id, q: quest.num }, { replace: true }); } }
  };
});
const halfPill = () => stars('<span class="chip">★ ½ star waiting</span>');
screen('c.skipped', ({ id, q }) => {
  const m = myMission(id);
  if (!m) return home();
  return { ...message({ head: halfPill(), emoji: '🚀', pose: 'encouraging', heading: 'Skipped for now', text: 'No stress! Half a star is waiting for you. Do this step with a grown-up to get it back.',
    foot: btn('Continue', 'on', { arrow: true }) + to('Do it with a grown-up', 'c.grownup', { cls: 'outline', arrow: true }, { id, q }) }),
  on: { on: () => afterStep(C.mission(m.id)) } };
});
screen('c.grownup', ({ id, q }) => {
  if (!myMission(id)) return home();
  return { ...message({ head: halfPill(), emoji: '🤝', pose: 'pairing-guide', heading: 'Get a grown-up buddy', text: 'Ask a grown-up to help. Do the step together, then tap below.',
    foot: btn('Yes, we did it together', 'yes', { arrow: true }) + to('Not yet', 'c.skipped', { cls: 'outline', arrow: true }, { id, q }) }),
  on: { yes: () => withPin('Grown-up check', async () => { await act(`/api/v2/missions/${id}/quest`, { method: 'POST', body: { quest_num: +q, skipped: false } }); closeModal(); C.sfx('playStarEarned'); go('c.wonback', { id }, { replace: true }); }) } };
});
screen('c.wonback', ({ id }) => {
  const m = myMission(id);
  if (!m) return home();
  return { ...message({ head: stars(), emoji: '🌟', pose: 'verified-celebration', heading: 'You won it back!', text: 'Great teamwork! Your half star is back with your stars.', foot: btn('Continue', 'on', { arrow: true }) }), on: { on: () => afterStep(C.mission(m.id)) } };
});

// ---------- self check 4.2a-c ----------
screen('c.selfcheck', ({ id }) => {
  const m = myMission(id);
  if (!m || !C.OPEN.includes(m.status)) return home();
  return { ...message({ emoji: '🛏️ 🔍', pose: 'self-check', heading: 'Is the room clean?', text: 'Tell me how it looks. Any answer is okay.',
    foot: btn('Yes', 'yes') + btn('No', 'no', { cls: 'white' }) + btn('I need help', 'help', { cls: 'white' }) }),
  on: {
    yes: () => { C.voice('complete_all'); go('c.photo', { id }); },
    no: () => { C.voice('room_check_no'); go(m.extra_round_used ? 'c.great' : 'c.onemore', { id }); },
    help: () => askHelp(m, m.steps[m.steps.length - 1].step_num)
  } };
});
screen('c.onemore', ({ id }) => {
  const m = myMission(id);
  if (!m) return home();
  return { ...message({ emoji: '🧹', pose: 'encouraging', heading: 'That’s okay!', text: 'Let’s do one more small round.<br>You can choose this once.',
    foot: btn('Let’s try again', 'again') + to('Back to my steps', 'c.step', { cls: 'white' }, { id, s: m.steps[m.steps.length - 1].step_num }) }),
  on: { again: async () => { await act(`/api/v2/missions/${id}/extra-round`, { method: 'POST' }); go('c.step', { id, s: m.steps[0].step_num }); } } };
});
screen('c.great', ({ id }) => {
  if (!myMission(id)) return home();
  return message({ emoji: '📸 ✅', pose: 'verified-celebration', heading: 'It looks great for today!', text: 'Let’s take our photo!<br>Your one extra round is used up for today.', foot: to('Take my photo', 'c.photo', {}, { id }) });
});

// ---------- photo proof 4.3 ----------
screen('c.photo', ({ id }) => {
  const m = myMission(id);
  if (!m || !C.OPEN.includes(m.status)) return home();
  if (!C.store.get('cando_cam_ok')) {
    return {
      html: page({ body: `<div class="grow"></div>${stateCard({ pose: 'photo-proof', badge: '📷', title: 'Let Popo use the camera', text: 'Popo needs your camera to take your proof photo.', actions: btn('Allow camera', 'allow') + to('Not now', 'c.home', { cls: 'outline' }) })}<div class="grow"></div>` }),
      on: { allow: () => { C.store.set('cando_cam_ok', '1'); C.render(); } }
    };
  }
  const keep = data => { S.tmp.photo = { id: m.id, data }; C.store.set('cando_photo', data); C.store.set('cando_photo_id', String(m.id)); go('c.saved', null, { replace: true }); };
  return {
    html: page({ tab: null, body: `${top({ backTo: 'c.home', logo: false })}<div class="center"><h1>Snap your room!</h1><p class="sub">Show the whole room so your Commander can see.</p></div><div id="live"><div class="camera"><video muted playsinline></video></div></div><div class="grow"></div><label class="btn white sm" id="choose">🖼️ Choose a photo<input type="file" accept="image/*" capture="environment" hidden></label>`,
      foot: `<button type="button" class="shutter" data-act="snap" aria-label="Take photo">${icon('camera')}</button>` }),
    mount(root) {
      let stop, dead = false;
      C.startCamera(root.querySelector('video')).then(x => { if (dead) x(); else stop = x; }).catch(() => {
        const live = root.querySelector('#live');
        if (!live) return;
        live.innerHTML = stateCard({ pose: 'need-help', badge: '🚫', title: 'The camera is off', text: 'You can still choose a photo below, or ask your Commander to turn the camera on. Your mission is safe.', actions: to('Back to mission', 'c.home') });
        root.querySelector('[data-act="snap"]').hidden = true;
      });
      root.querySelector('input[type=file]').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image(), url = URL.createObjectURL(file);
        img.onload = () => { keep(C.toJpeg(img, img.naturalWidth, img.naturalHeight)); URL.revokeObjectURL(url); };
        img.onerror = () => toast('That file is not a photo.');
        img.src = url;
      });
      return () => { dead = true; stop?.(); };
    },
    on: {
      snap: () => {
        const v = document.querySelector('#app video');
        if (!v?.videoWidth) { toast('The camera is not ready yet.'); return; }
        C.sfx('playShutter'); keep(C.toJpeg(v, v.videoWidth, v.videoHeight));
      }
    }
  };
});

const forgetPhoto = () => { S.tmp.photo = null; C.store.set('cando_photo', null); C.store.set('cando_photo_id', null); };
screen('c.saved', () => {
  const photo = S.tmp.photo || (C.store.get('cando_photo') ? { id: +C.store.get('cando_photo_id'), data: C.store.get('cando_photo') } : null);
  const m = photo && myMission(photo.id);
  if (!m) return home();
  let sentId = null;
  return {
    html: page({ body: `<div class="center"><h1>Great photo!</h1><p class="sub">Your photo is safe. It is on its way to your Commander.</p></div><img class="room-art" src="${photo.data}" alt="Your proof photo"><div class="card" id="status" role="status"><b>⏳ Sending to your Commander</b><p class="small">Please keep this screen open.</p></div>`,
      foot: btn('Pack my stars', 'pack', { arrow: true, disabled: true }) }),
    mount(root) {
      const status = root.querySelector('#status');
      if (!C.OPEN.includes(m.status)) { forgetPhoto(); go('c.home', null, { replace: true }); return; }
      api(`/api/v2/missions/${m.id}/submit`, { method: 'POST', body: { photo: photo.data } }).then(async () => {
        forgetPhoto(); sentId = m.id;
        await C.load().catch(() => {});
        status.innerHTML = '<b>✅ Sent to your Commander</b><p class="small">You can keep playing.</p>';
        root.querySelector('[data-act="pack"]').disabled = false;
        C.voice('photo_sent');
      }).catch(() => {
        modal(`${popo('try-again', 'sm')}<h2>Photo did not send</h2><p class="sub">No worries! Your photo is saved. Try again when you are ready.</p>${btn('Try again', 'retry')}${link('Back to Hub', 'hub')}`, { retry: () => { closeModal(); C.render(); }, hub: () => go('c.home') });
      });
    },
    on: { pack: () => { C.sfx('playCapsuleLaunch'); go('c.capsule', { id: sentId }, { replace: true }); } }
  };
});
screen('c.capsule', ({ id }) => {
  const m = myMission(id);
  if (!m) return home();
  const pill = stars(`<span class="chip">★ +${m.stars} pending</span>`);
  if (m.is_early) return message({ head: pill, emoji: '🚀 ✅', pose: 'photo-proof', heading: 'Your picture was sent!', text: `Your Commander will look. Your ${m.stars} stars are safe in the capsule.`, foot: to('Return to Hub', 'c.home', { arrow: true }) });
  return {
    html: page({ center: true, body: `${pill}<div class="grow"></div>${bubble('🫙⭐', 'star-capsule')}<h1>Star Capsule sent!</h1><p class="sub">Your ${m.stars} stars are safe. They open when your Commander checks.</p><div class="card progress3" style="align-self:stretch"><div class="done"><i>✓</i>Photo sent</div><div class="now"><i>2</i>Commander checks</div><div><i>3</i>Stars released</div></div><div class="grow"></div>`,
      foot: to('Play while you wait', 'c.arcade', { arrow: true }) + to('Return to Hub', 'c.home', { cls: 'outline', arrow: true }) })
  };
});
screen('c.needsfix', ({ id }) => {
  const m = myMission(id);
  if (!m || m.status !== 'needs_fixing') return home();
  C.sfx('playTransition');
  return { html: page({ body: `<div class="grow"></div>${stateCard({ pose: 'try-again', badge: '🔁', title: 'One more photo, please', text: 'Your Commander wants one more photo. Show the whole room.<br><b>1 try left</b>', actions: to('Retake photo', 'c.photo', {}, { id }) + '<p class="small">Just one try, then you check it together.</p>' })}<div class="grow"></div>` }) };
});

// ---------- star shop and inventory 5.3, 5.4 ----------
screen('c.shop', () => {
  const k = me(), perks = S.data.perks;
  const goal = perks.find(p => p.star_cost > k.stars);
  const approved = S.data.requests.filter(r => r.kid_id === k.id && r.status === 'approved').length;
  return {
    live: true,
    html: page({ tab: 'c.shop', body: `<div class="row"><h1 class="grow">Star Shop</h1><span class="starpill"><span class="star">★</span> ${k.stars}</span></div><p class="sub">Tap a perk you can afford.</p><div class="grid2">${perks.map(p => `<button type="button" class="perk ${p.star_cost > k.stars ? 'locked' : ''}" data-act="perk" data-id="${p.id}">${C.perkIcon(p)}${esc(p.title)}<span><span class="star">★</span> ${p.star_cost}</span>${p.star_cost > k.stars ? `<span class="small">Need ${p.star_cost - k.stars} more</span>` : ''}</button>`).join('') || '<p class="sub">Your Commander has not added perks yet.</p>'}</div>${goal ? `<div class="card"><b>${goal.star_cost - k.stars} more stars to ${esc(goal.title)}!</b><div class="bar" style="margin:8px 0 4px"><i style="width:${Math.max(0, k.stars / goal.star_cost * 100)}%"></i></div><span class="small">${k.stars} / ${goal.star_cost} stars</span></div>` : ''}`,
      foot: to(`🎒 My bag${approved ? ` (${approved})` : ''}`, 'c.inventory', { cls: 'white sm' }) }),
    on: {
      perk: el => {
        const p = perks.find(x => x.id === +el.dataset.id);
        if (p.star_cost > k.stars) return modal(`${popo('star-shop-goal', 'sm')}<h2>Almost there!</h2><p class="sub">${esc(p.title)} needs ${p.star_cost - k.stars} more stars. Finish a few more steps and it is yours!</p>${btn('Keep earning stars', 'close')}`);
        modal(`<div class="center">${C.perkIcon(p)}</div><h2>${esc(p.title)}</h2><div class="chips"><span class="price">★ ${p.star_cost}</span></div><p class="small">Your stars stay safe while your Commander decides.</p>${btn('Ask for this perk', 'ask')}${btn('Cancel', 'close', { cls: 'white' })}`, {
          ask: async () => {
            try { await act(`/api/v2/perks/${p.id}/request`, { method: 'POST', body: { kid_id: k.id } }); }
            catch (e) {
              if (e.status === 429) return modal(`${popo('day-off', 'sm')}<h2>Great pick!</h2><p class="sub">You already got ${esc(p.title)} today. You can get more tomorrow.</p>${btn('Got it', 'close')}`);
              throw e;
            }
            C.sfx('playPerkBuy'); closeModal(); go('c.requested', { cost: p.star_cost });
          }
        });
      }
    }
  };
});
screen('c.requested', ({ cost }) => ({
  html: page({ tab: 'c.shop', center: true, body: `<h1>Request sent!</h1><p class="sub">Stars on hold: ${esc(cost)}. They are locked safe while your Commander decides.</p><div class="grow"></div>${popo('star-shop-goal', 'lg')}<span class="chip">★ ${esc(cost)} on hold</span><div class="grow"></div><div class="card progress3" style="align-self:stretch"><div class="done"><i>✓</i>Request sent</div><div class="now"><i>2</i>Commander checks</div><div><i>3</i>Perk in bag</div></div>`,
    foot: to('Back to Star Shop', 'c.shop') })
}));
screen('c.inventory', () => {
  const list = S.data.requests.filter(r => r.kid_id === S.kidId && r.status === 'approved');
  return {
    live: true,
    html: page({ tab: 'c.shop', body: list.length
      ? `${top({ backTo: 'c.shop', logo: false })}<h1>Inventory</h1><p class="sub">Rewards your Commander approved.</p>${list.map(r => `<div class="card row">${C.perkIcon(r)}<span class="grow"><b>${esc(r.title)}</b><br><span class="small">Approved</span></span><button type="button" class="btn green sm" style="width:auto" data-act="go" ${C.goAttr('c.activate', { id: r.id })}>Activate</button></div>`).join('')}${C.note('commanders-key', 'Show your Commander!', 'Tap Activate and let them confirm it with you.')}`
      : `${top({ backTo: 'c.shop', logo: false })}<div class="grow"></div>${stateCard({ pose: 'explaining', badge: '🎒', title: 'Your bag is empty', text: 'Spend your stars in the shop to get your first perk.', actions: to('Go to Star Shop', 'c.shop') })}<div class="grow"></div>` })
  };
});
screen('c.activate', ({ id }) => {
  const r = S.data.requests.find(x => x.id === +id && x.kid_id === S.kidId && x.status === 'approved');
  if (!r) { go('c.inventory', null, { replace: true }); return null; }
  return {
    html: page({ tab: 'c.shop', center: true, body: `<div class="grow"></div><div class="bubble-art">${C.perkIcon(r)}</div><h1>Reward active!</h1><h2>Show Commander!</h2>${popo('commanders-key', 'lg')}<div class="grow"></div><div class="card"><b>🔑 Commander’s Key</b><p class="small">Only a Commander can tap this to use up the perk.</p></div>`,
      foot: btn('Commander Acknowledged', 'key', { arrow: true }) + to('Not now', 'c.inventory', { cls: 'white sm' }) }),
    on: { key: () => withPin('Commander’s Key', async () => { await act(`/api/v2/requests/${r.id}/use`, { method: 'POST' }); C.sfx('playStarEarned'); closeModal(); go('c.inventory', null, { replace: true }); toast('Enjoy your reward!'); }) }
  };
});

// ---------- arcade 5.5 ----------
screen('c.arcade', () => {
  const open = !C.dueMissions(S.kidId).length;
  return {
    live: true,
    html: page({ tab: 'c.shop', center: true, body: `${stars()}<h1>${open ? 'Free Time!' : 'Almost free time'}</h1><p class="sub">${open ? 'All chores done. Popo’s Arcade is open.' : 'Finish your mission to open Popo’s Arcade.'}</p>${bubble('🎮', 'arcade-play')}${open ? `<div class="card" style="align-self:stretch"><h3>🫧 Bubble Pop</h3><p class="small" style="margin-bottom:10px">No timer. Pop and count!</p>${to('Play Bubble Pop', 'c.bubbles')}</div>` : ''}`,
      foot: to('Back to Hub', 'c.home', { cls: 'white' }) })
  };
});
screen('c.bubbles', () => {
  if (C.dueMissions(S.kidId).length) { go('c.arcade', null, { replace: true }); return null; }
  const key = `cando_pop_${S.kidId}_${S.data.today}`;
  let popped = 0, best = +C.store.get(key) || 0;
  return {
    html: page({ tab: null, body: `<div class="row"><button type="button" class="icon-btn lift" data-act="go" data-to="c.home" aria-label="Home">${icon('home')}</button><span class="grow"></span><button type="button" class="icon-btn lift" data-act="go" data-to="c.arcade" aria-label="Close game">${icon('x')}</button></div><div class="card row center" style="justify-content:space-around"><div>Popped<h2 id="popped">0</h2></div><div>⭐ Best today<h2 id="best">${best}</h2></div></div><div class="arena"></div><div class="center"><span class="chip">Let’s pop bubbles together!</span></div>` }),
    mount(root) {
      const arena = root.querySelector('.arena');
      const add = () => {
        const b = document.createElement('button'), size = 48 + Math.random() * 38;
        b.type = 'button'; b.className = 'pop'; b.setAttribute('aria-label', 'Bubble');
        b.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 80}%;top:${4 + Math.random() * 76}%;--h:${[340, 255, 200, 135, 40, 15][Math.floor(Math.random() * 6)]};--t:${2 + Math.random() * 2}s`;
        b.addEventListener('pointerdown', () => {
          b.remove(); popped++;
          if (popped > best) { best = popped; C.store.set(key, String(best)); }
          root.querySelector('#popped').textContent = popped; root.querySelector('#best').textContent = best;
          C.sfx('playAvatarTock'); setTimeout(add, 500);
        });
        arena.appendChild(b);
      };
      for (let i = 0; i < 8; i++) add();
    }
  };
});

// ---------- wardrobe 6.0 - 6.4 ----------
const itemArt = i => i.tab === 'backdrops' ? `<span class="swatch bd-${i.key}" aria-hidden="true">🪐</span>` : `<img src="${art('items/' + i.key)}" alt="">`;
const lookWith = (look, i) => ({ ...look, [i.tab === 'backdrops' ? 'backdrop' : 'wear']: i.key });
screen('c.wardrobe', ({ tab = 'hats' }) => {
  const k = me();
  if (S.tmp.lookKid !== k.id || !S.tmp.look) { S.tmp.look = { ...k.look }; S.tmp.lookKid = k.id; }
  const draft = S.tmp.look;
  const changed = (draft.wear || '') !== (k.look.wear || '') || (draft.backdrop || '') !== (k.look.backdrop || '');
  const base = tab === 'base';
  const decorTiles = k.decor.map(d => `<button type="button" class="ward ${d.is_unlocked ? 'wearing' : ''}" data-act="decor" data-k="${esc(d.item_key)}">${d.is_unlocked ? '' : '<span class="lock">🔒</span>'}<span class="swatch" style="font-size:34px" aria-hidden="true">${esc(d.icon)}</span>${esc(d.item_name)}<span class="price">${d.is_unlocked ? 'In your base' : `★ ${d.star_cost}`}</span></button>`).join('');
  return {
    html: page({ tab: 'c.wardrobe', body: `<div class="row"><h1 class="grow">Popo’s Wardrobe</h1><span class="starpill"><span class="star">★</span> ${k.stars}</span></div>${lookImg(draft, k.decor)}<div class="seg">${[['hats', '🧢 Hats'], ['gear', '👓 Gear'], ['backdrops', '🪐 Backdrops'], ['base', '🏠 Base']].map(([t, l]) => `<button type="button" class="${t === tab ? 'on' : ''}" data-act="tab" data-t="${t}">${l}</button>`).join('')}</div><div class="grid2">${base ? decorTiles : S.data.wardrobe.filter(i => i.tab === tab).map(i => {
      const owned = k.owned.includes(i.key), wearing = draft.wear === i.key || draft.backdrop === i.key;
      return `<button type="button" class="ward ${wearing ? 'wearing' : ''}" data-act="pick" data-k="${i.key}" aria-label="${esc(i.name)}, ${wearing ? 'wearing' : owned ? 'owned' : `${i.cost} stars`}">${owned ? '' : '<span class="lock">🔒</span>'}${itemArt(i)}${esc(i.name)}<span class="price">${wearing ? 'Wearing' : owned ? 'Yours' : `★ ${i.cost}`}</span></button>`;
    }).join('')}</div>`,
      foot: base ? '' : btn('Save look', 'save', { arrow: true, disabled: !changed }) }),
    on: {
      tab: el => go('c.wardrobe', { tab: el.dataset.t }, { replace: true }),
      decor: el => {
        const d = k.decor.find(x => x.item_key === el.dataset.k);
        if (d.is_unlocked) return toast('Already in your Space Base!');
        if (k.stars < d.star_cost) return modal(`${popo('star-shop-goal', 'sm')}<h2>Almost there!</h2><p class="sub">${esc(d.item_name)} needs ${d.star_cost - k.stars} more stars.</p>${btn('Keep earning stars', 'close')}`);
        modal(`<div style="font-size:56px">${esc(d.icon)}</div><h2>${esc(d.item_name)}</h2><div class="chips"><span class="price">★ ${d.star_cost}</span></div><p class="small">You have ${k.stars} stars. You will have ${k.stars - d.star_cost} left.</p>${btn('Yes, get it!', 'yes')}${btn('Not now', 'close', { cls: 'white' })}`, {
          yes: async () => { await act(`/api/decorations/${k.id}/buy`, { method: 'POST', body: { item_key: d.item_key } }); C.sfx('playStarEarned'); closeModal(); C.render(); }
        });
      },
      pick: el => {
        const i = S.data.wardrobe.find(x => x.key === el.dataset.k);
        if (!k.owned.includes(i.key)) return go('c.tryon', { item: i.key });
        const slot = i.tab === 'backdrops' ? 'backdrop' : 'wear';
        draft[slot] = draft[slot] === i.key ? undefined : i.key;
        C.render({ refresh: true });
      },
      save: async () => { await act(`/api/v2/wardrobe/${k.id}/look`, { method: 'PUT', body: draft }); S.tmp.look = null; go('c.looksaved'); }
    }
  };
});
screen('c.tryon', ({ item }) => {
  const k = me(), i = S.data.wardrobe.find(x => x.key === item);
  if (!i || k.owned.includes(i.key)) { go('c.wardrobe', null, { replace: true }); return null; }
  return {
    html: page({ tab: 'c.wardrobe', body: `${top({ backTo: 'c.wardrobe', logo: false })}<div class="row"><h1 class="grow">Check it out!</h1><span class="starpill"><span class="star">★</span> ${k.stars}</span></div>${lookImg(lookWith(k.look, i))}<div class="card"><div class="row">${itemArt(i)}<div><h2>${esc(i.name)}</h2><span class="price">★ ${i.cost}</span></div></div><p class="small" style="margin-top:10px">Your stars stay safe until you tap Get it.</p></div>`,
      foot: btn(`Get it · ${i.cost} stars`, 'get', { arrow: true }) + to('Keep looking', 'c.wardrobe', { cls: 'outline', arrow: true }, { tab: i.tab }) }),
    on: {
      get: () => {
        if (k.stars < i.cost) return modal(`${popo('star-shop-goal', 'sm')}<h2>Almost there!</h2><p class="sub">${esc(i.name)} needs ${i.cost - k.stars} more stars.</p>${btn('Keep earning stars', 'close')}`);
        modal(`<div class="center">${itemArt(i)}</div><h2>${esc(i.name)}</h2><div class="chips"><span class="price">★ ${i.cost}</span></div><p class="small">You have ${k.stars} stars. You will have ${k.stars - i.cost} left.</p>${btn('Yes, get it!', 'yes')}${btn('Not now', 'close', { cls: 'white' })}`, {
          yes: async () => { await act(`/api/v2/wardrobe/${k.id}/buy`, { method: 'POST', body: { item: i.key } }); C.sfx('playStarEarned'); closeModal(); go('c.unlocked', { item: i.key }, { replace: true }); }
        });
      }
    }
  };
});
screen('c.unlocked', ({ item }) => {
  const k = me(), i = S.data.wardrobe.find(x => x.key === item);
  if (!i) return home();
  const kind = i.tab === 'backdrops' ? 'backdrop' : 'gear';
  return {
    html: page({ tab: 'c.wardrobe', body: `<div class="row"><h1 class="grow">Unlocked!</h1><span class="starpill"><span class="star">★</span> ${k.stars}</span></div>${lookImg(lookWith(k.look, i))}<div class="center"><h2>New ${kind} unlocked!</h2><p class="sub">${esc(i.name)} is yours. Popo loves it!</p></div><div class="card row">${itemArt(i)}<span><b>${esc(i.name)}</b><br><span class="small">Added to your ${i.tab === 'hats' ? 'Hats' : i.tab === 'gear' ? 'Gear' : 'Backdrops'}</span></span></div>`,
      foot: btn('Wear it now', 'wear', { arrow: true }) + to('Back to Wardrobe', 'c.wardrobe', { cls: 'outline', arrow: true }, { tab: i.tab }) }),
    on: { wear: async () => { await act(`/api/v2/wardrobe/${k.id}/look`, { method: 'PUT', body: lookWith(k.look, i) }); S.tmp.look = null; go('c.looksaved'); } }
  };
});
screen('c.looksaved', () => ({
  html: page({ tab: 'c.wardrobe', center: true, body: `<h1>Look saved!</h1><div class="grow"></div>${lookImg(me().look)}<h2>Looking great!</h2><p class="sub">Popo will wear this look on your Hub.</p><div class="grow"></div>`,
    foot: to('Go to Hub', 'c.home', { arrow: true }) + to('Keep dressing', 'c.wardrobe', { cls: 'outline', arrow: true }) })
}));

screen('c.offline', () => ({
  html: page({ tab: null, body: `<div class="grow"></div>${stateCard({ pose: 'calm', badge: '📡', title: 'No internet. That is okay!', text: 'Popo cannot reach home right now. A photo you took stays saved on this phone.', actions: btn('Try again', 'retry') })}<div class="grow"></div>` }),
  on: { retry: async () => { await C.load(); go('c.home', null, { replace: true }); } }
}));

})();
