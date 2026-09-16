import request from 'supertest'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const {getMessagesMock} = vi.hoisted(() => ({
    getMessagesMock: vi.fn(),
}))

vi.mock('../src/apiClient.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/apiClient.js')>()

    return {
        ...actual,
        MugloarApiClient: vi.fn().mockImplementation(() => ({
            getMessages: getMessagesMock,
        })),
    }
})

import {app} from '../src/server.js'

describe('server', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('GET /api/health', () => {
        it('returns the API health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200)

            expect(response.body).toEqual({
                status: 'ok',
            })
        })
    })

    describe('GET /api/game/:gameId/messages', () => {
        it('maps adId to missionId and marks the recommended mission', async () => {
            getMessagesMock.mockResolvedValue([
                {
                    adId: 'mission-1',
                    message: 'Rescue the princess',
                    reward: '100',
                    expiresIn: 5,
                    probability: 'Sure thing',
                },
                {
                    adId: 'mission-2',
                    message: 'Fight the dragon',
                    reward: '500',
                    expiresIn: 3,
                    probability: 'Suicide mission',
                },
            ])

            const response = await request(app)
                .get('/api/game/game-123/messages')
                .expect(200)

            expect(getMessagesMock).toHaveBeenCalledWith('game-123')

            expect(response.body).toEqual([
                {
                    missionId: 'mission-1',
                    message: 'Rescue the princess',
                    reward: '100',
                    expiresIn: 5,
                    probability: 'Sure thing',
                    recommended: true,
                },
                {
                    missionId: 'mission-2',
                    message: 'Fight the dragon',
                    reward: '500',
                    expiresIn: 3,
                    probability: 'Suicide mission',
                    recommended: false,
                },
            ])
        })
    })
})