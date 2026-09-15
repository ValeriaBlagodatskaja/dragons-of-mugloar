import { describe, expect, it } from 'vitest';
import {
  chooseBestMessage,
  chooseFallbackMessage,
  chooseHealingItem,
  chooseUpgrade,
  difficultyScore,
  parseReward,
} from '../src/strategy.js';
import type { Message } from '../src/types.js';

describe('strategy', () => {
  it('parses rewards', () => {
    expect(parseReward('123')).toBe(123);
    expect(parseReward('x')).toBe(0);
  });

  it('ranks known safe probabilities higher', () => {
    expect(difficultyScore('Piece of cake')).toBeGreaterThan(
        difficultyScore('Risky'),
    );
  });

  it('prefers a safer mission over a much riskier one', () => {
    const messages: Message[] = [
      {
        adId: 'safe',
        message: 'safe',
        reward: '80',
        expiresIn: 10,
        probability: 'Sure thing',
      },
      {
        adId: 'risky',
        message: 'risky',
        reward: '500',
        expiresIn: 10,
        probability: 'Risky',
      },
    ];

    expect(chooseBestMessage(messages)?.adId).toBe('safe');
  });

  it('chooses an affordable healing item', () => {
    const item = chooseHealingItem(
        [
          { id: 'upgrade', name: 'Dragon claw', cost: 50 },
          { id: 'hpot', name: 'Healing potion', cost: 40 },
        ],
        45,
    );

    expect(item?.id).toBe('hpot');
  });

  it('keeps gold in reserve when choosing an upgrade', () => {
    const item = chooseUpgrade(
        [
          { id: 'hpot', name: 'Healing potion', cost: 50 },
          { id: 'basic', name: 'Basic upgrade', cost: 100 },
          { id: 'advanced', name: 'Advanced upgrade', cost: 300 },
        ],
        200,
    );

    expect(item?.id).toBe('basic');
  });

  it('chooses a reasonable fallback when no safe mission is available', () => {
    const messages: Message[] = [
      {
        adId: 'gamble',
        message: 'Risky task',
        reward: '50',
        expiresIn: 5,
        probability: 'Gamble',
      },
      {
        adId: 'suicide',
        message: 'Very dangerous task',
        reward: '500',
        expiresIn: 5,
        probability: 'Suicide mission',
      },
    ];

    expect(chooseFallbackMessage(messages)?.adId).toBe('gamble');
  });

  it('avoids extremely dangerous fallback missions', () => {
    const messages: Message[] = [
      {
        adId: 'fire',
        message: 'Dangerous task',
        reward: '100',
        expiresIn: 5,
        probability: 'Playing with fire',
      },
      {
        adId: 'suicide',
        message: 'Very dangerous task',
        reward: '500',
        expiresIn: 5,
        probability: 'Suicide mission',
      },
    ];

    expect(chooseFallbackMessage(messages)).toBeUndefined();
  });
});