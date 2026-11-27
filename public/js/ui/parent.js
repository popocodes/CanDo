// Splash, role select and everything in Commander (parent) mode: design screens 1.0 - 2.12
(() => {
'use strict';
const C = window.CanDo;
const { S, esc, api, screen, go, modal, closeModal, toast, icon, art, popo, roomImg, avatar, btn, to, link, top, stepper, item, ico, goAttr, toggle, field, val, note, stateCard } = C;

const NAV = [['home', 'Home', 'p.home'], ['flag', 'Routines', 'p.routines'], ['inbox', 'Inbox', 'p.inbox'], ['bag', 'Shop', 'p.shop'], ['gear', 'Settings', 'p.settings']];
const nav = on => `<nav class="nav" aria-label="Parent">${NAV.map(([ic, label, name]) => `<button type="button" class="${on === name ? 'on' : ''}" data-act="go" data-to="${name}" aria-label="${label}">${icon(ic)}<span>${label}</span></button>`).join('')}</nav>`;
const page = ({ head = '', body, foot = '', tab }) => `<div class="scroll">${head}${body}</div>${foot ? `<div class="foot">${foot}</div>` : ''}${tab ? nav(tab) : ''}`;
const title = (h, sub) => `<div><h1>${h}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
const act = async (url, opts) => { await api(url, opts); await C.load(); };
const kidsList = () => S.data.kids;
const proofs = () => S.data.missions.filter(m => m.status === 'pending_approval' || m.status === 'needs_fixing');
const requests = () => S.data.requests.filter(r => r.status === 'pending');
const sosAlerts = () => S.data.alerts.filter(a => a.type === 'help' && !a.is_read);
const kidName = id => esc(C.kid(id)?.name || 'Cadet');

// ---------- splash & role ----------
screen('splash', () => ({
  html: `<div class="scroll center"><div class="grow"></div><img src="${art('brand/full')}" alt="CanDo! Complete tasks. Earn stars. Achieve more." style="width:230px"><div class="grow"></div><span class="starpill small">● ● ● Launching…</span></div>`,
  mount() {
    const started = Date.now();
    let gone = false;
    C.load().then(() => setTimeout(() => {
      if (gone) return;
      C.listen();
      if (S.deepLink) { const link = S.deepLink; S.deepLink = null; history.replaceState(null, '', link); C.render(); return; }
      go(C.kid() && C.store.get('cando_role') === 'kid' ? 'c.home' : 'role', null, { replace: true });
    }, Math.max(0, 900 - (Date.now() - started)))).catch(() => go('offline', null, { replace: true }));
    return () => { gone = true; };
  }
}));

screen('role', () => {
  S.pin = null; // leaving parent mode always locks it again
  return {
    html: page({ body: `${top()}<div class="center"><h1>Who’s using CanDo!?</h1><p class="sub">Pick your role. You can switch later.</p></div>
      <div class="pair">
        <button type="button" class="role" data-act="commander"><img src="${art('roles/commander')}" alt=""><b>Commander</b><span class="small">Parent · Mission Control</span></button>
        <button type="button" class="role" data-act="cadet"><img src="${art('roles/cadet')}" alt=""><b>Cadet</b><span class="small">Kid · Spaceship Hub</span></button>
      </div>${popo('welcome-wave', 'lg')}` }),
    on: {
      commander: () => go(S.data.pinSet ? 'p.pin' : 'a.gateway'),
      cadet: () => { C.store.set('cando_role', 'kid'); go(C.kid() ? 'c.home' : 'c.login'); }
    }
  };
});

screen('offline', () => ({
  html: page({ body: `<div class="grow"></div>${stateCard({ pose: 'sleeping', badge: '📡', title: 'You are offline', text: 'CanDo! cannot reach your family server. Check the Wi-Fi and that the server is running.',
    actions: `${C.standalone ? field('globe', 'server', 'Server address, e.g. http://192.168.1.20:3000', C.base()) : ''}${btn('Try again', 'retry')}` })}<div class="grow"></div>` }),
  on: { retry: () => { if (C.standalone) C.store.set('cando_server', val('server').replace(/\/+$/, '') || null); go('splash'); } }
}));

// ---------- PIN ----------
function pinScreen({ stepNo, heading, sub, button, onDone, forgot = true }) {
  let pin = '';
  const el = () => document.querySelector('#app');
  const paint = () => {
    el().querySelectorAll('.pin-dots i').forEach((d, i) => d.classList.toggle('on', i < pin.length));
    el().querySelector('[data-act="submit"]').disabled = pin.length !== 4;
  };
  const press = (d) => { if (pin.length < 4) pin += d; el().querySelector('.error').textContent = ''; paint(); };
  const fail = (msg) => { pin = ''; paint(); el().querySelector('.error').textContent = msg; };
  return {
    html: `<div class="scroll center">${top({ backTo: 'role' })}${stepNo ? stepper(stepNo, 2) : ''}<div class="grow"></div><div><h1>${heading}</h1><p class="sub">${sub}</p></div>
      <div class="pin-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p class="error" role="alert"></p>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-act="digit" data-d="${n}">${n}</button>`).join('')}<span></span><button type="button" data-act="digit" data-d="0">0</button><button type="button" data-act="erase" aria-label="Delete">⌫</button></div>
      ${forgot ? link('Forgot PIN?', 'forgot') : ''}</div><div class="foot">${btn(button, 'submit', { arrow: true, disabled: true })}</div>`,
    on: {
      digit: (b) => press(b.dataset.d),
      erase: () => { pin = pin.slice(0, -1); paint(); },
      submit: async () => { if (pin.length === 4) await onDone(pin, fail); },
      forgot: async () => {
        const a = await api('/api/v2/auth/status');
        if (a.smtp && a.hasAccount) return go('a.pinreset');
        modal(`<h2>Forgot your PIN?</h2><p class="sub">${a.hasAccount ? 'Email is not set up on this server yet.' : 'No parent email is linked.'} Log in with your parent account, or ask whoever looks after the CanDo! server.</p>${a.hasAccount ? btn('Log In', 'login') : ''}${btn('Got it', 'close', { cls: 'white' })}`, { login: () => go('a.login') });
      }
    },
    mount() {
      const key = (e) => {
        if (/^\d$/.test(e.key)) press(e.key);
        else if (e.key === 'Backspace') { pin = pin.slice(0, -1); paint(); }
        else if (e.key === 'Enter' && pin.length === 4) el().querySelector('[data-act="submit"]').click();
      };
      document.addEventListener('keydown', key);
      return () => document.removeEventListener('keydown', key);
    }
  };
}

screen('p.pin', () => {
  if (!S.data.pinSet) { go('a.gateway', null, { replace: true }); return null; }
  return pinScreen({
    heading: 'Enter your HQ PIN', sub: 'Welcome back, Commander.', button: 'Unlock HQ',
    onDone: async (pin, fail) => {
      try { await api('/api/settings/verify-pin', { method: 'POST', body: { pin } }); }
      catch (e) { if (e.status === 401) return fail('That PIN is not right. Try again.'); throw e; }
      S.pin = pin; S.tmp = {}; C.store.set('cando_role', 'parent');
      go('p.home', null, { replace: true });
    }
  });
});
screen('p.pinnew', () => pinScreen({
  stepNo: 1, heading: 'Create HQ PIN', sub: 'A 4-digit PIN keeps settings parent-only.', button: 'Create PIN', forgot: false,
  onDone: async (pin) => { S.tmp.newPin = pin; go('p.pinconfirm'); }
}));
screen('p.pinconfirm', () => {
  if (!S.tmp.newPin) { go('role', null, { replace: true }); return null; }
  return pinScreen({
    stepNo: 2, heading: 'Confirm your HQ PIN', sub: 'Enter the same 4 digits again.', button: 'Confirm PIN', forgot: false,
    onDone: async (pin, fail) => {
      if (pin !== S.tmp.newPin) return fail('The two PINs do not match.');
      if (S.tmp.session) await api('/api/v2/auth/new-pin', { method: 'POST', body: { session: S.tmp.session, pin } });
      else if (S.tmp.currentPin) await api('/api/settings/pin', { method: 'PUT', body: { currentPin: S.tmp.currentPin, newPin: pin } });
      else await api('/api/v2/pin', { method: 'POST', body: { pin } });
      const changing = !!(S.tmp.currentPin || (S.tmp.session && S.data.pinSet));
      S.pin = pin; S.tmp = {};
      await C.load();
      if (changing) { go('p.settings', null, { replace: true }); toast('Your PIN is changed.'); } else go('p.tutorial', { n: 1 }, { replace: true });
    }
  });
});

// ---------- tutorial 1.2a-d ----------
const TUTORIAL = [
  ['📋 🚫⏱️', 'Zero-pressure routines', 'Pick up to 5 tiny chores per room. No timers, no countdowns, no pressure.'],
  ['🛏️ 📷 ✅', 'Photo proof', 'After the last step, your cadet snaps a photo. You check it before stars are released.'],
  ['🎟️ 🗝️', 'The Commander’s Key', 'Rewards are claimed with your tap. Only you can burn the ticket.'],
  ['👤 ▦ 🚀', 'You’re ready, Commander', 'Add your first cadet and link their device in one quick scan.']
];
screen('p.tutorial', ({ n = 1 }) => {
  const i = Math.min(4, Math.max(1, +n));
  const [emoji, h, text] = TUTORIAL[i - 1];
  return {
    html: page({ body: `${top({ right: link('Skip', 'go', 'data-to="p.home"') })}<div class="grow"></div><div class="hero-card" aria-hidden="true">${emoji}</div>${i === 4 ? popo('welcome-wave') : ''}<div class="center"><h1>${h}</h1><p class="sub">${text}</p></div><div class="grow"></div>${stepper(i, 4)}`,
      foot: i < 4 ? to('Next', 'p.tutorial', { arrow: true }, { n: i + 1 }) : to('Add my first cadet', 'p.addcadet', { arrow: true }) })
  };
});

// ---------- cadets 1.3 ----------
const avatarPicker = current => `<div><h3 style="font-size:13px;margin-bottom:8px">Choose an avatar</h3><div class="row" role="radiogroup" aria-label="Avatar">${Object.keys(C.AVATARS).map(a => `<button type="button" role="radio" aria-checked="${a === current}" aria-label="${a}" class="pick ${a === current ? 'on' : ''}" data-act="avatar" data-a="${a}">${avatar(a)}</button>`).join('')}</div></div>`;
function pickAvatar(el) {
  S.tmp.avatar = el.dataset.a;
  el.parentElement.querySelectorAll('.pick').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-checked', b === el); });
}
screen('p.addcadet', () => {
  S.tmp.avatar = 'bear';
  return {
    html: page({ body: `${top({ backTo: 'p.family' })}${stepper(1, 4)}${title('Who is boarding the ship?', 'Add your child so Popo can cheer them on.')}${field('user', 'name', 'Name', '', 'maxlength="30"')}${field('calendar', 'age', 'Age', '', 'inputmode="numeric" maxlength="2"')}${avatarPicker('bear')}${popo('pairing-guide', 'sm')}`,
      foot: btn('Add Cadet', 'add', { arrow: true }) }),
    on: {
      avatar: pickAvatar,
      add: async () => {
        const r = await api('/api/v2/kids', { method: 'POST', body: { name: val('name'), age: val('age'), avatar: S.tmp.avatar } });
        await C.load();
        go('p.pair', { kid: r.id }, { replace: true });
      }
    }
  };
});

screen('p.pair', ({ kid }) => {
  const k = C.kid(kid);
  if (!k) { go('p.family', null, { replace: true }); return null; }
  return {
    html: page({ body: `${top({ backTo: 'p.family' })}${stepper(2, 4)}<div class="grow"></div>${title(`Pair ${esc(k.name)}’s device`, 'Open CanDo! on your child’s device, pick Cadet and scan this code.')}<div class="card center" style="display:flex;flex-direction:column"><img id="qr" alt="Pairing QR code" style="width:230px;min-height:230px"><b id="code" style="color:var(--purple)"></b></div><p class="small" style="text-align:center">Code works once and expires in <span id="left">60</span> seconds.</p><div class="grow"></div>`,
      foot: btn('New code', 'fresh', { cls: 'white' }) + to('Do this later', 'p.home') }),
    on: { fresh: () => C.render() },
    mount(root) {
      let timer, dead = false;
      api('/api/pairing/generate', { method: 'POST', body: { kid_id: k.id } }).then(r => {
        if (dead) return;
        root.querySelector('#qr').src = r.qr_data_url;
        root.querySelector('#code').textContent = `Code · ${r.code}`;
        timer = setInterval(() => {
          const left = Math.max(0, Math.round((r.expires_at - Date.now()) / 1000));
          root.querySelector('#left').textContent = left;
          if (!left) { clearInterval(timer); root.querySelector('#qr').style.opacity = .15; root.querySelector('#code').textContent = 'Expired. Tap “New code”.'; }
        }, 500);
      }).catch(e => toast(e.message));
      // ask the server whether the code was used (works even where live events do not)
      let done = false;
      const finish = () => { if (!done && !dead) { done = true; go('p.paired', { kid: k.id }, { replace: true }); } };
      const poll = setInterval(() => {
        const code = root.querySelector('#code').textContent.replace('Code · ', '');
        if (/^CAN-/.test(code)) api(`/api/pairing/status/${encodeURIComponent(code)}`).then(s => { if (s.status === 'claimed') finish(); }).catch(() => {});
      }, 2000);
      const paired = (e) => { if (e.detail?.kid_id === k.id) finish(); };
      window.addEventListener('cadet-paired', paired);
      return () => { dead = true; clearInterval(timer); clearInterval(poll); window.removeEventListener('cadet-paired', paired); };
    }
  };
});
screen('p.paired', ({ kid }) => ({
  html: page({ body: `${top()}${stepper(4, 4)}<div class="grow"></div><div class="center"><div style="font-size:64px" aria-hidden="true">✅</div><h1>${kidName(kid)} is paired!</h1><p class="sub">This ship is connected to your family HQ.</p></div>${popo('verified-celebration', 'lg')}<div class="grow"></div>`, foot: to('Continue', 'p.home', { arrow: true }) })
}));

const todayMissions = kidId => S.data.missions.filter(m => m.kid_id === kidId && (m.scheduled_date === S.data.today || C.OPEN.includes(m.status)));
screen('p.family', () => ({
  live: true,
  html: page({ tab: 'p.settings', body: `${top({ backTo: 'p.settings' })}${title('Your family', 'Tap a cadet to edit their profile.')}${kidsList().map(k => {
      const t = todayMissions(k.id), done = t.filter(m => !C.OPEN.includes(m.status)).length;
      return `<button type="button" class="card" style="text-align:left" data-act="go" ${goAttr('p.editcadet', { kid: k.id })}><span class="row">${avatar(k.avatar)}<span class="grow"><b>${esc(k.name)}</b><br><span class="sub">${done}/${t.length} missions today · ★ ${k.stars}</span></span>${icon('next')}</span><span class="bar" style="display:block;margin-top:8px"><i style="width:${t.length ? done / t.length * 100 : 0}%"></i></span></button>`;
    }).join('') || note('welcome-wave', 'No cadets yet', 'Add your child to start the first mission.')}`,
    foot: `${kidsList().length ? to('Remove a cadet', 'p.removecadet', { cls: 'white sm' }) : ''}${to('Add cadet', 'p.addcadet', { cls: 'white sm' })}${to('Assign a mission', 'p.rooms', { arrow: true, disabled: !kidsList().length })}` })
}));

screen('p.editcadet', ({ kid }) => {
  const k = C.kid(kid);
  if (!k) { go('p.family', null, { replace: true }); return null; }
  S.tmp.avatar = k.avatar;
  return {
    html: page({ tab: 'p.settings', body: `${top({ backTo: 'p.family' })}${title(`Edit ${esc(k.name)}’s profile`, 'Personalise your cadet’s profile and connected device.')}<div class="center">${avatar(k.avatar, 'lg')}</div>${field('user', 'name', 'Name', k.name, 'maxlength="30"')}${field('calendar', 'age', 'Age', k.age || '', 'inputmode="numeric" maxlength="2"')}${avatarPicker(k.avatar)}<div class="list">${item({ lead: ico('qr'), title: 'Pair a device', text: 'Show a new QR code', act: 'go', attrs: goAttr('p.pair', { kid: k.id }) })}</div>`,
      foot: btn('Save profile', 'save', { arrow: true }) }),
    on: {
      avatar: pickAvatar,
      save: async () => { await act(`/api/v2/kids/${k.id}`, { method: 'PUT', body: { name: val('name'), age: val('age'), avatar: S.tmp.avatar } }); go('p.family'); toast('Profile saved.'); }
    }
  };
});

screen('p.removecadet', () => ({
  live: true,
  html: page({ tab: 'p.settings', body: `${top({ backTo: 'p.family', logo: false })}${title('Remove a cadet', 'Their stars and history will be deleted.')}<div class="list">${kidsList().map(k => item({ lead: ico('trash'), title: `Remove ${esc(k.name)}`, text: 'Tap to remove', act: 'ask', attrs: `data-id="${k.id}"` })).join('')}${item({ lead: ico('user'), title: 'Keep my cadets', text: 'Go back, nothing changes', act: 'go', attrs: goAttr('p.family') })}</div>${note('need-help', 'Careful!', 'Removing a cadet cannot be undone.')}` }),
  on: {
    ask: (el) => {
      const k = C.kid(el.dataset.id);
      modal(`<h2>Remove ${esc(k.name)}?</h2><p class="sub">Stars, missions and history will be deleted. This cannot be undone.</p>${btn('Yes, remove', 'yes', { cls: 'pink' })}${btn('Keep', 'close', { cls: 'white' })}`, {
        yes: async () => { await act(`/api/v2/kids/${k.id}`, { method: 'DELETE' }); if (S.kidId === k.id) C.setKid(null); closeModal(); go('p.family'); }
      });
    }
  }
}));

// ---------- dashboard 2.3 ----------
function missionControl(m) {
  const name = esc(m.kid_name || C.kid(m.kid_id)?.name);
  const head = `${roomImg(m.room_template_id, 'thumb')}`;
  modal(`<div class="center">${head}</div><h2>${esc(m.title)}</h2><p class="sub">${name} · ${m.is_paused ? 'paused' : 'active today'}</p>${btn(m.is_paused ? 'Resume mission' : 'Pause mission', 'pause', { cls: 'yellow' })}${btn('Cancel mission', 'cancel', { cls: 'pink' })}${link('Close', 'close')}<p class="small">Pause hides it from the radar for now. Cancel deletes it.</p>`, {
    pause: async () => { await act(`/api/v2/missions/${m.id}/pause`, { method: 'POST', body: { paused: !m.is_paused } }); closeModal(); C.render(); },
    cancel: () => modal(`<div class="center">${head}</div><h2>Cancel this mission?</h2><p class="sub">${name} · ${esc(m.title)}</p>${btn('Keep mission', 'close', { cls: 'yellow' })}${btn('Yes, cancel it', 'yes', { cls: 'pink' })}<p class="small">Cancelling removes it for ${name}. This can’t be undone.</p>`, {
      yes: async () => { await act(`/api/chores/${m.id}`, { method: 'DELETE' }); closeModal(); C.render(); }
    })
  });
}

screen('p.home', ({ kid }) => {
  const k = C.kid(kid || S.tmp.dashKid) || kidsList()[0];
  if (k) S.tmp.dashKid = k.id;
  const live = k ? S.data.missions.filter(m => m.kid_id === k.id && C.OPEN.includes(m.status)).sort((a, b) => a.id - b.id) : [];
  const doneToday = k ? S.data.missions.filter(m => m.kid_id === k.id && m.status === 'completed' && C.dayKey(C.parseDate(m.completed_at)) === S.data.today) : [];
  const activity = k ? [...doneToday, ...live].flatMap(m => C.quests(m).filter(q => q.done).map(q => q.title)) : [];
  const steps = live[0] ? C.quests(live[0]) : [];
  const unread = S.data.alerts.filter(a => !a.is_read).length;
  const header = `${top()}<div class="row dash"><h1 class="grow">Dashboard</h1><button type="button" class="icon-btn ring" data-act="go" data-to="p.notifications" aria-label="Notifications${unread ? `, ${unread} new` : ''}">${icon('bell')}${unread ? '<i style="position:absolute;margin:-16px 0 0 18px;width:10px;height:10px;border-radius:9px;background:var(--pink)"></i>' : ''}</button>${kidsList().slice(0, 3).map(c => `<button type="button" class="pick ${c.id === k?.id ? 'on' : ''}" data-act="go" ${goAttr('p.home', { kid: c.id })} aria-label="${esc(c.name)}">${avatar(c.avatar)}</button>`).join('')}<button type="button" class="icon-btn" style="background:var(--pink-soft)" data-act="go" data-to="p.addcadet" aria-label="Add cadet">${icon('plus')}</button></div>`;
  const sos = sosAlerts().map(a => `<div class="card" style="background:var(--pink-soft);border-color:var(--pink-soft)"><div class="row">${icon('bell')}<span class="grow"><b>SOS: Cadet Needs Backup</b><br>${esc(a.message)}</span></div>${btn('Approve &amp; Unfreeze Quest', 'unfreeze', { cls: 'pink sm', attrs: `data-id="${a.id}" style="margin-top:10px"` })}</div>`).join('');
  let body;
  if (!k) body = note('welcome-wave', 'Welcome, Commander', 'Add your first cadet to begin.');
  else if (!live.length) body = `<div class="card"><h3>No mission running yet</h3><p class="sub">Pick a cadet to deploy their first task.</p><div class="list" style="border:0;box-shadow:none;padding:0">${item({ lead: avatar(k.avatar), title: esc(k.name), text: 'Deploy a mission', act: 'go', attrs: goAttr('p.rooms', { kid: k.id }) })}</div></div>${note('star-shop-goal', 'Start with a small mission', 'Pick a cadet, then choose a room.')}`;
  else body = live.map(m => {
    const q = C.quests(m), n = q.filter(x => x.done).length;
    const status = m.is_paused ? 'Paused' : m.status === 'needs_fixing' ? 'Retake' : m.status === 'in_progress' ? '● Live' : 'Ready';
    return `<button type="button" class="card" style="text-align:left" data-act="control" data-id="${m.id}"><span class="row"><b class="grow">${esc(k.name)} · On Mission</b>${m.is_low_battery ? '<span class="chip">🔋 Low battery</span> ' : ''}<span class="chip ${m.status === 'in_progress' && !m.is_paused ? 'live' : ''}">${status}</span></span><span class="sub" style="display:block;margin:8px 0">${esc(m.title)} · Step ${Math.min(n + 1, q.length)} of ${q.length}${m.scheduled_date && m.scheduled_date > S.data.today ? ` · ${esc(m.scheduled_date)}` : ''}</span><span class="bar green" style="display:block"><i style="width:${n / q.length * 100}%"></i></span></button>`;
  }).join('');
  const stats = k && (live.length || activity.length) ? `<div class="card row center" style="justify-content:space-around"><div><h2>${steps.filter(q => q.done).length} of ${steps.length}</h2><span class="small">steps done</span></div><div><h2>+${doneToday.reduce((a, m) => a + m.stars, 0)}</h2><span class="small">stars today</span></div><div><h2>${live.filter(m => !m.is_paused).length}</h2><span class="small">mission live</span></div></div>` : '';
  const did = activity.length ? `<button type="button" class="card" style="text-align:left" data-act="go" ${goAttr('p.report', { kid: k.id })}><span class="row"><b class="grow">What ${esc(k.name)} did today</b>${icon('next')}</span>${activity.slice(0, 5).map(t => `<span class="row sub"><span class="grow">${esc(t)}</span><span>+1 <span class="star">★</span></span></span>`).join('')}</button>` : '';
  const heads = k && live.length ? link('Send a gentle heads-up', 'go', goAttr('p.headsup', { kid: k.id })) : '';
  return {
    live: true,
    html: page({ tab: 'p.home', body: `${header}${sos}${body}${stats}${did}${heads}`,
      foot: `<div class="pair">${to('Create Routine', 'p.rooms', { cls: 'sm', disabled: !k }, k ? { kid: k.id } : null)}${to(`Pending Approvals${proofs().length + requests().length ? ` (${proofs().length + requests().length})` : ''}`, proofs().length || !requests().length ? 'p.inbox' : 'p.requests', { cls: 'white sm' })}</div>` }),
    on: {
      control: el => missionControl(C.mission(el.dataset.id)),
      unfreeze: async el => { await act(`/api/alerts/${el.dataset.id}/read`, { method: 'PUT' }); C.render(); toast('Backup sent. The quest is unfrozen.'); }
    }
  };
});

const MESSAGES = ['Popo is ready when you are!', 'Your room mission is waiting.', 'Want to start with one tiny step?'];
screen('p.headsup', ({ kid }) => {
  S.tmp.msg = 0;
  return {
    html: page({ tab: 'p.home', body: `${top({ backTo: 'p.home' })}${title('Send heads-up', `A gentle reminder for ${kidName(kid)}. No pressure, no points taken away.`)}<div class="card" role="radiogroup" aria-label="Message"><h3>Choose a message</h3>${MESSAGES.map((m, i) => `<button type="button" role="radio" aria-checked="${!i}" class="opt ${!i ? 'on' : ''}" style="display:block;width:100%;margin-top:8px" data-act="msg" data-i="${i}">${m}</button>`).join('')}</div>`,
      foot: btn(`Send to ${kidName(kid)}`, 'send') + to('Not now', 'p.home', { cls: 'outline' }) }),
    on: {
      msg: el => { S.tmp.msg = +el.dataset.i; el.parentElement.querySelectorAll('.opt').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-checked', b === el); }); },
      send: async () => { await act('/api/alerts', { method: 'POST', body: { kid_id: +kid, type: 'headsup', title: 'Heads-up', message: MESSAGES[S.tmp.msg] } }); go('p.home'); toast('Heads-up sent.'); }
    }
  };
});

// ---------- rooms and deployment 2.1, 2.2 ----------
const visibleRooms = () => S.data.rooms.filter(r => S.data.prefs.rooms[r.id] !== false);
const locked = id => S.data.billing.paywall && !S.data.billing.subscribed && !S.data.billing.freeRooms.includes(id);
screen('p.rooms', ({ kid }) => {
  if (kid) S.tmp.planKid = +kid;
  return {
    html: page({ tab: 'p.routines', body: `${stepper(1, 3)}${title('Choose a room', 'Pick the planet for the next mission.')}<div class="grid2">${visibleRooms().map(r => `<button type="button" class="room-tile" data-act="room" data-id="${r.id}">${roomImg(r.id, '')}${locked(r.id) ? '🔒 ' : ''}${esc(r.planet)}</button>`).join('')}</div>${link('Change which rooms show', 'go', 'data-to="p.access"')}` }),
    on: { room: el => { if (locked(el.dataset.id)) return go('a.plans'); S.tmp.plan = { room: el.dataset.id, quests: null }; go('p.chores', { room: el.dataset.id }); } }
  };
});

screen('p.chores', ({ room }) => {
  const r = C.room(room);
  if (!r) { go('p.rooms', null, { replace: true }); return null; }
  if (S.tmp.plan?.room !== r.id || !S.tmp.plan.quests) S.tmp.plan = { ...(S.tmp.plan || {}), room: r.id, quests: r.quests.map((_, i) => i).slice(0, 5) };
  const picked = S.tmp.plan.quests;
  const multi = r.quests.some(q => q.steps.length > 1);
  return {
    html: page({ tab: 'p.routines', body: `${top({ backTo: 'p.rooms' })}${stepper(2, 3)}${roomImg(r.id, 'room-art')}<h1>${esc(r.planet)}</h1><div class="chips"><span class="chip">${r.quests.length} ${multi ? 'quests' : 'steps'}</span><span class="chip">No timers</span></div><p class="sub">Pick up to 5 chores for this mission.</p>${r.quests.map((q, i) => `<div><button type="button" class="chore-row" aria-pressed="${picked.includes(i)}" data-act="pick" data-i="${i}"><span class="check">✓</span><span class="grow">${esc(q.title)}</span><span>+1 <span class="star">★</span></span></button>${multi ? `<details style="padding:4px 14px"><summary class="small">${q.steps.length} steps</summary><ol class="small" style="padding:4px 0 0 18px">${q.steps.map(s => `<li>${esc(s[0])}</li>`).join('')}</ol></details>` : ''}</div>`).join('')}`,
      foot: btn('Next: date &amp; cadet', 'next', { arrow: true, disabled: !picked.length }) }),
    on: {
      pick: el => {
        const i = +el.dataset.i, at = picked.indexOf(i);
        if (at >= 0) picked.splice(at, 1); else picked.push(i);
        el.setAttribute('aria-pressed', at < 0);
        document.querySelector('[data-act="next"]').disabled = !picked.length;
      },
      next: () => go('p.deploy')
    }
  };
});

const DAYS = [['sun', 'S'], ['mon', 'M'], ['tue', 'T'], ['wed', 'W'], ['thu', 'T'], ['fri', 'F'], ['sat', 'S']];
const shift = n => { const d = new Date(); d.setDate(d.getDate() + n); return C.dayKey(d); };
screen('p.deploy', () => {
  const plan = S.tmp.plan;
  if (!plan?.quests?.length) { go('p.rooms', null, { replace: true }); return null; }
  if (!kidsList().length) { go('p.addcadet', null, { replace: true }); return null; }
  const r = C.room(plan.room);
  plan.date ||= S.data.today;
  plan.repeat ||= [];
  plan.kid = C.kid(plan.kid || S.tmp.planKid)?.id || kidsList()[0].id;
  const custom = ![S.data.today, shift(1)].includes(plan.date);
  return {
    html: page({ tab: 'p.routines', body: `${top({ backTo: 'p.rooms' })}${stepper(3, 3)}${title('Deploy mission', 'Pick a date and who gets it. No timers, no deadlines.')}<div class="card row">${roomImg(r.id, 'thumb')}<span><b>${esc(r.planet)}</b><br><span class="sub">${plan.quests.length} chore${plan.quests.length > 1 ? 's' : ''}</span></span></div>
      <h3>Date</h3><div class="opts"><button type="button" class="opt ${plan.date === S.data.today ? 'on' : ''}" data-act="date" data-d="${S.data.today}">Today</button><button type="button" class="opt ${plan.date === shift(1) ? 'on' : ''}" data-act="date" data-d="${shift(1)}">Tomorrow</button><button type="button" class="opt ${custom ? 'on' : ''}" data-act="go" data-to="p.date">${custom ? esc(plan.date) : 'Pick date'}</button></div>
      ${plan.time || plan.repeat.length ? `<p class="small">${esc(plan.time || '')} ${plan.repeat.length ? `· repeats ${plan.repeat.join(', ')}` : ''}</p>` : ''}
      <h3>Assign to</h3><div class="row" style="justify-content:center">${kidsList().map(k => `<button type="button" class="center" data-act="kid" data-id="${k.id}" aria-pressed="${k.id === plan.kid}"><span class="pick ${k.id === plan.kid ? 'on' : ''}" style="display:inline-block">${avatar(k.avatar, 'lg')}</span><br><b>${esc(k.name)}</b></button>`).join('')}</div>`,
      foot: btn('Deploy', 'deploy', { arrow: true }) }),
    on: {
      date: el => { plan.date = el.dataset.d; C.render({ refresh: true }); },
      kid: el => { plan.kid = +el.dataset.id; C.render({ refresh: true }); },
      deploy: async () => {
        await act('/api/v2/missions', { method: 'POST', body: { kid_id: plan.kid, room_id: plan.room, quests: plan.quests, date: plan.date, time: plan.time, repeat: plan.repeat } });
        S.tmp.dashKid = plan.kid; S.tmp.plan = null;
        go('p.home', { kid: S.tmp.dashKid }); toast('Mission deployed! 🚀');
      }
    }
  };
});

screen('p.date', () => {
  const plan = S.tmp.plan;
  if (!plan) { go('p.rooms', null, { replace: true }); return null; }
  plan.date ||= S.data.today;
  plan.repeat ||= [];
  const [y, m] = (plan.month || plan.date.slice(0, 7)).split('-').map(Number);
  const first = new Date(y, m - 1, 1), count = new Date(y, m, 0).getDate();
  return {
    html: page({ tab: 'p.routines', body: `${top({ backTo: 'p.deploy' })}${title('Pick date &amp; time', 'Pick the start date, time and repeat days.')}<div class="card"><div class="row"><button type="button" class="icon-btn" data-act="month" data-n="-1" aria-label="Previous month">${icon('back')}</button><b class="grow" style="text-align:center">${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b><button type="button" class="icon-btn" data-act="month" data-n="1" aria-label="Next month">${icon('next')}</button></div><div class="cal">${DAYS.map(d => `<span class="small">${d[1]}</span>`).join('')}${'<span></span>'.repeat(first.getDay())}${Array.from({ length: count }, (_, i) => { const key = C.dayKey(new Date(y, m - 1, i + 1)); return `<button type="button" class="${key === plan.date ? 'on' : ''}" data-act="day" data-d="${key}" ${key < S.data.today ? 'disabled' : ''}>${i + 1}</button>`; }).join('')}</div></div>
      <h3>Time</h3><div class="opts">${['3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'].map(t => `<button type="button" class="opt ${plan.time === t ? 'on' : ''}" data-act="time" data-t="${t}">${t}</button>`).join('')}</div>
      <h3>Repeat on</h3><div class="opts">${DAYS.map(([code, l]) => `<button type="button" class="opt ${plan.repeat.includes(code) ? 'on' : ''}" data-act="repeat" data-c="${code}" aria-label="${code}" aria-pressed="${plan.repeat.includes(code)}">${l}</button>`).join('')}</div>`,
      foot: to('Save schedule', 'p.deploy', { arrow: true }) }),
    on: {
      month: el => { const d = new Date(y, m - 1 + +el.dataset.n, 1); plan.month = C.dayKey(d).slice(0, 7); C.render({ refresh: true }); },
      day: el => { plan.date = el.dataset.d; C.render({ refresh: true }); },
      time: el => { plan.time = plan.time === el.dataset.t ? null : el.dataset.t; C.render({ refresh: true }); },
      repeat: el => { const c = el.dataset.c; plan.repeat = plan.repeat.includes(c) ? plan.repeat.filter(x => x !== c) : [...plan.repeat, c]; C.render({ refresh: true }); }
    }
  };
});

// ---------- routines 2.8 ----------
function routines() {
  const seen = new Map();
  for (const m of S.data.missions) {
    if (!m.scheduled_date) continue;
    const key = `${m.kid_id}:${m.room_template_id}`;
    if (!seen.has(key)) seen.set(key, m);
  }
  return [...seen.values()].filter(m => m.repeat_days || C.OPEN.includes(m.status));
}
const repeatLabel = m => {
  const d = String(m.repeat_days || '').split(',').filter(Boolean);
  if (!d.length) return 'once';
  if (d.length === 7) return 'every day';
  const set = d.sort().join();
  return set === 'fri,mon,thu,tue,wed' ? 'weekdays' : set === 'sat,sun' ? 'weekends' : d.join(', ');
};
screen('p.routines', () => {
  const list = routines();
  return {
    live: true,
    html: list.length
      ? page({ tab: 'p.routines', body: `${top()}${title('Routines', 'Every room and who does it.')}<div class="list">${list.map(m => item({ lead: ico('home'), title: `${esc(m.room_name)} · ${kidName(m.kid_id)}`, text: `${C.quests(m).length} steps · ${repeatLabel(m)}`, act: 'go', attrs: goAttr('p.routine', { id: m.id }) })).join('')}</div><div class="list">${item({ lead: ico('plus'), title: 'Add a routine', text: 'Pick a room to start', act: 'go', attrs: goAttr('p.rooms') })}</div>` })
      : page({ tab: 'p.routines', body: `<div class="grow"></div>${stateCard({ pose: 'self-check', badge: '📅', title: 'No routines yet', text: 'Add your first room so your cadets can start a mission.', actions: to('Create a routine', 'p.rooms') })}<div class="grow"></div>` })
  };
});
screen('p.routine', ({ id }) => {
  const m = C.mission(id);
  if (!m) { go('p.routines', null, { replace: true }); return null; }
  return {
    html: page({ tab: 'p.routines', body: `${top({ backTo: 'p.routines', logo: false })}${title(esc(m.room_name), `${kidName(m.kid_id)} · ${repeatLabel(m)}`)}<div class="list">${item({ lead: ico('flag'), title: 'Steps', text: `${C.quests(m).map(q => esc(q.title)).join(' · ')}`, end: '' })}${item({ lead: ico('calendar'), title: 'Days and time', text: `${repeatLabel(m)}${m.scheduled_time ? ` · ${esc(m.scheduled_time)}` : ''} · from ${esc(m.scheduled_date)}`, end: '' })}${item({ lead: ico('trash'), title: 'Remove routine', text: 'Delete this room routine', act: 'remove' })}</div>${note('encouraging', 'Small steps win', 'Keep each room to 3 to 5 steps for focus.')}` }),
    on: {
      remove: () => modal(`<h2>Remove this routine?</h2><p class="sub">${esc(m.room_name)} stops repeating and its open mission is deleted. Finished history stays.</p>${btn('Yes, remove', 'yes', { cls: 'pink' })}${btn('Keep it', 'close', { cls: 'white' })}`, {
        yes: async () => {
          const same = S.data.missions.filter(x => x.kid_id === m.kid_id && x.room_template_id === m.room_template_id);
          for (const x of same) if (C.OPEN.includes(x.status)) await api(`/api/chores/${x.id}`, { method: 'DELETE' });
          await act(`/api/v2/routines/stop`, { method: 'POST', body: { kid_id: m.kid_id, room_id: m.room_template_id } });
          closeModal(); go('p.routines');
        }
      })
    }
  };
});

// ---------- inbox and proof review 2.6 ----------
const inboxTabs = on => `<div class="seg"><button type="button" class="${on === 'verify' ? 'on' : ''}" data-act="go" data-to="p.inbox">To verify · ${proofs().length}</button><button type="button" class="${on === 'archive' ? 'on' : ''}" data-act="go" data-to="p.archive">Archive</button></div>`;
const proofCard = (m, text, tag, target = 'p.review') => `<button type="button" class="card row" style="text-align:left;padding:10px 12px" data-act="go" ${goAttr(target, { id: m.id })}>${roomImg(m.room_template_id, 'thumb')}<span class="grow"><b>${kidName(m.kid_id)} · ${esc(m.title)}</b><br><span class="sub">${text}</span>${tag ? `<br><span class="chip tag">${tag}</span>` : ''}</span>${icon('next')}</button>`;
screen('p.inbox', () => {
  const list = proofs(), wanting = requests().length;
  const perks = wanting ? `<div class="list">${item({ lead: ico('star'), title: `${wanting} perk request${wanting > 1 ? 's' : ''}`, text: 'Approve or deny', act: 'go', attrs: goAttr('p.requests') })}</div>` : '';
  return {
    live: true,
    html: page({ tab: 'p.inbox', body: `${top()}${title('Inbox', 'Photo proof waiting for you.')}${inboxTabs('verify')}${perks}${list.length
      ? list.map(m => {
        const q = C.quests(m);
        if (m.status === 'needs_fixing') return proofCard(m, 'Sent back · waiting for a new photo', '1 retry used');
        return proofCard(m, m.redo_count ? 'Retry 1 of 1' : m.is_early ? 'Photo proof · sent early' : 'Photo proof', m.is_early ? `Early Submit: ${q.filter(x => x.done).length}/${q.length} Steps` : q.some(x => x.skipped) ? 'A step was skipped' : '');
      }).join('') + note('mission-radar', 'Check proofs together', 'Open a photo and verify it with your cadet.')
      : stateCard({ pose: 'verified-celebration', badge: '📥', title: 'All caught up!', text: 'No photos to check right now. Nice work, Commander.', actions: to('Back to dashboard', 'p.home') })}` })
  };
});
screen('p.archive', () => {
  const list = S.data.missions.filter(m => m.status === 'completed').slice(0, 30);
  return {
    live: true,
    html: page({ tab: 'p.inbox', body: `${top()}${title('Archive', 'Resolved proofs, kept for reference.')}${inboxTabs('archive')}${list.map(m => proofCard(m, `${m.verified_together ? 'Verified Together' : 'Verified'} · ${C.ago(m.completed_at)}`, '')).join('') || '<p class="sub">Nothing here yet.</p>'}${S.data.prefs.privacy.deletePhotos ? '<div class="card"><b>🛡️ Privacy first</b><p class="sub">Photos are permanently deleted 24 hours after review.</p></div>' : ''}` })
  };
});
screen('p.review', ({ id }) => {
  const m = C.mission(id);
  if (!m) { go('p.inbox', null, { replace: true }); return null; }
  const pending = m.status === 'pending_approval', second = m.redo_count > 0;
  const src = m.proof_photo ? esc((C.standalone ? C.base() + '/' : '') + m.proof_photo) : '';
  const verify = async (together) => {
    const r = await api(`/api/v2/missions/${m.id}/verify`, { method: 'POST', body: { together } });
    await C.load(); go('p.inbox', null, { replace: true }); toast(`${r.stars} stars released to ${C.kid(m.kid_id).name}.`);
  };
  return {
    html: page({ tab: 'p.inbox', body: `${top({ backTo: 'p.inbox' })}${title(m.status === 'completed' ? 'Verified proof' : 'Review proof', `${second ? 'Second photo' : 'Photo'} from ${kidName(m.kid_id)}`)}${pending ? `<div class="chips"><span class="chip">${m.stars} stars waiting in the Star Capsule</span></div>` : ''}${src ? `<img class="room-art" src="${src}" alt="Proof photo from ${kidName(m.kid_id)}">` : '<div class="card sub center">The photo is no longer stored.</div>'}<ul class="card sub" style="padding-left:34px">${C.quests(m).map(q => `<li>${q.done ? '✅' : q.skipped ? '⏭️' : '⬜'} ${esc(q.title)}</li>`).join('')}</ul>${second && pending ? `<div class="card"><b>One retry used</b><p class="sub">Help ${kidName(m.kid_id)} fix it in person, then tap Verified Together to release the stars.</p></div>` : note('self-check', 'Look at the whole room', 'Compare it with the chores they picked.')}`,
      foot: pending ? `<div class="pair">${btn('Needs fixing', 'fix', { cls: 'pink', disabled: second })}${btn('Verify', 'verify', { cls: 'green' })}</div>${second ? btn('Verified Together', 'together', { arrow: true }) : ''}`
        : m.status === 'needs_fixing' ? btn('Verified Together', 'together', { arrow: true }) : '' }),
    on: {
      verify: () => verify(false),
      together: () => verify(true),
      fix: async () => {
        await act(`/api/v2/missions/${m.id}/needs-fixing`, { method: 'POST' });
        modal(`<div style="font-size:52px">↩️</div><h2>Sent back to ${kidName(m.kid_id)}</h2><p class="sub">One more try</p>${btn('Back to Inbox', 'ok')}<p class="small">If it still needs work, you can verify it together.</p>`, { ok: () => { closeModal(); go('p.inbox'); } });
      }
    }
  };
});

// ---------- perks 2.4, 2.5 ----------
const PERK_ICONS = [[/pizza/i, 'pizza'], [/game|ipad|screen/i, 'game_time'], [/ice/i, 'ice_cream'], [/movie/i, 'movie'], [/book|story/i, 'book'], [/bike|ride/i, 'bike']];
C.perkIcon = p => {
  const hit = PERK_ICONS.find(([re]) => re.test(p.title));
  return hit ? `<img class="perk-ico" src="${art('perks/' + hit[1])}" alt="">` : `<span class="perk-ico" aria-hidden="true">${esc(p.icon || '🎁')}</span>`;
};
const GOALS = [['1 Day Goal', 5], ['3 Day Goal', 15], ['1 Week Goal', 35]];
screen('p.shop', () => {
  const f = S.tmp.perk ||= { cost: 15, limit: 1, name: '' };
  const redraw = () => { f.name = val('perk'); C.render({ refresh: true }); };
  return {
    html: page({ tab: 'p.shop', body: `${top()}${title('Perk Shop', 'Rewards your cadets can ask for.')}${requests().length ? to(`${requests().length} request${requests().length > 1 ? 's' : ''} waiting`, 'p.requests', { cls: 'yellow sm' }) : ''}<div class="list">${S.data.perks.map(p => `<div class="item">${C.perkIcon(p)}<span class="body"><b>${esc(p.title)}</b></span><span class="price">★ ${p.star_cost}</span><button type="button" class="icon-btn" data-act="remove" data-id="${p.id}" aria-label="Remove ${esc(p.title)}">${icon('x')}</button></div>`).join('') || '<p class="sub item">No perks yet.</p>'}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>New perk</h3>${field('star', 'perk', 'Perk name', f.name, 'maxlength="40"')}<p class="small">🪄 Magic Wand price ideas</p><div class="opts">${GOALS.map(([l, n]) => `<button type="button" class="opt ${f.cost === n ? 'on' : ''}" data-act="goal" data-n="${n}">${l}<br>★ ${n}</button>`).join('')}</div>${field('star', 'cost', 'Star price', f.cost, 'inputmode="numeric" maxlength="4"')}</div>
      <div class="card row"><span class="grow"><b>Limit per day</b><br><span class="small">Popo stops buys past this.</span></span><button type="button" class="icon-btn ring" data-act="limit" data-n="-1" aria-label="Less">−</button><b>${f.limit}</b><button type="button" class="icon-btn ring" data-act="limit" data-n="1" aria-label="More">+</button></div>`,
      foot: btn('Save to Shop', 'save') }),
    mount(root) { root.querySelector('[name="cost"]').addEventListener('input', e => { f.cost = parseInt(e.target.value, 10) || 0; }); },
    on: {
      goal: el => { f.cost = +el.dataset.n; redraw(); },
      limit: el => { f.limit = Math.min(9, Math.max(1, f.limit + +el.dataset.n)); redraw(); },
      save: async () => { await act('/api/v2/perks', { method: 'POST', body: { title: val('perk'), cost: val('cost'), limit: f.limit } }); S.tmp.perk = null; C.render(); toast('Saved to the shop.'); },
      remove: el => modal(`<h2>Remove this perk?</h2>${btn('Yes, remove', 'yes', { cls: 'pink' })}${btn('Keep it', 'close', { cls: 'white' })}`, { yes: async () => { await act(`/api/v2/perks/${el.dataset.id}`, { method: 'DELETE' }); closeModal(); redraw(); } })
    }
  };
});
screen('p.requests', () => {
  const list = requests();
  return {
    live: true,
    html: page({ tab: 'p.inbox', body: `${top({ backTo: 'p.inbox' })}${title('Approval Queue', `${list.length} reward request${list.length === 1 ? '' : 's'} waiting`)}${list.map(r => `<div class="card"><div class="row">${avatar(C.kid(r.kid_id)?.avatar || 'bear')}<span class="grow"><b>${kidName(r.kid_id)} wants ${esc(r.title)}</b><br><span class="sub">${r.star_cost} star${r.star_cost === 1 ? '' : 's'} held safely</span></span><span class="price">★ ${r.star_cost}</span></div><div class="pair" style="margin-top:12px">${btn('Deny', 'decide', { cls: 'pink sm', attrs: `data-id="${r.id}" data-ok=""` })}${btn('Approve', 'decide', { cls: 'green sm', attrs: `data-id="${r.id}" data-ok="1"` })}</div></div>`).join('')}<p class="card sub">Approve moves the perk to the cadet’s Inventory. Deny refunds the stars.</p>${note('star-shop-goal', 'Kind choices, Commander', 'Deny refunds the stars right away.')}` }),
    on: { decide: async el => { await act(`/api/v2/requests/${el.dataset.id}/decide`, { method: 'POST', body: { approve: !!el.dataset.ok } }); C.render(); toast(el.dataset.ok ? 'Approved.' : 'Denied. Stars refunded.'); } }
  };
});

// ---------- settings 2.7 ----------
const row = (ic, t, text, name, q) => item({ lead: ico(ic), title: t, text, act: 'go', attrs: goAttr(name, q) });
screen('p.settings', () => ({
  live: true,
  html: page({ tab: 'p.settings', body: `${top()}${title('Settings', 'Keep your family space safe.')}<div class="list">${row('user', 'Manage cadets', kidsList().map(k => esc(k.name)).join(', ') || 'Add your family', 'p.family')}${row('home', 'Room access', 'Choose which rooms show', 'p.access')}${item({ lead: ico('lock'), title: 'Change Parent PIN', text: 'Keeps settings parent-only', act: 'changepin' })}</div><div class="list">${row('star', 'Cadet space', 'Sound, motion and reminders', 'p.cadetspace')}${row('bell', 'Alerts', 'Choose what pings you', 'p.alerts')}${row('shield', 'Privacy', 'Photos and names', 'p.privacy')}${row('chart', 'Reports', 'How your cadets did this week', 'p.reports')}${row('globe', 'Language', { en: 'English', ms: 'Bahasa Melayu', zh: '中文', ta: 'தமிழ்' }[S.data.prefs.general.language], 'p.language')}${row('help', 'Help', 'Quick answers', 'p.help')}</div><div class="list">${row('mail', 'Parent account', 'Email, password and PIN reset', 'a.account')}${row('star', 'Family Plus', S.data.billing.subscribed ? 'Active' : 'Plans and pricing', 'a.plans')}${C.standalone ? item({ lead: ico('globe'), title: 'Server address', text: esc(C.base()), act: 'server' }) : ''}</div><div class="list">${item({ lead: ico('logout'), title: 'Log out', text: 'Lock Parent HQ on this device', act: 'logout' })}</div>` }),
  on: {
    changepin: () => { S.tmp = { currentPin: S.pin }; go('p.pinnew'); },
    server: () => modal(`<h2>Server address</h2>${field('globe', 'server', 'https://…', C.base())}${btn('Save and restart', 'ok')}${link('Cancel', 'close')}`, { ok: () => { C.store.set('cando_server', val('server').replace(/\/+$/, '') || null); location.hash = ''; location.reload(); } }),
    logout: () => modal(`${popo('welcome-wave', 'sm')}<h2>Log out?</h2><p class="sub">You will need your Parent PIN to come back.</p>${btn('Log out', 'yes')}${btn('Stay logged in', 'close', { cls: 'outline' })}`, { yes: () => { S.pin = null; closeModal(); go('role'); } })
  }
}));

const savePrefs = body => act('/api/v2/prefs', { method: 'PUT', body });
function prefScreen(group, heading, sub, rows, extra = () => '') {
  return () => ({
    html: page({ tab: 'p.settings', body: `${top({ backTo: 'p.settings', logo: false })}${title(heading, sub)}<div class="list">${rows.map(([key, ic, t, text]) => item({ lead: ico(ic), title: t, text, end: toggle(S.data.prefs[group][key], 'pref', t, `data-k="${key}"`) })).join('')}</div>${extra()}` }),
    on: { pref: async el => { const on = el.getAttribute('aria-checked') !== 'true'; await savePrefs({ [group]: { [el.dataset.k]: on } }); el.setAttribute('aria-checked', on); document.body.classList.toggle('calm', !!S.data.prefs.cadet.calmMotion); } }
  });
}
screen('p.cadetspace', prefScreen('cadet', 'Cadet space', 'Make the app calm and easy.', [
  ['narration', 'sound', 'Narration voice', 'Popo reads each step aloud'], ['calmMotion', 'star', 'Calm motion', 'Less animation and sparkle'],
  ['reminders', 'calendar', 'Gentle reminders', 'A soft nudge before a mission'], ['shortOnly', 'flag', 'Short missions only', 'Max 5 steps per room']]));
screen('p.alerts', prefScreen('alerts', 'Alerts', 'Choose what pings your phone (needs phone notifications).', [
  ['proof', 'camera', 'Proof photos', 'When a cadet sends one'], ['sos', 'bell', 'SOS pings', 'When a cadet needs help'], ['perk', 'star', 'Perk requests', 'When a cadet asks for a perk'], ['summary', 'chart', 'Daily summary', 'One note each evening']],
() => `<div class="list">${row('bell', 'Phone notifications', 'Set up ntfy', 'p.ntfy')}</div>`));
screen('p.privacy', prefScreen('privacy', 'Privacy', 'Keep photos and names safe.', [
  ['deletePhotos', 'camera', 'Delete proofs after 24h', 'Counted from when you verify them'], ['hideNames', 'shield', 'Hide names on lock screen', 'Leaves details out of phone alerts']]));

screen('p.access', () => ({
  html: page({ tab: 'p.settings', body: `${top({ backTo: 'p.settings' })}${title('Room access', 'Choose which rooms you can plan. Hidden rooms stay off the radar.')}<div class="list">${S.data.rooms.map(r => item({ lead: roomImg(r.id, 'thumb'), title: esc(r.name), text: esc(r.planet), end: toggle(S.data.prefs.rooms[r.id] !== false, 'room', r.name, `data-id="${r.id}"`) })).join('')}</div>` }),
  on: { room: async el => { const on = el.getAttribute('aria-checked') !== 'true'; await savePrefs({ rooms: { [el.dataset.id]: on } }); el.setAttribute('aria-checked', on); } }
}));

screen('p.ntfy', () => ({
  html: page({ tab: 'p.settings', body: `${top({ backTo: 'p.alerts', logo: false })}${title('Phone notifications', 'Free push messages through the ntfy app.')}<div class="card row"><b class="grow">Send notifications</b>${toggle(false, 'enable', 'Send notifications')}</div>${field('globe', 'server', 'Server (https://ntfy.sh)', '')}${field('bell', 'topic', 'Secret topic name', '')}${field('key', 'token', 'Token or user:password (optional)', '', 'type="password"')}${field('right', 'clickUrl', 'Tap-to-open link (optional)', '')}<p class="small">Subscribe to the same topic in the ntfy app. On the public server anyone who knows the topic can read it, so choose a hard-to-guess name.</p>`,
    foot: btn('Send test notification', 'test', { cls: 'white sm' }) + btn('Save', 'save') }),
  mount(root) {
    api('/api/ntfy').then(c => {
      for (const k of ['server', 'topic', 'clickUrl']) { const i = root.querySelector(`[name="${k}"]`); if (i) i.value = c[k] || ''; }
      root.querySelector('[data-act="enable"]')?.setAttribute('aria-checked', !!c.enabled);
    }).catch(e => toast(e.message));
  },
  on: {
    enable: el => el.setAttribute('aria-checked', el.getAttribute('aria-checked') !== 'true'),
    test: async () => { await api('/api/ntfy/test', { method: 'POST', body: ntfyForm() }); toast('Test sent.'); },
    save: async () => { await api('/api/ntfy', { method: 'PUT', body: ntfyForm() }); toast('Notification settings saved.'); }
  }
}));
const ntfyForm = () => ({ enabled: document.querySelector('[data-act="enable"]').getAttribute('aria-checked') === 'true', server: val('server'), topic: val('topic'), token: val('token'), clickUrl: val('clickUrl'), events: ['completion', 'distraction', 'reward', 'help'] });

const LANGUAGES = [['en', 'EN', 'English', 'Default · recommended'], ['ms', 'MS', 'Bahasa Melayu', 'Malay'], ['zh', 'ZH', '中文', 'Mandarin'], ['ta', 'TA', 'தமிழ்', 'Tamil']];
screen('p.language', () => ({
  html: page({ tab: 'p.settings', body: `${top({ backTo: 'p.settings', logo: false })}${title('Language', 'Pick how CanDo! talks to you.')}<div class="list">${LANGUAGES.map(([code, tag, name, text]) => { const on = S.data.prefs.general.language === code; return item({ lead: ico(tag), title: name, text, end: `<span aria-label="${on ? 'selected' : ''}" style="color:var(--purple)">${on ? '◉' : '○'}</span>`, act: 'lang', attrs: `data-code="${code}"` }); }).join('')}</div><p class="small">Popo’s recorded voice clips are in English.</p>` }),
  on: { lang: async el => { await savePrefs({ general: { language: el.dataset.code } }); location.reload(); } }
}));
screen('p.help', () => ({
  html: page({ tab: 'p.settings', body: `${top({ backTo: 'p.settings', logo: false })}${title('Help', 'Quick answers for Commanders.')}<div class="list">${item({ lead: ico('shield'), title: 'Reset Parent PIN', text: 'Change it in a few taps', act: 'changepin' })}${row('user', 'Add or remove a cadet', 'Manage your family', 'p.family')}${row('star', 'Set up perks', 'Choose rewards for stars', 'p.shop')}${row('camera', 'Check a photo proof', 'Verify a finished mission', 'p.inbox')}</div>${note('mission-radar', 'Still stuck?', 'Ask your cadet. They know the app!')}` }),
  on: { changepin: () => { S.tmp = { currentPin: S.pin }; go('p.pinnew'); } }
}));

// ---------- reports 2.9 and notifications 2.10 ----------
function week(kidId) {
  const now = new Date(), monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => {
    const key = C.dayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    const planned = S.data.missions.filter(m => m.kid_id === kidId && m.scheduled_date === key);
    const done = planned.length > 0 && planned.every(m => ['completed', 'pending_approval'].includes(m.status));
    return { letter: 'MTWTFSS'[i], planned: planned.length, finished: planned.filter(m => ['completed', 'pending_approval'].includes(m.status)).length, state: done ? 'done' : planned.length && key < S.data.today ? 'missed' : '' };
  });
}
const weekRow = w => `<div class="week">${w.map(d => `<div><i class="${d.state}" title="${d.state || (d.planned ? 'planned' : 'no mission')}"></i>${d.letter}</div>`).join('')}</div>`;
screen('p.reports', () => ({
  live: true,
  html: page({ tab: 'p.home', body: `${top({ backTo: 'p.settings', logo: false })}${title('Reports', 'How your cadets did this week.')}${kidsList().map(k => { const w = week(k.id); return `<button type="button" class="card" style="text-align:left" data-act="go" ${goAttr('p.report', { kid: k.id })}><span class="row" style="margin-bottom:10px">${ico('user')}<span><b>${esc(k.name)}</b><br><span class="sub">${w.filter(d => d.state === 'done').length} of ${w.filter(d => d.planned).length} days · ${w.filter(d => d.state === 'missed').length} missed</span></span></span>${weekRow(w)}</button>`; }).join('')}${note('calm', 'Missed days are okay', 'A fresh start is always ready. No streak is lost.')}` })
}));
screen('p.report', ({ kid }) => {
  const k = C.kid(kid);
  if (!k) { go('p.reports', null, { replace: true }); return null; }
  const w = week(k.id), planned = w.reduce((a, d) => a + d.planned, 0), finished = w.reduce((a, d) => a + d.finished, 0);
  const rate = planned ? Math.round(finished / planned * 100) : 0;
  let streak = 0;
  const days = new Set(S.data.missions.filter(m => m.kid_id === k.id && m.completed_at).map(m => C.dayKey(C.parseDate(m.completed_at))));
  for (const d = new Date(); ; d.setDate(d.getDate() - 1)) {
    if (days.has(C.dayKey(d))) streak++;
    else if (C.dayKey(d) !== S.data.today) break;
  }
  return {
    live: true,
    html: page({ tab: 'p.home', body: `${top({ backTo: 'p.reports', logo: false })}${title(esc(k.name), 'Details for this week')}<div class="card"><b>Completion rate</b><h1 style="color:var(--purple)">${planned ? rate + '%' : '–'}</h1><div class="bar gold"><i style="width:${rate}%"></i></div><p class="sub" style="margin:8px 0">${finished} of ${planned} missions done this week</p>${weekRow(w)}</div><div class="card"><b>Kind streak</b><h1 style="color:var(--purple)">${streak} day${streak === 1 ? '' : 's'}</h1><p class="sub">A missed day just means a fresh start.</p></div>`,
      foot: to('Send heads-up', 'p.headsup', {}, { kid: k.id }) })
  };
});

const NOTE_ICON = { completion: 'camera', help: 'bell', reward: 'star', approval: 'flag', distraction: 'bell' };
const NOTE_TARGET = { completion: 'p.inbox', help: 'p.home', reward: 'p.requests' };
screen('p.notifications', () => {
  const list = S.data.alerts.filter(a => a.type !== 'headsup');
  const isToday = a => C.dayKey(C.parseDate(a.created_at)) === S.data.today;
  const group = (label, rows) => rows.length ? `<p class="sub">${label}</p><div class="list">${rows.map(a => `<div class="item">${ico(NOTE_ICON[a.type] || 'bell')}<button type="button" class="body" style="text-align:left" data-act="open" data-id="${a.id}" data-type="${esc(a.type)}"><b>${esc(String(a.title).replace(/^[^\w]+/, ''))}</b><small>${esc(a.message)} · ${C.ago(a.created_at)}</small></button><button type="button" class="icon-btn" data-act="dismiss" data-id="${a.id}" aria-label="Remove notification">${icon('x')}</button></div>`).join('')}</div>` : '';
  return {
    live: true,
    html: list.length
      ? page({ tab: 'p.home', body: `${top({ backTo: 'p.home', logo: false, right: link('Clear all', 'clear') })}${title('Notifications', 'Everything from your cadets.')}${group('Today', list.filter(isToday))}${group('Earlier', list.filter(a => !isToday(a)))}` })
      : page({ tab: 'p.home', body: `${top({ backTo: 'p.home', logo: false })}<div class="grow"></div>${stateCard({ pose: 'day-off', badge: '🔔', title: 'Nothing new', text: 'We will ping you when a cadet needs you.', actions: to('Back to dashboard', 'p.home') })}<div class="grow"></div>` }),
    on: {
      open: async el => { await api(`/api/alerts/${el.dataset.id}/read`, { method: 'PUT' }); await C.load(); go(NOTE_TARGET[el.dataset.type] || 'p.home'); },
      dismiss: async el => { await act(`/api/v2/alerts/${el.dataset.id}`, { method: 'DELETE' }); C.render(); },
      clear: () => modal(`<h2>Clear all notifications?</h2>${btn('Yes, clear', 'yes', { cls: 'pink' })}${btn('Keep them', 'close', { cls: 'white' })}`, { yes: async () => { await act('/api/alerts/clear', { method: 'DELETE' }); closeModal(); C.render(); } })
    }
  };
});
})();
