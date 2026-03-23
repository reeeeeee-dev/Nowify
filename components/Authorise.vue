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
    clientSecret: string
    authCode: string
    accessToken: string
    refreshToken: string
  }
  endpoints: {
    auth: string
    token: string
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

async function requestAccessTokens(
  grantType: "authorization_code" | "refresh_token" = "authorization_code",
) {
  const fetchData: Record<string, string> = {
    grant_type: grantType,
  }

  if (grantType === "authorization_code") {
    fetchData.code = props.auth.authCode
    fetchData.redirect_uri = window.location.origin
  }

  if (grantType === "refresh_token") {
    fetchData.refresh_token = props.auth.refreshToken
  }

  const queryBody = new URLSearchParams(fetchData).toString()
  const clientDetails = btoa(
    `${props.auth.clientId}:${props.auth.clientSecret}`,
  )

  const res = await fetch(`${props.endpoints.token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${clientDetails}`,
    },
    body: queryBody,
  })

  const accessTokenResponse = await res.json()
  handleAccessTokenResponse(accessTokenResponse)
}

function handleAccessTokenResponse(
  accessTokenResponse: Record<string, unknown> & {
    error?: { error?: string; status?: number }
  },
) {
  if (accessTokenResponse.error?.error === "invalid_grant") {
    return
  }

  if (accessTokenResponse.error?.status === 401) {
    props.auth.authCode = ""
    props.auth.status = false
    return
  }

  const token = accessTokenResponse.access_token
  if (typeof token === "string") {
    props.auth.accessToken = token

    const refresh = accessTokenResponse.refresh_token
    if (typeof refresh === "string") {
      props.auth.refreshToken = refresh
    }

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
  }
}

onMounted(() => {
  getUrlAuthCode()
  if (props.auth.refreshToken) {
    requestAccessTokens("refresh_token")
  }
})

watch(
  () => props.auth.authCode,
  () => {
    if (props.auth.authCode) {
      requestAccessTokens("authorization_code")
    }
  },
)

watch(
  () => props.auth.status,
  () => {
    if (props.auth.refreshToken) {
      requestAccessTokens("refresh_token")
    }
  },
)
</script>
