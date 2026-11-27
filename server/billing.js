// Family Plus subscription through Stripe Checkout. Rooms are only locked when PAYWALL=on.
const { run, get } = require('./db');
const { HttpError, makeRoute } = require('./http');

const FREE_ROOMS = ['bedroom'];
const paywall = () => process.env.PAYWALL === 'on';
const ready = () => !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_MONTHLY && process.env.STRIPE_PRICE_YEARLY && process.env.PUBLIC_URL);

const read = async key => (await get(`SELECT value FROM settings WHERE key = ?`, [key]))?.value;
const write = (key, value) => run(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]);

async function stripe(path, params) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    body: params ? new URLSearchParams(params) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  const body = await r.json();
  if (!r.ok) throw new Error(`Stripe: ${body.error?.message || r.status}`);
  return body;
}

let checked = 0;
async function subscribed() {
  const id = await read('stripe_subscription');
  if (!id) return false;
  if (ready() && Date.now() - checked > 6 * 3600 * 1000) {
    try {
      const sub = await stripe(`subscriptions/${encodeURIComponent(id)}`);
      await write('stripe_status', sub.status);
      checked = Date.now();
    } catch (err) { console.warn('[billing] status check failed:', err.message); }
  }
  return ['active', 'trialing'].includes(await read('stripe_status'));
}

async function status() {
  const active = paywall() ? await subscribed() : false;
  return { paywall: paywall(), ready: ready(), subscribed: active, freeRooms: FREE_ROOMS };
}
async function canUseRoom(id) { return !paywall() || FREE_ROOMS.includes(id) || subscribed(); }

function register(app, { requirePin }) {
  const route = makeRoute(app, '/api/v2/billing');
  makeRoute(app, '/api/v2/billing', requirePin)('post', '/checkout', async (req) => {
    if (!ready()) throw new HttpError(503, 'Payments are not set up on this server (see SETUP.md)');
    const base = process.env.PUBLIC_URL.replace(/\/+$/, '');
    const session = await stripe('checkout/sessions', {
      mode: 'subscription',
      'line_items[0][price]': req.body.plan === 'monthly' ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY,
      'line_items[0][quantity]': '1',
      'metadata[app]': 'cando',
      success_url: `${base}/#a.paid?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#role`
    });
    return { url: session.url };
  });
  route('post', '/confirm', async (req) => {
    if (!ready()) throw new HttpError(503, 'Payments are not set up on this server');
    const id = String(req.body.session || '');
    if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new HttpError(400, 'Unknown payment session');
    const s = await stripe(`checkout/sessions/${id}`);
    if (s.metadata?.app !== 'cando' || s.status !== 'complete' || !s.subscription) throw new HttpError(402, 'The payment is not complete yet');
    await write('stripe_subscription', String(s.subscription));
    await write('stripe_status', 'active');
    checked = 0;
    return status();
  });
}

module.exports = { register, status, canUseRoom };
