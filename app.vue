<template>
  <div id="app">
    <Authorise v-if="!auth.status" :auth="auth" :endpoints="endpoints" />
    <NowPlaying
      v-else
      :auth="auth"
      :endpoints="endpoints"
      :player="player"
      @spotify-track-updated="updateCurrentTrack"
      @request-refresh-token="requestRefreshTokens"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue"
import { getStoredAuth, setStoredAuth } from "~/utils/auth"

const config = useRuntimeConfig()

const auth = reactive({
  status: false,
  clientId: config.public.spotifyClientId as string,
  clientSecret: config.public.spotifyClientSecret as string,
  authCode: "",
  accessToken: "",
  refreshToken: "",
})

const endpoints = {
  auth: "https://accounts.spotify.com/authorize",
  token: "https://accounts.spotify.com/api/token",
  base: "https://api.spotify.com/v1",
  nowPlaying: "me/player/currently-playing",
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

Object.assign(auth, getStoredAuth())

watch(
  auth,
  () => {
    setStoredAuth({ ...auth })
  },
  { deep: true },
)

function requestRefreshTokens() {
  auth.status = false
}

function updateCurrentTrack(value: Record<string, unknown>) {
  Object.assign(player, value)
}
</script>
