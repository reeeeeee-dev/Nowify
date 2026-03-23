<template>
  <div id="app">
    <div
      v-if="player.playing"
      class="flex min-h-screen w-full flex-col items-center justify-center gap-0 bg-[var(--colour-background-now-playing)] p-[var(--spacing-l)] text-[var(--color-text-primary)] md:flex-row md:p-[10%]"
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
        <h1 class="font-black">{{ player.trackTitle }}</h1>
        <h2 class="opacity-80">{{ trackArtistsLabel }}</h2>
      </div>
    </div>
    <div
      v-else
      class="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--colour-background-now-playing)] p-[var(--spacing-l)] text-[var(--color-text-primary)] md:flex-row md:p-[10%]"
    >
      <h1 class="text-center font-black">No music is playing 😔</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Palette } from "@vibrant/color"
import { Vibrant } from "node-vibrant/browser"
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = defineProps<{
  auth: {
    status: boolean
    accessToken: string
  }
  endpoints: {
    base: string
    nowPlaying: string
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

const trackArtistsLabel = computed(() => props.player.trackArtists.join(", "))

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
    const response = await fetch(
      `${props.endpoints.base}/${props.endpoints.nowPlaying}`,
      {
        headers: {
          Authorization: `Bearer ${props.auth.accessToken}`,
        },
      },
    )

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

  if (res.is_playing === false) {
    playerData.value = getEmptyPlayer()
    return
  }

  const item = res.item
  if (!item || item.id === playerData.value.trackId) {
    return
  }

  playerData.value = {
    playing: Boolean(res.is_playing),
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
