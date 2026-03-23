import type { Palette } from "@vibrant/color"
import { Vibrant } from "node-vibrant/browser"
import type { Ref } from "vue"
import { ref, watch } from "vue"

export function useAlbumPalette(imageUrl: Ref<string | undefined>) {
  const colourPalette = ref<{ text: string; background: string } | null>(null)

  function setAppColours() {
    const palette = colourPalette.value
    if (!palette) {
      return
    }
    document.documentElement.style.setProperty(
      "--color-text-primary",
      palette.text,
    )
    document.documentElement.style.setProperty(
      "--colour-background-now-playing",
      palette.background,
    )
  }

  function handleAlbumPalette(palette: Palette) {
    const albumColours = Object.entries(palette)
      .map(([, swatch]) => {
        if (!swatch) {
          return null
        }
        return {
          text: swatch.titleTextColor,
          background: swatch.hex,
        }
      })
      .filter((x): x is { text: string; background: string } => x !== null)

    if (albumColours.length === 0) {
      return
    }

    const picked = albumColours[Math.floor(Math.random() * albumColours.length)]
    if (picked) {
      colourPalette.value = picked
    }

    setAppColours()
  }

  function getAlbumColours() {
    const url = imageUrl.value
    if (!url) {
      return
    }

    Vibrant.from(url)
      .quality(1)
      .clearFilters()
      .getPalette()
      .then((palette) => {
        handleAlbumPalette(palette)
      })
  }

  watch(imageUrl, () => {
    getAlbumColours()
  })

  return { colourPalette }
}
