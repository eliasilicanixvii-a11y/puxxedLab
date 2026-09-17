export type GameStatus = 'LANDING' | 'MENU' | 'PLAYING' | 'WIN' | 'GAME_OVER' | 'EDITOR';

export interface LevelConfig {
  id: number;
  name: string;
  isChallenge: boolean;
  gravityY: number; // 1 for normal, -1 for challenge (inverse physics)
  azuroPos: { x: number; y: number };
  cheesePos: { x: number; y: number };
  ropes: Array<{
    x: number;
    y: number;
    length: number;
  }>;
  hornets: Array<{
    x: number;
    y: number;
  }>;
}
