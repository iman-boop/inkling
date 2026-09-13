import type { Mark } from './detect'

/**
 * Ink to outline.
 *
 * A font is not pixels, so before a mark can be a glyph its edge has to become
 * a curve. The mark is re-cut from the photograph at glyph resolution (the
 * page-wide analysis runs small, and a letter traced from a 20px box looks
 * like a letter traced from a 20px box), thresholded against its own local
 * background, then walked: the outside edge in one direction and the holes —
 * the counter of an `o`, the eye of an `e` — in the other, so the non-zero
 * winding rule fills the stroke and leaves the hole empty.
 */

export interface Contour {
  /** Points in glyph space: x right, y up, baseline at 0. */
  points: { x: number; y: number }[]
  hole: boolean
}

export interface Outline {
  contours: Contour[]
  /** Advance width in the same units as the points. */
  width: number
}

/** Height in pixels a mark is re-cut at before tracing. */
const TRACE_HEIGHT = 150

/** How far a traced point may move when the outline is simplified. */
const SIMPLIFY = 0.9

/**
 * Re-cut one mark from the photograph as a clean binary mask, a little larger
 * than the mark so the threshold has some paper to compare against.
 */
async function maskFor(
  image: HTMLImageElement,
  mark: Mark,
): Promise<{ mask: Uint8Array; width: number; height: number; pad: number } | null> {
  const pad = 0.25
  const sx = (mark.x - mark.width * pad) * image.naturalWidth
  const sy = (mark.y - mark.height * pad) * image.naturalHeight
  const sw = mark.width * (1 + pad * 2) * image.naturalWidth
  const sh = mark.height * (1 + pad * 2) * image.naturalHeight

  const height = TRACE_HEIGHT
  const width = Math.max(4, Math.round((sw / sh) * height))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.imageSmoothingEnabled = true
  context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height)

  const { data } = context.getImageData(0, 0, width, height)
  const grey = new Float32Array(width * height)
  for (let i = 0; i < grey.length; i += 1) {
    grey[i] = (data[i * 4] * 299 + data[i * 4 + 1] * 587 + data[i * 4 + 2] * 114) / 1000
  }

  // Otsu's threshold over the patch: the patch is mostly paper and one stroke,
  // which is exactly the two-humped histogram Otsu is for.
  const histogram = new Array<number>(256).fill(0)
  for (const value of grey) histogram[Math.min(255, Math.max(0, Math.round(value)))] += 1

  const total = grey.length
  let sum = 0
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i]

  let sumBackground = 0
  let weightBackground = 0
  let best = 0
  let bestVariance = -1
  for (let t = 0; t < 256; t += 1) {
    weightBackground += histogram[t]
    if (!weightBackground) continue
    const weightForeground = total - weightBackground
    if (!weightForeground) break
    sumBackground += t * histogram[t]
    const meanBackground = sumBackground / weightBackground
    const meanForeground = (sum - sumBackground) / weightForeground
    const variance =
      weightBackground * weightForeground * (meanBackground - meanForeground) ** 2
    if (variance > bestVariance) {
      bestVariance = variance
      best = t
    }
  }

  // The patch is padded so the threshold has paper to compare against, but the
  // padding may hold the neighbouring letter — so only ink inside the mark's
  // own box (plus a hair) can be part of this glyph.
  const inset = pad / (1 + pad * 2)
  const left = Math.floor(width * (inset - 0.03))
  const right = Math.ceil(width * (1 - inset + 0.03))
  const top = Math.floor(height * (inset - 0.03))
  const foot = Math.ceil(height * (1 - inset + 0.03))

  const mask = new Uint8Array(width * height)
  for (let i = 0; i < mask.length; i += 1) {
    const x = i % width
    const y = (i - x) / width
    const inside = x >= left && x <= right && y >= top && y <= foot
    mask[i] = inside && grey[i] < best ? 1 : 0
  }

  // Keep the component nearest the middle: the mark itself, not its neighbours.
  return { mask: largestCentral(mask, width, height), width, height, pad }
}

/** The ink component closest to the centre of the patch. */
function largestCentral(mask: Uint8Array, width: number, height: number): Uint8Array {
  const seen = new Uint8Array(mask.length)
  const stack: number[] = []
  const centreX = width / 2
  const centreY = height / 2
  let bestScore = -Infinity
  let bestMembers: number[] = []

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) continue
    stack.length = 0
    stack.push(start)
    seen[start] = 1
    const members: number[] = []

    while (stack.length) {
      const index = stack.pop() as number
      members.push(index)
      const x = index % width
      const y = (index - x) / width
      if (x > 0 && mask[index - 1] && !seen[index - 1]) (seen[index - 1] = 1), stack.push(index - 1)
      if (x < width - 1 && mask[index + 1] && !seen[index + 1])
        (seen[index + 1] = 1), stack.push(index + 1)
      if (y > 0 && mask[index - width] && !seen[index - width])
        (seen[index - width] = 1), stack.push(index - width)
      if (y < height - 1 && mask[index + width] && !seen[index + width])
        (seen[index + width] = 1), stack.push(index + width)
    }

    let distance = Infinity
    for (const index of members) {
      const x = index % width
      const y = (index - x) / width
      distance = Math.min(distance, Math.hypot(x - centreX, y - centreY))
    }
    const score = members.length - distance * distance
    if (score > bestScore) {
      bestScore = score
      bestMembers = members
    }
  }

  const kept = new Uint8Array(mask.length)
  for (const index of bestMembers) kept[index] = 1
  return kept
}

/** Walk the boundary of one region, Moore-neighbourhood, 8-connected. */
function walk(
  mask: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  value: number,
): { x: number; y: number }[] {
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? 0 : mask[y * width + x] === value ? 1 : 0

  const offsets = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ]

  const points: { x: number; y: number }[] = []
  let x = startX
  let y = startY
  let direction = 6
  const limit = width * height * 8

  for (let step = 0; step < limit; step += 1) {
    points.push({ x, y })
    let found = false
    for (let turn = 0; turn < 8; turn += 1) {
      const d = (direction + 6 + turn) % 8
      const nx = x + offsets[d][0]
      const ny = y + offsets[d][1]
      if (at(nx, ny)) {
        x = nx
        y = ny
        direction = d
        found = true
        break
      }
    }
    if (!found) break
    if (x === startX && y === startY && points.length > 2) break
  }

  return points
}

/** Ramer–Douglas–Peucker: drop points that say nothing about the shape. */
function simplify(points: { x: number; y: number }[], epsilon: number): { x: number; y: number }[] {
  if (points.length < 3) return points

  let index = 0
  let furthest = 0
  const [first] = points
  const last = points[points.length - 1]
  const dx = last.x - first.x
  const dy = last.y - first.y
  const length = Math.hypot(dx, dy) || 1

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance =
      Math.abs(dy * points[i].x - dx * points[i].y + last.x * first.y - last.y * first.x) / length
    if (distance > furthest) {
      furthest = distance
      index = i
    }
  }

  if (furthest <= epsilon) return [first, last]
  return [
    ...simplify(points.slice(0, index + 1), epsilon).slice(0, -1),
    ...simplify(points.slice(index), epsilon),
  ]
}

/**
 * Trace one mark into contours, in glyph space: x to the right from the mark's
 * left edge, y upward from the writing line, scaled so `unitsPerLetter` is the
 * page's usual letter height.
 */
export async function traceMark(
  image: HTMLImageElement,
  mark: Mark,
  medianHeight: number,
  unitsPerLetter: number,
): Promise<Outline | null> {
  const patch = await maskFor(image, mark)
  if (!patch) return null
  const { mask, width, height, pad } = patch

  // Patch pixel → glyph units. The patch spans the mark plus its padding.
  const markUnits = (mark.height / medianHeight) * unitsPerLetter
  const perPixel = (markUnits * (1 + pad * 2)) / height
  // How far the mark's bottom sits below its writing line.
  const drop = ((mark.y + mark.height - mark.baseline) / medianHeight) * unitsPerLetter
  const bottom = height * (1 - pad / (1 + pad * 2))

  const toGlyph = (point: { x: number; y: number }) => ({
    x: point.x * perPixel,
    y: (bottom - point.y) * perPixel - drop,
  })

  const contours: Contour[] = []

  // The outside edge, from the first ink pixel in raster order.
  const start = mask.indexOf(1)
  if (start < 0) return null
  const outer = simplify(
    walk(mask, width, height, start % width, (start - (start % width)) / width, 1),
    SIMPLIFY,
  )
  if (outer.length < 3) return null
  contours.push({ points: outer.map(toGlyph), hole: false })

  // Holes: paper that the stroke encloses. Flood the paper from the border;
  // whatever paper is left is inside something.
  const outside = new Uint8Array(mask.length)
  const queue: number[] = []
  for (let x = 0; x < width; x += 1) {
    queue.push(x, (height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    queue.push(y * width, y * width + width - 1)
  }
  while (queue.length) {
    const index = queue.pop() as number
    if (index < 0 || index >= mask.length || outside[index] || mask[index]) continue
    outside[index] = 1
    const x = index % width
    if (x > 0) queue.push(index - 1)
    if (x < width - 1) queue.push(index + 1)
    queue.push(index - width, index + width)
  }

  const holeSeen = new Uint8Array(mask.length)
  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] || outside[index] || holeSeen[index]) continue

    // Collect this hole so it isn't walked twice, then trace its edge.
    const stack = [index]
    holeSeen[index] = 1
    let size = 0
    let topIndex = index
    while (stack.length) {
      const current = stack.pop() as number
      size += 1
      if (current < topIndex) topIndex = current
      const x = current % width
      const neighbours = [current - 1, current + 1, current - width, current + width]
      for (const next of neighbours) {
        if (next < 0 || next >= mask.length || holeSeen[next] || mask[next] || outside[next]) continue
        if (Math.abs((next % width) - x) > 1) continue
        holeSeen[next] = 1
        stack.push(next)
      }
    }

    // Ignore pinholes: they are threshold noise, not counters.
    if (size < (width * height) / 400) continue

    const hole = simplify(
      walk(mask, width, height, topIndex % width, (topIndex - (topIndex % width)) / width, 0),
      SIMPLIFY,
    )
    if (hole.length > 3) contours.push({ points: hole.map(toGlyph).reverse(), hole: true })
  }

  return { contours, width: width * perPixel }
}
