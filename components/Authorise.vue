<template>
  <div
    class="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--colour-background-now-playing)] px-6 py-6 text-[var(--color-text-primary)]"
  >
    <h1>Nowify</h1>

    <p class="mb-[var(--spacing-m)] max-w-[480px] text-center">
      Nowify is a simple Spotify 'Now Playing' screen designed for the Raspberry
      Pi. Login with Spotify below and start playing some music!
    </p>

    <button
      type="button"
      class="mb-[var(--spacing-l)] inline-flex min-h-8 cursor-pointer items-center justify-center border border-transparent bg-spotify px-[var(--spacing-xl)] py-[var(--spacing-l)] text-center uppercase tracking-wide text-[var(--color-text-primary)] shadow-none transition-transform duration-200 ease-in-out hover:scale-[1.02]"
      @click="initAuthorise"
    >
      Login with Spotify
    </button>

    <p class="text-[0.7em] opacity-80">
      <a href="https://github.com/jonashcroft/Nowify" class="text-inherit"
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
  searchParams.append("scope", "user-read-currently-playing")
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
