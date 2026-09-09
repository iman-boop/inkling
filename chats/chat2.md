# Remaining screens and next steps

_Started 2026-09-09 14:48 UTC_

---

## User

Continuing from "Handwriting to font app".

## Assistant

We've been building a complete iOS app for turning handwritten notes into usable fonts, starting with UI mockups and evolving through colour palettes and the full happy-path flow.

**Decisions made:**
- iOS phone as the platform (desktop companion deferred).
- Three glyph-review modes (in-place on photo, specimen sheet, one-at-a-time) as one switchable screen, not rivals.
- Acid Bloom palette locked: near-black ground, acid lime for "needs you", violet for machine confidence, warm white for artifacts.
- Pricing at export: $8 one-off, $4/mo Keeper, $149 studio licence with seats.
- Onboarding asks "what are you turning into a font?" (archive / brand / personal) to set review defaults.

**Current state:**
Six turns complete. The app now spans onboarding → camera + capture guidance → auto glyph detection & review (with three modes) → fix individual letters → fill-the-gaps loop (re-snap for missing glyphs) → paywall → export. All screens themed to Acid Bloom. The missing-letters prompt uses lime ink and outline for legibility, and the re-snap flow flags newly shaky letters rather than declaring victory.

**Open next steps:**
- Bad-photo / no-letters / blurry / non-Latin script error states.
- Desktop companion for kerning, variants, licence seats (brand-kit users).
- Motion spec for the two signature moments: letters lifting off the page, typing appearing in your own hand.

**Files:**
Handwriting Font App.dc.html (main), Flow Screens.dc.html, Organic (design system).

## User

let's continue with the remaining screens and next steps for this

## Assistant

_[tool: grep]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Turn 7 is in: the error and edge states, grouped by where they fire — 7a advisory glare/blur chips in the camera (shutter never locks), 7b the three post-read dead ends (no handwriting, printed type, unsupported script), 7c the partial read framed as a decision with a *partial* badge that follows the font to export. 7c also carries a written map of which state belongs where, including four cases I didn't draw.

Next, pick one: motion spec for the two signature moments, the desktop companion, or the library screen.

## User

let's do the motion spec

## Assistant

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Turn 8 added at the top — both moments are live and looping in the frames.

- **8a Lift:** sheen scan → pluck (13px rise, 1.14 scale, 340ms) → arc travel → springy landing, then confidence colour arrives *after* the glyph. The gap left on the page stays empty; one haptic on first landing; tap to skip.
- **8b Write-on:** 180ms fade-up per glyph with ink-blur burning off, 55ms cadence with pauses at spaces and punctuation, alternates cycling on repeat letters, demo dies at the first real keystroke.
- Plus the standard 120/160/220ms scale and reduced-motion fallbacks (the frames honour the setting live).

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Both fixed: word spaces in 8b are now explicit spacer elements (caret sits on the last glyph again), and the glyph bed keeps a persistent empty socket under each cell, with the lime confidence outline fading in on its own delay.

