<script setup lang="ts">
defineProps<{
  success: boolean;
  message: string;
  scoreGained: number;
  goldGained: number;
  livesLost: number;
  livesRemaining: number;
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <div class="notice-backdrop" @click.self="$emit('close')">
    <section
      class="notice-modal"
      :class="success ? 'notice-success' : 'notice-failure'"
    >
      <div class="notice-icon">
        {{ success ? "✓" : "×" }}
      </div>

      <p class="notice-eyebrow">
        {{ success ? "Victory" : "Defeat" }}
      </p>

      <h2>
        {{ success ? "Mission Completed" : "Mission Failed" }}
      </h2>

      <p class="notice-message">
        {{ message }}
      </p>

      <div v-if="success" class="notice-rewards">
        <span v-if="scoreGained > 0"> +{{ scoreGained }} score </span>

        <span v-if="goldGained > 0"> +{{ goldGained }} gold </span>
      </div>

      <div v-if="livesLost > 0" class="notice-lives">
        <strong>
          -{{ livesLost }} {{ livesLost === 1 ? "life" : "lives" }}
        </strong>

        <span>
          {{ livesRemaining }}
          {{ livesRemaining === 1 ? "life" : "lives" }} remaining
        </span>
      </div>

      <button @click="$emit('close')">Continue</button>
    </section>
  </div>
</template>
