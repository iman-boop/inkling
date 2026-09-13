import type { Mark } from './detect'

/**
 * Labelling a page without labelling every mark on it.
 *
 * A page of handwriting is the same few dozen shapes over and over. Group the
 * marks by shape first and one answer covers every other instance: forty `e`s
 * cost one keystroke, not forty. The grouping is done on the marks' own
 * signatures — no model, no training, just distance between normalised
 * bitmaps — so it is approximate by nature, which is why a person is still the
 * one who says what each group *is*, and why a group can be split when the
 * machine has put two letters together.
 */

export interface Cluster {
  /** Indices into the read's marks. */
  members: number[]
  /** What the person said this shape is. Undefined until they say. */
  letter?: string
  /** Marked as not-a-letter: a smudge, a rule, half a torn stroke. */
  skipped?: boolean
}

/** Mean squared difference between two signatures, 0 (identical) to 1. */
function distance(a: number[], b: number[]): number {
  let total = 0
  for (let i = 0; i < a.length; i += 1) {
    const delta = a[i] - b[i]
    total += delta * delta
  }
  return total / a.length
}

/** The shape at the centre of a group, kept as a running mean. */
function centroidOf(marks: Mark[], members: number[]): number[] {
  const first = marks[members[0]].signature
  const mean = new Array<number>(first.length).fill(0)
  for (const index of members) {
    const signature = marks[index].signature
    for (let i = 0; i < mean.length; i += 1) mean[i] += signature[i]
  }
  return mean.map((value) => value / members.length)
}

/**
 * Greedy nearest-centroid grouping. Marks are visited largest first, so the
 * clearest examples seed the groups and the ambiguous ones join them.
 */
export function clusterMarks(marks: Mark[], tolerance = 0.045, maxGroups = 160): Cluster[] {
  const order = marks
    .map((mark, index) => ({ index, size: mark.width * mark.height }))
    .sort((a, b) => b.size - a.size)
    .map((entry) => entry.index)

  const groups: { members: number[]; centroid: number[] }[] = []

  for (const index of order) {
    const signature = marks[index].signature
    let best = -1
    let bestDistance = Infinity

    for (let g = 0; g < groups.length; g += 1) {
      const d = distance(signature, groups[g].centroid)
      if (d < bestDistance) {
        bestDistance = d
        best = g
      }
    }

    if (best >= 0 && (bestDistance <= tolerance || groups.length >= maxGroups)) {
      const group = groups[best]
      group.members.push(index)
      // Running mean, so the centroid follows the group as it grows.
      const n = group.members.length
      for (let i = 0; i < group.centroid.length; i += 1) {
        group.centroid[i] += (signature[i] - group.centroid[i]) / n
      }
    } else {
      groups.push({ members: [index], centroid: [...signature] })
    }
  }

  // Commonest shapes first: the letters worth naming are the ones the page is
  // mostly made of.
  return groups
    .sort((a, b) => b.members.length - a.members.length)
    .map((group) => ({ members: group.members }))
}

/**
 * Split a group whose members clearly aren't the same shape: the outlier and
 * everything nearer to it than to the group's centre leave together.
 */
export function splitCluster(cluster: Cluster, marks: Mark[]): Cluster[] {
  if (cluster.members.length < 2) return [cluster]

  const centre = centroidOf(marks, cluster.members)
  let outlier = cluster.members[0]
  let worst = -1
  for (const index of cluster.members) {
    const d = distance(marks[index].signature, centre)
    if (d > worst) {
      worst = d
      outlier = index
    }
  }

  const away = marks[outlier].signature
  const stay: number[] = []
  const leave: number[] = []
  for (const index of cluster.members) {
    const signature = marks[index].signature
    ;(distance(signature, away) < distance(signature, centre) ? leave : stay).push(index)
  }

  if (!stay.length || !leave.length) return [cluster]
  return [{ members: stay }, { members: leave }]
}

/** Every mark a letter was given, in the order they appear on the page. */
export function marksForLetter(clusters: Cluster[], letter: string): number[] {
  return clusters
    .filter((cluster) => cluster.letter === letter)
    .flatMap((cluster) => cluster.members)
}

/** Letters named so far, in alphabet order. */
export function namedLetters(clusters: Cluster[]): string[] {
  return [...new Set(clusters.map((c) => c.letter).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b),
  )
}
