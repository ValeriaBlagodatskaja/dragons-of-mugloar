import {beforeEach, describe, expect, it, vi} from 'vitest'

import {GameRunner} from '../src/gameRunner.js'
import type {
    BuyResult,
    GameState,
    Message,
    ShopItem,
} from '../src/types.js'

describe('GameRunner', () => {
    const initialState: GameState = {
        gameId: 'game-123',
        lives: 3,
        gold: 0,
        level: 0,
        score: 0,
        highScore: 0,
        turn: 0,
    }

    let api: {
        startGame: ReturnType<typeof vi.fn>
        getMessages: ReturnType<typeof vi.fn>
        solve: ReturnType<typeof vi.fn>
        getShop: ReturnType<typeof vi.fn>
        buy: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
        api = {
            startGame: vi.fn(),
            getMessages: vi.fn(),
            solve: vi.fn(),
            getShop: vi.fn(),
            buy: vi.fn(),
        }
    })

    it('starts a game and solves the best safe mission', async () => {
        const messages: Message[] = [
            {
                adId: 'very-safe',
                message: 'Very safe mission',
                reward: '50',
                expiresIn: 5,
                probability: 'Piece of cake',
            },
            {
                adId: 'safe-high-reward',
                message: 'Safe mission with higher reward',
                reward: '300',
                expiresIn: 5,
                probability: 'Quite likely',
            },
            {
                adId: 'risky',
                message: 'Risky mission',
                reward: '1000',
                expiresIn: 5,
                probability: 'Gamble',
            },
        ]

        api.startGame.mockResolvedValue(initialState)
        api.getShop.mockResolvedValue([])
        api.getMessages.mockResolvedValue(messages)
        api.solve.mockResolvedValue({
            success: true,
            lives: 0,
            gold: 300,
            score: 300,
            highScore: 300,
            turn: 1,
        })

        const runner = new GameRunner(api as never)

        const result = await runner.run()

        expect(api.startGame).toHaveBeenCalledOnce()
        expect(api.getShop).toHaveBeenCalledWith('game-123')
        expect(api.getMessages).toHaveBeenCalledWith('game-123')

        expect(api.solve).toHaveBeenCalledWith(
            'game-123',
            'safe-high-reward',
        )

        expect(result).toMatchObject({
            lives: 0,
            gold: 300,
            score: 300,
            turn: 1,
        })
    })

    it('uses a fallback mission when no safe mission is available', async () => {
        const messages: Message[] = [
            {
                adId: 'fallback',
                message: 'Medium risk mission',
                reward: '100',
                expiresIn: 5,
                probability: 'Hmmm....',
            },
            {
                adId: 'dangerous',
                message: 'Dangerous mission',
                reward: '1000',
                expiresIn: 5,
                probability: 'Playing with fire',
            },
        ]

        api.startGame.mockResolvedValue(initialState)
        api.getShop.mockResolvedValue([])
        api.getMessages.mockResolvedValue(messages)
        api.solve.mockResolvedValue({
            success: true,
            lives: 0,
            gold: 100,
            score: 100,
            highScore: 100,
            turn: 1,
        })

        const runner = new GameRunner(api as never)

        await runner.run()

        expect(api.solve).toHaveBeenCalledWith(
            'game-123',
            'fallback',
        )
    })

    it('buys a healing potion when lives are low', async () => {
        const state: GameState = {
            ...initialState,
            lives: 2,
            gold: 100,
        }

        const healingPotion: ShopItem = {
            id: 'hpot',
            name: 'Healing Potion',
            cost: 50,
        }

        const buyResult: BuyResult = {
            shoppingSuccess: true,
            lives: 0,
            gold: 50,
            level: 0,
            turn: 1,
        }

        api.startGame.mockResolvedValue(state)
        api.getShop.mockResolvedValue([healingPotion])
        api.buy.mockResolvedValue(buyResult)

        const runner = new GameRunner(api as never)

        const result = await runner.run()

        expect(api.buy).toHaveBeenCalledWith(
            'game-123',
            'hpot',
        )

        expect(api.getMessages).not.toHaveBeenCalled()

        expect(result).toMatchObject({
            lives: 0,
            gold: 50,
            turn: 1,
        })
    })

    it('buys the best affordable upgrade while keeping gold in reserve', async () => {
        const state: GameState = {
            ...initialState,
            gold: 500,
        }

        const items: ShopItem[] = [
            {
                id: 'basic',
                name: 'Basic Upgrade',
                cost: 100,
            },
            {
                id: 'advanced',
                name: 'Advanced Upgrade',
                cost: 300,
            },
        ]

        const buyResult: BuyResult = {
            shoppingSuccess: true,
            lives: 0,
            gold: 200,
            level: 1,
            turn: 1,
        }

        api.startGame.mockResolvedValue(state)
        api.getShop.mockResolvedValue(items)
        api.buy.mockResolvedValue(buyResult)

        const runner = new GameRunner(api as never)

        const result = await runner.run()

        expect(api.buy).toHaveBeenCalledWith(
            'game-123',
            'advanced',
        )

        expect(result).toMatchObject({
            lives: 0,
            gold: 200,
            level: 1,
            turn: 1,
        })
    })

    it('stops when there are no available missions', async () => {
        api.startGame.mockResolvedValue(initialState)
        api.getShop.mockResolvedValue([])
        api.getMessages.mockResolvedValue([])

        const runner = new GameRunner(api as never)

        const result = await runner.run()

        expect(api.getMessages).toHaveBeenCalledOnce()
        expect(api.solve).not.toHaveBeenCalled()
        expect(result).toEqual(initialState)
    })

    it('reports game state changes through onUpdate', async () => {
        const onUpdate = vi.fn()

        api.startGame.mockResolvedValue(initialState)
        api.getShop.mockResolvedValue([])
        api.getMessages.mockResolvedValue([
            {
                adId: 'mission-1',
                message: 'Safe mission',
                reward: '100',
                expiresIn: 5,
                probability: 'Sure thing',
            },
        ])

        api.solve.mockResolvedValue({
            success: true,
            lives: 0,
            gold: 100,
            score: 150,
            highScore: 150,
            turn: 1,
        })

        const runner = new GameRunner(
            api as never,
            onUpdate,
        )

        await runner.run()

        expect(onUpdate).toHaveBeenCalledWith(initialState)

        expect(onUpdate).toHaveBeenLastCalledWith(
            expect.objectContaining({
                lives: 0,
                gold: 100,
                score: 150,
                turn: 1,
            }),
        )
    })

    it('does not continue playing after stop is called', async () => {
        api.startGame.mockResolvedValue(initialState)

        const runner = new GameRunner(api as never)

        runner.stop()

        const result = await runner.run()

        expect(api.startGame).toHaveBeenCalledOnce()
        expect(api.getShop).not.toHaveBeenCalled()
        expect(api.getMessages).not.toHaveBeenCalled()
        expect(api.solve).not.toHaveBeenCalled()
        expect(result).toEqual(initialState)
    })
})