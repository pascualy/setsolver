/**
 * React hook for Set card detection and solving.
 * 
 * Uses OpenCV for card detection (robust) + ML classifier for properties (accurate).
 */

import { useState, useCallback, useRef } from 'react'
import { CardClassifier } from '../analysis/inference'
import { detectCardsOpenCV, warpCardToImageData, isOpenCVLoaded } from '../analysis/opencv-detector'
import { findAllSets, indicesToCard } from '../game/solver'
import type { Card, ProcessedResult } from '../types'

// Check if we're in mock mode (for UI development without models)
const MOCK_MODE = import.meta.env.VITE_MOCK_ML === 'true'

export function useSetSolver() {
  const [isModelLoaded, setIsModelLoaded] = useState(MOCK_MODE)
  const [results, setResults] = useState<ProcessedResult | null>(null)
  
  const classifierRef = useRef<CardClassifier | null>(null)
  const isProcessingRef = useRef(false)
  
  /**
   * Load ML classifier (OpenCV loads separately via script tag)
   */
  const loadModels = useCallback(async () => {
    if (MOCK_MODE) {
      setIsModelLoaded(true)
      return
    }
    
    try {
      // Just load the classifier - OpenCV loads independently
      classifierRef.current = new CardClassifier()
      await classifierRef.current.load('/models/classifier.onnx')
      setIsModelLoaded(true)
    } catch (error) {
      console.error('Failed to load models:', error)
      throw error
    }
  }, [])
  
  /**
   * Process a single image/frame using OpenCV detection + ML classification
   */
  const processFrame = useCallback(async (imageData: ImageData): Promise<ProcessedResult | null> => {
    // Skip if already processing
    if (isProcessingRef.current) {
      return null
    }
    
    isProcessingRef.current = true
    const startTime = performance.now()
    
    try {
      let cards: Card[]
      
      if (MOCK_MODE || !classifierRef.current) {
        cards = generateMockCards()
      } else if (!isOpenCVLoaded()) {
        console.warn('OpenCV not loaded, using mock cards')
        cards = generateMockCards()
      } else {
        // Step 1: Detect cards using OpenCV (robust contour detection)
        const detections = detectCardsOpenCV(imageData)
        
        if (detections.length === 0) {
          cards = []
        } else {
          // Step 2: Classify each detected card using ML
          cards = []
          for (let idx = 0; idx < detections.length; idx++) {
            const detection = detections[idx]
            // Warp card to upright rectangle using corner points (handles rotation)
            const cardImageData = warpCardToImageData(imageData, detection.corners, 200, 300)
            if (!cardImageData) continue
            // Classify with ML model
            const classification = await classifierRef.current!.classify(cardImageData)
            const props = indicesToCard(
              classification.shape,
              classification.color,
              classification.number,
              classification.shading
            )
            
            cards.push({
              id: idx,
              bbox: detection.bbox,
              corners: detection.corners,
              confidence: detection.confidence,
              ...props,
            })
          }
        }
      }
      
      // Step 3: Find valid sets
      const sets = findAllSets(cards)
      
      const result: ProcessedResult = {
        cards,
        sets,
        timestamp: performance.now(),
        inferenceTime: performance.now() - startTime,
      }
      
      setResults(result)
      return result
      
    } catch (error) {
      console.error('Frame processing error:', error)
      return null
    } finally {
      isProcessingRef.current = false
    }
  }, [])
  
  const clearResults = useCallback(() => {
    setResults(null)
  }, [])
  
  return {
    isModelLoaded,
    loadModels,
    processFrame,
    results,
    clearResults,
  }
}

/**
 * Generate mock cards for UI development
 */
function generateMockCards(): Card[] {
  const shapes = ['diamond', 'oval', 'squiggle'] as const
  const colors = ['red', 'green', 'purple'] as const
  const numbers = [1, 2, 3] as const
  const shadings = ['solid', 'striped', 'empty'] as const
  
  const cards: Card[] = []
  const cardWidth = 150
  const cardHeight = 200
  const cols = 4
  const startX = 100
  const startY = 100
  const gap = 20
  
  for (let i = 0; i < 12; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    
    cards.push({
      id: i,
      bbox: [
        startX + col * (cardWidth + gap),
        startY + row * (cardHeight + gap),
        startX + col * (cardWidth + gap) + cardWidth,
        startY + row * (cardHeight + gap) + cardHeight,
      ],
      shape: shapes[Math.floor(Math.random() * 3)],
      color: colors[Math.floor(Math.random() * 3)],
      number: numbers[Math.floor(Math.random() * 3)],
      shading: shadings[Math.floor(Math.random() * 3)],
      confidence: 0.9 + Math.random() * 0.1,
    })
  }
  
  return cards
}
