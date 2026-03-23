/** Track or episode object from GET /me/player/queue */
export type QueueMedia = {
  id?: string
  uri?: string
  name?: string
  type?: string
  artists?: { name: string }[]
  show?: { name: string }
  album?: { images?: { url: string }[] }
  images?: { url: string }[]
}

export type NowPlayingPlayerState = {
  playing: boolean
  trackAlbum: { title?: string; image?: string }
  trackArtists: string[]
  trackId: string
  trackTitle: string
}

export function getEmptyPlayer(): NowPlayingPlayerState {
  return {
    playing: false,
    trackAlbum: {},
    trackArtists: [],
    trackId: "",
    trackTitle: "",
  }
}

export type PlayerAction = "play" | "pause" | "next" | "previous"
