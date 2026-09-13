/**
 * opentype.js ships no types. This is the slice of its API the font builder
 * uses — enough for the compiler to hold us to it, not a full definition.
 */
declare module 'opentype.js' {
  export class Path {
    moveTo(x: number, y: number): void
    lineTo(x: number, y: number): void
    quadraticCurveTo(x1: number, y1: number, x: number, y: number): void
    close(): void
  }

  export class Glyph {
    constructor(options: {
      name: string
      unicode?: number
      advanceWidth: number
      path: Path
    })
  }

  export class Font {
    constructor(options: {
      familyName: string
      styleName: string
      unitsPerEm: number
      ascender: number
      descender: number
      glyphs: Glyph[]
    })
    toArrayBuffer(): ArrayBuffer
  }
}
