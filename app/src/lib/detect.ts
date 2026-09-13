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
}

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
  const marks = groupMarks(ink, width, height)
  const base = { marks, coverage, paper, colour, aspect }

  // The page has to be a page before anything else is worth saying.
  if (paper < 90) return { ...base, verdict: 'too-dark', marks: [] }
  if (colour > 0.34) return { ...base, verdict: 'no-ink', marks: [] }
  if (coverage > 0.34) return { ...base, verdict: 'too-busy', marks: [] }
  if (marks.length < 12) return { ...base, verdict: 'no-ink' }
  return { ...base, verdict: 'page' }
}

/**
 * Connected dark pixels, kept only where the group is shaped like a written
 * mark: small enough to be a letter, sparse enough to be strokes rather than
 * a filled shape, and not a hairline scratch.
 */
function groupMarks(ink: Uint8Array, width: number, height: number): Mark[] {
  const seen = new Uint8Array(ink.length)
  const stack = new Int32Array(ink.length)
  const marks: Mark[] = []

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

    while (top < stack.length) {
      const index = stack[top++]
      const x = index % width
      const y = (index - x) / width
      pixels += 1
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

    const boxWidth = maxX - minX + 1
    const boxHeight = maxY - minY + 1
    const longest = Math.max(boxWidth, boxHeight)
    const shortest = Math.min(boxWidth, boxHeight)
    const fill = pixels / (boxWidth * boxHeight)

    if (longest < minSide || longest > maxSide) continue
    if (shortest < 2) continue
    if (longest / shortest > 7) continue
    // Pen strokes leave a sparse box. A solid one is a shadow or an object.
    if (fill < 0.08 || fill > 0.78) continue

    marks.push({
      x: minX / width,
      y: minY / height,
      width: boxWidth / width,
      height: boxHeight / height,
    })
  }

  return marks
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
