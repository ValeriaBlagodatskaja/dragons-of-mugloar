<script setup lang="ts">
import { useGameStore } from "./stores/gameStore";

const gameStore = useGameStore();
</script>

<template>
  <main>
    <h1>Dragons of Mugloar</h1>

    <p>Game ID: {{ gameStore.gameId }}</p>
    <p>Score: {{ gameStore.score }}</p>
    <p>Lives: {{ gameStore.lives }}</p>
    <p>Gold: {{ gameStore.gold }}</p>
    <p>Level: {{ gameStore.level }}</p>
    <p>Status: {{ gameStore.status }}</p>

    <button @click="gameStore.startAdventure">Start Adventure</button>
    <p>Backend: {{ gameStore.backendStatus }}</p>

    <button @click="gameStore.checkBackend">Check backend</button>
    <button @click="gameStore.loadMessages">Load Missions</button>

    <p>Missions: {{ gameStore.messages.length }}</p>
    <section v-if="gameStore.messages.length > 0">
      <h2>Available missions</h2>

      <ul>
        <li v-for="mission in gameStore.messages" :key="mission.missionId">
          <strong>{{ mission.probability ?? "Unknown" }}</strong>
          — {{ mission.message }} — reward: {{ mission.reward }}

          <button @click="gameStore.solveMission(mission.missionId)">
            Solve
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>
