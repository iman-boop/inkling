import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The live viewfinder.
 *
 * `getUserMedia` needs a secure origin and, in an embedded page, a camera
 * permission the embedder has to grant — which is why the shutter originally
 * handed off to the OS camera instead. On the app's own HTTPS origin the real
 * feed is available, so the viewfinder shows what the lens sees and the
 * shutter grabs a frame from it. Everything falls back to the file picker when
 * it can't: no camera, no permission, no secure origin.
 */
export type CameraState = 'idle' | 'starting' | 'live' | 'denied' | 'unsupported'

export function useCamera(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<CameraState>('idle')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      return
    }
    setState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // The back camera, where the page presumably is.
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setState('live')
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported')
    }
  }, [])

  /** Freeze the current frame as a file, the same shape a picked photo has. */
  const capture = useCallback(async (): Promise<File | null> => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return null
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92),
    )
    if (!blob) return null
    return new File([blob], 'page.jpg', { type: 'image/jpeg' })
  }, [])

  useEffect(() => {
    if (enabled) void start()
    // The camera light must go out when this screen does.
    return stop
  }, [enabled, start, stop])

  return { videoRef, state, start, capture, stop }
}
