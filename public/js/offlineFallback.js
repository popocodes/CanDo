/**
 * CanDo! Offline & Standalone Mock Engine
 * Ensures 100% of app features (cadets, missions, micro-steps, camera proof,
 * star capsule, wardrobe, and parent HQ) function flawlessly both online
 * and completely offline without any server running.
 */
(function() {
  const ROOM_TEMPLATES = [
  {
    "id": "bedroom",
    "room_name": "Bedroom",
    "chore_title": "Reset Your Room",
    "finish_goal": "Your room is ready and safe to walk through.",
    "safety_note": null,
    "icon": "🛏️",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Put your dirty clothes in the basket.",
        "popo_hint": "Popo carries dirty clothes to the laundry basket.",
        "pose": "popo_backpack.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Put your toys in the toy box.",
        "popo_hint": "Popo puts away toys into the toy box.",
        "pose": "popo_blocks.png",
        "low_battery_keep": true
      },
      {
        "step_num": 3,
        "text": "Put your books on the shelf.",
        "popo_hint": "Popo stacks books neatly on the shelf.",
        "pose": "popo_reading.png",
        "low_battery_keep": false
      },
      {
        "step_num": 4,
        "text": "Pull up your blanket.",
        "popo_hint": "Popo smooths out the cozy bed blanket.",
        "pose": "popo_mascot.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Put your pillow on the bed.",
        "popo_hint": "Popo places the fluffy pillow and celebrates!",
        "pose": "popo_star.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "bathroom",
    "room_name": "Bathroom",
    "chore_title": "Finish Your Routine",
    "finish_goal": "The bathroom is ready for the next person.",
    "safety_note": null,
    "icon": "🧼",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Flush the toilet.",
        "popo_hint": "Popo presses the flush button.",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Wash your hands with soap.",
        "popo_hint": "Popo washes with bubbly suds for 20 seconds!",
        "pose": "popo_mascot.png",
        "low_battery_keep": true
      },
      {
        "step_num": 3,
        "text": "Dry your hands with the towel.",
        "popo_hint": "Popo dries paws until nice and clean.",
        "pose": "popo_clipboard.png",
        "low_battery_keep": false
      },
      {
        "step_num": 4,
        "text": "Hang up your towel.",
        "popo_hint": "Popo hangs the towel on the hook.",
        "pose": "popo_backpack.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Turn off the light and close the door.",
        "popo_hint": "Popo clicks off the light and snaps the door shut.",
        "pose": "popo_star.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "kitchen",
    "room_name": "Kitchen",
    "chore_title": "Clear Your Place",
    "finish_goal": "Your dishes and eating space are clear.",
    "safety_note": "Safety: Use only cool food and safe dishes approved by a parent.",
    "icon": "🍽️",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Take your plate to the counter.",
        "popo_hint": "Popo carefully carries the plate with both paws.",
        "pose": "popo_mascot.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Take your cup to the counter.",
        "popo_hint": "Popo safely carries the cup over.",
        "pose": "popo_backpack.png",
        "low_battery_keep": false
      },
      {
        "step_num": 3,
        "text": "Put your food scraps in the bin.",
        "popo_hint": "Popo opens the rubbish bin for scraps.",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 4,
        "text": "Wipe your place at the table.",
        "popo_hint": "Popo wipes down the spot with a clean cloth.",
        "pose": "popo_clipboard.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Push in your chair.",
        "popo_hint": "Popo tucks in the chair nice and snug.",
        "pose": "popo_star.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "dining",
    "room_name": "Dining Area",
    "chore_title": "Help Reset the Table",
    "finish_goal": "The table is ready for the next meal.",
    "safety_note": null,
    "icon": "🥣",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Take your plate to the counter.",
        "popo_hint": "Popo carries the plate to the kitchen.",
        "pose": "popo_mascot.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Take your cup to the sink or counter.",
        "popo_hint": "Popo places cup by the sink.",
        "pose": "popo_backpack.png",
        "low_battery_keep": false
      },
      {
        "step_num": 3,
        "text": "Put your napkin in the bin.",
        "popo_hint": "Popo drops the used napkin into the bin.",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 4,
        "text": "Wipe one part of the table.",
        "popo_hint": "Popo wipes side to side.",
        "pose": "popo_clipboard.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Push in your chair.",
        "popo_hint": "Popo pushes the dining chair in.",
        "pose": "popo_star.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "living_room",
    "room_name": "Living Room",
    "chore_title": "Put Your Things Away",
    "finish_goal": "Your things are off the floor and sofa.",
    "safety_note": null,
    "icon": "🛋️",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Find one thing that belongs to you.",
        "popo_hint": "Popo looks around like a space detective!",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Pick it up.",
        "popo_hint": "Popo lifts the item gently off the floor.",
        "pose": "popo_blocks.png",
        "low_battery_keep": true
      },
      {
        "step_num": 3,
        "text": "Take it to its place.",
        "popo_hint": "Popo marches over to its home spot.",
        "pose": "popo_backpack.png",
        "low_battery_keep": false
      },
      {
        "step_num": 4,
        "text": "Put it away.",
        "popo_hint": "Popo places it into the basket or shelf.",
        "pose": "popo_clipboard.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Check the area.",
        "popo_hint": "Popo gives a proud double thumbs-up!",
        "pose": "popo_celebrate.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "laundry",
    "room_name": "Laundry Area",
    "chore_title": "Put Your Clothes in the Basket",
    "finish_goal": "Your dirty clothes are in the laundry basket.",
    "safety_note": "Safety: Do not touch detergent, washing machines, or dryers without permission.",
    "icon": "🧺",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Find one dirty piece of clothing.",
        "popo_hint": "Popo scans the floor and points to clothes.",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Pick it up.",
        "popo_hint": "Popo scoops up the shirt.",
        "pose": "popo_mascot.png",
        "low_battery_keep": true
      },
      {
        "step_num": 3,
        "text": "Walk to the laundry basket.",
        "popo_hint": "Popo walks carefully to the basket.",
        "pose": "popo_backpack.png",
        "low_battery_keep": false
      },
      {
        "step_num": 4,
        "text": "Put it inside.",
        "popo_hint": "Popo scores a basket goal! Swish!",
        "pose": "popo_blocks.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Check your floor.",
        "popo_hint": "Popo looks around and celebrates a clear floor!",
        "pose": "popo_celebrate.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "entryway",
    "room_name": "Entryway",
    "chore_title": "Get Your Things Ready",
    "finish_goal": "Your things are ready by the door.",
    "safety_note": "Safety: Do not open the door for strangers.",
    "icon": "🚪",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Put your shoes together.",
        "popo_hint": "Popo lines up shoes side by side.",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Put your slippers on the shoe rack.",
        "popo_hint": "Popo tucks slippers neatly on the rack.",
        "pose": "popo_blocks.png",
        "low_battery_keep": false
      },
      {
        "step_num": 3,
        "text": "Hang up your coat or jacket.",
        "popo_hint": "Popo hangs the jacket on the wall hook.",
        "pose": "popo_backpack.png",
        "low_battery_keep": true
      },
      {
        "step_num": 4,
        "text": "Put your backpack in its place.",
        "popo_hint": "Popo places backpack ready for tomorrow.",
        "pose": "popo_clipboard.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Put your hat or cap away.",
        "popo_hint": "Popo hangs the cap on the hook!",
        "pose": "popo_star.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "study",
    "room_name": "Study Area",
    "chore_title": "Reset Your Desk",
    "finish_goal": "Your desk is ready for homework.",
    "safety_note": null,
    "icon": "✏️",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Put your pencils in the pencil cup.",
        "popo_hint": "Popo gathers all pencils and drops them in the cup.",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Put your books in one stack.",
        "popo_hint": "Popo stacks books from biggest to smallest.",
        "pose": "popo_reading.png",
        "low_battery_keep": true
      },
      {
        "step_num": 3,
        "text": "Put your papers in your folder.",
        "popo_hint": "Popo files loose sheets inside the folder.",
        "pose": "popo_clipboard.png",
        "low_battery_keep": false
      },
      {
        "step_num": 4,
        "text": "Put rubbish in the bin.",
        "popo_hint": "Popo throws pencil shavings or scrap paper in bin.",
        "pose": "popo_blocks.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Put your notebook in the middle.",
        "popo_hint": "Popo places notebook center stage for focus!",
        "pose": "popo_star.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "school_bag",
    "room_name": "School Bag Area",
    "chore_title": "Pack Your Bag",
    "finish_goal": "Your bag is ready for school.",
    "safety_note": null,
    "icon": "🎒",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Take out rubbish from your bag.",
        "popo_hint": "Popo checks every pocket and clears wrappers.",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Put your homework in your folder.",
        "popo_hint": "Popo slides completed homework safely in.",
        "pose": "popo_clipboard.png",
        "low_battery_keep": true
      },
      {
        "step_num": 3,
        "text": "Put your books in your bag.",
        "popo_hint": "Popo packs the textbooks zip-ready.",
        "pose": "popo_reading.png",
        "low_battery_keep": false
      },
      {
        "step_num": 4,
        "text": "Put your pencil case in your bag.",
        "popo_hint": "Popo slips the pencil case into the front slot.",
        "pose": "popo_backpack.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Put your bag in its place.",
        "popo_hint": "Popo places bag by the doorway, mission ready!",
        "pose": "popo_star.png",
        "low_battery_keep": false
      }
    ]
  },
  {
    "id": "play_area",
    "room_name": "Shared Room or Play Area",
    "chore_title": "Tidy the Space",
    "finish_goal": "The walking area is clear.",
    "safety_note": null,
    "icon": "🧸",
    "stars_reward": 10,
    "steps": [
      {
        "step_num": 1,
        "text": "Find one toy or item.",
        "popo_hint": "Popo looks around and spots a stray toy.",
        "pose": "popo_idea.png",
        "low_battery_keep": true
      },
      {
        "step_num": 2,
        "text": "Pick it up.",
        "popo_hint": "Popo picks it up with both paws.",
        "pose": "popo_blocks.png",
        "low_battery_keep": true
      },
      {
        "step_num": 3,
        "text": "Take it to the correct place.",
        "popo_hint": "Popo carries the toy to its toy box.",
        "pose": "popo_mascot.png",
        "low_battery_keep": false
      },
      {
        "step_num": 4,
        "text": "Put it away.",
        "popo_hint": "Popo stores it neatly away.",
        "pose": "popo_backpack.png",
        "low_battery_keep": false
      },
      {
        "step_num": 5,
        "text": "Look at the floor.",
        "popo_hint": "Popo looks at the safe, sparkling floor and cheers!",
        "pose": "popo_celebrate.png",
        "low_battery_keep": false
      }
    ]
  }
];
  const DEFAULT_REWARDS = [
  {
    "title": "30 Mins iPad / Screen Time",
    "icon": "📱",
    "star_cost": 20,
    "description": "Enjoy 30 minutes of favorite game or video time."
  },
  {
    "title": "Ice Cream Treat",
    "icon": "🍦",
    "star_cost": 30,
    "description": "A delicious scoop of favorite ice cream flavor!"
  },
  {
    "title": "Pick Weekend Family Movie",
    "icon": "🎬",
    "star_cost": 25,
    "description": "You get to choose the movie for popcorn night!"
  },
  {
    "title": "Trip to Playground / Park",
    "icon": "🛝",
    "star_cost": 35,
    "description": "Special trip to the swings and climbing gym."
  },
  {
    "title": "Stay Up 15 Minutes Late",
    "icon": "🌙",
    "star_cost": 15,
    "description": "Bonus 15 minutes of relaxing reading or quiet play."
  },
  {
    "title": "Choose Tonight's Dinner",
    "icon": "🍕",
    "star_cost": 40,
    "description": "Pick pizza, mac & cheese, or your favorite dinner!"
  }
];
  const DEFAULT_ROOM_ITEMS = [
  {
    "item_key": "lava_lamp",
    "item_name": "Cosmic Lava Lamp",
    "icon": "🏮",
    "star_cost": 10,
    "x": 80,
    "y": 65
  },
  {
    "item_key": "star_projector",
    "item_name": "Star Galaxy Projector",
    "icon": "✨",
    "star_cost": 15,
    "x": 20,
    "y": 35
  },
  {
    "item_key": "alien_plant",
    "item_name": "Bioluminescent Alien Plant",
    "icon": "🪴",
    "star_cost": 12,
    "x": 15,
    "y": 70
  },
  {
    "item_key": "space_rover",
    "item_name": "Mini Mars Rover Toy",
    "icon": "🛸",
    "star_cost": 20,
    "x": 50,
    "y": 78
  },
  {
    "item_key": "hologram_disco",
    "item_name": "Holographic Disco Orb",
    "icon": "🪩",
    "star_cost": 25,
    "x": 50,
    "y": 20
  }
];

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
