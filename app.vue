<template>
  <div id="app">
    <Authorise v-if="!auth.status" :auth="auth" :endpoints="endpoints" />
    <NowPlaying
      v-else
      :auth="auth"
      :player="player"
      @spotify-track-updated="updateCurrentTrack"
      @request-refresh-token="requestRefreshTokens"
    />
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
