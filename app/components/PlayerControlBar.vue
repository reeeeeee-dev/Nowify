<template>
  <div
    :class="[
      'flex shrink-0 flex-wrap items-center gap-4 px-[var(--spacing-l)] pb-[var(--spacing-xl)] pt-[var(--spacing-m)]',
      justify === 'start' && 'justify-start',
      justify === 'center' && 'justify-center',
      justify === 'responsive' && 'justify-center md:justify-start',
    ]"
  >
    <button
      type="button"
      :class="PLAYER_CONTROL_BUTTON_CLASS"
      :disabled="controlPending"
      aria-label="Previous track"
      @click="emit('control', 'previous')"
    >
      <svg
        class="h-7 w-7"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 6h2v12H6V6zm3.5 6 8.5-5v10l-8.5-5z" />
      </svg>
    </button>
    <span class="relative inline-flex h-16 w-16 items-center justify-center">
      <Transition name="nowify-play" mode="out-in">
        <button
          v-if="playing"
          key="pause"
          type="button"
          :class="PLAYER_PLAY_PAUSE_BUTTON_CLASS"
          :disabled="controlPending"
          aria-label="Pause"
          @click="emit('control', 'pause')"
        >
          <svg
            class="h-8 w-8"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
          </svg>
        </button>
        <button
          v-else
          key="play"
          type="button"
          :class="PLAYER_PLAY_PAUSE_BUTTON_CLASS"
          :disabled="controlPending"
          aria-label="Play"
          @click="emit('control', 'play')"
        >
          <svg
            class="h-8 w-8 pl-1"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7-11-7z" />
          </svg>
        </button>
      </Transition>
    </span>
    <button
      type="button"
      :class="PLAYER_CONTROL_BUTTON_CLASS"
      :disabled="controlPending"
      aria-label="Next track"
      @click="emit('control', 'next')"
    >
      <svg
        class="h-7 w-7"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
      </svg>
    </button>
    <button
      type="button"
      :class="PLAYER_CONTROL_BUTTON_CLASS"
      :disabled="controlPending"
      aria-label="View queue"
      :aria-expanded="queueOpen"
      @click="emit('open-queue')"
    >
      <svg
        class="h-7 w-7"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M3 5h14v2H3V5zm0 6h14v2H3v-2zm0 6h10v2H3v-2zm13-4v6l5-3-5-3z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PlayerAction } from "~/types/spotify"
import {
  PLAYER_CONTROL_BUTTON_CLASS,
  PLAYER_PLAY_PAUSE_BUTTON_CLASS,
} from "~/utils/playerUi"

withDefaults(
  defineProps<{
    controlPending: boolean
    playing: boolean
    queueOpen: boolean
    justify?: "center" | "start" | "responsive"
  }>(),
  { justify: "center" },
)

const emit = defineEmits<{
  control: [action: PlayerAction]
  "open-queue": []
}>()
</script>

<style scoped>
.nowify-play-enter-active,
.nowify-play-leave-active {
  transition:
    opacity var(--transition-fast) var(--ease-out),
    transform var(--transition-fast) var(--ease-spring);
}

.nowify-play-enter-from,
.nowify-play-leave-to {
  opacity: 0;
  transform: scale(0.88);
}
</style>
