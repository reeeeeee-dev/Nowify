<template>
  <Teleport to="body">
    <Transition name="nowify-queue">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-end justify-center p-0 md:items-center md:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-dialog-title"
      >
        <div
          class="absolute inset-0 bg-white/12"
          aria-hidden="true"
          @click="open = false"
        />
        <div
          class="nowify-queue-panel relative flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col rounded-t-2xl border border-white/20 bg-black text-[var(--color-text-primary)] shadow-[0_8px_40px_rgba(0,0,0,0.85)] md:rounded-2xl"
        >
          <div
            class="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-3"
          >
            <h2 id="queue-dialog-title" class="text-lg font-semibold">
              Queue
            </h2>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm transition-interactive hover:bg-white/18 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
                :disabled="loading"
                @click="emit('refresh')"
              >
                Refresh
              </button>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 transition-interactive hover:bg-white/18 hover:scale-105 active:scale-95"
                aria-label="Close queue"
                @click="open = false"
              >
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">
            <p v-if="loading" class="py-8 text-center text-sm opacity-80">
              Loading queue…
            </p>
            <p
              v-else-if="error"
              class="py-8 text-center text-sm opacity-90"
              role="status"
            >
              {{ error }}
            </p>
            <template v-else>
              <section v-if="currentlyPlaying" class="mb-4">
                <h3
                  class="mb-2 text-xs font-medium uppercase tracking-wide opacity-70"
                >
                  Now playing
                </h3>
                <div
                  class="flex gap-3 rounded-lg border border-white/15 bg-white/5 p-2"
                >
                  <img
                    v-if="queueItemImage(currentlyPlaying)"
                    :src="queueItemImage(currentlyPlaying)"
                    alt=""
                    class="h-14 w-14 shrink-0 rounded object-cover"
                  />
                  <div
                    v-else
                    class="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-white/10 text-xs opacity-60"
                  >
                    —
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium">
                      {{ queueItemTitle(currentlyPlaying) }}
                    </p>
                    <p class="truncate text-sm opacity-80">
                      {{ queueItemSubtitle(currentlyPlaying) }}
                    </p>
                  </div>
                </div>
              </section>

              <section v-if="upNext.length">
                <h3
                  class="mb-2 text-xs font-medium uppercase tracking-wide opacity-70"
                >
                  Up next
                </h3>
                <ol class="space-y-1">
                  <li
                    v-for="(item, index) in upNext"
                    :key="queueItemKey(item, index)"
                  >
                    <div
                      class="flex gap-3 rounded-lg p-2 opacity-95 transition-interactive hover:bg-white/8"
                    >
                      <img
                        v-if="queueItemImage(item)"
                        :src="queueItemImage(item)"
                        alt=""
                        class="h-12 w-12 shrink-0 rounded object-cover"
                      />
                      <div
                        v-else
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white/10 text-xs opacity-60"
                      >
                        {{ index + 1 }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate font-medium">
                          {{ queueItemTitle(item) }}
                        </p>
                        <p class="truncate text-sm opacity-80">
                          {{ queueItemSubtitle(item) }}
                        </p>
                      </div>
                    </div>
                  </li>
                </ol>
              </section>

              <p
                v-if="!currentlyPlaying && upNext.length === 0"
                class="py-8 text-center text-sm opacity-80"
              >
                Nothing in the queue. Start playback on Spotify to see what is
                lined up.
              </p>
            </template>
          </div>

          <div
            class="border-t border-white/15 px-4 py-3 text-xs leading-relaxed opacity-75"
          >
            <p class="font-medium opacity-90">Not available via Spotify’s Web API</p>
            <ul class="mt-1 list-disc pl-4">
              <li>Skip to a specific track in the queue</li>
              <li>Remove tracks from the queue</li>
              <li>Reorder the queue</li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue"
import type { QueueMedia } from "~/types/spotify"
import {
  queueItemImage,
  queueItemKey,
  queueItemSubtitle,
  queueItemTitle,
} from "~/utils/spotifyQueue"

const open = defineModel<boolean>({ required: true })

defineProps<{
  loading: boolean
  error: string
  currentlyPlaying: QueueMedia | null
  upNext: QueueMedia[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

function onEscape(e: KeyboardEvent) {
  if (e.key === "Escape" && open.value) {
    open.value = false
  }
}

watch(
  open,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener("keydown", onEscape)
    } else {
      window.removeEventListener("keydown", onEscape)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onEscape)
})
</script>

<style scoped>
.nowify-queue-enter-active,
.nowify-queue-leave-active {
  transition: opacity var(--transition-base) var(--ease-out);
}

.nowify-queue-enter-active .nowify-queue-panel,
.nowify-queue-leave-active .nowify-queue-panel {
  transition: transform var(--transition-slow) var(--ease-out);
}

.nowify-queue-enter-from,
.nowify-queue-leave-to {
  opacity: 0;
}

.nowify-queue-enter-from .nowify-queue-panel {
  transform: translate3d(0, 28px, 0);
}

@media (min-width: 768px) {
  .nowify-queue-enter-from .nowify-queue-panel {
    transform: translate3d(0, 16px, 0) scale(0.97);
  }
}

.nowify-queue-leave-to .nowify-queue-panel {
  transform: translate3d(0, 12px, 0);
  opacity: 0.98;
}
</style>
