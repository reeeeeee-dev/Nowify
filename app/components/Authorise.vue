<template>
  <div
    class="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--colour-background-now-playing)] px-6 py-6 text-[var(--color-text-primary)] transition-theme"
  >
    <h1 class="animate-fade-up opacity-0" style="animation-delay: 40ms">
      Nowify
    </h1>

    <p
      class="mb-[var(--spacing-m)] max-w-[480px] text-center animate-fade-up opacity-0"
      style="animation-delay: 120ms"
    >
      Nowify is a simple Spotify 'Now Playing' screen designed for the Raspberry
      Pi. Login with Spotify below and start playing some music!
    </p>

    <button
      type="button"
      class="mb-[var(--spacing-l)] inline-flex min-h-8 cursor-pointer items-center justify-center border border-white/35 bg-transparent px-[var(--spacing-xl)] py-[var(--spacing-l)] text-center uppercase tracking-wide text-[var(--color-text-primary)] shadow-none transition-interactive hover:border-white/55 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] animate-fade-up opacity-0"
      style="animation-delay: 200ms"
      @click="initAuthorise"
    >
      Login with Spotify
    </button>

    <p
      class="text-[0.7em] animate-fade-in-muted opacity-0"
      style="animation-delay: 320ms"
    >
      <a
        href="https://github.com/jonashcroft/Nowify"
        class="text-inherit underline decoration-transparent underline-offset-2 transition-interactive hover:decoration-current"
        >View on GitHub</a
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue"

const props = defineProps<{
  auth: {
    status: boolean
    clientId: string
    authCode: string
  }
  endpoints: {
    auth: string
  }
}>()

function getUrlAuthCode() {
  const params = new URLSearchParams(window.location.search)
  const urlAuthCode = params.get("code")
  if (!urlAuthCode) {
    return
  }
  props.auth.authCode = urlAuthCode
}

function setAuthUrl() {
  const searchParams = new URLSearchParams()
  searchParams.append("client_id", props.auth.clientId)
  searchParams.append("response_type", "code")
  searchParams.append("redirect_uri", window.location.origin)
  searchParams.append(
    "state",
    [
      Math.random().toString(33).substring(2),
      Math.random().toString(34).substring(3),
      Math.random().toString(35).substring(4),
      Math.random().toString(36).substring(5),
    ].join("-"),
  )
  searchParams.append(
    "scope",
    "user-read-currently-playing user-modify-playback-state",
  )
  return `${props.endpoints.auth}?${searchParams.toString()}`
}

function initAuthorise() {
  window.location.href = setAuthUrl()
}

async function exchangeAuthCode() {
  const res = await fetch("/api/spotify/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: props.auth.authCode,
      redirect_uri: window.location.origin,
    }),
  })

  const body = (await res.json()) as Record<string, unknown>

  if (res.ok && body.ok === true) {
    props.auth.status = true
    const path =
      location.protocol +
      "//" +
      location.host +
      location.pathname +
      location.search
        .replace(/[?&]code=[^&]+/, "")
        .replace(/^&/, "?")
        .replace(/[?&]state=[^&]+/, "")
        .replace(/^&/, "?")
    window.history.replaceState(null, "", path)
    return
  }

  const err = body.error
  if (err === "invalid_grant") {
    return
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: number }).status === 401
  ) {
    props.auth.authCode = ""
  }
}

onMounted(() => {
  getUrlAuthCode()
})

watch(
  () => props.auth.authCode,
  () => {
    if (props.auth.authCode) {
      exchangeAuthCode()
    }
  },
)
</script>
