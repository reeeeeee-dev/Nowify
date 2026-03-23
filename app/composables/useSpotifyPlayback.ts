import type { Ref } from "vue"
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { NowPlayingPlayerState, PlayerAction } from "~/types/spotify"
import { getEmptyPlayer } from "~/types/spotify"
import { bestAlbumCoverUrl } from "~/utils/albumCoverPick"

const CONTROL_ERROR_MS = 5000

export function useSpotifyPlayback(options: {
  authStatus: Ref<boolean>
  onRequestRefreshToken: () => void
  onTrackUpdated: (data: NowPlayingPlayerState) => void
}) {
  const pollPlaying = ref<ReturnType<typeof setInterval> | null>(null)
  const playerResponse = ref<Record<string, unknown>>({})
  const playerData = ref(getEmptyPlayer())
  const controlPending = ref(false)
  const controlError = ref("")

  function handleExpiredToken() {
    if (pollPlaying.value) {
      clearInterval(pollPlaying.value)
      pollPlaying.value = null
    }
    options.onRequestRefreshToken()
  }

  function handleNowPlaying() {
    const res = playerResponse.value as {
      error?: { status?: number }
      is_playing?: boolean
      item?: {
        id: string
        name: string
        artists: { name: string }[]
        album: {
          name: string
          images: {
            url: string
            width?: number | null
            height?: number | null
          }[]
        }
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
    const coverUrl = bestAlbumCoverUrl(item.album.images)

    if (item.id === playerData.value.trackId) {
      playerData.value = {
        ...playerData.value,
        playing,
        trackAlbum: {
          title: item.album.name,
          image: coverUrl,
        },
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
        image: coverUrl,
      },
    }
  }

  async function getNowPlaying() {
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
        playerData.value = getEmptyPlayer()
        return
      }

      const json = (await response.json()) as Record<string, unknown>
      playerResponse.value = json
    } catch {
      handleExpiredToken()
      playerData.value = getEmptyPlayer()
    }
  }

  function setDataInterval() {
    if (pollPlaying.value) {
      clearInterval(pollPlaying.value)
    }
    pollPlaying.value = setInterval(() => {
      void getNowPlaying()
    }, 2500)
  }

  function clearControlErrorSoon() {
    window.setTimeout(() => {
      controlError.value = ""
    }, CONTROL_ERROR_MS)
  }

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
        clearControlErrorSoon()
        return
      }

      await getNowPlaying()
    } catch {
      controlError.value = "Something went wrong. Try again."
      clearControlErrorSoon()
    } finally {
      controlPending.value = false
    }
  }

  onMounted(() => {
    setDataInterval()
  })

  onBeforeUnmount(() => {
    if (pollPlaying.value) {
      clearInterval(pollPlaying.value)
    }
  })

  watch(options.authStatus, (status) => {
    if (status === false && pollPlaying.value) {
      clearInterval(pollPlaying.value)
      pollPlaying.value = null
    }
  })

  watch(playerResponse, () => {
    handleNowPlaying()
  })

  watch(playerData, (val) => {
    options.onTrackUpdated(val)
  })

  return {
    playerData,
    controlPending,
    controlError,
    sendControl,
    getNowPlaying,
    handleUnauthorized: handleExpiredToken,
  }
}
