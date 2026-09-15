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
    constructor(
        private readonly api = new MugloarApiClient(),
        private readonly onUpdate?: (state: GameState) => void,
    ) {
    }

    async run(): Promise<GameState> {
        let state = await this.api.startGame();
        this.onUpdate?.(state);

        while (state.lives > 0) {
            state = await this.maybeShop(state);
            this.onUpdate?.(state);
            if (state.lives <= 0) break;

            const messages = await this.api.getMessages(state.gameId);
            const selected =
                chooseBestMessage(messages) ??
                chooseFallbackMessage(messages) ??
                chooseLastResortMessage(messages);

            if (!selected) {
                console.log(`Turn ${state.turn}: no suitable mission available.`);
                break;
            }

            const result = await this.api.solve(state.gameId, selected.adId);
            state = {...state, ...result};
            this.onUpdate?.(state);
            this.logSolve(selected.message, selected.probability, result.success, state);
        }

        console.log(`Game over: score=${state.score}, gold=${state.gold}, turn=${state.turn}, ives=${state.lives}`);
        return state;
    }

    private async maybeShop(state: GameState): Promise<GameState> {
        const items = await this.api.getShop(state.gameId);

        if (state.lives <= 2) {
            const healingItem = chooseHealingItem(items, state.gold);
            if (healingItem) {
                const result = await this.api.buy(state.gameId, healingItem.id);
                console.log(`Bought ${healingItem.name} for ${healingItem.cost} gold.`);
                return {...state, ...result};
            }
        }

        if (state.lives >= 3 && state.gold >= 200) {
            const upgrade = chooseUpgrade(items, state.gold);
            if (upgrade) {
                const result = await this.api.buy(state.gameId, upgrade.id);
                console.log(`Bought upgrade ${upgrade.name} for ${upgrade.cost} gold.`);
                return {...state, ...result};
            }
        }

        return state;
    }

    private logSolve(
        message: string,
        probability: string | undefined,
        success: boolean,
        state: GameState,
    ): void {
        const shortMessage = message.length > 70 ? `${message.slice(0, 67)}...` : message;
        console.log(
            `[${success ? 'OK' : 'FAIL'}] ${probability ?? 'unknown'} | ${shortMessage} | lives=${state.lives} gold=${state.gold} score=${state.score}`,
        );
    }
}
