// Gentle reminders before a mission, and one daily summary in the evening.
const { run, get, all } = require('./db');
const ntfy = require('./ntfy');
const mailer = require('./mailer');
const accounts = require('./accounts');

// "4:30 PM" -> minutes after midnight
function minutesOf(label) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label || '');
  return m ? ((+m[1] % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + +m[2] : null;
}

async function reminders(now, today, prefs, broadcast) {
  if (!prefs.cadet.reminders) return;
  const minute = now.getHours() * 60 + now.getMinutes();
  const rows = await all(`SELECT * FROM chores WHERE status = 'assigned' AND is_paused = 0 AND scheduled_date = ? AND scheduled_time IS NOT NULL AND COALESCE(reminded_on, '') != ?`, [today, today]);
  for (const m of rows) {
    const left = minutesOf(m.scheduled_time) - minute;
    if (!(left >= 0 && left <= 10)) continue;
    await run(`UPDATE chores SET reminded_on = ? WHERE id = ?`, [today, m.id]);
    await run(`INSERT INTO alerts (kid_id, type, title, message) VALUES (?, 'headsup', 'Gentle reminder', ?)`, [m.kid_id, `${m.room_name} time is coming at ${m.scheduled_time}. Popo is ready when you are!`]);
    broadcast('alert', {});
  }
}

async function summary(now, today, prefs) {
  if (!prefs.alerts.summary || now.getHours() < Number(process.env.SUMMARY_HOUR || 19)) return;
  if ((await get(`SELECT value FROM settings WHERE key = 'summary_sent'`))?.value === today) return;
  await run(`INSERT INTO settings (key, value) VALUES ('summary_sent', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [today]);
  const kids = await all(`SELECT k.name,
      (SELECT COUNT(*) FROM chores c WHERE c.kid_id = k.id AND c.status = 'completed' AND date(c.completed_at, 'localtime') = ?) done,
      (SELECT COUNT(*) FROM chores c WHERE c.kid_id = k.id AND c.status = 'pending_approval') waiting FROM kids k`, [today]);
  if (!kids.length) return;
  const text = kids.map((k, i) => `${prefs.privacy.hideNames ? `Cadet ${i + 1}` : k.name}: ${k.done} mission(s) finished today, ${k.waiting} photo(s) waiting`).join('\n');
  ntfy.notifyParent('completion', 'CanDo! daily summary', text);
  const account = await accounts.getAccount();
  if (account && mailer.configured()) await mailer.send(account.email, 'CanDo! daily summary', text);
}

function start({ getPrefs, localDate, broadcast }) {
  const tick = async () => {
    const now = new Date(), prefs = await getPrefs();
    await reminders(now, localDate(now), prefs, broadcast);
    await summary(now, localDate(now), prefs);
  };
  const safe = () => tick().catch(err => console.warn('[schedule]', err.message));
  safe();
  setInterval(safe, 60 * 1000);
}

module.exports = { start, minutesOf };
