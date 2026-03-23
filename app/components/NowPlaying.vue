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
      class="flex shrink-0 flex-wrap items-center justify-center gap-4 px-[var(--spacing-l)] pb-[var(--spacing-xl)] pt-[var(--spacing-m)]"
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
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center rounded-full border border-current/25 bg-black/15 text-[var(--color-text-primary)] transition-opacity hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="controlPending"
        aria-label="View queue"
        :aria-expanded="queueOpen"
        @click="openQueue"
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
    <p
      v-if="controlError"
      class="pb-[var(--spacing-m)] text-center text-sm opacity-80"
      role="status"
    >
      {{ controlError }}
    </p>

    <Teleport to="body">
      <div
        v-if="queueOpen"
        class="fixed inset-0 z-[100] flex items-end justify-center p-0 md:items-center md:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-dialog-title"
      >
        <div
          class="absolute inset-0 bg-black/55"
          aria-hidden="true"
          @click="queueOpen = false"
        />
        <div
          class="relative flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col rounded-t-2xl border border-current/20 bg-[var(--colour-background-now-playing)] text-[var(--color-text-primary)] shadow-lg md:rounded-2xl"
        >
          <div
            class="flex items-center justify-between gap-3 border-b border-current/15 px-4 py-3"
          >
            <h2 id="queue-dialog-title" class="text-lg font-semibold">
              Queue
            </h2>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-full border border-current/25 bg-black/15 px-3 py-1.5 text-sm transition-opacity hover:bg-black/25 disabled:opacity-40"
                :disabled="queueLoading"
                @click="fetchQueue"
              >
                Refresh
              </button>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full border border-current/25 bg-black/15 transition-opacity hover:bg-black/25"
                aria-label="Close queue"
                @click="queueOpen = false"
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
            <p
              v-if="queueLoading"
              class="py-8 text-center text-sm opacity-80"
            >
              Loading queue…
            </p>
            <p
              v-else-if="queueError"
              class="py-8 text-center text-sm opacity-90"
              role="status"
            >
              {{ queueError }}
            </p>
            <template v-else>
              <section
                v-if="queueCurrentlyPlaying"
                class="mb-4"
              >
                <h3 class="mb-2 text-xs font-medium uppercase tracking-wide opacity-70">
                  Now playing
                </h3>
                <div
                  class="flex gap-3 rounded-lg border border-current/15 bg-black/10 p-2"
                >
                  <img
                    v-if="queueItemImage(queueCurrentlyPlaying)"
                    :src="queueItemImage(queueCurrentlyPlaying)"
                    alt=""
                    class="h-14 w-14 shrink-0 rounded object-cover"
                  />
                  <div
                    v-else
                    class="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-black/20 text-xs opacity-60"
                  >
                    —
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium">
                      {{ queueItemTitle(queueCurrentlyPlaying) }}
                    </p>
                    <p class="truncate text-sm opacity-80">
                      {{ queueItemSubtitle(queueCurrentlyPlaying) }}
                    </p>
                  </div>
                </div>
              </section>

              <section v-if="queueUpNext.length">
                <h3 class="mb-2 text-xs font-medium uppercase tracking-wide opacity-70">
                  Up next
                </h3>
                <ol class="space-y-1">
                  <li
                    v-for="(item, index) in queueUpNext"
                    :key="queueItemKey(item, index)"
                  >
                    <div
                      class="flex gap-3 rounded-lg p-2 opacity-95"
                    >
                      <img
                        v-if="queueItemImage(item)"
                        :src="queueItemImage(item)"
                        alt=""
                        class="h-12 w-12 shrink-0 rounded object-cover"
                      />
                      <div
                        v-else
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-black/15 text-xs opacity-60"
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
                v-if="!queueCurrentlyPlaying && queueUpNext.length === 0"
                class="py-8 text-center text-sm opacity-80"
              >
                Nothing in the queue. Start playback on Spotify to see what is
                lined up.
              </p>
            </template>
          </div>

          <div
            class="border-t border-current/15 px-4 py-3 text-xs leading-relaxed opacity-75"
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
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Palette } from "@vibrant/color"
import { Vibrant } from "node-vibrant/browser"
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

/** Track or episode object from GET /me/player/queue */
type QueueMedia = {
  id?: string
  uri?: string
  name?: string
  type?: string
  artists?: { name: string }[]
  show?: { name: string }
  album?: { images?: { url: string }[] }
  images?: { url: string }[]
}

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

const queueOpen = ref(false)
const queueLoading = ref(false)
const queueError = ref("")
const queuePayload = ref<{
  currently_playing: QueueMedia | null
  queue: QueueMedia[]
} | null>(null)

const queueCurrentlyPlaying = computed(
  () => queuePayload.value?.currently_playing ?? null,
)
const queueUpNext = computed(() => queuePayload.value?.queue ?? [])

const trackArtistsLabel = computed(() => props.player.trackArtists.join(", "))

function queueItemTitle(item: QueueMedia): string {
  return item.name?.trim() || "Unknown"
}

function queueItemSubtitle(item: QueueMedia): string {
  if (item.type === "episode" && item.show?.name) {
    return item.show.name
  }
  if (item.artists?.length) {
    return item.artists.map((a) => a.name).join(", ")
  }
  return ""
}

function queueItemImage(item: QueueMedia): string | undefined {
  const fromAlbum = item.album?.images?.[0]?.url
  if (fromAlbum) {
    return fromAlbum
  }
  return item.images?.[0]?.url
}

function queueItemKey(item: QueueMedia, index: number): string {
  return item.uri ?? item.id ?? `q-${index}`
}

async function fetchQueue() {
  queueLoading.value = true
  queueError.value = ""
  try {
    const res = await fetch("/api/spotify/queue", { credentials: "include" })

    if (res.status === 401) {
      handleExpiredToken()
      return
    }

    if (res.status === 204) {
      queuePayload.value = { currently_playing: null, queue: [] }
      return
    }

    const json = (await res.json()) as Record<string, unknown>

    if (!res.ok) {
      const err = json.error as { message?: string } | undefined
      queueError.value =
        err?.message?.trim() ||
        "Could not load the queue. Use Spotify Premium with an active device."
      return
    }

    const currently = json.currently_playing as QueueMedia | null | undefined
    const queue = json.queue as QueueMedia[] | undefined
    queuePayload.value = {
      currently_playing: currently ?? null,
      queue: Array.isArray(queue) ? queue : [],
    }
  } catch {
    queueError.value = "Something went wrong loading the queue."
  } finally {
    queueLoading.value = false
  }
}

function openQueue() {
  queueOpen.value = true
  void fetchQueue()
}

function onQueueEscape(e: KeyboardEvent) {
  if (e.key === "Escape" && queueOpen.value) {
    queueOpen.value = false
  }
}

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
  window.addEventListener("keydown", onQueueEscape)
})

onBeforeUnmount(() => {
  if (pollPlaying.value) {
    clearInterval(pollPlaying.value)
  }
  window.removeEventListener("keydown", onQueueEscape)
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
