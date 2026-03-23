import { computed, ref } from "vue"
import type { QueueMedia } from "~/types/spotify"

export function useSpotifyQueue(options: { onUnauthorized: () => void }) {
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

  async function fetchQueue() {
    queueLoading.value = true
    queueError.value = ""
    try {
      const res = await fetch("/api/spotify/queue", { credentials: "include" })

      if (res.status === 401) {
        options.onUnauthorized()
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

  return {
    queueOpen,
    queueLoading,
    queueError,
    queueCurrentlyPlaying,
    queueUpNext,
    fetchQueue,
    openQueue,
  }
}
