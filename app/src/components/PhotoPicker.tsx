import { useRef, type ChangeEvent, type ReactNode } from 'react'

/**
 * Two ways in: the camera, or a photo you already have.
 *
 * `capture="environment"` hands off to the phone's own camera app, which is
 * both more reliable than a live viewfinder inside an embedded page and the
 * behaviour people expect from a shutter button. The second input has no
 * capture attribute, so it opens the library instead.
 */
export function usePhotoPicker(onPick: (file: File) => void): {
  inputs: ReactNode
  openCamera: () => void
  openLibrary: () => void
} {
  const camera = useRef<HTMLInputElement>(null)
  const library = useRef<HTMLInputElement>(null)

  const handle = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onPick(file)
    // Let the same file be chosen twice in a row.
    event.target.value = ''
  }

  const inputs = (
    <>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handle}
        hidden
        aria-hidden
        tabIndex={-1}
      />
      <input
        ref={library}
        type="file"
        accept="image/*"
        onChange={handle}
        hidden
        aria-hidden
        tabIndex={-1}
      />
    </>
  )

  return {
    inputs,
    openCamera: () => camera.current?.click(),
    openLibrary: () => library.current?.click(),
  }
}
