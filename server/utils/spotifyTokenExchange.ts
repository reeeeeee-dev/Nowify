import type { H3Event } from "h3"
import type { SessionPayload } from "./sessionCrypto"

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

export type SpotifyTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

export async function exchangeWithSpotify(
  event: H3Event,
  params: URLSearchParams,
): Promise<
  | { ok: true; data: SpotifyTokenResponse }
  | { ok: false; status: number; data: SpotifyTokenResponse }
> {
  const config = useRuntimeConfig(event)
  const clientId = config.public.spotifyClientId as string
  const clientSecret = config.spotifyClientSecret as string

  if (!clientId?.trim() || !clientSecret?.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Spotify client credentials are not configured on the server",
    })
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const upstream = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: params.toString(),
  })

  const data = (await upstream.json()) as SpotifyTokenResponse

  if (!upstream.ok) {
    return { ok: false, status: upstream.status, data }
  }

  return { ok: true, data }
}

export function buildSessionFromTokenResponse(
  data: SpotifyTokenResponse,
  previousRefreshToken?: string,
): SessionPayload | null {
  const access = data.access_token
  const expiresIn = data.expires_in
  if (typeof access !== "string" || typeof expiresIn !== "number") {
    return null
  }
  const refresh =
    typeof data.refresh_token === "string"
      ? data.refresh_token
      : previousRefreshToken
  if (!refresh) {
    return null
  }
  return {
    accessToken: access,
    refreshToken: refresh,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}
