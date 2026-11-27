// API used by the redesigned app. The original /api routes are left unchanged.
// Parent actions need the parent PIN (x-parent-pin header), which the app sends once unlocked.
const fs = require('fs');
const path = require('path');
const { run, get, all } = require('./db');
const ntfy = require('./ntfy');
const { DESIGN_ROOMS, WARDROBE } = require('./designRooms');
const { DEFAULT_ROOM_ITEMS } = require('./choreTemplates');
const { HttpError, makeRoute } = require('./http');
const billing = require('./billing');

const DEFAULT_PREFS = {
  general: { language: 'en' },
  alerts: { proof: true, sos: true, perk: true, summary: false },
  privacy: { deletePhotos: true, hideNames: false },
  cadet: { narration: true, calmMotion: false, reminders: true, shortOnly: false },
  rooms: {} // roomId: false hides a room from mission planning
};

async function addColumn(table, name, type) {
  const cols = await all(`PRAGMA table_info(${table})`);
  if (!cols.some(c => c.name === name)) await run(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
}

// Additive only: existing data is never rewritten or removed.
async function migrate() {
  await addColumn('kids', 'age', 'INTEGER');
  await addColumn('kids', 'look', 'TEXT');
  await addColumn('chores', 'scheduled_date', 'TEXT');
  await addColumn('chores', 'scheduled_time', 'TEXT');
  await addColumn('chores', 'repeat_days', 'TEXT');
  await addColumn('chores', 'is_paused', 'INTEGER DEFAULT 0');
  await addColumn('chores', 'redo_count', 'INTEGER DEFAULT 0');
  await addColumn('chores', 'is_early', 'INTEGER DEFAULT 0');
  await addColumn('chores', 'verified_together', 'INTEGER DEFAULT 0');
  await addColumn('chores', 'extra_round_used', 'INTEGER DEFAULT 0');
  await addColumn('chore_steps', 'quest_num', 'INTEGER');
  await addColumn('chore_steps', 'quest_title', 'TEXT');
  await addColumn('chore_steps', 'is_skipped', 'INTEGER DEFAULT 0');
  await addColumn('rewards', 'daily_limit', 'INTEGER DEFAULT 1');
  await addColumn('chores', 'reminded_on', 'TEXT');
  await run(`CREATE TABLE IF NOT EXISTS wardrobe_items (kid_id INTEGER NOT NULL, item_key TEXT NOT NULL, PRIMARY KEY (kid_id, item_key))`);
}

const json = (v, fallback) => { try { return JSON.parse(v) || fallback; } catch { return fallback; } };

async function getPrefs() {
  const row = await get(`SELECT value FROM settings WHERE key = 'app_prefs'`);
  const saved = json(row && row.value, {});
  const out = {};
  for (const k of Object.keys(DEFAULT_PREFS)) out[k] = { ...DEFAULT_PREFS[k], ...(saved[k] || {}) };
  return out;
}

async function setSetting(key, value) {
  await run(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]);
}

// Stars a mission is worth right now: 1 per finished quest, half for a skipped one.
function missionStars(chore, steps) {
  if (!steps.some(s => s.quest_num != null)) return chore.stars_reward || 0; // missions made by the old app
  const quests = new Map();
  for (const s of steps) quests.set(s.quest_num, [...(quests.get(s.quest_num) || []), s]);
  let total = 0;
  for (const q of quests.values()) {
    if (q.some(s => s.is_skipped)) total += 0.5;
    else if (q.every(s => s.is_completed)) total += 1;
  }
  return total;
}

const stepsOf = id => all(`SELECT * FROM chore_steps WHERE chore_id = ? ORDER BY step_num`, [id]);

async function getMission(id) {
  const m = await get(`SELECT c.*, k.name AS kid_name FROM chores c JOIN kids k ON k.id = c.kid_id WHERE c.id = ?`, [id]);
  if (!m) return null;
  m.steps = await stepsOf(id);
  m.stars = missionStars(m, m.steps);
  return m;
}

const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Repeating routines: when today is a repeat day, copy the finished mission as a fresh one.
let repeating = null;
function ensureRepeats() {
  if (!repeating) repeating = createRepeats().finally(() => { repeating = null; });
  return repeating;
}
async function createRepeats() {
  const today = localDate();
  const day = DAY_CODES[new Date().getDay()];
  const latest = await all(`SELECT * FROM chores WHERE id IN
    (SELECT MAX(id) FROM chores WHERE scheduled_date IS NOT NULL GROUP BY kid_id, room_template_id)`);
  for (const m of latest) {
    if (m.status !== 'completed' || m.scheduled_date >= today || !String(m.repeat_days || '').split(',').includes(day)) continue;
    const r = await run(`INSERT INTO chores (kid_id, room_template_id, room_name, title, stars_reward, status, scheduled_date, scheduled_time, repeat_days)
      SELECT kid_id, room_template_id, room_name, title, (SELECT COUNT(DISTINCT quest_num) FROM chore_steps WHERE chore_id = ?), 'assigned', ?, scheduled_time, repeat_days
      FROM chores WHERE id = ?`, [m.id, today, m.id]);
    await run(`INSERT INTO chore_steps (chore_id, step_num, text, popo_hint, pose, quest_num, quest_title)
      SELECT ?, step_num, text, popo_hint, pose, quest_num, quest_title FROM chore_steps WHERE chore_id = ?`, [r.lastID, m.id]);
  }
}

// Low Battery Mode shows only two quests: any already started, topped up to two.
function activeSteps(chore, steps) {
  if (!chore.is_low_battery || !steps.some(s => s.quest_num != null)) return steps;
  const nums = [...new Set(steps.map(s => s.quest_num))];
  const started = nums.filter(n => steps.some(s => s.quest_num === n && (s.is_completed || s.is_skipped)));
  const keep = new Set([...started, ...nums.filter(n => !started.includes(n))].slice(0, Math.max(2, started.length)));
  return steps.filter(s => keep.has(s.quest_num));
}

async function addDecorations(kidId) {
  if (await get(`SELECT id FROM room_decorations WHERE kid_id = ?`, [kidId])) return;
  for (const i of DEFAULT_ROOM_ITEMS) {
    await run(`INSERT INTO room_decorations (kid_id, item_key, item_name, icon, star_cost, is_unlocked, is_placed, x, y) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [kidId, i.item_key, i.item_name, i.icon, i.star_cost, i.x, i.y]);
  }
}

function register(app, { broadcastEvent, requirePin }) {
  const route = makeRoute(app, '/api/v2');
  const parent = makeRoute(app, '/api/v2', requirePin);
  const changed = (type, payload = {}) => broadcastEvent(type, payload);
  const need = async (id) => {
    const m = await getMission(id);
    if (!m) throw new HttpError(404, 'Mission not found');
    return m;
  };
  const alert = async (kidId, type, title, message, pref) => {
    const added = await run(`INSERT INTO alerts (kid_id, type, title, message) VALUES (?, ?, ?, ?)`, [kidId, type, title, message]);
    const prefs = await getPrefs();
    if (pref && prefs.alerts[pref]) {
      const kind = { proof: 'completion', sos: 'help', perk: 'reward' }[pref];
      ntfy.notifyParent(kind, prefs.privacy.hideNames ? 'CanDo!' : title, prefs.privacy.hideNames ? 'Open CanDo! to see what is new.' : message);
    }
    return added.lastID;
  };

  route('get', '/state', async () => {
    await ensureRepeats();
    for (const k of await all(`SELECT id FROM kids`)) await addDecorations(k.id);
    const [kids, owned, chores, steps, perks, requests, alerts, prefs, done, pin] = await Promise.all([
      all(`SELECT * FROM kids ORDER BY id`),
      all(`SELECT * FROM wardrobe_items`),
      all(`SELECT * FROM chores ORDER BY id DESC`),
      all(`SELECT * FROM chore_steps ORDER BY step_num`),
      all(`SELECT * FROM rewards ORDER BY star_cost`),
      all(`SELECT * FROM reward_redemptions ORDER BY id DESC`),
      all(`SELECT * FROM alerts ORDER BY id DESC LIMIT 60`),
      getPrefs(),
      get(`SELECT value FROM settings WHERE key = 'setup_complete'`),
      get(`SELECT value FROM settings WHERE key = 'parent_pin'`)
    ]);
    const decor = await all(`SELECT * FROM room_decorations ORDER BY star_cost`);
    for (const k of kids) {
      k.decor = decor.filter(d => d.kid_id === k.id);
      k.look = json(k.look, {});
      k.owned = owned.filter(o => o.kid_id === k.id).map(o => o.item_key);
    }
    for (const c of chores) {
      c.steps = steps.filter(s => s.chore_id === c.id);
      c.stars = missionStars(c, c.steps);
    }
    return {
      // A PIN counts as chosen once setup ran, or once it differs from the seeded default.
      pinSet: !!(done && done.value === '1') || !!(pin && pin.value !== '1234'),
      today: localDate(), kids, missions: chores, perks, requests, alerts, prefs, rooms: DESIGN_ROOMS, wardrobe: WARDROBE, billing: await billing.status()
    };
  });

  // First-run only. Changing an existing PIN goes through PUT /api/settings/pin.
  route('post', '/pin', async (req) => {
    const done = await get(`SELECT value FROM settings WHERE key = 'setup_complete'`);
    const cur = await get(`SELECT value FROM settings WHERE key = 'parent_pin'`);
    if ((done && done.value === '1') || (cur && cur.value !== '1234')) throw new HttpError(409, 'A PIN already exists');
    if (!/^\d{4}$/.test(String(req.body.pin))) throw new HttpError(400, 'PIN must be exactly 4 digits');
    await setSetting('parent_pin', String(req.body.pin));
    await setSetting('setup_complete', '1');
  });

  const cleanKid = (b) => {
    const name = String(b.name || '').trim().slice(0, 30);
    if (!name) throw new HttpError(400, 'Please enter a name');
    const age = parseInt(b.age, 10);
    return { name, age: age > 0 && age < 100 ? age : null, avatar: String(b.avatar || 'bear').slice(0, 200) };
  };
  parent('post', '/kids', async (req) => {
    const k = cleanKid(req.body);
    const r = await run(`INSERT INTO kids (name, age, avatar, color, stars) VALUES (?, ?, ?, '#70459E', 0)`, [k.name, k.age, k.avatar]);
    changed('kid_created');
    return { id: r.lastID };
  });
  parent('put', '/kids/:id', async (req) => {
    const k = cleanKid(req.body);
    await run(`UPDATE kids SET name = ?, age = ?, avatar = ? WHERE id = ?`, [k.name, k.age, k.avatar, req.params.id]);
    changed('kid_updated');
  });
  parent('delete', '/kids/:id', async (req) => {
    const id = req.params.id;
    await run(`DELETE FROM chore_steps WHERE chore_id IN (SELECT id FROM chores WHERE kid_id = ?)`, [id]);
    for (const t of ['chores', 'alerts', 'reward_redemptions', 'wardrobe_items', 'room_decorations']) {
      await run(`DELETE FROM ${t} WHERE kid_id = ?`, [id]);
    }
    await run(`DELETE FROM kids WHERE id = ?`, [id]);
    changed('kid_removed');
  });

  parent('post', '/missions', async (req) => {
    const { kid_id, room_id, quests, date, time, repeat } = req.body;
    const room = DESIGN_ROOMS.find(r => r.id === room_id);
    if (!room) throw new HttpError(400, 'Unknown room');
    if (!(await billing.canUseRoom(room.id))) throw new HttpError(402, 'This room needs Family Plus');
    const short = (await getPrefs()).cadet.shortOnly;
    if (!(await get(`SELECT id FROM kids WHERE id = ?`, [kid_id]))) throw new HttpError(404, 'Cadet not found');
    const picked = [...new Set(quests || [])].filter(i => room.quests[i]).sort((a, b) => a - b).slice(0, 5);
    if (!picked.length) throw new HttpError(400, 'Pick at least one chore');
    const r = await run(`INSERT INTO chores (kid_id, room_template_id, room_name, title, stars_reward, status, scheduled_date, scheduled_time, repeat_days)
      VALUES (?, ?, ?, ?, ?, 'assigned', ?, ?, ?)`,
      [kid_id, room.id, room.name, room.planet, picked.length, date || null, time || null, (repeat || []).join(',')]);
    let stepNum = 0;
    for (const [qi, index] of picked.entries()) {
      const quest = room.quests[index];
      // "Short missions only" keeps every quest to one step, so a mission is at most 5 steps.
      for (const [text, hint, pose] of short && quest.steps.length > 1 ? [[`${quest.title}.`, null, quest.steps[0][2]]] : quest.steps) {
        await run(`INSERT INTO chore_steps (chore_id, step_num, text, popo_hint, pose, quest_num, quest_title) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [r.lastID, ++stepNum, text, hint, pose, qi + 1, quest.title]);
      }
    }
    changed('chore_assigned', { kid_id });
    return { id: r.lastID };
  });

  parent('post', '/missions/:id/pause', async (req) => {
    await run(`UPDATE chores SET is_paused = ? WHERE id = ?`, [req.body.paused ? 1 : 0, req.params.id]);
    changed('mission_changed');
  });

  route('post', '/missions/:id/step', async (req) => {
    const m = await need(req.params.id);
    if (m.status === 'completed' || m.status === 'pending_approval') throw new HttpError(409, 'Mission already sent');
    await run(`UPDATE chore_steps SET is_completed = ? WHERE chore_id = ? AND step_num = ?`, [req.body.done ? 1 : 0, m.id, req.body.step_num]);
    await run(`UPDATE chores SET status = CASE WHEN status = 'assigned' THEN 'in_progress' ELSE status END, current_step = ? WHERE id = ?`, [req.body.step_num, m.id]);
    changed('mission_changed');
  });

  // Skip a quest (half star waits), or win it back with a grown-up.
  route('post', '/missions/:id/quest', async (req) => {
    const m = await need(req.params.id);
    if (m.status === 'completed' || m.status === 'pending_approval') throw new HttpError(409, 'Mission already sent');
    const skipped = req.body.skipped ? 1 : 0;
    await run(`UPDATE chore_steps SET is_skipped = ?, is_completed = ? WHERE chore_id = ? AND quest_num = ?`, [skipped, skipped ? 0 : 1, m.id, req.body.quest_num]);
    changed('mission_changed');
  });

  route('post', '/missions/:id/low-battery', async (req) => {
    await run(`UPDATE chores SET is_low_battery = ? WHERE id = ? AND status IN ('assigned', 'in_progress')`, [req.body.on ? 1 : 0, req.params.id]);
    changed('mission_changed');
  });

  route('post', '/missions/:id/help', async (req) => {
    const m = await need(req.params.id);
    const id = await alert(m.kid_id, 'help', `${m.kid_name} needs help`, `${m.kid_name} · ${m.title} · Step ${parseInt(req.body.step_num, 10) || 1}`, 'sos');
    changed('alert');
    return { alertId: id };
  });

  route('post', '/missions/:id/extra-round', async (req) => {
    const r = await run(`UPDATE chores SET extra_round_used = 1 WHERE id = ? AND extra_round_used = 0`, [req.params.id]);
    if (!r.changes) throw new HttpError(409, 'Extra round already used');
  });

  route('post', '/missions/:id/submit', async (req) => {
    const m = await need(req.params.id);
    if (!['assigned', 'in_progress', 'needs_fixing'].includes(m.status)) throw new HttpError(409, 'Mission already sent');
    const match = String(req.body.photo || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw new HttpError(400, 'A photo is needed');
    const dir = path.join(__dirname, '..', 'public', 'uploads');
    const file = `proof-${Date.now()}-${Math.round(Math.random() * 1e6)}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(match[2], 'base64'));
    const early = m.status !== 'needs_fixing' && activeSteps(m, m.steps).some(s => !s.is_completed && !s.is_skipped);
    await run(`UPDATE chores SET status = 'pending_approval', proof_photo = ?, is_early = ? WHERE id = ?`, [`uploads/${file}`, early || m.is_early ? 1 : 0, m.id]);
    await alert(m.kid_id, 'completion', `${m.kid_name} sent a photo`, `${m.kid_name} finished ${m.title}. Check the photo proof.`, 'proof');
    changed('mission_completed');
    return getMission(m.id);
  });

  parent('post', '/missions/:id/verify', async (req) => {
    const m = await need(req.params.id);
    // Conditional update so a double tap can never award stars twice.
    const r = await run(`UPDATE chores SET status = 'completed', completed_at = CURRENT_TIMESTAMP, verified_together = ?, stars_reward = ?
      WHERE id = ? AND status IN ('pending_approval', 'needs_fixing')`, [req.body.together ? 1 : 0, m.stars, m.id]);
    if (!r.changes) throw new HttpError(409, 'This photo was already reviewed');
    await run(`UPDATE kids SET stars = stars + ? WHERE id = ?`, [m.stars, m.kid_id]);
    await alert(m.kid_id, 'approval', `${m.kid_name} finished ${m.room_name}`, `+${m.stars} stars released.`);
    changed('chore_approved', { kidId: m.kid_id, stars: m.stars });
    return { stars: m.stars };
  });

  parent('post', '/missions/:id/needs-fixing', async (req) => {
    const r = await run(`UPDATE chores SET status = 'needs_fixing', redo_count = 1 WHERE id = ? AND status = 'pending_approval' AND redo_count = 0`, [req.params.id]);
    if (!r.changes) throw new HttpError(409, 'The one retry is already used. Check it together instead.');
    changed('chore_redo');
  });

  // Stop a routine repeating; finished missions stay in the history.
  parent('post', '/routines/stop', async (req) => {
    await run(`UPDATE chores SET repeat_days = '' WHERE kid_id = ? AND room_template_id = ?`, [req.body.kid_id, req.body.room_id]);
    changed('mission_changed');
  });

  parent('post', '/perks', async (req) => {
    const title = String(req.body.title || '').trim().slice(0, 40);
    const cost = parseInt(req.body.cost, 10);
    if (!title || !(cost > 0)) throw new HttpError(400, 'A perk needs a name and a star price');
    await run(`INSERT INTO rewards (title, icon, star_cost, description, daily_limit) VALUES (?, '🎁', ?, '', ?)`,
      [title, cost, Math.max(1, parseInt(req.body.limit, 10) || 1)]);
    changed('perks_changed');
  });
  parent('delete', '/perks/:id', async (req) => {
    await run(`DELETE FROM rewards WHERE id = ?`, [req.params.id]);
    changed('perks_changed');
  });

  // Stars are held (escrow) as soon as the cadet asks.
  route('post', '/perks/:id/request', async (req) => {
    const perk = await get(`SELECT * FROM rewards WHERE id = ?`, [req.params.id]);
    const kid = await get(`SELECT * FROM kids WHERE id = ?`, [req.body.kid_id]);
    if (!perk || !kid) throw new HttpError(404, 'Not found');
    const today = await get(`SELECT COUNT(*) c FROM reward_redemptions WHERE kid_id = ? AND reward_id = ? AND status != 'denied'
      AND date(created_at, 'localtime') = date('now', 'localtime')`, [kid.id, perk.id]);
    if (today.c >= (perk.daily_limit || 1)) throw new HttpError(429, 'cap');
    const paid = await run(`UPDATE kids SET stars = stars - ? WHERE id = ? AND stars >= ?`, [perk.star_cost, kid.id, perk.star_cost]);
    if (!paid.changes) throw new HttpError(400, 'Not enough stars yet');
    await run(`INSERT INTO reward_redemptions (kid_id, reward_id, title, star_cost, status) VALUES (?, ?, ?, ?, 'pending')`, [kid.id, perk.id, perk.title, perk.star_cost]);
    await alert(kid.id, 'reward', `${kid.name} wants ${perk.title}`, `${kid.name} asked for ${perk.title} (${perk.star_cost} stars).`, 'perk');
    changed('reward_claimed');
  });
  parent('post', '/requests/:id/decide', async (req) => {
    const row = await get(`SELECT * FROM reward_redemptions WHERE id = ?`, [req.params.id]);
    const r = await run(`UPDATE reward_redemptions SET status = ? WHERE id = ? AND status = 'pending'`, [req.body.approve ? 'approved' : 'denied', req.params.id]);
    if (!r.changes) throw new HttpError(409, 'Already decided');
    if (!req.body.approve) await run(`UPDATE kids SET stars = stars + ? WHERE id = ?`, [row.star_cost, row.kid_id]);
    changed('reward_decided');
  });
  // Commander's Key: only a parent can use up a perk.
  parent('post', '/requests/:id/use', async (req) => {
    const r = await run(`UPDATE reward_redemptions SET status = 'used' WHERE id = ? AND status = 'approved'`, [req.params.id]);
    if (!r.changes) throw new HttpError(409, 'This perk is not ready to use');
    changed('reward_used');
  });

  route('post', '/wardrobe/:kidId/buy', async (req) => {
    const item = WARDROBE.find(i => i.key === req.body.item);
    if (!item) throw new HttpError(404, 'Unknown item');
    const added = await run(`INSERT OR IGNORE INTO wardrobe_items (kid_id, item_key) VALUES (?, ?)`, [req.params.kidId, item.key]);
    if (!added.changes) throw new HttpError(409, 'Already yours');
    const paid = await run(`UPDATE kids SET stars = stars - ? WHERE id = ? AND stars >= ?`, [item.cost, req.params.kidId, item.cost]);
    if (!paid.changes) {
      await run(`DELETE FROM wardrobe_items WHERE kid_id = ? AND item_key = ?`, [req.params.kidId, item.key]);
      throw new HttpError(400, 'Not enough stars yet');
    }
    changed('wardrobe_changed');
  });
  route('put', '/wardrobe/:kidId/look', async (req) => {
    const owned = (await all(`SELECT item_key FROM wardrobe_items WHERE kid_id = ?`, [req.params.kidId])).map(r => r.item_key);
    const look = {};
    for (const slot of ['wear', 'backdrop']) if (owned.includes(req.body[slot])) look[slot] = req.body[slot];
    await run(`UPDATE kids SET look = ? WHERE id = ?`, [JSON.stringify(look), req.params.kidId]);
    changed('wardrobe_changed');
  });

  parent('put', '/prefs', async (req) => {
    const prefs = await getPrefs();
    for (const k of Object.keys(DEFAULT_PREFS)) Object.assign(prefs[k], req.body[k] || {});
    await setSetting('app_prefs', JSON.stringify(prefs));
    changed('prefs_changed');
  });
  parent('delete', '/alerts/:id', async (req) => {
    await run(`DELETE FROM alerts WHERE id = ?`, [req.params.id]);
  });
}

// Privacy setting: delete proof photos 24 hours after they were reviewed.
async function purgeOldProofs() {
  if (!(await getPrefs()).privacy.deletePhotos) return;
  const rows = await all(`SELECT id, proof_photo FROM chores WHERE status = 'completed' AND scheduled_date IS NOT NULL
    AND proof_photo LIKE 'uploads/proof-%' AND completed_at < datetime('now', '-1 day')`);
  for (const r of rows) {
    fs.rmSync(path.join(__dirname, '..', 'public', 'uploads', path.basename(r.proof_photo)), { force: true });
    await run(`UPDATE chores SET proof_photo = NULL WHERE id = ?`, [r.id]);
  }
}

module.exports = { register, migrate, purgeOldProofs, getPrefs, localDate };
