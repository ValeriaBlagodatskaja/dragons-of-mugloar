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
      recommended: boolean;
      reward: string;
      expiresIn: number;
      probability?: string;
    }>,
    gameStatus: "idle" as "idle" | "running" | "finished" | "error",
    shopItems: [] as Array<{
      id: string;
      name: string;
      cost: number;
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
        await Promise.all([this.loadMessages(), this.loadShop()]);
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

    async startGame() {
      try {
        this.error = null;
        this.gameStatus = "running";

        const response = await fetch(
          "http://localhost:3000/api/auto-game/start",
          {
            method: "POST",
          },
        );

        if (!response.ok) {
          throw new Error("Could not start the adventure");
        }

        const data = await response.json();
        this.gameStatus = data.status;

        await this.trackGameProgress();
      } catch (error) {
        this.gameStatus = "error";
        this.error =
          error instanceof Error
            ? error.message
            : "Something went wrong while starting the adventure";
      }
    },

    async trackGameProgress() {
      while (this.gameStatus === "running") {
        try {
          const response = await fetch(
            "http://localhost:3000/api/auto-game/status",
          );

          if (!response.ok) {
            throw new Error("Could not update the game progress");
          }

          const data = await response.json();

          this.gameStatus = data.status;

          if (data.state) {
            this.gameId = data.state.gameId;
            this.score = data.state.score;
            this.lives = data.state.lives;
            this.gold = data.state.gold;
            this.level = data.state.level;
          }

          if (data.status === "running") {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          this.gameStatus = "error";
          this.error =
            error instanceof Error
              ? error.message
              : "Something went wrong while updating the game";
          return;
        }
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

    async loadShop() {
      if (!this.gameId) {
        this.error = "Start a game before visiting the shop";
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/game/${this.gameId}/shop`,
        );

        if (!response.ok) {
          throw new Error("Could not load the shop items");
        }

        this.shopItems = await response.json();
        this.error = null;
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Something went wrong while loading the shop";
      }
    },

    async buyItem(itemId: string) {
      if (!this.gameId) {
        this.error = "Start a game before buying items";
        return;
      }

      try {
        this.error = null;

        const response = await fetch(
          `http://localhost:3000/api/game/${this.gameId}/shop/${itemId}/buy`,
          {
            method: "POST",
          },
        );

        if (!response.ok) {
          throw new Error("Could not purchase this item");
        }

        const result = await response.json();

        this.gold = result.gold;
        this.lives = result.lives;
        this.level = result.level;

        await this.loadShop();
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Something went wrong while purchasing the item";
      }
    },
  },
});
