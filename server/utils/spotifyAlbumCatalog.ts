/**
 * Spotify’s currently-playing payload can replace `album.images` with a music
 * video thumbnail when a video exists. The catalog album resource returns the
 * canonical cover art.
 */
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

export async function fetchCatalogAlbumImages(
  accessToken: string,
  albumId: string,
): Promise<SpotifyAlbumImage[] | null> {
  const now = Date.now()
  const hit = cache.get(albumId)
  if (hit && hit.expiresAt > now) {
    return hit.images
  }

  const res = await fetch(`${ALBUM_URL}/${albumId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    return null
  }

  const data = (await res.json()) as { images?: SpotifyAlbumImage[] }
  const images = data.images?.filter((i) => i.url) ?? []
  if (images.length === 0) {
    return null
  }

  cache.set(albumId, { images, expiresAt: now + CACHE_TTL_MS })
  return images
}

/** For track objects from playback or queue APIs that may carry video thumbnails in `album.images`. */
export async function applyCatalogAlbumImagesToTrack(
  accessToken: string,
  item: unknown,
): Promise<void> {
  if (!item || typeof item !== "object") return
  const track = item as { type?: string; album?: unknown }
  if (track.type !== "track") return
  if (!track.album || typeof track.album !== "object") return
  const album = track.album as { id?: string }
  if (!album.id) return
  const images = await fetchCatalogAlbumImages(accessToken, album.id)
  if (images) {
    ;(track.album as { images: typeof images }).images = images
  }
}
