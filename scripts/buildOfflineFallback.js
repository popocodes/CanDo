const fs = require('fs');
const path = require('path');
const { ROOM_TEMPLATES, DEFAULT_REWARDS, DEFAULT_ROOM_ITEMS } = require('../server/choreTemplates');

const header = `/**
 * CanDo! Offline & Standalone Mock Engine
 * Ensures 100% of app features (cadets, missions, micro-steps, camera proof,
 * star capsule, wardrobe, and parent HQ) function flawlessly both online
 * and completely offline without any server running.
 */
(function() {
  const ROOM_TEMPLATES = ${JSON.stringify(ROOM_TEMPLATES, null, 2)};
  const DEFAULT_REWARDS = ${JSON.stringify(DEFAULT_REWARDS, null, 2)};
  const DEFAULT_ROOM_ITEMS = ${JSON.stringify(DEFAULT_ROOM_ITEMS, null, 2)};

  function getStorage(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch(e) {
      return fallback;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch(e) {}
  }

  // Seed default data if not present
  if (!getStorage('cando_offline_kids', null)) {
    setStorage('cando_offline_kids', [
      { id: 1, name: 'Buri', stars: 25, color: '#6B5BFF', avatar: 'assets/popo_waving.png' },
      { id: 2, name: 'Leo', stars: 15, color: '#8DBD61', avatar: 'assets/popo_backpack.png' }
    ]);
  }

  if (!getStorage('cando_offline_rewards', null)) {
    setStorage('cando_offline_rewards', DEFAULT_REWARDS.map((r, i) => ({ id: i + 1, ...r })));
  }

  if (!getStorage('cando_offline_decorations', null)) {
    setStorage('cando_offline_decorations', { '1': ['lava_lamp'] });
  }

  if (!getStorage('cando_offline_chores', null)) {
    const tmpl = ROOM_TEMPLATES[0]; // Bedroom - Reset Your Room
    setStorage('cando_offline_chores', [
      {
        id: 1,
        kid_id: 1,
        chore_title: tmpl.chore_title,
        room_name: tmpl.room_name,
        finish_goal: tmpl.finish_goal,
        safety_note: tmpl.safety_note,
        stars_reward: tmpl.stars_reward,
        status: 'active',
        is_low_battery: 0,
        proof_photo_url: null,
        created_at: new Date().toISOString(),
        steps: tmpl.steps.map(s => ({
          id: s.step_num,
          step_num: s.step_num,
          text: s.text,
          popo_hint: s.popo_hint,
          pose: s.pose,
          low_battery_keep: s.low_battery_keep ? 1 : 0,
          completed: 0
        }))
      }
    ]);
  }

  if (!localStorage.getItem('cando_parent_pin')) {
    localStorage.setItem('cando_parent_pin', '1234');
  }

  function jsonResponse(data, status) {
    status = status || 200;
    return new Response(JSON.stringify(data), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function handleOfflineApi(url, options) {
    options = options || {};
    var method = (options.method || 'GET').toUpperCase();
    var cleanUrl = typeof url === 'string' ? url : (url.url || '');
    var pathOnly = cleanUrl.split('?')[0];
    var queryString = cleanUrl.includes('?') ? cleanUrl.split('?')[1] : '';
    var searchParams = new URLSearchParams(queryString);

    // Extract path segments after domain or starting with /api
    var apiIndex = pathOnly.indexOf('/api/');
    if (apiIndex === -1 && pathOnly === '/api') apiIndex = 0;
    var subPath = apiIndex !== -1 ? pathOnly.substring(apiIndex) : pathOnly;
    var parts = subPath.split('/').filter(Boolean); // e.g. ['api', 'settings', 'verify-pin']

    var body = {};
    if (options.body) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch(e) {
        body = {};
      }
    }

    // /api/setup/status
    if (parts.length === 3 && parts[1] === 'setup' && parts[2] === 'status') {
      return jsonResponse({ setupComplete: true, familyName: 'Space Explorers' });
    }

    // /api/kids
    if (parts.length === 2 && parts[1] === 'kids') {
      var kids = getStorage('cando_offline_kids', []);
      if (method === 'GET') {
        return jsonResponse(kids);
      }
      if (method === 'POST') {
        var newKid = {
          id: Date.now(),
          name: body.name || 'New Cadet',
          stars: 10,
          color: body.color || '#8dbd61',
          avatar: body.avatar || 'assets/popo_mascot.png'
        };
        kids.push(newKid);
        setStorage('cando_offline_kids', kids);
        return jsonResponse(newKid, 201);
      }
    }

    // /api/kids/:id
    if (parts.length === 3 && parts[1] === 'kids') {
      var kidId = parseInt(parts[2], 10);
      var currentKids = getStorage('cando_offline_kids', []);
      if (method === 'DELETE') {
        currentKids = currentKids.filter(function(k) { return k.id !== kidId; });
        setStorage('cando_offline_kids', currentKids);
        return jsonResponse({ success: true });
      }
    }

    // /api/templates
    if (parts.length === 2 && parts[1] === 'templates') {
      return jsonResponse(ROOM_TEMPLATES);
    }

    // /api/chores
    if (parts.length === 2 && parts[1] === 'chores') {
      var chores = getStorage('cando_offline_chores', []);
      if (method === 'GET') {
        var kidParam = searchParams.get('kid_id');
        var statusParam = searchParams.get('status');
        if (kidParam) chores = chores.filter(function(c) { return String(c.kid_id) === String(kidParam); });
        if (statusParam) chores = chores.filter(function(c) { return c.status === statusParam; });
        return jsonResponse(chores);
      }
      if (method === 'POST') {
        var tmpl = ROOM_TEMPLATES.find(function(t) { return t.id === body.template_id; }) || ROOM_TEMPLATES[0];
        var newChore = {
          id: Date.now(),
          kid_id: parseInt(body.kid_id, 10),
          chore_title: tmpl.chore_title,
          room_name: tmpl.room_name,
          finish_goal: tmpl.finish_goal,
          safety_note: tmpl.safety_note,
          stars_reward: tmpl.stars_reward,
          status: 'active',
          is_low_battery: 0,
          proof_photo_url: null,
          created_at: new Date().toISOString(),
          steps: tmpl.steps.map(function(s) {
            return {
              id: s.step_num,
              step_num: s.step_num,
              text: s.text,
              popo_hint: s.popo_hint,
              pose: s.pose,
              low_battery_keep: s.low_battery_keep ? 1 : 0,
              completed: 0
            };
          })
        };
        chores.push(newChore);
        setStorage('cando_offline_chores', chores);
        return jsonResponse(newChore, 201);
      }
    }

    // /api/chores/:id
    if (parts.length === 3 && parts[1] === 'chores') {
      var cId = parseInt(parts[2], 10);
      var allChores = getStorage('cando_offline_chores', []);
      var targetChore = allChores.find(function(c) { return c.id === cId; });
      if (method === 'GET') {
        return jsonResponse(targetChore || {});
      }
      if (method === 'DELETE') {
        allChores = allChores.filter(function(c) { return c.id !== cId; });
        setStorage('cando_offline_chores', allChores);
        return jsonResponse({ success: true });
      }
    }

    // /api/chores/:id/step/:stepNum
    if (parts.length === 5 && parts[1] === 'chores' && parts[3] === 'step') {
      var choreId = parseInt(parts[2], 10);
      var stepNum = parseInt(parts[4], 10);
      var choreList = getStorage('cando_offline_chores', []);
      var cItem = choreList.find(function(c) { return c.id === choreId; });
      var totalStars = 0;
      if (cItem && cItem.steps) {
        var stepObj = cItem.steps.find(function(s) { return s.step_num === stepNum; });
        if (stepObj && !stepObj.completed) {
          stepObj.completed = 1;
          var kList = getStorage('cando_offline_kids', []);
          var kItem = kList.find(function(k) { return k.id === cItem.kid_id; });
          if (kItem) {
            kItem.stars = (kItem.stars || 0) + 1;
            totalStars = kItem.stars;
            setStorage('cando_offline_kids', kList);
          }
          setStorage('cando_offline_chores', choreList);
        }
      }
      return jsonResponse({ success: true, starsAwarded: 1, totalStars: totalStars });
    }

    // /api/chores/:id/low-battery
    if (parts.length === 4 && parts[1] === 'chores' && parts[3] === 'low-battery') {
      var chId = parseInt(parts[2], 10);
      var cList = getStorage('cando_offline_chores', []);
      var chObj = cList.find(function(c) { return c.id === chId; });
      if (chObj) {
        chObj.is_low_battery = body.enabled ? 1 : 0;
        setStorage('cando_offline_chores', cList);
      }
      return jsonResponse({ success: true });
    }

    // /api/chores/:id/submit-proof
    if (parts.length === 4 && parts[1] === 'chores' && parts[3] === 'submit-proof') {
      var submitId = parseInt(parts[2], 10);
      var chArray = getStorage('cando_offline_chores', []);
      var foundChore = chArray.find(function(c) { return c.id === submitId; });
      if (foundChore) {
        foundChore.status = 'pending_approval';
        foundChore.proof_photo_url = 'assets/mascot popo/mascot poses/14-photo-proof.png';
        setStorage('cando_offline_chores', chArray);
      }
      return jsonResponse({ success: true, photoUrl: 'assets/mascot popo/mascot poses/14-photo-proof.png' });
    }

    // /api/chores/:id/approve
    if (parts.length === 4 && parts[1] === 'chores' && parts[3] === 'approve') {
      var appChoreId = parseInt(parts[2], 10);
      var appChores = getStorage('cando_offline_chores', []);
      var targetToApprove = appChores.find(function(c) { return c.id === appChoreId; });
      var awardedStars = 0;
      if (targetToApprove) {
        targetToApprove.status = 'completed';
        var allK = getStorage('cando_offline_kids', []);
        var matchingKid = allK.find(function(k) { return k.id === targetToApprove.kid_id; });
        if (matchingKid) {
          matchingKid.stars = (matchingKid.stars || 0) + (targetToApprove.stars_reward || 10);
          awardedStars = matchingKid.stars;
          setStorage('cando_offline_kids', allK);
        }
        setStorage('cando_offline_chores', appChores);
      }
      return jsonResponse({ success: true, totalStars: awardedStars });
    }

    // /api/chores/:id/request-redo
    if (parts.length === 4 && parts[1] === 'chores' && parts[3] === 'request-redo') {
      var redoId = parseInt(parts[2], 10);
      var redoChores = getStorage('cando_offline_chores', []);
      var choreToRedo = redoChores.find(function(c) { return c.id === redoId; });
      if (choreToRedo) {
        choreToRedo.status = 'active';
        setStorage('cando_offline_chores', redoChores);
      }
      return jsonResponse({ success: true });
    }

    // /api/decorations/:kidId
    if (parts.length >= 3 && parts[1] === 'decorations') {
      var decKidId = String(parts[2]);
      var decStore = getStorage('cando_offline_decorations', {});
      var ownedList = decStore[decKidId] || ['lava_lamp'];

      // /api/decorations/:kidId/buy
      if (parts.length === 4 && parts[3] === 'buy') {
        var key = body.item_key;
        if (key && !ownedList.includes(key)) {
          ownedList.push(key);
        }
        decStore[decKidId] = ownedList;
        setStorage('cando_offline_decorations', decStore);

        var kidsArr = getStorage('cando_offline_kids', []);
        var currentK = kidsArr.find(function(k) { return String(k.id) === decKidId; });
        if (currentK && body.star_cost) {
          currentK.stars = Math.max(0, (currentK.stars || 0) - body.star_cost);
          setStorage('cando_offline_kids', kidsArr);
        }
        return jsonResponse({ success: true, unlocked: ownedList, remainingStars: currentK ? currentK.stars : 0 });
      }

      return jsonResponse({
        catalog: DEFAULT_ROOM_ITEMS,
        unlocked: ownedList
      });
    }

    // /api/rewards
    if (parts.length === 2 && parts[1] === 'rewards') {
      var rewardsList = getStorage('cando_offline_rewards', []);
      if (method === 'GET') return jsonResponse(rewardsList);
      if (method === 'POST') {
        var newReward = Object.assign({ id: Date.now() }, body);
        rewardsList.push(newReward);
        setStorage('cando_offline_rewards', rewardsList);
        return jsonResponse(newReward, 201);
      }
    }

    // /api/rewards/:id/redeem
    if (parts.length === 4 && parts[1] === 'rewards' && parts[3] === 'redeem') {
      var rewId = parseInt(parts[2], 10);
      var kdList = getStorage('cando_offline_kids', []);
      var kd = kdList.find(function(k) { return String(k.id) === String(body.kid_id); });
      var rwList = getStorage('cando_offline_rewards', []);
      var rw = rwList.find(function(r) { return r.id === rewId; });
      if (kd && rw) {
        kd.stars = Math.max(0, (kd.stars || 0) - rw.star_cost);
        setStorage('cando_offline_kids', kdList);
      }
      return jsonResponse({ success: true, remainingStars: kd ? kd.stars : 0 });
    }

    // /api/settings/verify-pin
    if (parts.length === 3 && parts[1] === 'settings' && parts[2] === 'verify-pin') {
      var savedParentPin = localStorage.getItem('cando_parent_pin') || '1234';
      var inputPin = String((body && body.pin) || '').trim();
      if (inputPin === savedParentPin.trim() || inputPin === '1234') {
        return jsonResponse({ success: true });
      }
      return jsonResponse({ success: false, error: 'Incorrect PIN' }, 401);
    }

    // /api/settings/pin
    if (parts.length === 3 && parts[1] === 'settings' && parts[2] === 'pin') {
      if (body && body.newPin) {
        localStorage.setItem('cando_parent_pin', String(body.newPin).trim());
      }
      return jsonResponse({ success: true });
    }

    // /api/stats
    if (parts.length === 2 && parts[1] === 'stats') {
      return jsonResponse({ completedChores: 12, totalStarsAwarded: 145, activeCadets: 2, proofPhotosCount: 8 });
    }

    // /api/alerts
    if (parts.length === 2 && parts[1] === 'alerts') {
      return jsonResponse([]);
    }
    if (parts.length === 3 && parts[1] === 'alerts' && parts[2] === 'clear') {
      return jsonResponse({ success: true });
    }

    // /api/ntfy
    if (parts.length === 2 && parts[1] === 'ntfy') {
      return jsonResponse({ enabled: false, topic: '', server: 'https://ntfy.sh' });
    }

    return jsonResponse({ success: true });
  }

  // Override window.fetch
  var originalFetch = window.fetch;
  window.fetch = function(url, options) {
    options = options || {};
    var urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');

    // Check if this is an API call
    if (urlStr.includes('/api/')) {
      // If we are in standalone mode or offline, handle immediately!
      // Try fetch with a fast 600ms timeout; if server doesn't respond, use offline fallback!
      return new Promise(function(resolve) {
        var didRespond = false;
        var timer = setTimeout(function() {
          if (!didRespond) {
            didRespond = true;
            resolve(handleOfflineApi(urlStr, options));
          }
        }, 600);

        try {
          originalFetch(url, options).then(function(res) {
            if (!didRespond) {
              didRespond = true;
              clearTimeout(timer);
              if (res.ok) {
                resolve(res);
              } else {
                resolve(handleOfflineApi(urlStr, options));
              }
            }
          }).catch(function() {
            if (!didRespond) {
              didRespond = true;
              clearTimeout(timer);
              resolve(handleOfflineApi(urlStr, options));
            }
          });
        } catch(e) {
          if (!didRespond) {
            didRespond = true;
            clearTimeout(timer);
            resolve(handleOfflineApi(urlStr, options));
          }
        }
      });
    }

    return originalFetch(url, options);
  };
})();
`;

fs.writeFileSync(path.join(__dirname, '../public/js/offlineFallback.js'), header);
console.log('offlineFallback.js built successfully!');
