<template>
  <div
    id="app"
    class="flex min-h-screen w-full flex-col bg-[var(--colour-background-now-playing)] text-[var(--color-text-primary)] transition-theme"
  >
    <Transition name="nowify-panel" mode="out-in">
      <div
        v-if="player.trackTitle"
        key="playing"
        class="flex flex-1 flex-col items-center justify-center gap-0 p-[var(--spacing-l)] md:flex-row md:p-[10%]"
      >
        <div
          v-if="player.trackAlbum?.image"
          class="w-full max-w-[400px] p-[var(--spacing-m)] text-center md:w-1/2 md:max-w-[495px]"
        >
          <Transition name="nowify-art" mode="out-in">
            <img
              :key="trackVisualKey"
              :src="player.trackAlbum.image"
              :alt="player.trackTitle"
              class="h-auto w-full max-w-[60vw] shadow-[1px_1px_16px_-2px_rgba(0,0,0,0.3)]"
            />
          </Transition>
        </div>
        <div
          class="flex w-full flex-col p-[var(--spacing-m)] text-center md:w-1/2 md:max-w-[495px] md:text-left"
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
      <div
        v-else
        key="idle"
        class="flex flex-1 flex-col items-center justify-center p-[var(--spacing-l)] md:flex-row md:p-[10%]"
      >
        <div class="flex flex-col items-center text-center">
          <h1>No music is playing 😔</h1>
          <PlayerControlBar
            class="!px-0 pt-[var(--spacing-l)]"
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
        v-if="controlError"
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

useAlbumPalette(computed(() => playback.playerData.value.trackAlbum?.image))

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
