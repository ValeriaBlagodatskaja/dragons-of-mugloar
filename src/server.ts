import cors from 'cors'
import express from 'express'

import { GameRunner } from './gameRunner.js'
import type { GameState } from './types.js'
import { chooseBestMessage } from './strategy.js'

const app = express()
const port = 3000
let autoGameState: GameState | null = null
let autoGameStatus: 'idle' | 'running' | 'finished' | 'error' = 'idle'

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.post('/api/game/start', async (_req, res) => {
    try {
        const game = await fetch('https://dragonsofmugloar.com/api/v2/game/start', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
        })

        if (!game.ok) {
            throw new Error(`Mugloar API returned ${game.status}`)
        }

        const data = await game.json()

        res.json(data)
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to start game',
        })
    }
})

app.post('/api/game/:gameId/missions/:missionId/solve', async (req, res) => {
    try {
        const { gameId, missionId } = req.params

        const response = await fetch(
            `https://dragonsofmugloar.com/api/v2/${gameId}/solve/${missionId}`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
            },
        )

        if (!response.ok) {
            throw new Error(`Mugloar API returned ${response.status}`)
        }

        const result = await response.json()

        res.json(result)
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to solve mission',
        })
    }
})

app.get('/api/game/:gameId/messages', async (req, res) => {
    try {
        const { gameId } = req.params

        const response = await fetch(
            `https://dragonsofmugloar.com/api/v2/${gameId}/messages`,
            {
                headers: {
                    Accept: 'application/json',
                },
            },
        )

        if (!response.ok) {
            throw new Error(`Mugloar API returned ${response.status}`)
        }

        const messages = await response.json() as Array<{
            adId: string
            message: string
            reward: string
            expiresIn: number
            probability?: string
        }>

        const recommendedMessage = chooseBestMessage(messages)

        const mappedMessages = messages.map(({ adId, ...message }) => ({
            missionId: adId,
            ...message,
            recommended: adId === recommendedMessage?.adId,
        }))

        res.json(mappedMessages)
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to load missions',
        })
    }
})

app.get('/api/game/:gameId/shop', async (req, res) => {
    try {
        const { gameId } = req.params

        const response = await fetch(
            `https://dragonsofmugloar.com/api/v2/${gameId}/shop`,
            {
                headers: {
                    Accept: 'application/json',
                },
            },
        )

        if (!response.ok) {
            throw new Error(`Mugloar API returned ${response.status}`)
        }

        const items = await response.json()

        res.json(items)
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error
                ? error.message
                : 'Could not load shop items',
        })
    }
})

app.post('/api/game/:gameId/shop/:itemId/buy', async (req, res) => {
    try {
        const { gameId, itemId } = req.params

        const response = await fetch(
            `https://dragonsofmugloar.com/api/v2/${gameId}/shop/buy/${itemId}`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
            },
        )

        if (!response.ok) {
            throw new Error(`Mugloar API returned ${response.status}`)
        }

        const result = await response.json()

        res.json(result)
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error
                ? error.message
                : 'Could not purchase the item',
        })
    }
})

app.post('/api/auto-game/start', (_req, res) => {
    if (autoGameStatus === 'running') {
        res.status(409).json({
            error: 'A game is already running',
        })
        return
    }

    autoGameState = null
    autoGameStatus = 'running'

    const runner = new GameRunner(undefined, (state) => {
        autoGameState = state
    })

    runner.run()
        .then((state) => {
            autoGameState = state
            autoGameStatus = 'finished'
        })
        .catch((error) => {
            console.error('Automatic game failed:', error)
            autoGameStatus = 'error'
        })

    res.status(202).json({
        status: autoGameStatus,
    })
})

app.get('/api/auto-game/status', (_req, res) => {
    res.json({
        status: autoGameStatus,
        state: autoGameState,
    })
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})