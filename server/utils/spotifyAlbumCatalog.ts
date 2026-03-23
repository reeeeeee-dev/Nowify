import { preferSquareAlbumImages } from "../../app/utils/albumCoverPick"

/**
 * Spotify’s playback/queue payloads can put music video frames in `album.images`.
 * We load catalog metadata (track and/or album) and prefer square cover art over
 * widescreen thumbnails.
 */
const TRACK_URL = "https://api.spotify.com/v1/tracks"
const ALBUM_URL = "https://api.spotify.com/v1/albums"

export type SpotifyAlbumImage = {
  url: string
  height?: number | null
  width?: number | null
}

const CACHE_TTL_MS = 60 * 60 * 1000
const cache = new Map<
  string,
  { images: SpotifyAlbumImage[]; expiresAt: number }
>()

function cacheGet(key: string): SpotifyAlbumImage[] | null {
  const hit = cache.get(key)
  if (!hit || hit.expiresAt <= Date.now()) {
    return null
  }
  return hit.images
}

function cacheSet(key: string, images: SpotifyAlbumImage[]) {
  cache.set(key, { images, expiresAt: Date.now() + CACHE_TTL_MS })
}

async function fetchCatalogTrackImages(
  accessToken: string,
  trackId: string,
): Promise<SpotifyAlbumImage[] | null> {
  const key = `track:${trackId}`
  const cached = cacheGet(key)
  if (cached) {
    return cached
  }

  const res = await fetch(`${TRACK_URL}/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    return null
  }

  const data = (await res.json()) as {
    album?: { images?: SpotifyAlbumImage[] }
  }
  const raw = data.album?.images?.filter((i) => i.url) ?? []
  if (raw.length === 0) {
    return null
  }

  const images = preferSquareAlbumImages(raw)
  cacheSet(key, images)
  return images
}

async function fetchCatalogAlbumImages(
  accessToken: string,
  albumId: string,
): Promise<SpotifyAlbumImage[] | null> {
  const key = `album:${albumId}`
  const cached = cacheGet(key)
  if (cached) {
    return cached
  }

  const res = await fetch(`${ALBUM_URL}/${albumId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    return null
  }

  const data = (await res.json()) as { images?: SpotifyAlbumImage[] }
  const raw = data.images?.filter((i) => i.url) ?? []
  if (raw.length === 0) {
    return null
  }

  const images = preferSquareAlbumImages(raw)
  cacheSet(key, images)
  return images
}

/** For track objects from playback or queue APIs that may carry video thumbnails in `album.images`. */
export async function applyCatalogAlbumImagesToTrack(
  accessToken: string,
  item: unknown,
): Promise<void> {
  if (!item || typeof item !== "object") return
  const track = item as {
    type?: string
    id?: string
    album?: unknown
  }
  if (track.type === "episode") return
  if (!track.id) return
  if (!track.album || typeof track.album !== "object") return

  const album = track.album as {
    id?: string
    images?: SpotifyAlbumImage[]
  }

  let next: SpotifyAlbumImage[] | null = null

  next = await fetchCatalogTrackImages(accessToken, track.id)
  if (!next && album.id) {
    next = await fetchCatalogAlbumImages(accessToken, album.id)
  }

  if (next?.length) {
    ;(track.album as { images: SpotifyAlbumImage[] }).images = next
    return
  }

  if (album.images?.length) {
    const reordered = preferSquareAlbumImages(album.images)
    ;(track.album as { images: SpotifyAlbumImage[] }).images = reordered
  }
}
