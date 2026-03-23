<template>
  <div id="app">
    <Transition name="nowify-view" mode="out-in">
      <Authorise
        v-if="!auth.status"
        key="auth"
        :auth="auth"
        :endpoints="endpoints"
      />
      <NowPlaying
        v-else
        key="now-playing"
        :auth="auth"
        :player="player"
        @spotify-track-updated="updateCurrentTrack"
        @request-refresh-token="requestRefreshTokens"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue"

const config = useRuntimeConfig()

const auth = reactive({
  status: false,
  clientId: config.public.spotifyClientId as string,
  authCode: "",
})

const endpoints = {
  auth: "https://accounts.spotify.com/authorize",
}

const player = reactive({
  playing: false,
  trackArtists: [] as string[],
  trackTitle: "",
  trackAlbum: {} as {
    title?: string
    image?: string
  },
})

onMounted(async () => {
  const { authenticated } = await $fetch<{ authenticated: boolean }>(
    "/api/auth/session",
    { credentials: "include" },
  )
  auth.status = authenticated
})

async function requestRefreshTokens() {
  await $fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  })
  auth.status = false
}

function updateCurrentTrack(value: Record<string, unknown>) {
  Object.assign(player, value)
}
</script>

<style scoped>
.nowify-view-enter-active,
.nowify-view-leave-active {
  transition:
    opacity var(--transition-base) var(--ease-out),
    transform var(--transition-base) var(--ease-out);
}

.nowify-view-enter-from,
.nowify-view-leave-to {
  opacity: 0;
  transform: translate3d(0, 14px, 0);
}
</style>
