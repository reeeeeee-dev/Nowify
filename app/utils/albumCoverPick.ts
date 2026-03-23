export type SpotifyImageLike = {
  url: string
  width?: number | null
  height?: number | null
}

/**
 * Video thumbnails are often widescreen (e.g. 16:9); album covers are square.
 * Prefer the most square image, then largest area.
 */
export function preferSquareAlbumImages<T extends SpotifyImageLike>(
  images: T[] | undefined,
): T[] {
  if (!images?.length) return []
  const scored = images.map((img) => {
    const w = img.width ?? 0
    const h = img.height ?? 0
    const area = w > 0 && h > 0 ? w * h : 0
    let aspectPenalty = 0.5
    if (w > 0 && h > 0) {
      const r = Math.min(w, h) / Math.max(w, h)
      aspectPenalty = 1 - r
    }
    return { img, area, aspectPenalty }
  })
  scored.sort((a, b) => {
    if (Math.abs(a.aspectPenalty - b.aspectPenalty) > 0.02) {
      return a.aspectPenalty - b.aspectPenalty
    }
    return b.area - a.area
  })
  return scored.map((s) => s.img)
}

export function bestAlbumCoverUrl(
  images: SpotifyImageLike[] | undefined,
): string | undefined {
  return preferSquareAlbumImages(images)[0]?.url
}
