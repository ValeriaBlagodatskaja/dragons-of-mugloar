<script setup lang="ts">
import { useGameStore } from "./stores/gameStore";
import GameNoticeModal from "./components/GameNoticeModal.vue";
import PurchaseNoticeModal from "./components/PurchaseNoticeModal.vue";
import GameOverModal from "./components/GameOverModal.vue";
import { ref, computed, nextTick, watch } from "vue";

const gameStore = useGameStore();
const isShopOpen = ref(false);

const sortedMissions = computed(() =>
  [...gameStore.messages].sort(
    (a, b) => Number(b.recommended) - Number(a.recommended),
  ),
);

const closeMissionResult = () => {
  gameStore.missionResult = null;
};

watch(
  () => gameStore.error,
  async (error) => {
    if (!error) return;

    await nextTick();

    document.querySelector(".error-notice")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  },
);

const getRiskClass = (probability?: string) => {
  const value = probability?.toLowerCase();

  if (
    value === "piece of cake" ||
    value === "sure thing" ||
    value === "walk in the park" ||
    value === "quite likely"
  ) {
    return "risk-low";
  }

  if (value === "hmmm...." || value === "hmmm..." || value === "gamble") {
    return "risk-medium";
  }

  return "risk-high";
};
</script>

<template>
  <main class="app">
    <header class="hero">
      <h1>Dragons of Mugloar</h1>
      <p class="subtitle">
        Complete missions, earn gold and upgrade your dragon
      </p>
    </header>

    <section class="stats">
      <div>
        <span>Score</span>
        <strong>{{ gameStore.score }}</strong>
      </div>

      <div>
        <span>Gold</span>
        <strong>{{ gameStore.gold }}</strong>
      </div>
      <div>
        <span>Lives</span>
        <strong>{{ gameStore.lives }}</strong>
      </div>

      <div>
        <span>Level</span>
        <strong>{{ gameStore.level }}</strong>
      </div>
    </section>

    <section class="play-modes">
      <article class="play-card">
        <h2>Manual Play</h2>
        <p>Pick missions and buy upgrades from the shop</p>

        <button
          @click="gameStore.startManualGame"
          :disabled="
            gameStore.manualStatus === 'loading' ||
            gameStore.manualStatus === 'running' ||
            gameStore.autoStatus === 'running'
          "
        >
          {{
            gameStore.manualStatus === "loading"
              ? "Starting..."
              : "Start New Game"
          }}
        </button>
        <div
          v-if="
            gameStore.gameId &&
            gameStore.lives > 0 &&
            gameStore.manualStatus === 'running' &&
            gameStore.autoStatus !== 'running'
          "
          class="actions"
        >
          <button class="shop-button" @click="isShopOpen = true">
            <span aria-hidden="true">◆</span>
            Open Shop
          </button>

          <button @click="gameStore.endManualGame">End Game</button>
        </div>
      </article>

      <article class="play-card">
        <h2>Auto Play</h2>
        <p>Let the strategy play the game automatically</p>

        <button
          @click="gameStore.startAutoGame"
          :disabled="
            gameStore.autoStatus === 'running' ||
            gameStore.manualStatus === 'running'
          "
        >
          {{
            gameStore.autoStatus === "running"
              ? "Playing..."
              : "Start Auto Game"
          }}
        </button>

        <div v-if="gameStore.autoStatus === 'running'" class="actions">
          <button @click="gameStore.endAutoGame">End Game</button>
        </div>
      </article>
    </section>

    <div v-if="gameStore.error" class="error-notice">
      <div class="error-notice-icon">!</div>

      <div>
        <strong>Something went wrong</strong>
        <p>{{ gameStore.error }}</p>
      </div>
    </div>
    <GameNoticeModal
      v-if="gameStore.missionResult"
      :success="gameStore.missionResult.success"
      :message="gameStore.missionResult.message"
      :score-gained="gameStore.missionResult.scoreGained"
      :gold-gained="gameStore.missionResult.goldGained"
      :lives-lost="gameStore.missionResult.livesLost"
      :lives-remaining="gameStore.missionResult.livesRemaining"
      @close="closeMissionResult"
    />

    <GameOverModal
      v-if="gameStore.gameOver && !gameStore.missionResult"
      :score="gameStore.score"
      :gold="gameStore.gold"
      :level="gameStore.level"
      @close="gameStore.closeGameOver"
    />

    <PurchaseNoticeModal
      v-if="gameStore.purchaseResult"
      :item-name="gameStore.purchaseResult.itemName"
      :gold-spent="gameStore.purchaseResult.goldSpent"
      :lives-gained="gameStore.purchaseResult.livesGained"
      :levels-gained="gameStore.purchaseResult.levelsGained"
      @close="gameStore.purchaseResult = null"
    />

    <section v-if="gameStore.messages.length > 0" class="content-section">
      <h2>Available Missions</h2>

      <div class="mission-list">
        <article
          v-for="mission in sortedMissions"
          :key="mission.missionId"
          class="mission-card"
        >
          <div class="mission-content">
            <div class="mission-badges">
              <span
                class="probability"
                :class="getRiskClass(mission.probability)"
              >
                {{ mission.probability ?? "Unknown" }}
              </span>

              <span v-if="mission.recommended" class="recommended">
                Recommended
              </span>
            </div>

            <p class="mission-message">
              {{ mission.message }}
            </p>

            <div class="mission-details">
              <span
                >Reward: <strong>{{ mission.reward }} gold</strong></span
              >
              <span
                >Expires in:
                <strong>{{ mission.expiresIn }} turns</strong></span
              >
            </div>
          </div>

          <button
            @click="gameStore.solveMission(mission.missionId)"
            :disabled="gameStore.solvingMissionId !== null"
          >
            {{
              gameStore.solvingMissionId === mission.missionId
                ? "Solving..."
                : "Solve"
            }}
          </button>
        </article>
      </div>
    </section>

    <div
      v-if="isShopOpen"
      class="modal-backdrop"
      @click.self="isShopOpen = false"
    >
      <section class="modal">
        <div class="modal-header">
          <div class="modal-header-top">
            <h2>Shop</h2>
            <button class="modal-close" @click="isShopOpen = false">
              Close
            </button>
          </div>

          <p class="shop-hint">
            Purchasing an item advances the game by one turn
          </p>
        </div>

        <div class="shop-list">
          <article
            v-for="item in gameStore.shopItems"
            :key="item.id"
            class="shop-card"
          >
            <div>
              <strong>{{ item.name }}</strong>
              <p>{{ item.cost }} gold</p>
            </div>

            <button
              @click="gameStore.buyItem(item.id)"
              :disabled="
                gameStore.gold < item.cost || gameStore.buyingItemId !== null
              "
            >
              {{ gameStore.buyingItemId === item.id ? "Buying..." : "Buy" }}
            </button>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>
