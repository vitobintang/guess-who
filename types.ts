export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  isEliminated: boolean;
}

export enum GamePhase {
  SETUP = 'SETUP',
  SELECT_SECRET = 'SELECT_SECRET',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface GameState {
  phase: GamePhase;
  characters: Character[];
  secretCharacterId: string | null;
  turnCount: number;
}