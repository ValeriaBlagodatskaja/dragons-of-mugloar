import {MugloarApiClient} from './apiClient.js';
import {
    chooseBestMessage,
    chooseHealingItem,
    chooseUpgrade,
    chooseFallbackMessage,
    chooseLastResortMessage
} from './strategy.js';
import type {GameState} from './types.js';

export class GameRunner {
    private stopped = false;

    constructor(
        private readonly api = new MugloarApiClient(),
        private readonly onUpdate?: (state: GameState) => void,
    ) {
    }

    stop(): void {
        this.stopped = true;
    }

    async run(): Promise<GameState> {
        let state = await this.api.startGame();
        this.onUpdate?.(state);

        while (state.lives > 0 && !this.stopped) {
            state = await this.maybeShop(state);
            this.onUpdate?.(state);
            if (state.lives <= 0) break;

            const messages = await this.api.getMessages(state.gameId);
            const selected =
                chooseBestMessage(messages) ??
                chooseFallbackMessage(messages) ??
                chooseLastResortMessage(messages);

            if (!selected) {
                break;
            }

            const result = await this.api.solve(state.gameId, selected.adId);
            state = {...state, ...result};
            this.onUpdate?.(state);

            await new Promise((resolve) => setTimeout(resolve, 800));
        }

        return state;
    }

    private async maybeShop(state: GameState): Promise<GameState> {
        const items = await this.api.getShop(state.gameId);

        if (state.lives <= 2) {
            const healingItem = chooseHealingItem(items, state.gold);
            if (healingItem) {
                const result = await this.api.buy(state.gameId, healingItem.id);
                return {...state, ...result};
            }
        }

        if (state.lives >= 3 && state.gold >= 200) {
            const upgrade = chooseUpgrade(items, state.gold);
            if (upgrade) {
                const result = await this.api.buy(state.gameId, upgrade.id);
                return {...state, ...result};
            }
        }

        return state;
    }
}
