import { describe, expect, it } from 'vitest';
import { chooseBestMessage, chooseHealingItem, difficultyScore, parseReward } from '../src/strategy.js';
import type { Message } from '../src/types.js';

describe('strategy', () => {
  it('parses rewards', () => {
    expect(parseReward('123')).toBe(123);
    expect(parseReward('x')).toBe(0);
  });

  it('ranks known safe probabilities higher', () => {
    expect(difficultyScore('Piece of cake')).toBeGreaterThan(difficultyScore('Risky'));
  });

  it('prefers a safer mission over a much riskier one', () => {
    const messages: Message[] = [
      { adId: 'safe', message: 'safe', reward: '80', expiresIn: 10, probability: 'Sure thing' },
      { adId: 'risky', message: 'risky', reward: '500', expiresIn: 10, probability: 'Risky' },
    ];

    expect(chooseBestMessage(messages)?.adId).toBe('safe');
  });

  it('chooses an affordable healing item', () => {
    const item = chooseHealingItem(
      [
        { id: 'upgrade', name: 'Dragon claw', cost: 50 },
        { id: 'heal', name: 'Healing potion', cost: 40 },
      ],
      45,
    );

    expect(item?.id).toBe('heal');
  });
});
