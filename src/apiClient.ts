import type {BuyResult, GameState, Message, ShopItem, SolveResult} from './types.js';

const BASE_URL = 'https://dragonsofmugloar.com/api/v2';

export class MugloarApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'MugloarApiError';
    }
}

export class MugloarApiClient {
    private async request<T>(path: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: {
                Accept: 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new MugloarApiError(
                response.status,
                `Mugloar API ${response.status}: ${response.statusText}`,
            );
        }

        return await response.json() as Promise<T>;
    }

    startGame(): Promise<GameState> {
        return this.request<GameState>('/game/start', {method: 'POST'});
    }

    getMessages(gameId: string): Promise<Message[]> {
        return this.request<Message[]>(`/${gameId}/messages`);
    }

    solve(gameId: string, adId: string): Promise<SolveResult> {
        return this.request<SolveResult>(`/${gameId}/solve/${adId}`, {method: 'POST'});
    }

    getShop(gameId: string): Promise<ShopItem[]> {
        return this.request<ShopItem[]>(`/${gameId}/shop`);
    }

    buy(gameId: string, itemId: string): Promise<BuyResult> {
        return this.request<BuyResult>(`/${gameId}/shop/buy/${itemId}`, {method: 'POST'});
    }
}
