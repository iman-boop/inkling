/**
 * Looking at the page.
 *
 * There is no reader here — nothing in this app can tell a `k` from an `h`,
 * and pretending otherwise is the one thing a product about someone's own
 * handwriting must never do. What it *can* do honestly, with arithmetic
 * rather than a model, is find the ink: threshold the image against its own
 * local background, group the dark pixels that touch each other, and keep the
 * groups shaped like pen strokes.
 *
 * That is enough to answer the question the flow actually needs answered —
 * is this a page of handwriting at all? — and enough to lift real marks off
 * a real photograph. It is not enough to name them, so nothing downstream
 * claims to.
 */

/** A group of connected dark pixels, in fractions of the image. */
export interface Mark {
  x: number
  y: number
  width: number
  height: number
  /**
   * The writing line this mark sits on, as a fraction of image height. What
   * hangs below it is a descender — which is how a `g` knows to sit low
   * without anyone having to say it is a `g`.
   */
  baseline: number
  /**
   * The mark's shape, normalised into a small square grid — the ink of this
   * component only, so a neighbouring stroke that crosses the box doesn't
   * count. Two marks of the same letter have similar signatures, which is what
   * lets one label cover every other instance of that shape on the page.
   */
  signature: number[]
}

/** Side of the signature grid. */
export const SIGNATURE = 12

export type Verdict = 'page' | 'no-ink' | 'too-dark' | 'too-busy' | 'unreadable'

export interface PageRead {
  verdict: Verdict
  marks: Mark[]
  /** Share of the page covered in ink, 0–1. */
  coverage: number
  /** How bright the paper is, 0–255. */
  paper: number
  /** How colourful the image is, 0–1. Paper is not colourful; a room is. */
  colour: number
  /** The photograph's own width / height, so patches of it stay square. */
  aspect: number
}

/** Long edge the image is scaled to before analysis. */
const WORK = 900

/** Window for the local background estimate, in working pixels. */
const WINDOW = 21

/** Local mean minus this counts as ink. */
const INK_MARGIN = 12

async function load(url: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = url
  await image.decode()
  return image
}

export async function analysePage(url: string): Promise<PageRead> {
  const image = await load(url)
  const scale = Math.min(1, WORK / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const aspect = width / height
  if (!context) return { verdict: 'unreadable', marks: [], coverage: 0, paper: 0, colour: 0, aspect }
  context.drawImage(image, 0, 0, width, height)
  const { data } = context.getImageData(0, 0, width, height)

  const count = width * height
  const grey = new Uint8ClampedArray(count)
  let colourSum = 0
  let paperSum = 0

  for (let i = 0; i < count; i += 1) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    grey[i] = (r * 299 + g * 587 + b * 114) / 1000
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    colourSum += max === 0 ? 0 : (max - min) / max
    paperSum += grey[i]
  }

  const colour = colourSum / count
  const paper = paperSum / count

  // Local background, from a summed-area table, so uneven light and shadow
  // across a photographed page don't swamp the ink.
  const sums = new Float64Array((width + 1) * (height + 1))
  for (let y = 0; y < height; y += 1) {
    let row = 0
    for (let x = 0; x < width; x += 1) {
      row += grey[y * width + x]
      sums[(y + 1) * (width + 1) + (x + 1)] = sums[y * (width + 1) + (x + 1)] + row
    }
  }

  const half = Math.floor(WINDOW / 2)
  const ink = new Uint8Array(count)
  let inkPixels = 0

  for (let y = 0; y < height; y += 1) {
    const top = Math.max(0, y - half)
    const bottom = Math.min(height - 1, y + half)
    for (let x = 0; x < width; x += 1) {
      const left = Math.max(0, x - half)
      const right = Math.min(width - 1, x + half)
      const area = (bottom - top + 1) * (right - left + 1)
      const total =
        sums[(bottom + 1) * (width + 1) + (right + 1)] -
        sums[top * (width + 1) + (right + 1)] -
        sums[(bottom + 1) * (width + 1) + left] +
        sums[top * (width + 1) + left]
      if (grey[y * width + x] < total / area - INK_MARGIN) {
        ink[y * width + x] = 1
        inkPixels += 1
      }
    }
  }

  const coverage = inkPixels / count
  const marks = refine(groupMarks(ink, width, height), width, height)
  const base = { marks, coverage, paper, colour, aspect }

  // The page has to be a page before anything else is worth saying.
  if (paper < 90) return { ...base, verdict: 'too-dark', marks: [] }
  if (colour > 0.34) return { ...base, verdict: 'no-ink', marks: [] }
  if (coverage > 0.34) return { ...base, verdict: 'too-busy', marks: [] }
  if (marks.length < 12) return { ...base, verdict: 'no-ink' }
  return { ...base, verdict: 'page' }
}

/** A component before it is known whether it is one letter or several. */
interface Blob {
  member: number[]
  minX: number
  minY: number
  boxWidth: number
  boxHeight: number
}

/**
 * Connected dark pixels, kept only where the group is shaped like a written
 * mark: small enough to be a letter, sparse enough to be strokes rather than
 * a filled shape, and not a hairline scratch.
 *
 * Connectedness alone is not letterhood — a hand that joins its letters welds
 * a whole word into one component — so wide runs are cut back apart before
 * anything downstream treats them as glyphs.
 */
function groupMarks(ink: Uint8Array, width: number, height: number): Mark[] {
  const seen = new Uint8Array(ink.length)
  const stack = new Int32Array(ink.length)
  const blobs: Blob[] = []

  const minSide = Math.max(5, Math.round(width * 0.006))
  const maxSide = Math.round(width * 0.14)

  for (let start = 0; start < ink.length; start += 1) {
    if (!ink[start] || seen[start]) continue

    let top = stack.length
    stack[--top] = start
    seen[start] = 1

    let pixels = 0
    let minX = width
    let maxX = 0
    let minY = height
    let maxY = 0
    const member: number[] = []

    while (top < stack.length) {
      const index = stack[top++]
      const x = index % width
      const y = (index - x) / width
      pixels += 1
      member.push(index)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y

      if (x > 0 && ink[index - 1] && !seen[index - 1]) (seen[index - 1] = 1), (stack[--top] = index - 1)
      if (x < width - 1 && ink[index + 1] && !seen[index + 1])
        (seen[index + 1] = 1), (stack[--top] = index + 1)
      if (y > 0 && ink[index - width] && !seen[index - width])
        (seen[index - width] = 1), (stack[--top] = index - width)
      if (y < height - 1 && ink[index + width] && !seen[index + width])
        (seen[index + width] = 1), (stack[--top] = index + width)
    }

    // A group that runs off the frame is the page edge, the desk or a hand —
    // never a letter someone wrote.
    if (minX === 0 || minY === 0 || maxX === width - 1 || maxY === height - 1) continue

    const boxWidth = maxX - minX + 1
    const boxHeight = maxY - minY + 1
    const fill = pixels / (boxWidth * boxHeight)

    if (boxHeight < minSide || boxHeight > maxSide) continue
    if (Math.min(boxWidth, boxHeight) < 2) continue
    // A joined word is wide, so width is capped generously and cut up below.
    if (boxWidth > maxSide * 6) continue
    if (boxHeight / boxWidth > 7) continue
    // Pen strokes leave a sparse box. A solid one is a shadow or an object.
    if (fill < 0.06 || fill > 0.8) continue

    blobs.push({ member, minX, minY, boxWidth, boxHeight })
  }

  if (!blobs.length) return []

  // What one letter looks like on this page: the usual height, and the usual
  // width among the blobs narrow enough to be a single letter already.
  const heights = blobs.map((blob) => blob.boxHeight).sort((a, b) => a - b)
  const letterHeight = heights[Math.floor(heights.length / 2)]
  const singles = blobs
    .filter((blob) => blob.boxWidth <= letterHeight * 1.2)
    .map((blob) => blob.boxWidth)
    .sort((a, b) => a - b)
  const letterWidth = singles.length
    ? Math.max(3, singles[Math.floor(singles.length / 2)])
    : Math.max(3, Math.round(letterHeight * 0.7))

  return blobs.flatMap((blob) => cut(blob, width, letterWidth)).map((piece) => ({
    x: piece.minX / width,
    y: piece.minY / height,
    width: piece.boxWidth / width,
    height: piece.boxHeight / height,
    baseline: 0,
    signature: sign(piece.member, width, piece.minX, piece.minY, piece.boxWidth, piece.boxHeight),
  }))
}

/**
 * Cut a joined run where the pen is thinnest.
 *
 * Letters in a word are welded at the join, and the join carries less ink than
 * the letters either side of it — so the columns with the least ink are where
 * the word comes apart. Approximate by nature: it splits `rn` as happily as it
 * splits `r` from `n`, which is exactly why a person names the results.
 */
function cut(blob: Blob, width: number, letterWidth: number): Blob[] {
  const parts = Math.round(blob.boxWidth / letterWidth)
  if (parts < 2 || blob.boxWidth < letterWidth * 1.7) return [blob]

  // Ink per column, across the blob.
  const profile = new Array<number>(blob.boxWidth).fill(0)
  for (const index of blob.member) profile[(index % width) - blob.minX] += 1

  const guard = Math.max(2, Math.floor(letterWidth * 0.45))
  const cuts: number[] = []
  for (let piece = 1; piece < parts; piece += 1) {
    const ideal = Math.round((blob.boxWidth * piece) / parts)
    let best = -1
    let bestInk = Infinity
    for (let x = ideal - guard; x <= ideal + guard; x += 1) {
      if (x <= guard || x >= blob.boxWidth - guard) continue
      if (cuts.some((previous) => Math.abs(previous - x) < guard)) continue
      if (profile[x] < bestInk) {
        bestInk = profile[x]
        best = x
      }
    }
    if (best > 0) cuts.push(best)
  }
  if (!cuts.length) return [blob]

  const bounds = [0, ...cuts.sort((a, b) => a - b), blob.boxWidth]
  const pieces: Blob[] = []

  for (let i = 0; i < bounds.length - 1; i += 1) {
    const from = bounds[i]
    const to = bounds[i + 1]
    const member = blob.member.filter((index) => {
      const column = (index % width) - blob.minX
      return column >= from && column < to
    })
    if (member.length < 6) continue

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const index of member) {
      const x = index % width
      const y = (index - x) / width
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    pieces.push({ member, minX, minY, boxWidth: maxX - minX + 1, boxHeight: maxY - minY + 1 })
  }

  return pieces.length ? pieces : [blob]
}

/**
 * The component's own ink, scaled into a SIGNATURE × SIGNATURE grid. The
 * longer side sets the scale and the shorter one is centred, so a tall thin
 * mark and a short wide one stay distinguishable.
 */
function sign(
  member: number[],
  width: number,
  minX: number,
  minY: number,
  boxWidth: number,
  boxHeight: number,
): number[] {
  const grid = new Array<number>(SIGNATURE * SIGNATURE).fill(0)
  const scale = (SIGNATURE - 2) / Math.max(boxWidth, boxHeight)
  const offsetX = (SIGNATURE - boxWidth * scale) / 2
  const offsetY = (SIGNATURE - boxHeight * scale) / 2

  for (const index of member) {
    const x = index % width
    const y = (index - x) / width
    const cellX = Math.min(SIGNATURE - 1, Math.max(0, Math.floor((x - minX) * scale + offsetX)))
    const cellY = Math.min(SIGNATURE - 1, Math.max(0, Math.floor((y - minY) * scale + offsetY)))
    grid[cellY * SIGNATURE + cellX] += 1
  }

  // Normalise so a thick pen and a fine one compare on shape, not on weight.
  const peak = Math.max(...grid) || 1
  return grid.map((value) => value / peak)
}

/**
 * What's left after the page is read as a page.
 *
 * Two things a letter is: about the same size as the other letters around it —
 * a page is mostly written in one hand at one size, and a title five times the
 * body's height is a different thing — and not alone, because writing comes in
 * lines. Both rules are about the marks together, which is why they can't be
 * applied one component at a time.
 */
function refine(marks: Mark[], width: number, height: number): Mark[] {
  if (marks.length < 3) return marks

  const px = (mark: Mark) => ({
    x: (mark.x + mark.width / 2) * width,
    y: (mark.y + mark.height / 2) * height,
    w: mark.width * width,
    h: mark.height * height,
  })

  const heights = marks.map((mark) => mark.height * height).sort((a, b) => a - b)
  const median = heights[Math.floor(heights.length / 2)] || 1

  const sized = marks.filter((mark) => {
    const { w, h } = px(mark)
    return h >= median * 0.5 && h <= median * 2.2 && w <= median * 9
  })
  if (sized.length < 3) return sized

  // Writing comes in lines: a mark with nothing beside it is a speck.
  const centres = sized.map(px)
  const kept = sized.filter((_, i) => {
    let neighbours = 0
    for (let j = 0; j < centres.length && neighbours < 2; j += 1) {
      if (i === j) continue
      if (
        Math.abs(centres[i].y - centres[j].y) < median * 1.2 &&
        Math.abs(centres[i].x - centres[j].x) < median * 8
      )
        neighbours += 1
    }
    return neighbours >= 2
  })

  return withBaselines(kept, height, median)
}

/**
 * Where each line of writing sits.
 *
 * Marks are gathered into rows by their centres, and the row's baseline is the
 * median of its marks' bottoms — robust, because most letters sit *on* the
 * line and only a few hang under it. Every mark then carries its line with it,
 * so a descender is recognisable as one without anyone naming the letter.
 */
function withBaselines(marks: Mark[], height: number, medianPx: number): Mark[] {
  if (!marks.length) return marks

  const order = [...marks].sort((a, b) => a.y + a.height / 2 - (b.y + b.height / 2))
  const rows: Mark[][] = []
  const gap = (medianPx * 0.7) / height

  for (const mark of order) {
    const centre = mark.y + mark.height / 2
    const row = rows[rows.length - 1]
    const last = row?.[row.length - 1]
    if (row && last && Math.abs(centre - (last.y + last.height / 2)) < gap) row.push(mark)
    else rows.push([mark])
  }

  for (const row of rows) {
    const bottoms = row.map((mark) => mark.y + mark.height).sort((a, b) => a - b)
    const baseline = bottoms[Math.floor(bottoms.length / 2)]
    for (const mark of row) mark.baseline = baseline
  }

  return marks
}

/**
 * Nine marks that stand for the page: closest to the dominant size, spread
 * across the whole of it, rather than whatever happens to sit at the top.
 */
export function representative(marks: Mark[], count: number): Mark[] {
  if (marks.length <= count) return inReadingOrder(marks)

  const heights = marks.map((mark) => mark.height).sort((a, b) => a - b)
  const median = heights[Math.floor(heights.length / 2)]

  const typical = [...marks]
    .sort((a, b) => Math.abs(a.height - median) - Math.abs(b.height - median))
    .slice(0, Math.max(count, Math.round(marks.length * 0.5)))

  const ordered = inReadingOrder(typical)
  const step = ordered.length / count
  return Array.from({ length: count }, (_, i) => ordered[Math.floor(i * step)])
}

/** Reading order, so the lift runs down the page the way it was written. */
export function inReadingOrder(marks: Mark[], rows = 24): Mark[] {
  return [...marks].sort((a, b) => {
    const rowA = Math.floor(a.y * rows)
    const rowB = Math.floor(b.y * rows)
    return rowA === rowB ? a.x - b.x : rowA - rowB
  })
}

export interface Region {
  x: number
  y: number
  width: number
  height: number
}

/**
 * A square patch of the photograph around one mark — square in pixels, not in
 * fractions, so the ink keeps its proportions whatever shape the photo is.
 * `aspect` is the displayed image's width / height.
 */
export function squareRegion(mark: Mark, aspect: number, pad = 1.25): Region {
  const width = Math.min(1, Math.max(mark.width, mark.height / aspect) * pad)
  const height = Math.min(1, width * aspect)
  return {
    x: clamp(mark.x + mark.width / 2 - width / 2, 0, 1 - width),
    y: clamp(mark.y + mark.height / 2 - height / 2, 0, 1 - height),
    width,
    height,
  }
}

/** The mark itself with a hair of air, keeping its own proportions. */
export function tightRegion(mark: Mark, pad = 0.12): Region {
  const padX = mark.width * pad
  const padY = mark.height * pad
  const x = clamp(mark.x - padX, 0, 1)
  const y = clamp(mark.y - padY, 0, 1)
  return {
    x,
    y,
    width: Math.min(1 - x, mark.width + padX * 2),
    height: Math.min(1 - y, mark.height + padY * 2),
  }
}

/** A CSS background showing exactly that patch, out of the full photograph. */
export function crop(url: string, region: Region) {
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${(1 / region.width) * 100}% ${(1 / region.height) * 100}%`,
    backgroundPosition: `${region.width >= 1 ? 50 : (region.x / (1 - region.width)) * 100}% ${
      region.height >= 1 ? 50 : (region.y / (1 - region.height)) * 100
    }%`,
    backgroundRepeat: 'no-repeat',
  } as const
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max))
