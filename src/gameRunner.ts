import { MugloarApiClient } from './apiClient.js';
import { chooseBestMessage, chooseHealingItem, chooseUpgrade } from './strategy.js';
import type { GameState } from './types.js';

export class GameRunner {
  constructor(private readonly api = new MugloarApiClient()) {}

  async run(): Promise<GameState> {
    let state = await this.api.startGame();
    console.log(`Started game ${state.gameId}: lives=${state.lives}, gold=${state.gold}, score=${state.score}`);

    let consecutiveNoMissionTurns = 0;

    while (state.lives > 0) {
      state = await this.maybeShop(state);
      if (state.lives <= 0) break;

      const messages = await this.api.getMessages(state.gameId);
      const selected = chooseBestMessage(messages);

      if (!selected) {
        consecutiveNoMissionTurns += 1;
        console.log(`Turn ${state.turn}: no sufficiently safe mission available.`);

        // Avoid an infinite loop if the board repeatedly contains only bad tasks.
        // In practice this threshold can be tuned after observing live API behaviour.
        if (consecutiveNoMissionTurns >= 3) {
          const fallback = [...messages]
            .sort((a, b) => Number(b.reward) - Number(a.reward))[0];

          if (!fallback) break;
          const result = await this.api.solve(state.gameId, fallback.adId);
          state = { ...state, ...result };
          consecutiveNoMissionTurns = 0;
          this.logSolve(fallback.message, fallback.probability, result.success, state);
        }
        continue;
      }

      consecutiveNoMissionTurns = 0;
      const result = await this.api.solve(state.gameId, selected.adId);
      state = { ...state, ...result };
      this.logSolve(selected.message, selected.probability, result.success, state);
    }

    console.log(`Game over: score=${state.score}, gold=${state.gold}, turn=${state.turn}`);
    return state;
  }

  private async maybeShop(state: GameState): Promise<GameState> {
    const items = await this.api.getShop(state.gameId);

    if (state.lives <= 2) {
      const healingItem = chooseHealingItem(items, state.gold);
      if (healingItem) {
        const result = await this.api.buy(state.gameId, healingItem.id);
        console.log(`Bought ${healingItem.name} for ${healingItem.cost} gold.`);
        return { ...state, ...result };
      }
    }

    if (state.lives >= 3 && state.gold >= 200) {
      const upgrade = chooseUpgrade(items, state.gold);
      if (upgrade) {
        const result = await this.api.buy(state.gameId, upgrade.id);
        console.log(`Bought upgrade ${upgrade.name} for ${upgrade.cost} gold.`);
        return { ...state, ...result };
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
