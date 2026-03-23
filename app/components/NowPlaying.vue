<template>
  <div
    id="app"
    class="flex min-h-screen w-full flex-col bg-[var(--colour-background-now-playing)] text-[var(--color-text-primary)]"
  >
    <div
      v-if="player.trackTitle"
      class="flex flex-1 flex-col items-center justify-center gap-0 p-[var(--spacing-l)] md:flex-row md:p-[10%]"
    >
      <div
        v-if="player.trackAlbum?.image"
        class="w-full max-w-[400px] p-[var(--spacing-m)] text-center md:w-1/2 md:max-w-[495px]"
      >
        <img
          :src="player.trackAlbum.image"
          :alt="player.trackTitle"
          class="h-auto w-full max-w-[60vw] shadow-[1px_1px_16px_-2px_rgba(0,0,0,0.3)]"
        />
      </div>
      <div
        class="w-full p-[var(--spacing-m)] text-center md:w-1/2 md:max-w-[495px] md:text-left"
      >
        <h1>{{ player.trackTitle }}</h1>
        <h2 class="opacity-80">{{ trackArtistsLabel }}</h2>
      </div>
    </div>
    <div
      v-else
      class="flex flex-1 flex-col items-center justify-center p-[var(--spacing-l)] md:flex-row md:p-[10%]"
    >
      <h1 class="text-center">No music is playing 😔</h1>
    </div>

    <div
      class="flex shrink-0 items-center justify-center gap-4 px-[var(--spacing-l)] pb-[var(--spacing-xl)] pt-[var(--spacing-m)]"
    >
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center rounded-full border border-current/25 bg-black/15 text-[var(--color-text-primary)] transition-opacity hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="controlPending"
        aria-label="Previous track"
        @click="sendControl('previous')"
      >
        <svg
          class="h-7 w-7"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M6 6h2v12H6V6zm3.5 6 8.5-5v10l-8.5-5z"
          />
        </svg>
      </button>
      <button
        v-if="player.playing"
        type="button"
        class="flex h-16 w-16 items-center justify-center rounded-full border border-current/25 bg-black/15 text-[var(--color-text-primary)] transition-opacity hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="controlPending"
        aria-label="Pause"
        @click="sendControl('pause')"
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
        type="button"
        class="flex h-16 w-16 items-center justify-center rounded-full border border-current/25 bg-black/15 text-[var(--color-text-primary)] transition-opacity hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="controlPending"
        aria-label="Play"
        @click="sendControl('play')"
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
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center rounded-full border border-current/25 bg-black/15 text-[var(--color-text-primary)] transition-opacity hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="controlPending"
        aria-label="Next track"
        @click="sendControl('next')"
      >
        <svg
          class="h-7 w-7"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z"
          />
        </svg>
      </button>
    </div>
    <p
      v-if="controlError"
      class="pb-[var(--spacing-m)] text-center text-sm opacity-80"
      role="status"
    >
      {{ controlError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Palette } from "@vibrant/color"
import { Vibrant } from "node-vibrant/browser"
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

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
  spotifyTrackUpdated: [value: ReturnType<typeof getEmptyPlayer>]
  requestRefreshToken: []
}>()

const pollPlaying = ref<ReturnType<typeof setInterval> | null>(null)
const playerResponse = ref<Record<string, unknown>>({})
const playerData = ref(getEmptyPlayer())
const colourPalette = ref<{ text: string; background: string } | null>(null)
const controlPending = ref(false)
const controlError = ref("")

const trackArtistsLabel = computed(() => props.player.trackArtists.join(", "))

type PlayerAction = "play" | "pause" | "next" | "previous"

async function sendControl(action: PlayerAction) {
  controlError.value = ""
  controlPending.value = true
  try {
    const res = await fetch("/api/spotify/player", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })

    if (res.status === 401) {
      handleExpiredToken()
      return
    }

    let body: { ok?: boolean } = {}
    try {
      body = (await res.json()) as { ok?: boolean }
    } catch {
      /* non-JSON error body */
    }

    if (!res.ok || body.ok === false) {
      controlError.value =
        "Could not control playback. Use Spotify on a Premium account with an active device."
      window.setTimeout(() => {
        controlError.value = ""
      }, 5000)
      return
    }

    await getNowPlaying()
  } catch {
    controlError.value = "Something went wrong. Try again."
    window.setTimeout(() => {
      controlError.value = ""
    }, 5000)
  } finally {
    controlPending.value = false
  }
}

function getEmptyPlayer() {
  return {
    playing: false,
    trackAlbum: {} as { title?: string; image?: string },
    trackArtists: [] as string[],
    trackId: "",
    trackTitle: "",
  }
}

async function getNowPlaying() {
  let data = getEmptyPlayer()

  try {
    const response = await fetch("/api/spotify/now-playing", {
      credentials: "include",
    })

    if (response.status === 401) {
      handleExpiredToken()
      return
    }

    if (!response.ok) {
      throw new Error(`An error has occured: ${response.status}`)
    }

    if (response.status === 204) {
      data = getEmptyPlayer()
      playerData.value = data
      emit("spotifyTrackUpdated", data)
      return
    }

    const json = (await response.json()) as Record<string, unknown>
    playerResponse.value = json
  } catch {
    handleExpiredToken()
    data = getEmptyPlayer()
    playerData.value = data
    emit("spotifyTrackUpdated", data)
  }
}

function setDataInterval() {
  if (pollPlaying.value) {
    clearInterval(pollPlaying.value)
  }
  pollPlaying.value = setInterval(() => {
    getNowPlaying()
  }, 2500)
}

function setAppColours() {
  const palette = colourPalette.value
  if (!palette) {
    return
  }
  document.documentElement.style.setProperty(
    "--color-text-primary",
    palette.text,
  )
  document.documentElement.style.setProperty(
    "--colour-background-now-playing",
    palette.background,
  )
}

function handleNowPlaying() {
  const res = playerResponse.value as {
    error?: { status?: number }
    is_playing?: boolean
    item?: {
      id: string
      name: string
      artists: { name: string }[]
      album: { name: string; images: { url: string }[] }
    }
  }

  if (res.error?.status === 401 || res.error?.status === 400) {
    handleExpiredToken()
    return
  }

  const item = res.item
  if (!item) {
    playerData.value = getEmptyPlayer()
    return
  }

  const playing = Boolean(res.is_playing)

  if (item.id === playerData.value.trackId) {
    if (playerData.value.playing !== playing) {
      playerData.value = { ...playerData.value, playing }
    }
    return
  }

  playerData.value = {
    playing,
    trackArtists: item.artists.map((a) => a.name),
    trackTitle: item.name,
    trackId: item.id,
    trackAlbum: {
      title: item.album.name,
      image: item.album.images[0]?.url,
    },
  }
}

function handleAlbumPalette(palette: Palette) {
  const albumColours = Object.entries(palette)
    .map(([, swatch]) => {
      if (!swatch) {
        return null
      }
      return {
        text: swatch.titleTextColor,
        background: swatch.hex,
      }
    })
    .filter((x): x is { text: string; background: string } => x !== null)

  if (albumColours.length === 0) {
    return
  }

  const picked = albumColours[Math.floor(Math.random() * albumColours.length)]
  if (picked) {
    colourPalette.value = picked
  }

  setAppColours()
}

function getAlbumColours() {
  const imageUrl = playerData.value.trackAlbum?.image
  if (!imageUrl) {
    return
  }

  Vibrant.from(imageUrl)
    .quality(1)
    .clearFilters()
    .getPalette()
    .then((palette) => {
      handleAlbumPalette(palette)
    })
}

function handleExpiredToken() {
  if (pollPlaying.value) {
    clearInterval(pollPlaying.value)
    pollPlaying.value = null
  }
  emit("requestRefreshToken")
}

onMounted(() => {
  setDataInterval()
})

onBeforeUnmount(() => {
  if (pollPlaying.value) {
    clearInterval(pollPlaying.value)
  }
})

watch(
  () => props.auth.status,
  (status) => {
    if (status === false && pollPlaying.value) {
      clearInterval(pollPlaying.value)
      pollPlaying.value = null
    }
  },
)

watch(playerResponse, () => {
  handleNowPlaying()
})

watch(playerData, (val) => {
  emit("spotifyTrackUpdated", val)
  getAlbumColours()
})
</script>
