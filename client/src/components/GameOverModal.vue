<script setup lang="ts">
defineProps<{
  score: number;
  gold: number;
  level: number;
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <div class="notice-backdrop">
    <section class="notice-modal notice-failure game-over-modal">
      <div class="notice-icon">☠</div>

      <p class="notice-eyebrow">Game Over</p>

      <h2>Your dragon has fallen</h2>

      <p class="notice-message">The adventure has come to an end.</p>

      <div class="game-over-stats">
        <div>
          <span>Final Score</span>
          <strong>{{ score }}</strong>
        </div>

        <div>
          <span>Gold</span>
          <strong>{{ gold }}</strong>
        </div>

        <div>
          <span>Level</span>
          <strong>{{ level }}</strong>
        </div>
      </div>

      <button @click="$emit('close')">Try Again</button>
    </section>
  </div>
</template>
