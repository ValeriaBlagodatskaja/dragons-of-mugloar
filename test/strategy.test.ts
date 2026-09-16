import {describe, expect, it} from 'vitest'
import {
    chooseBestMessage,
    chooseFallbackMessage,
    chooseHealingItem,
    chooseLastResortMessage,
    chooseUpgrade,
    difficultyScore,
    parseReward,
} from '../src/strategy.js'
import type {Message} from '../src/types.js'

describe('strategy', () => {
    it('parses rewards', () => {
        expect(parseReward('123')).toBe(123)
        expect(parseReward('x')).toBe(0)
    })

    it('ranks known safe probabilities higher', () => {
        expect(difficultyScore('Piece of cake')).toBeGreaterThan(
            difficultyScore('Risky'),
        )
    })

    it('chooses the highest reward among safe missions', () => {
        const messages: Message[] = [
            {
                adId: 'very-safe',
                message: 'Very safe task',
                reward: '50',
                expiresIn: 10,
                probability: 'Piece of cake',
            },
            {
                adId: 'safe-high-reward',
                message: 'Safe task with better reward',
                reward: '300',
                expiresIn: 10,
                probability: 'Quite likely',
            },
            {
                adId: 'risky',
                message: 'Risky task',
                reward: '1000',
                expiresIn: 10,
                probability: 'Gamble',
            },
        ]

        expect(chooseBestMessage(messages)?.adId).toBe('safe-high-reward')
    })

    it('does not choose a risky mission while a safe mission is available', () => {
        const messages: Message[] = [
            {
                adId: 'safe',
                message: 'Safe task',
                reward: '50',
                expiresIn: 10,
                probability: 'Sure thing',
            },
            {
                adId: 'risky',
                message: 'Risky task',
                reward: '1000',
                expiresIn: 10,
                probability: 'Gamble',
            },
        ]

        expect(chooseBestMessage(messages)?.adId).toBe('safe')
    })

    it('chooses an affordable healing item', () => {
        const item = chooseHealingItem(
            [
                {id: 'upgrade', name: 'Dragon claw', cost: 50},
                {id: 'hpot', name: 'Healing potion', cost: 40},
            ],
            45,
        )

        expect(item?.id).toBe('hpot')
    })

    it('keeps gold in reserve when choosing an upgrade', () => {
        const item = chooseUpgrade(
            [
                {id: 'hpot', name: 'Healing potion', cost: 50},
                {id: 'basic', name: 'Basic upgrade', cost: 100},
                {id: 'advanced', name: 'Advanced upgrade', cost: 300},
            ],
            200,
        )

        expect(item?.id).toBe('basic')
    })

    it('chooses a fallback only when no safe mission is available', () => {
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
        ]

        expect(chooseBestMessage(messages)).toBeUndefined()
        expect(chooseFallbackMessage(messages)?.adId).toBe('gamble')
    })

    it('prefers the safer mission within the fallback tier', () => {
        const messages: Message[] = [
            {
                adId: 'hmmm',
                message: 'Medium risk task',
                reward: '50',
                expiresIn: 5,
                probability: 'Hmmm....',
            },
            {
                adId: 'gamble',
                message: 'Higher risk task',
                reward: '500',
                expiresIn: 5,
                probability: 'Gamble',
            },
        ]

        expect(chooseFallbackMessage(messages)?.adId).toBe('hmmm')
    })

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
        ]

        expect(chooseFallbackMessage(messages)).toBeUndefined()
    })

    it('chooses the safest available mission as a last resort', () => {
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
        ]

        expect(chooseLastResortMessage(messages)?.adId).toBe('fire')
    })
})