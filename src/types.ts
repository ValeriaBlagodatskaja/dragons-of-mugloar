export interface GameState {
  gameId: string;
  lives: number;
  gold: number;
  level: number;
  score: number;
  highScore: number;
  turn: number;
}

export interface Message {
  adId: string;
  message: string;
  reward: string;
  expiresIn: number;
  probability?: string;
}

export interface SolveResult {
  success: boolean;
  lives: number;
  gold: number;
  score: number;
  highScore: number;
  turn: number;
  message: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
}

export interface BuyResult {
  shoppingSuccess: string;
  gold: number;
  lives: number;
  level: number;
  turn: number;
}
