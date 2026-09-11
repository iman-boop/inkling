import { useEffect, useState } from 'react'

/**
 * Motion, as specced.
 *
 * Nothing in the app animates for longer than the two signature moments —
 * they're the only places where duration is the message. Everything else moves
 * in 120–220ms and gets out of the way.
 */
export const DUR = {
  /** A control's own state. */
  control: 120,
  /** Something appearing. */
  appear: 160,
  /** Confidence colour — always a cross-fade, because a snap reads as an error. */
  confidence: 200,
  /** A screen push. */
  push: 220,
} as const

export const EASE = {
  out: 'cubic-bezier(.22,1,.36,1)',
  /** 8a pluck — quick off the page, soft at the top. */
  pluck: 'cubic-bezier(.32,.9,.24,1)',
  /** 8a landing — a small overshoot, then settle. */
  spring: 'cubic-bezier(.2,1.5,.4,1)',
} as const

/** 8a · letters lifting off the page — 1,180ms total. */
export const LIFT = {
  /** Scan sheen sweeps the photo once, left to right. */
  sheen: 260,
  /** Each glyph rises 13px and scales to 1.14. */
  pluck: 340,
  pluckRise: 13,
  pluckScale: 1.14,
  /** Stagger between glyphs, capped at LIFT_VISIBLE on screen. */
  stagger: 60,
  /** The flight to the cell, on an arc. */
  travel: 560,
  /** Landing overshoot before it settles. */
  landScale: 1.05,
  /** The confidence outline arrives after the letter lands. */
  resolve: 280,
} as const

/** 8b · typing in your own hand — pen-paced, not UI-paced. */
export const WRITE = {
  /** Per glyph: fade-up from 4px with a 1.2px ink-blur burning off. */
  glyph: 180,
  /** Between letters. Even cadence is the tell of a machine. */
  cadence: 55,
  /** A hand hesitates at joins. */
  afterSpace: 30,
  afterPunctuation: 90,
} as const

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/** One soft impact on the first landing only. Thirty-eight taps is a brick. */
export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
}
