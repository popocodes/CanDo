// Parent email account (1.1a-1.1j), Family Plus (2.1n) and the Mission Wheel.
(() => {
'use strict';
const C = window.CanDo;
const { S, esc, api, screen, go, modal, toast, art, popo, btn, to, link, top, field, val, icon } = C;
const page = (body, foot = '') => `<div class="scroll center">${body}</div>${foot ? `<div class="foot">${foot}</div>` : ''}`;
const heading = (h, sub) => `<div><h1>${h}</h1><p class="sub">${sub}</p></div>`;
const stretch = html => `<div style="align-self:stretch;display:flex;flex-direction:column;gap:10px">${html}</div>`;
const password = (name, label) => C.field('lock', name, label, '', 'type="password" maxlength="200"');
const email = () => field('mail', 'email', 'Email address', '', 'type="email" maxlength="254" autocapitalize="none"');

let auth = null;
const loadAuth = async () => (auth = await api('/api/v2/auth/status'));
// Screens that depend on what the server has set up draw once, then again when it answers.
function withAuth(view) {
  return (p) => {
    const v = view(p, auth || {});
    const before = JSON.stringify(auth);
    const mount = v.mount;
    v.mount = (root) => {
      loadAuth().then(() => { if (JSON.stringify(auth) !== before) C.render({ refresh: true }); }).catch(() => {});
      return mount?.(root);
    };
    return v;
  };
}
// Google and Apple need a real web page, so they are offered in the browser version only.
const social = a => C.standalone ? '' : ['google', 'apple'].filter(n => a[n]).map(n => `<a class="btn white" style="text-decoration:none" href="/api/v2/auth/${n}/start">Continue with ${n === 'google' ? 'Google' : 'Apple'}</a>`).join('');

function signedIn(session) {
  S.tmp = { session };
  if (S.data.pinSet) go('a.unlock', null, { replace: true }); else go('p.pinnew', null, { replace: true });
}

screen('a.gateway', () => ({
  html: page(`${top({ backTo: 'role' })}<div class="grow"></div>${popo('commanders-key', 'lg')}${heading('Parent sign in', 'Create an account or log in to manage your family’s missions.')}<div class="grow"></div>`,
    to('Create Account', 'a.signup', { arrow: true }) + to('Log In', 'a.login', { cls: 'white' }) + link(S.data.pinSet ? 'Use my HQ PIN' : 'Skip: just use a PIN', 'pin'))
  , on: { pin: () => go(S.data.pinSet ? 'p.pin' : 'p.pinnew') }
}));

screen('a.signup', withAuth((p, a) => ({
  html: page(`${top({ backTo: 'a.gateway' })}<div class="grow"></div>${heading('Create Account', 'Set up your Parent HQ in a minute.')}${stretch(`${email()}${password('password', 'Password')}<div class="chips"><span class="chip">8+ characters</span><span class="chip">1 number</span><span class="chip">1 symbol</span></div>${S.data.pinSet ? C.field('key', 'pin', 'Your current HQ PIN', '', 'type="password" inputmode="numeric" maxlength="4"') : ''}${btn('Create Account', 'create', { arrow: true })}${social(a)}`)}<div class="grow"></div>`),
  on: { create: async () => { const r = await api('/api/v2/auth/signup', { method: 'POST', body: { email: val('email'), password: val('password'), pin: val('pin') } }); toast('Account created.'); signedIn(r.session); } }
})));

screen('a.login', withAuth((p, a) => ({
  html: page(`${top({ backTo: 'a.gateway' })}<div class="grow"></div>${popo('welcome-wave', 'sm')}<h1>Welcome back!</h1>${stretch(`${email()}${password('password', 'Password')}${link('Forgot password?', 'go', 'data-to="a.forgot"')}${btn('Log In', 'login', { arrow: true })}${social(a)}`)}<div class="grow"></div>`),
  on: {
    login: async () => {
      // 403, not 401: a wrong password must not look like a locked PIN session.
      const r = await api('/api/v2/auth/login', { method: 'POST', body: { email: val('email'), password: val('password') } });
      signedIn(r.session);
    }
  }
})));

screen('a.unlock', () => ({
  html: page(`${top({ backTo: 'role' })}<div class="grow"></div>${popo('commanders-key', 'lg')}${heading('You’re signed in', 'Use your HQ PIN, or choose a new one.')}<div class="grow"></div>`,
    to('Enter my HQ PIN', 'p.pin', { arrow: true }) + to('Set a new PIN', 'p.pinnew', { cls: 'white' }))
}));

screen('a.forgot', () => ({
  html: page(`${top({ backTo: 'a.login' })}<div class="grow"></div>${popo('explaining', 'sm')}${heading('Forgot password?', 'Enter your email and we’ll send a reset link.')}${stretch(email())}<div class="grow"></div>`, btn('Send Reset Link', 'send', { arrow: true })),
  on: { send: async () => { await api('/api/v2/auth/forgot-password', { method: 'POST', body: { email: val('email') } }); go('a.sent'); } }
}));
screen('a.sent', () => ({
  html: page(`${top({ backTo: 'a.login' })}<div class="grow"></div><div style="font-size:72px" aria-hidden="true">✉️</div>${heading('Check your email', 'If that address has an account, a reset link is on its way. It expires in 15 minutes.')}<div class="grow"></div>`, to('Back to Log In', 'a.login', { arrow: true }) + to('Resend link', 'a.forgot', { cls: 'white' }))
}));
screen('a.newpassword', ({ token }) => ({
  html: page(`${top()}<div class="grow"></div>${popo('encouraging', 'sm')}${heading('New password', 'Make it strong so only you can get in.')}${stretch(`${password('password', 'New password')}${password('again', 'Confirm password')}`)}<div class="chips"><span class="chip">8+ characters</span><span class="chip">1 number</span><span class="chip">1 symbol</span></div><div class="grow"></div>`, btn('Save Password', 'save', { arrow: true })),
  on: { save: async () => { if (val('password') !== val('again')) return toast('The two passwords do not match.'); await api('/api/v2/auth/reset-password', { method: 'POST', body: { token, password: val('password') } }); go('a.login', null, { replace: true }); toast('Password saved. Please log in.'); } }
}));

screen('a.pinreset', () => ({
  html: page(`${top({ backTo: 'p.pin' })}<div class="grow"></div>${heading('Forgot your PIN?', 'We’ll email a one-time reset code to your account.')}${stretch(email())}${popo('self-check', 'sm')}<p class="small">The code works once and expires in 15 minutes.</p><div class="grow"></div>`, btn('Email me a code', 'send', { arrow: true })),
  on: { send: async () => { S.tmp.resetEmail = val('email'); await api('/api/v2/auth/pin-code', { method: 'POST', body: { email: S.tmp.resetEmail } }); go('a.pincode'); } }
}));
screen('a.pincode', () => ({
  html: page(`${top({ backTo: 'a.pinreset' })}<div class="grow"></div>${heading('Enter your code', 'Check your email for the 6-digit reset code.')}${stretch(C.field('key', 'code', '6-digit code', '', 'inputmode="numeric" maxlength="6"'))}${popo('self-check', 'sm')}<div class="grow"></div>`, btn('Resend code', 'again', { cls: 'white' }) + btn('Reset PIN', 'check', { arrow: true })),
  on: {
    again: async () => { if (!S.tmp.resetEmail) return go('a.pinreset'); await api('/api/v2/auth/pin-code', { method: 'POST', body: { email: S.tmp.resetEmail } }); toast('A new code is on its way.'); },
    check: async () => { const r = await api('/api/v2/auth/pin-code/check', { method: 'POST', body: { code: val('code') } }); S.tmp = { session: r.session }; go('p.pinnew', null, { replace: true }); }
  }
}));

screen('a.oauth', ({ token, error }) => {
  const finish = async (pin) => {
    const r = await api('/api/v2/auth/oauth-finish', { method: 'POST', body: { token, pin } });
    if (r.needsPin) {
      return modal(`<h2>Link this email</h2><p class="sub">Enter your current HQ PIN.</p>${C.field('key', 'pin', 'HQ PIN', '', 'type="password" inputmode="numeric" maxlength="4"')}${btn('Link', 'ok')}`, { ok: () => finish(val('pin')) });
    }
    C.closeModal(); signedIn(r.session);
  };
  return {
    html: page(`<div class="grow"></div>${popo(error ? 'try-again' : 'mission-radar', 'lg')}${heading(error ? 'Sign-in did not work' : 'Almost in', error ? esc(error) : 'Checking your sign-in…')}<div class="grow"></div>`, to('Back', 'a.gateway', { cls: 'white' })),
    mount() { if (token) finish().catch(e => toast(e.message)); }
  };
});

screen('a.account', withAuth((p, a) => {
  if (!S.pin) { setTimeout(() => go('p.pin', null, { replace: true }), 0); return { html: '' }; }
  return {
    html: page(`${top({ backTo: 'p.settings', logo: false })}${heading('Parent account', 'An email lets you reset your PIN and password.')}${a.hasAccount
      ? stretch(`<div class="card"><b>Linked email</b><p class="sub">${esc(a.email)}</p></div>${btn('Remove this account', 'remove', { cls: 'white' })}`)
      : stretch(to('Create Account', 'a.signup', { arrow: true }) + to('Log In', 'a.login', { cls: 'white' }))}${a.smtp ? '' : '<p class="small">Email is not set up on the server yet, so reset emails cannot be sent. See SETUP.md.</p>'}`),
    on: { remove: () => modal(`<h2>Remove the account?</h2><p class="sub">Your family data stays. Email resets stop working.</p>${btn('Yes, remove', 'yes', { cls: 'pink' })}${btn('Keep it', 'close', { cls: 'white' })}`, { yes: async () => { await api('/api/v2/auth/account', { method: 'DELETE' }); auth = null; C.closeModal(); C.render(); } }) }
  };
}));

// ---------- Family Plus ----------
screen('a.plans', () => {
  const b = S.data.billing;
  let plan = 'yearly';
  return {
    html: page(`${top({ backTo: 'p.rooms', logo: false })}${heading('Unlock every room', 'Bedroom is free. Family Plus opens every room for all your cadets.')}${stretch(`<div class="card">✓ All 10 planets: kitchen, bathroom, living room and more<br>✓ Unlimited cadets in one family<br>✓ Full Popo costume store</div><div class="pair"><button type="button" class="card" data-act="plan" data-p="monthly">Monthly<h2>RM12.90</h2><span class="small">per month · Cancel anytime</span></button><button type="button" class="card" data-act="plan" data-p="yearly" style="border:2.5px solid var(--purple)">Yearly<h2>RM99</h2><span class="small">per year · save 36%</span></button></div>`)}${b.subscribed ? '<span class="chip live">Family Plus is active</span>' : ''}${!b.paywall ? '<p class="small">Room locking is off on this server, so every room is already free.</p>' : ''}`,
      b.subscribed ? to('Back to rooms', 'p.rooms') : btn('Subscribe · Family Plus', 'subscribe', { disabled: !b.ready }) + to('Maybe later', 'p.rooms', { cls: 'white' }) + (b.ready ? '' : '<p class="small" style="text-align:center">Payments are not set up on this server yet.</p>')),
    on: {
      plan: el => { plan = el.dataset.p; el.parentElement.querySelectorAll('.card').forEach(c => { c.style.border = c === el ? '2.5px solid var(--purple)' : ''; }); },
      subscribe: async () => { const r = await api('/api/v2/billing/checkout', { method: 'POST', body: { plan } }); location.href = r.url; }
    }
  };
});
screen('a.paid', ({ session }) => ({
  html: page(`<div class="grow"></div>${popo('verified-celebration', 'lg')}${heading('Thank you!', '<span id="paid">Checking your payment…</span>')}<div class="grow"></div>`, to('Go to CanDo!', 'role', { arrow: true })),
  mount(root) {
    api('/api/v2/billing/confirm', { method: 'POST', body: { session } }).then(async () => { await C.load(); root.querySelector('#paid').textContent = 'Family Plus is active. Every room is open.'; }).catch(e => { root.querySelector('#paid').textContent = e.message; });
  }
}));

// ---------- Mission Wheel: "Decide for me!" ----------
const COLORS = ['#70459E', '#FFB644', '#F4718D', '#8DBD61', '#8F7FE0'];
screen('c.wheel', () => {
  const m = C.dueMissions(S.kidId).find(x => x.status !== 'needs_fixing');
  const options = m && !m.is_paused ? C.quests(m).filter(q => !q.done && !q.skipped) : [];
  if (!options.length) { go('c.home', null, { replace: true }); return null; }
  const slice = 360 / options.length;
  let chosen = null, timer;
  return {
    html: page(`${top({ backTo: 'c.home', logo: false })}${heading('Mission Wheel', 'Can’t pick? Let Popo spin for you.')}<div style="position:relative;width:min(280px,80vw);aspect-ratio:1"><div id="wheel" style="width:100%;height:100%;border-radius:50%;border:8px solid #fff;box-shadow:0 8px 24px rgba(75,46,122,.25);transition:transform 2.6s cubic-bezier(.15,.7,.1,1);background:conic-gradient(${options.map((_, i) => `${COLORS[i % 5]} ${i * slice}deg ${(i + 1) * slice}deg`).join(',')})">${options.map((_, i) => `<b style="position:absolute;left:50%;top:50%;color:#fff;font-size:24px;transform:translate(-50%,-50%) rotate(${(i + .5) * slice}deg) translateY(-90px)">${i + 1}</b>`).join('')}</div><span aria-hidden="true" style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:28px">🔻</span></div><ol style="text-align:left;font-weight:800">${options.map(q => `<li>${esc(q.title)}</li>`).join('')}</ol><h2 id="result" role="status"></h2>`,
      btn('Spin!', 'spin')),
    mount: () => () => clearTimeout(timer),
    on: {
      spin: el => {
        if (chosen !== null) {
          const step = chosen.steps.find(s => !s.is_completed);
          return go(m.status === 'assigned' ? 'c.step' : 'c.step', { id: m.id, s: step.step_num });
        }
        const index = Math.floor(Math.random() * options.length);
        el.disabled = true;
        C.sfx('playMissionPulse');
        const turns = document.body.classList.contains('calm') ? 0 : 5;
        document.querySelector('#wheel').style.transform = `rotate(${turns * 360 + 360 - (index + .5) * slice}deg)`;
        timer = setTimeout(() => {
          chosen = options[index];
          document.querySelector('#result').textContent = chosen.title;
          el.disabled = false; el.textContent = 'Let’s do it!';
          C.sfx('playStarEarned');
        }, turns ? 2700 : 100);
      }
    }
  };
});
})();
