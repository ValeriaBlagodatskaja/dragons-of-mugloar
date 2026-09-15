<script setup lang="ts">
defineProps<{
  itemName: string;
  goldSpent: number;
  livesGained: number;
  levelsGained: number;
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <div class="notice-backdrop" @click.self="$emit('close')">
    <section class="notice-modal notice-success">
      <div class="notice-icon">✓</div>

      <p class="notice-eyebrow">Purchase Complete</p>

      <h2>{{ itemName }}</h2>

      <p class="notice-message">
        {{
          livesGained > 0
            ? "Your dragon has recovered."
            : "Your dragon has been upgraded."
        }}
      </p>

      <div class="notice-rewards">
        <span v-if="goldSpent > 0">−{{ goldSpent }} gold</span>

        <span v-if="livesGained > 0">
          +{{ livesGained }}
          {{ livesGained === 1 ? "life" : "lives" }}
        </span>

        <span v-if="levelsGained > 0">
          +{{ levelsGained }}
          {{ levelsGained === 1 ? "level" : "levels" }}
        </span>
      </div>

      <button @click="$emit('close')">Continue</button>
    </section>
  </div>
</template>
