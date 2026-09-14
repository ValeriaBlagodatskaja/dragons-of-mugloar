<script setup lang="ts">
import { useGameStore } from "./stores/gameStore";
import { ref, computed } from "vue";

const gameStore = useGameStore();
const isShopOpen = ref(false);

const sortedMissions = computed(() =>
  [...gameStore.messages].sort(
    (a, b) => Number(b.recommended) - Number(a.recommended),
  ),
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
          @click="gameStore.startAdventure"
          :disabled="gameStore.status === 'loading'"
        >
          {{
            gameStore.status === "loading" ? "Starting..." : "Start New Game"
          }}
        </button>
        <div v-if="gameStore.gameId" class="actions">
          <button @click="isShopOpen = true">Open Shop</button>
        </div>
      </article>

      <article class="play-card">
        <h2>Auto Play</h2>
        <p>Let the strategy play the game automatically</p>

        <button
          @click="gameStore.startGame"
          :disabled="gameStore.gameStatus === 'running'"
        >
          {{
            gameStore.gameStatus === "running"
              ? "Playing..."
              : "Start Auto Game"
          }}
        </button>

        <p class="status">Status: {{ gameStore.gameStatus }}</p>
      </article>
    </section>

    <p v-if="gameStore.error" class="error">
      {{ gameStore.error }}
    </p>

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

          <button @click="gameStore.solveMission(mission.missionId)">
            Solve
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
          <h2>Shop</h2>

          <button class="modal-close" @click="isShopOpen = false">Close</button>
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
              :disabled="gameStore.gold < item.cost"
            >
              Buy
            </button>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>
