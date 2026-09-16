import { defineStore } from "pinia";
import { apiUrl } from "../api";

export const useGameStore = defineStore("game", {
  state: () => ({
    gameId: null as string | null,
    score: 0,
    lives: 3,
    gold: 0,
    level: 0,
    manualStatus: "idle" as "idle" | "loading" | "running" | "error",
    error: null as string | null,
    messages: [] as Array<{
      missionId: string;
      message: string;
      recommended: boolean;
      reward: string;
      expiresIn: number;
      probability?: string;
    }>,
    autoStatus: "idle" as "idle" | "running" | "finished" | "error",
    shopItems: [] as Array<{
      id: string;
      name: string;
      cost: number;
    }>,
    missionResult: null as null | {
      success: boolean;
      message: string;
      scoreGained: number;
      goldGained: number;
      livesLost: number;
      livesRemaining: number;
    },
    purchaseResult: null as null | {
      itemName: string;
      goldSpent: number;
      livesGained: number;
      levelsGained: number;
    },
    gameOver: false,
    solvingMissionId: null as string | null,
    buyingItemId: null as string | null,
  }),

  actions: {
    resetGameState() {
      this.gameId = null;
      this.score = 0;
      this.gold = 0;
      this.lives = 3;
      this.level = 0;
      this.messages = [];
      this.shopItems = [];
      this.error = null;
      this.missionResult = null;
      this.purchaseResult = null;
      this.gameOver = false;
      this.solvingMissionId = null;
      this.buyingItemId = null;
    },

    closeGameOver() {
      this.resetGameState();
      this.manualStatus = "idle";
      this.autoStatus = "idle";
    },

    endManualGame() {
      this.resetGameState();
      this.manualStatus = "idle";
      this.autoStatus = "idle";
    },

    async startManualGame() {
      try {
        this.resetGameState();
        this.autoStatus = "idle";
        this.manualStatus = "loading";

        const response = await fetch(apiUrl("/api/game/start"), {
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
        this.manualStatus = "running";
        await Promise.all([this.loadMessages(), this.loadShop()]);
      } catch (error) {
        this.manualStatus = "error";
        this.error = error instanceof Error ? error.message : "Unknown error";
      }
    },

    async startAutoGame() {
      try {
        this.resetGameState();
        this.manualStatus = "idle";
        this.autoStatus = "running";

        const response = await fetch(apiUrl("/api/auto-game/start"), {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Could not start the adventure");
        }

        const data = await response.json();
        this.autoStatus = data.status;

        await this.trackGameProgress();
      } catch (error) {
        this.autoStatus = "error";
        this.error =
          error instanceof Error
            ? error.message
            : "Something went wrong while starting the adventure";
      }
    },

    async endAutoGame() {
      try {
        const response = await fetch(apiUrl("/api/auto-game/stop"), {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Could not stop the automatic game");
        }

        this.resetGameState();
        this.manualStatus = "idle";
        this.autoStatus = "idle";
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Something went wrong while stopping the game";
      }
    },

    async trackGameProgress() {
      while (this.autoStatus === "running") {
        try {
          const response = await fetch(apiUrl("/api/auto-game/status"));

          if (!response.ok) {
            throw new Error("Could not update the game progress");
          }

          const data = await response.json();

          this.autoStatus = data.status;

          if (data.state) {
            this.gameId = data.state.gameId;
            this.score = data.state.score;
            this.lives = data.state.lives;
            this.gold = data.state.gold;
            this.level = data.state.level;

            if (data.state.lives === 0) {
              this.gameOver = true;
            }
          }

          if (data.status === "running") {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          this.autoStatus = "error";
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
          apiUrl(`/api/game/${this.gameId}/messages`),
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

      if (this.solvingMissionId) {
        return;
      }

      try {
        this.error = null;

        const previousScore = this.score;
        const previousGold = this.gold;
        const previousLives = this.lives;
        this.solvingMissionId = missionId;

        const response = await fetch(
          apiUrl(`/api/game/${this.gameId}/missions/${missionId}/solve`),
          {
            method: "POST",
          },
        );

        if (!response.ok) {
          if (response.status === 400) {
            await this.loadMessages();
            throw new Error(
              "This mission could not be completed. Please choose another mission.",
            );
          }

          if (response.status === 410) {
            await this.loadMessages();
            throw new Error(
              "This mission has expired. Please choose another mission.",
            );
          }

          throw new Error("Failed to solve mission");
        }

        const result = await response.json();

        this.score = result.score;
        this.lives = result.lives;
        this.gold = result.gold;

        this.missionResult = {
          success: result.success,
          message: result.message,
          scoreGained: result.score - previousScore,
          goldGained: result.gold - previousGold,
          livesLost: Math.max(0, previousLives - result.lives),
          livesRemaining: result.lives,
        };

        if (result.lives > 0) {
          await this.loadMessages();
        } else {
          this.messages = [];
          this.gameOver = true;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Unknown error";
      } finally {
        this.solvingMissionId = null;
      }
    },

    async loadShop() {
      if (!this.gameId) {
        this.error = "Start a game before visiting the shop";
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/game/${this.gameId}/shop`));

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

      if (this.buyingItemId) {
        return;
      }

      const item = this.shopItems.find((item) => item.id === itemId);
      const previousGold = this.gold;
      const previousLives = this.lives;
      const previousLevel = this.level;

      try {
        this.error = null;
        this.buyingItemId = itemId;

        const response = await fetch(
          apiUrl(`/api/game/${this.gameId}/shop/${itemId}/buy`),
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

        if (!result.shoppingSuccess) {
          throw new Error("Purchase failed");
        }

        this.purchaseResult = {
          itemName: item?.name ?? "Item",
          goldSpent: Math.max(0, previousGold - result.gold),
          livesGained: Math.max(0, result.lives - previousLives),
          levelsGained: Math.max(0, result.level - previousLevel),
        };

        await Promise.all([this.loadShop(), this.loadMessages()]);
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Something went wrong while purchasing the item";
      } finally {
        this.buyingItemId = null;
      }
    },
  },
});
