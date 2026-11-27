// Optional settings (email, sign-in, payments) are read from .env. See SETUP.md.
try { process.loadEnvFile(require('path').join(__dirname, '..', '.env')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ROOM_TEMPLATES, DEFAULT_ROOM_ITEMS } = require('./choreTemplates');
const os = require('os');
const { run, get, all, initDb, assignTemplateChore } = require('./db');
const ntfy = require('./ntfy');
const v2 = require('./v2');
const accounts = require('./accounts');
const billing = require('./billing');
const schedule = require('./schedule');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // set HOST=127.0.0.1 to restrict to this computer

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for proof photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `proof-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});
const upload = multer({ storage });

// Serve CanDo APK directly from Desktop
app.get('/CanDo.apk', (req, res) => {
  res.download(path.join(__dirname, '..', '..', 'CanDo.apk'), 'CanDo.apk');
});

// Serve static frontend files and root assets
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Server-Sent Events (SSE) connections for live parent alerts
const sseClients = new Set();

function broadcastEvent(type, payload) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { id: Date.now(), res };
  sseClients.add(client);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'CanDo! Live Event Stream Connected' })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
});


// --- PIN helper ---
async function pinIsValid(pin) {
  const row = await get(`SELECT value FROM settings WHERE key = 'parent_pin'`);
  return String(pin || '').trim() === String(row ? row.value : '1234');
}
async function requirePin(req, res, next) {
  try {
    if (await pinIsValid(req.get('x-parent-pin'))) return next();
    res.status(401).json({ error: 'Parent PIN required' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function lanUrls() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) out.push(`http://${i.address}:${PORT}`);
    }
  }
  return out;
}

// --- SETUP WIZARD API ---
app.get('/api/setup/status', async (req, res) => {
  try {
    const done = await get(`SELECT value FROM settings WHERE key = 'setup_complete'`);
    const family = await get(`SELECT value FROM settings WHERE key = 'family_name'`);
    const cfg = await ntfy.getConfig();
    res.json({
      setupComplete: !!(done && done.value === '1'),
      familyName: family ? family.value : '',
      lanUrls: lanUrls(),
      ntfy: { enabled: cfg.enabled, server: cfg.server, topic: cfg.topic, clickUrl: cfg.clickUrl, events: cfg.events, hasToken: !!cfg.token }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/setup', async (req, res) => {
  try {
    const done = await get(`SELECT value FROM settings WHERE key = 'setup_complete'`);
    if (done && done.value === '1' && !(await pinIsValid(req.get('x-parent-pin')))) {
      return res.status(401).json({ error: 'Setup already completed. Enter the current parent PIN to change it.' });
    }
    const { pin, familyName, notifications, kids } = req.body;
    if (pin !== undefined && pin !== '') {
      if (!/^\d{4}$/.test(String(pin))) return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      await run(`INSERT INTO settings (key, value) VALUES ('parent_pin', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [String(pin)]);
    }
    if (familyName) {
      await run(`INSERT INTO settings (key, value) VALUES ('family_name', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [String(familyName).trim().slice(0, 40)]);
    }
    if (notifications) await ntfy.saveConfig(notifications);

    const created = [];
    for (const k of Array.isArray(kids) ? kids : []) {
      if (!k || !String(k.name || '').trim()) continue;
      created.push(await createKid(String(k.name).trim().slice(0, 30), k.avatar, k.color));
    }
    await run(`INSERT INTO settings (key, value) VALUES ('setup_complete', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
    res.json({ success: true, kids: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NTFY NOTIFICATION SETTINGS (PIN protected) ---
app.get('/api/ntfy', requirePin, async (req, res) => {
  const cfg = await ntfy.getConfig();
  res.json({ enabled: cfg.enabled, server: cfg.server, topic: cfg.topic, clickUrl: cfg.clickUrl, events: cfg.events, hasToken: !!cfg.token, lanUrls: lanUrls() });
});

app.put('/api/ntfy', requirePin, async (req, res) => {
  try {
    await ntfy.saveConfig(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test with the values currently typed in the form (falls back to saved token)
app.post('/api/ntfy/test', async (req, res) => {
  try {
    const done = await get(`SELECT value FROM settings WHERE key = 'setup_complete'`);
    if (done && done.value === '1' && !(await pinIsValid(req.get('x-parent-pin')))) {
      return res.status(401).json({ error: 'Parent PIN required' });
    }
    const saved = await ntfy.getConfig();
    const b = req.body || {};
    const cfg = {
      server: String(b.server || saved.server || 'https://ntfy.sh').trim().replace(/\/+$/, ''),
      topic: String(b.topic || saved.topic || '').trim(),
      token: b.token ? String(b.token).trim() : saved.token,
      clickUrl: String(b.clickUrl || saved.clickUrl || '').trim()
    };
    await ntfy.publish(cfg, {
      title: '🐱 CanDo! test notification',
      message: 'Popo says hi! Parent notifications are working.',
      type: 'test'
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- PARENT DASHBOARD STATS ---
app.get('/api/stats', async (req, res) => {
  try {
    const pending = await get(`SELECT COUNT(*) c FROM chores WHERE status = 'pending_approval'`);
    const week = await get(`SELECT COUNT(*) c, COALESCE(SUM(stars_reward),0) s FROM chores WHERE status = 'completed' AND completed_at >= datetime('now', '-7 days')`);
    const distr = await get(`SELECT COUNT(*) c FROM alerts WHERE type = 'distraction' AND created_at >= datetime('now', 'start of day')`);
    const claims = await get(`SELECT COUNT(*) c FROM reward_redemptions WHERE status = 'pending'`);
    res.json({
      pendingApprovals: pending.c,
      completedThisWeek: week.c,
      starsAwardedThisWeek: week.s,
      distractionsToday: distr.c,
      pendingRewardClaims: claims.c
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function createKid(name, avatar, color) {
  const result = await run(`INSERT INTO kids (name, avatar, color, stars) VALUES (?, ?, ?, 0)`,
    [name, avatar || 'assets/popo_mascot.png', color || '#70459e']);
  const kidId = result.lastID;
  for (const item of DEFAULT_ROOM_ITEMS) {
    const isUnlocked = item.item_key === 'lava_lamp' ? 1 : 0;
    await run(`
      INSERT INTO room_decorations (kid_id, item_key, item_name, icon, star_cost, is_unlocked, is_placed, x, y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [kidId, item.item_key, item.item_name, item.icon, item.star_cost, isUnlocked, isUnlocked, item.x, item.y]);
  }
  await assignTemplateChore(kidId, 'bedroom');
  const kid = await get(`SELECT * FROM kids WHERE id = ?`, [kidId]);
  broadcastEvent('kid_created', kid);
  return kid;
}

// --- SETTINGS & PIN API ---
app.get('/api/settings', async (req, res) => {
  try {
    const family = await get(`SELECT value FROM settings WHERE key = 'family_name'`);
    res.json({ familyName: family ? family.value : 'Space Explorers' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const row = await get(`SELECT value FROM settings WHERE key = 'parent_pin'`);
    const validPin = row ? row.value : '1234';
    if (String(pin).trim() === String(validPin).trim()) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Incorrect PIN.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/pin', async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const row = await get(`SELECT value FROM settings WHERE key = 'parent_pin'`);
    const validPin = row ? row.value : '1234';
    if (String(currentPin).trim() !== String(validPin).trim()) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }
    if (!/^\d{4}$/.test(String(newPin || '').trim())) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }
    await run(`UPDATE settings SET value = ? WHERE key = 'parent_pin'`, [String(newPin).trim()]);
    res.json({ success: true, message: 'PIN updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- KIDS API ---
app.get('/api/kids', async (req, res) => {
  try {
    const kids = await all(`SELECT * FROM kids ORDER BY id ASC`);
    res.json(kids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kids', async (req, res) => {
  try {
    const { name, avatar, color } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
    res.json(await createKid(String(name).trim().slice(0, 30), avatar, color));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/kids/:id', async (req, res) => {
  try {
    const { name, avatar, color, stars } = req.body;
    await run(`
      UPDATE kids
      SET name = COALESCE(?, name),
          avatar = COALESCE(?, avatar),
          color = COALESCE(?, color),
          stars = COALESCE(?, stars)
      WHERE id = ?
    `, [name, avatar, color, stars, req.params.id]);
    const kid = await get(`SELECT * FROM kids WHERE id = ?`, [req.params.id]);
    res.json(kid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/kids/:id', async (req, res) => {
  try {
    await run(`DELETE FROM kids WHERE id = ?`, [req.params.id]);
    await run(`DELETE FROM chores WHERE kid_id = ?`, [req.params.id]);
    await run(`DELETE FROM room_decorations WHERE kid_id = ?`, [req.params.id]);
    await run(`DELETE FROM alerts WHERE kid_id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CHORE TEMPLATES ---
app.get('/api/templates', (req, res) => {
  res.json(ROOM_TEMPLATES);
});

// --- CHORES API ---
app.get('/api/chores', async (req, res) => {
  try {
    const { kid_id, status } = req.query;
    let sql = `
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar,
        (SELECT COUNT(*) FROM chore_steps WHERE chore_id = c.id) as total_steps,
        (SELECT COUNT(*) FROM chore_steps WHERE chore_id = c.id AND is_completed = 1) as completed_steps
      FROM chores c
      JOIN kids k ON c.kid_id = k.id
      WHERE 1=1
    `;
    const params = [];
    if (kid_id) {
      sql += ` AND c.kid_id = ?`;
      params.push(kid_id);
    }
    if (status) {
      sql += ` AND c.status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY c.id DESC`;

    const chores = await all(sql, params);
    res.json(chores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chores/:id', async (req, res) => {
  try {
    const chore = await get(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color, k.stars as kid_stars
      FROM chores c
      JOIN kids k ON c.kid_id = k.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!chore) return res.status(404).json({ error: 'Chore not found' });

    const steps = await all(`
      SELECT * FROM chore_steps
      WHERE chore_id = ?
      ORDER BY step_num ASC
    `, [req.params.id]);

    chore.steps = steps;
    res.json(chore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chores', async (req, res) => {
  try {
    const { kid_id, template_id, title, room_name, finish_goal, safety_note, stars_reward, custom_steps } = req.body;
    if (!kid_id) return res.status(400).json({ error: 'Kid ID is required' });

    let choreId;
    if (template_id) {
      choreId = await assignTemplateChore(kid_id, template_id);
    } else {
      // Custom chore
      const resIns = await run(`
        INSERT INTO chores (kid_id, room_template_id, room_name, title, finish_goal, safety_note, stars_reward, status)
        VALUES (?, 'custom', ?, ?, ?, ?, ?, 'assigned')
      `, [kid_id, room_name || 'My Space', title || 'Custom Mission', finish_goal || 'Area is clean and clear.', safety_note || null, stars_reward || 10]);
      choreId = resIns.lastID;

      const stepsToInsert = Array.isArray(custom_steps) && custom_steps.length > 0 ? custom_steps : [
        { step_num: 1, text: 'Look around and pick one thing to put away.', popo_hint: 'Popo spots the first item!', pose: 'assets/popo_idea.png', low_battery_keep: 1 },
        { step_num: 2, text: 'Put your item in its place.', popo_hint: 'Popo carries it home!', pose: 'assets/popo_backpack.png', low_battery_keep: 1 },
        { step_num: 3, text: 'Clear one small surface.', popo_hint: 'Popo wipes the counter!', pose: 'assets/popo_clipboard.png', low_battery_keep: 0 },
        { step_num: 4, text: 'Put any rubbish into the bin.', popo_hint: 'Popo bins the wrappers!', pose: 'assets/popo_blocks.png', low_battery_keep: 0 },
        { step_num: 5, text: 'Check your space and celebrate!', popo_hint: 'Popo does a cosmic dance!', pose: 'assets/popo_celebrate.png', low_battery_keep: 0 }
      ];

      for (const s of stepsToInsert) {
        await run(`
          INSERT INTO chore_steps (chore_id, step_num, text, popo_hint, pose, low_battery_keep, is_completed)
          VALUES (?, ?, ?, ?, ?, ?, 0)
        `, [choreId, s.step_num, s.text, s.popo_hint || 'Popo is cheering for you!', s.pose || 'assets/popo_mascot.png', s.low_battery_keep ? 1 : 0]);
      }
    }

    const chore = await get(`SELECT * FROM chores WHERE id = ?`, [choreId]);
    broadcastEvent('chore_assigned', { kid_id, chore });
    res.json(chore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a step's completion
app.put('/api/chores/:id/step/:stepNum', async (req, res) => {
  try {
    const { is_completed } = req.body;
    await run(`
      UPDATE chore_steps
      SET is_completed = ?
      WHERE chore_id = ? AND step_num = ?
    `, [is_completed ? 1 : 0, req.params.id, req.params.stepNum]);

    // Update chore current_step
    const nextStep = Number(req.params.stepNum) + (is_completed ? 1 : 0);
    await run(`
      UPDATE chores
      SET status = 'in_progress', current_step = ?
      WHERE id = ? AND status = 'assigned'
    `, [nextStep, req.params.id]);

    res.json({ success: true, stepNum: req.params.stepNum, is_completed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Low Battery Mode on a chore
app.put('/api/chores/:id/low-battery', async (req, res) => {
  try {
    const { is_low_battery } = req.body;
    await run(`
      UPDATE chores
      SET is_low_battery = ?
      WHERE id = ?
    `, [is_low_battery ? 1 : 0, req.params.id]);
    res.json({ success: true, is_low_battery: !!is_low_battery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit photo proof
app.post('/api/chores/:id/submit-proof', upload.single('photo'), async (req, res) => {
  try {
    const choreId = req.params.id;
    let photoUrl = null;

    if (req.file) {
      photoUrl = `uploads/${req.file.filename}`;
    } else if (req.body.base64Photo) {
      // Decode base64 image data
      const matches = req.body.base64Photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `proof-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
        photoUrl = `uploads/${filename}`;
      }
    }

    if (!photoUrl) {
      photoUrl = 'assets/popo_celebrate.png'; // Fallback
    }

    // Mark all steps completed and update chore status to 'pending_approval'
    await run(`UPDATE chore_steps SET is_completed = 1 WHERE chore_id = ?`, [choreId]);
    await run(`
      UPDATE chores
      SET status = 'pending_approval', proof_photo = ?
      WHERE id = ?
    `, [photoUrl, choreId]);

    const chore = await get(`
      SELECT c.*, k.name as kid_name
      FROM chores c
      JOIN kids k ON c.kid_id = k.id
      WHERE c.id = ?
    `, [choreId]);

    // Create push notification alert for parent
    const alertTitle = `📸 Mission Accomplished!`;
    const alertMsg = `${chore.kid_name} finished '${chore.title}'. Check their proof photo!`;
    const alertRes = await run(`
      INSERT INTO alerts (kid_id, type, title, message, photo_url)
      VALUES (?, 'completion', ?, ?, ?)
    `, [chore.kid_id, alertTitle, alertMsg, photoUrl]);

    const alertItem = await get(`SELECT * FROM alerts WHERE id = ?`, [alertRes.lastID]);

    broadcastEvent('mission_completed', { chore, alert: alertItem });
    ntfy.notifyParent('completion', alertTitle, alertMsg);

    res.json({ success: true, chore, alert: alertItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent approves chore & awards stars
app.post('/api/chores/:id/approve', async (req, res) => {
  try {
    const chore = await get(`
      SELECT c.*, k.name as kid_name, k.stars as current_stars
      FROM chores c
      JOIN kids k ON c.kid_id = k.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!chore) return res.status(404).json({ error: 'Chore not found' });

    const starsToAdd = chore.stars_reward || 10;
    const newStarTotal = (chore.current_stars || 0) + starsToAdd;

    // Update kid stars
    await run(`UPDATE kids SET stars = ? WHERE id = ?`, [newStarTotal, chore.kid_id]);

    // Mark chore as completed
    await run(`
      UPDATE chores
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [chore.id]);

    // Log approval alert
    const alertMsg = `🎉 Mission approved! ${chore.kid_name} earned +${starsToAdd} ⭐ for '${chore.title}'. Total: ${newStarTotal} ⭐`;
    await run(`
      INSERT INTO alerts (kid_id, type, title, message)
      VALUES (?, 'approval', '⭐ Stars Awarded!', ?)
    `, [chore.kid_id, alertMsg]);

    const updatedKid = await get(`SELECT * FROM kids WHERE id = ?`, [chore.kid_id]);

    broadcastEvent('chore_approved', {
      choreId: chore.id,
      kidId: chore.kid_id,
      starsAdded: starsToAdd,
      totalStars: newStarTotal,
      kid: updatedKid
    });

    res.json({ success: true, kid: updatedKid, starsAdded: starsToAdd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent requests redo (gentle redo)
app.post('/api/chores/:id/request-redo', async (req, res) => {
  try {
    const { note } = req.body;
    const chore = await get(`
      SELECT c.*, k.name as kid_name
      FROM chores c
      JOIN kids k ON c.kid_id = k.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!chore) return res.status(404).json({ error: 'Chore not found' });

    // Set status back to assigned / in_progress
    await run(`UPDATE chores SET status = 'in_progress' WHERE id = ?`, [chore.id]);

    const redoMessage = note || 'Almost there! Popo noticed one more tiny spot. Give it one more quick look!';
    await run(`
      INSERT INTO alerts (kid_id, type, title, message)
      VALUES (?, 'system', '🔄 Quick Touch-Up Needed', ?)
    `, [chore.kid_id, `${chore.kid_name}: ${redoMessage}`]);

    broadcastEvent('chore_redo', { choreId: chore.id, kidId: chore.kid_id, note: redoMessage });

    res.json({ success: true, message: 'Redo requested gently' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chores/:id', async (req, res) => {
  try {
    await run(`DELETE FROM chore_steps WHERE chore_id = ?`, [req.params.id]);
    await run(`DELETE FROM chores WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REWARDS API ---
app.get('/api/rewards', async (req, res) => {
  try {
    const rewards = await all(`SELECT * FROM rewards ORDER BY star_cost ASC`);
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rewards', async (req, res) => {
  try {
    const { title, icon, star_cost, description } = req.body;
    if (!title || !star_cost) return res.status(400).json({ error: 'Title and star cost required' });
    const result = await run(`
      INSERT INTO rewards (title, icon, star_cost, description)
      VALUES (?, ?, ?, ?)
    `, [title, icon || '🎁', star_cost, description || '']);
    const rew = await get(`SELECT * FROM rewards WHERE id = ?`, [result.lastID]);
    res.json(rew);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rewards/:id', async (req, res) => {
  try {
    await run(`DELETE FROM rewards WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kid redeems a real-world reward
app.post('/api/rewards/:id/redeem', async (req, res) => {
  try {
    const { kid_id } = req.body;
    const rewardId = req.params.id;

    const kid = await get(`SELECT * FROM kids WHERE id = ?`, [kid_id]);
    const reward = await get(`SELECT * FROM rewards WHERE id = ?`, [rewardId]);

    if (!kid) return res.status(404).json({ error: 'Kid not found' });
    if (!reward) return res.status(404).json({ error: 'Reward not found' });

    if (kid.stars < reward.star_cost) {
      return res.status(400).json({ error: `Not enough stars! Need ${reward.star_cost} ⭐, you have ${kid.stars} ⭐` });
    }

    // Deduct stars
    const remainingStars = kid.stars - reward.star_cost;
    await run(`UPDATE kids SET stars = ? WHERE id = ?`, [remainingStars, kid.id]);

    // Record redemption
    const redRes = await run(`
      INSERT INTO reward_redemptions (kid_id, reward_id, title, star_cost, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [kid.id, reward.id, reward.title, reward.star_cost]);

    // Alert 3 (Reward) from blueprint:
    // "🎁 Reward Claimed! Leo spent 50 stars on '30 Mins iPad Time'."
    const alertTitle = `🎁 Reward Claimed!`;
    const alertMsg = `${kid.name} spent ${reward.star_cost} stars on '${reward.title}'. Time to grant the reward!`;
    await run(`
      INSERT INTO alerts (kid_id, type, title, message)
      VALUES (?, 'reward', ?, ?)
    `, [kid.id, alertTitle, alertMsg]);

    const updatedKid = await get(`SELECT * FROM kids WHERE id = ?`, [kid.id]);

    ntfy.notifyParent('reward', alertTitle, alertMsg);
    broadcastEvent('reward_claimed', {
      redemptionId: redRes.lastID,
      kid: updatedKid,
      reward,
      alertMsg
    });

    res.json({ success: true, kid: updatedKid, remainingStars, reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/redemptions', async (req, res) => {
  try {
    const redemptions = await all(`
      SELECT r.*, k.name as kid_name, k.avatar as kid_avatar
      FROM reward_redemptions r
      JOIN kids k ON r.kid_id = k.id
      ORDER BY r.id DESC
    `);
    res.json(redemptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/redemptions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await run(`UPDATE reward_redemptions SET status = ? WHERE id = ?`, [status || 'approved', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SPACE BASE DECORATIONS API ---
app.get('/api/decorations/:kidId', async (req, res) => {
  try {
    const decos = await all(`
      SELECT * FROM room_decorations
      WHERE kid_id = ?
      ORDER BY star_cost ASC
    `, [req.params.kidId]);
    res.json(decos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/decorations/:kidId/buy', async (req, res) => {
  try {
    const { item_key } = req.body;
    const kidId = req.params.kidId;

    const kid = await get(`SELECT * FROM kids WHERE id = ?`, [kidId]);
    const deco = await get(`SELECT * FROM room_decorations WHERE kid_id = ? AND item_key = ?`, [kidId, item_key]);

    if (!kid || !deco) return res.status(404).json({ error: 'Kid or decoration not found' });
    if (deco.is_unlocked) return res.status(400).json({ error: 'Item already unlocked' });
    if (kid.stars < deco.star_cost) {
      return res.status(400).json({ error: `Need ${deco.star_cost} ⭐, have ${kid.stars} ⭐` });
    }

    const remainingStars = kid.stars - deco.star_cost;
    await run(`UPDATE kids SET stars = ? WHERE id = ?`, [remainingStars, kidId]);
    await run(`UPDATE room_decorations SET is_unlocked = 1, is_placed = 1 WHERE id = ?`, [deco.id]);

    const updatedKid = await get(`SELECT * FROM kids WHERE id = ?`, [kidId]);
    const updatedDeco = await get(`SELECT * FROM room_decorations WHERE id = ?`, [deco.id]);

    res.json({ success: true, kid: updatedKid, decoration: updatedDeco });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SOFTLOCK DISTRACTION MONITOR & ALERTS API ---
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await all(`
      SELECT a.*, k.name as kid_name, k.avatar as kid_avatar
      FROM alerts a
      LEFT JOIN kids k ON a.kid_id = k.id
      ORDER BY a.id DESC
      LIMIT 100
    `);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Triggered by client SoftLock Distraction monitor
app.post('/api/alerts', async (req, res) => {
  try {
    const { kid_id, type, title, message } = req.body;
    const kid = await get(`SELECT name FROM kids WHERE id = ?`, [kid_id]);
    const kidName = kid ? kid.name : 'Cosmic Cadet';

    const alertTitle = title || `🚨 Task Paused`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const alertMsg = message || `${kidName} left CanDo! at ${timeStr}. Check in to get them back on track!`;

    const result = await run(`
      INSERT INTO alerts (kid_id, type, title, message)
      VALUES (?, ?, ?, ?)
    `, [kid_id, type || 'distraction', alertTitle, alertMsg]);

    const newAlert = await get(`
      SELECT a.*, k.name as kid_name, k.avatar as kid_avatar
      FROM alerts a
      LEFT JOIN kids k ON a.kid_id = k.id
      WHERE a.id = ?
    `, [result.lastID]);

    broadcastEvent('alert', newAlert);
    ntfy.notifyParent(type || 'distraction', alertTitle, alertMsg);

    res.json({ success: true, alert: newAlert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/alerts/:id/read', async (req, res) => {
  try {
    await run(`UPDATE alerts SET is_read = 1 WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/alerts/clear', async (req, res) => {
  try {
    await run(`DELETE FROM alerts`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================================================
// ONE-TIME EXPIRING QR PAIRING (1.3b, 1.3c, 1.3d, 1.3e)
// 60-Second Server-Side One-Time Tokens (As specified by Fodibey & Rafa)
// ==========================================================================
const pairingTokens = new Map();

// Periodically purge expired pairing tokens every 15 seconds
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of pairingTokens.entries()) {
    if (data.expires_at < now) {
      pairingTokens.delete(token);
    }
  }
}, 15000);

app.post('/api/pairing/generate', async (req, res) => {
  try {
    const { kid_id } = req.body;
    if (!kid_id) return res.status(400).json({ error: 'kid_id is required' });

    const kid = await get('SELECT * FROM kids WHERE id = ?', [kid_id]);
    if (!kid) return res.status(404).json({ error: 'Cadet not found' });

    // Server-side random one-time cryptographic token (never plain user ID)
    const crypto = require('crypto');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. 7F9A2B
    const token = `CAN-${randomHex}`;
    const expiresAt = Date.now() + 60 * 1000; // strictly 60 seconds

    const payload = JSON.stringify({
      app: 'cando',
      type: 'pairing_token',
      token,
      kid_id: kid.id,
      kid_name: kid.name,
      expires_at: expiresAt
    });

    const QRCode = require('qrcode');
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#14132B',
        light: '#FFFFFF'
      }
    });

    pairingTokens.set(token, {
      token,
      kid_id: kid.id,
      kid_name: kid.name,
      created_at: Date.now(),
      expires_at: expiresAt,
      used: false,
      status: 'pending'
    });

    res.json({
      success: true,
      token,
      code: token,
      expires_in: 60,
      expires_at: expiresAt,
      qr_data_url: qrDataUrl,
      cadet: {
        id: kid.id,
        name: kid.name,
        avatar: kid.avatar,
        color: kid.color
      }
    });
  } catch (err) {
    console.error('Failed to generate pairing QR', err);
    res.status(500).json({ error: 'Failed to generate pairing token' });
  }
});

app.get('/api/pairing/status/:token', (req, res) => {
  const token = String(req.params.token).trim().toUpperCase();
  const data = pairingTokens.get(token);
  if (!data) {
    return res.json({ status: 'expired', error: 'Token not found or expired' });
  }
  if (data.expires_at < Date.now()) {
    pairingTokens.delete(token);
    return res.json({ status: 'expired', error: 'Token expired (60s limit reached)' });
  }
  if (data.used) {
    return res.json({ status: 'claimed', cadet: { id: data.kid_id, name: data.kid_name } });
  }
  res.json({
    status: 'pending',
    remaining_seconds: Math.max(0, Math.round((data.expires_at - Date.now()) / 1000))
  });
});

app.post('/api/pairing/claim', async (req, res) => {
  try {
    let { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    if (typeof token === 'string' && token.startsWith('{')) {
      try {
        const parsed = JSON.parse(token);
        if (parsed.token) token = parsed.token;
      } catch(e) {}
    }
    token = String(token).trim().toUpperCase();

    const data = pairingTokens.get(token);
    if (!data) {
      return res.status(404).json({ error: 'Invalid pairing token', code: 'INVALID_TOKEN' });
    }
    if (data.expires_at < Date.now()) {
      pairingTokens.delete(token);
      return res.status(410).json({ error: 'QR Token expired (60s limit reached)', code: 'TARGET_LOST' });
    }
    if (data.used) {
      return res.status(409).json({ error: 'QR Token already used', code: 'ALREADY_USED' });
    }

    // Mark single-use token as claimed
    data.used = true;
    data.status = 'claimed';

    const kid = await get('SELECT * FROM kids WHERE id = ?', [data.kid_id]);
    if (!kid) return res.status(404).json({ error: 'Cadet record not found' });

    // Broadcast SSE to parent phone so parent screen updates live instantly
    broadcastEvent('cadet_paired', {
      kid_id: kid.id,
      kid_name: kid.name,
      token,
      message: `Cadet ${kid.name} paired device successfully!`
    });

    res.json({
      success: true,
      cadet: {
        id: kid.id,
        name: kid.name,
        stars: kid.stars || 10,
        avatar: kid.avatar || 'assets/popo_mascot.png',
        color: kid.color || '#6B5BFF'
      }
    });
  } catch (err) {
    console.error('Failed to claim pairing token', err);
    res.status(500).json({ error: 'Failed to claim pairing token' });
  }
});

// Redesigned app API
v2.register(app, { broadcastEvent, requirePin });
accounts.register(app);
billing.register(app, { requirePin });

// Fallback to index.html for SPA routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Initialize database and start listening
initDb().then(v2.migrate).then(accounts.migrate).then(() => {
  schedule.start({ getPrefs: v2.getPrefs, localDate: v2.localDate, broadcast: broadcastEvent });
  const purge = () => v2.purgeOldProofs().catch(err => console.warn('[privacy] cleanup failed:', err.message));
  purge();
  setInterval(purge, 60 * 60 * 1000);
  // Listen on all network interfaces so phones/tablets on the same Wi-Fi can connect
  app.listen(PORT, HOST, () => {
    console.log(`✨ CanDo! Server running on http://localhost:${PORT}`);
    const urls = lanUrls();
    if (HOST === '0.0.0.0' && urls.length) {
      console.log('📱 Open from other devices on this network:');
      urls.forEach(u => console.log(`   ${u}`));
    }
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
