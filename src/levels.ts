import { LevelConfig } from './types';

export const levels: LevelConfig[] = [
  {
    id: 1,
    name: "Livello 1",
    isChallenge: false,
    gravityY: 1,
    azuroPos: { x: 400, y: 550 },
    cheesePos: { x: 400, y: 150 },
    ropes: [
      { x: 400, y: 50, length: 100 }
    ],
    hornets: []
  },
  {
    id: 2,
    name: "Livello 2",
    isChallenge: false,
    gravityY: 1,
    azuroPos: { x: 400, y: 550 },
    cheesePos: { x: 400, y: 200 },
    ropes: [
      { x: 300, y: 100, length: 141 },
      { x: 500, y: 100, length: 141 }
    ],
    hornets: []
  },
  {
    id: 3,
    name: "Livello 3 - Più Difficile",
    isChallenge: false,
    gravityY: 1.2,
    azuroPos: { x: 400, y: 550 },
    cheesePos: { x: 400, y: 200 },
    ropes: [
      { x: 200, y: 100, length: 223 },
      { x: 600, y: 100, length: 223 },
      { x: 400, y: 50, length: 150 }
    ],
    hornets: [
      { x: 100, y: 450 }
    ]
  },
  {
    id: 4,
    name: "CHALLENGE LEVEL 1",
    isChallenge: true,
    gravityY: -1, // Inverse gravity!
    azuroPos: { x: 400, y: 50 },
    cheesePos: { x: 400, y: 450 },
    ropes: [
      { x: 250, y: 500, length: 158 },
      { x: 550, y: 500, length: 158 }
    ],
    hornets: [
      { x: 600, y: 300 }
    ]
  },
  {
    id: 5,
    name: "CHALLENGE LEVEL 2 - Caos",
    isChallenge: true,
    gravityY: -1.2,
    azuroPos: { x: 400, y: 50 },
    cheesePos: { x: 400, y: 450 },
    ropes: [
      { x: 200, y: 550, length: 223 },
      { x: 600, y: 550, length: 223 },
      { x: 400, y: 550, length: 100 }
    ],
    hornets: [
      { x: 200, y: 250 },
      { x: 600, y: 250 }
    ]
  }
];
