// Parent email account, password reset, PIN reset by email, Google and Apple sign-in.
// One account per family server.
const crypto = require('crypto');
const { run, get } = require('./db');
const mailer = require('./mailer');
const { HttpError, makeRoute } = require('./http');

const MIN = 60 * 1000;
const sha = v => crypto.createHash('sha256').update(String(v)).digest('hex');
const publicUrl = () => String(process.env.PUBLIC_URL || '').replace(/\/+$/, '');
const emailReady = () => mailer.configured();
const googleReady = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && publicUrl());
const appleReady = () => !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY && publicUrl());

async function migrate() {
  await run(`CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY CHECK (id = 1), email TEXT NOT NULL, password_hash TEXT, provider TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
}
const getAccount = () => get(`SELECT * FROM accounts WHERE id = 1`);

// ---------- passwords ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return `${salt.toString('hex')}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function passwordMatches(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  return crypto.timingSafeEqual(crypto.scryptSync(String(password), Buffer.from(salt, 'hex'), 64), Buffer.from(hash, 'hex'));
}
function checkPassword(p) {
  if (String(p || '').length < 8 || !/\d/.test(p) || !/[^A-Za-z0-9]/.test(p)) throw new HttpError(400, 'Use 8+ characters with 1 number and 1 symbol');
  if (String(p).length > 200) throw new HttpError(400, 'That password is too long');
}
function cleanEmail(v) {
  const email = String(v || '').trim().toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 254) throw new HttpError(400, 'Enter a valid email address');
  return email;
}

// ---------- short-lived one-time tokens (kept in memory: a restart cancels them) ----------
const tokens = new Map();
function issue(kind, data = {}, minutes = 10) {
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(sha(token), { kind, data, expires: Date.now() + minutes * MIN });
  return token;
}
function peek(kind, token) {
  const t = tokens.get(sha(token));
  if (!t || t.kind !== kind || t.expires < Date.now()) throw new HttpError(400, 'This link or session has expired. Please start again.');
  return t.data;
}
function consume(kind, token) { const data = peek(kind, token); tokens.delete(sha(token)); return data; }

const hits = new Map();
function limit(key, max, windowMin) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => t > now - windowMin * MIN);
  if (list.length >= max) throw new HttpError(429, 'Too many tries. Please wait a few minutes.');
  list.push(now);
  hits.set(key, list);
}

let pinCode = null; // { hash, expires, tries }

async function currentPin() {
  const row = await get(`SELECT value FROM settings WHERE key = 'parent_pin'`);
  const done = await get(`SELECT value FROM settings WHERE key = 'setup_complete'`);
  const value = row ? row.value : '1234';
  return { value, chosen: !!(done && done.value === '1') || value !== '1234' };
}
// Linking an email to a family that already has a PIN needs that PIN. Otherwise a stranger
// with the server link could register their own email and reset the PIN with it.
async function requireOwner(pin) {
  const cur = await currentPin();
  if (!cur.chosen) return;
  limit('owner-pin', 10, 15);
  if (String(pin || '') !== cur.value) throw new HttpError(401, 'Enter your current HQ PIN to link an email');
}
async function createAccount(email, passwordHash, provider) {
  const r = await run(`INSERT OR IGNORE INTO accounts (id, email, password_hash, provider) VALUES (1, ?, ?, ?)`, [email, passwordHash, provider]);
  if (!r.changes) throw new HttpError(409, 'This family already has an account. Log in instead.');
}
const mask = e => e.replace(/^(.)(.*)(@.*)$/, (m, a, b, c) => a + '•'.repeat(Math.min(6, b.length)) + c);

// ---------- Google / Apple ----------
const b64url = v => Buffer.from(v).toString('base64url');
function appleSecret() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: process.env.APPLE_KEY_ID }));
  const body = b64url(JSON.stringify({ iss: process.env.APPLE_TEAM_ID, iat: now, exp: now + 300, aud: 'https://appleid.apple.com', sub: process.env.APPLE_CLIENT_ID }));
  const key = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  return `${head}.${body}.${crypto.sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
}
const PROVIDERS = {
  google: {
    ready: googleReady, auth: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token',
    issuers: ['https://accounts.google.com', 'accounts.google.com'], clientId: () => process.env.GOOGLE_CLIENT_ID, secret: () => process.env.GOOGLE_CLIENT_SECRET,
    extra: { scope: 'openid email', prompt: 'select_account' }, sameSite: 'Lax'
  },
  apple: {
    ready: appleReady, auth: 'https://appleid.apple.com/auth/authorize', token: 'https://appleid.apple.com/auth/token',
    issuers: ['https://appleid.apple.com'], clientId: () => process.env.APPLE_CLIENT_ID, secret: appleSecret,
    extra: { scope: 'email', response_mode: 'form_post' }, sameSite: 'None' // Apple posts back cross-site
  }
};

function register(app) {
  const route = makeRoute(app, '/api/v2/auth');

  route('get', '/status', async () => {
    const a = await getAccount();
    return { hasAccount: !!a, email: a ? mask(a.email) : null, smtp: emailReady(), links: emailReady() && !!publicUrl(), google: googleReady(), apple: appleReady() };
  });

  route('post', '/signup', async (req) => {
    const email = cleanEmail(req.body.email);
    checkPassword(req.body.password);
    if (await getAccount()) throw new HttpError(409, 'This family already has an account. Log in instead.');
    await requireOwner(req.body.pin);
    await createAccount(email, hashPassword(req.body.password), 'password');
    return { session: issue('session') };
  });

  route('post', '/login', async (req) => {
    limit('login', 10, 15);
    const a = await getAccount();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!a || a.email !== email || !passwordMatches(req.body.password, a.password_hash)) throw new HttpError(403, 'Wrong email or password');
    return { session: issue('session') };
  });

  // A fresh login (or emailed code) allows choosing a new PIN.
  route('post', '/new-pin', async (req) => {
    if (!/^\d{4}$/.test(String(req.body.pin))) throw new HttpError(400, 'PIN must be exactly 4 digits');
    consume('session', req.body.session);
    for (const [k, v] of [['parent_pin', String(req.body.pin)], ['setup_complete', '1']]) {
      await run(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [k, v]);
    }
  });

  // Same answer whether or not the address matches, so addresses cannot be guessed.
  route('post', '/forgot-password', async (req) => {
    if (!emailReady() || !publicUrl()) throw new HttpError(503, 'Password reset email is not set up on this server (see SETUP.md)');
    const email = cleanEmail(req.body.email);
    limit('mail', 5, 60);
    const a = await getAccount();
    if (a && a.email === email) {
      // The link is built from PUBLIC_URL, never from request headers.
      const token = issue('password', {}, 15);
      await mailer.send(a.email, 'Reset your CanDo! password', `Open this link to choose a new password. It works once and expires in 15 minutes.\n\n${publicUrl()}/#a.newpassword?token=${token}\n\nIf you did not ask for this, ignore this email.`);
    }
  });

  route('post', '/reset-password', async (req) => {
    checkPassword(req.body.password);
    consume('password', req.body.token);
    await run(`UPDATE accounts SET password_hash = ? WHERE id = 1`, [hashPassword(req.body.password)]);
  });

  route('post', '/pin-code', async (req) => {
    if (!emailReady()) throw new HttpError(503, 'PIN reset email is not set up on this server (see SETUP.md)');
    const email = cleanEmail(req.body.email);
    limit('mail', 5, 60);
    const a = await getAccount();
    if (a && a.email === email) {
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      pinCode = { hash: sha(code), expires: Date.now() + 15 * MIN, tries: 0 };
      await mailer.send(a.email, 'Your CanDo! PIN reset code', `Your code is ${code}\n\nIt works once and expires in 15 minutes. If you did not ask for this, ignore this email.`);
    }
  });

  route('post', '/pin-code/check', async (req) => {
    if (!pinCode || pinCode.expires < Date.now() || ++pinCode.tries > 5) { pinCode = null; throw new HttpError(400, 'That code has expired. Ask for a new one.'); }
    if (sha(String(req.body.code || '')) !== pinCode.hash) throw new HttpError(403, 'That code is not right');
    pinCode = null;
    return { session: issue('session') };
  });

  route('delete', '/account', async (req) => {
    await requireOwner(req.get('x-parent-pin'));
    await run(`DELETE FROM accounts`);
  });

  // ---------- OAuth ----------
  for (const [name, p] of Object.entries(PROVIDERS)) {
    const redirectUri = () => `${publicUrl()}/api/v2/auth/${name}/callback`;
    app.get(`/api/v2/auth/${name}/start`, (req, res) => {
      if (!p.ready()) return res.status(503).send('This sign-in method is not set up. See SETUP.md.');
      const state = issue(`state-${name}`);
      res.setHeader('Set-Cookie', `cando_oauth=${state}; Path=/api/v2/auth; Max-Age=600; HttpOnly; SameSite=${p.sameSite}${publicUrl().startsWith('https') ? '; Secure' : ''}`);
      res.redirect(`${p.auth}?${new URLSearchParams({ client_id: p.clientId(), redirect_uri: redirectUri(), response_type: 'code', state, ...p.extra })}`);
    });
    const callback = async (req, res) => {
      const fail = msg => res.redirect(`${publicUrl()}/#a.oauth?error=${encodeURIComponent(msg)}`);
      try {
        if (!p.ready()) return res.status(503).send('Not set up');
        const input = req.method === 'POST' ? req.body : req.query;
        const cookie = /(?:^|;\s*)cando_oauth=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
        if (!input.state || input.state !== cookie) return fail('Sign-in expired. Please try again.');
        consume(`state-${name}`, input.state);
        const r = await fetch(p.token, { method: 'POST', body: new URLSearchParams({ grant_type: 'authorization_code', code: String(input.code || ''), client_id: p.clientId(), client_secret: p.secret(), redirect_uri: redirectUri() }), signal: AbortSignal.timeout(10000) });
        const body = await r.json();
        if (!r.ok || !body.id_token) return fail('The sign-in was not accepted.');
        // The ID token came straight from the provider over TLS, so its claims can be read directly.
        const claims = JSON.parse(Buffer.from(body.id_token.split('.')[1], 'base64url'));
        if (claims.aud !== p.clientId() || !p.issuers.includes(claims.iss) || claims.exp * 1000 < Date.now() || !claims.email || String(claims.email_verified) !== 'true') return fail('The sign-in could not be verified.');
        const email = String(claims.email).toLowerCase();
        const a = await getAccount();
        if (a && a.email !== email) return fail('That is not the email linked to this family.');
        res.redirect(`${publicUrl()}/#a.oauth?token=${issue('oauth', { email, provider: name })}`);
      } catch (err) {
        console.warn(`[auth] ${name} sign-in failed:`, err.message);
        fail('Sign-in failed. Please try again.');
      }
    };
    app.get(`/api/v2/auth/${name}/callback`, callback);
    app.post(`/api/v2/auth/${name}/callback`, callback);
  }

  route('post', '/oauth-finish', async (req) => {
    const { email, provider } = peek('oauth', req.body.token);
    const a = await getAccount();
    if (!a) {
      const cur = await currentPin();
      if (cur.chosen && !req.body.pin) return { needsPin: true };
      await requireOwner(req.body.pin);
      await createAccount(email, null, provider);
    } else if (a.email !== email) throw new HttpError(403, 'That is not the email linked to this family.');
    consume('oauth', req.body.token);
    return { session: issue('session') };
  });
}

module.exports = { register, migrate, getAccount, emailReady };
