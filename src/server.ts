import cors from 'cors'
import express from 'express'

const app = express()
const port = 3000

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

        const mappedMessages = messages.map(({ adId, ...message }) => ({
            missionId: adId,
            ...message,
        }))

        res.json(mappedMessages)
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to load missions',
        })
    }
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})