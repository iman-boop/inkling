import { useStore } from '../state/store'
import { ReviewInPlace } from './review/ReviewInPlace'
import { ReviewOneByOne } from './review/ReviewOneByOne'
import { ReviewSheet } from './review/ReviewSheet'

/**
 * One Review screen with a mode switcher, not three rival screens.
 *
 * Defaults do the picking: In place for photographed artifacts, Sheet when
 * it's headed for a brand kit, One by one on a first font or when more than
 * eight letters come back shaky. Switching never loses a correction — all
 * three modes write to the same glyph table.
 */
export function Review() {
  const { reviewMode } = useStore()
  if (reviewMode === 'sheet') return <ReviewSheet />
  if (reviewMode === 'one-by-one') return <ReviewOneByOne />
  return <ReviewInPlace />
}
