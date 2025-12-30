import { forwardRef, useEffect, useState } from 'react'

interface CameraProps {
  width?: number
  height?: number
  onReady?: () => void
  onDimensionsChange?: (dims: { width: number; height: number }) => void
}

export const Camera = forwardRef<HTMLVideoElement, CameraProps>(
  ({ width = 1280, height = 720, onReady, onDimensionsChange }, ref) => {
    const [error, setError] = useState<string | null>(null)
    const [hasPermission, setHasPermission] = useState(false)

    useEffect(() => {
      async function initCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: width },
              height: { ideal: height },
              facingMode: 'environment', // Back camera on mobile
            },
          })

          if (ref && 'current' in ref && ref.current) {
            ref.current.srcObject = stream
            setHasPermission(true)
          }
        } catch (err) {
          console.error('Camera error:', err)
          setError('Unable to access camera. Please grant camera permissions.')
        }
      }

      initCamera()

      // Cleanup
      return () => {
        if (ref && 'current' in ref && ref.current?.srcObject) {
          const tracks = (ref.current.srcObject as MediaStream).getTracks()
          tracks.forEach(track => track.stop())
        }
      }
    }, [ref, width, height])

    if (error) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center p-6">
            <p className="text-set-yellow text-lg font-bold mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-set-yellow text-black font-bold rounded-full hover:bg-yellow-300 transition-colors shadow-lg border-2 border-black"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return (
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover object-top"
        style={{ display: hasPermission ? 'block' : 'none' }}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget
          onDimensionsChange?.({ width: video.videoWidth, height: video.videoHeight })
          onReady?.()
        }}
      />
    )
  }
)

Camera.displayName = 'Camera'
