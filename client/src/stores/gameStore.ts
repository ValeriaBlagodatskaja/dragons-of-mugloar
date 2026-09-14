import { defineStore } from "pinia";

export const useGameStore = defineStore("game", {
  state: () => ({
    gameId: null as string | null,
    score: 0,
    lives: 3,
    gold: 0,
    level: 0,
    status: "idle",
    error: null as string | null,
    backendStatus: "unknown",
    messages: [] as Array<{
      missionId: string;
      message: string;
      reward: string;
      expiresIn: number;
      probability?: string;
    }>,
  }),

  actions: {
    async startAdventure() {
      try {
        this.status = "loading";
        this.error = null;

        const response = await fetch("http://localhost:3000/api/game/start", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to start adventure");
        }

        const game = await response.json();

        this.gameId = game.gameId;
        this.score = game.score;
        this.lives = game.lives;
        this.gold = game.gold;
        this.level = game.level;
        this.status = "running";
      } catch (error) {
        this.status = "error";
        this.error = error instanceof Error ? error.message : "Unknown error";
      }
    },

    async checkBackend() {
      try {
        const response = await fetch("http://localhost:3000/api/health");

        if (!response.ok) {
          throw new Error("Backend is unavailable");
        }

        const data = await response.json();
        this.backendStatus = data.status;
        this.error = null;
      } catch (error) {
        this.backendStatus = "error";
        this.error = error instanceof Error ? error.message : "Unknown error";
      }
    },

    async loadMessages() {
      if (!this.gameId) {
        this.error = "No active game";
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/game/${this.gameId}/messages`,
        );

        if (!response.ok) {
          throw new Error("Failed to load missions");
        }

        this.messages = await response.json();
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Unknown error";
      }
    },

    async solveMission(missionId: string) {
      if (!this.gameId) {
        this.error = "No active game";
        return;
      }

      try {
        this.error = null;

        const response = await fetch(
          `http://localhost:3000/api/game/${this.gameId}/missions/${missionId}/solve`,
          {
            method: "POST",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to solve mission");
        }

        const result = await response.json();

        this.score = result.score;
        this.lives = result.lives;
        this.gold = result.gold;

        await this.loadMessages();
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Unknown error";
      }
    },
  },
});
