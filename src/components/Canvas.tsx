import { forwardRef, useEffect, useRef } from 'react'
import type { ProcessedResult } from '../types'

interface CanvasProps {
  results: ProcessedResult | null
  highlightedSetIndex: number | null
  width?: number
  height?: number
  coverTop?: boolean
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ results, highlightedSetIndex, width = 1280, height = 720, coverTop = false }, ref) => {
    const animationRef = useRef<number | null>(null)
    const dashOffsetRef = useRef(0)
    
    useEffect(() => {
      if (!ref || !('current' in ref) || !ref.current) {
        return
      }
      if (!results) {
        return
      }
      
      const canvas = ref.current
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }
      
      // Animation variables
      let frameCount = 0
      
      // Scale factor based on canvas width relative to reference width
      // This ensures consistent line thickness regardless of image resolution
      const referenceWidth = 2560
      const scale = canvas.width / referenceWidth
      
      // Animation function for whimsical flowing effect
      const animate = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        frameCount++
        // Slower animation speed
        dashOffsetRef.current = (dashOffsetRef.current + 0.8 * scale) % (120 * scale)
        
        // Wobble amount that oscillates over time
        const wobbleTime = frameCount * 0.08
        const wobbleAmount = Math.sin(wobbleTime) * 2 * scale
        
        // Draw all card bounding boxes
        results.cards.forEach((card, idx) => {
          const corners = card.corners
          const [x1, y1, x2, y2] = card.bbox
          
          const isHighlighted = highlightedSetIndex !== null && 
            results.sets[highlightedSetIndex]?.indices.includes(idx)
          
          if (isHighlighted) {
            // Helper to add wobble to a point
            const wobblePoint = (x: number, y: number, offset: number) => ({
              x: x + Math.sin(wobbleTime + offset) * wobbleAmount,
              y: y + Math.cos(wobbleTime + offset * 1.3) * wobbleAmount
            })
            
            ctx.lineCap = 'square'
            ctx.lineJoin = 'miter'
            
            // First layer: red outline (SET theme)
            ctx.strokeStyle = '#DC2626'
            ctx.lineWidth = 48 * scale
            ctx.setLineDash([])
            
            if (corners && corners.length === 4) {
              const p0 = wobblePoint(corners[0].x, corners[0].y, 0)
              const p1 = wobblePoint(corners[1].x, corners[1].y, 1)
              const p2 = wobblePoint(corners[2].x, corners[2].y, 2)
              const p3 = wobblePoint(corners[3].x, corners[3].y, 3)
              ctx.beginPath()
              ctx.moveTo(p0.x, p0.y)
              ctx.lineTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.lineTo(p3.x, p3.y)
              ctx.closePath()
              ctx.stroke()
            } else {
              ctx.strokeRect(x1 + wobbleAmount, y1 + wobbleAmount, x2 - x1, y2 - y1)
            }
            
            // Second layer: animated yellow dashes (SET theme)
            ctx.strokeStyle = '#FACC15' // SET yellow
            ctx.lineWidth = 38 * scale
            ctx.setLineDash([55 * scale, 80 * scale])
            ctx.lineDashOffset = -dashOffsetRef.current
            
            if (corners && corners.length === 4) {
              const p0 = wobblePoint(corners[0].x, corners[0].y, 0)
              const p1 = wobblePoint(corners[1].x, corners[1].y, 1)
              const p2 = wobblePoint(corners[2].x, corners[2].y, 2)
              const p3 = wobblePoint(corners[3].x, corners[3].y, 3)
              ctx.beginPath()
              ctx.moveTo(p0.x, p0.y)
              ctx.lineTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.lineTo(p3.x, p3.y)
              ctx.closePath()
              ctx.stroke()
            } else {
              ctx.strokeRect(x1 + wobbleAmount, y1 + wobbleAmount, x2 - x1, y2 - y1)
            }
            
            ctx.setLineDash([])
            ctx.lineDashOffset = 0
          } else {
            // Draw visible box for all detected cards
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'
            ctx.lineWidth = 2 * scale
            ctx.setLineDash([])
            
            if (corners && corners.length === 4) {
              ctx.beginPath()
              ctx.moveTo(corners[0].x, corners[0].y)
              ctx.lineTo(corners[1].x, corners[1].y)
              ctx.lineTo(corners[2].x, corners[2].y)
              ctx.lineTo(corners[3].x, corners[3].y)
              ctx.closePath()
              ctx.stroke()
            } else {
              ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
            }
            
            // Draw card index
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)'
            ctx.font = `bold ${14 * scale}px sans-serif`
            const labelX = corners ? corners[0].x : x1
            const labelY = corners ? corners[0].y + 18 * scale : y1 + 18 * scale
            ctx.fillText(`#${idx + 1}`, labelX + 4 * scale, labelY)
          }
        })
        
        // Continue animation if there's a highlighted set
        if (highlightedSetIndex !== null) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }
      
      // Start animation
      animate()
      
      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
      
    }, [results, highlightedSetIndex, ref])

    return (
      <canvas
        ref={ref}
        width={width}
        height={height}
        className={`absolute inset-0 pointer-events-none ${coverTop ? 'w-full h-full' : 'max-w-full max-h-full m-auto'}`}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: coverTop ? 'cover' : 'contain',
          objectPosition: coverTop ? 'top' : 'center'
        }}
      />
    )
  }
)

Canvas.displayName = 'Canvas'
