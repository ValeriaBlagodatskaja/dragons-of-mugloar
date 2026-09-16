import cors from 'cors'
import express from 'express'

import {MugloarApiClient, MugloarApiError} from './apiClient.js'
import {GameRunner} from './gameRunner.js'
import {chooseBestMessage} from './strategy.js'
import type {GameState} from './types.js'

export const app = express()
const api = new MugloarApiClient()
let autoGameState: GameState | null = null
let autoGameStatus: 'idle' | 'running' | 'finished' | 'error' = 'idle'
let autoGameRunner: GameRunner | null = null

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
    res.json({status: 'ok'})
})

app.post('/api/game/start', async (_req, res) => {
    try {
        const game = await api.startGame()
        res.json(game)
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to start game',
        })
    }
})

app.post('/api/game/:gameId/missions/:missionId/solve', async (req, res) => {
    try {
        const {gameId, missionId} = req.params

        const result = await api.solve(gameId, missionId)

        res.json(result)
    } catch (error) {
        console.error('Failed to solve mission:', error)

        if (error instanceof MugloarApiError) {
            if (error.status === 410) {
                res.status(410).json({
                    error: 'This mission is no longer available',
                })
                return
            }

            if (error.status === 400) {
                res.status(400).json({
                    error: 'This mission could not be completed',
                })
                return
            }

            res.status(error.status).json({
                error: 'The game service could not complete this mission',
            })
            return
        }

        res.status(500).json({
            error: 'Failed to solve mission',
        })
    }
})

app.get('/api/game/:gameId/messages', async (req, res) => {
    try {
        const {gameId} = req.params

        const messages = await api.getMessages(gameId)
        const recommendedMessage = chooseBestMessage(messages)

        const mappedMessages = messages.map(({adId, ...message}) => ({
            missionId: adId,
            ...message,
            recommended: adId === recommendedMessage?.adId,
        }))

        res.json(mappedMessages)
    } catch (error) {
        res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : 'Failed to load missions',
        })
    }
})

app.get('/api/game/:gameId/shop', async (req, res) => {
    try {
        const {gameId} = req.params

        const items = await api.getShop(gameId)

        res.json(items)
    } catch (error) {
        res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : 'Could not load shop items',
        })
    }
})

app.post('/api/game/:gameId/shop/:itemId/buy', async (req, res) => {
    try {
        const {gameId, itemId} = req.params

        const result = await api.buy(gameId, itemId)

        res.json(result)
    } catch (error) {
        res.status(500).json({
            error:
                error instanceof Error
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

    let runner: GameRunner

    runner = new GameRunner(undefined, (state) => {
        if (autoGameRunner === runner) {
            autoGameState = state
        }
    })

    autoGameRunner = runner

    runner.run()
        .then((state) => {
            if (autoGameRunner !== runner) {
                return
            }

            autoGameState = state
            autoGameStatus = 'finished'
            autoGameRunner = null
        })
        .catch((error) => {
            if (autoGameRunner !== runner) {
                return
            }

            console.error('Automatic game failed:', error)
            autoGameStatus = 'error'
            autoGameRunner = null
        })

    res.status(202).json({
        status: autoGameStatus,
    })
})

app.post('/api/auto-game/stop', (_req, res) => {
    if (autoGameStatus !== 'running' || !autoGameRunner) {
        res.status(409).json({
            error: 'No automatic game is currently running',
        })
        return
    }

    autoGameRunner.stop()
    autoGameStatus = 'idle'
    autoGameState = null
    autoGameRunner = null

    res.json({
        status: autoGameStatus,
    })
})

app.get('/api/auto-game/status', (_req, res) => {
    res.json({
        status: autoGameStatus,
        state: autoGameState,
    })
})

