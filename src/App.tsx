import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera } from './components/Camera'
import { Canvas } from './components/Canvas'
import { SetLogo } from './components/SetLogo'
import { useSetSolver } from './hooks/useSetSolver'
import { useStore } from './store'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraContainerRef = useRef<HTMLDivElement>(null)
  
  const { isModelLoaded, loadModels, processFrame, results, clearResults } = useSetSolver()
  const { highlightedSetIndex, setHighlightedSetIndex } = useStore()
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 })
  const [isCameraReady, setIsCameraReady] = useState(false)
  
  // Track if sets have been revealed (null = not revealed yet, number = currently showing that set)
  const [revealedSetIndex, setRevealedSetIndex] = useState<number | null>(null)
  
  // Reset revealed state when results change
  useEffect(() => {
    setRevealedSetIndex(null)
    setHighlightedSetIndex(null)
  }, [results, setHighlightedSetIndex])
  
  // Handle set rotation button click
  const handleSetRotation = useCallback(() => {
    if (!results || results.sets.length === 0) return
    
    if (revealedSetIndex === null) {
      // First click: reveal set 1
      setRevealedSetIndex(0)
      setHighlightedSetIndex(0)
    } else {
      // Cycle to next set
      const nextIndex = (revealedSetIndex + 1) % results.sets.length
      setRevealedSetIndex(nextIndex)
      setHighlightedSetIndex(nextIndex)
    }
  }, [results, revealedSetIndex, setHighlightedSetIndex])
  
  // Load models on mount
  useEffect(() => {
    loadModels().catch(err => {
      console.error('Failed to load models:', err)
    })
  }, [loadModels])
  
  // Capture image from camera and process it
  const handleCapture = useCallback(async () => {
    if (!isModelLoaded || !videoRef.current || !cameraContainerRef.current || isProcessing) return
    
    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) return
    
    setIsProcessing(true)
    
    // Get the visible container dimensions
    const container = cameraContainerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    // Calculate the scale factor (video is scaled to fit width)
    const scale = video.videoWidth / containerWidth
    
    // Calculate how much of the video height is visible
    const visibleVideoHeight = Math.min(containerHeight * scale, video.videoHeight)
    
    // Create canvas with cropped dimensions
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = Math.round(visibleVideoHeight)
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Draw only the visible portion (from top)
      ctx.drawImage(
        video,
        0, 0, video.videoWidth, visibleVideoHeight,  // source rect
        0, 0, video.videoWidth, visibleVideoHeight   // dest rect
      )
      setCapturedImage(canvas.toDataURL('image/jpeg'))
      setVideoDimensions({ width: video.videoWidth, height: Math.round(visibleVideoHeight) })
      const imageData = ctx.getImageData(0, 0, video.videoWidth, Math.round(visibleVideoHeight))
      await processFrame(imageData)
    }
    
    setIsProcessing(false)
  }, [isModelLoaded, processFrame, isProcessing])
  
  // Handle file upload
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !isModelLoaded) return
    
    setIsProcessing(true)
    
    try {
      const bitmap = await createImageBitmap(file)
      setCapturedImage(URL.createObjectURL(file))
      setVideoDimensions({ width: bitmap.width, height: bitmap.height })
      
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0)
        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
        await processFrame(imageData)
      }
      bitmap.close()
    } catch {
      const img = new Image()
      img.onload = async () => {
        setCapturedImage(img.src)
        setVideoDimensions({ width: img.width, height: img.height })
        
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          await processFrame(imageData)
        }
        setIsProcessing(false)
      }
      img.src = URL.createObjectURL(file)
      return
    }
    
    setIsProcessing(false)
  }, [isModelLoaded, processFrame])
  
  // Clear captured image and results
  const handleClear = useCallback(() => {
    setCapturedImage(null)
    setHighlightedSetIndex(null)
    setRevealedSetIndex(null)
    clearResults()
  }, [setHighlightedSetIndex, clearResults])

  const canCapture = isModelLoaded && isCameraReady && !isProcessing && !capturedImage

  return (
    <div className="fixed inset-0 bg-set-red flex flex-col">
      {/* Main camera/image view */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {capturedImage ? (
            <div 
              className="relative h-full"
              style={{ aspectRatio: `${videoDimensions.width} / ${videoDimensions.height}`, maxWidth: '100%', maxHeight: '100%' }}
            >
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="absolute inset-0 w-full h-full object-contain"
              />
              <Canvas 
                ref={canvasRef} 
                results={results}
                highlightedSetIndex={highlightedSetIndex}
                width={videoDimensions.width}
                height={videoDimensions.height}
              />
            </div>
          ) : (
            <div 
              ref={cameraContainerRef}
              className="absolute inset-0 overflow-hidden"
            >
              <Camera 
                ref={videoRef} 
                onReady={() => setIsCameraReady(true)}
                onDimensionsChange={setVideoDimensions}
              />
              <Canvas 
                ref={canvasRef} 
                results={results}
                highlightedSetIndex={highlightedSetIndex}
                width={videoDimensions.width}
                height={videoDimensions.height}
                coverTop
              />
            </div>
          )}
        </div>
        
        {/* Loading overlay */}
        {!isModelLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-set-red/90">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-set-yellow border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg font-bold tracking-wide">Loading SET Solver...</p>
            </div>
          </div>
        )}
        
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-set-yellow border-t-transparent"></div>
          </div>
        )}
        
        {/* Top bar - Set branding */}
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start pointer-events-none">
          <div className="bg-set-yellow rounded-lg shadow-lg px-2 py-1">
            <SetLogo className="h-10 w-auto" />
          </div>
          {results && (
            <div className="bg-set-yellow text-black text-sm font-bold px-4 py-2 rounded-full shadow-lg">
              {results.cards.length} cards · {results.sets.length} sets
            </div>
          )}
        </div>
        
        
        {/* Selected set info - hidden for now
        {highlightedSetIndex !== null && results?.sets[highlightedSetIndex] && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-set-yellow rounded-2xl px-5 py-3 shadow-xl border-2 border-black">
            <div className="text-black text-sm font-bold text-center space-y-1">
              {results.sets[highlightedSetIndex].cards.map((card, i) => (
                <div key={i}>
                  {card.number} {card.shading} {card.color} {card.shape}
                </div>
              ))}
            </div>
          </div>
        )}
        */}
      </div>
      
      {/* Bottom control bar */}
      <div className="h-28 bg-set-red flex items-center justify-center gap-8 px-6 safe-area-bottom border-t-8 border-set-yellow">
        {/* Gallery/Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!isModelLoaded || isProcessing}
          className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-set-red hover:bg-set-yellow hover:text-black transition-all shadow-lg disabled:opacity-40 border-2 border-black"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {/* Main capture/back button */}
        {capturedImage ? (
          <button
            onClick={handleClear}
            className="w-20 h-20 rounded-full bg-white border-4 border-black flex items-center justify-center hover:bg-set-yellow transition-all active:scale-95 shadow-xl"
          >
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleCapture}
            disabled={!canCapture}
            className={`
              w-20 h-20 rounded-full border-4 border-black flex items-center justify-center
              transition-all active:scale-95 shadow-xl
              ${canCapture 
                ? 'bg-set-yellow hover:bg-yellow-300' 
                : 'bg-white/50 border-white/50'
              }
            `}
          >
            {!isModelLoaded ? (
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-set-red border-t-transparent"></div>
            ) : !isCameraReady ? (
              <div className="w-8 h-8 rounded-full bg-gray-400"></div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-set-red"></div>
            )}
          </button>
        )}
        
        {/* Set rotation button */}
        <button
          onClick={handleSetRotation}
          disabled={!results || results.sets.length === 0}
          className={`
            relative w-14 h-14 rounded-full border-2 border-black flex items-center justify-center shadow-lg
            transition-all active:scale-95
            ${results && results.sets.length > 0 
              ? revealedSetIndex !== null
                ? 'bg-set-yellow text-black hover:bg-yellow-300'
                : 'bg-set-yellow text-black animate-set-found'
              : 'bg-white/50 text-gray-400'
            }
          `}
        >
          {results && results.sets.length > 0 ? (
            revealedSetIndex !== null ? (
              <span className="text-sm font-black">
                {revealedSetIndex + 1}/{results.sets.length}
              </span>
            ) : (
              <span className="text-sm font-black">
                {results.sets.length}
              </span>
            )
          ) : (
            <span className="text-sm font-bold">—</span>
          )}
        </button>
      </div>
    </div>
  )
}

export default App
