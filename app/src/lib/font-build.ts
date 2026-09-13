import { Font, Glyph, Path } from 'opentype.js'
import type { Cluster } from './cluster'
import type { Mark, PageRead } from './detect'
import { traceMark, type Contour } from './trace'

/**
 * The font file.
 *
 * Every glyph in it is one mark off the photograph, traced to an outline and
 * set on the writing line it was written on — so a descender hangs because it
 * hung on the page, not because a rule said `g` should. What comes out is a
 * real .otf: installable, and made of nothing that wasn't on the paper.
 */

const UNITS_PER_EM = 1000
const ASCENDER = 800
const DESCENDER = -200

/** The page's usual letter, in font units. Most letters are x-height. */
const LETTER_UNITS = 480

export interface BuiltFont {
  buffer: ArrayBuffer
  /** Letters that made it into the file. */
  letters: string[]
  /** Letters that were named but couldn't be traced. */
  failed: string[]
}

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('could not load the photograph'))
    image.src = url
  })
}

/** Twice the area a closed ring encloses; negative when it winds clockwise. */
function signedArea(points: { x: number; y: number }[]): number {
  let total = 0
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    total += a.x * b.y - b.x * a.y
  }
  return total
}

/**
 * A traced ring becomes a smooth closed curve: every traced point is a control
 * point and the midpoints between them are on-curve, which is the standard way
 * to read a polyline as quadratics — and quadratics are what TrueType stores.
 */
function ring(path: Path, contour: Contour) {
  const points = [...contour.points]
  if (points.length < 3) return

  // Non-zero winding fills the stroke and empties the counter only if the
  // outside and the holes wind opposite ways.
  const area = signedArea(points)
  const wantsClockwise = !contour.hole
  if (wantsClockwise === area > 0) points.reverse()

  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  })

  const first = mid(points[points.length - 1], points[0])
  path.moveTo(first.x, first.y)
  for (let i = 0; i < points.length; i += 1) {
    const control = points[i]
    const next = mid(control, points[(i + 1) % points.length])
    path.quadraticCurveTo(control.x, control.y, next.x, next.y)
  }
  path.close()
}

/** The member of a group that looks most like the group: its clearest example. */
function exemplar(cluster: Cluster, marks: Mark[]): number {
  if (cluster.members.length === 1) return cluster.members[0]

  const length = marks[cluster.members[0]].signature.length
  const mean = new Array<number>(length).fill(0)
  for (const index of cluster.members) {
    const signature = marks[index].signature
    for (let i = 0; i < length; i += 1) mean[i] += signature[i] / cluster.members.length
  }

  let best = cluster.members[0]
  let bestDistance = Infinity
  for (const index of cluster.members) {
    const signature = marks[index].signature
    let distance = 0
    for (let i = 0; i < length; i += 1) distance += (signature[i] - mean[i]) ** 2
    // Bigger marks carry more ink and trace better, so ties go to the larger.
    const score = distance / (1 + marks[index].height * 4)
    if (score < bestDistance) {
      bestDistance = score
      best = index
    }
  }
  return best
}

export async function buildFont(
  photo: string,
  read: PageRead,
  clusters: Cluster[],
  familyName: string,
): Promise<BuiltFont> {
  const image = await load(photo)

  const heights = read.marks.map((mark) => mark.height).sort((a, b) => a - b)
  const median = heights[Math.floor(heights.length / 2)] || 0.02

  // One glyph per letter: the clearest example of the largest group that was
  // given that letter.
  const chosen = new Map<string, Cluster>()
  for (const cluster of clusters) {
    if (!cluster.letter || cluster.skipped) continue
    const existing = chosen.get(cluster.letter)
    if (!existing || cluster.members.length > existing.members.length) {
      chosen.set(cluster.letter, cluster)
    }
  }

  const notdef = new Glyph({ name: '.notdef', unicode: 0, advanceWidth: 300, path: new Path() })
  const space = new Glyph({ name: 'space', unicode: 32, advanceWidth: 280, path: new Path() })
  const glyphs: Glyph[] = [notdef, space]
  const letters: string[] = []
  const failed: string[] = []

  for (const [letter, cluster] of [...chosen.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const mark = read.marks[exemplar(cluster, read.marks)]
    let outline = null
    try {
      outline = await traceMark(image, mark, median, LETTER_UNITS)
    } catch {
      outline = null
    }

    if (!outline || !outline.contours.length) {
      failed.push(letter)
      continue
    }

    const path = new Path()
    for (const contour of outline.contours) ring(path, contour)

    glyphs.push(
      new Glyph({
        name: `uni${letter.codePointAt(0)?.toString(16).padStart(4, '0')}`,
        unicode: letter.codePointAt(0),
        advanceWidth: Math.max(120, Math.round(outline.width)),
        path,
      }),
    )
    letters.push(letter)
  }

  const font = new Font({
    familyName: familyName || 'My Hand',
    styleName: 'Regular',
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs,
  })

  return { buffer: font.toArrayBuffer(), letters, failed }
}

/** Hand the file to the browser. */
export function saveFont(buffer: ArrayBuffer, familyName: string) {
  const blob = new Blob([buffer], { type: 'font/otf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(familyName || 'My Hand').replace(/[^\w\- ]+/g, '').trim() || 'My Hand'}.otf`
  document.body.append(link)
  link.click()
  link.remove()
  // Give the download a moment to start before the URL goes away.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
