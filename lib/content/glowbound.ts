import type { FaqItem } from '@/lib/seo/structured-data';

export const CONTROL_ROWS = [
  {
    input: 'Mouse',
    action: 'Move',
    detail: 'The orb glides toward the pointer. Small, smooth movements beat fast flicks.',
  },
  {
    input: 'Touch',
    action: 'Drag',
    detail: 'Drag anywhere on the arena to steer. Your finger never has to cover the orb.',
  },
  {
    input: 'Arrow keys / WASD',
    action: 'Move',
    detail: 'Keyboard steering with momentum — useful for precise dodges.',
  },
  {
    input: 'Space / Enter',
    action: 'Start',
    detail: 'Starts a run from the menu, or confirms a restart from the results screen.',
  },
  {
    input: 'P / Escape',
    action: 'Pause',
    detail: 'Freezes the run. The arena also pauses automatically when you switch tabs.',
  },
  {
    input: 'M',
    action: 'Mute',
    detail: 'Toggles the synthesised sound effects. The setting is remembered.',
  },
] as const;

export const SCORING_RULES = [
  {
    title: 'Survival points',
    detail: 'You earn 9 points per second for staying alive, multiplied by your current multiplier.',
  },
  {
    title: 'Energy gems',
    detail: 'Each gem is worth 25 points times your multiplier and adds one combo point.',
  },
  {
    title: 'Multipliers',
    detail: 'Every fourth gem raises your multiplier by one, up to 8x. A hit resets it to 1x.',
  },
  {
    title: 'Combo window',
    detail: 'Collect a gem within about three seconds of the last one to keep the chain alive.',
  },
] as const;

export const STRATEGY_TIPS = [
  'Stay near the middle-left of the arena. Hazards enter from the right and the top, so the centre-left gives you the most reaction time without cornering yourself.',
  'Collect gems on your way to open space instead of crossing the arena for them. A 2x gem is not worth losing a heart.',
  'Read laser gates early: line up with the cyan gap before the beam reaches you, then hold that line.',
  'Keep the combo window alive with easy gems during calm moments so the multiplier is already high when the next cluster arrives.',
  'Even levels bring noticeably faster shards, and from level 3 laser gates appear. Expect the jump instead of panicking.',
  'Use pause freely. It is a single-player score chase, not a tournament.',
] as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is GlowBound free to play?',
    answer:
      'Yes. GlowBound runs in the browser with no download, account, payment or advertisement. Open the game page and press Play.',
  },
  {
    question: 'Does GlowBound work on mobile phones?',
    answer:
      'Yes. The arena is responsive and touch-ready: drag anywhere on the playfield to steer the orb. Landscape orientation gives you the widest view of incoming hazards.',
  },
  {
    question: 'Is there a global leaderboard?',
    answer:
      'No. GlowBound has no backend, so scores are personal bests saved in your own browser with localStorage. You can share a result link or text through your device share sheet, but there is no public ranking.',
  },
  {
    question: 'How is my personal best saved?',
    answer:
      'Your best classic score, your best daily-challenge score for each day and your sound preference are stored locally in your browser. Clearing site data removes them, and they do not sync between devices.',
  },
  {
    question: 'What is the daily challenge?',
    answer:
      'Every UTC day generates a fixed seed, so the daily challenge spawns the same hazard and gem sequence for everyone who plays that day. It runs slightly faster than classic mode. Your best score for today stays on your device.',
  },
  {
    question: 'How do I get a higher score?',
    answer:
      'Survive, but do it with a high multiplier. Collect gems every few seconds to keep the combo alive, and avoid hits: a single hit drops your multiplier back to 1x and costs one of your three hearts.',
  },
  {
    question: 'Can I play GlowBound offline?',
    answer:
      'Once the page has loaded, a run does not need a network connection. The site itself is not a full offline app, so a fresh visit still requires a connection.',
  },
  {
    question: 'Which browsers are supported?',
    answer:
      'Current versions of Chrome, Edge, Firefox and Safari on desktop and mobile. GlowBound uses HTML5 Canvas and the Web Audio API; if audio is blocked by autoplay rules, it starts after your first tap or click.',
  },
];

export const HOME_FAQ_ITEMS: FaqItem[] = FAQ_ITEMS.slice(0, 5);
