import type { Message, ShopItem } from './types.js';

const DIFFICULTY_SCORE: Record<string, number> = {
  'piece of cake': 100,
  'sure thing': 95,
  'walk in the park': 90,
  'quite likely': 80,
  'hmmm....': 60,
  'hmmm...': 60,
  'gamble': 45,
  'risky': 30,
  'rather detrimental': 20,
  'playing with fire': 10,
  'suicide mission': 0,
};

export function parseReward(reward: string): number {
  const parsed = Number.parseInt(reward, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function difficultyScore(probability?: string): number {
  if (!probability) return 50;
  return DIFFICULTY_SCORE[probability.trim().toLowerCase()] ?? 50;
}

export function missionScore(message: Message): number {
  const safety = difficultyScore(message.probability);
  const reward = parseReward(message.reward);
  const urgencyBonus = message.expiresIn <= 2 ? 15 : message.expiresIn <= 5 ? 5 : 0;

  // Safety dominates. Reward breaks ties among similarly safe tasks.
  return safety * 1000 + reward * 2 + urgencyBonus;
}

export function chooseBestMessage(messages: Message[]): Message | undefined {
  return [...messages]
    .filter((message) => difficultyScore(message.probability) >= 60)
    .sort((a, b) => missionScore(b) - missionScore(a))[0];
}

function isHealingItem(item: ShopItem): boolean {
  const name = item.name.toLowerCase();
  return name.includes('heal') || name.includes('health') || name.includes('life') || name.includes('potion');
}

export function chooseHealingItem(items: ShopItem[], gold: number): ShopItem | undefined {
  return [...items]
    .filter((item) => item.cost <= gold && isHealingItem(item))
    .sort((a, b) => a.cost - b.cost)[0];
}

export function chooseUpgrade(items: ShopItem[], gold: number): ShopItem | undefined {
  // Keep a safety reserve for healing. Prefer the best affordable non-healing item.
  const reserve = 75;
  return [...items]
    .filter((item) => item.cost <= Math.max(0, gold - reserve) && !isHealingItem(item))
    .sort((a, b) => b.cost - a.cost)[0];
}
