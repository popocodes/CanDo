/**
 * ntfy push notifications (https://ntfy.sh)
 * Uses the JSON publish API so emoji / unicode titles work reliably.
 * Works with the public ntfy.sh server or a self-hosted instance.
 */
const { get, run } = require('./db');

const KEYS = ['ntfy_enabled', 'ntfy_server', 'ntfy_topic', 'ntfy_token', 'ntfy_click_url', 'ntfy_events'];
const DEFAULT_EVENTS = ['completion', 'distraction', 'reward', 'help'];

async function getConfig() {
  const cfg = {};
  for (const k of KEYS) {
    const row = await get(`SELECT value FROM settings WHERE key = ?`, [k]);
    cfg[k] = row ? row.value : '';
  }
  return {
    enabled: cfg.ntfy_enabled === '1',
    server: (cfg.ntfy_server || 'https://ntfy.sh').replace(/\/+$/, ''),
    topic: cfg.ntfy_topic || '',
    token: cfg.ntfy_token || '',
    clickUrl: cfg.ntfy_click_url || '',
    events: cfg.ntfy_events ? cfg.ntfy_events.split(',').filter(Boolean) : DEFAULT_EVENTS
  };
}

async function saveConfig(body) {
  const map = {
    ntfy_enabled: body.enabled ? '1' : '0',
    ntfy_server: String(body.server || 'https://ntfy.sh').trim(),
    ntfy_topic: String(body.topic || '').trim(),
    ntfy_click_url: String(body.clickUrl || '').trim(),
    ntfy_events: Array.isArray(body.events) ? body.events.join(',') : DEFAULT_EVENTS.join(',')
  };
  // Only overwrite token if one was provided (UI never receives the stored token back)
  if (typeof body.token === 'string' && body.token !== '') map.ntfy_token = body.token.trim();
  if (body.clearToken) map.ntfy_token = '';

  for (const [k, v] of Object.entries(map)) {
    await run(`INSERT INTO settings (key, value) VALUES (?, ?)
               ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [k, v]);
  }
}

const TYPE_META = {
  completion: { priority: 4, tags: ['camera', 'white_check_mark'] },
  distraction: { priority: 4, tags: ['rotating_light'] },
  reward: { priority: 3, tags: ['gift'] },
  help: { priority: 5, tags: ['sos'] },
  test: { priority: 3, tags: ['cat', 'rocket'] }
};

async function publish(cfg, { title, message, type = 'test' }) {
  if (!cfg.topic) throw new Error('ntfy topic is not set');
  const meta = TYPE_META[type] || { priority: 3, tags: ['bell'] };
  const payload = {
    topic: cfg.topic,
    title,
    message,
    priority: meta.priority,
    tags: meta.tags
  };
  if (cfg.clickUrl) payload.click = cfg.clickUrl;

  const headers = { 'Content-Type': 'application/json' };
  if (cfg.token) {
    // "user:password" -> Basic, otherwise treat as access token (Bearer)
    headers.Authorization = cfg.token.includes(':')
      ? 'Basic ' + Buffer.from(cfg.token).toString('base64')
      : 'Bearer ' + cfg.token;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(cfg.server, { method: 'POST', headers, body: JSON.stringify(payload), signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ntfy responded ${res.status} ${text.slice(0, 120)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

/** Fire-and-forget: never throws, never blocks the request. */
function notifyParent(type, title, message) {
  getConfig().then(cfg => {
    if (!cfg.enabled || !cfg.topic || !cfg.events.includes(type)) return;
    return publish(cfg, { title, message, type });
  }).catch(err => console.warn('[ntfy] send failed:', err.message));
}

module.exports = { getConfig, saveConfig, publish, notifyParent, DEFAULT_EVENTS };
