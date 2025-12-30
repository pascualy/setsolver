// Card properties
export type Shape = 'diamond' | 'oval' | 'squiggle'
export type Color = 'red' | 'green' | 'purple'
export type Number = 1 | 2 | 3
export type Shading = 'solid' | 'striped' | 'empty'

// A detected card with its properties and location
export interface Card {
  id: number
  bbox: [number, number, number, number] // [x1, y1, x2, y2] axis-aligned bounding box
  corners?: { x: number; y: number }[] // [topLeft, topRight, bottomRight, bottomLeft] for rotated cards
  shape: Shape
  color: Color
  number: Number
  shading: Shading
  confidence: number
}

// A valid set of three cards
export interface SetResult {
  cards: [Card, Card, Card]
  indices: [number, number, number]
}

// Result of processing a single frame
export interface ProcessedResult {
  cards: Card[]
  sets: SetResult[]
  timestamp: number
  inferenceTime: number
}

// Classification result from classifier model
export interface ClassificationResult {
  shape: number
  color: number
  number: number
  shading: number
  probabilities: {
    shape: number[]
    color: number[]
    number: number[]
    shading: number[]
  }
}
