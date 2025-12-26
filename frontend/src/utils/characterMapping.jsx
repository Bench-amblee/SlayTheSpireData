// Mapping of cards to characters based on Slay the Spire game data
const IRONCLAD_CARDS = [
  'Anger', 'Armaments', 'Bash', 'Battle Trance', 'Blood for Blood', 'Bloodletting', 'Bludgeon',
  'Body Slam', 'Burning Pact', 'Carnage', 'Clash', 'Cleave', 'Clothesline', 'Combust',
  'Corruption', 'Dark Embrace', 'Demon Form', 'Disarm', 'Double Tap', 'Dropkick', 'Dual Wield',
  'Entrench', 'Evolve', 'Exhume', 'Feed', 'Feel No Pain', 'Fiend Fire', 'Fire Breathing',
  'Flame Barrier', 'Flex', 'Ghostly Armor', 'Havoc', 'Headbutt', 'Heavy Blade', 'Hemokinesis',
  'Immolate', 'Impervious', 'Inflame', 'Intimidate', 'Iron Wave', 'Juggernaut', 'Limit Break',
  'Metallicize', 'Offering', 'Pommel Strike', 'Power Through', 'Pummel', 'Rage', 'Rampage',
  'Reaper', 'Reckless Charge', 'Rupture', 'Searing Blow', 'Second Wind', 'Seeing Red',
  'Sentinel', 'Sever Soul', 'Shockwave', 'Shrug It Off', 'Spot Weakness', 'Strike', 'Sword Boomerang',
  'Thunderclap', 'True Grit', 'Twin Strike', 'Upper Cut', 'Warcry', 'Whirlwind', 'Wild Strike'
]

const SILENT_CARDS = [
  'Accuracy', 'Acrobatics', 'Adrenaline', 'After Image', 'All-Out Attack', 'A Thousand Cuts',
  'Backflip', 'Backstab', 'Blade Dance', 'Blur', 'Bouncing Flask', 'Bullet Time', 'Burst',
  'Calculated Gamble', 'Caltrops', 'Catalyst', 'Choke', 'Cloak and Dagger', 'Concentrate',
  'Corpse Explosion', 'Crippling Cloud', 'Dagger Spray', 'Dagger Throw', 'Dash', 'Deadly Poison',
  'Defend', 'Deflect', 'Die Die Die', 'Distraction', 'Dodge and Roll', 'Doppelganger', 'Endless Agony',
  'Envenom', 'Escape Plan', 'Eviscerate', 'Expertise', 'Finisher', 'Flechettes', 'Flying Knee',
  'Footwork', 'Glass Knife', 'Grand Finale', 'Heel Hook', 'Infinite Blades', 'Leg Sweep',
  'Malaise', 'Masterful Stab', 'Neutralize', 'Nightmares', 'Noxious Fumes', 'Outmaneuver',
  'Phantasmal Killer', 'Piercing Wail', 'Poisoned Stab', 'Predator', 'Prepared', 'Quick Slash',
  'Reflex', 'Riddle with Holes', 'Setup', 'Skewer', 'Slice', 'Storm of Steel', 'Strike',
  'Sucker Punch', 'Survivor', 'Tactician', 'Terror', 'Tools of the Trade', 'Unload',
  'Well-Laid Plans', 'Wraith Form'
]

const DEFECT_CARDS = [
  'Aggregate', 'All for One', 'Amplify', 'Auto-Shields', 'Ball Lightning', 'Barrage', 'Beam Cell',
  'Biased Cognition', 'Blizzard', 'Boot Sequence', 'Buffer', 'Bullseye', 'Capacitor', 'Chaos',
  'Chill', 'Claw', 'Cold Snap', 'Compile Driver', 'Consume', 'Coolheaded', 'Core Surge',
  'Creative AI', 'Darkness', 'Defragment', 'Defend', 'Dualcast', 'Echo Form', 'Electrodynamics',
  'Equilibrium', 'FTL', 'Fission', 'Force Field', 'Fusion', 'Genetic Algorithm', 'Glacier',
  'Go for the Eyes', 'ハイパービーム', 'Heatsinks', 'Hello World', 'Hologram', 'Hyperbeam',
  'Leap', 'Loop', 'Machine Learning', 'Melter', 'Meteor Strike', 'Multi-Cast', 'Overclock',
  'Rainbow', 'Reboot', 'Recycle', 'Recursion', 'Redo', 'Reinforced Body', 'Reprogram',
  'Rip and Tear', 'Scrape', 'Seek', 'Self Repair', 'Skim', 'Stack', 'Static Discharge',
  'Steam Barrier', 'Storm', 'Streamline', 'Strike', 'Sunder', 'Sweeping Beam', 'Tempest',
  'Thunder Strike', 'Turbo', 'Undo', 'White Noise', 'Zap'
]

const WATCHER_CARDS = [
  'Alpha', 'Battle Hymn', 'Blasphemy', 'Bowling Bash', 'Brilliance', 'Carve Reality', 'Conclude',
  'Conjure Blade', 'Consecrate', 'Crescendo', 'Crush Joints', 'Cut Through Fate', 'Deceive Reality',
  'Defend', 'Deva Form', 'Devotion', 'Empty Body', 'Empty Fist', 'Empty Mind', 'Establishment',
  'Evaluate', 'Fasting', 'Fear No Evil', 'Flurry of Blows', 'Flying Sleeves', 'Follow-Up',
  'Foresight', 'Foreign Influence', 'Halt', 'Indignation', 'Inner Peace', 'Just Lucky',
  'Lesson Learned', 'Like Water', 'Master Reality', 'Meditate', 'Mental Fortress', 'Nirvana',
  'Omniscience', 'Perseverance', 'Pray', 'Pressure Points', 'Prostrate', 'Protect', 'Ragnarok',
  'Reach Heaven', 'Rushdown', 'Sanctity', 'Sands of Time', 'Scrawl', 'Signature Move', 'Simmer',
  'Spirit Shield', 'Strike', 'Study', 'Swivel', 'Talk to the Hand', 'Tantrum', 'Third Eye',
  'Tranquility', 'Vault', 'Vigilance', 'Wallop', 'Wave of the Hand', 'Weave', 'Wheel Kick',
  'Windmill Strike', 'Worship', 'Wreath of Flame'
]

const IRONCLAD_RELICS = [
  'Burning Blood', 'Black Blood', 'Mark of Pain', 'Runic Cube', 'Violet Lotus',
  'Black Star', 'Calling Bell', 'Coffee Dripper', 'Cursed Key', 'Ectoplasm',
  'Empty Cage', 'Fusion Hammer', 'Pandora\'s Box', 'Philosopher\'s Stone',
  'Runic Dome', 'Runic Pyramid', 'Sacred Bark', 'Snecko Eye', 'Sozu', 'Tiny House',
  'Velvet Choker', 'Astrolabe', 'Busted Crown', 'Eternal Feather'
]

const SILENT_RELICS = [
  'Ring of the Snake', 'Ring of the Serpent', 'Snecko Skull', 'Wrist Blade',
  'Black Star', 'Calling Bell', 'Coffee Dripper', 'Cursed Key', 'Ectoplasm',
  'Empty Cage', 'Fusion Hammer', 'Pandora\'s Box', 'Philosopher\'s Stone',
  'Runic Dome', 'Runic Pyramid', 'Sacred Bark', 'Snecko Eye', 'Sozu', 'Tiny House',
  'Velvet Choker', 'Astrolabe', 'Busted Crown'
]

const DEFECT_RELICS = [
  'Cracked Core', 'Frozen Core', 'Nuclear Battery', 'Inserter',
  'Black Star', 'Calling Bell', 'Coffee Dripper', 'Cursed Key', 'Ectoplasm',
  'Empty Cage', 'Fusion Hammer', 'Pandora\'s Box', 'Philosopher\'s Stone',
  'Runic Dome', 'Runic Pyramid', 'Sacred Bark', 'Snecko Eye', 'Sozu', 'Tiny House',
  'Velvet Choker', 'Astrolabe', 'Busted Crown', 'DataDisk'
]

const WATCHER_RELICS = [
  'Pure Water', 'Violet Lotus', 'Holy Water',
  'Black Star', 'Calling Bell', 'Coffee Dripper', 'Cursed Key', 'Ectoplasm',
  'Empty Cage', 'Fusion Hammer', 'Pandora\'s Box', 'Philosopher\'s Stone',
  'Runic Dome', 'Runic Pyramid', 'Sacred Bark', 'Snecko Eye', 'Sozu', 'Tiny House',
  'Velvet Choker', 'Astrolabe', 'Busted Crown'
]

export const getCardCharacter = (cardName) => {
  // Remove upgrade markers
  const cleanName = cardName.replace(/\+\d+$/, '').trim()

  if (IRONCLAD_CARDS.includes(cleanName)) return 'IRONCLAD'
  if (SILENT_CARDS.includes(cleanName)) return 'THE_SILENT'
  if (DEFECT_CARDS.includes(cleanName)) return 'DEFECT'
  if (WATCHER_CARDS.includes(cleanName)) return 'WATCHER'

  return 'COLORLESS' // Colorless/neutral cards
}

export const getRelicCharacter = (relicName) => {
  if (IRONCLAD_RELICS.includes(relicName)) return 'IRONCLAD'
  if (SILENT_RELICS.includes(relicName)) return 'THE_SILENT'
  if (DEFECT_RELICS.includes(relicName)) return 'DEFECT'
  if (WATCHER_RELICS.includes(relicName)) return 'WATCHER'

  return 'COLORLESS' // Colorless/neutral relics
}

export const CharacterIcon = ({ character, size = 'small' }) => {
  const configs = {
    'IRONCLAD': { letter: 'I', color: '#c53030' },
    'THE_SILENT': { letter: 'S', color: '#38a169' },
    'DEFECT': { letter: 'D', color: '#3182ce' },
    'WATCHER': { letter: 'W', color: '#805ad5' },
    'COLORLESS': { letter: 'C', color: '#888899' }
  }

  const config = configs[character] || configs['COLORLESS']
  const sizeMap = {
    small: { width: '24px', height: '24px', fontSize: '0.75rem' },
    medium: { width: '32px', height: '32px', fontSize: '1rem' }
  }

  const dimensions = sizeMap[size]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: config.color,
        color: '#fff',
        fontWeight: '700',
        fontSize: dimensions.fontSize,
        borderRadius: '4px',
        marginRight: '0.5rem',
        flexShrink: 0
      }}
    >
      {config.letter}
    </span>
  )
}
