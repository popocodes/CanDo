const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { ROOM_TEMPLATES, DEFAULT_REWARDS, DEFAULT_ROOM_ITEMS } = require('./choreTemplates');

// CANDO_DB lets you test against a copy without touching the real database
const dbPath = process.env.CANDO_DB || path.join(__dirname, '..', 'cando.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS kids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      color TEXT NOT NULL,
      stars INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kid_id INTEGER NOT NULL,
      room_template_id TEXT,
      room_name TEXT NOT NULL,
      title TEXT NOT NULL,
      finish_goal TEXT,
      safety_note TEXT,
      stars_reward INTEGER DEFAULT 10,
      status TEXT DEFAULT 'assigned', -- assigned, in_progress, pending_approval, completed
      proof_photo TEXT,
      is_low_battery INTEGER DEFAULT 0,
      current_step INTEGER DEFAULT 1,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS chore_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL,
      step_num INTEGER NOT NULL,
      text TEXT NOT NULL,
      popo_hint TEXT,
      pose TEXT,
      low_battery_keep INTEGER DEFAULT 1,
      is_completed INTEGER DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      icon TEXT NOT NULL,
      star_cost INTEGER NOT NULL,
      description TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kid_id INTEGER NOT NULL,
      reward_id INTEGER,
      title TEXT NOT NULL,
      star_cost INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, approved
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS room_decorations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kid_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      item_name TEXT NOT NULL,
      icon TEXT NOT NULL,
      star_cost INTEGER NOT NULL,
      is_unlocked INTEGER DEFAULT 0,
      is_placed INTEGER DEFAULT 1,
      x INTEGER,
      y INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kid_id INTEGER,
      type TEXT NOT NULL, -- distraction, completion, reward, approval, system
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      photo_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default settings if empty
  const pinSetting = await get(`SELECT value FROM settings WHERE key = 'parent_pin'`);
  if (!pinSetting) {
    await run(`INSERT INTO settings (key, value) VALUES ('parent_pin', '1234')`);
    await run(`INSERT INTO settings (key, value) VALUES ('family_name', 'Space Explorers')`);
  }

  // Seed default rewards if empty
  const rewardsCount = await get(`SELECT COUNT(*) as count FROM rewards`);
  if (rewardsCount.count === 0) {
    for (const rew of DEFAULT_REWARDS) {
      await run(`
        INSERT INTO rewards (title, icon, star_cost, description)
        VALUES (?, ?, ?, ?)
      `, [rew.title, rew.icon, rew.star_cost, rew.description]);
    }
  }

}

async function assignTemplateChore(kidId, templateId) {
  const tpl = ROOM_TEMPLATES.find(t => t.id === templateId) || ROOM_TEMPLATES[0];
  const result = await run(`
    INSERT INTO chores (kid_id, room_template_id, room_name, title, finish_goal, safety_note, stars_reward, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'assigned')
  `, [kidId, tpl.id, tpl.room_name, tpl.chore_title, tpl.finish_goal, tpl.safety_note, tpl.stars_reward]);

  const choreId = result.lastID;
  for (const s of tpl.steps) {
    await run(`
      INSERT INTO chore_steps (chore_id, step_num, text, popo_hint, pose, low_battery_keep, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [choreId, s.step_num, s.text, s.popo_hint, `assets/${s.pose}`, s.low_battery_keep ? 1 : 0]);
  }
  return choreId;
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb,
  assignTemplateChore
};
