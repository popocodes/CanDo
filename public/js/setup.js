(() => {
  const $ = id => document.getElementById(id);
  const AVATARS = ['popo_mascot', 'popo_star', 'popo_backpack', 'popo_celebrate', 'popo_reading', 'popo_idea'];
  let step = 1;
  const TOTAL = 4;
  let setupComplete = false;
  let unlockPin = '';
  let kids = [];
  let avatar = 'assets/popo_mascot.png';
  let hasToken = false;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const headers = () => ({ 'Content-Type': 'application/json', ...(unlockPin ? { 'x-parent-pin': unlockPin } : {}) });

  function msg(el, text, kind) {
    el.className = 'notice ' + kind;
    el.textContent = text;
  }

  async function init() {
    const st = await (await fetch('/api/setup/status')).json();
    setupComplete = st.setupComplete;
    $('familyName').value = st.familyName || '';
    $('ntfyEnabled').checked = st.ntfy.enabled;
    $('ntfyServer').value = st.ntfy.server || 'https://ntfy.sh';
    $('ntfyTopic').value = st.ntfy.topic || '';
    $('ntfyClick').value = st.ntfy.clickUrl || (st.lanUrls[0] || location.origin);
    hasToken = st.ntfy.hasToken;
    if (hasToken) $('tokenHint').textContent = 'A token is saved. Leave blank to keep it.';
    document.querySelectorAll('.evt').forEach(c => c.checked = st.ntfy.events.includes(c.value));
    $('lanChips').innerHTML = st.lanUrls.concat([location.origin]).map(u => `<span class="chip" data-url="${esc(u)}">${esc(u)}</span>`).join('');
    $('lanChips').onclick = e => { if (e.target.dataset.url) $('ntfyClick').value = e.target.dataset.url; };

    if (setupComplete) {
      $('gate').style.display = 'block';
      $('wizTitle').textContent = 'CanDo! Settings ⚙️';
      $('pinLabel').textContent = 'New PIN (leave blank to keep)';
      $('pin').placeholder = '••••';
      $('pinHelp').textContent = 'Leave blank to keep your current PIN.';
    } else {
      $('wizard').style.display = 'block';
    }
    renderDots();
    renderAvatars();
  }

  $('gateBtn').onclick = async () => {
    const pin = $('gatePin').value;
    const r = await fetch('/api/settings/verify-pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    if (r.ok) { unlockPin = pin; $('gate').style.display = 'none'; $('wizard').style.display = 'block'; }
    else msg($('gateMsg'), 'Incorrect PIN.', 'err');
  };

  function renderDots() {
    $('stepDots').innerHTML = Array.from({ length: TOTAL }, (_, i) =>
      `<div class="dot ${i + 1 < step ? 'done' : ''} ${i + 1 === step ? 'current' : ''}"></div>`).join('');
    document.querySelectorAll('.setup-step').forEach(el => el.classList.toggle('active', +el.dataset.step === step));
    $('backBtn').style.visibility = step === 1 ? 'hidden' : 'visible';
    $('nextBtn').textContent = step === TOTAL ? '✅ Save & launch CanDo!' : (step === 3 ? 'Next ➡️ (skip if unsure)' : 'Next ➡️');
    if (step === TOTAL) renderSummary();
  }

  function renderAvatars() {
    $('avatarPicker').innerHTML = AVATARS.map(a => {
      const src = `assets/${a}.png`;
      return `<div class="avatar-opt ${src === avatar ? 'selected' : ''}" data-src="${src}"><img src="${src}" alt=""></div>`;
    }).join('');
  }
  $('avatarPicker').onclick = e => {
    const o = e.target.closest('.avatar-opt');
    if (o) { avatar = o.dataset.src; renderAvatars(); }
  };

  function renderKids() {
    $('kidList').innerHTML = kids.map((k, i) => `
      <div class="kid-row"><div><img src="${esc(k.avatar)}" alt="" style="border:2px solid ${esc(k.color)}">${esc(k.name)}</div>
      <button class="icon-btn" data-rm="${i}">Remove</button></div>`).join('');
  }
  $('kidList').onclick = e => { if (e.target.dataset.rm !== undefined) { kids.splice(+e.target.dataset.rm, 1); renderKids(); } };
  $('addKidBtn').onclick = () => {
    const name = $('kidName').value.trim();
    if (!name) return $('kidName').focus();
    kids.push({ name, avatar, color: $('kidColor').value });
    $('kidName').value = '';
    renderKids();
  };
  $('kidName').addEventListener('keydown', e => { if (e.key === 'Enter') $('addKidBtn').click(); });

  $('randTopic').onclick = () => {
    const a = new Uint8Array(6); crypto.getRandomValues(a);
    $('ntfyTopic').value = 'cando-' + Array.from(a, b => (b % 36).toString(36)).join('');
  };

  function ntfyPayload() {
    return {
      enabled: $('ntfyEnabled').checked,
      server: $('ntfyServer').value.trim() || 'https://ntfy.sh',
      topic: $('ntfyTopic').value.trim(),
      token: $('ntfyToken').value,
      clickUrl: $('ntfyClick').value.trim(),
      events: Array.from(document.querySelectorAll('.evt:checked')).map(c => c.value)
    };
  }

  $('ntfyTest').onclick = async () => {
    const p = ntfyPayload();
    if (!p.topic) return msg($('ntfyMsg'), 'Enter or generate a topic first.', 'err');
    msg($('ntfyMsg'), 'Sending…', 'ok');
    const r = await fetch('/api/ntfy/test', { method: 'POST', headers: headers(), body: JSON.stringify(p) });
    const d = await r.json();
    if (r.ok) msg($('ntfyMsg'), '✅ Sent! Check your phone — if nothing arrives, make sure the ntfy app is subscribed to this exact topic.', 'ok');
    else msg($('ntfyMsg'), '❌ ' + (d.error || 'Failed to send'), 'err');
  };

  function renderSummary() {
    const p = ntfyPayload();
    $('summary').innerHTML = `
      <p>👨‍👩‍👧 Family: <b>${esc($('familyName').value || 'Space Explorers')}</b></p>
      <p>🔒 PIN: <b>${$('pin').value ? 'will be set' : (setupComplete ? 'unchanged' : 'default 1234 (change it!)')}</b></p>
      <p>🧒 New explorers: <b>${kids.length ? kids.map(k => esc(k.name)).join(', ') : 'none'}</b></p>
      <p>🔔 ntfy: <b>${p.enabled && p.topic ? 'on → ' + esc(p.server) + '/' + esc(p.topic) : 'off'}</b></p>`;
  }

  $('backBtn').onclick = () => { if (step > 1) { step--; renderDots(); } };
  $('nextBtn').onclick = async () => {
    if (step === 1) {
      const pin = $('pin').value;
      if (pin && !/^\d{4}$/.test(pin)) { alert('PIN must be exactly 4 digits.'); return; }
      if (!setupComplete && !pin && !confirm('No PIN entered — the default PIN 1234 will be used. Continue?')) return;
    }
    if (step === 2 && $('kidName').value.trim()) $('addKidBtn').click();
    if (step < TOTAL) { step++; renderDots(); return; }

    const body = {
      pin: $('pin').value,
      familyName: $('familyName').value.trim(),
      notifications: ntfyPayload(),
      kids
    };
    const r = await fetch('/api/setup', { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    const d = await r.json();
    if (r.ok) { msg($('saveMsg'), 'Saved! Launching…', 'ok'); setTimeout(() => location.href = '/', 700); }
    else msg($('saveMsg'), d.error || 'Failed to save', 'err');
  };

  init();
})();
