<template>
  <div
    id="app"
    class="flex min-h-screen w-full flex-col bg-black text-[var(--color-text-primary)] transition-theme"
  >
    <Transition name="nowify-panel" mode="out-in">
      <div
        v-if="player.trackTitle"
        key="playing"
        class="flex flex-1 flex-wrap flex-col items-center justify-center gap-10 p-[var(--spacing-l)] md:px-[clamp(2rem,6vw,6rem)] md:py-[clamp(2rem,5vh,4rem)] md:landscape:flex-row md:landscape:items-center md:landscape:justify-center md:landscape:gap-x-16 md:landscape:gap-y-10 min-[1920px]:landscape:gap-x-24"
      >
        <div
          v-if="player.trackAlbum?.image"
          class="flex w-full max-w-[min(100%,24rem)] flex-col items-center justify-center p-[var(--spacing-m)] text-center md:landscape:min-w-0 md:landscape:max-w-[640px] md:landscape:flex-1 md:landscape:basis-0 min-[1920px]:landscape:max-w-[720px]"
        >
          <Transition name="nowify-art" mode="out-in">
            <img
              :key="trackVisualKey"
              :src="player.trackAlbum.image"
              :alt="player.trackTitle"
              class="mx-auto h-auto w-full max-w-[60vw] shadow-[0_0_0_1px_rgba(255,255,255,0.12)] md:landscape:max-w-full"
            />
          </Transition>
        </div>
        <div
          class="flex w-full min-w-0 flex-col items-center justify-center p-[var(--spacing-m)] text-center md:landscape:max-w-[640px] md:landscape:flex-1 md:landscape:basis-0 md:landscape:items-start md:landscape:text-left min-[1920px]:landscape:max-w-[720px]"
        >
          <Transition name="nowify-text" mode="out-in">
            <div :key="trackVisualKey">
              <h1>{{ player.trackTitle }}</h1>
              <h2 class="opacity-80">{{ trackArtistsLabel }}</h2>
            </div>
          </Transition>
          <PlayerControlBar
            class="!px-0 pt-[var(--spacing-l)]"
            justify="responsive"
            :control-pending="controlPending"
            :playing="player.playing"
            :queue-open="queueOpen"
            @control="sendControl"
            @open-queue="openQueue"
          />
        </div>
      </div>
    </Transition>

    <Transition name="nowify-err">
      <p
        v-if="controlError && player.trackTitle"
        :key="controlError"
        class="pb-[var(--spacing-m)] text-center text-sm opacity-80"
        role="status"
      >
        {{ controlError }}
      </p>
    </Transition>

    <QueueDialog
      v-model="queueOpen"
      :loading="queueLoading"
      :error="queueError"
      :currently-playing="queueCurrentlyPlaying"
      :up-next="queueUpNext"
      @refresh="fetchQueue"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { NowPlayingPlayerState } from "~/types/spotify"

const props = defineProps<{
  auth: {
    status: boolean
  }
  player: {
    playing: boolean
    trackArtists: string[]
    trackTitle: string
    trackAlbum: {
      title?: string
      image?: string
    }
  }
}>()

const emit = defineEmits<{
  spotifyTrackUpdated: [value: NowPlayingPlayerState]
  requestRefreshToken: []
}>()

const authStatus = computed(() => props.auth.status)

const playback = useSpotifyPlayback({
  authStatus,
  onRequestRefreshToken: () => emit("requestRefreshToken"),
  onTrackUpdated: (data) => emit("spotifyTrackUpdated", data),
})

const { controlPending, controlError, sendControl } = playback

const {
  queueOpen,
  queueLoading,
  queueError,
  queueCurrentlyPlaying,
  queueUpNext,
  fetchQueue,
  openQueue,
} = useSpotifyQueue({
  onUnauthorized: playback.handleUnauthorized,
})

const trackArtistsLabel = computed(() => props.player.trackArtists.join(", "))

const trackVisualKey = computed(
  () =>
    `${props.player.trackTitle}\u0000${props.player.trackAlbum?.image ?? ""}`,
)
</script>

<style scoped>
.nowify-panel-enter-active,
.nowify-panel-leave-active {
  transition:
    opacity var(--transition-base) var(--ease-out),
    transform var(--transition-base) var(--ease-out);
}

.nowify-panel-enter-from,
.nowify-panel-leave-to {
  opacity: 0;
  transform: translate3d(0, 10px, 0);
}

.nowify-art-enter-active,
.nowify-art-leave-active {
  transition:
    opacity var(--transition-base) var(--ease-out),
    transform var(--transition-slow) var(--ease-out);
}

.nowify-art-enter-from,
.nowify-art-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

.nowify-text-enter-active,
.nowify-text-leave-active {
  transition:
    opacity var(--transition-base) var(--ease-out),
    transform var(--transition-base) var(--ease-out);
}

.nowify-text-enter-from,
.nowify-text-leave-to {
  opacity: 0;
  transform: translate3d(0, 8px, 0);
}

.nowify-err-enter-active,
.nowify-err-leave-active {
  transition:
    opacity var(--transition-base) var(--ease-out),
    transform var(--transition-base) var(--ease-out);
}

.nowify-err-enter-from,
.nowify-err-leave-to {
  opacity: 0;
  transform: translate3d(0, 4px, 0);
}
</style>
