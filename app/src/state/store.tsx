import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PageRead } from '../lib/detect'
import {
  RESNAP_SHAKY,
  seedGlyphs,
  stats,
  type FontStats,
  type Glyph,
  type GlyphState,
} from '../lib/font-data'

export type ScreenId =
  | 'onboarding'
  | 'purpose'
  | 'camera'
  | 'camera-glare'
  | 'camera-blur'
  | 'reading'
  | 'review'
  | 'gaps'
  | 'resnap'
  | 'preview'
  | 'paywall'
  | 'library'
  | 'own-page'
  | 'no-handwriting'
  | 'printed-type'
  | 'unsupported-script'
  | 'partial-read'

export type Purpose = 'archive' | 'brand' | 'personal'
export type ReviewMode = 'in-place' | 'sheet' | 'one-by-one'
export type Plan = 'once' | 'keeper' | 'studio'

/**
 * Defaults do the picking: In place for photographed artifacts, Sheet when
 * it's headed for a brand kit, One by one on a first font — or whenever more
 * than 8 letters came back shaky.
 */
function defaultMode(purpose: Purpose | null, shaky: number): ReviewMode {
  if (shaky > 8) return 'one-by-one'
  if (purpose === 'brand') return 'sheet'
  if (purpose === 'personal') return 'one-by-one'
  return 'in-place'
}

interface Store {
  screen: ScreenId
  go: (screen: ScreenId) => void
  back: () => void
  canGoBack: boolean

  purpose: Purpose | null
  setPurpose: (purpose: Purpose) => void

  reviewMode: ReviewMode
  setReviewMode: (mode: ReviewMode) => void

  /** The letter one-by-one should open on when review is entered from a cell. */
  focusedGlyph: string | null
  focusGlyph: (ch: string | null) => void

  glyphs: Glyph[]
  stats: FontStats
  /** A correction in review — switching modes never loses one. */
  resolve: (ch: string, state: GlyphState) => void
  /** The re-snap lands the eleven missing letters; two come back shaky. */
  fillGaps: () => void
  gapsFilled: boolean

  /**
   * The page the person actually photographed or chose, as an object URL.
   * Null until they take or pick one, and the sample artifact stands in.
   */
  photo: string | null
  setPhoto: (file: File | null) => void

  /** What was actually found on that photo. Null until it has been looked at. */
  read: PageRead | null
  setRead: (read: PageRead | null) => void

  /** Marks on the photo that have had a decision. */
  resolvedMarks: Record<string, string>
  resolveMark: (id: string, ch: string) => void

  fontName: string
  setFontName: (name: string) => void

  plan: Plan
  setPlan: (plan: Plan) => void

  /** Set once the export has been paid for. */
  purchased: boolean
  purchase: () => void

  reset: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({
  children,
  initialScreen = 'onboarding',
}: {
  children: ReactNode
  initialScreen?: ScreenId
}) {
  const [history, setHistory] = useState<ScreenId[]>([initialScreen])
  // Archive is pre-selected, the way the design draws it: the question sets a
  // starting point, so it should already have a reasonable one.
  const [purpose, setPurposeState] = useState<Purpose | null>('archive')
  const [glyphs, setGlyphs] = useState<Glyph[]>(seedGlyphs)
  const [modeOverride, setModeOverride] = useState<ReviewMode | null>(null)
  const [focusedGlyph, focusGlyph] = useState<string | null>(null)
  const [resolvedMarks, setResolvedMarks] = useState<Record<string, string>>({})
  const [photo, setPhotoUrl] = useState<string | null>(null)
  const [read, setRead] = useState<PageRead | null>(null)
  const [fontName, setFontName] = useState("Grandma's Recipe")
  const [plan, setPlan] = useState<Plan>('once')
  const [purchased, setPurchased] = useState(false)
  const [gapsFilled, setGapsFilled] = useState(false)

  const screen = history[history.length - 1]
  const fontStats = useMemo(() => stats(glyphs), [glyphs])

  const go = useCallback((next: ScreenId) => setHistory((h) => [...h, next]), [])
  const back = useCallback(
    () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)),
    [],
  )

  const setPurpose = useCallback((next: Purpose) => {
    setPurposeState(next)
    setModeOverride(null)
  }, [])

  const resolve = useCallback((ch: string, state: GlyphState) => {
    setGlyphs((all) => all.map((g) => (g.ch === ch ? { ...g, state } : g)))
  }, [])

  // The photo never leaves the device — it lives as an object URL for as long
  // as this session is open, and the old one is released when it's replaced.
  const setPhoto = useCallback((file: File | null) => {
    // A new page has not been looked at yet.
    setRead(null)
    setPhotoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return file ? URL.createObjectURL(file) : null
    })
  }, [])

  const resolveMark = useCallback((id: string, ch: string) => {
    setResolvedMarks((marks) => ({ ...marks, [id]: ch }))
  }, [])

  const fillGaps = useCallback(() => {
    setGlyphs((all) =>
      all.map((g) =>
        g.state === 'missing'
          ? {
              ...g,
              state: RESNAP_SHAKY.includes(g.ch) ? 'shaky' : 'clean',
              samples: 1,
              confidence: RESNAP_SHAKY.includes(g.ch) ? 0.64 : 0.93,
            }
          : g,
      ),
    )
    setGapsFilled(true)
  }, [])

  const reset = useCallback(() => {
    setHistory([initialScreen])
    setPurposeState('archive')
    setGlyphs(seedGlyphs())
    setModeOverride(null)
    focusGlyph(null)
    setResolvedMarks({})
    setPhoto(null)
    setFontName("Grandma's Recipe")
    setPlan('once')
    setPurchased(false)
    setGapsFilled(false)
  }, [initialScreen, setPhoto])

  const value: Store = {
    screen,
    go,
    back,
    canGoBack: history.length > 1,
    purpose,
    setPurpose,
    reviewMode: modeOverride ?? defaultMode(purpose, fontStats.shaky),
    setReviewMode: setModeOverride,
    focusedGlyph,
    focusGlyph,
    glyphs,
    stats: fontStats,
    resolve,
    fillGaps,
    gapsFilled,
    photo,
    setPhoto,
    read,
    setRead,
    resolvedMarks,
    resolveMark,
    fontName,
    setFontName,
    plan,
    setPlan,
    purchased,
    purchase: () => setPurchased(true),
    reset,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}
