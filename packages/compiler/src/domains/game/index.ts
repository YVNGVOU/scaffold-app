import type { DomainModule } from '../types.js';

const KEYWORDS = [
  'game', 'gameplay', 'level design', 'unity', 'unreal', 'godot', 'roblox',
  'player', 'npc', 'boss fight', 'rpg', 'fps', 'platformer', 'horror game',
  'multiplayer', 'game engine', 'sprite', 'game jam',
];

export const gameDomain: DomainModule = {
  id: 'game',
  label: 'Game Development',
  score(input: string): number {
    const text = input.toLowerCase();
    let score = 0;
    for (const kw of KEYWORDS) {
      if (text.includes(kw)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define core gameplay loop', category: 'functional' },
    { text: 'Target platform(s) must support chosen engine', category: 'constraint' },
    { text: 'Basic input handling (keyboard/mouse/controller as applicable)', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'platform',
      description: 'Target platform (PC, console, mobile, web) is unspecified',
      isResolved: (input) => /(pc|console|mobile|web|steam|playstation|xbox|switch|ios|android)/i.test(input),
    },
    {
      field: 'genre',
      description: 'Game genre is unspecified',
      isResolved: (input) => /(horror|platformer|rpg|fps|puzzle|strategy|racing|shooter|adventure|sandbox|simulation|roguelike)/i.test(input),
    },
    {
      field: 'engine',
      description: 'Game engine is unspecified',
      isResolved: (input) => /(unity|unreal|godot|roblox|gamemaker|custom engine)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'engine', dependsOn: [], note: 'Game engine / runtime choice' },
    { component: 'core loop', dependsOn: ['engine'], note: 'Primary gameplay loop and state machine' },
    { component: 'assets', dependsOn: ['engine'], note: 'Art, audio, and animation pipeline' },
    { component: 'platform target', dependsOn: ['engine', 'core loop'], note: 'Build/ship target(s)' },
  ],
};
