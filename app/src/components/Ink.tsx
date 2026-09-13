import type { CSSProperties } from 'react'
import { crop, tightRegion, type Mark } from '../lib/detect'

/**
 * A piece of the photograph, shown at the mark's own proportions.
 *
 * This is the real thing throughout: no glyph is redrawn or substituted, it is
 * the pixels of the page, cut to the stroke and scaled. `height` is in px and
 * the width follows from the mark.
 */
export function Ink({
  mark,
  photo,
  aspect,
  height,
  style,
}: {
  mark: Mark
  photo: string
  /** The photograph's width / height. */
  aspect: number
  height: number
  style?: CSSProperties
}) {
  const region = tightRegion(mark)
  const width = height * (region.width / region.height) * aspect

  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        flex: 'none',
        ...crop(photo, region),
        ...style,
      }}
    />
  )
}

/** How tall this mark is next to the page's usual letter, 1 being typical. */
export const relativeHeight = (mark: Mark, median: number) =>
  median > 0 ? mark.height / median : 1
