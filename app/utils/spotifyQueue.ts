import type { QueueMedia } from "~/types/spotify"

export function queueItemTitle(item: QueueMedia): string {
  return item.name?.trim() || "Unknown"
}

export function queueItemSubtitle(item: QueueMedia): string {
  if (item.type === "episode" && item.show?.name) {
    return item.show.name
  }
  if (item.artists?.length) {
    return item.artists.map((a) => a.name).join(", ")
  }
  return ""
}

export function queueItemImage(item: QueueMedia): string | undefined {
  const fromAlbum = item.album?.images?.[0]?.url
  if (fromAlbum) {
    return fromAlbum
  }
  return item.images?.[0]?.url
}

export function queueItemKey(item: QueueMedia, index: number): string {
  return item.uri ?? item.id ?? `q-${index}`
}
