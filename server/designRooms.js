// Rooms and quests exactly as shown in "CanDo! App UI Design" (screens 2.1a-2.1k, 4.1-4.1f).
// Step tuple: [instruction, what Popo says, Popo pose]
const single = (title) => ({ title, steps: [[title + '.', null, null]] });
const list = (...titles) => titles.map(single);

const BEDROOM = [
  { title: 'Clear Your Bed', steps: [
    ['Pick up the toys on your bed.', 'Let’s go! One tiny step. You’ve got this!', 'demonstrating'],
    ['Put the toys in your toy box.', 'Ha, nice one! Just one more to go!', 'demonstrating'],
    ['Remove any other objects from your bed.', 'Wow, you’re so close! Last step!', 'demonstrating']] },
  { title: 'Fix Your Bedsheet', steps: [
    ['Find the loose bedsheet.', 'Ready to be a bedsheet ninja? Let’s go!', 'explaining'],
    ['Pull the bedsheet straight.', 'Smooth moves! Keep going!', 'explaining'],
    ['Smooth the bedsheet with your hands.', 'Almost done. Popo loves it!', 'explaining']] },
  { title: 'Arrange Your Pillow', steps: [
    ['Pick up your pillow.', 'Pillow time! This is going to be fun!', 'ar-point'],
    ['Fluff your pillow with both hands.', 'Whoa, so fluffy! Great work!', 'ar-point'],
    ['Place your pillow at the top of your bed.', 'Popo loves that cosy pillow!', 'ar-point']] },
  { title: 'Spread Your Blanket', steps: [
    ['Pick up your blanket.', 'You’re doing great! Grab that blanket!', 'demonstrating'],
    ['Open your blanket.', 'Big blanket, bigger you! Open it up!', 'demonstrating'],
    ['Spread your blanket over your bed.', 'Whoosh! The blanket landed!', 'demonstrating']] },
  { title: 'Finish Your Bed', steps: [
    ['Pull the blanket towards the bottom of your bed.', 'Wow, the finish line is near!', 'encouraging'],
    ['Straighten the blanket edges.', 'Nearly there! Straight edges, easy!', 'encouraging'],
    ['Look at your neat bed!', 'You did it! Look at that neat bed!', 'encouraging']] }
];

const DESIGN_ROOMS = [
  { id: 'bedroom', name: 'Bedroom', planet: 'Planet Bedroom', quests: BEDROOM },
  { id: 'bathroom', name: 'Bathroom', planet: 'Planet Bathroom', quests: list('Flush and wave bye', 'Bubble-wash your hands', 'Dry your hands', 'Hang the towel', 'Light off, door closed') },
  { id: 'kitchen', name: 'Kitchen', planet: 'Planet Kitchen', quests: list('Rice plate to the sink', 'Cup and spoon to the sink', 'Rice bits in the bin', 'Wipe your table spot', 'Tuck in your chair') },
  { id: 'dining', name: 'Dining Area', planet: 'Planet Dining', quests: list('Rice plate to the sink', 'Glass to the sink', 'Tissue in the bin', 'Wipe the table', 'Tuck in your chair') },
  { id: 'living_room', name: 'Living Room', planet: 'Planet Living Room', quests: list('Spot one thing', 'Scoop it up', 'Take it home', 'Fluff the cushions', 'Straighten the carpet') },
  { id: 'laundry', name: 'Laundry Area', planet: 'Planet Laundry', quests: list('Spot dirty clothes', 'Scoop it up', 'Walk to the basket', 'Drop them in', 'Hang clothes on the rack') },
  { id: 'entryway', name: 'Entryway', planet: 'Planet Entryway', quests: list('Shoes on the rack', 'Slippers in a pair', 'Hang up your coat', 'Backpack goes home', 'Umbrella in its stand') },
  { id: 'study', name: 'Study Area', planet: 'Planet Study', quests: list('Pencils in the cup', 'Stack the textbooks', 'Papers in the folder', 'Eraser bits in the bin', 'Notebook in the middle') },
  { id: 'school_bag', name: 'School Bag Area', planet: 'Planet School Bag', quests: list('Clear out the rubbish', 'Homework in the folder', 'Textbooks in the bag', 'Pencil case in the bag', 'Fill the water bottle') },
  { id: 'play_area', name: 'Shared Room', planet: 'Planet Playroom', quests: list('Spot one toy', 'Scoop it up', 'Take it home', 'Tuck it away', 'Roll up the play mat') }
];

// Wardrobe prices from screens 6.0 - 6.2
const WARDROBE = [
  { key: 'star_cap', name: 'Star Cap', tab: 'hats', cost: 10 },
  { key: 'astro_helmet', name: 'Astro Helmet', tab: 'hats', cost: 20 },
  { key: 'crown', name: 'Crown', tab: 'hats', cost: 150 },
  { key: 'moon_beanie', name: 'Moon Beanie', tab: 'hats', cost: 30 },
  { key: 'star_shades', name: 'Star Shades', tab: 'gear', cost: 15 },
  { key: 'space_goggles', name: 'Space Goggles', tab: 'gear', cost: 25 },
  { key: 'hero_cape', name: 'Hero Cape', tab: 'gear', cost: 35 },
  { key: 'bow_tie', name: 'Bow Tie', tab: 'gear', cost: 12 },
  { key: 'cosmic_glow', name: 'Cosmic Glow', tab: 'backdrops', cost: 5 },
  { key: 'moon_mint', name: 'Moon Mint', tab: 'backdrops', cost: 10 },
  { key: 'sunny_planet', name: 'Sunny Planet', tab: 'backdrops', cost: 20 },
  { key: 'pink_nebula', name: 'Pink Nebula', tab: 'backdrops', cost: 25 }
];

module.exports = { DESIGN_ROOMS, WARDROBE };
