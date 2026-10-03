/**
 * Master ADHD-Friendly Chore Templates & Pre-built Steps
 * Sourced directly from 'ADHD-Friendly 5-Step Chores by Room.txt'
 */

const ROOM_TEMPLATES = [
  {
    id: 'bedroom',
    room_name: 'Bedroom',
    chore_title: 'Reset Your Room',
    finish_goal: 'Your room is ready and safe to walk through.',
    safety_note: null,
    icon: '🛏️',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Put your dirty clothes in the basket.',
        popo_hint: 'Popo carries dirty clothes to the laundry basket.',
        pose: 'popo_backpack.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Put your toys in the toy box.',
        popo_hint: 'Popo puts away toys into the toy box.',
        pose: 'popo_blocks.png',
        low_battery_keep: true
      },
      {
        step_num: 3,
        text: 'Put your books on the shelf.',
        popo_hint: 'Popo stacks books neatly on the shelf.',
        pose: 'popo_reading.png',
        low_battery_keep: false
      },
      {
        step_num: 4,
        text: 'Pull up your blanket.',
        popo_hint: 'Popo smooths out the cozy bed blanket.',
        pose: 'popo_mascot.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Put your pillow on the bed.',
        popo_hint: 'Popo places the fluffy pillow and celebrates!',
        pose: 'popo_star.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'bathroom',
    room_name: 'Bathroom',
    chore_title: 'Finish Your Routine',
    finish_goal: 'The bathroom is ready for the next person.',
    safety_note: null,
    icon: '🧼',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Flush the toilet.',
        popo_hint: 'Popo presses the flush button.',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Wash your hands with soap.',
        popo_hint: 'Popo washes with bubbly suds for 20 seconds!',
        pose: 'popo_mascot.png',
        low_battery_keep: true
      },
      {
        step_num: 3,
        text: 'Dry your hands with the towel.',
        popo_hint: 'Popo dries paws until nice and clean.',
        pose: 'popo_clipboard.png',
        low_battery_keep: false
      },
      {
        step_num: 4,
        text: 'Hang up your towel.',
        popo_hint: 'Popo hangs the towel on the hook.',
        pose: 'popo_backpack.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Turn off the light and close the door.',
        popo_hint: 'Popo clicks off the light and snaps the door shut.',
        pose: 'popo_star.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'kitchen',
    room_name: 'Kitchen',
    chore_title: 'Clear Your Place',
    finish_goal: 'Your dishes and eating space are clear.',
    safety_note: 'Safety: Use only cool food and safe dishes approved by a parent.',
    icon: '🍽️',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Take your plate to the counter.',
        popo_hint: 'Popo carefully carries the plate with both paws.',
        pose: 'popo_mascot.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Take your cup to the counter.',
        popo_hint: 'Popo safely carries the cup over.',
        pose: 'popo_backpack.png',
        low_battery_keep: false
      },
      {
        step_num: 3,
        text: 'Put your food scraps in the bin.',
        popo_hint: 'Popo opens the rubbish bin for scraps.',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 4,
        text: 'Wipe your place at the table.',
        popo_hint: 'Popo wipes down the spot with a clean cloth.',
        pose: 'popo_clipboard.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Push in your chair.',
        popo_hint: 'Popo tucks in the chair nice and snug.',
        pose: 'popo_star.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'dining',
    room_name: 'Dining Area',
    chore_title: 'Help Reset the Table',
    finish_goal: 'The table is ready for the next meal.',
    safety_note: null,
    icon: '🥣',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Take your plate to the counter.',
        popo_hint: 'Popo carries the plate to the kitchen.',
        pose: 'popo_mascot.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Take your cup to the sink or counter.',
        popo_hint: 'Popo places cup by the sink.',
        pose: 'popo_backpack.png',
        low_battery_keep: false
      },
      {
        step_num: 3,
        text: 'Put your napkin in the bin.',
        popo_hint: 'Popo drops the used napkin into the bin.',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 4,
        text: 'Wipe one part of the table.',
        popo_hint: 'Popo wipes side to side.',
        pose: 'popo_clipboard.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Push in your chair.',
        popo_hint: 'Popo pushes the dining chair in.',
        pose: 'popo_star.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'living_room',
    room_name: 'Living Room',
    chore_title: 'Put Your Things Away',
    finish_goal: 'Your things are off the floor and sofa.',
    safety_note: null,
    icon: '🛋️',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Find one thing that belongs to you.',
        popo_hint: 'Popo looks around like a space detective!',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Pick it up.',
        popo_hint: 'Popo lifts the item gently off the floor.',
        pose: 'popo_blocks.png',
        low_battery_keep: true
      },
      {
        step_num: 3,
        text: 'Take it to its place.',
        popo_hint: 'Popo marches over to its home spot.',
        pose: 'popo_backpack.png',
        low_battery_keep: false
      },
      {
        step_num: 4,
        text: 'Put it away.',
        popo_hint: 'Popo places it into the basket or shelf.',
        pose: 'popo_clipboard.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Check the area.',
        popo_hint: 'Popo gives a proud double thumbs-up!',
        pose: 'popo_celebrate.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'laundry',
    room_name: 'Laundry Area',
    chore_title: 'Put Your Clothes in the Basket',
    finish_goal: 'Your dirty clothes are in the laundry basket.',
    safety_note: 'Safety: Do not touch detergent, washing machines, or dryers without permission.',
    icon: '🧺',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Find one dirty piece of clothing.',
        popo_hint: 'Popo scans the floor and points to clothes.',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Pick it up.',
        popo_hint: 'Popo scoops up the shirt.',
        pose: 'popo_mascot.png',
        low_battery_keep: true
      },
      {
        step_num: 3,
        text: 'Walk to the laundry basket.',
        popo_hint: 'Popo walks carefully to the basket.',
        pose: 'popo_backpack.png',
        low_battery_keep: false
      },
      {
        step_num: 4,
        text: 'Put it inside.',
        popo_hint: 'Popo scores a basket goal! Swish!',
        pose: 'popo_blocks.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Check your floor.',
        popo_hint: 'Popo looks around and celebrates a clear floor!',
        pose: 'popo_celebrate.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'entryway',
    room_name: 'Entryway',
    chore_title: 'Get Your Things Ready',
    finish_goal: 'Your things are ready by the door.',
    safety_note: 'Safety: Do not open the door for strangers.',
    icon: '🚪',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Put your shoes together.',
        popo_hint: 'Popo lines up shoes side by side.',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Put your slippers on the shoe rack.',
        popo_hint: 'Popo tucks slippers neatly on the rack.',
        pose: 'popo_blocks.png',
        low_battery_keep: false
      },
      {
        step_num: 3,
        text: 'Hang up your coat or jacket.',
        popo_hint: 'Popo hangs the jacket on the wall hook.',
        pose: 'popo_backpack.png',
        low_battery_keep: true
      },
      {
        step_num: 4,
        text: 'Put your backpack in its place.',
        popo_hint: 'Popo places backpack ready for tomorrow.',
        pose: 'popo_clipboard.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Put your hat or cap away.',
        popo_hint: 'Popo hangs the cap on the hook!',
        pose: 'popo_star.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'study',
    room_name: 'Study Area',
    chore_title: 'Reset Your Desk',
    finish_goal: 'Your desk is ready for homework.',
    safety_note: null,
    icon: '✏️',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Put your pencils in the pencil cup.',
        popo_hint: 'Popo gathers all pencils and drops them in the cup.',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Put your books in one stack.',
        popo_hint: 'Popo stacks books from biggest to smallest.',
        pose: 'popo_reading.png',
        low_battery_keep: true
      },
      {
        step_num: 3,
        text: 'Put your papers in your folder.',
        popo_hint: 'Popo files loose sheets inside the folder.',
        pose: 'popo_clipboard.png',
        low_battery_keep: false
      },
      {
        step_num: 4,
        text: 'Put rubbish in the bin.',
        popo_hint: 'Popo throws pencil shavings or scrap paper in bin.',
        pose: 'popo_blocks.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Put your notebook in the middle.',
        popo_hint: 'Popo places notebook center stage for focus!',
        pose: 'popo_star.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'school_bag',
    room_name: 'School Bag Area',
    chore_title: 'Pack Your Bag',
    finish_goal: 'Your bag is ready for school.',
    safety_note: null,
    icon: '🎒',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Take out rubbish from your bag.',
        popo_hint: 'Popo checks every pocket and clears wrappers.',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Put your homework in your folder.',
        popo_hint: 'Popo slides completed homework safely in.',
        pose: 'popo_clipboard.png',
        low_battery_keep: true
      },
      {
        step_num: 3,
        text: 'Put your books in your bag.',
        popo_hint: 'Popo packs the textbooks zip-ready.',
        pose: 'popo_reading.png',
        low_battery_keep: false
      },
      {
        step_num: 4,
        text: 'Put your pencil case in your bag.',
        popo_hint: 'Popo slips the pencil case into the front slot.',
        pose: 'popo_backpack.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Put your bag in its place.',
        popo_hint: 'Popo places bag by the doorway, mission ready!',
        pose: 'popo_star.png',
        low_battery_keep: false
      }
    ]
  },
  {
    id: 'play_area',
    room_name: 'Shared Room or Play Area',
    chore_title: 'Tidy the Space',
    finish_goal: 'The walking area is clear.',
    safety_note: null,
    icon: '🧸',
    stars_reward: 10,
    steps: [
      {
        step_num: 1,
        text: 'Find one toy or item.',
        popo_hint: 'Popo looks around and spots a stray toy.',
        pose: 'popo_idea.png',
        low_battery_keep: true
      },
      {
        step_num: 2,
        text: 'Pick it up.',
        popo_hint: 'Popo picks it up with both paws.',
        pose: 'popo_blocks.png',
        low_battery_keep: true
      },
      {
        step_num: 3,
        text: 'Take it to the correct place.',
        popo_hint: 'Popo carries the toy to its toy box.',
        pose: 'popo_mascot.png',
        low_battery_keep: false
      },
      {
        step_num: 4,
        text: 'Put it away.',
        popo_hint: 'Popo stores it neatly away.',
        pose: 'popo_backpack.png',
        low_battery_keep: false
      },
      {
        step_num: 5,
        text: 'Look at the floor.',
        popo_hint: 'Popo looks at the safe, sparkling floor and cheers!',
        pose: 'popo_celebrate.png',
        low_battery_keep: false
      }
    ]
  }
];

const DEFAULT_REWARDS = [
  {
    title: '30 Mins iPad / Screen Time',
    icon: '📱',
    star_cost: 20,
    description: 'Enjoy 30 minutes of favorite game or video time.'
  },
  {
    title: 'Ice Cream Treat',
    icon: '🍦',
    star_cost: 30,
    description: 'A delicious scoop of favorite ice cream flavor!'
  },
  {
    title: 'Pick Weekend Family Movie',
    icon: '🎬',
    star_cost: 25,
    description: 'You get to choose the movie for popcorn night!'
  },
  {
    title: 'Trip to Playground / Park',
    icon: '🛝',
    star_cost: 35,
    description: 'Special trip to the swings and climbing gym.'
  },
  {
    title: 'Stay Up 15 Minutes Late',
    icon: '🌙',
    star_cost: 15,
    description: 'Bonus 15 minutes of relaxing reading or quiet play.'
  },
  {
    title: 'Choose Tonight\'s Dinner',
    icon: '🍕',
    star_cost: 40,
    description: 'Pick pizza, mac & cheese, or your favorite dinner!'
  }
];

const DEFAULT_ROOM_ITEMS = [
  {
    item_key: 'lava_lamp',
    item_name: 'Cosmic Lava Lamp',
    icon: '🏮',
    star_cost: 10,
    x: 80,
    y: 65
  },
  {
    item_key: 'star_projector',
    item_name: 'Star Galaxy Projector',
    icon: '✨',
    star_cost: 15,
    x: 20,
    y: 35
  },
  {
    item_key: 'alien_plant',
    item_name: 'Bioluminescent Alien Plant',
    icon: '🪴',
    star_cost: 12,
    x: 15,
    y: 70
  },
  {
    item_key: 'space_rover',
    item_name: 'Mini Mars Rover Toy',
    icon: '🛸',
    star_cost: 20,
    x: 50,
    y: 78
  },
  {
    item_key: 'hologram_disco',
    item_name: 'Holographic Disco Orb',
    icon: '🪩',
    star_cost: 25,
    x: 50,
    y: 20
  }
];

module.exports = {
  ROOM_TEMPLATES,
  DEFAULT_REWARDS,
  DEFAULT_ROOM_ITEMS
};
